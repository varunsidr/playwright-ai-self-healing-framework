'use strict';

const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const core = require('./core');
const runtime = require('./runtime');
const ci = require('./ci');
const deployment = require('./deployment');
const { validateSourceRun, protocolEvents } = require('./observation-github');
const { summarizeEvents } = require('./protocol');
const { report } = require('./observation');

const repository = 'varunsidr/playwright-ai-self-healing-framework';
const root = path.resolve(__dirname, '../..');
const read = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));
const write = (file, value) => fs.writeFileSync(file, JSON.stringify(value, null, 2) + '\n');

function optionsFor(args) {
  const options = {};
  for (let index = 0; index < args.length; index++) {
    const key = args[index];
    if (!['--input', '--website', '--output'].includes(key) || options[key.slice(2)])
      throw new Error('Expected one each of --input, --website and --output');
    const value = args[++index];
    if (!value || value.startsWith('--')) throw new Error('Missing value for ' + key);
    options[key.slice(2)] = path.resolve(value);
  }
  if (!options.input || !options.website || !options.output)
    throw new Error(
      'Supply --input <downloaded evidence> --website <Zeouf checkout> --output <new directory>',
    );
  const relative = path.relative(options.input, options.output);
  if (
    !relative ||
    (!relative.startsWith('..' + path.sep) && relative !== '..' && !path.isAbsolute(relative))
  )
    throw new Error('Output must be outside the input evidence directory');
  return options;
}

function copyEvidence(source, target) {
  if (fs.lstatSync(source).isSymbolicLink()) throw new Error('Evidence symlinks are not accepted');
  if (fs.statSync(source).isDirectory()) {
    fs.mkdirSync(target, { recursive: true });
    for (const name of fs.readdirSync(source))
      copyEvidence(path.join(source, name), path.join(target, name));
  } else {
    fs.copyFileSync(source, target, fs.constants.COPYFILE_EXCL);
  }
}

async function getGithub(endpoint) {
  const response = await fetch('https://api.github.com/repos/' + repository + endpoint, {
    headers: {
      Accept: 'application/vnd.github+json',
      'User-Agent': 'zeouf-local-observation',
      ...(process.env.GITHUB_TOKEN ? { Authorization: 'Bearer ' + process.env.GITHUB_TOKEN } : {}),
    },
    signal: AbortSignal.timeout(20000),
  });
  if (!response.ok) throw new Error('Trusted source-run lookup failed (' + response.status + ')');
  return response.json();
}

async function validateInputs(input, framework, get = getGithub) {
  const source = read(path.join(input, 'source-run.json'));
  if (!Number.isSafeInteger(source.runId) || source.runId <= 0)
    throw new Error('Invalid source run ID');
  const revision = runtime.command('git', ['rev-parse', 'HEAD'], framework);
  if (runtime.command('git', ['status', '--porcelain'], framework))
    throw new Error('Use a clean framework checkout at the tested revision');
  const metadata = await get('');
  const run = await get('/actions/runs/' + source.runId);
  const trusted = validateSourceRun(run, repository, metadata.default_branch, revision);
  assert.deepEqual(source, trusted, 'Downloaded source-run identity differs from GitHub');
  const bytes = fs.readFileSync(path.join(input, 'original/website-deployment.json'));
  const record = JSON.parse(bytes);
  const original = read(path.join(input, 'original/ecommerce-read-only-results.json'));
  deployment.validateBinding(original.config?.metadata || {}, record, bytes);
  return { source: trusted, record };
}

async function runObservation(options, services = {}) {
  const stage = services.stage || ci.main;
  const model = services.model || runtime.codex;
  const validate = services.validate || validateInputs;
  const verifyDeployment = services.verifyDeployment || deployment.verifyRecord;
  const probe =
    services.probe ||
    ((url) =>
      fetch(url + '/api/health', {
        redirect: 'manual',
        signal: AbortSignal.timeout(15000),
      }));
  if (fs.existsSync(options.output))
    throw new Error('Use a new output directory; preserve original evidence');
  fs.mkdirSync(options.output, { recursive: true });
  const directory = options.output;
  const execution = {
    schemaVersion: 1,
    mode: 'local-chatgpt',
    authentication: 'chatgpt',
    jobs: [],
    warnings: [],
  };
  const observation = {
    name: 'Observe failure',
    status: 'in_progress',
    started_at: new Date().toISOString(),
    steps: [],
  };
  execution.jobs.push(observation);
  const measured = async (job, name, action) => {
    const step = { name, started_at: new Date().toISOString() };
    job.steps.push(step);
    try {
      const result = await action();
      step.conclusion = 'success';
      return result;
    } catch (error) {
      step.conclusion = 'failure';
      throw error;
    } finally {
      step.completed_at = new Date().toISOString();
    }
  };
  let failure;
  try {
    const { source, record } = await measured(observation, 'Validate trusted pinned inputs', () =>
      validate(options.input, root),
    );
    write(path.join(directory, 'source-run.json'), source);
    copyEvidence(path.join(options.input, 'original'), path.join(directory, 'original'));
    await verifyDeployment(record);
    const health = await probe(record.url);
    if (!health.ok)
      throw new Error(
        'Pinned deployment unavailable (' +
          health.status +
          '); no model called and no URL fallback',
      );
    await measured(observation, 'Prepare frozen evidence', () =>
      stage([
        'prepare',
        directory,
        options.website,
        path.join(directory, 'original/ecommerce-read-only-results.json'),
        path.join(directory, 'original/website-deployment.json'),
      ]),
    );
    let state = read(path.join(directory, 'state.json'));
    if (state.status === 'prepared') {
      await measured(observation, 'Diagnose recorded failure', () =>
        model(
          state.framework,
          fs.readFileSync(path.join(directory, 'diagnosis-prompt.txt'), 'utf8'),
          path.join(directory, 'diagnosis.schema.json'),
          path.join(directory, 'diagnosis.json'),
          path.join(directory, 'diagnosis-agent.jsonl'),
          true,
          { chatgpt: true },
        ),
      );
      await measured(observation, 'Ground diagnosis and route responsibility', () =>
        stage(['route', directory]),
      );
      state = read(path.join(directory, 'state.json'));
      if (['framework', 'website'].includes(state.role)) {
        await measured(observation, 'Propose isolated repair', () =>
          model(
            state[state.role],
            fs.readFileSync(path.join(directory, 'repair-prompt.txt'), 'utf8'),
            path.join(root, 'scripts/ecommerce-repair/repair-result.schema.json'),
            path.join(directory, 'repair.json'),
            path.join(directory, 'repair-agent.jsonl'),
            false,
            { chatgpt: true },
          ),
        );
        await measured(observation, 'Capture guarded proposal', () =>
          stage(['capture', directory]),
        );
        observation.status = 'completed';
        observation.conclusion = 'success';
        observation.completed_at = new Date().toISOString();
        const verification = {
          name: 'Verify isolated proposal',
          status: 'in_progress',
          started_at: new Date().toISOString(),
          steps: [],
        };
        execution.jobs.push(verification);
        try {
          await measured(verification, 'Reproduce baseline and verify unchanged regressions', () =>
            stage(['verify', directory, options.website]),
          );
          verification.conclusion = 'success';
        } catch (error) {
          verification.conclusion = 'failure';
          throw error;
        } finally {
          verification.status = 'completed';
          verification.completed_at = new Date().toISOString();
        }
      }
    }
    if (observation.status !== 'completed') observation.conclusion = 'success';
  } catch (error) {
    failure = error;
    if (observation.status !== 'completed') observation.conclusion = 'failure';
    const file = path.join(directory, 'state.json');
    const state = fs.existsSync(file) ? read(file) : { status: 'blocked' };
    state.blockers = [...(state.blockers || []), error.message];
    write(file, state);
  } finally {
    observation.status = 'completed';
    observation.completed_at ||= new Date().toISOString();
    const events = ['diagnosis-agent.jsonl', 'repair-agent.jsonl'].flatMap((name) => {
      const file = path.join(directory, name);
      return fs.existsSync(file) ? protocolEvents(fs.readFileSync(file, 'utf8')) : [];
    });
    const encoded = events.map((event) => JSON.stringify(event)).join('\n');
    fs.writeFileSync(path.join(directory, 'agent-events.jsonl'), encoded + '\n');
    execution.metrics = summarizeEvents(encoded, null);
    const attempted = observation.steps.filter((step) =>
      ['Diagnose recorded failure', 'Propose isolated repair'].includes(step.name),
    );
    execution.metrics.complete =
      attempted.length > 0 &&
      attempted.every((step) => step.conclusion === 'success') &&
      events.filter(
        (event) =>
          event.type === 'turn.completed' &&
          Number.isFinite(event.usage?.input_tokens) &&
          Number.isFinite(event.usage?.output_tokens),
      ).length >= attempted.length;
    if (attempted.length && !execution.metrics.complete)
      execution.warnings.push('Complete usage is not established across local agent stages');
    write(path.join(directory, 'execution.json'), execution);
    report(directory, null);
  }
  if (failure) throw failure;
  return read(path.join(directory, 'observation.json'));
}

if (require.main === module)
  runObservation(optionsFor(process.argv.slice(2)))
    .then((record) => {
      console.log('Local subscription observation: ' + record.status);
      if (!['verified-candidate-for-review', 'no-mapped-browser-failures'].includes(record.status))
        process.exitCode = 1;
    })
    .catch((error) => {
      console.error(error.message);
      process.exitCode = 1;
    });

module.exports = { optionsFor, copyEvidence, validateInputs, runObservation };

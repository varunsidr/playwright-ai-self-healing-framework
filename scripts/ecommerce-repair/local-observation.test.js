'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { optionsFor, runObservation, validateInputs } = require('./local-observation');
const { hash } = require('./core');

const write = (directory, file, value) =>
  fs.writeFileSync(path.join(directory, file), JSON.stringify(value));
const read = (directory, file) => JSON.parse(fs.readFileSync(path.join(directory, file)));
function fixture(t) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'zeouf-local-observation-'));
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  const input = path.join(directory, 'input'),
    output = path.join(directory, 'output');
  fs.mkdirSync(path.join(input, 'original'), { recursive: true });
  write(input, 'original/ecommerce-read-only-results.json', { retained: 'original failure' });
  return { input, output, website: path.join(directory, 'website') };
}

test('local handoff rejects ambiguous arguments and reused evidence destinations', async (t) => {
  const options = fixture(t);
  assert.throws(() => optionsFor([]), /Supply/);
  assert.throws(
    () => optionsFor(['--input', options.input, '--input', options.input]),
    /Expected one each/,
  );
  assert.throws(
    () =>
      optionsFor([
        '--input',
        options.input,
        '--website',
        options.website,
        '--output',
        path.join(options.input, 'nested'),
      ]),
    /outside/,
  );
  await assert.rejects(runObservation({ ...options, output: options.input }), /new output/);
});

test('an inaccessible immutable deployment retains a blocked report without model calls', async (t) => {
  const options = fixture(t);
  const before = hash(
    fs.readFileSync(path.join(options.input, 'original/ecommerce-read-only-results.json')),
  );
  let calls = 0;
  await assert.rejects(
    runObservation(options, {
      validate: async () => ({ source: { runId: 1 }, record: { url: 'https://example.invalid' } }),
      verifyDeployment: async () => {},
      probe: async () => ({ ok: false, status: 302 }),
      model: async () => {
        calls++;
      },
    }),
    /Pinned deployment unavailable/,
  );
  assert.equal(calls, 0);
  const record = read(options.output, 'observation.json');
  assert.equal(record.status, 'blocked');
  assert.equal(record.executionLocation, 'local');
  assert.equal(record.authentication, 'chatgpt');
  assert.equal(record.measurements.tokenUsage, null);
  assert.equal(
    before,
    hash(fs.readFileSync(path.join(options.input, 'original/ecommerce-read-only-results.json'))),
  );
});

test('environment routing invokes only ChatGPT diagnosis and retains protocol measurements', async (t) => {
  const options = fixture(t);
  const stages = [],
    models = [];
  const state = { status: 'prepared', framework: options.input };
  const result = await runObservation(options, {
    validate: async () => ({ source: { runId: 1 }, record: { url: 'https://example.invalid' } }),
    verifyDeployment: async () => {},
    probe: async () => ({ ok: true }),
    stage: async ([mode, directory]) => {
      stages.push(mode);
      if (mode === 'prepare') {
        write(directory, 'state.json', state);
        fs.writeFileSync(path.join(directory, 'diagnosis-prompt.txt'), 'Supplied evidence');
        write(directory, 'diagnosis.schema.json', {});
      } else if (mode === 'route')
        write(directory, 'state.json', { ...state, role: 'environment' });
      else assert.fail('Environment failures must not propose or verify patches');
    },
    model: async (...args) => {
      models.push(args);
      fs.writeFileSync(
        args[4],
        JSON.stringify({ type: 'turn.completed', usage: { input_tokens: 15, output_tokens: 3 } }) +
          '\n',
      );
    },
  });
  assert.deepEqual(stages, ['prepare', 'route']);
  assert.equal(models.length, 1);
  assert.equal(models[0][5], true);
  assert.deepEqual(models[0][6], { chatgpt: true });
  assert.equal(result.proposal.attempted, false);
  assert.equal(result.verification.passed, false);
  assert.equal(result.measurements.usageComplete, true);
  assert.equal(result.measurements.tokenUsage.input_tokens, 15);
});

test('a failed local agent remains failed and cannot report complete or zero usage', async (t) => {
  const options = fixture(t);
  await assert.rejects(
    runObservation(options, {
      validate: async () => ({ source: { runId: 1 }, record: { url: 'https://example.invalid' } }),
      verifyDeployment: async () => {},
      probe: async () => ({ ok: true }),
      stage: async ([, directory]) => {
        write(directory, 'state.json', { status: 'prepared', framework: options.input });
        fs.writeFileSync(path.join(directory, 'diagnosis-prompt.txt'), 'Supplied evidence');
        write(directory, 'diagnosis.schema.json', {});
      },
      model: async () => {
        throw new Error('Subscription allowance unavailable');
      },
    }),
    /Subscription allowance unavailable/,
  );
  const record = read(options.output, 'observation.json');
  assert.equal(record.status, 'blocked');
  assert.equal(record.measurements.usageComplete, false);
  assert.equal(record.measurements.tokenUsage, null);
});

test('repair proposals are captured before model-free verification and verification failures remain failures', async (t) => {
  const options = fixture(t),
    stages = [],
    models = [];
  const state = { status: 'prepared', framework: options.input, role: 'framework' };
  await assert.rejects(
    runObservation(options, {
      validate: async () => ({ source: { runId: 1 }, record: { url: 'https://example.invalid' } }),
      verifyDeployment: async () => {},
      probe: async () => ({ ok: true }),
      stage: async ([mode, directory, website]) => {
        stages.push(mode);
        if (mode === 'prepare') {
          write(directory, 'state.json', state);
          fs.writeFileSync(path.join(directory, 'diagnosis-prompt.txt'), 'Supplied evidence');
          write(directory, 'diagnosis.schema.json', {});
        } else if (mode === 'route')
          fs.writeFileSync(path.join(directory, 'repair-prompt.txt'), 'Guarded repair');
        else if (mode === 'capture')
          fs.writeFileSync(path.join(directory, 'candidate.patch'), 'captured proposal');
        else if (mode === 'verify') {
          assert.equal(website, options.website);
          assert.equal(models.length, 2);
          throw new Error('Original failure did not reproduce');
        }
      },
      model: async (...args) => {
        models.push(args);
        fs.writeFileSync(
          args[4],
          JSON.stringify({
            type: 'turn.completed',
            usage: { input_tokens: 15, output_tokens: 3 },
          }) + '\n',
        );
      },
    }),
    /Original failure did not reproduce/,
  );
  assert.deepEqual(stages, ['prepare', 'route', 'capture', 'verify']);
  assert.deepEqual(
    models.map((args) => args[5]),
    [true, false],
  );
  assert.ok(models.every((args) => args[6].chatgpt === true));
  const record = read(options.output, 'observation.json');
  assert.equal(record.verification.passed, false);
  assert.equal(record.proposal.attempted, true);
  assert.ok(record.blockers.some((value) => value.includes('did not reproduce')));
  const execution = read(options.output, 'execution.json');
  assert.equal(execution.jobs[0].conclusion, 'success');
  assert.equal(execution.jobs[1].conclusion, 'failure');
});

test('local trust checks reject changed source-run identities even when the run exists', async (t) => {
  const options = fixture(t),
    framework = path.join(options.input, 'framework');
  fs.mkdirSync(framework);
  execFileSync('git', ['init', '--quiet', framework]);
  execFileSync('git', [
    '-C',
    framework,
    '-c',
    'user.name=Test',
    '-c',
    'user.email=test@example.invalid',
    'commit',
    '--allow-empty',
    '--quiet',
    '-m',
    'test',
  ]);
  const revision = execFileSync('git', ['-C', framework, 'rev-parse', 'HEAD'], {
    encoding: 'utf8',
  }).trim();
  write(options.input, 'source-run.json', {
    runId: 1,
    frameworkRevision: revision,
    branch: 'forged',
  });
  await assert.rejects(
    validateInputs(options.input, framework, async (endpoint) =>
      endpoint === ''
        ? { default_branch: 'main' }
        : {
            id: 1,
            name: 'Playwright Tests',
            path: '.github/workflows/playwright.yml',
            status: 'completed',
            conclusion: 'failure',
            event: 'workflow_dispatch',
            head_branch: 'main',
            head_sha: revision,
            run_attempt: 1,
            head_repository: { full_name: 'varunsidr/playwright-ai-self-healing-framework' },
          },
    ),
    /differs from GitHub/,
  );
});

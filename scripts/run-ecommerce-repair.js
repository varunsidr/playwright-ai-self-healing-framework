'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const core = require('./ecommerce-repair/core');
const runtime = require('./ecommerce-repair/runtime');

const root = path.resolve(__dirname, '..');
const writeJson = (file, value) => fs.writeFileSync(file, JSON.stringify(value, null, 2) + '\n');

function argumentsFor(args) {
  const options = { reports: [], mode: 'prepare' };
  for (let index = 0; index < args.length; index++) {
    const argument = args[index];
    if (['--prepare', '--diagnose', '--run'].includes(argument)) options.mode = argument.slice(2);
    else if (
      [
        '--website',
        '--report',
        '--output',
        '--diagnosis',
        '--candidate-patch',
        '--repair-result',
      ].includes(argument)
    ) {
      const value = args[++index];
      if (!value || value.startsWith('--')) throw new Error(`Missing value for ${argument}`);
      if (argument === '--report') options.reports.push(path.resolve(value));
      else options[argument.slice(2)] = path.resolve(value);
    } else throw new Error(`Unknown option ${argument}`);
  }
  if (!options.reports.length)
    throw new Error('Supply --report with a recorded Playwright JSON report');
  if (options.mode !== 'prepare' && !options.website)
    throw new Error('Supply --website with the local Zeouf Git checkout');
  if (Boolean(options['candidate-patch']) !== Boolean(options['repair-result']))
    throw new Error(
      'An external agent handoff requires both --candidate-patch and --repair-result',
    );
  return options;
}

async function main(args = process.argv.slice(2)) {
  const options = argumentsFor(args);
  const directory =
    options.output ||
    path.join(
      root,
      'test-results/ecommerce-repair-loop',
      `${new Date().toISOString().replace(/[:.]/g, '-')}-${randomUUID().slice(0, 8)}`,
    );
  if (fs.existsSync(directory))
    throw new Error('Use a new output directory; original failure evidence must be preserved');
  fs.mkdirSync(directory, { recursive: true });
  const state = {
    schemaVersion: 1,
    runId: path.basename(directory),
    startedAt: new Date().toISOString(),
    status: 'preparing',
    directory,
    verification: null,
    patch: null,
    pr: null,
  };
  let server;
  const finish = () => {
    writeJson(path.join(directory, 'result.json'), state);
    const markdown = `# Zeouf repair loop\n\nRun: ${state.runId}\n\nStatus: **${state.status}**\n\nRoute: ${state.route || 'not diagnosed'}\n\n${state.error || state.summary || ''}\n\nOriginal failures remain in failure-packet.json. Agent findings are evidence proposals; independent verification decides patch status. A local candidate is not a deployed fix. No merge/deployment is performed.\n\nPatch: ${state.patch ? 'candidate.patch' : 'none'}\n\nVerification: ${state.verification ? JSON.stringify(state.verification) : 'not run'}\n`;
    fs.writeFileSync(path.join(directory, 'result.md'), markdown);
    const parent = path.join(root, 'test-results/ecommerce-repair-loop');
    fs.mkdirSync(parent, { recursive: true });
    writeJson(path.join(parent, 'latest.json'), state);
    fs.writeFileSync(path.join(parent, 'latest.md'), markdown + `\nRun directory: ${directory}\n`);
    console.log(`Repair loop: ${state.status}. Evidence: ${directory}`);
  };
  try {
    const packet = core.packetFromReports(root, options.reports);
    writeJson(path.join(directory, 'failure-packet.json'), packet);
    if (packet.blockers.length) {
      state.status = 'needs-review';
      state.summary = packet.blockers.join('\n');
      return state;
    }
    if (!packet.failures.length) {
      state.status = 'no-browser-failures';
      return state;
    }
    if (options.mode === 'prepare') {
      state.status = 'prepared';
      state.summary = `${packet.failures.length} failures are ready for evidence-based diagnosis.`;
      return state;
    }

    const workspace = runtime.makeWorkspace();
    state.workspace = workspace;
    const framework = path.join(workspace, 'framework'),
      website = path.join(workspace, 'website');
    state.framework = runtime.snapshot(root, framework, true);
    state.website = runtime.snapshot(options.website, website, false);
    const sources = runtime.sourceEvidence(framework, website, packet);
    writeJson(path.join(directory, 'evidence-sources.json'), sources);
    const schemaFile = path.join(directory, 'diagnosis.schema.json');
    writeJson(schemaFile, core.diagnosisSchema(sources));
    const prompt = core.diagnosisPrompt(packet, sources);
    fs.writeFileSync(path.join(directory, 'diagnosis-prompt.txt'), prompt);
    console.log('Diagnosing failures with the read-only agent');
    const diagnosis = options.diagnosis
      ? JSON.parse(fs.readFileSync(options.diagnosis, 'utf8'))
      : await runtime.codex(
          framework,
          prompt,
          schemaFile,
          path.join(directory, 'diagnosis.json'),
          path.join(directory, 'diagnosis-agent.log'),
          true,
        );
    state.diagnosis = diagnosis;
    state.route = core.validateDiagnosis(packet, diagnosis, sources);
    writeJson(path.join(directory, 'diagnosis.json'), diagnosis);
    if (options.mode === 'diagnose' || !['website', 'framework'].includes(state.route)) {
      state.status =
        state.route === 'environment'
          ? 'environment-blocked'
          : state.route === 'review'
            ? 'needs-review'
            : 'diagnosed';
      return state;
    }

    await runtime.install(framework, directory, 'framework');
    await runtime.install(website, directory, 'website');
    await runtime.buildWebsite(website, directory, 'baseline');
    server = await runtime.startWebsite(website, directory, 'baseline');
    const baseline = await runtime.browserRun(framework, packet, directory, 'baseline', server.url);
    server.stop();
    server = null;
    if (!runtime.reproduced(packet, baseline))
      throw new Error(
        'Original failed checks did not reproduce on the isolated website revision; no patch justified',
      );
    state.baselineReproduced = true;
    const frozenRoot = state.route === 'website' ? framework : website,
      frozen = runtime.trackedHashes(frozenRoot);
    const target = state.route === 'website' ? website : framework;
    const baselineCommit =
      state.route === 'website' ? state.website.baseline : state.framework.baseline;
    const protectedFramework = runtime.trackedHashes(framework);
    const originalPageObject = fs.readFileSync(
      path.join(framework, 'pages/ecommerce-storefront-page.ts'),
      'utf8',
    );
    if (state.route === 'framework')
      delete protectedFramework['pages/ecommerce-storefront-page.ts'];
    console.log(
      `Handing repair to the ${state.route === 'website' ? 'website developer' : 'Playwright healer'} agent`,
    );
    let repair;
    if (options['candidate-patch']) {
      // External developer agents use the same independent gates as the nested CLI agent.
      runtime.command('git', ['apply', '--check', options['candidate-patch']], target);
      runtime.command('git', ['apply', options['candidate-patch']], target);
      repair = JSON.parse(fs.readFileSync(options['repair-result'], 'utf8'));
      writeJson(path.join(directory, 'repair.json'), repair);
      state.repairExecution = 'external-agent-handoff';
    } else
      repair = await runtime.codex(
        target,
        core.repairPrompt(state.route, packet, diagnosis),
        path.join(root, 'scripts/ecommerce-repair/repair-result.schema.json'),
        path.join(directory, 'repair.json'),
        path.join(directory, 'repair-agent.log'),
        false,
      );
    if (repair.blockers?.length)
      throw new Error(`Agent reported a blocker: ${repair.blockers.join('; ')}`);
    state.repair = repair;
    let files = runtime.changedFiles(target, baselineCommit, state.route);
    if (state.route === 'framework')
      core.validateHealerChange(
        originalPageObject,
        fs.readFileSync(path.join(framework, 'pages/ecommerce-storefront-page.ts'), 'utf8'),
      );
    if (state.route === 'website') {
      for (const file of ['docs/BRD.md', 'docs/QA_TESTING_GUIDE.md'])
        core.validateWebsiteDocs(
          runtime.command('git', ['show', `${baselineCommit}:${file}`], website, { raw: true }),
          fs.readFileSync(path.join(website, file), 'utf8'),
        );
      const permitted = new Set(
        diagnosis.evidence
          .filter((item) => item.source.startsWith('website/src/'))
          .map((item) => item.source.slice(8)),
      );
      if (files.some((file) => file.startsWith('src/') && !permitted.has(file)))
        throw new Error('Website patch exceeds the diagnosed source files');
      const ids = packet.requirements.map((item) => item.id);
      if (
        !repair.documentationReview?.trim() ||
        !repair.requirementIds?.length ||
        repair.requirementIds.some((id) => !ids.includes(id))
      )
        throw new Error('Website repair needs an explicit review of the affected requirement IDs');
      runtime.command(process.execPath, [runtime.npmCli(), 'run', 'docs:sync'], website, {
        env: runtime.websiteEnvironment(),
      });
      runtime.command(
        process.execPath,
        [
          runtime.npmCli(),
          'run',
          'docs:review',
          '--',
          '--summary',
          repair.documentationReview,
          '--requirements',
          repair.requirementIds.join(','),
        ],
        website,
        { env: runtime.websiteEnvironment() },
      );
      files = runtime.changedFiles(target, baselineCommit, state.route);
    }
    runtime.assertFrozen(frozenRoot, frozen);
    const now = runtime.trackedHashes(framework);
    if (state.route === 'framework') delete now['pages/ecommerce-storefront-page.ts'];
    if (JSON.stringify(now) !== JSON.stringify(protectedFramework))
      throw new Error('Tests, requirements, fixtures or framework configuration changed');
    if (state.route === 'website') await runtime.buildWebsite(website, directory, 'candidate');
    else {
      const check = await runtime.run(
        process.execPath,
        [runtime.npmCli(), 'run', 'check'],
        framework,
        path.join(directory, 'candidate-framework-check.log'),
      );
      if (check.code !== 0) throw new Error('Framework quality checks failed');
    }
    server = await runtime.startWebsite(website, directory, 'candidate');
    const verification = await runtime.browserRun(
      framework,
      packet,
      directory,
      'candidate',
      server.url,
      true,
    );
    server.stop();
    server = null;
    const inventoryHashes = {
      caseCatalogSha256: core.hash(
        fs.readFileSync(path.join(framework, 'specs/ecommerce/requirements/case-catalog.json')),
      ),
      checkManifestSha256: core.hash(
        fs.readFileSync(path.join(framework, 'specs/ecommerce/requirements/check-links.json')),
      ),
    };
    const verified = core.verifyReport(
      verification.report,
      verification.expectedCheckIds,
      verification.code,
      inventoryHashes,
    );
    state.verification = {
      passed: verified,
      reportSha256: core.hash(fs.readFileSync(verification.reportFile)),
      report: 'candidate-results.json',
      expectedCheckIds: verification.expectedCheckIds,
      inventoryHashes,
      stats: verification.report.stats,
    };
    if (!verified) throw new Error('Independent original/related regression verification failed');
    runtime.assertFrozen(frozenRoot, frozen);
    files = runtime.changedFiles(target, baselineCommit, state.route);
    const patch = runtime.command(
      'git',
      ['diff', '--binary', baselineCommit, '--', ...files],
      target,
      { raw: true },
    );
    if (!patch.trim()) throw new Error('Verified repair has no diff');
    fs.writeFileSync(path.join(directory, 'candidate.patch'), patch);
    runtime.command(
      'git',
      ['apply', '--check', '--reverse', path.join(directory, 'candidate.patch')],
      target,
    );
    state.patch = {
      sha256: core.hash(patch),
      files,
      sourceRevision:
        state.route === 'website' ? state.website.sourceRevision : state.framework.sourceRevision,
    };
    state.status = 'verified-candidate';
    state.summary = repair.summary;
    writeJson(path.join(directory, 'proposal.json'), {
      schemaVersion: 1,
      status: state.status,
      role: state.route,
      frameworkRevision: state.framework.sourceRevision,
      websiteRevision: state.website.sourceRevision,
      patchSha256: state.patch.sha256,
      files,
      summary: state.summary,
      verification: state.verification,
    });
  } catch (error) {
    state.status = 'blocked';
    state.error = error.message;
    process.exitCode = 1;
  } finally {
    if (server) server.stop();
    finish();
  }
  return state;
}

if (require.main === module)
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
module.exports = { argumentsFor, main };

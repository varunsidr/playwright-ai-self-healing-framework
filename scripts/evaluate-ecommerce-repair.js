'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { createHash, randomUUID } = require('node:crypto');
const { collectChecks, checkOutcome } = require('./build-ecommerce-monitoring');

const root = path.resolve(__dirname, '..');
const expectedNotice = 'Newsletter preview only. Your email was not saved or sent.';
const replacementId = 'evaluation-newsletter-submit-v2';
const stages = [
  'baseline',
  'locator-drift',
  'locator-repair',
  'application-defect',
  'environment-unavailable',
];
const sourceFiles = [
  'tests/ecommerce/repair-evaluation.spec.ts',
  'pages/ecommerce-storefront-page.ts',
  'pages/ecommerce-repair-evaluation-page.ts',
  'fixtures/ecommerce-base.ts',
  'fixtures/ecommerce-repair-evaluation.ts',
  'scripts/evaluate-ecommerce-repair.js',
  'scripts/build-ecommerce-monitoring.js',
  'playwright.config.ts',
  'specs/ecommerce/requirements/case-catalog.json',
  'specs/ecommerce/requirements/check-links.json',
];
const sha256 = (value) => createHash('sha256').update(value).digest('hex');
const relative = (value) => path.relative(root, value).replace(/\\/g, '/');

function diagnose(stage) {
  const observation = stage?.observation;
  if (stage?.outcome !== 'failed' || !observation || observation.attemptedWrites?.length !== 0)
    return 'unknown';
  const message = stage.failureMessage || '';
  if (observation.blockedDocuments > 0 && /net::ERR_CONNECTION_REFUSED/i.test(message))
    return 'environment';
  if (
    observation.originalSubmitVisible === false &&
    observation.replacementSubmitVisible === true &&
    observation.replacementTestId === replacementId &&
    /footer-newsletter-submit/.test(message) &&
    /timeout/i.test(message)
  )
    return 'locator';
  if (
    observation.originalSubmitVisible === true &&
    typeof observation.noticeText === 'string' &&
    observation.noticeText !== expectedNotice &&
    /toBeVisible/.test(message)
  )
    return 'application';
  return 'unknown';
}

function assessEvaluation(results, sourcesUnchanged, proposalApplicable = true) {
  const byStage = new Map(results.map((result) => [result.stage, result]));
  const baseline = byStage.get('baseline');
  const baselineVerified =
    baseline?.outcome === 'passed' &&
    baseline.runnerErrors === 0 &&
    baseline.sourceSnapshotMatches === true &&
    baseline.exitCode === 0 &&
    baseline.observation?.noticeText === expectedNotice &&
    baseline.observation?.attemptedWrites?.length === 0;
  const decisions = [
    { stage: 'locator-drift', expectedDiagnosis: 'locator', action: 'propose-locator-only-repair' },
    {
      stage: 'application-defect',
      expectedDiagnosis: 'application',
      action: 'report-application-defect',
    },
    {
      stage: 'environment-unavailable',
      expectedDiagnosis: 'environment',
      action: 'report-environment-blocker',
    },
  ].map((decision) => {
    const diagnosis = diagnose(byStage.get(decision.stage));
    return { ...decision, diagnosis, matchesScenario: diagnosis === decision.expectedDiagnosis };
  });
  const repair = byStage.get('locator-repair');
  const repairVerified =
    repair?.outcome === 'passed' &&
    repair.runnerErrors === 0 &&
    repair.sourceSnapshotMatches === true &&
    repair.exitCode === 0 &&
    repair.observation?.noticeText === expectedNotice &&
    repair.observation?.attemptedWrites?.length === 0 &&
    repair.observation?.originalSubmitVisible === false &&
    repair.observation?.replacementTestId === replacementId;
  const allStagesObserved =
    results.length === stages.length &&
    stages.every((stage) => byStage.has(stage)) &&
    results.every(
      (result) =>
        result.runnerErrors === 0 &&
        result.sourceSnapshotMatches === true &&
        result.exitCode === (result.outcome === 'passed' ? 0 : 1),
    );
  const correctDecisions = decisions.filter((decision) => decision.matchesScenario).length;
  return {
    status: !baselineVerified
      ? 'blocked'
      : sourcesUnchanged &&
          proposalApplicable &&
          allStagesObserved &&
          repairVerified &&
          correctDecisions === decisions.length
        ? 'verified-rehearsal'
        : 'failed',
    baselineVerified: Boolean(baselineVerified),
    repairVerified: Boolean(repairVerified),
    sourcesUnchanged,
    proposalApplicable,
    allStagesObserved,
    correctDecisions,
    decisionCount: decisions.length,
    decisions,
    reviewStatus: 'pending; rehearsal only, no production repair applied',
    autonomousRepairEvaluated: false,
  };
}

function buildLocatorDiff(originalText, selector) {
  if (selector !== replacementId) throw new Error('Unexpected replacement selector');
  const originalLines = originalText.split(/\r?\n/);
  const inputLine = originalLines.findIndex(
    (line) => line === "    await this.page.getByTestId('footer-newsletter-email').fill(email);",
  );
  const changeLine = inputLine + 1;
  if (
    inputLine < 0 ||
    originalLines[changeLine] !==
      "    await this.page.getByTestId('footer-newsletter-submit').click();"
  )
    throw new Error('Original locator method differs; no proposal generated');
  const first = Math.max(0, changeLine - 3);
  const end = Math.min(originalLines.length, changeLine + 4);
  const lines = [
    '# Rehearsal proposal only; production page object is not modified.',
    '--- a/pages/ecommerce-storefront-page.ts',
    '+++ b/pages/ecommerce-storefront-page.ts',
    `@@ -${first + 1},${end - first} +${first + 1},${end - first} @@`,
  ];
  for (let index = first; index < end; index += 1) {
    if (index === changeLine) {
      lines.push(
        `-${originalLines[index]}`,
        `+    await this.page.getByTestId('${selector}').click();`,
      );
    } else lines.push(` ${originalLines[index]}`);
  }
  return `${lines.join('\n')}\n`;
}

function readStage(reportPath, stage, runDirectory, sourceSnapshot) {
  if (!fs.existsSync(reportPath))
    return {
      stage,
      outcome: 'not-run',
      reportFile: relative(reportPath),
      runnerErrors: 1,
      failureMessage: 'Playwright JSON report missing',
      observation: null,
      sourceSnapshotMatches: false,
    };
  const contents = fs.readFileSync(reportPath, 'utf8');
  const report = JSON.parse(contents);
  const entries = collectChecks(report.suites);
  const matches = entries.filter(({ test }) =>
    (test.annotations || []).some(
      (annotation) =>
        annotation.type === 'zeouf-evaluation' && annotation.description === 'EVAL-CNT-001',
    ),
  );
  if (matches.length !== 1 || entries.length !== 1)
    throw new Error(`Expected exactly one evaluation check in ${stage}`);
  const { spec, test } = matches[0];
  if (
    test.projectName !== 'ecommerce-chromium' ||
    !spec.file.replace(/\\/g, '/').endsWith('ecommerce/repair-evaluation.spec.ts') ||
    report.config?.metadata?.repairEvaluationStage !== stage
  )
    throw new Error(`Evaluation identity mismatch in ${stage}`);
  const final = test.results?.at(-1);
  const attachment = final?.attachments?.find((item) => item.name === 'evaluation-observation');
  let observation = null;
  if (attachment?.path) {
    const attachmentPath = path.resolve(attachment.path);
    const stagePath = path.join(runDirectory, stage);
    if (!attachmentPath.startsWith(`${stagePath}${path.sep}`))
      throw new Error('Observation attachment is outside its evaluation stage');
    observation = JSON.parse(fs.readFileSync(attachmentPath, 'utf8'));
  }
  const errors = final?.errors || (final?.error ? [final.error] : []);
  return {
    stage,
    outcome: checkOutcome(test),
    reportFile: relative(reportPath),
    reportSha256: sha256(contents),
    htmlReport: relative(path.join(runDirectory, stage, 'playwright-report/index.html')),
    metadata: report.config?.metadata || {},
    runnerErrors: (report.errors || []).length,
    sourceSnapshotMatches: report.config?.metadata?.repairEvaluationSourceSha256 === sourceSnapshot,
    failureMessage: errors
      .map((error) => (typeof error === 'string' ? error : error.message || ''))
      .join('\n'),
    observation,
    attachments: (final?.attachments || [])
      .filter((item) => item.path)
      .map((item) => ({ name: item.name, path: relative(path.resolve(item.path)) })),
  };
}

function renderEvaluation(data, outputDirectory, clickable = true) {
  const link = (file, label) =>
    clickable
      ? `[${label}](<${path.relative(outputDirectory, path.resolve(root, file)).replace(/\\/g, '/')}>)`
      : `${label}: \`${file}\``;
  const lines = [
    '# Zeouf controlled repair rehearsal',
    '',
    `Run: ${data.runId}. Started: ${data.startedAt}.`,
    '',
    `Evaluation status: **${data.assessment.status}**. Scripted scenario decisions matched: ${data.assessment.correctDecisions}/${data.assessment.decisionCount}.`,
    '',
    `Baseline verified: ${data.assessment.baselineVerified}. Locator-only rerun verified: ${data.assessment.repairVerified}. Proposal applies cleanly: ${data.assessment.proposalApplicable}. Source files unchanged: ${data.assessment.sourcesUnchanged}.`,
    '',
    '**Scope:** browser-only controlled changes on the Zeouf newsletter flow. This evaluates deterministic diagnosis rules and a constrained locator rehearsal. It is not autonomous AI repair, independent benchmark accuracy, full live acceptance or an approved production patch.',
    '',
    `Review: ${data.assessment.reviewStatus}.`,
    '',
    '| Stage | Actual Playwright outcome | Evidence |',
    '| --- | --- | --- |',
  ];
  for (const result of data.results)
    lines.push(
      `| ${result.stage} | ${result.outcome} | ${link(result.reportFile, 'JSON')}${result.htmlReport ? ` / ${link(result.htmlReport, 'HTML')}` : ''} |`,
    );
  lines.push(
    '',
    '| Scenario | Observed diagnosis | Action when diagnosis matches | Matched |',
    '| --- | --- | --- | --- |',
  );
  for (const decision of data.assessment.decisions)
    lines.push(
      `| ${decision.stage} | ${decision.diagnosis} | ${decision.matchesScenario ? decision.action : 'investigate; no repair justified'} | ${decision.matchesScenario} |`,
    );
  if (data.proposalFile)
    lines.push(
      '',
      `Proposed locator-only diff: ${link(data.proposalFile, 'review diff')}. The rehearsal uses that selector in its evaluation helper; the production page object is unchanged.`,
    );
  lines.push(
    '',
    'Intentional browser failures remain failed in their original reports. A verified rehearsal means the scenario checks behaved as specified, including refusing to turn application or environment faults into passes. An unavailable baseline blocks the rehearsal.',
    '',
    'Code/deployment metadata, source/report hashes, failure messages and artifact paths are retained in the companion JSON. Unknown revisions remain unknown. No existing monitoring evidence is overwritten.',
    '',
  );
  return lines.join('\n');
}

function main() {
  const parent = path.join(root, 'test-results/ecommerce-repair-evaluation');
  fs.mkdirSync(parent, { recursive: true });
  const runId = `${new Date().toISOString().replace(/[:.]/g, '-')}-${randomUUID().slice(0, 8)}`;
  const runDirectory = path.join(parent, runId);
  fs.mkdirSync(runDirectory);
  const sources = Object.fromEntries(
    sourceFiles.map((file) => [file, sha256(fs.readFileSync(path.join(root, file)))]),
  );
  const snapshot = sha256(JSON.stringify(sources));
  const data = {
    schemaVersion: 1,
    runId,
    startedAt: new Date().toISOString(),
    sources,
    runtime: {
      node: process.version,
      playwright: require('@playwright/test/package.json').version,
      platform: process.platform,
    },
    results: [],
    proposalFile: null,
  };
  try {
    for (const stage of stages) {
      const reportPath = path.join(runDirectory, stage, 'playwright-results.json');
      const run = spawnSync(
        process.execPath,
        [
          require.resolve('@playwright/test/cli'),
          'test',
          'tests/ecommerce/repair-evaluation.spec.ts',
          '--project=ecommerce-chromium',
          '--workers=1',
          '--retries=0',
          '--timeout=25000',
        ],
        {
          cwd: root,
          encoding: 'utf8',
          timeout: 60000,
          maxBuffer: 5 * 1024 * 1024,
          env: {
            ...process.env,
            ECOMMERCE_REPAIR_EVALUATION: 'true',
            ECOMMERCE_REPAIR_STAGE: stage,
            ECOMMERCE_REPAIR_SELECTOR:
              stage === 'locator-repair' ? data.proposedSelector || '' : '',
            ECOMMERCE_REPAIR_SOURCE_SHA256: snapshot,
            PW_OUTPUT_DIR: path.join(runDirectory, stage, 'artifacts'),
            PW_HTML_REPORT_DIR: path.join(runDirectory, stage, 'playwright-report'),
            PW_JSON_REPORT_PATH: reportPath,
            PW_JUNIT_REPORT_PATH: path.join(runDirectory, stage, 'junit.xml'),
            PW_ALLURE_RESULTS_DIR: path.join(runDirectory, stage, 'allure-results'),
          },
        },
      );
      fs.mkdirSync(path.dirname(reportPath), { recursive: true });
      fs.writeFileSync(
        path.join(runDirectory, stage, 'runner.log'),
        `${run.stdout || ''}\n${run.stderr || ''}`,
      );
      const result = readStage(reportPath, stage, runDirectory, snapshot);
      result.exitCode = run.status;
      if (run.error) {
        result.runnerErrors += 1;
        result.failureMessage += `\n${run.error.message}`;
      }
      data.results.push(result);
      console.log(`${stage}: ${result.outcome} (Playwright exit ${run.status})`);
      if (
        stage === 'baseline' &&
        (result.outcome !== 'passed' ||
          result.observation?.noticeText !== expectedNotice ||
          result.observation?.attemptedWrites?.length !== 0)
      )
        break;
      if (stage === 'locator-drift') {
        if (diagnose(result) !== 'locator') break;
        data.proposedSelector = result.observation.replacementTestId;
        const diff = buildLocatorDiff(
          fs.readFileSync(path.join(root, 'pages/ecommerce-storefront-page.ts'), 'utf8'),
          data.proposedSelector,
        );
        const proposal = path.join(runDirectory, 'locator-proposal.diff');
        fs.writeFileSync(proposal, diff);
        data.proposalFile = relative(proposal);
        const proposalCheck = spawnSync('git', ['apply', '--check', proposal], {
          cwd: root,
          encoding: 'utf8',
          timeout: 10000,
        });
        data.proposalCheck = {
          exitCode: proposalCheck.status,
          error: proposalCheck.error?.message || null,
          output: `${proposalCheck.stdout || ''}${proposalCheck.stderr || ''}`,
        };
        if (proposalCheck.status !== 0)
          throw new Error('Locator proposal does not apply cleanly; repair rehearsal stopped');
      }
    }
  } catch (error) {
    data.orchestrationError = error.message;
  }
  const unchanged = sourceFiles.every(
    (file) => sha256(fs.readFileSync(path.join(root, file))) === sources[file],
  );
  data.assessment = assessEvaluation(data.results, unchanged, data.proposalCheck?.exitCode === 0);
  if (data.orchestrationError)
    data.assessment.status = data.assessment.baselineVerified ? 'failed' : 'blocked';
  fs.writeFileSync(
    path.join(runDirectory, 'evaluation.json'),
    `${JSON.stringify(data, null, 2)}\n`,
  );
  fs.writeFileSync(path.join(runDirectory, 'evaluation.md'), renderEvaluation(data, runDirectory));
  fs.writeFileSync(path.join(parent, 'latest.json'), `${JSON.stringify(data, null, 2)}\n`);
  const markdown = renderEvaluation(data, parent);
  fs.writeFileSync(path.join(parent, 'latest.md'), markdown);
  if (process.env.GITHUB_STEP_SUMMARY)
    fs.appendFileSync(
      process.env.GITHUB_STEP_SUMMARY,
      `\n${renderEvaluation(data, parent, false)}\nDownload the zeouf-repair-evaluation artifact to open the linked reports locally.\n`,
    );
  console.log(
    `Evaluation: ${data.assessment.status}. Evidence: ${relative(path.join(parent, 'latest.md'))}`,
  );
  process.exitCode = data.assessment.status === 'verified-rehearsal' ? 0 : 1;
}

if (require.main === module) main();
module.exports = { diagnose, assessEvaluation, readStage, renderEvaluation, buildLocatorDiff };

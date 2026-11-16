'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { attachmentPath, collectFailureEvidence, traceSummary } = require('./evidence');
const { sourceEvidence } = require('./runtime');

function workspace(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'zeouf-evidence-test-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const artifacts = path.join(root, 'test-results', 'original-ci');
  fs.mkdirSync(path.join(artifacts, 'browser', 'failed-check'), { recursive: true });
  return { root, artifacts, report: path.join(artifacts, 'results.json') };
}

test('downloaded artifacts rebase old CI paths and reject traversal, external files and junction escapes', (t) => {
  const { root, artifacts, report } = workspace(t);
  const file = path.join(artifacts, 'browser/failed-check/error-context.md');
  fs.writeFileSync(file, '- button "Account"');
  assert.equal(
    attachmentPath(
      root,
      report,
      '/home/runner/project/test-results/browser/failed-check/error-context.md',
    ),
    file,
  );
  assert.equal(
    attachmentPath(root, report, 'D:\\old\\test-results\\browser\\failed-check\\error-context.md'),
    file,
  );
  assert.throws(() => attachmentPath(root, report, '../secret.txt'), /traversal/);
  const outside = path.join(root, 'secrets');
  fs.mkdirSync(outside);
  fs.writeFileSync(path.join(outside, 'error-context.md'), 'private');
  assert.throws(
    () => attachmentPath(root, report, path.join(outside, 'error-context.md')),
    /unavailable/,
  );
  fs.symlinkSync(
    outside,
    path.join(artifacts, 'escape'),
    process.platform === 'win32' ? 'junction' : 'dir',
  );
  assert.throws(() => attachmentPath(root, report, 'escape/error-context.md'), /unavailable/);
});

test('only failed attempts supply bounded, redacted, hash-linked evidence including inline attachments', (t) => {
  const { root, artifacts, report } = workspace(t);
  const file = path.join(artifacts, 'browser/failed-check/error-context.md');
  fs.writeFileSync(file, '- button "Account"\n' + 'x'.repeat(20000));
  const inline = {
    name: 'navigation-diagnostics',
    body: Buffer.from(
      '{"url":"https://example.test/?token=private", "authorization":"Bearer private"}',
    ).toString('base64'),
  };
  const data = collectFailureEvidence(
    root,
    report,
    [
      { status: 'passed', attachments: [inline] },
      {
        status: 'failed',
        retry: 1,
        attachments: [
          inline,
          { name: 'error-context', path: file },
          { name: 'trace', path: 'missing.zip' },
        ],
      },
    ],
    { remaining: 17000 },
  );
  assert.equal(data.evidence.length, 2);
  assert.equal(data.evidence[0].attempt, 1);
  assert.equal(data.evidence[0].retry, 1);
  assert.equal(data.evidence[0].content.includes('private'), false);
  assert.match(data.evidence[0].sha256, /^[a-f0-9]{64}$/);
  assert.equal(data.evidence[1].truncated, true);
  assert.match(data.evidenceWarnings[0], /unavailable/);
  const exhausted = collectFailureEvidence(
    root,
    report,
    [{ status: 'failed', attachments: [inline, inline] }],
    { remaining: 5 },
  );
  assert.equal(exhausted.evidence[0].content.length, 5);
  assert.match(exhausted.evidenceWarnings[0], /budget/);
});

test('trace commands execute in a private directory and retain failed action IDs for exact evidence citations', () => {
  const calls = [];
  let cwd;
  const text = traceSummary('/trace.zip', {
    execute(binary, args, options) {
      cwd = options.cwd;
      calls.push(args.slice(2));
      return {
        status: 0,
        stdout: args[2] === 'actions' ? '  9. Expect visible FAILED' : 'recorded evidence',
      };
    },
  });
  assert.match(text, /ACTION 9/);
  assert.deepEqual(calls[2], ['action', '9']);
  assert.equal(fs.existsSync(cwd), false);
});

test('browser evidence contents become citable diagnosis sources instead of inaccessible paths', (t) => {
  const { root } = workspace(t);
  fs.mkdirSync(path.join(root, 'pages'));
  fs.writeFileSync(path.join(root, 'pages/ecommerce-storefront-page.ts'), 'page object');
  const sources = sourceEvidence(root, root, {
    failures: [
      {
        checkId: 'CHK-1',
        title: 'account',
        errors: ['missing account'],
        file: 'pages/ecommerce-storefront-page.ts',
        evidence: [
          {
            name: 'aria-snapshot',
            attempt: 0,
            retry: 0,
            sha256: 'hash',
            truncated: false,
            content: '- button "Account"',
          },
        ],
      },
    ],
    cases: [],
    requirements: [],
  });
  assert.match(sources['browser/CHK-1/0-aria-snapshot'], /button "Account"/);
});

test('test-level timeouts retain recent action details when no individual API action failed', () => {
  const text = traceSummary('/trace.zip', {
    execute(binary, args) {
      const command = args[2];
      const output =
        command === 'actions'
          ? args.includes('--errors-only')
            ? ''
            : '  7. Click\n  8. Attach failure evidence'
          : 'Test timeout';
      return { status: 0, stdout: output };
    },
  });
  assert.match(text, /RECENT ACTIONS/);
  assert.match(text, /ACTION 8/);
});

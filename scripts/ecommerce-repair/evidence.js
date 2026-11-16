'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { createHash } = require('node:crypto');

const hash = (value) => createHash('sha256').update(value).digest('hex');
const inside = (root, file) => {
  const relative = path.relative(root, file);
  return (
    relative &&
    !relative.startsWith('..' + path.sep) &&
    relative !== '..' &&
    !path.isAbsolute(relative)
  );
};

// Reports may refer to an old CI checkout. Rebase only under the downloaded artifact root.
function attachmentPath(root, reportFile, recorded) {
  const reportRoot = path.dirname(path.resolve(reportFile));
  const roots = [reportRoot, path.join(root, 'test-results')].filter(fs.existsSync);
  const normalized = recorded.replaceAll('\\', '/');
  if (normalized.split('/').includes('..')) throw new Error('Attachment traversal rejected');
  const marker = normalized.lastIndexOf('/test-results/');
  const candidates = [
    path.resolve(reportRoot, recorded),
    path.resolve(root, recorded),
    ...(marker >= 0 ? [path.resolve(reportRoot, normalized.slice(marker + 14))] : []),
  ];
  for (const file of candidates) {
    if (!roots.some((base) => inside(path.resolve(base), file)) || !fs.existsSync(file)) continue;
    const real = fs.realpathSync(file);
    if (roots.some((base) => inside(fs.realpathSync(base), real)) && fs.statSync(real).isFile())
      return real;
  }
  throw new Error('Attachment unavailable inside the report artifact roots');
}

function redact(text) {
  return text
    .replace(/\u001b\[[0-9;]*m/g, '')
    .replace(/(Bearer\s+)[\w.\-]+/gi, '$1[redacted]')
    .replace(
      /([?&](?:access_token|refresh_token|token|code|key|api_key)=)[^\s&#"']+/gi,
      '$1[redacted]',
    )
    .replace(
      /("(?:password|access_token|refresh_token|authorization|cookie|set-cookie)"\s*:\s*")[^"]*/gi,
      '$1[redacted]',
    );
}

function traceSummary(
  file,
  { cli = require.resolve('@playwright/test/cli'), execute = spawnSync } = {},
) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'zeouf-trace-evidence-'));
  const sections = [];
  const run = (args) => {
    const result = execute(process.execPath, [cli, 'trace', ...args], {
      cwd: directory,
      encoding: 'utf8',
      timeout: 15000,
      maxBuffer: 1024 * 1024,
      windowsHide: true,
    });
    if (result.error || result.status !== 0) throw new Error('Trace CLI could not read ' + args[0]);
    return result.stdout || '';
  };
  try {
    sections.push('TRACE\n' + run(['open', file]).slice(0, 2000));
    let actions = run(['actions', '--errors-only']);
    sections.push('FAILED ACTIONS\n' + actions.slice(0, 4000));
    let actionId = /^\s*(\d+)\./m.exec(actions)?.[1];
    if (!actionId) {
      // Test-level timeouts can have no failed API action. Preserve the last observed work.
      actions = run(['actions'])
        .split('\n')
        .filter((line) => /^\s*\d+\./.test(line))
        .slice(-8)
        .join('\n');
      sections.push('RECENT ACTIONS (no failed API action reported)\n' + actions.slice(0, 4000));
      actionId = [...actions.matchAll(/^\s*(\d+)\./gm)].at(-1)?.[1];
    }
    if (actionId)
      sections.push('ACTION ' + actionId + '\n' + run(['action', actionId]).slice(0, 4000));
    sections.push('ERRORS\n' + run(['errors']).slice(0, 4000));
    sections.push('CONSOLE ERRORS\n' + run(['console', '--errors-only']).slice(0, 2000));
    sections.push('FAILED REQUESTS\n' + run(['requests', '--failed']).slice(0, 2000));
    return sections.join('\n\n');
  } finally {
    // This directory is created by this invocation, never taken from an artifact or caller.
    fs.rmSync(directory, { recursive: true, force: true });
  }
}

function collectFailureEvidence(
  root,
  reportFile,
  results,
  budget = { remaining: 96000 },
  options = {},
) {
  const evidence = [],
    warnings = [];
  const kinds = new Set(['error-context', 'navigation-diagnostics', 'aria-snapshot', 'trace']);
  for (const [attempt, result] of results.entries()) {
    if (!['failed', 'timedOut', 'interrupted'].includes(result.status)) continue;
    for (const attachment of result.attachments || []) {
      if (!kinds.has(attachment.name)) continue;
      if (budget.remaining <= 0) {
        warnings.push('Evidence budget exhausted; original attachments remain authoritative');
        break;
      }
      try {
        const file = attachment.path ? attachmentPath(root, reportFile, attachment.path) : null;
        const maximum = attachment.name === 'trace' ? 32 * 1024 * 1024 : 256 * 1024;
        if (file && fs.statSync(file).size > maximum)
          throw new Error('Attachment exceeds ingestion limit');
        if (
          !file &&
          (typeof attachment.body !== 'string' || attachment.body.length > maximum * 1.4)
        )
          throw new Error('Missing or oversized inline attachment');
        const bytes = file ? fs.readFileSync(file) : Buffer.from(attachment.body, 'base64');
        const text = redact(
          attachment.name === 'trace'
            ? (options.traceSummary || traceSummary)(file)
            : bytes.toString('utf8'),
        );
        const limit = Math.min(16000, budget.remaining);
        const content = text.slice(0, limit);
        budget.remaining -= content.length;
        evidence.push({
          name: attachment.name,
          attempt,
          retry: result.retry || 0,
          sha256: hash(bytes),
          content,
          truncated: text.length > content.length,
          sourcePath: attachment.path || null,
        });
      } catch (error) {
        warnings.push(`${attachment.name} (attempt ${attempt}): ${error.message}`);
      }
    }
  }
  return { evidence, evidenceWarnings: warnings };
}

module.exports = { attachmentPath, redact, traceSummary, collectFailureEvidence };

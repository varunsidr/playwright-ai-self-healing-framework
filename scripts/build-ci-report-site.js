'use strict';
const fs = require('node:fs');
const path = require('node:path');
const escape = (value) =>
  String(value ?? 'unknown').replace(
    /[&<>"']/g,
    (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char],
  );
function build(metadata, downloaded, output) {
  if (
    !/^[a-f0-9]{40}$/.test(metadata.frameworkRevision || '') ||
    !Number.isSafeInteger(metadata.runId)
  )
    throw new Error('Missing authoritative run identity');
  if (fs.existsSync(output)) throw new Error('Report output must be new');
  fs.mkdirSync(output, { recursive: true });
  const reports = [];
  for (const [source, destination] of [
    [path.join(downloaded, 'playwright-report'), 'reports'],
    [path.join(downloaded, 'test-results/ecommerce-isolated/html'), 'isolated'],
  ]) {
    if (!fs.existsSync(source)) continue;
    fs.cpSync(source, path.join(output, destination), { recursive: true });
    const visit = (directory, relative) => {
      for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
        const next = path.posix.join(relative, entry.name);
        if (entry.isDirectory() && entry.name !== 'trace' && entry.name !== 'data')
          visit(path.join(directory, entry.name), next);
        else if (entry.isFile() && entry.name === 'index.html') reports.push(next);
      }
    };
    visit(source, destination);
  }
  const evidence = { ...metadata, reports, publicationIsTestPass: false };
  fs.writeFileSync(path.join(output, 'source-run.json'), JSON.stringify(evidence, null, 2) + '\n');
  const links = reports.length
    ? `<ul>${reports.map((file) => `<li><a href="${escape(file)}">${escape(file)}</a></li>`).join('')}</ul>`
    : '<p>No HTML report artifact was produced by this run. Inspect its workflow logs.</p>';
  fs.writeFileSync(
    path.join(output, 'index.html'),
    `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Zeouf test evidence</title><style>body{font:18px system-ui;max-width:900px;margin:64px auto;padding:0 24px;color:#182332;background:#f5f7fb}a{color:#174d9d}dt{font-weight:bold;margin-top:16px}dd{margin:4px 0;overflow-wrap:anywhere}li{margin:14px 0}</style><h1>Zeouf test evidence</h1><p>Original test conclusion: <strong>${escape(metadata.testConclusion)}</strong></p><p>Report publication and test success are separate results.</p><dl><dt>Framework commit</dt><dd>${escape(metadata.frameworkRevision)}</dd><dt>Source run</dt><dd><a href="${escape(metadata.workflowUrl)}">${escape(metadata.runId)}</a> · attempt ${escape(metadata.runAttempt)}</dd></dl>${links}<p><a href="source-run.json">Run provenance</a></p></html>`,
  );
  return evidence;
}
if (require.main === module)
  build(
    JSON.parse(fs.readFileSync(process.argv[2], 'utf8')),
    path.resolve(process.argv[3]),
    path.resolve(process.argv[4]),
  );
module.exports = { build };

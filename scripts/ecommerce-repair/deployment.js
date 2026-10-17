'use strict';

const fs = require('node:fs');
const path = require('node:path');
const core = require('./core');

const repository = 'varunsidr/Luxury_fashion_ecommerce';
const api = `https://api.github.com/repos/${repository}`;
const revisionPattern = /^[a-f0-9]{40}$/;
const immutableHost = /^zeouf-luxury-fashion-ecommerce-[a-z0-9]+\.vercel\.app$/;

function validateRecord(record) {
  const url = new URL(record.url);
  if (
    record.schemaVersion !== 1 ||
    record.repository !== repository ||
    record.provider !== 'github-vercel' ||
    !revisionPattern.test(record.websiteRevision) ||
    record.environment !== 'Production' ||
    !Number.isSafeInteger(record.deploymentId) ||
    record.deploymentId <= 0 ||
    !Number.isSafeInteger(record.statusId) ||
    record.statusId <= 0 ||
    url.protocol !== 'https:' ||
    !immutableHost.test(url.hostname) ||
    url.port ||
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    url.pathname !== '/'
  )
    throw new Error('Invalid Zeouf immutable deployment record');
  return record;
}

function recordFrom(deployment, status) {
  if (
    deployment.creator?.login !== 'vercel[bot]' ||
    status.creator?.login !== 'vercel[bot]' ||
    deployment.environment !== 'Production' ||
    status.state !== 'success'
  )
    throw new Error('Deployment is not a successful Vercel Production record');
  return validateRecord({
    schemaVersion: 1,
    provider: 'github-vercel',
    repository,
    deploymentId: deployment.id,
    statusId: status.id,
    websiteRevision: deployment.sha,
    url: new URL(status.environment_url).origin,
    environment: deployment.environment,
    observedAt: new Date().toISOString(),
  });
}

async function get(endpoint) {
  const token = process.env.GITHUB_TOKEN;
  const response = await fetch(`${api}${endpoint}`, {
    headers: {
      Accept: 'application/vnd.github+json',
      'User-Agent': 'zeouf-repair',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    signal: AbortSignal.timeout(20000),
  });
  if (!response.ok)
    throw new Error(
      `GitHub deployment lookup failed (${response.status}); no revision will be guessed`,
    );
  return response.json();
}

async function capture(getJSON = get) {
  const deployments = await getJSON('/deployments?environment=Production&per_page=10');
  for (const deployment of deployments) {
    if (deployment.environment !== 'Production' || deployment.creator?.login !== 'vercel[bot]')
      continue;
    const statuses = await getJSON(`/deployments/${deployment.id}/statuses?per_page=100`);
    if (statuses[0]?.state === 'success') return recordFrom(deployment, statuses[0]);
  }
  throw new Error(
    'No successful Zeouf Production deployment found; automatic repair remains blocked',
  );
}

async function verifyRecord(record, getJSON = get) {
  validateRecord(record);
  const deployment = await getJSON(`/deployments/${record.deploymentId}`);
  const statuses = await getJSON(`/deployments/${record.deploymentId}/statuses?per_page=100`);
  const status = statuses.find((item) => item.id === record.statusId);
  if (!status) throw new Error('Recorded successful deployment status is unavailable');
  const verified = recordFrom(deployment, status);
  for (const key of ['deploymentId', 'statusId', 'websiteRevision', 'url', 'environment'])
    if (verified[key] !== record[key]) throw new Error(`Deployment identity changed: ${key}`);
  return record;
}

function validateBinding(metadata, record, recordBytes) {
  validateRecord(record);
  if (
    metadata.websiteRevision !== record.websiteRevision ||
    String(metadata.websiteDeploymentId) !== String(record.deploymentId) ||
    metadata.ecommerceOrigin !== record.url ||
    metadata.websiteDeploymentSha256 !== core.hash(recordBytes)
  )
    throw new Error(
      'Failure report is not bound to the recorded website deployment; run fresh pinned tests',
    );
}

function validatePacket(packet, record, recordBytes, frameworkRevision, websiteRevision) {
  if (!Array.isArray(packet.reports) || !packet.reports.length)
    throw new Error('Deployment binding requires original test reports');
  if (websiteRevision !== record.websiteRevision || !revisionPattern.test(frameworkRevision))
    throw new Error('Repair checkout is not the tested deployment revision');
  for (const report of packet.reports) {
    if (report.codeRevision !== frameworkRevision)
      throw new Error('Framework checkout differs from the recorded test revision');
    validateBinding(
      {
        websiteRevision: report.websiteRevision,
        websiteDeploymentId: report.websiteDeploymentId,
        ecommerceOrigin: report.origin,
        websiteDeploymentSha256: report.websiteDeploymentSha256,
      },
      record,
      recordBytes,
    );
  }
}

function output(key, value) {
  if (process.env.GITHUB_OUTPUT) fs.appendFileSync(process.env.GITHUB_OUTPUT, `${key}=${value}\n`);
}
async function main(args = process.argv.slice(2)) {
  const [mode, first, second] = args;
  let record, file;
  if (mode === 'capture') {
    record = await capture();
    file = path.resolve(first || 'test-results/website-deployment.json');
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, JSON.stringify(record, null, 2) + '\n');
    const response = await fetch(`${record.url}/api/health`, {
      signal: AbortSignal.timeout(15000),
      redirect: 'manual',
    });
    if (!response.ok)
      throw new Error(
        `Pinned website deployment is unavailable (${response.status}); check deployment access, without switching URLs`,
      );
  } else if (mode === 'check') {
    file = path.resolve(second);
    if (!fs.existsSync(file))
      throw new Error(
        'This CI run has no deployment record. Run Playwright Tests with pin_deployment enabled after resolving deployment access.',
      );
    if (!fs.existsSync(path.resolve(first)))
      throw new Error(
        'Pinned browser report is unavailable; inspect the source run deployment probe and browser step.',
      );
    const bytes = fs.readFileSync(file);
    record = JSON.parse(bytes);
    const report = JSON.parse(fs.readFileSync(path.resolve(first), 'utf8'));
    validateBinding(report.config?.metadata || {}, record, bytes);
    await verifyRecord(record);
  } else throw new Error('Expected capture <record-file> or check <report-file> <record-file>');
  output('url', record.url);
  output('website_revision', record.websiteRevision);
  output('deployment_id', record.deploymentId);
  output('record_file', file);
  console.log(
    `Pinned Zeouf deployment ${record.deploymentId} at ${record.websiteRevision}: ${record.url}`,
  );
}
if (require.main === module)
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
module.exports = {
  repository,
  revisionPattern,
  validateRecord,
  recordFrom,
  capture,
  verifyRecord,
  validateBinding,
  validatePacket,
  main,
};

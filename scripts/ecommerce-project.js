'use strict';
const fs = require('node:fs');
const path = require('node:path');
const project = require('../config/ecommerce-project.json');
const baseline = require('../specs/ecommerce/requirements/source-baseline.json');
if (!/^[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+$/.test(project.websiteRepository || ''))
  throw new Error('Project website repository must be an owner/repository pair');
if (
  project.schemaVersion !== 1 ||
  !/^[a-f0-9]{40}$/.test(project.websiteRevision) ||
  project.websiteRevision !== baseline.sourceRevision
)
  throw new Error('Project revision must match the reviewed requirements baseline');
const url = new URL(project.publicOrigin);
if (
  url.protocol !== 'https:' ||
  url.username ||
  url.password ||
  url.search ||
  url.hash ||
  url.pathname !== '/'
)
  throw new Error('Project public origin must be credential-free HTTPS');
if (Number(fs.readFileSync(path.join(__dirname, '../.nvmrc'), 'utf8').trim()) !== project.nodeMajor)
  throw new Error('Node runtime policy differs from project configuration');
if (require.main === module) {
  const text = `website_repository=${project.websiteRepository}\nwebsite_revision=${project.websiteRevision}\n`;
  if (process.env.GITHUB_OUTPUT) fs.appendFileSync(process.env.GITHUB_OUTPUT, text);
  else process.stdout.write(text);
}
module.exports = project;

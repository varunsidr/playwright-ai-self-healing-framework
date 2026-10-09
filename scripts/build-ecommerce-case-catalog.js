'use strict';

const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const inputDir = path.join(root, 'specs', 'ecommerce', 'requirements');
const sourceRows = parseCsv(
  fs.readFileSync(path.join(inputDir, 'REQUIREMENTS_TRACEABILITY.csv'), 'utf8'),
);
const guide = fs.readFileSync(path.join(inputDir, 'QA_TESTING_GUIDE.md'), 'utf8');
const links = JSON.parse(fs.readFileSync(path.join(inputDir, 'case-links.json'), 'utf8'));
const additionalCases = JSON.parse(
  fs.readFileSync(path.join(inputDir, 'additional-cases.json'), 'utf8'),
);
const coreDesigns = JSON.parse(
  fs.readFileSync(path.join(inputDir, 'core-case-designs.json'), 'utf8'),
);
const guideEnvironments = JSON.parse(
  fs.readFileSync(path.join(inputDir, 'guide-case-environments.json'), 'utf8'),
);

const requirements = new Map();
for (const row of sourceRows) {
  const id = row.requirement_id;
  if (!/^[A-Z][A-Z0-9]+-\d{2}$/.test(id) || requirements.has(id)) {
    throw new Error(`Invalid or duplicate requirement ID: ${id}`);
  }
  requirements.set(id, row);
}

const cases = [];
const caseIds = new Set();
for (const line of guide.split(/\r?\n/)) {
  if (!/^\|\s*TC-[A-Z]+-\d{3}-\d{2}\s*\|/.test(line)) continue;
  const cells = line
    .split('|')
    .slice(1, -1)
    .map((cell) => cell.trim());
  if (cells.length !== 4) throw new Error(`Unexpected guide case row: ${line}`);
  const [id, requirementText, scenario, mode] = cells;
  addCase({
    id,
    requirementIds: parseRequirementReferences(requirementText),
    scenario,
    mode,
    environment: guideEnvironments[id],
    designStatus: 'guide-specified',
  });
}

for (const id of Object.keys(guideEnvironments)) {
  if (!caseIds.has(id)) throw new Error(`Environment references unknown guide case ${id}`);
}

for (const item of additionalCases) {
  addCase({ ...item, designStatus: 'curated' });
}

for (const row of sourceRows) {
  if (cases.some((item) => item.requirementIds.includes(row.requirement_id))) continue;
  const design = coreDesigns[row.requirement_id];
  addCase({
    id: `TC-${row.requirement_id}-CORE`,
    requirementIds: [row.requirement_id],
    scenario:
      design?.scenario ||
      `Exercise the requirement with the documented QA focus: ${row.qa_focus || 'normal, denial and boundary behavior as applicable'}.`,
    mode:
      design?.mode ||
      (row.implementation_state === 'T' ? 'Target requirement' : 'Current baseline or known gap'),
    environment: design?.environment || 'unassigned',
    designStatus: design ? 'curated' : 'needs-detailed-steps',
  });
}

for (const id of Object.keys(coreDesigns)) {
  if (!requirements.has(id)) throw new Error(`Core design references unknown requirement ${id}`);
  if (!cases.some((item) => item.id === `TC-${id}-CORE`)) {
    throw new Error(`Core design duplicates a guide or additional case for ${id}`);
  }
}

for (const [id, link] of Object.entries(links)) {
  const item = cases.find((entry) => entry.id === id);
  if (!item) throw new Error(`Automation link has no case: ${id}`);
  if (link.automationFile && !fs.existsSync(path.join(root, link.automationFile))) {
    throw new Error(`Linked automation is missing: ${link.automationFile}`);
  }
  item.automationFile = link.automationFile || null;
  item.automationScope = link.automationScope || null;
  item.lastEvidence = link.lastEvidence || null;
}

const requirementList = sourceRows.map((row) => ({
  id: row.requirement_id,
  module: row.module,
  priority: row.priority,
  implementationState: row.implementation_state,
  acceptance: row.requirement_and_acceptance,
  qaFocus: row.qa_focus,
  knownGapIds: row.known_gap_ids ? row.known_gap_ids.split(/\s*,\s*/).filter(Boolean) : [],
  caseIds: cases
    .filter((item) => item.requirementIds.includes(row.requirement_id))
    .map((item) => item.id),
}));

const catalog = {
  source: 'Zeouf BRD v1.5 and QA guide snapshot from website commit 481a090',
  requirementCount: requirementList.length,
  caseCount: cases.length,
  requirements: requirementList,
  cases,
};

fs.writeFileSync(path.join(inputDir, 'case-catalog.json'), `${JSON.stringify(catalog, null, 2)}\n`);
fs.writeFileSync(path.join(inputDir, 'CASE_CATALOG.md'), renderMarkdown(catalog));
process.stdout.write(
  `Mapped ${requirementList.length} requirements to ${cases.length} cases (${cases.filter((item) => item.designStatus === 'guide-specified').length} guide-specified, ${cases.filter((item) => item.designStatus === 'curated').length} curated, ${cases.filter((item) => item.designStatus === 'needs-detailed-steps').length} need detailed steps).\n`,
);

function addCase(item) {
  if (caseIds.has(item.id)) throw new Error(`Duplicate case ID: ${item.id}`);
  if (!item.environment) throw new Error(`Case ${item.id} has no execution environment`);
  for (const id of item.requirementIds) {
    if (!requirements.has(id))
      throw new Error(`Case ${item.id} references unknown requirement ${id}`);
  }
  caseIds.add(item.id);
  cases.push({ ...item, automationFile: null, automationScope: null, lastEvidence: null });
}

function parseRequirementReferences(value) {
  const result = [];
  const pattern = /\b([A-Z][A-Z0-9]+)-(\d{2})(?:[–-](\d{2}))?\b/g;
  for (const match of value.matchAll(pattern)) {
    const [, prefix, firstText, lastText] = match;
    const first = Number(firstText);
    const last = lastText ? Number(lastText) : first;
    if (last < first || last - first > 20)
      throw new Error(`Invalid requirement range: ${match[0]}`);
    for (let number = first; number <= last; number += 1) {
      const id = `${prefix}-${String(number).padStart(2, '0')}`;
      if (!result.includes(id)) result.push(id);
    }
  }
  if (!result.length) throw new Error(`No requirement IDs in guide case: ${value}`);
  return result;
}

function parseCsv(input) {
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;
  const text = input.replace(/^\uFEFF/, '');
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (character === '"') {
      if (quoted && text[index + 1] === '"') {
        field += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (character === ',' && !quoted) {
      row.push(field);
      field = '';
    } else if ((character === '\n' || character === '\r') && !quoted) {
      if (character === '\r' && text[index + 1] === '\n') index += 1;
      row.push(field);
      if (row.some((cell) => cell !== '')) rows.push(row);
      row = [];
      field = '';
    } else {
      field += character;
    }
  }
  if (quoted) throw new Error('Unclosed CSV quote');
  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }
  const [headers, ...values] = rows;
  return values.map((cells) => {
    if (cells.length !== headers.length) throw new Error('Unexpected CSV column count');
    return Object.fromEntries(headers.map((header, index) => [header, cells[index]]));
  });
}

function renderMarkdown(data) {
  const guideCount = data.cases.filter((item) => item.designStatus === 'guide-specified').length;
  const lines = [
    '# Zeouf requirement-to-case catalog',
    '',
    `Source: ${data.source}.`,
    '',
    `This is a **first-pass planning inventory**, not an execution report: ${data.requirementCount} requirements map to ${data.caseCount} case records. ${guideCount} cases come from the QA guide; ${data.cases.filter((item) => item.designStatus === 'curated').length} are curated additions; ${data.cases.filter((item) => item.designStatus === 'needs-detailed-steps').length} are requirement-backed placeholders. Scenarios still need tester review and may need more boundary cases, fixtures and detailed steps. Existing automation is not counted as verified coverage until linked and reviewed.`,
    '',
    '| Case ID | Requirements | Priority | Environment | Design | Automation |',
    '| --- | --- | --- | --- | --- | --- |',
  ];
  for (const item of data.cases) {
    const priorities = [...new Set(item.requirementIds.map((id) => requirements.get(id).priority))];
    const automation = item.automationFile
      ? `\`${item.automationFile}\` (${item.automationScope})`
      : 'Unlinked';
    lines.push(
      `| ${item.id} | ${item.requirementIds.join(', ')} | ${priorities.join(', ')} | ${item.environment} | ${item.designStatus} | ${automation} |`,
    );
  }
  lines.push('', '## Case scenarios', '');
  for (const item of data.cases) {
    lines.push(
      `### ${item.id}`,
      '',
      `- Requirements: ${item.requirementIds.join(', ')}`,
      `- Environment: ${item.environment}`,
      `- Mode: ${item.mode}`,
      `- Scenario: ${item.scenario}`,
      `- Automation: ${item.automationFile ? `\`${item.automationFile}\` (${item.automationScope})` : 'Unlinked'}`,
      '',
    );
  }
  lines.push('Read `case-catalog.json` for the source acceptance text and QA focus.', '');
  return lines.join('\n');
}

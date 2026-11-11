'use strict';
const element = (id) => document.getElementById(id);
const node = (tag, text, className) => {
  const result = document.createElement(tag);
  result.textContent = text;
  if (className) result.className = className;
  return result;
};
let cases = [],
  selected = null,
  active = null,
  selectedRun = null;
async function api(url, options) {
  const response = await fetch(url, options);
  const data = await response.json();
  if (!response.ok) throw new Error(data.error);
  return data;
}
function renderCases() {
  const query = element('search').value.toLowerCase();
  element('cases').replaceChildren(
    ...cases
      .filter((item) =>
        JSON.stringify([item.id, item.requirementIds, item.scenario]).toLowerCase().includes(query),
      )
      .map((item) => {
        const button = node('button', '', 'case-row');
        button.setAttribute('aria-pressed', String(selected?.id === item.id));
        button.append(node('strong', item.id), node('span', item.scenario));
        button.onclick = () => selectCase(item);
        return button;
      }),
  );
}
function updateAction() {
  element('run').disabled = !selected?.runnableFiles.length || Boolean(active);
}
function selectCase(item) {
  selected = item;
  element('case-id').textContent = item.id;
  element('case-title').textContent = item.title || item.scenario;
  element('scenario').textContent = item.automationScope || item.scenario;
  element('requirements').replaceChildren(...item.requirementIds.map((id) => node('span', id)));
  const checks = [...item.checks, ...item.otherChecks];
  element('checks').replaceChildren(
    ...(checks.length
      ? checks.map((check) => {
          const row = node('div', '', 'check');
          row.append(node('strong', check.id), node('span', check.scope));
          return row;
        })
      : [
          node(
            'p',
            'No executable check is mapped. Prerequisites or a scope decision remain open.',
          ),
        ]),
  );
  element('run-scope').textContent = item.runnableFiles.length
    ? `Runs all tests in ${item.runnableFiles.length} reviewed public-safe file(s). This batch can cover other cases. No retries; hosted build revision is unknown.`
    : 'Use the documented isolated, native, integration, or manual workflow for this case.';
  element('message').textContent = '';
  updateAction();
  renderCases();
}
async function showRun(id) {
  selectedRun = id;
  const job = await api(`/api/runs/${id}`);
  const status = node('p', `Run ${job.status}`, `status ${job.status}`);
  const detail = element('run-detail');
  detail.replaceChildren(
    status,
    node('p', job.scope),
    node('p', job.error || `${job.files.length} file(s) · ${job.startedAt}`),
  );
  for (const check of job.checks || [])
    detail.append(node('p', `${check.outcome}: ${check.title}`));
  if (job.log) {
    const disclosure = document.createElement('details');
    disclosure.append(node('summary', 'Runner log'), node('pre', job.log));
    detail.append(disclosure);
  }
}
async function refreshRuns() {
  const data = await api('/api/runs');
  active = data.active;
  updateAction();
  element('run-count').textContent = data.jobs.length;
  element('runs').replaceChildren(
    ...data.jobs.map((job) => {
      const button = node('button', '', 'run-row');
      button.append(
        node('strong', job.caseId),
        node('span', job.status, `status ${job.status}`),
        node('span', ` · ${new Date(job.startedAt).toLocaleString()}`),
      );
      button.onclick = () => showRun(job.id).catch(showError);
      return button;
    }),
  );
  if (!data.jobs.length)
    element('runs').append(node('p', 'No saved workspace runs yet.', 'panel-head'));
  if (selectedRun && data.jobs.some((job) => job.id === selectedRun)) await showRun(selectedRun);
}
function showError(error) {
  element('message').textContent = error.message;
}
element('search').addEventListener('input', renderCases);
element('run').onclick = async () => {
  try {
    element('run').disabled = true;
    const job = await api('/api/run', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-workspace-token': document.querySelector('meta[name="workspace-token"]').content,
      },
      body: JSON.stringify({ caseId: selected.id }),
    });
    selectedRun = job.id;
    element('message').textContent = 'Batch started. Results will appear in Run evidence.';
    await refreshRuns();
  } catch (error) {
    showError(error);
    updateAction();
  }
};
(async () => {
  const data = await api('/api/cases');
  cases = data.cases;
  element('case-count').textContent = cases.length;
  element('linked-count').textContent = cases.filter(
    (item) => item.checks.length || item.otherChecks.length,
  ).length;
  renderCases();
  await refreshRuns();
  setInterval(() => refreshRuns().catch(showError), 2500);
})().catch(showError);

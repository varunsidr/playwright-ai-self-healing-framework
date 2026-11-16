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
  element('inspect').disabled = !selected?.runnableFiles.length || Boolean(active);
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
  if (job.kind === 'inspection') {
    detail.append(
      node('p', 'Inspection does not establish acceptance. Recordings are unverified drafts.'),
    );
    for (const event of job.interventions || [])
      detail.append(node('p', `${event.action}: ${event.status || event.detail || ''}`));
    for (const recording of job.recordings || []) {
      const link = node('a', `View recording draft: ${recording.file}`);
      link.href = `/api/runs/${job.id}/recordings/${recording.file}`;
      link.target = '_blank';
      link.rel = 'noopener';
      detail.append(link);
    }
    if (job.status === 'running') {
      const controls = node('div', '', 'action');
      for (const [action, label] of [
        ['dashboard', 'Open browser controls'],
        ['resume', 'Resume test'],
        ['step', 'Next test action'],
        ['record-start', 'Start recording'],
        ['record-stop', 'Save recording draft'],
        ['stop', 'End inspection'],
      ]) {
        const button = node('button', label);
        button.disabled = !job.session && action !== 'stop';
        button.onclick = async () => {
          button.disabled = true;
          try {
            await api('/api/control', postOptions({ runId: job.id, action }));
            await refreshRuns();
          } catch (error) {
            showError(error);
            button.disabled = false;
          }
        };
        controls.append(button);
      }
      detail.append(controls);
    } else {
      const verify = node('button', 'Run fresh automated verification');
      verify.disabled = Boolean(active);
      verify.onclick = () => startRun('/api/run', job.caseId, job.id).catch(showError);
      detail.append(verify);
    }
  }
  if (job.verificationOf)
    detail.append(node('p', `Fresh verification after inspection ${job.verificationOf}`));
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
function postOptions(body) {
  return {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-workspace-token': document.querySelector('meta[name="workspace-token"]').content,
    },
    body: JSON.stringify(body),
  };
}
async function startRun(endpoint, caseId, verificationOf) {
  try {
    element('run').disabled = true;
    element('inspect').disabled = true;
    const job = await api(
      endpoint,
      postOptions({ caseId, ...(verificationOf ? { verificationOf } : {}) }),
    );
    selectedRun = job.id;
    element('message').textContent =
      endpoint === '/api/inspect'
        ? 'Inspection started. Browser controls appear in Run evidence when the session attaches.'
        : 'Batch started. Results will appear in Run evidence.';
    await refreshRuns();
  } catch (error) {
    showError(error);
    updateAction();
  }
}
element('run').onclick = () => startRun('/api/run', selected.id);
element('inspect').onclick = () => startRun('/api/inspect', selected.id);
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

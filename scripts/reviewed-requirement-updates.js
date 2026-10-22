'use strict';

/** Combine scoped reviews without transferring the newest revision to older requirements. */
function combineReviewedUpdates(batches) {
  const requirements = [];
  const cases = [];
  const requirementIds = new Set();
  const caseIds = new Set();
  for (const batch of batches) {
    if (
      batch.schemaVersion !== 1 ||
      !/^[a-f0-9]{40}$/.test(batch.sourceRevision) ||
      !batch.source ||
      !batch.reviewSummary ||
      !batch.reviewEvidence ||
      !batch.reviewedAt ||
      !Number.isFinite(Date.parse(batch.reviewedAt)) ||
      !Array.isArray(batch.sourceDocuments) ||
      !batch.sourceDocuments.length ||
      batch.sourceDocuments.some((document) => {
        try {
          const url = new URL(document);
          return (
            url.protocol !== 'https:' ||
            !url.pathname.includes('/blob/' + batch.sourceRevision + '/')
          );
        } catch {
          return true;
        }
      }) ||
      !Array.isArray(batch.requirements) ||
      !Array.isArray(batch.cases)
    )
      throw new Error('Invalid reviewed requirement updates or missing source provenance');
    const currentRequirements = new Set(batch.requirements.map((item) => item.id));
    for (const [entries, output, ids, label] of [
      [batch.requirements, requirements, requirementIds, 'requirement'],
      [batch.cases, cases, caseIds, 'case'],
    ]) {
      for (const item of entries) {
        if (!item.id || ids.has(item.id))
          throw new Error('Duplicate or missing reviewed ' + label + ': ' + item.id);
        ids.add(item.id);
        output.push({
          ...item,
          sourceRevision: batch.sourceRevision,
          ...(label === 'case' ? { reviewedRequirementIds: [...currentRequirements] } : {}),
        });
      }
    }
  }
  return { source: batches.map((batch) => batch.source).join('; '), requirements, cases };
}

module.exports = { combineReviewedUpdates };

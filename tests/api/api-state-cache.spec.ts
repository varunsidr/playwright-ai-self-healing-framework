import { test, expect } from '../../fixtures/api-fixtures';
import { clearStateCache, withSharedState } from '../../utils/api-state-cache';

const CACHE_SCOPE = 'api-state-cache-test';

test('shared state cache reuses created values', async () => {
  clearStateCache(CACHE_SCOPE);

  const first = await withSharedState('demo-prefix', CACHE_SCOPE, async () => ({
    id: 'n-123',
    createdAt: Date.now(),
  }));

  const second = await withSharedState('demo-prefix', CACHE_SCOPE, async () => ({
    id: 'should-not-be-used',
    createdAt: 0,
  }));

  expect(second).toEqual(first);
  expect(second.id).toBe('n-123');

  clearStateCache(CACHE_SCOPE);
});

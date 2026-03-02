import { describe, expect, it } from 'vitest';
import { computeEmptyState } from '@/composables/useRestaurantsList';

describe('computeEmptyState', () => {
  it('returns true when not loading, no error, and no data', () => {
    expect(computeEmptyState(false, null, 0)).toBe(true);
  });

  it('returns false when loading', () => {
    expect(computeEmptyState(true, null, 0)).toBe(false);
  });
});


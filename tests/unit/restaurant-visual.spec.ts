import { beforeEach, describe, expect, it, vi } from 'vitest';
import { resolveRestaurantVisualAsset } from '@/services/restaurantAssets';
import { trackEvent } from '@/utils/telemetry';

vi.mock('@/utils/telemetry', () => ({
  trackEvent: vi.fn()
}));

const trackEventMock = vi.mocked(trackEvent);

beforeEach(() => {
  trackEventMock.mockClear();
});

describe('resolveRestaurantVisualAsset', () => {
  it('returns mapped asset when cuisine exists', () => {
    const asset = resolveRestaurantVisualAsset('fine-dining', 'lazy');
    expect(asset.isFallback).toBe(false);
    expect(asset.assetKey).toBe('fine-dining');
  });

  it('uses heuristic mapping when cuisine contains keyword', () => {
    const asset = resolveRestaurantVisualAsset('Sushi Omakase', 'lazy');
    expect(asset.isFallback).toBe(false);
    expect(asset.assetKey).toBe('sushi');
  });

  it('resolves alias cuisines to known assets', () => {
    const asset = resolveRestaurantVisualAsset('fusion-lounge', 'lazy');
    expect(asset.assetKey).toBe('fusion');
  });

  it('returns default fallback for unknown cuisine and tracks telemetry', () => {
    const asset = resolveRestaurantVisualAsset('unknown', 'eager');
    expect(asset.isFallback).toBe(true);
    expect(asset.assetKey).toBe('default');
    expect(trackEventMock).toHaveBeenCalledWith('restaurants_image_mapping_missing', { cuisineType: 'unknown' });
    expect(trackEventMock).toHaveBeenCalledWith(
      'asset_fallback_shown',
      expect.objectContaining({ reason: 'mapping-missing', requestedCuisine: 'unknown' })
    );
  });
});

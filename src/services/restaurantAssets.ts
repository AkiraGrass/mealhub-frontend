import type { ImageLoadMode, RestaurantVisualAsset } from '@/types/restaurant-visual';
import { buildRestaurantImagePath } from '@/utils/image';
import { trackEvent } from '@/utils/telemetry';

interface RestaurantImageMappingEntry {
  image: string;
  alt: string;
}

const DEFAULT_ASSET_KEY = 'default';

const RESTAURANT_IMAGE_MAPPING: Record<string, RestaurantImageMappingEntry> = {
  'fine-dining': { image: 'fine-dining.svg', alt: '精緻餐廳主題圖片' },
  'modern-bistro': { image: 'bistro.svg', alt: '現代餐酒館風格圖片' },
  'bbq-house': { image: 'grill.svg', alt: '炭烤餐廳風格圖片' },
  cafe: { image: 'cafe.svg', alt: '咖啡廳與輕食風格圖片' },
  ramen: { image: 'ramen.svg', alt: '亞洲麵食餐廳風格圖片' },
  seafood: { image: 'seafood.svg', alt: '海鮮酒吧主題圖片' },
  sushi: { image: 'sushi.svg', alt: '壽司與日式無菜單主題圖片' },
  steakhouse: { image: 'steakhouse.svg', alt: '牛排餐館主題圖片' },
  vegan: { image: 'vegan.svg', alt: '蔬食花園餐廳圖片' },
  dessert: { image: 'dessert.svg', alt: '甜點酒吧主題圖片' },
  tapas: { image: 'tapas.svg', alt: '西班牙小吃餐酒館圖片' },
  mexican: { image: 'mexican.svg', alt: '墨西哥風味餐廳圖片' },
  fusion: { image: 'bistro.svg', alt: '融合料理餐酒館圖片' }
};

const DEFAULT_ENTRY: RestaurantImageMappingEntry = {
  image: 'default.svg',
  alt: '餐廳預設圖片'
};

const CUISINE_SYNONYMS: Record<string, RegExp[]> = {
  'fine-dining': [/(fine|chef|tasting|michelin)/],
  'modern-bistro': [/(bistro|brasserie|gastropub)/],
  'bbq-house': [/(bbq|barbecue|smoke|grill)/],
  cafe: [/(cafe|coffee|brunch)/],
  ramen: [/(ramen|noodle|izakaya)/],
  seafood: [/(seafood|oyster|shellfish|maris)/],
  sushi: [/(sushi|omakase|nigiri)/],
  steakhouse: [/(steak|chophouse)/],
  vegan: [/(vegan|plant|green|botanical)/],
  dessert: [/(dessert|patisserie|sweet)/],
  tapas: [/(tapas|mezze|small-plates)/],
  mexican: [/(mexican|cantina|taqueria)/]
};

const normalizeCuisineType = (value: string | null | undefined): string | null => {
  if (!value) {
    return null;
  }
  const trimmed = value.trim().toLowerCase();
  if (!trimmed) {
    return null;
  }
  return trimmed.replace(/[_\s]+/g, '-');
};

const CUISINE_ALIAS_TO_KEY: Record<string, string> = {
  'fusion-lounge': 'fusion',
  'seafood-bar': 'seafood',
  'brunch-club': 'cafe'
};

const resolveAssetKey = (normalized: string | null): string | null => {
  if (!normalized) {
    return null;
  }
  if (RESTAURANT_IMAGE_MAPPING[normalized]) {
    return normalized;
  }
  const aliasKey = CUISINE_ALIAS_TO_KEY[normalized];
  if (aliasKey) {
    return aliasKey;
  }
  for (const [key, patterns] of Object.entries(CUISINE_SYNONYMS)) {
    if (patterns.some((pattern) => pattern.test(normalized))) {
      return key;
    }
  }
  return null;
};

const buildAsset = (
  assetKey: string,
  entry: RestaurantImageMappingEntry,
  loadMode: ImageLoadMode,
  isFallback: boolean
): RestaurantVisualAsset => ({
  assetKey,
  imagePath: buildRestaurantImagePath(entry.image),
  altText: entry.alt,
  loadMode,
  isFallback
});

export const getDefaultRestaurantAsset = (loadMode: ImageLoadMode): RestaurantVisualAsset =>
  buildAsset(DEFAULT_ASSET_KEY, DEFAULT_ENTRY, loadMode, true);

export const resolveRestaurantVisualAsset = (
  cuisineType: string | null | undefined,
  loadMode: ImageLoadMode
): RestaurantVisualAsset => {
  const normalized = normalizeCuisineType(cuisineType);
  const assetKey = resolveAssetKey(normalized);
  if (assetKey) {
    return buildAsset(assetKey, RESTAURANT_IMAGE_MAPPING[assetKey], loadMode, false);
  }
  const missingKey = normalized ?? 'unknown';
  trackEvent('restaurants_image_mapping_missing', { cuisineType: missingKey });
  trackEvent('asset_fallback_shown', {
    assetKey: DEFAULT_ASSET_KEY,
    reason: 'mapping-missing',
    requestedCuisine: missingKey
  });
  return getDefaultRestaurantAsset(loadMode);
};

export const restaurantImageKeys = Object.keys(RESTAURANT_IMAGE_MAPPING);

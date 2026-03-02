export type ImageLoadMode = 'lazy' | 'eager';

export interface RestaurantVisualAsset {
  assetKey: string;
  imagePath: string;
  altText: string;
  isFallback: boolean;
  loadMode: ImageLoadMode;
}

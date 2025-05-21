// 画像サイズの定義
export type ImageSize = 'S' | 'M' | 'L';

// 画像ファイルの型定義
export interface ImageFile {
  id: number;
  filename: string;
  size: ImageSize;
  path: string;
}

// CDN URL設定（必要に応じて環境変数から取得する実装に変更可能）
export const CDN_URL = process.env.NEXT_PUBLIC_CLOUDFRONT_URL || '';

// 画像サイズに応じたスケール係数の定義
export const SIZE_SCALES = {
  S: 1.5,
  M: 2.5,
  L: 4.0
};

// 画像サイズに応じたZ位置（深度）設定
export const SIZE_Z_POSITIONS = {
  S: 10,
  M: 5,
  L: 0
};

// スクロール効果の設定
export const SCROLL_SETTINGS = {
  damping: 0.2,  // スクロールの減衰係数
  pages: 5,      // スクロールページ数
  distance: 0.5  // スクロール距離係数
};

// アニメーション設定
export const ANIMATION_SETTINGS = {
  zoomFactor: 0.3,    // ズーム効果の強さ
  transitionSpeed: 0.15,  // 遷移の速さ
  rotationFactor: 0.02    // 回転効果の強さ
};

// 画像ファイルのリスト
export const imageFiles: ImageFile[] = [
  { id: 1, filename: '1L.webp', size: 'L', path: `${CDN_URL}/pepe/1L.webp` },
  { id: 2, filename: '2M.webp', size: 'M', path: `${CDN_URL}/pepe/2M.webp` },
  { id: 3, filename: '3S.webp', size: 'S', path: `${CDN_URL}/pepe/3S.webp` },
  { id: 4, filename: '4S.webp', size: 'S', path: `${CDN_URL}/pepe/4S.webp` },
  { id: 5, filename: '5M.webp', size: 'M', path: `${CDN_URL}/pepe/5M.webp` },
  { id: 6, filename: '6L.webp', size: 'L', path: `${CDN_URL}/pepe/6L.webp` },
  { id: 7, filename: '7M.webp', size: 'M', path: `${CDN_URL}/pepe/7M.webp` },
  { id: 8, filename: '8M.webp', size: 'M', path: `${CDN_URL}/pepe/8M.webp` },
  { id: 9, filename: '9L.webp', size: 'L', path: `${CDN_URL}/pepe/9L.webp` },
  { id: 10, filename: '10S.webp', size: 'S', path: `${CDN_URL}/pepe/10S.webp` },
  { id: 11, filename: '11S.webp', size: 'S', path: `${CDN_URL}/pepe/11S.webp` },
  { id: 12, filename: '12M.webp', size: 'M', path: `${CDN_URL}/pepe/12M.webp` },
  { id: 13, filename: '13L.webp', size: 'L', path: `${CDN_URL}/pepe/13L.webp` },
  { id: 14, filename: '14L.webp', size: 'L', path: `${CDN_URL}/pepe/14L.webp` },
  { id: 15, filename: '15M.webp', size: 'M', path: `${CDN_URL}/pepe/15M.webp` },
  { id: 16, filename: '16S.webp', size: 'S', path: `${CDN_URL}/pepe/16S.webp` },
  { id: 17, filename: '17S.webp', size: 'S', path: `${CDN_URL}/pepe/17S.webp` },
  { id: 18, filename: '18M.webp', size: 'M', path: `${CDN_URL}/pepe/18M.webp` },
  { id: 19, filename: '19L.webp', size: 'L', path: `${CDN_URL}/pepe/19L.webp` },
  { id: 20, filename: '20L.webp', size: 'L', path: `${CDN_URL}/pepe/20L.webp` },
  { id: 21, filename: '21S.webp', size: 'S', path: `${CDN_URL}/pepe/21S.webp` },
  { id: 22, filename: '22S.webp', size: 'S', path: `${CDN_URL}/pepe/22S.webp` },
  { id: 23, filename: '23L.webp', size: 'L', path: `${CDN_URL}/pepe/23L.webp` },
  { id: 24, filename: '24L.webp', size: 'L', path: `${CDN_URL}/pepe/24L.webp` },
  { id: 25, filename: '25S.webp', size: 'S', path: `${CDN_URL}/pepe/25S.webp` },
  { id: 26, filename: '26S.webp', size: 'S', path: `${CDN_URL}/pepe/26S.webp` },
  { id: 27, filename: '27S.webp', size: 'S', path: `${CDN_URL}/pepe/27S.webp` },
  { id: 28, filename: '28L.webp', size: 'L', path: `${CDN_URL}/pepe/28L.webp` },
  { id: 29, filename: '29S.webp', size: 'S', path: `${CDN_URL}/pepe/29S.webp` },
  { id: 30, filename: '30S.webp', size: 'S', path: `${CDN_URL}/pepe/30S.webp` },
  { id: 31, filename: '31M.webp', size: 'M', path: `${CDN_URL}/pepe/31M.webp` },
  { id: 32, filename: '32M.webp', size: 'M', path: `${CDN_URL}/pepe/32M.webp` },
  { id: 33, filename: '33M.webp', size: 'M', path: `${CDN_URL}/pepe/33M.webp` },
  { id: 34, filename: '34S.webp', size: 'S', path: `${CDN_URL}/pepe/34S.webp` },
  { id: 35, filename: '35L.webp', size: 'L', path: `${CDN_URL}/pepe/35L.webp` },
];

// テキスト要素の配置設定
export const TYPOGRAPHY_POSITIONS = [
  { text: "PEPE", position: [-2, 0, 12], anchorX: "left" },
  { text: "GALLERY", position: [2, -2, 12], anchorX: "right" },
  { text: "COLLECTION", position: [0, -4.5, 12], anchorX: "center" }
];
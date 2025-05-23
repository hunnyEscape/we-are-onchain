// src/app/components/floating-images-fix/constants.ts

export type ImageSize = 'L' | 'M' | 'S';

export interface ImageFile {
  id: number;
  filename: string;
  size: ImageSize;
  path: string;
}

// CDNパス
const CDN_URL = process.env.NEXT_PUBLIC_CLOUDFRONT_URL || "";

// 画面サイズ判定（768px以下をモバイルとする）
const isMobile = () => {
  if (typeof window === 'undefined') return false;
  return window.innerWidth <= 768;
};

// 画像パスを生成する関数
const generateImagePath = (filename: string): string => {
  const folder = isMobile() ? 'gallery-small' : 'pepe';
  return `${CDN_URL}/${folder}/${filename}`;
};

// 画像ファイルリスト
export const imageFiles: ImageFile[] = [
  { id: 1, filename: '1L.webp', size: 'L', path: generateImagePath('1L.webp') },
  { id: 2, filename: '2M.webp', size: 'M', path: generateImagePath('2M.webp') },
  { id: 3, filename: '3S.webp', size: 'S', path: generateImagePath('3S.webp') },
  { id: 4, filename: '4S.webp', size: 'S', path: generateImagePath('4S.webp') },
  { id: 5, filename: '5M.webp', size: 'M', path: generateImagePath('5M.webp') },
  { id: 6, filename: '6L.webp', size: 'L', path: generateImagePath('6L.webp') },
  { id: 7, filename: '7M.webp', size: 'M', path: generateImagePath('7M.webp') },
  { id: 8, filename: '8M.webp', size: 'M', path: generateImagePath('8M.webp') },
  { id: 9, filename: '9L.webp', size: 'L', path: generateImagePath('9L.webp') },
  { id: 10, filename: '10S.webp', size: 'S', path: generateImagePath('10S.webp') },
  { id: 11, filename: '11S.webp', size: 'S', path: generateImagePath('11S.webp') },
  { id: 12, filename: '12M.webp', size: 'M', path: generateImagePath('12M.webp') },
  { id: 13, filename: '13L.webp', size: 'L', path: generateImagePath('13L.webp') },
  { id: 14, filename: '14L.webp', size: 'L', path: generateImagePath('14L.webp') },
  { id: 15, filename: '15M.webp', size: 'M', path: generateImagePath('15M.webp') },
  { id: 16, filename: '16S.webp', size: 'S', path: generateImagePath('16S.webp') },
  { id: 17, filename: '17S.webp', size: 'S', path: generateImagePath('17S.webp') },
  { id: 18, filename: '18M.webp', size: 'M', path: generateImagePath('18M.webp') },
  { id: 19, filename: '19L.webp', size: 'L', path: generateImagePath('19L.webp') },
  { id: 20, filename: '20L.webp', size: 'L', path: generateImagePath('20L.webp') },
  { id: 21, filename: '21S.webp', size: 'S', path: generateImagePath('21S.webp') },
  { id: 22, filename: '22S.webp', size: 'S', path: generateImagePath('22S.webp') },
  { id: 23, filename: '23L.webp', size: 'L', path: generateImagePath('23L.webp') },
  { id: 24, filename: '24L.webp', size: 'L', path: generateImagePath('24L.webp') },
  { id: 25, filename: '25S.webp', size: 'S', path: generateImagePath('25S.webp') },
  { id: 26, filename: '26S.webp', size: 'S', path: generateImagePath('26S.webp') },
  { id: 27, filename: '27S.webp', size: 'S', path: generateImagePath('27S.webp') },
  { id: 28, filename: '28L.webp', size: 'L', path: generateImagePath('28L.webp') },
  { id: 29, filename: '29S.webp', size: 'S', path: generateImagePath('29S.webp') },
  { id: 30, filename: '30S.webp', size: 'S', path: generateImagePath('30S.webp') },
  { id: 31, filename: '31M.webp', size: 'M', path: generateImagePath('31M.webp') },
  { id: 32, filename: '32M.webp', size: 'M', path: generateImagePath('32M.webp') },
  { id: 33, filename: '33M.webp', size: 'M', path: generateImagePath('33M.webp') },
  { id: 34, filename: '34S.webp', size: 'S', path: generateImagePath('34S.webp') },
  { id: 35, filename: '35L.webp', size: 'L', path: generateImagePath('35L.webp') },
];

// サイズに応じたスケール（デスクトップ用）
const DESKTOP_SCALE_MAP: Record<ImageSize, number> = {
  L: 4,
  M: 3,
  S: 2,
};

// サイズに応じたスケール（モバイル用）
const MOBILE_SCALE_MAP: Record<ImageSize, number> = {
  L: 2.5,
  M: 2,
  S: 1.5,
};

// 現在の画面サイズに応じたスケールマップを取得
export const getScaleMap = (): Record<ImageSize, number> => {
  return isMobile() ? MOBILE_SCALE_MAP : DESKTOP_SCALE_MAP;
};

// 後方互換性のため
export const SCALE_MAP = DESKTOP_SCALE_MAP;
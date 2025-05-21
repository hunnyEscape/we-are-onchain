// 画像ファイルの情報を定義
export type SizeType = 'S' | 'M' | 'L';

export interface ImageFile {
	id: number;
	filename: string;
	size: SizeType;
	path: string;
}

// 環境変数からCDN URLを取得
const CDN_URL = process.env.NEXT_PUBLIC_CLOUDFRONT_URL || '';

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
	{ id: 26, filename: '32M.webp', size: 'M', path: `${CDN_URL}/pepe/32M.webp` },
	{ id: 27, filename: '33M.webp', size: 'M', path: `${CDN_URL}/pepe/33M.webp` },
	{ id: 28, filename: '34S.webp', size: 'S', path: `${CDN_URL}/pepe/34S.webp` },
	{ id: 29, filename: '35L.webp', size: 'L', path: `${CDN_URL}/pepe/35L.webp` },
];

// アニメーション設定
export const animationConfig = {
	// サイズごとの設定
	sizeConfig: {
		S: {
			scale: [0.6, 0.7],      // 60-70%のスケール
			speed: [0.08, 0.12],    // 速い上昇速度
			rotationSpeed: [0.002, 0.01],
			zPosition: [-5, -2],    // 奥側に配置
			opacity: [0.7, 0.9]     // やや透明
		},
		M: {
			scale: [0.8, 0.9],      // 80-90%のスケール
			speed: [0.05, 0.08],    // 中程度の上昇速度
			rotationSpeed: [0.001, 0.005],
			zPosition: [-1, 1],     // 中間に配置
			opacity: [0.8, 1]       // ほぼ不透明
		},
		L: {
			scale: [1.0, 1.1],      // 100-110%のスケール
			speed: [0.03, 0.05],    // ゆっくりした上昇速度
			rotationSpeed: [0.0005, 0.002],
			zPosition: [2, 5],      // 手前に配置
			opacity: [0.9, 1]       // 完全に不透明
		}
	},

	// 共通設定
	common: {
		duration: [20000, 40000],   // アニメーション期間 (20-40秒)
		yRange: [-20, 30],          // Y軸の動きの範囲 (下から上へ)
		xRange: [-15, 15],          // X軸の動きの範囲（ランダム）
		delayRange: [0, 10000],     // 開始遅延のランダム範囲 (0-10秒)
	}
};
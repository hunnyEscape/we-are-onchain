// src/app/components/layered-gallery/constants.ts

import { LayeredImageConfig, LayeredGallerySectionConfig, ResponsiveConfig } from './types'
import { imageFiles, ImageFile, ImageSize } from '../floating-images-fix/constants'

/**
 * 画面サイズ判定関数
 */
const isMobile = (): boolean => {
	if (typeof window === 'undefined') return false
	return window.innerWidth <= 768
}

/**
 * CDNパス設定（直接定義）
 */
const CDN_URL = process.env.NEXT_PUBLIC_CLOUDFRONT_URL || ""

/**
 * 画像パスを生成する関数（floating-images-fixと同じロジック）
 */
const generateImagePath = (filename: string): string => {
	const folder = isMobile() ? 'pepe/gallery-small' : 'pepe'
	return `${CDN_URL}/${folder}/${filename}`
}

/**
 * 基本画像データ（パスなし）- floating-images-fixから基本データのみ抽出
 */
const baseImageData: Array<{ id: number; filename: string; size: ImageSize }> = [
	{ id: 1, filename: '1L.webp', size: 'L' },
	{ id: 2, filename: '2M.webp', size: 'M' },
	{ id: 3, filename: '3S.webp', size: 'S' },
	{ id: 4, filename: '4S.webp', size: 'S' },
	{ id: 5, filename: '5M.webp', size: 'M' },
	{ id: 6, filename: '6L.webp', size: 'L' },
	{ id: 7, filename: '7M.webp', size: 'M' },
	{ id: 8, filename: '8M.webp', size: 'M' },
	{ id: 9, filename: '9L.webp', size: 'L' },
	{ id: 10, filename: '10S.webp', size: 'S' },
	{ id: 11, filename: '11S.webp', size: 'S' },
	{ id: 12, filename: '12M.webp', size: 'M' },
	{ id: 13, filename: '13L.webp', size: 'L' },
	{ id: 14, filename: '14L.webp', size: 'L' },
	{ id: 15, filename: '15M.webp', size: 'M' },
	{ id: 16, filename: '16S.webp', size: 'S' },
	{ id: 17, filename: '17S.webp', size: 'S' },
	{ id: 18, filename: '18M.webp', size: 'M' },
	{ id: 19, filename: '19L.webp', size: 'L' },
	{ id: 20, filename: '20L.webp', size: 'L' },
	{ id: 21, filename: '21S.webp', size: 'S' },
	{ id: 22, filename: '22S.webp', size: 'S' },
	{ id: 23, filename: '23L.webp', size: 'L' },
	{ id: 24, filename: '24L.webp', size: 'L' },
	{ id: 25, filename: '25S.webp', size: 'S' },
	{ id: 26, filename: '26S.webp', size: 'S' },
	{ id: 27, filename: '27S.webp', size: 'S' },
	{ id: 28, filename: '28L.webp', size: 'L' },
	{ id: 29, filename: '29S.webp', size: 'S' },
	{ id: 30, filename: '30S.webp', size: 'S' },
	{ id: 31, filename: '31M.webp', size: 'M' },
	{ id: 32, filename: '32M.webp', size: 'M' },
	{ id: 33, filename: '33M.webp', size: 'M' },
	{ id: 34, filename: '34S.webp', size: 'S' },
	{ id: 35, filename: '35L.webp', size: 'L' },
]

/**
 * 実行時に正しいパスで画像ファイルを生成
 */
const generateRuntimeImageFiles = (): ImageFile[] => {
	return baseImageData.map(image => ({
		...image,
		path: generateImagePath(image.filename)
	}))
}

/**
 * レスポンシブ設定
 */
export const RESPONSIVE_CONFIG: ResponsiveConfig = {
	desktop: {
		scaleMultiplier: 1.0,
		positionMultiplier: 1.0,
		zoomMultiplier: 1.0,
	},
	mobile: {
		scaleMultiplier: 0.7,
		positionMultiplier: 0.8,
		zoomMultiplier: 0.8,
	}
}

/**
 * セクション基本設定
 */
export const SECTION_CONFIG: LayeredGallerySectionConfig = {
	sectionHeight: 4, // 4倍のviewport height
	padding: {
		top: 100,
		bottom: 100,
	},
	camera: {
		fov: 75,
		near: 0.1,
		far: 1000,
		position: {
			x: 0,
			y: 0,
			z: 10,
		}
	},
	responsive: RESPONSIVE_CONFIG,
}

/**
 * サイズ別基本Z位置
 */
const Z_POSITIONS = {
	L: 0,   // 最前面
	M: -5,  // 中間
	S: -10, // 最奥
} as const

/**
 * サイズ別基本スケール
 */
const BASE_SCALES = {
	L: 4,
	M: 3,
	S: 2,
} as const

/**
 * 拡張画像設定を生成（最適化版）
 * 実行時に正しいパスで画像設定を作成
 */
export const layeredImageConfigs: LayeredImageConfig[] = (() => {
	// 実行時に画像ファイルリストを取得
	const runtimeImageFiles = generateRuntimeImageFiles()

	return runtimeImageFiles.map((image, index) => {
		const totalImages = runtimeImageFiles.length
		const progress = index / (totalImages - 1) // 0-1の進行度

		// 基本位置の計算（縦一列ではなく、ある程度ランダムに配置）
		const baseX = (Math.random() - 0.5) * 8 // -4 to 4
		const baseY = progress * 20 - 10 // -10 to 10（縦方向に分散）
		const baseZ = Z_POSITIONS[image.size]

		// スクロール範囲の計算（各画像が異なるタイミングでズーム）
		const scrollStart = Math.max(0, progress - 0.15) // 少し重なりを持たせる
		const scrollEnd = Math.min(1, progress + 0.15)
		const scrollPeak = progress

		// ズーム倍率の計算（サイズに応じて調整）
		const baseScale = BASE_SCALES[image.size]
		const zoomMin = baseScale * 0.5
		const zoomMax = baseScale * 1.8

		// 視差速度（奥にあるものほど遅く）
		const parallaxSpeed = image.size === 'L' ? 1.0 :
			image.size === 'M' ? 0.85 : 0.7

		// イージングカーブ（バリエーションを持たせる）
		const easingTypes = ['easeInOut', 'easeOutQuart', 'easeInQuart'] as const
		const easing = easingTypes[index % easingTypes.length]

		return {
			...image,
			position: {
				x: baseX,
				y: baseY,
				z: baseZ,
			},
			randomOffset: {
				x: 1.5, // ±1.5の範囲でランダムオフセット
				y: 1.0, // ±1.0の範囲でランダムオフセット
			},
			scrollRange: {
				start: scrollStart,
				end: scrollEnd,
				peak: scrollPeak,
			},
			zoom: {
				min: zoomMin,
				max: zoomMax,
				curve: easing,
			},
			parallax: {
				speed: parallaxSpeed,
			},
			// 一部の画像に微細な回転を追加
			...(index % 7 === 0 && {
				rotation: {
					axis: ['x', 'y', 'z'][index % 3] as 'x' | 'y' | 'z',
					amount: (Math.random() - 0.5) * 0.2, // ±0.1ラジアン
				}
			}),
		}
	})
})()

/**
 * 特定画像の設定をカスタマイズ
 * 重要な画像やアクセント画像の個別調整
 */
export const customizeImageConfig = (configs: LayeredImageConfig[]): LayeredImageConfig[] => {
	return configs.map((config, index) => {
		// 最初と最後の画像は特別扱い
		if (index === 0) {
			return {
				...config,
				position: { ...config.position, x: 0, y: -12 }, // 中央配置
				zoom: { ...config.zoom, max: config.zoom.max * 1.2 }, // より大きくズーム
				scrollRange: { start: 0, end: 0.3, peak: 0.15 }, // 早めに登場
			}
		}

		if (index === configs.length - 1) {
			return {
				...config,
				position: { ...config.position, x: 0, y: 12 }, // 中央配置
				zoom: { ...config.zoom, max: config.zoom.max * 1.2 }, // より大きくズーム
				scrollRange: { start: 0.7, end: 1, peak: 0.85 }, // 最後に登場
			}
		}

		// Lサイズの画像は少し特別扱い
		if (config.size === 'L') {
			return {
				...config,
				zoom: { ...config.zoom, max: config.zoom.max * 1.1 }, // 少し大きめ
			}
		}

		return config
	})
}

/**
 * 最終的な画像設定
 */
export const LAYERED_IMAGES = customizeImageConfig(layeredImageConfigs)

/**
 * デバッグ用設定（本番環境向けに最適化）
 */
export const DEBUG_CONFIG = {
	showBoundingBoxes: false,        // 境界ボックス表示 - 本番では false
	showScrollRanges: true,          // スクロール範囲表示
	showPositionLabels: false,       // 位置ラベル表示 - 本番では false
	logAnimationStates: false,       // アニメーション状態ログ - 本番では false に設定
	logImagePaths: true,             // 画像パス確認ログ
	showTestImage: true,             // テスト画像表示
}

/**
 * テスト用：画像パスの確認（ログ制限付き）
 */
let pathsLogged = false // 一度だけログ出力
export const logImagePaths = () => {
	if (DEBUG_CONFIG.logImagePaths && !pathsLogged) {
		pathsLogged = true
		const testPaths = generateRuntimeImageFiles().slice(0, 5) // 最初の5枚をテスト
		console.log('[LayeredGallery] Image paths test:', {
			CDN_URL,
			envVariable: process.env.NEXT_PUBLIC_CLOUDFRONT_URL,
			isMobile: isMobile(),
			folder: isMobile() ? 'pepe/gallery-small' : 'pepe',
			samplePaths: testPaths.map(img => ({
				filename: img.filename,
				path: img.path,
				fullURL: `${CDN_URL}/${isMobile() ? 'pepe/gallery-small' : 'pepe'}/${img.filename}`
			}))
		})
	}
}

/**
 * アニメーション設定（最適化）
 */
export const ANIMATION_CONFIG = {
	// スクロール制御
	scrollDamping: 0.05,           // より軽いダンピング
	scrollThreshold: 0.005,        // より大きな閾値で更新頻度を下げる

	// フレームレート制御
	targetFPS: 60,
	animationTolerance: 0.005,     // より大きな許容値

	// イージング設定
	easingStiffness: 0.1,
	easingDamping: 0.8,
}

/**
 * 現在の設定を取得（レスポンシブ対応・キャッシュ付き）
 */
let cachedConfig: any = null
let lastWindowWidth = 0

export const getCurrentConfig = () => {
	// キャッシュチェック
	if (typeof window !== 'undefined') {
		const currentWidth = window.innerWidth
		if (cachedConfig && lastWindowWidth === currentWidth) {
			return cachedConfig
		}
		lastWindowWidth = currentWidth
	}

	const mobile = isMobile()

	// デバッグ：画像パスの確認（一度だけ）
	logImagePaths()

	cachedConfig = {
		images: LAYERED_IMAGES,
		section: SECTION_CONFIG,
		responsive: mobile ? RESPONSIVE_CONFIG.mobile : RESPONSIVE_CONFIG.desktop,
		animation: ANIMATION_CONFIG,
		debug: DEBUG_CONFIG,
	}

	return cachedConfig
}
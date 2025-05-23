// src/app/components/layered-gallery/utils/zoomCalculator.ts

import { EasingType } from '../types'
import { getCurrentConfig } from '../constants'

/**
 * ズーム計算の中心ロジック
 */

/**
 * イージング関数の実装
 */
export const easeInOut = (t: number): number => {
	return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
}

export const easeIn = (t: number): number => {
	return t * t
}

export const easeOut = (t: number): number => {
	return t * (2 - t)
}

export const easeInQuart = (t: number): number => {
	return t * t * t * t
}

export const easeOutQuart = (t: number): number => {
	return 1 - (--t) * t * t * t
}

export const linear = (t: number): number => {
	return t
}

/**
 * イージングタイプに応じた関数を取得
 */
export const getEasingFunction = (easingType: EasingType): ((t: number) => number) => {
	switch (easingType) {
		case 'easeIn':
			return easeIn
		case 'easeOut':
			return easeOut
		case 'easeInOut':
			return easeInOut
		case 'easeInQuart':
			return easeInQuart
		case 'easeOutQuart':
			return easeOutQuart
		case 'linear':
		default:
			return linear
	}
}

/**
 * ズームスケールを計算
 * @param zoomConfig ズーム設定
 * @param localProgress 画像のローカル進行度（0-1）
 * @param isInRange 画像がスクロール範囲内にあるか
 * @returns 計算されたスケール値
 */
export const calculateZoomScale = (
	zoomConfig: { min: number; max: number; curve: EasingType },
	localProgress: number,
	isInRange: boolean
): number => {
	const config = getCurrentConfig()

	if (!isInRange) {
		return zoomConfig.min * config.responsive.scaleMultiplier
	}

	// ベルカーブ（山型）のズーム効果を計算
	// 0 → peak → 1 の進行で min → max → min のズーム
	const easingFunc = getEasingFunction(zoomConfig.curve)

	// 山型カーブの計算（0.5で最大値）
	const normalizedProgress = Math.abs(0.5 - localProgress) * 2 // 0-1の範囲で中央が0
	const invertedProgress = 1 - normalizedProgress // 中央で最大値
	const easedProgress = easingFunc(invertedProgress)

	// スケール値の補間
	const scaleRange = zoomConfig.max - zoomConfig.min
	const calculatedScale = zoomConfig.min + (scaleRange * easedProgress)

	// レスポンシブ調整を適用
	const responsiveScale = calculatedScale * config.responsive.scaleMultiplier

	// 最小値の保証
	return Math.max(zoomConfig.min * config.responsive.scaleMultiplier, responsiveScale)
}

/**
 * 透明度を計算
 * @param localProgress 画像のローカル進行度（0-1）
 * @param isInRange 画像がスクロール範囲内にあるか
 * @param globalProgress 全体のスクロール進行度
 * @param scrollRange 画像のスクロール範囲
 * @returns 計算された透明度（0-1）
 */
export const calculateOpacity = (
	localProgress: number,
	isInRange: boolean,
	globalProgress: number,
	scrollRange: { start: number; end: number; peak: number }
): number => {
	const baseOpacity = 0.7 // 基本透明度
	const fadeDistance = 0.1 // フェード距離（範囲の10%）

	if (!isInRange) {
		// 範囲外での距離に基づくフェード
		const distanceFromRange = Math.min(
			Math.abs(globalProgress - scrollRange.start),
			Math.abs(globalProgress - scrollRange.end)
		)

		if (distanceFromRange > fadeDistance) {
			return 0 // 完全に透明
		}

		// 範囲端でのフェード効果
		const fadeRatio = 1 - (distanceFromRange / fadeDistance)
		return baseOpacity * fadeRatio * 0.3 // 範囲外は薄く表示
	}

	// 範囲内でのフェードイン/アウト
	const fadeInThreshold = 0.1
	const fadeOutThreshold = 0.9

	let opacityMultiplier = 1

	// フェードイン（範囲開始時）
	if (localProgress < fadeInThreshold) {
		opacityMultiplier = localProgress / fadeInThreshold
	}
	// フェードアウト（範囲終了時）
	else if (localProgress > fadeOutThreshold) {
		opacityMultiplier = (1 - localProgress) / (1 - fadeOutThreshold)
	}

	// ピーク付近で最大透明度
	const peakDistance = Math.abs(localProgress - 0.5) // ピークは中央（0.5）
	const peakBonus = Math.max(0, 1 - peakDistance * 2) * 0.3 // ピーク付近で30%ボーナス

	const finalOpacity = baseOpacity * opacityMultiplier + peakBonus
	return Math.max(0, Math.min(1, finalOpacity))
}

/**
 * 視差効果によるポジションオフセットを計算
 * @param basePosition 基本位置
 * @param parallaxSpeed 視差速度（1.0が標準）
 * @param globalProgress 全体のスクロール進行度
 * @returns オフセット値
 */
export const calculateParallaxOffset = (
	basePosition: { x: number; y: number; z: number },
	parallaxSpeed: number,
	globalProgress: number
): { x: number; y: number; z: number } => {
	// Y軸方向の視差効果（主要）
	const yOffset = globalProgress * 20 * (1 - parallaxSpeed)

	// X軸方向の微細な視差効果
	const xOffset = globalProgress * 2 * (1 - parallaxSpeed) * Math.sin(globalProgress * Math.PI)

	// Z軸方向の奥行き効果
	const zOffset = globalProgress * 5 * (1 - parallaxSpeed)

	return {
		x: xOffset,
		y: yOffset,
		z: zOffset,
	}
}

/**
 * スケールに基づく相対的な位置調整
 * 大きくズームした画像は画面中央に寄る効果
 */
export const calculateScaleBasedPositionAdjustment = (
	basePosition: { x: number; y: number; z: number },
	currentScale: number,
	maxScale: number
): { x: number; y: number; z: number } => {
	// スケールが大きいほど中央に寄る効果
	const scaleRatio = Math.min(1, currentScale / maxScale)
	const centeringStrength = scaleRatio * 0.3 // 最大30%中央に寄る

	return {
		x: basePosition.x * (1 - centeringStrength),
		y: basePosition.y * (1 - centeringStrength),
		z: basePosition.z,
	}
}

/**
 * 画像サイズと距離に基づくLOD（Level of Detail）計算
 */
export const calculateLOD = (
	imageSize: 'L' | 'M' | 'S',
	distanceFromCamera: number,
	currentScale: number
): 1 | 2 | 3 => {
	// 基本LODレベル
	let baseLOD: 1 | 2 | 3 = imageSize === 'L' ? 1 : imageSize === 'M' ? 2 : 3

	// 距離による調整
	if (distanceFromCamera > 15) {
		baseLOD = Math.min(3, baseLOD + 1) as 1 | 2 | 3
	} else if (distanceFromCamera < 5) {
		baseLOD = Math.max(1, baseLOD - 1) as 1 | 2 | 3
	}

	// スケールによる調整
	if (currentScale > 2) {
		baseLOD = Math.max(1, baseLOD - 1) as 1 | 2 | 3
	} else if (currentScale < 0.5) {
		baseLOD = Math.min(3, baseLOD + 1) as 1 | 2 | 3
	}

	return baseLOD
}

/**
 * 複数画像の相対的ズーム調整
 * 同時に表示される画像間でのズーム競合を解決
 */
export const adjustRelativeZoom = (
	imageConfigs: Array<{
		id: number
		currentScale: number
		priority: number
		scrollRange: { start: number; end: number }
	}>,
	globalProgress: number
): Array<{ id: number; adjustedScale: number }> => {
	// 現在のスクロール位置で影響を受ける画像を特定
	const activeImages = imageConfigs.filter(config => {
		return globalProgress >= config.scrollRange.start - 0.1 &&
			globalProgress <= config.scrollRange.end + 0.1
	})

	// 優先度に基づくスケール調整
	return activeImages.map(config => {
		let adjustedScale = config.currentScale

		// 他の画像との競合チェック
		const competitors = activeImages.filter(other =>
			other.id !== config.id &&
			Math.abs(other.priority - config.priority) < 2
		)

		if (competitors.length > 0) {
			// 競合がある場合、優先度に基づいて調整
			const competitorScales = competitors.map(c => c.currentScale)
			const maxCompetitorScale = Math.max(...competitorScales)

			if (config.currentScale > maxCompetitorScale && config.priority < Math.max(...competitors.map(c => c.priority))) {
				// 優先度が低いのにスケールが大きい場合、調整
				adjustedScale = config.currentScale * 0.8
			}
		}

		return {
			id: config.id,
			adjustedScale: Math.max(0.1, adjustedScale)
		}
	})
}

/**
 * デバッグ用：ズーム状態の詳細情報を生成
 */
export const generateZoomDebugInfo = (
	zoomConfig: { min: number; max: number; curve: EasingType },
	localProgress: number,
	calculatedScale: number,
	opacity: number
) => {
	return {
		config: zoomConfig,
		progress: {
			local: localProgress.toFixed(3),
			eased: getEasingFunction(zoomConfig.curve)(localProgress).toFixed(3),
		},
		scale: {
			calculated: calculatedScale.toFixed(3),
			min: zoomConfig.min.toFixed(3),
			max: zoomConfig.max.toFixed(3),
			range: (zoomConfig.max - zoomConfig.min).toFixed(3),
		},
		opacity: opacity.toFixed(3),
	}
}
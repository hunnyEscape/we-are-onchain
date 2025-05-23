// src/app/components/layered-gallery/hooks/useImageAnimation.ts

'use client'

import { useState, useEffect, useMemo } from 'react'
import { LayeredImageConfig, ScrollProgress, ImageAnimationState } from '../types'
import { useImageScrollRange } from './useScrollProgress'
import { calculateScrollBasedPosition, calculateFinalPosition } from '../utils/positionCalculator'
import { calculateZoomScale, calculateOpacity } from '../utils/zoomCalculator'
import { DEBUG_CONFIG, ANIMATION_CONFIG } from '../constants'

/**
 * 個別画像のアニメーション状態を管理するカスタムフック
 */
export const useImageAnimation = (
	imageConfig: LayeredImageConfig,
	globalScrollProgress: ScrollProgress | null
): ImageAnimationState | null => {

	// 画像のスクロール範囲内判定
	const { isInRange, localProgress } = useImageScrollRange(
		imageConfig.scrollRange,
		globalScrollProgress
	)

	// アニメーション状態
	const [animationState, setAnimationState] = useState<ImageAnimationState | null>(null)

	// 基本位置の計算（メモ化）
	const basePosition = useMemo(() => {
		return calculateFinalPosition(imageConfig, imageConfig.id)
	}, [imageConfig])

	// アニメーション状態の計算
	useEffect(() => {
		if (!globalScrollProgress) {
			setAnimationState(null)
			return
		}

		// 現在位置の計算
		const currentPosition = calculateScrollBasedPosition(
			basePosition,
			imageConfig,
			globalScrollProgress
		)

		// ズームスケールの計算
		const zoomScale = calculateZoomScale(
			imageConfig.zoom,
			localProgress,
			isInRange
		)

		// 透明度の計算
		const opacity = calculateOpacity(
			localProgress,
			isInRange,
			globalScrollProgress.overall,
			imageConfig.scrollRange
		)

		// 回転の計算
		let rotation = { x: 0, y: 0, z: 0 }
		if (imageConfig.rotation && isInRange) {
			const rotationProgress = Math.sin(localProgress * Math.PI) // サイン波で滑らかな回転
			const { axis, amount } = imageConfig.rotation

			switch (axis) {
				case 'x':
					rotation.x = rotationProgress * amount
					break
				case 'y':
					rotation.y = rotationProgress * amount
					break
				case 'z':
					rotation.z = rotationProgress * amount
					break
			}
		}

		// 可視性の判定
		const isVisible = opacity > ANIMATION_CONFIG.animationTolerance
		const isAnimating = isInRange && isVisible

		const newState: ImageAnimationState = {
			position: currentPosition,
			scale: zoomScale,
			opacity,
			rotation,
			isAnimating,
			isVisible,
		}

		// 状態の変化をチェック（パフォーマンス最適化）
		setAnimationState(prevState => {
			if (!prevState) return newState

			// 微細な変化は無視
			const positionChanged =
				Math.abs(prevState.position.x - newState.position.x) > ANIMATION_CONFIG.animationTolerance ||
				Math.abs(prevState.position.y - newState.position.y) > ANIMATION_CONFIG.animationTolerance ||
				Math.abs(prevState.position.z - newState.position.z) > ANIMATION_CONFIG.animationTolerance

			const scaleChanged =
				Math.abs(prevState.scale - newState.scale) > ANIMATION_CONFIG.animationTolerance

			const opacityChanged =
				Math.abs(prevState.opacity - newState.opacity) > ANIMATION_CONFIG.animationTolerance

			const rotationChanged =
				Math.abs(prevState.rotation.x - newState.rotation.x) > ANIMATION_CONFIG.animationTolerance ||
				Math.abs(prevState.rotation.y - newState.rotation.y) > ANIMATION_CONFIG.animationTolerance ||
				Math.abs(prevState.rotation.z - newState.rotation.z) > ANIMATION_CONFIG.animationTolerance

			const stateChanged =
				prevState.isAnimating !== newState.isAnimating ||
				prevState.isVisible !== newState.isVisible

			if (positionChanged || scaleChanged || opacityChanged || rotationChanged || stateChanged) {
				return newState
			}

			return prevState
		})

		// デバッグログ
		if (DEBUG_CONFIG.logAnimationStates && isInRange) {
			console.log(`[useImageAnimation] ${imageConfig.filename} animation updated:`, {
				localProgress: localProgress.toFixed(3),
				globalProgress: globalScrollProgress.overall.toFixed(3),
				isInRange,
				scale: zoomScale.toFixed(3),
				opacity: opacity.toFixed(3),
				position: {
					x: currentPosition.x.toFixed(2),
					y: currentPosition.y.toFixed(2),
					z: currentPosition.z.toFixed(2),
				},
			})
		}

	}, [
		globalScrollProgress,
		localProgress,
		isInRange,
		imageConfig,
		basePosition
	])

	return animationState
}

/**
 * 複数画像の一括アニメーション管理フック
 */
export const useMultipleImageAnimations = (
	imageConfigs: LayeredImageConfig[],
	globalScrollProgress: ScrollProgress | null
): (ImageAnimationState | null)[] => {

	const [animationStates, setAnimationStates] = useState<(ImageAnimationState | null)[]>([])

	useEffect(() => {
		if (!globalScrollProgress) {
			setAnimationStates(new Array(imageConfigs.length).fill(null))
			return
		}

		const newStates = imageConfigs.map(config => {
			// 各画像のアニメーション状態を個別計算
			const { isInRange, localProgress } = useImageScrollRange(
				config.scrollRange,
				globalScrollProgress
			)

			if (!isInRange) return null

			const basePosition = calculateFinalPosition(config, config.id)
			const currentPosition = calculateScrollBasedPosition(
				basePosition,
				config,
				globalScrollProgress
			)

			const zoomScale = calculateZoomScale(
				config.zoom,
				localProgress,
				isInRange
			)

			const opacity = calculateOpacity(
				localProgress,
				isInRange,
				globalScrollProgress.overall,
				config.scrollRange
			)

			let rotation = { x: 0, y: 0, z: 0 }
			if (config.rotation) {
				const rotationProgress = Math.sin(localProgress * Math.PI)
				const { axis, amount } = config.rotation

				switch (axis) {
					case 'x':
						rotation.x = rotationProgress * amount
						break
					case 'y':
						rotation.y = rotationProgress * amount
						break
					case 'z':
						rotation.z = rotationProgress * amount
						break
				}
			}

			return {
				position: currentPosition,
				scale: zoomScale,
				opacity,
				rotation,
				isAnimating: true,
				isVisible: opacity > ANIMATION_CONFIG.animationTolerance,
			}
		})

		setAnimationStates(newStates)

	}, [imageConfigs, globalScrollProgress])

	return animationStates
}

/**
 * アニメーション状態の統計情報を取得するフック
 */
export const useAnimationStats = (
	animationStates: (ImageAnimationState | null)[]
) => {
	const stats = useMemo(() => {
		const activeAnimations = animationStates.filter(state => state?.isAnimating).length
		const visibleImages = animationStates.filter(state => state?.isVisible).length
		const totalImages = animationStates.length

		const averageOpacity = animationStates.reduce((sum, state) => {
			return sum + (state?.opacity || 0)
		}, 0) / totalImages

		const averageScale = animationStates.reduce((sum, state) => {
			return sum + (state?.scale || 1)
		}, 0) / totalImages

		return {
			activeAnimations,
			visibleImages,
			totalImages,
			averageOpacity,
			averageScale,
			animationRatio: activeAnimations / totalImages,
			visibilityRatio: visibleImages / totalImages,
		}
	}, [animationStates])

	// パフォーマンス警告
	useEffect(() => {
		if (DEBUG_CONFIG.logAnimationStates && stats.activeAnimations > 10) {
			console.warn('[useAnimationStats] High number of active animations:', {
				active: stats.activeAnimations,
				total: stats.totalImages,
				ratio: stats.animationRatio,
			})
		}
	}, [stats])

	return stats
}

export default useImageAnimation
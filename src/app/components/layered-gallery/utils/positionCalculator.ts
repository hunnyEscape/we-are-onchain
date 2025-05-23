// src/app/components/layered-gallery/utils/positionCalculator.ts

import { LayeredImageConfig, ScrollProgress, ImageAnimationState } from '../types'
import { getCurrentConfig } from '../constants'

/**
 * 3D位置計算のユーティリティ関数群
 */

/**
 * ランダムオフセットを適用した最終位置を計算
 */
export const calculateFinalPosition = (
	imageConfig: LayeredImageConfig,
	seed?: number
): { x: number; y: number; z: number } => {
	const config = getCurrentConfig()
	const { position, randomOffset } = imageConfig

	// シード値を使った擬似ランダム生成（一貫性のため）
	const pseudoRandom = (index: number): number => {
		const seedValue = seed || imageConfig.id
		const x = Math.sin(seedValue * index) * 10000
		return x - Math.floor(x)
	}

	let finalX = position.x
	let finalY = position.y
	let finalZ = position.z

	// ランダムオフセットの適用
	if (randomOffset) {
		const offsetX = (pseudoRandom(1) - 0.5) * 2 * randomOffset.x
		const offsetY = (pseudoRandom(2) - 0.5) * 2 * randomOffset.y

		finalX += offsetX
		finalY += offsetY
	}

	// レスポンシブ調整の適用
	finalX *= config.responsive.positionMultiplier
	finalY *= config.responsive.positionMultiplier

	return { x: finalX, y: finalY, z: finalZ }
}

/**
 * スクロール進行度に基づく動的位置を計算
 */
export const calculateScrollBasedPosition = (
	basePosition: { x: number; y: number; z: number },
	imageConfig: LayeredImageConfig,
	scrollProgress: ScrollProgress
): { x: number; y: number; z: number } => {
	const { parallax } = imageConfig
	const { overall } = scrollProgress

	// 視差効果による位置調整
	const parallaxOffset = overall * 20 * (1 - parallax.speed) // 視差速度に基づくオフセット

	return {
		x: basePosition.x,
		y: basePosition.y - parallaxOffset, // Y軸方向に視差効果を適用
		z: basePosition.z,
	}
}

/**
 * 画像間の衝突検出
 */
export const checkCollision = (
	pos1: { x: number; y: number; z: number },
	pos2: { x: number; y: number; z: number },
	size1: number,
	size2: number,
	threshold: number = 0.5
): boolean => {
	const distance = Math.sqrt(
		Math.pow(pos1.x - pos2.x, 2) +
		Math.pow(pos1.y - pos2.y, 2) +
		Math.pow(pos1.z - pos2.z, 2)
	)

	const combinedRadius = (size1 + size2) * threshold
	return distance < combinedRadius
}

/**
 * 衝突を回避する位置を計算
 */
export const resolveCollisions = (
	positions: Array<{ config: LayeredImageConfig; position: { x: number; y: number; z: number } }>,
	maxIterations: number = 10
): Array<{ x: number; y: number; z: number }> => {
	const resolvedPositions = positions.map(p => ({ ...p.position }))

	for (let iteration = 0; iteration < maxIterations; iteration++) {
		let hasCollision = false

		for (let i = 0; i < positions.length; i++) {
			for (let j = i + 1; j < positions.length; j++) {
				const pos1 = resolvedPositions[i]
				const pos2 = resolvedPositions[j]
				const config1 = positions[i].config
				const config2 = positions[j].config

				// 同じZ軸レベルでの衝突のみチェック
				if (Math.abs(pos1.z - pos2.z) > 2) continue

				const size1 = config1.zoom.max
				const size2 = config2.zoom.max

				if (checkCollision(pos1, pos2, size1, size2)) {
					hasCollision = true

					// 衝突解決：より重要度の低い画像を移動
					const moveIndex = config1.size === 'L' ? j :
						config2.size === 'L' ? i :
							config1.size === 'M' ? j : i

					// 移動方向の計算
					const dx = pos2.x - pos1.x
					const dy = pos2.y - pos1.y
					const distance = Math.sqrt(dx * dx + dy * dy) || 1

					const moveDistance = (size1 + size2) * 0.6
					const moveX = (dx / distance) * moveDistance
					const moveY = (dy / distance) * moveDistance

					if (moveIndex === i) {
						resolvedPositions[i].x -= moveX * 0.5
						resolvedPositions[i].y -= moveY * 0.5
					} else {
						resolvedPositions[j].x += moveX * 0.5
						resolvedPositions[j].y += moveY * 0.5
					}
				}
			}
		}

		if (!hasCollision) break
	}

	return resolvedPositions
}

/**
 * 画面境界内での位置制限
 */
export const constrainToBounds = (
	position: { x: number; y: number; z: number },
	bounds: { minX: number; maxX: number; minY: number; maxY: number },
	margin: number = 1
): { x: number; y: number; z: number } => {
	return {
		x: Math.max(bounds.minX + margin, Math.min(bounds.maxX - margin, position.x)),
		y: Math.max(bounds.minY + margin, Math.min(bounds.maxY - margin, position.y)),
		z: position.z,
	}
}

/**
 * 複数画像の位置を一括計算
 */
export const calculateAllPositions = (
	imageConfigs: LayeredImageConfig[],
	scrollProgress: ScrollProgress | null,
	options: {
		resolveCollisions?: boolean
		constrainToBounds?: boolean
		bounds?: { minX: number; maxX: number; minY: number; maxY: number }
	} = {}
): Array<{ x: number; y: number; z: number }> => {
	// 基本位置の計算
	const basePositions = imageConfigs.map((config, index) => ({
		config,
		position: calculateFinalPosition(config, config.id + index)
	}))

	// スクロール効果の適用
	let finalPositions = basePositions.map(({ config, position }) => {
		if (scrollProgress) {
			return calculateScrollBasedPosition(position, config, scrollProgress)
		}
		return position
	})

	// 衝突解決
	if (options.resolveCollisions) {
		finalPositions = resolveCollisions(basePositions)
	}

	// 境界制限
	if (options.constrainToBounds && options.bounds) {
		finalPositions = finalPositions.map(position =>
			constrainToBounds(position, options.bounds!)
		)
	}

	return finalPositions
}

/**
 * デバッグ用：位置情報の可視化データを生成
 */
export const generatePositionDebugData = (
	imageConfigs: LayeredImageConfig[],
	positions: Array<{ x: number; y: number; z: number }>
) => {
	return imageConfigs.map((config, index) => ({
		id: config.id,
		filename: config.filename,
		size: config.size,
		originalPosition: config.position,
		finalPosition: positions[index],
		scrollRange: config.scrollRange,
		zoomRange: config.zoom,
	}))
}

/**
 * カメラからの距離を計算
 */
export const calculateDistanceFromCamera = (
	position: { x: number; y: number; z: number },
	cameraPosition: { x: number; y: number; z: number } = { x: 0, y: 0, z: 10 }
): number => {
	return Math.sqrt(
		Math.pow(position.x - cameraPosition.x, 2) +
		Math.pow(position.y - cameraPosition.y, 2) +
		Math.pow(position.z - cameraPosition.z, 2)
	)
}

/**
 * 視野角内にあるかどうかを判定
 */
export const isInViewFrustum = (
	position: { x: number; y: number; z: number },
	cameraPosition: { x: number; y: number; z: number },
	fov: number,
	aspect: number,
	near: number,
	far: number
): boolean => {
	const distance = calculateDistanceFromCamera(position, cameraPosition)

	// 距離チェック
	if (distance < near || distance > far) return false

	// 視野角チェック（簡略化）
	const dx = Math.abs(position.x - cameraPosition.x)
	const dy = Math.abs(position.y - cameraPosition.y)
	const dz = Math.abs(position.z - cameraPosition.z)

	const fovRad = (fov * Math.PI) / 180
	const halfHeight = Math.tan(fovRad / 2) * dz
	const halfWidth = halfHeight * aspect

	return dx <= halfWidth && dy <= halfHeight
}
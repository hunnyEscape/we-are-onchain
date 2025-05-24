// src/app/components/layered-gallery/utils/positionCalculator.ts

import { LayeredImageConfig, ScrollProgress, ImageAnimationState } from '../types'
import { getCurrentConfig } from '../constants'

/**
 * 3D位置計算のユーティリティ関数群（レスポンシブ対応版）
 */

/**
 * ビューポートサイズに基づく画面情報
 */
interface ViewportInfo {
	width: number
	height: number
	aspectRatio: number
	isMobile: boolean
	isTablet: boolean
	isDesktop: boolean
}

/**
 * 現在のビューポート情報を取得
 */
export const getViewportInfo = (): ViewportInfo => {
	if (typeof window === 'undefined') {
		return {
			width: 1920,
			height: 1080,
			aspectRatio: 16 / 9,
			isMobile: false,
			isTablet: false,
			isDesktop: true
		}
	}

	const width = window.innerWidth
	const height = window.innerHeight
	const aspectRatio = width / height

	return {
		width,
		height,
		aspectRatio,
		isMobile: width <= 768,
		isTablet: width > 768 && width <= 1024,
		isDesktop: width > 1024
	}
}

/**
 * レスポンシブグリッド設定
 */
interface GridConfig {
	columns: number
	maxWidth: number
	spacing: {
		x: number
		y: number
	}
	bounds: {
		minX: number
		maxX: number
		minY: number
		maxY: number
	}
}

/**
 * ビューポートに応じたグリッド設定を取得
 */
export const getResponsiveGridConfig = (viewport: ViewportInfo): GridConfig => {
	if (viewport.isMobile) {
		return {
			columns: 3,
			maxWidth: 0.9, // ビューポート幅の90%
			spacing: { x: 2.5, y: 4 },
			bounds: { minX: -4, maxX: 4, minY: -15, maxY: 15 }
		}
	}

	if (viewport.isTablet) {
		return {
			columns: 5,
			maxWidth: 0.85, // ビューポート幅の85%
			spacing: { x: 3.0, y: 4.5 },
			bounds: { minX: -6, maxX: 6, minY: -20, maxY: 20 }
		}
	}

	// Desktop
	return {
		columns: 7,
		maxWidth: 0.8, // ビューポート幅の80%
		spacing: { x: 3.5, y: 5 },
		bounds: { minX: -10, maxX: 10, minY: -25, maxY: 25 }
	}
}

/**
 * 相対位置に基づく3D座標計算
 */
export const calculateRelativePosition = (
	imageConfig: LayeredImageConfig,
	index: number,
	totalImages: number,
	seed?: number
): { x: number; y: number; z: number } => {
	const viewport = getViewportInfo()
	const gridConfig = getResponsiveGridConfig(viewport)
	const config = getCurrentConfig()

	// グリッド位置の計算
	const { columns } = gridConfig
	const col = index % columns
	const row = Math.floor(index / columns)

	// 中央揃えのためのオフセット
	const centerOffset = (columns - 1) / 2

	// 基本X位置（相対値で計算）
	//const relativeX = (col - centerOffset) / centerOffset // -1 to 1
	const rawRelX = (col - centerOffset) / centerOffset // -1 to 1
	// pow < 1 で端が内側に寄る（0.8～1.0 の間を試してみてください）
	const easedRelX = Math.sign(rawRelX) * Math.pow(Math.abs(rawRelX), 0.8)
	const horizontalSpreadFactor = viewport.isMobile ? 0.8 : viewport.isTablet ? 0.9 : 0.7
	const relativeX = easedRelX

	const baseX = relativeX * gridConfig.bounds.maxX * gridConfig.maxWidth * horizontalSpreadFactor

	// 基本Y位置（縦方向の分散）
	const baseY = -row * gridConfig.spacing.y + (totalImages / columns) * gridConfig.spacing.y * 0.5

	// Z位置（サイズに応じた奥行き）
	const baseZ = imageConfig.size === 'L'? 0 : imageConfig.size === 'M' ? -5 : -10

	// 擬似ランダムオフセット（一貫性のため）
	const pseudoRandom = (index: number): number => {
		const seedValue = seed || imageConfig.id
		const x = Math.sin(seedValue * index) * 10000
		return x - Math.floor(x)
	}

	let finalX = baseX
	let finalY = baseY
	let finalZ = baseZ

	// ランダムオフセットの適用（ビューポートに応じて調整）
	if (imageConfig.randomOffset) {
		const offsetMultiplier = viewport.isMobile ? 0.5 : viewport.isTablet ? 0.75 : 1.0
		const offsetX = (pseudoRandom(1) - 0.5) * 2 * imageConfig.randomOffset.x * offsetMultiplier
		const offsetY = (pseudoRandom(2) - 0.5) * 2 * imageConfig.randomOffset.y * offsetMultiplier

		finalX += offsetX
		finalY += offsetY
	}

	// 境界制限の適用
	finalX = Math.max(gridConfig.bounds.minX, Math.min(gridConfig.bounds.maxX, finalX))
	finalY = Math.max(gridConfig.bounds.minY, Math.min(gridConfig.bounds.maxY, finalY))

	// レスポンシブ調整の適用
	finalX *= config.responsive.positionMultiplier
	finalY *= config.responsive.positionMultiplier

	return { x: finalX, y: finalY, z: finalZ }
}

/**
 * ランダムオフセットを適用した最終位置を計算（レスポンシブ対応版）
 */
export const calculateFinalPosition = (
	imageConfig: LayeredImageConfig,
	seed?: number,
	totalImages?: number,
	index?: number
): { x: number; y: number; z: number } => {
	// 新しい相対位置計算を使用
	if (typeof index === 'number' && typeof totalImages === 'number') {
		return calculateRelativePosition(imageConfig, index, totalImages, seed)
	}

	// フォールバック：従来の固定位置計算
	const config = getCurrentConfig()
	const { position, randomOffset } = imageConfig

	const pseudoRandom = (index: number): number => {
		const seedValue = seed || imageConfig.id
		const x = Math.sin(seedValue * index) * 10000
		return x - Math.floor(x)
	}

	let finalX = position.x
	let finalY = position.y
	let finalZ = position.z

	if (randomOffset) {
		const offsetX = (pseudoRandom(1) - 0.5) * 2 * randomOffset.x
		const offsetY = (pseudoRandom(2) - 0.5) * 2 * randomOffset.y

		finalX += offsetX
		finalY += offsetY
	}

	finalX *= config.responsive.positionMultiplier
	finalY *= config.responsive.positionMultiplier

	return { x: finalX, y: finalY, z: finalZ }
}

/**
 * スクロール進行度に基づく動的位置を計算（改良版）
 */
export const calculateScrollBasedPosition = (
	basePosition: { x: number; y: number; z: number },
	imageConfig: LayeredImageConfig,
	scrollProgress: ScrollProgress
): { x: number; y: number; z: number } => {
	const { parallax } = imageConfig
	const { overall } = scrollProgress
	const viewport = getViewportInfo()

	// ビューポートに応じた視差効果の調整
	const parallaxMultiplier = viewport.isMobile ? 15 : viewport.isTablet ? 18 : 20
	const parallaxOffset = overall * parallaxMultiplier * (1 - parallax.speed)

	// X軸方向の微細な揺れ（オプション）
	const lateralOffset = Math.sin(overall * Math.PI * 2) * 0.5 * (1 - parallax.speed)

	return {
		x: basePosition.x + lateralOffset,
		y: basePosition.y - parallaxOffset, // Y軸方向に視差効果を適用
		z: basePosition.z,
	}
}

/**
 * 画像間の衝突検出（レスポンシブ対応版）
 */
export const checkCollision = (
	pos1: { x: number; y: number; z: number },
	pos2: { x: number; y: number; z: number },
	size1: number,
	size2: number,
	threshold: number = 0.5
): boolean => {
	const viewport = getViewportInfo()

	// ビューポートに応じた衝突判定の調整
	const adjustedThreshold = viewport.isMobile ? threshold * 0.8 : threshold

	const distance = Math.sqrt(
		Math.pow(pos1.x - pos2.x, 2) +
		Math.pow(pos1.y - pos2.y, 2) +
		Math.pow(pos1.z - pos2.z, 2)
	)

	const combinedRadius = (size1 + size2) * adjustedThreshold
	return distance < combinedRadius
}

/**
 * レスポンシブ境界内での位置制限
 */
export const constrainToResponsiveBounds = (
	position: { x: number; y: number; z: number },
	margin: number = 1
): { x: number; y: number; z: number } => {
	const viewport = getViewportInfo()
	const gridConfig = getResponsiveGridConfig(viewport)

	return {
		x: Math.max(
			gridConfig.bounds.minX + margin,
			Math.min(gridConfig.bounds.maxX - margin, position.x)
		),
		y: Math.max(
			gridConfig.bounds.minY + margin,
			Math.min(gridConfig.bounds.maxY - margin, position.y)
		),
		z: position.z,
	}
}

/**
 * 複数画像の位置を一括計算（レスポンシブ対応版）
 */
export const calculateAllPositions = (
	imageConfigs: LayeredImageConfig[],
	scrollProgress: ScrollProgress | null,
	options: {
		resolveCollisions?: boolean
		constrainToBounds?: boolean
		useRelativePositioning?: boolean
	} = {}
): Array<{ x: number; y: number; z: number }> => {
	const { useRelativePositioning = true } = options

	// 基本位置の計算
	const basePositions = imageConfigs.map((config, index) => ({
		config,
		position: useRelativePositioning
			? calculateRelativePosition(config, index, imageConfigs.length, config.id)
			: calculateFinalPosition(config, config.id + index)
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

	// レスポンシブ境界制限
	if (options.constrainToBounds) {
		finalPositions = finalPositions.map(position =>
			constrainToResponsiveBounds(position)
		)
	}

	return finalPositions
}

/**
 * 衝突を回避する位置を計算（既存関数・変更なし）
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
 * カメラからの距離を計算（既存関数・変更なし）
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
 * 視野角内にあるかどうかを判定（既存関数・変更なし）
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

/**
 * デバッグ用：位置情報の可視化データを生成（レスポンシブ情報追加）
 */
export const generatePositionDebugData = (
	imageConfigs: LayeredImageConfig[],
	positions: Array<{ x: number; y: number; z: number }>
) => {
	const viewport = getViewportInfo()
	const gridConfig = getResponsiveGridConfig(viewport)

	return {
		viewport,
		gridConfig,
		images: imageConfigs.map((config, index) => ({
			id: config.id,
			filename: config.filename,
			size: config.size,
			originalPosition: config.position,
			finalPosition: positions[index],
			scrollRange: config.scrollRange,
			zoomRange: config.zoom,
		}))
	}
}
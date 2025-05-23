// src/app/components/layered-gallery/ImagePlane.tsx

'use client'

import React, { useRef, useMemo, useEffect, useState } from 'react'
import { LayeredImageConfig, ScrollProgress } from './types'
import { calculateFinalPosition } from './utils/positionCalculator'
import { DEBUG_CONFIG, getCurrentConfig } from './constants'

export interface ImagePlaneProps {
	imageConfig: LayeredImageConfig
	scrollProgress: ScrollProgress | null
	index: number
}

/**
 * 個別画像プレーンコンポーネント（クライアントサイドのみ）
 */
export const ImagePlane: React.FC<ImagePlaneProps> = ({
	imageConfig,
	scrollProgress,
	index
}) => {
	const [modules, setModules] = useState<any>(null)
	const meshRef = useRef<any>(null)
	const materialRef = useRef<any>(null)

	// Three.js関連モジュールの動的読み込み
	useEffect(() => {
		const loadModules = async () => {
			try {
				const [fiberModule, threeModule, animationModule] = await Promise.all([
					import('@react-three/fiber'),
					import('three'),
					import('./hooks/useImageAnimation')
				])

				setModules({
					useFrame: fiberModule.useFrame,
					useLoader: fiberModule.useLoader,
					TextureLoader: threeModule.TextureLoader,
					THREE: threeModule.default,
					useImageAnimation: animationModule.useImageAnimation
				})
			} catch (error) {
				console.error('[ImagePlane] Failed to load modules:', error)
			}
		}

		loadModules()
	}, [])

	// まだロード中の場合
	if (!modules) {
		return null // または簡単なプレースホルダー
	}

	return <ImagePlaneContent
		imageConfig={imageConfig}
		scrollProgress={scrollProgress}
		index={index}
		modules={modules}
		meshRef={meshRef}
		materialRef={materialRef}
	/>
}

/**
 * 実際の画像プレーンコンテンツ
 */
interface ImagePlaneContentProps {
	imageConfig: LayeredImageConfig
	scrollProgress: ScrollProgress | null
	index: number
	modules: any
	meshRef: React.RefObject<any>
	materialRef: React.RefObject<any>
}

const ImagePlaneContent: React.FC<ImagePlaneContentProps> = ({
	imageConfig,
	scrollProgress,
	index,
	modules,
	meshRef,
	materialRef
}) => {
	const { useFrame, useLoader, TextureLoader, THREE, useImageAnimation } = modules

	// 画像アニメーション状態の管理
	const animationState = useImageAnimation(imageConfig, scrollProgress)

	// 設定の取得
	const config = getCurrentConfig()

	// テクスチャの読み込み
	const texture = useLoader(TextureLoader, imageConfig.path)

	// テクスチャ設定の最適化
	useMemo(() => {
		if (texture) {
			texture.minFilter = THREE.LinearFilter
			texture.magFilter = THREE.LinearFilter
			texture.wrapS = THREE.ClampToEdgeWrapping
			texture.wrapT = THREE.ClampToEdgeWrapping
			texture.generateMipmaps = false

			if (DEBUG_CONFIG.logAnimationStates) {
				console.log(`[ImagePlane] Texture loaded for ${imageConfig.filename}:`, {
					size: `${texture.image.width}x${texture.image.height}`,
					format: texture.format,
				})
			}
		}
	}, [texture, imageConfig.filename, THREE])

	// 基本位置の計算（一度だけ）
	const basePosition = useMemo(() => {
		return calculateFinalPosition(imageConfig, imageConfig.id + index)
	}, [imageConfig, index])

	// プレーンのサイズ計算
	const planeSize = useMemo(() => {
		if (!texture) return [2, 2]

		const aspect = texture.image.width / texture.image.height
		const baseScale = config.responsive.scaleMultiplier

		// サイズに応じた基本スケール
		let sizeMultiplier = 1
		switch (imageConfig.size) {
			case 'L':
				sizeMultiplier = 1.2
				break
			case 'M':
				sizeMultiplier = 1.0
				break
			case 'S':
				sizeMultiplier = 0.8
				break
		}

		const width = 3 * aspect * baseScale * sizeMultiplier
		const height = 3 * baseScale * sizeMultiplier

		return [width, height]
	}, [texture, config.responsive.scaleMultiplier, imageConfig.size])

	// フレーム更新でアニメーション適用
	useFrame(() => {
		if (!meshRef.current || !materialRef.current || !animationState) return

		const mesh = meshRef.current
		const material = materialRef.current

		// 位置の更新
		mesh.position.set(
			animationState.position.x,
			animationState.position.y,
			animationState.position.z
		)

		// スケールの更新
		mesh.scale.setScalar(animationState.scale)

		// 透明度の更新
		material.opacity = animationState.opacity

		// 回転の更新
		if (imageConfig.rotation) {
			mesh.rotation.set(
				animationState.rotation.x,
				animationState.rotation.y,
				animationState.rotation.z
			)
		}

		// Z軸ソート用の更新
		mesh.renderOrder = -animationState.position.z
	})

	// デバッグ情報の表示
	useEffect(() => {
		if (DEBUG_CONFIG.logAnimationStates && animationState?.isAnimating) {
			console.log(`[ImagePlane] Animation state for ${imageConfig.filename}:`, {
				position: animationState.position,
				scale: animationState.scale,
				opacity: animationState.opacity,
				isVisible: animationState.isVisible,
			})
		}
	}, [animationState, imageConfig.filename])

	// エラーハンドリング
	const handleTextureError = (error: Error) => {
		console.error(`[ImagePlane] Failed to load texture for ${imageConfig.filename}:`, error)
	}

	// テクスチャがロードされていない場合のフォールバック
	if (!texture) {
		return (
			/* @ts-expect-error React Three Fiber JSX elements */
			<mesh
				ref={meshRef}
				position={[basePosition.x, basePosition.y, basePosition.z]}
			>
				{/* @ts-expect-error React Three Fiber JSX elements */}
				<planeGeometry args={planeSize} />
				{/* @ts-expect-error React Three Fiber JSX elements */}
				<meshBasicMaterial
					color={
						imageConfig.size === 'L' ? '#ff6b6b' :
							imageConfig.size === 'M' ? '#4ecdc4' : '#45b7d1'
					}
					opacity={0.3}
					transparent
				/>
			</mesh>
		)
	}

	return (
		/* @ts-expect-error React Three Fiber JSX elements */
		<group>
			{/* メイン画像プレーン */}
			{/* @ts-expect-error React Three Fiber JSX elements */}
			<mesh
				ref={meshRef}
				position={[basePosition.x, basePosition.y, basePosition.z]}
			>
				{/* @ts-expect-error React Three Fiber JSX elements */}
				<planeGeometry args={planeSize} />
				{/* @ts-expect-error React Three Fiber JSX elements */}
				<meshBasicMaterial
					ref={materialRef}
					map={texture}
					transparent
					opacity={0.7}
					side={THREE.DoubleSide}
					onError={handleTextureError}
				/>
			</mesh>

			{/* デバッグ用境界ボックス */}
			{DEBUG_CONFIG.showBoundingBoxes && (
				/* @ts-expect-error React Three Fiber JSX elements */
				<mesh position={[basePosition.x, basePosition.y, basePosition.z + 0.1]}>
					{/* @ts-expect-error React Three Fiber JSX elements */}
					<planeGeometry args={[planeSize[0] * 1.1, planeSize[1] * 1.1]} />
					{/* @ts-expect-error React Three Fiber JSX elements */}
					<meshBasicMaterial
						color="yellow"
						wireframe
						opacity={0.5}
						transparent
					/>
				</mesh>
			)}

			{/* デバッグ用ラベル */}
			{DEBUG_CONFIG.showPositionLabels && (
				/* @ts-expect-error React Three Fiber JSX elements */
				<mesh position={[basePosition.x, basePosition.y + planeSize[1] * 0.6, basePosition.z + 0.1]}>
					{/* @ts-expect-error React Three Fiber JSX elements */}
					<planeGeometry args={[1.5, 0.3]} />
					{/* @ts-expect-error React Three Fiber JSX elements */}
					<meshBasicMaterial color="black" opacity={0.8} transparent />
				</mesh>
			)}

			{/* スクロール範囲の可視化 */}
			{DEBUG_CONFIG.showScrollRanges && animationState?.isVisible && (
				/* @ts-expect-error React Three Fiber JSX elements */
				<mesh position={[basePosition.x + planeSize[0] * 0.6, basePosition.y, basePosition.z + 0.1]}>
					{/* @ts-expect-error React Three Fiber JSX elements */}
					<planeGeometry args={[0.2, planeSize[1]]} />
					{/* @ts-expect-error React Three Fiber JSX elements */}
					<meshBasicMaterial
						color={animationState.isAnimating ? "green" : "orange"}
						opacity={0.6}
						transparent
					/>
				</mesh>
			)}
		</group>
	)
}
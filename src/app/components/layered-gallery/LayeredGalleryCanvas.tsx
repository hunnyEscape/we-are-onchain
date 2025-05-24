'use client'

import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react'
import { LAYERED_IMAGES } from './constants'
import { calculateAllPositions, getViewportInfo, getResponsiveGridConfig } from './utils/positionCalculator'
import { useFrame, useThree } from '@react-three/fiber'
export interface LayeredGalleryCanvasProps {
	className?: string
}
const CameraController: React.FC<{
	scrollProgress: { overall: number }
	baseY: number
	offsetDown?: number
}> = ({ scrollProgress, baseY, offsetDown = 5 }) => {
	const { camera } = useThree()
	useFrame(() => {
		// 0〜1 の進行度に対して offsetDown だけ下げる
		camera.position.y = baseY - scrollProgress.overall * offsetDown
		camera.updateProjectionMatrix()
	})
	return null
}

/**
 * ビューポート監視フック
 */
const useViewportSize = () => {
	const [viewport, setViewport] = useState(() => getViewportInfo())

	useEffect(() => {
		const handleResize = () => {
			setViewport(getViewportInfo())
		}

		window.addEventListener('resize', handleResize, { passive: true })
		return () => window.removeEventListener('resize', handleResize)
	}, [])

	return viewport
}

/**
 * フルギャラリーThree.jsシーン（改良版）
 */
const FullGalleryScene: React.FC<{ viewport: ReturnType<typeof useViewportSize> }> = ({ viewport }) => {
	const [Canvas, setCanvas] = useState<any>(null)
	const [useScrollProgress, setUseScrollProgress] = useState<any>(null)
	const [sceneReady, setSceneReady] = useState<boolean>(false)

	useEffect(() => {
		const loadThreeJS = async () => {
			try {
				console.log('[FullGalleryScene] Loading modules...')
				const [fiberModule, scrollModule] = await Promise.all([
					import('@react-three/fiber'),
					import('./hooks/useScrollProgress'),
				])

				setCanvas(() => fiberModule.Canvas)
				setUseScrollProgress(() => scrollModule.useScrollProgress)
				setSceneReady(true)

				console.log('[FullGalleryScene] ✅ All modules loaded, ready to display 35 images')
			} catch (error) {
				console.error('[FullGalleryScene] ❌ Failed to load:', error)
			}
		}

		loadThreeJS()
	}, [])

	if (!Canvas || !useScrollProgress) {
		return (
			<div style={{
				position: 'absolute',
				top: '50%',
				left: '50%',
				transform: 'translate(-50%, -50%)',
				color: 'white',
				background: 'rgba(0, 0, 0, 0.8)',
				padding: '20px',
				borderRadius: '10px',
			}}>
				⏳ Loading Full Gallery...
			</div>
		)
	}

	return (
		<GalleryContent
			Canvas={Canvas}
			useScrollProgress={useScrollProgress}
			sceneReady={sceneReady}
			viewport={viewport}
		/>
	)
}

/**
 * ギャラリーコンテンツ（レスポンシブ対応版）
 */
interface GalleryContentProps {
	Canvas: any
	useScrollProgress: any
	sceneReady: boolean
	viewport: ReturnType<typeof useViewportSize>
}

const GalleryContent: React.FC<GalleryContentProps> = ({
	Canvas,
	useScrollProgress,
	sceneReady,
	viewport
}) => {
	const scrollProgress = useScrollProgress()
	const gridConfig = useMemo(() => getResponsiveGridConfig(viewport), [viewport])

	// 画像配置の計算（レスポンシブ対応・最適化版）
	const imagePositions = useMemo(() => {
		// スクロール進行度を丸めて無駄な再計算を防ぐ
		const roundedProgress = scrollProgress ? Math.round(scrollProgress.overall * 50) / 50 : 0

		// 新しい相対位置計算システムを使用
		const basePositions = calculateAllPositions(
			LAYERED_IMAGES,
			null, // スクロール効果は後で適用
			{
				useRelativePositioning: true,
				constrainToBounds: true,
				resolveCollisions: false // パフォーマンス優先
			}
		)

		return LAYERED_IMAGES.map((imageConfig, index) => {
			const basePosition = basePositions[index]

			// スクロールオフセット（ビューポート対応）
			const scrollMultiplier = viewport.isMobile ? 30 : viewport.isTablet ? 35 : 40
			const scrollOffsetY = roundedProgress * scrollMultiplier

			// 視差効果の適用
			const parallaxMultiplier = 1 - (imageConfig.parallax?.speed || 0.5)
			const parallaxOffsetY = scrollOffsetY * parallaxMultiplier
			const verticalSpreadFactor = viewport.isMobile ? 1.2 : viewport.isTablet ? 1.5 : 2
			
			return {
				id: imageConfig.id,
				position: [
					basePosition.x,
					basePosition.y * verticalSpreadFactor + parallaxOffsetY,
					basePosition.z
				] as [number, number, number],
				config: imageConfig,
				index,
				basePosition
			}
		})
	}, [scrollProgress?.overall, viewport]) // viewport も依存関係に追加

	// スクロール進行度の変化をログ（制限付き）
	const lastLoggedProgress = useRef<number>(-1)
	useEffect(() => {
		if (scrollProgress && Math.abs(scrollProgress.overall - lastLoggedProgress.current) > 0.1) {
			console.log('[GalleryContent] Scroll progress changed:', scrollProgress.overall.toFixed(2))
			lastLoggedProgress.current = scrollProgress.overall
		}
	}, [scrollProgress?.overall])

	// カメラ設定（レスポンシブ対応）
	const cameraConfig = useMemo(() => {
		const fov = 1000
		const position: [number, number, number] = [0, 50, 0]

		return { fov, position }
	}, [viewport])

	return (
		<Canvas
			className="w-full h-full"
			gl={{ antialias: false }}
			dpr={1}
			shadows={false}
			frameloop="demand"
		>

			<CameraController
				scrollProgress={scrollProgress}
				baseY={cameraConfig.position[1]}
				offsetDown={viewport.isMobile ? 8 : 100}
			/>
			{sceneReady && imagePositions.map((item) => (
				<ImagePlane
					key={`gallery-image-${item.id}`}
					imageConfig={item.config}
					position={item.position}
					index={item.index}
					scrollProgress={scrollProgress}
					viewport={viewport}
				/>
			))}
		</Canvas>
	)
}

/**
 * 個別画像プレーン（レスポンシブ対応版）
 */
interface ImagePlaneProps {
	imageConfig: any
	position: [number, number, number]
	index: number
	scrollProgress: any
	viewport: ReturnType<typeof useViewportSize>
}

const ImagePlane: React.FC<ImagePlaneProps> = ({
	imageConfig,
	position,
	index,
	scrollProgress,
	viewport
}) => {
	const [texture, setTexture] = useState<any>(null)
	const [loading, setLoading] = useState<boolean>(true)
	const [error, setError] = useState<boolean>(false)

	const loadingStarted = useRef<boolean>(false)
	const mounted = useRef<boolean>(true)

	useEffect(() => {
		return () => {
			mounted.current = false
		}
	}, [])


	// テクスチャ読み込み（段階的読み込み・エラーハンドリング強化）
	useEffect(() => {
		if (loadingStarted.current) return
		loadingStarted.current = true

		const loadTexture = async () => {
			try {
				const THREE = await import('three')
				const loader = new THREE.TextureLoader()
				loader.crossOrigin = 'anonymous'

				// インデックスに応じて段階的に読み込み（パフォーマンス向上）
				const delay = viewport.isMobile ? index * 150 : index * 100
				await new Promise(resolve => setTimeout(resolve, delay))

				if (!mounted.current) return

				loader.load(
					imageConfig.path,
					(loadedTexture) => {
						if (mounted.current) {
							// テクスチャ最適化（ビューポート対応）
							loadedTexture.minFilter = THREE.LinearFilter
							loadedTexture.magFilter = THREE.LinearFilter
							loadedTexture.wrapS = THREE.ClampToEdgeWrapping
							loadedTexture.wrapT = THREE.ClampToEdgeWrapping
							loadedTexture.generateMipmaps = !viewport.isMobile // モバイルではミップマップ無効

							setTexture(loadedTexture)
							setLoading(false)
							console.log(`[ImagePlane] ✅ Loaded ${index + 1}/35: ${imageConfig.filename}`)
						}
					},
					undefined,
					(err) => {
						if (mounted.current) {
							console.error(`[ImagePlane] ❌ Failed ${index + 1}/35: ${imageConfig.filename}`, err)
							setError(true)
							setLoading(false)
						}
					}
				)
			} catch (err) {
				if (mounted.current) {
					console.error(`[ImagePlane] Module error:`, err)
					setError(true)
					setLoading(false)
				}
			}
		}

		loadTexture()
	}, [imageConfig.path, imageConfig.filename, index, viewport.isMobile])

	const scale = 4;
	// エラー時の表示

	// 実際の画像表示（レスポンシブ透明度対応）
	return (
		//@ts-expect-error React Three Fiber JSX elements
		<mesh position={position} scale={[scale, scale, scale]}>
			{/* @ts-expect-error React Three Fiber JSX elements */}
			<planeGeometry args={[2, 3]} />
			{/* @ts-expect-error React Three Fiber JSX elements */}
			<meshBasicMaterial
				map={texture}
				transparent
				opacity={0.4}
				side={2}
			/>
			{/* @ts-expect-error React Three Fiber JSX elements */}
		</mesh>
	)
}

/**
 * メインコンポーネント（改良版）
 */
export const LayeredGalleryCanvas: React.FC<LayeredGalleryCanvasProps> = ({
	className = ''
}) => {
	const [isClient, setIsClient] = useState(false)
	const [showGallery, setShowGallery] = useState(false)
	const [loadedCount, setLoadedCount] = useState(0)
	const viewport = useViewportSize()

	useEffect(() => {
		setIsClient(true)

		setTimeout(() => {
			setShowGallery(true)
			console.log('[LayeredGalleryCanvas] 🎨 Starting to load 35 images...')
		}, 1000)
	}, [])

	// 読み込み進行状況の監視
	useEffect(() => {
		if (!showGallery) return

		const interval = setInterval(() => {
			const images = document.querySelectorAll('canvas')
			if (images.length > 0) {
				setLoadedCount(prev => Math.min(prev + 1, LAYERED_IMAGES.length))
			}
		}, 500)

		return () => clearInterval(interval)
	}, [showGallery])

	// レスポンシブ情報の表示
	const responsiveInfo = useMemo(() => {
		const gridConfig = getResponsiveGridConfig(viewport)
		return {
			device: viewport.isMobile ? 'Mobile' : viewport.isTablet ? 'Tablet' : 'Desktop',
			columns: gridConfig.columns,
			maxWidth: `${gridConfig.maxWidth * 100}%`,
			spacing: `${gridConfig.spacing.x} × ${gridConfig.spacing.y}`,
		}
	}, [viewport])

	if (!isClient) {
		return (
			<div style={{
				width: '100%',
				height: '100%',
				background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
				color: 'white',
				fontSize: '18px'
			}}>
				Initializing Gallery...
			</div>
		)
	}

	return (
		<>
			{showGallery && <FullGalleryScene viewport={viewport} />}
		</>
	)
}

export default LayeredGalleryCanvas
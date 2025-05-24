'use client'

import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react'
import { LAYERED_IMAGES } from './constants'
import { calculateAllPositions, getViewportInfo, getResponsiveGridConfig } from './utils/positionCalculator'

export interface LayeredGalleryCanvasProps {
	className?: string
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

			return {
				id: imageConfig.id,
				position: [
					basePosition.x,
					basePosition.y + parallaxOffsetY,
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
		const fov = viewport.isMobile ? 70 : viewport.isTablet ? 65 : 60
		const position: [number, number, number] = [0, 0, viewport.isMobile ? 12 : viewport.isTablet ? 14 : 15]
		
		return { fov, position }
	}, [viewport])

	return (
		<Canvas
			style={{
				width: '100%',
				height: '100%',
				background: 'transparent',
				// イベント制御：Canvas上でのユーザーインタラクションを無効化
				pointerEvents: 'none',
				touchAction: 'pan-y', // 縦スクロールのみ許可
			}}
			camera={{ position: cameraConfig.position, fov: cameraConfig.fov }}
			// Three.js の内部コントロールも無効化
			gl={{ 
				antialias: viewport.isDesktop, // モバイルではアンチエイリアスオフ
				alpha: true,
				powerPreference: viewport.isMobile ? 'low-power' : 'high-performance'
			}}
		>
			{/* ライティング（レスポンシブ対応） */}
			<ambientLight intensity={viewport.isMobile ? 0.9 : 0.8} />
			<directionalLight 
				position={[10, 10, 5]} 
				intensity={viewport.isMobile ? 0.8 : 1} 
			/>
			<directionalLight 
				position={[-10, -10, -5]} 
				intensity={0.3} 
			/>

			{/* 35枚の画像（レスポンシブ配置） */}
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

			{/* スクロール進行度表示キューブ（レスポンシブサイズ） */}
			{scrollProgress && (
				<mesh position={[0, 8, 0]}>
					<boxGeometry args={[
						scrollProgress.overall * (viewport.isMobile ? 6 : 10), 
						0.3, 
						0.3
					]} />
					<meshBasicMaterial color="yellow" />
				</mesh>
			)}
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

	// 画像サイズに応じたスケール（レスポンシブ対応）
	const scale = useMemo(() => {
		// ベーススケール（ビューポート対応）
		let baseScale = imageConfig.size === 'L' ? 2.0 :
			imageConfig.size === 'M' ? 1.5 : 1.2

		// ビューポートに応じた調整
		if (viewport.isMobile) {
			baseScale *= 0.7
		} else if (viewport.isTablet) {
			baseScale *= 0.85
		}

		// スクロールに応じた微細な変化
		let scrollScale = 1
		if (scrollProgress) {
			const phase = (index * 0.1 + scrollProgress.overall) * Math.PI * 2
			scrollScale = 1 + Math.sin(phase) * (viewport.isMobile ? 0.03 : 0.05)
		}

		return baseScale * scrollScale
	}, [imageConfig.size, scrollProgress, index, viewport])

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

	// エラー時の表示
	if (error) {
		return (
			<mesh position={position} scale={[scale, scale, scale]}>
				<planeGeometry args={[2, 3]} />
				<meshBasicMaterial
					color="#ff4757"
					opacity={0.7}
					transparent
					side={2}
				/>
			</mesh>
		)
	}

	// ローディング中の表示（ビューポート対応色）
	if (loading || !texture) {
		const colors = {
			L: viewport.isMobile ? '#5352ed' : '#3742fa', // モバイルで少し明るく
			M: viewport.isMobile ? '#26de81' : '#2ed573', // 緑
			S: viewport.isMobile ? '#fd9644' : '#ffa502'  // オレンジ
		}

		return (
			<mesh position={position} scale={[scale, scale, scale]}>
				<planeGeometry args={[2, 3]} />
				<meshBasicMaterial
					color={colors[imageConfig.size]}
					opacity={viewport.isMobile ? 0.6 : 0.7}
					transparent
					side={2}
				/>
			</mesh>
		)
	}

	// 実際の画像表示（レスポンシブ透明度対応）
	return (
		<mesh position={position} scale={[scale, scale, scale]}>
			<planeGeometry args={[2, 3]} />
			<meshBasicMaterial
				map={texture}
				transparent
				opacity={viewport.isMobile ? 0.6 : 0.7}
				side={2}
			/>
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
		<div
			className={`layered-gallery-canvas ${className}`}
			style={{
				width: '100%',
				height: '100%',
				minWidth: '100vw',
				minHeight: '100vh',
				background: 'linear-gradient(180deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%)',
				position: 'absolute',
				top: 0,
				left: 0,
				boxSizing: 'border-box',
				// スクロール操作性の確保
				pointerEvents: 'none', // Canvas自体はインタラクションを受け付けない
				touchAction: 'pan-y', // 縦スクロールのみ許可
			}}
		>
			{/* フルギャラリーシーン */}
			{showGallery && <FullGalleryScene viewport={viewport} />}

			{/* ギャラリー情報（レスポンシブ対応） */}
			<div style={{
				position: 'absolute',
				top: '20px',
				left: '20px',
				background: 'rgba(0, 0, 0, 0.85)',
				color: 'white',
				padding: viewport.isMobile ? '15px' : '20px',
				borderRadius: '12px',
				fontSize: viewport.isMobile ? '12px' : '14px',
				fontFamily: 'monospace',
				backdropFilter: 'blur(10px)',
				border: '1px solid rgba(255, 255, 255, 0.1)',
				maxWidth: viewport.isMobile ? '280px' : '350px',
				pointerEvents: 'auto', // 情報パネルはインタラクティブ
			}}>
				<div style={{ 
					color: '#64ffda', 
					marginBottom: '12px', 
					fontSize: viewport.isMobile ? '14px' : '16px' 
				}}>
					🖼️ PEPE GALLERY
				</div>
				<div>Total Images: {LAYERED_IMAGES.length}</div>
				<div>Layout: {responsiveInfo.columns} columns</div>
				<div>Device: {responsiveInfo.device}</div>
				<div>Grid Width: {responsiveInfo.maxWidth}</div>
				<div>Status: {showGallery ? '✅ Active' : '⏳ Loading'}</div>
				<div style={{ 
					marginTop: '12px', 
					fontSize: viewport.isMobile ? '10px' : '12px', 
					opacity: 0.8 
				}}>
					📜 Scroll to see images flow upward
				</div>
				<div style={{ 
					fontSize: viewport.isMobile ? '10px' : '12px', 
					opacity: 0.8 
				}}>
					🎨 Images load progressively for performance
				</div>
			</div>

			{/* スクロール操作説明（レスポンシブ位置調整） */}
			<div style={{
				position: 'absolute',
				top: viewport.isMobile ? '20px' : '20px',
				right: '20px',
				background: 'rgba(0, 0, 0, 0.85)',
				color: 'white',
				padding: viewport.isMobile ? '12px' : '15px',
				borderRadius: '10px',
				fontSize: viewport.isMobile ? '10px' : '12px',
				maxWidth: viewport.isMobile ? '180px' : '220px',
				backdropFilter: 'blur(10px)',
				border: '1px solid rgba(255, 255, 255, 0.1)',
				pointerEvents: 'auto', // 操作説明もインタラクティブ
			}}>
				<div style={{ 
					color: '#ff6b6b', 
					marginBottom: '8px',
					fontSize: viewport.isMobile ? '11px' : '12px'
				}}>
					🎮 Controls:
				</div>
				<div>• Scroll: Move gallery up/down</div>
				<div>• Images fade based on distance</div>
				<div>• L/M/S sizes in different depths</div>
				<div style={{ marginTop: '8px', opacity: 0.7 }}>
					Blue=Large, Green=Medium, Orange=Small
				</div>
				{viewport.isMobile && (
					<div style={{ marginTop: '8px', opacity: 0.7, color: '#64ffda' }}>
						📱 Optimized for mobile
					</div>
				)}
			</div>

			{/* 読み込み進行状況（レスポンシブサイズ） */}
			<div style={{
				position: 'absolute',
				bottom: '20px',
				left: '20px',
				background: 'rgba(0, 0, 0, 0.85)',
				color: 'white',
				padding: viewport.isMobile ? '12px' : '15px',
				borderRadius: '10px',
				fontSize: viewport.isMobile ? '12px' : '14px',
				fontFamily: 'monospace',
				backdropFilter: 'blur(10px)',
				border: '1px solid rgba(255, 255, 255, 0.1)',
				pointerEvents: 'auto', // 進行状況もインタラクティブ
			}}>
				<div style={{ marginBottom: '8px' }}>Loading Progress:</div>
				<div style={{
					width: viewport.isMobile ? '150px' : '200px',
					height: '4px',
					background: 'rgba(255, 255, 255, 0.2)',
					borderRadius: '2px',
					overflow: 'hidden'
				}}>
					<div style={{
						width: `${(loadedCount / LAYERED_IMAGES.length) * 100}%`,
						height: '100%',
						background: 'linear-gradient(90deg, #64ffda, #ff6b6b)',
						transition: 'width 0.3s ease'
					}} />
				</div>
				<div style={{ 
					marginTop: '5px', 
					fontSize: viewport.isMobile ? '10px' : '12px' 
				}}>
					{loadedCount} / {LAYERED_IMAGES.length} images
				</div>
			</div>

			{/* レスポンシブデバッグ情報（開発用） */}
			{process.env.NODE_ENV === 'development' && (
				<div style={{
					position: 'absolute',
					bottom: '20px',
					right: '20px',
					background: 'rgba(0, 0, 0, 0.9)',
					color: '#64ffda',
					padding: '10px',
					borderRadius: '8px',
					fontSize: '10px',
					fontFamily: 'monospace',
					pointerEvents: 'auto',
				}}>
					<div>🔧 Debug Info:</div>
					<div>Viewport: {viewport.width}×{viewport.height}</div>
					<div>Device: {responsiveInfo.device}</div>
					<div>Columns: {responsiveInfo.columns}</div>
					<div>Grid Spacing: {responsiveInfo.spacing}</div>
				</div>
			)}
		</div>
	)
}

export default LayeredGalleryCanvas
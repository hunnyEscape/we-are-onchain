'use client'

import React, { useRef, useEffect, useState, useMemo } from 'react'
import { LAYERED_IMAGES } from './constants'

export interface LayeredGalleryCanvasProps {
	className?: string
}

/**
 * フルギャラリーThree.jsシーン
 */
const FullGalleryScene: React.FC = () => {
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

	return <GalleryContent Canvas={Canvas} useScrollProgress={useScrollProgress} sceneReady={sceneReady} />
}

/**
 * ギャラリーコンテンツ
 */
interface GalleryContentProps {
	Canvas: any
	useScrollProgress: any
	sceneReady: boolean
}

const GalleryContent: React.FC<GalleryContentProps> = ({ Canvas, useScrollProgress, sceneReady }) => {
	const scrollProgress = useScrollProgress()

	// 画像配置の計算（スクロール進行度の変化を制限）
	const imagePositions = useMemo(() => {
		// スクロール進行度を丸めて無駄な再計算を防ぐ
		const roundedProgress = scrollProgress ? Math.round(scrollProgress.overall * 50) / 50 : 0

		return LAYERED_IMAGES.map((imageConfig, index) => {
			const columns = 7 // 7列
			const col = index % columns
			const row = Math.floor(index / columns)

			// 基本位置
			const baseX = (col - 3) * 3.5 // -10.5 to 10.5
			const baseY = -row * 4 - 5 // 上から下に配置
			const baseZ = imageConfig.size === 'L' ? 0 :
				imageConfig.size === 'M' ? -2 : -4

			// スクロールオフセット（制限付き）
			const scrollOffsetY = roundedProgress * 40

			return {
				id: imageConfig.id,
				position: [baseX, baseY + scrollOffsetY, baseZ] as [number, number, number],
				config: imageConfig,
				index
			}
		})
	}, [scrollProgress?.overall]) // overall のみに依存

	// スクロール進行度の変化をログ（制限付き）
	const lastLoggedProgress = useRef<number>(-1)
	useEffect(() => {
		if (scrollProgress && Math.abs(scrollProgress.overall - lastLoggedProgress.current) > 0.1) {
			console.log('[GalleryContent] Scroll progress changed:', scrollProgress.overall.toFixed(2))
			lastLoggedProgress.current = scrollProgress.overall
		}
	}, [scrollProgress?.overall])

	return (
		<Canvas
			style={{
				width: '100%',
				height: '100%',
				background: 'transparent',
			}}
			camera={{ position: [0, 0, 15], fov: 60 }}
		>
			{/* ライティング */}
			<ambientLight intensity={0.8} />
			<directionalLight position={[10, 10, 5]} intensity={1} />
			<directionalLight position={[-10, -10, -5]} intensity={0.3} />

			{/* 35枚の画像 */}
			{sceneReady && imagePositions.map((item) => (
				<ImagePlane
					key={`gallery-image-${item.id}`}
					imageConfig={item.config}
					position={item.position}
					index={item.index}
					scrollProgress={scrollProgress}
				/>
			))}

			{/* スクロール進行度表示キューブ */}
			{scrollProgress && (
				<mesh position={[0, 8, 0]}>
					<boxGeometry args={[scrollProgress.overall * 10, 0.5, 0.5]} />
					<meshBasicMaterial color="yellow" />
				</mesh>
			)}
		</Canvas>
	)
}

/**
 * 個別画像プレーン
 */
interface ImagePlaneProps {
	imageConfig: any
	position: [number, number, number]
	index: number
	scrollProgress: any
}

const ImagePlane: React.FC<ImagePlaneProps> = ({
	imageConfig,
	position,
	index,
	scrollProgress
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

	// 画像サイズに応じたスケール
	const scale = useMemo(() => {
		const baseScale = imageConfig.size === 'L' ? 2.0 :
			imageConfig.size === 'M' ? 1.5 : 1.2

		// スクロールに応じた微細な変化
		let scrollScale = 1
		if (scrollProgress) {
			const phase = (index * 0.1 + scrollProgress.overall) * Math.PI * 2
			scrollScale = 1 + Math.sin(phase) * 0.05
		}

		return baseScale * scrollScale
	}, [imageConfig.size, scrollProgress, index])


	// テクスチャ読み込み
	useEffect(() => {
		if (loadingStarted.current) return
		loadingStarted.current = true

		const loadTexture = async () => {
			try {
				const THREE = await import('three')
				const loader = new THREE.TextureLoader()
				loader.crossOrigin = 'anonymous'

				// インデックスに応じて段階的に読み込み（パフォーマンス向上）
				await new Promise(resolve => setTimeout(resolve, index * 100))

				if (!mounted.current) return

				loader.load(
					imageConfig.path,
					(loadedTexture) => {
						if (mounted.current) {
							// テクスチャ最適化
							loadedTexture.minFilter = THREE.LinearFilter
							loadedTexture.magFilter = THREE.LinearFilter
							loadedTexture.wrapS = THREE.ClampToEdgeWrapping
							loadedTexture.wrapT = THREE.ClampToEdgeWrapping
							loadedTexture.generateMipmaps = false

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
	}, [imageConfig.path, imageConfig.filename, index])

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

	// ローディング中の表示
	if (loading || !texture) {
		const colors = {
			L: '#3742fa', // 青
			M: '#2ed573', // 緑
			S: '#ffa502'  // オレンジ
		}

		return (
			<mesh position={position} scale={[scale, scale, scale]}>
				<planeGeometry args={[2, 3]} />
				<meshBasicMaterial
					color={colors[imageConfig.size]}
					opacity={0.7}
					transparent
					side={2}
				/>
			</mesh>
		)
	}

	// 実際の画像表示
	return (
		<mesh position={position} scale={[scale, scale, scale]}>
			<planeGeometry args={[2, 3]} />
			<meshBasicMaterial
				map={texture}
				transparent
				opacity={0.7}
				side={2}
			/>
		</mesh>
	)
}

/**
 * メインコンポーネント
 */
export const LayeredGalleryCanvas: React.FC<LayeredGalleryCanvasProps> = ({
	className = ''
}) => {
	const [isClient, setIsClient] = useState(false)
	const [showGallery, setShowGallery] = useState(false)
	const [loadedCount, setLoadedCount] = useState(0)

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
			}}
		>
			{/* フルギャラリーシーン */}
			{showGallery && <FullGalleryScene />}

			{/* ギャラリー情報 */}
			<div style={{
				position: 'absolute',
				top: '20px',
				left: '20px',
				background: 'rgba(0, 0, 0, 0.85)',
				color: 'white',
				padding: '20px',
				borderRadius: '12px',
				fontSize: '14px',
				fontFamily: 'monospace',
				backdropFilter: 'blur(10px)',
				border: '1px solid rgba(255, 255, 255, 0.1)',
			}}>
				<div style={{ color: '#64ffda', marginBottom: '12px', fontSize: '16px' }}>
					🖼️ PEPE GALLERY
				</div>
				<div>Total Images: {LAYERED_IMAGES.length}</div>
				<div>Layout: 7 columns × {Math.ceil(LAYERED_IMAGES.length / 7)} rows</div>
				<div>Status: {showGallery ? '✅ Active' : '⏳ Loading'}</div>
				<div style={{ marginTop: '12px', fontSize: '12px', opacity: 0.8 }}>
					📜 Scroll to see images flow upward
				</div>
				<div style={{ fontSize: '12px', opacity: 0.8 }}>
					🎨 Images load progressively for performance
				</div>
			</div>

			{/* スクロール操作説明 */}
			<div style={{
				position: 'absolute',
				top: '20px',
				right: '20px',
				background: 'rgba(0, 0, 0, 0.85)',
				color: 'white',
				padding: '15px',
				borderRadius: '10px',
				fontSize: '12px',
				maxWidth: '220px',
				backdropFilter: 'blur(10px)',
				border: '1px solid rgba(255, 255, 255, 0.1)',
			}}>
				<div style={{ color: '#ff6b6b', marginBottom: '8px' }}>🎮 Controls:</div>
				<div>• Scroll: Move gallery up/down</div>
				<div>• Images fade based on distance</div>
				<div>• L/M/S sizes in different depths</div>
				<div style={{ marginTop: '8px', opacity: 0.7 }}>
					Blue=Large, Green=Medium, Orange=Small
				</div>
			</div>

			{/* 読み込み進行状況 */}
			<div style={{
				position: 'absolute',
				bottom: '20px',
				left: '20px',
				background: 'rgba(0, 0, 0, 0.85)',
				color: 'white',
				padding: '15px',
				borderRadius: '10px',
				fontSize: '14px',
				fontFamily: 'monospace',
				backdropFilter: 'blur(10px)',
				border: '1px solid rgba(255, 255, 255, 0.1)',
			}}>
				<div style={{ marginBottom: '8px' }}>Loading Progress:</div>
				<div style={{
					width: '200px',
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
				<div style={{ marginTop: '5px', fontSize: '12px' }}>
					{loadedCount} / {LAYERED_IMAGES.length} images
				</div>
			</div>
		</div>
	)
}

export default LayeredGalleryCanvas
// src/app/components/layered-gallery/LayeredGallerySection.tsx

'use client'

import React, { useRef, useEffect, useState, useMemo } from 'react'
import dynamic from 'next/dynamic'
import { SECTION_CONFIG, getCurrentConfig, DEBUG_CONFIG } from './constants'

// LayeredGalleryCanvasを動的インポートでSSR回避
const LayeredGalleryCanvas = dynamic(() => import('./LayeredGalleryCanvas'), {
	ssr: false,
	loading: () => (
		<div
			style={{
				position: 'absolute',
				top: '50%',
				left: '50%',
				transform: 'translate(-50%, -50%)',
				color: '#666',
				fontSize: '18px',
				textAlign: 'center',
			}}
		>
			<div>Loading 3D Gallery...</div>
			<div style={{ fontSize: '12px', marginTop: '5px', opacity: 0.7 }}>
				Initializing Three.js Scene
			</div>
		</div>
	)
})

export interface LayeredGallerySectionProps {
	className?: string
	id?: string
}

/**
 * レスポンシブビューポート監視フック
 */
const useResponsiveViewport = () => {
	const [viewport, setViewport] = useState({
		width: typeof window !== 'undefined' ? window.innerWidth : 1920,
		height: typeof window !== 'undefined' ? window.innerHeight : 1080,
		isMobile: typeof window !== 'undefined' ? window.innerWidth <= 768 : false,
		isTablet: typeof window !== 'undefined' ? window.innerWidth > 768 && window.innerWidth <= 1024 : false,
	})

	useEffect(() => {
		const handleResize = () => {
			const width = window.innerWidth
			const height = window.innerHeight
			setViewport({
				width,
				height,
				isMobile: width <= 768,
				isTablet: width > 768 && width <= 1024,
			})
		}

		window.addEventListener('resize', handleResize, { passive: true })
		return () => window.removeEventListener('resize', handleResize)
	}, [])

	return viewport
}

/**
 * セクション内スクロール進行度監視フック
 */
const useSectionScrollProgress = (sectionRef: React.RefObject<HTMLElement>) => {
	const [scrollProgress, setScrollProgress] = useState({
		overall: 0,        // セクション全体での進行度 (0-1)
		visible: 0,        // 可視部分での進行度 (0-1)
		isInView: false,   // セクションが画面内にあるか
		direction: 'down' as 'up' | 'down'
	})

	const lastScrollY = useRef(0)

	useEffect(() => {
		if (!sectionRef.current) return

		const handleScroll = () => {
			const element = sectionRef.current
			if (!element) return

			const rect = element.getBoundingClientRect()
			const viewportHeight = window.innerHeight
			const elementHeight = rect.height

			// セクションが画面内にあるかの判定
			const isInView = rect.bottom > 0 && rect.top < viewportHeight

			// セクション全体での進行度計算
			const totalScrollableHeight = elementHeight + viewportHeight
			const scrolled = viewportHeight - rect.top
			const overall = Math.max(0, Math.min(1, scrolled / totalScrollableHeight))

			// 可視部分での進行度計算
			const visibleTop = Math.max(0, -rect.top)
			const visibleBottom = Math.min(elementHeight, viewportHeight - rect.top)
			const visibleHeight = Math.max(0, visibleBottom - visibleTop)
			const visible = elementHeight > 0 ? visibleHeight / elementHeight : 0

			// スクロール方向の判定
			const currentScrollY = window.scrollY
			const direction = currentScrollY >= lastScrollY.current ? 'down' : 'up'
			lastScrollY.current = currentScrollY

			setScrollProgress({
				overall,
				visible,
				isInView,
				direction
			})
		}

		// 初期計算
		handleScroll()

		// スクロールイベントリスナー（パッシブ、スロットル付き）
		let ticking = false
		const throttledHandleScroll = () => {
			if (!ticking) {
				requestAnimationFrame(() => {
					handleScroll()
					ticking = false
				})
				ticking = true
			}
		}

		window.addEventListener('scroll', throttledHandleScroll, { passive: true })
		window.addEventListener('resize', handleScroll, { passive: true })

		return () => {
			window.removeEventListener('scroll', throttledHandleScroll)
			window.removeEventListener('resize', handleScroll)
		}
	}, [sectionRef])

	return scrollProgress
}

/**
 * レイヤードギャラリーのメインセクションコンテナ（改良版）
 */
export const LayeredGallerySection: React.FC<LayeredGallerySectionProps> = ({
	className = '',
	id = 'layered-gallery-section'
}) => {
	const sectionRef = useRef<HTMLElement>(null)
	const [isClient, setIsClient] = useState(false)
	const viewport = useResponsiveViewport()
	const sectionScrollProgress = useSectionScrollProgress(sectionRef)

	// クライアントサイドでのみ実行
	useEffect(() => {
		setIsClient(true)
	}, [])

	// セクション高さの計算（レスポンシブ対応）
	const sectionHeight = useMemo(() => {
		if (!isClient) return '400vh'

		const multiplier = viewport.isMobile ? 3.5 : viewport.isTablet ? 4.2 : SECTION_CONFIG.sectionHeight
		return `${multiplier * 100}vh`
	}, [isClient, viewport.isMobile, viewport.isTablet])

	// レスポンシブ設定の取得
	const config = getCurrentConfig()

	// デバッグログ（開発環境のみ）
	useEffect(() => {
		if (DEBUG_CONFIG.logAnimationStates && process.env.NODE_ENV === 'development') {
			console.log('[LayeredGallerySection] Scroll progress:', {
				overall: sectionScrollProgress.overall.toFixed(3),
				visible: sectionScrollProgress.visible.toFixed(3),
				isInView: sectionScrollProgress.isInView,
				direction: sectionScrollProgress.direction,
			})
		}
	}, [sectionScrollProgress])

	if (!isClient) {
		// SSR時は基本的なプレースホルダーを返す
		return (
			<section
				id={id}
				className={`layered-gallery-section ${className} `}

			>
				<div
					style={{
						position: 'absolute',
						top: '50%',
						left: '50%',
						transform: 'translate(-50%, -50%)',
						color: '#666',
						fontSize: '18px',
					}}
				>
					Loading Gallery...
				</div>
			</section>
		)
	}

	return (
		<section
			ref={sectionRef}
			id={id}
			className={`layered-gallery-section ${className}`}
			style={{
				height: sectionHeight,
				position: 'relative',
				overflow: 'hidden',
				paddingTop: SECTION_CONFIG.padding.top,
				paddingBottom: SECTION_CONFIG.padding.bottom,
				width: '100%',
				minWidth: '100vw',
				// スクロール操作性の確保
				touchAction: 'pan-y', // 縦スクロールのみ許可
			}}
		>
			{/* Sticky Canvas Container - ここが重要なポイント */}
			<div
				className="layered-gallery-canvas-container"
				style={{
					position: 'sticky',
					top: 0,
					left: 0,
					width: '100vw',
					height: '100vh',
					zIndex: 1,
					// スクロール追従のためのtransform設定
					transform: `translateY(${sectionScrollProgress.overall * 20}px)`, // 微細な追従効果
					transition: 'none', // アニメーションはThree.js側で制御
					// Canvas内でのスクロール操作性
					pointerEvents: 'none', // 基本的にはインタラクション無効
					touchAction: 'pan-y',
					// 表示の最適化
					willChange: 'transform',
					backfaceVisibility: 'hidden',
					perspective: '1000px',
				}}
			>
				{/* Three.js Canvas */}
				<LayeredGalleryCanvas />

				{/* セクション進行度インジケーター（Sticky内に配置） */}
				{DEBUG_CONFIG.showScrollRanges && (
					<div
						style={{
							position: 'absolute',
							top: '50%',
							left: '10px',
							transform: 'translateY(-50%)',
							background: 'rgba(0, 0, 0, 0.8)',
							color: 'white',
							padding: '10px',
							borderRadius: '5px',
							fontSize: '12px',
							fontFamily: 'monospace',
							zIndex: 1000,
							pointerEvents: 'auto',
							minWidth: '200px',
						}}
					>
						<div style={{ color: '#64ffda', marginBottom: '8px' }}>
							📊 Section Progress:
						</div>
						<div>Overall: {(sectionScrollProgress.overall * 100).toFixed(1)}%</div>
						<div>Visible: {(sectionScrollProgress.visible * 100).toFixed(1)}%</div>
						<div>In View: {sectionScrollProgress.isInView ? '✅' : '❌'}</div>
						<div>Direction: {sectionScrollProgress.direction === 'down' ? '⬇️' : '⬆️'}</div>
						<div style={{ marginTop: '8px', fontSize: '10px', opacity: 0.7 }}>
							Height: {sectionHeight}
						</div>
						<div style={{ fontSize: '10px', opacity: 0.7 }}>
							Device: {viewport.isMobile ? 'Mobile' : viewport.isTablet ? 'Tablet' : 'Desktop'}
						</div>
					</div>
				)}

				{/* パフォーマンス監視（開発環境のみ） */}
				{process.env.NODE_ENV === 'development' && (
					<PerformanceMonitor
						isVisible={sectionScrollProgress.isInView}
						scrollProgress={sectionScrollProgress.overall}
					/>
				)}
			</div>

			{/* スクロール可能エリアの可視化（デバッグ用） */}
			{DEBUG_CONFIG.showBoundingBoxes && (
				<div
					style={{
						position: 'absolute',
						top: 0,
						left: 0,
						width: '100%',
						height: '100%',
						border: '3px dashed #00ff88',
						pointerEvents: 'none',
						zIndex: 100,
					}}
				>
					<div
						style={{
							position: 'absolute',
							top: '10px',
							left: '10px',
							background: 'rgba(0, 255, 136, 0.9)',
							color: 'black',
							padding: '8px',
							fontSize: '12px',
							fontWeight: 'bold',
						}}
					>
						Layered Gallery Section Bounds
						<br />
						{sectionHeight} ({viewport.isMobile ? 'Mobile' : viewport.isTablet ? 'Tablet' : 'Desktop'})
					</div>
				</div>
			)}

			{/* セクション背景グラデーション（オプション） */}
			<div
				style={{
					position: 'absolute',
					top: 0,
					left: 0,
					width: '100%',
					height: '100%',
					background: `linear-gradient(
            ${sectionScrollProgress.direction === 'down' ? '180deg' : '0deg'},
            rgba(15, 15, 35, 0.1) 0%,
            rgba(26, 26, 46, 0.05) 50%,
            rgba(22, 33, 62, 0.1) 100%
          )`,
					pointerEvents: 'none',
					zIndex: 0,
				}}
			/>
		</section>
	)
}

/**
 * パフォーマンス監視コンポーネント（開発用）
 */
interface PerformanceMonitorProps {
	isVisible: boolean
	scrollProgress: number
}

const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({
	isVisible,
	scrollProgress
}) => {
	const [fps, setFps] = useState(0)
	const frameCount = useRef(0)
	const lastTime = useRef(performance.now())

	useEffect(() => {
		if (!isVisible) return

		const measureFps = () => {
			frameCount.current++
			const currentTime = performance.now()

			if (currentTime - lastTime.current >= 1000) {
				setFps(frameCount.current)
				frameCount.current = 0
				lastTime.current = currentTime
			}

			requestAnimationFrame(measureFps)
		}

		const animationId = requestAnimationFrame(measureFps)
		return () => cancelAnimationFrame(animationId)
	}, [isVisible])

	if (!isVisible) return null

	return (
		<div
			style={{
				position: 'absolute',
				top: '50%',
				right: '10px',
				transform: 'translateY(-50%)',
				background: 'rgba(0, 0, 0, 0.9)',
				color: '#64ffda',
				padding: '10px',
				borderRadius: '8px',
				fontSize: '11px',
				fontFamily: 'monospace',
				zIndex: 1001,
				pointerEvents: 'auto',
				minWidth: '120px',
			}}
		>
			<div style={{ color: '#ff6b6b', marginBottom: '5px' }}>
				⚡ Performance:
			</div>
			<div>FPS: {fps}</div>
			<div>Scroll: {(scrollProgress * 100).toFixed(1)}%</div>
			<div style={{
				marginTop: '5px',
				padding: '3px',
				background: fps < 30 ? 'rgba(255, 0, 0, 0.2)' :
					fps < 50 ? 'rgba(255, 255, 0, 0.2)' :
						'rgba(0, 255, 0, 0.2)',
				borderRadius: '3px'
			}}>
				{fps < 30 ? '🔴 Poor' : fps < 50 ? '🟡 Fair' : '🟢 Good'}
			</div>
		</div>
	)
}

export default LayeredGallerySection
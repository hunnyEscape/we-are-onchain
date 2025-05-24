// src/app/components/layered-gallery/LayeredGallerySection.tsx

'use client'
import React, { useRef, useEffect, useState, useMemo } from 'react'
import { SECTION_CONFIG, getCurrentConfig, DEBUG_CONFIG } from './constants'
import LayeredGalleryCanvas from './LayeredGalleryCanvas';


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
		<section ref={sectionRef} id={id} className={`h-[800vh] w-full`}>
			<div className="sticky top-0 left-0 h-screen w-full z-10">
				<LayeredGalleryCanvas />
			</div>
		</section>
	)
}

export default LayeredGallerySection
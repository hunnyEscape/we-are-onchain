// src/app/components/layered-gallery/hooks/useScrollProgress.ts

'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { ScrollProgress } from '../types'
import { ANIMATION_CONFIG, DEBUG_CONFIG } from '../constants'

/**
 * スクロール進行度を計算・管理するカスタムフック（セクション相対対応・最適化版）
 */
export const useScrollProgress = (
	sectionId: string = 'layered-gallery-section'
): ScrollProgress | null => {
	const [scrollProgress, setScrollProgress] = useState<ScrollProgress | null>(null)
	
	// パフォーマンス最適化のための参照とキャッシュ
	const lastScrollY = useRef<number>(0)
	const lastTimestamp = useRef<number>(0)
	const velocityHistory = useRef<number[]>([])
	const isCalculating = useRef<boolean>(false)
	const rafId = useRef<number>()
	const lastProgressValues = useRef<{ overall: number; section: number }>({ overall: -1, section: -1 })
	const intersectionRatio = useRef<number>(0)

	// セクション要素の参照をキャッシュ
	const sectionElementRef = useRef<HTMLElement | null>(null)
	const lastElementCheck = useRef<number>(0)

	// 要素取得の最適化（キャッシュ付き）
	const getSectionElement = useCallback((): HTMLElement | null => {
		const now = performance.now()
		
		// 100ms間隔でのみ要素を再取得（パフォーマンス最適化）
		if (now - lastElementCheck.current > 100 || !sectionElementRef.current) {
			sectionElementRef.current = document.getElementById(sectionId)
			lastElementCheck.current = now
		}
		
		return sectionElementRef.current
	}, [sectionId])

	// ビューポート情報のキャッシュ
	const viewportInfo = useRef<{ width: number; height: number }>({ width: 0, height: 0 })
	
	const updateViewportInfo = useCallback(() => {
		if (typeof window !== 'undefined') {
			viewportInfo.current = {
				width: window.innerWidth,
				height: window.innerHeight
			}
		}
	}, [])

	// 初回ビューポート情報の設定
	useEffect(() => {
		updateViewportInfo()
	}, [updateViewportInfo])

	// セクション相対スクロール進行度の計算（最適化版）
	const calculateSectionProgress = useCallback((element: HTMLElement): ScrollProgress | null => {
		if (isCalculating.current || !element) {
			return null
		}

		isCalculating.current = true

		try {
			const rect = element.getBoundingClientRect()
			const viewport = viewportInfo.current
			const elementHeight = rect.height
			const elementTop = rect.top

			// セクション全体の進行度計算（0-1）
			// セクションが画面に入り始めてから完全に通り過ぎるまでの進行度
			const totalScrollRange = elementHeight + viewport.height
			const scrolled = viewport.height - elementTop
			const overallProgress = Math.max(0, Math.min(1, scrolled / totalScrollRange))

			// セクション内での相対進行度計算（0-1）
			// セクションが画面内にある間の進行度
			const visibleStart = Math.max(0, -elementTop)
			const visibleEnd = Math.min(elementHeight, viewport.height - elementTop)
			const visibleRange = Math.max(0, visibleEnd - visibleStart)
			const sectionProgress = elementHeight > 0 ? 
				Math.max(0, Math.min(1, (visibleStart + visibleRange / 2) / elementHeight)) : 0

			// 変化の閾値チェック（無駄な更新を防ぐ）
			const progressDiff = Math.abs(overallProgress - lastProgressValues.current.overall)
			const sectionDiff = Math.abs(sectionProgress - lastProgressValues.current.section)

			if (progressDiff < ANIMATION_CONFIG.scrollThreshold && 
				sectionDiff < ANIMATION_CONFIG.scrollThreshold) {
				return null // 変化が小さすぎる場合は更新しない
			}

			// 値を更新
			lastProgressValues.current = { overall: overallProgress, section: sectionProgress }

			// スクロール方向の判定（最適化）
			const currentScrollY = window.scrollY
			const direction = currentScrollY >= lastScrollY.current ? 'down' : 'up'
			lastScrollY.current = currentScrollY

			// スクロール速度の計算（フレーム間隔考慮）
			const currentTime = performance.now()
			const timeDelta = currentTime - lastTimestamp.current
			const scrollDelta = Math.abs(currentScrollY - lastScrollY.current)
			
			// 60FPS基準でスクロール速度を正規化
			const instantVelocity = timeDelta > 16 ? (scrollDelta / timeDelta) * 16 : 0

			// 速度履歴を更新（最大5フレーム分）
			velocityHistory.current.push(instantVelocity)
			if (velocityHistory.current.length > 5) {
				velocityHistory.current.shift()
			}

			// 平均速度の計算
			const averageVelocity = velocityHistory.current.length > 0
				? velocityHistory.current.reduce((sum, v) => sum + v, 0) / velocityHistory.current.length
				: 0

			lastTimestamp.current = currentTime

			return {
				overall: overallProgress,
				section: sectionProgress,
				direction,
				velocity: Math.min(averageVelocity, 10), // 速度の上限を設定
			}
		} catch (error) {
			console.error('[useScrollProgress] Calculation error:', error)
			return null
		} finally {
			isCalculating.current = false
		}
	}, [])

	// Intersection Observerによる効率的な可視性監視
	const [isElementVisible, setIsElementVisible] = useState<boolean>(false)
	const observerRef = useRef<IntersectionObserver | null>(null)

	// 可視性監視の設定（最適化版）
	useEffect(() => {
		const element = getSectionElement()
		if (!element) return

		// 既存のオブザーバーがある場合は削除
		if (observerRef.current) {
			observerRef.current.disconnect()
		}

		observerRef.current = new IntersectionObserver(
			(entries) => {
				const [entry] = entries
				const isVisible = entry.isIntersecting
				intersectionRatio.current = entry.intersectionRatio

				setIsElementVisible(prev => {
					if (prev !== isVisible) {
						if (DEBUG_CONFIG.logAnimationStates) {
							console.log('[useScrollProgress] Visibility changed:', isVisible, 
								'Ratio:', entry.intersectionRatio.toFixed(3))
						}
						return isVisible
					}
					return prev
				})
			},
			{
				threshold: [0, 0.1, 0.25, 0.5, 0.75, 1.0], // 詳細な閾値設定
				rootMargin: '50px', // 余裕を持った検出範囲
			}
		)

		observerRef.current.observe(element)

		return () => {
			if (observerRef.current) {
				observerRef.current.disconnect()
				observerRef.current = null
			}
		}
	}, [getSectionElement])

	// メインのスクロールイベントハンドラー（RAF + スロットリング）
	const handleScroll = useCallback(() => {
		// 要素が見えていない場合はスキップ
		if (!isElementVisible) return

		// RAF が既にスケジュールされている場合はキャンセル
		if (rafId.current) {
			cancelAnimationFrame(rafId.current)
		}

		rafId.current = requestAnimationFrame(() => {
			try {
				const element = getSectionElement()
				if (!element || isCalculating.current) return

				const newProgress = calculateSectionProgress(element)

				if (!newProgress) return // 変化がない場合はスキップ

				setScrollProgress(prev => {
					// 前回の値と比較してスムージング
					if (prev) {
						const smoothingFactor = 0.85 // より滑らかな補間
						const smoothedProgress = {
							overall: prev.overall * smoothingFactor + newProgress.overall * (1 - smoothingFactor),
							section: prev.section * smoothingFactor + newProgress.section * (1 - smoothingFactor),
							direction: newProgress.direction,
							velocity: prev.velocity * 0.8 + newProgress.velocity * 0.2,
						}

						// 微細な変化をフィルター
						const overallDiff = Math.abs(smoothedProgress.overall - prev.overall)
						const sectionDiff = Math.abs(smoothedProgress.section - prev.section)
						
						if (overallDiff < ANIMATION_CONFIG.scrollThreshold && 
							sectionDiff < ANIMATION_CONFIG.scrollThreshold) {
							return prev
						}

						return smoothedProgress
					}

					return newProgress
				})

			} catch (error) {
				console.error('[useScrollProgress] Handle scroll error:', error)
			}
		})
	}, [isElementVisible, getSectionElement, calculateSectionProgress])

	// スクロールイベントの登録（最適化版）
	useEffect(() => {
		if (!isElementVisible) {
			// 要素が見えていない時は進行度をnullにリセット
			setScrollProgress(null)
			lastProgressValues.current = { overall: -1, section: -1 }
			velocityHistory.current = []
			return
		}

		// 初期値の計算
		const element = getSectionElement()
		if (element && !scrollProgress) {
			const initialProgress = calculateSectionProgress(element)
			if (initialProgress) {
				setScrollProgress(initialProgress)
			}
		}

		// パッシブリスナーでスクロールイベントを監視
		const throttledHandleScroll = (() => {
			let lastCall = 0
			return () => {
				const now = performance.now()
				if (now - lastCall >= 16) { // 60FPS制限
					lastCall = now
					handleScroll()
				}
			}
		})()

		window.addEventListener('scroll', throttledHandleScroll, { passive: true })
		window.addEventListener('resize', () => {
			updateViewportInfo()
			handleScroll()
		}, { passive: true })

		return () => {
			window.removeEventListener('scroll', throttledHandleScroll)
			window.removeEventListener('resize', handleScroll)

			// RAF のクリーンアップ
			if (rafId.current) {
				cancelAnimationFrame(rafId.current)
				rafId.current = undefined
			}
		}
	}, [isElementVisible, getSectionElement, calculateSectionProgress, handleScroll, scrollProgress, updateViewportInfo])

	// メモリリーク防止のクリーンアップ
	useEffect(() => {
		return () => {
			if (rafId.current) {
				cancelAnimationFrame(rafId.current)
			}
			if (observerRef.current) {
				observerRef.current.disconnect()
			}
			// 状態をリセット
			isCalculating.current = false
			lastProgressValues.current = { overall: -1, section: -1 }
			velocityHistory.current = []
		}
	}, [])

	return scrollProgress
}

/**
 * 特定画像のスクロール範囲内判定フック（最適化版）
 */
export const useImageScrollRange = (
	imageScrollRange: { start: number; end: number; peak: number },
	globalProgress: ScrollProgress | null
) => {
	const [rangeState, setRangeState] = useState({
		isInRange: false,
		localProgress: 0,
		distanceFromPeak: 1
	})

	// 前回の値をキャッシュして無駄な更新を防ぐ
	const lastGlobalProgress = useRef<number>(-1)
	const lastRangeState = useRef(rangeState)

	// メモ化された計算関数
	const calculateRangeState = useMemo(() => {
		return (progress: number) => {
			const { start, end, peak } = imageScrollRange
			const inRange = progress >= start && progress <= end

			let localProgress = 0
			let distanceFromPeak = 1

			if (inRange) {
				// 画像のスクロール範囲内での相対進行度を計算（0-1）
				localProgress = (progress - start) / (end - start)
				// ピークからの距離を計算（0が最も近い）
				distanceFromPeak = Math.abs(progress - peak) / ((end - start) / 2)
			} else {
				// 範囲外の場合
				localProgress = progress < start ? 0 : 1
				distanceFromPeak = progress < start ? 
					(start - progress) / (start || 0.1) : 
					(progress - end) / (1 - end || 0.1)
			}

			return {
				isInRange: inRange,
				localProgress: Math.max(0, Math.min(1, localProgress)),
				distanceFromPeak: Math.max(0, Math.min(2, distanceFromPeak))
			}
		}
	}, [imageScrollRange.start, imageScrollRange.end, imageScrollRange.peak])

	useEffect(() => {
		if (!globalProgress) {
			const newState = { isInRange: false, localProgress: 0, distanceFromPeak: 1 }
			if (JSON.stringify(newState) !== JSON.stringify(lastRangeState.current)) {
				setRangeState(newState)
				lastRangeState.current = newState
			}
			return
		}

		const progress = globalProgress.overall

		// 進行度が変化していない場合はスキップ
		if (Math.abs(progress - lastGlobalProgress.current) < ANIMATION_CONFIG.scrollThreshold) {
			return
		}

		lastGlobalProgress.current = progress

		const newState = calculateRangeState(progress)

		// 状態が変化した場合のみ更新
		const stateChanged = 
			newState.isInRange !== lastRangeState.current.isInRange ||
			Math.abs(newState.localProgress - lastRangeState.current.localProgress) > ANIMATION_CONFIG.animationTolerance ||
			Math.abs(newState.distanceFromPeak - lastRangeState.current.distanceFromPeak) > ANIMATION_CONFIG.animationTolerance

		if (stateChanged) {
			setRangeState(newState)
			lastRangeState.current = newState
		}

	}, [globalProgress?.overall, calculateRangeState])

	return rangeState
}

/**
 * マルチセクション対応のスクロール進行度フック
 */
export const useMultiSectionScrollProgress = (sectionIds: string[]) => {
	const [sectionsProgress, setSectionsProgress] = useState<Record<string, ScrollProgress | null>>({})

	// 各セクションの進行度を個別計算
	const sectionProgresses = useMemo(() => {
		return sectionIds.reduce((acc, sectionId) => {
			acc[sectionId] = useScrollProgress(sectionId)
			return acc
		}, {} as Record<string, ScrollProgress | null>)
	}, [sectionIds])

	// アクティブセクションの判定
	const activeSection = useMemo(() => {
		let maxProgress = -1
		let activeSectionId = ''

		Object.entries(sectionProgresses).forEach(([sectionId, progress]) => {
			if (progress && progress.section > maxProgress) {
				maxProgress = progress.section
				activeSectionId = sectionId
			}
		})

		return activeSectionId || null
	}, [sectionProgresses])

	return {
		sectionsProgress: sectionProgresses,
		activeSection,
		isAnyActive: Object.values(sectionProgresses).some(p => p !== null)
	}
}

export default useScrollProgress
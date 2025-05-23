// src/app/components/layered-gallery/hooks/useScrollProgress.ts

'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { ScrollProgress } from '../types'
import { ANIMATION_CONFIG, DEBUG_CONFIG } from '../constants'

/**
 * スクロール進行度を計算・管理するカスタムフック（無限ループ完全修正版）
 */
export const useScrollProgress = (
	sectionId: string = 'layered-gallery-section'
): ScrollProgress | null => {
	const [scrollProgress, setScrollProgress] = useState<ScrollProgress | null>(null)
	const lastScrollY = useRef<number>(0)
	const lastTimestamp = useRef<number>(0)
	const velocityHistory = useRef<number[]>([])

	// 無限ループ防止のためのフラグと制御
	const isCalculating = useRef<boolean>(false)
	const lastLogTime = useRef<number>(0)
	const rafId = useRef<number>()
	const lastProgressValues = useRef<{ overall: number; section: number }>({ overall: -1, section: -1 })

	// スクロール進行度の計算（最適化版・無限ループ防止強化）
	const calculateProgress = useCallback((element: HTMLElement): ScrollProgress | null => {
		// 既に計算中、または要素が無効な場合はスキップ
		if (isCalculating.current || !element) {
			return null
		}

		isCalculating.current = true

		try {
			const rect = element.getBoundingClientRect()
			const viewportHeight = window.innerHeight
			const elementHeight = rect.height
			const elementTop = rect.top

			// セクション全体の進行度（0-1）
			const totalScrollRange = elementHeight + viewportHeight
			const scrolled = viewportHeight - elementTop
			const overallProgress = Math.max(0, Math.min(1, scrolled / totalScrollRange))

			// セクション内での進行度（0-1）
			const visibleStart = Math.max(0, -elementTop)
			const visibleEnd = Math.min(elementHeight, viewportHeight - elementTop)
			const visibleRange = Math.max(0, visibleEnd - visibleStart)
			const sectionProgress = elementHeight > 0 ? visibleRange / elementHeight : 0

			// 前回の値と比較して有意な変化があるかチェック
			const progressDiff = Math.abs(overallProgress - lastProgressValues.current.overall)
			const sectionDiff = Math.abs(sectionProgress - lastProgressValues.current.section)

			if (progressDiff < 0.001 && sectionDiff < 0.001) {
				// 変化が小さすぎる場合は更新しない
				return null
			}

			// 値を更新
			lastProgressValues.current = { overall: overallProgress, section: sectionProgress }

			// スクロール方向の判定
			const currentScrollY = window.scrollY
			const direction = currentScrollY >= lastScrollY.current ? 'down' : 'up'
			lastScrollY.current = currentScrollY

			// スクロール速度の計算（最適化）
			const currentTime = performance.now()
			const timeDelta = currentTime - lastTimestamp.current
			const scrollDelta = Math.abs(currentScrollY - lastScrollY.current)
			const instantVelocity = timeDelta > 16 ? scrollDelta / timeDelta : 0 // 60FPS基準

			// 速度履歴を更新（最大3フレーム分に制限）
			velocityHistory.current.push(instantVelocity)
			if (velocityHistory.current.length > 3) {
				velocityHistory.current.shift()
			}

			const averageVelocity = velocityHistory.current.length > 0
				? velocityHistory.current.reduce((sum, v) => sum + v, 0) / velocityHistory.current.length
				: 0

			lastTimestamp.current = currentTime

			return {
				overall: overallProgress,
				section: sectionProgress,
				direction,
				velocity: averageVelocity,
			}
		} catch (error) {
			console.error('[useScrollProgress] Calculation error:', error)
			return null
		} finally {
			isCalculating.current = false
		}
	}, []) // 依存関係を空にして関数の再生成を防ぐ

	// スクロールイベントハンドラー（デバウンス強化版）
	const handleScroll = useCallback(() => {
		// RAF が既にスケジュールされている場合はキャンセル
		if (rafId.current) {
			cancelAnimationFrame(rafId.current)
		}

		rafId.current = requestAnimationFrame(() => {
			try {
				const element = document.getElementById(sectionId)
				if (!element || isCalculating.current) return

				const newProgress = calculateProgress(element)

				// newProgress が null の場合は更新しない
				if (!newProgress) return

				setScrollProgress(prev => {
					// 前回の値と比較して本当に変化があるかチェック
					if (prev &&
						Math.abs(newProgress.overall - prev.overall) < ANIMATION_CONFIG.scrollThreshold &&
						Math.abs(newProgress.section - prev.section) < ANIMATION_CONFIG.scrollThreshold &&
						Math.abs(newProgress.velocity - prev.velocity) < 0.01) {
						return prev // 変化が小さい場合は前回の値を維持
					}

					return newProgress
				})

				// デバッグログ（大幅に制限）
				if (DEBUG_CONFIG.logAnimationStates) {
					const now = performance.now()
					if (now - lastLogTime.current > 1000) { // 1秒間隔でログ制限
						console.log('[useScrollProgress] Progress updated:', {
							overall: newProgress.overall.toFixed(3),
							section: newProgress.section.toFixed(3),
							direction: newProgress.direction,
						})
						lastLogTime.current = now
					}
				}
			} catch (error) {
				console.error('[useScrollProgress] Handle scroll error:', error)
			}
		})
	}, [sectionId, calculateProgress]) // calculateProgress は安定した参照

	// Intersection Observer による要素の可視性監視（最適化版）
	const [isElementVisible, setIsElementVisible] = useState<boolean>(false)
	const observerRef = useRef<IntersectionObserver | null>(null)

	// 要素の可視性監視
	useEffect(() => {
		const element = document.getElementById(sectionId)
		if (!element) return

		// 既存のオブザーバーがある場合は削除
		if (observerRef.current) {
			observerRef.current.disconnect()
		}

		observerRef.current = new IntersectionObserver(
			(entries) => {
				const [entry] = entries
				const isVisible = entry.isIntersecting

				setIsElementVisible(prev => {
					if (prev !== isVisible) {
						console.log('[useScrollProgress] Visibility changed:', isVisible)
						return isVisible
					}
					return prev
				})
			},
			{
				threshold: [0, 0.1],
				rootMargin: '100px',
			}
		)

		observerRef.current.observe(element)

		return () => {
			if (observerRef.current) {
				observerRef.current.disconnect()
				observerRef.current = null
			}
		}
	}, [sectionId]) // sectionId のみに依存

	// スクロールイベントの登録（最適化版）
	useEffect(() => {
		if (!isElementVisible) {
			// 要素が見えていない時は進行度をnullにリセット
			setScrollProgress(null)
			lastProgressValues.current = { overall: -1, section: -1 }
			return
		}

		// 初期値の計算（一度だけ）
		const element = document.getElementById(sectionId)
		if (element && !scrollProgress) {
			const initialProgress = calculateProgress(element)
			if (initialProgress) {
				setScrollProgress(initialProgress)
			}
		}

		// スクロールイベントリスナーの登録（パッシブリスナー使用）
		const throttledHandleScroll = () => {
			// スロットリング追加（16ms = 60FPS）
			if (Date.now() - lastLogTime.current < 16) return
			lastLogTime.current = Date.now()
			handleScroll()
		}

		window.addEventListener('scroll', throttledHandleScroll, { passive: true })
		window.addEventListener('resize', handleScroll, { passive: true })

		return () => {
			window.removeEventListener('scroll', throttledHandleScroll)
			window.removeEventListener('resize', handleScroll)

			// RAF のクリーンアップ
			if (rafId.current) {
				cancelAnimationFrame(rafId.current)
				rafId.current = undefined
			}
		}
	}, [isElementVisible, sectionId, handleScroll, calculateProgress]) // 安定した依存関係のみ

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
		}
	}, [])

	return scrollProgress
}

/**
 * 特定の画像のスクロール範囲内にいるかどうかを判定するヘルパーフック（最適化版）
 */
export const useImageScrollRange = (
	imageScrollRange: { start: number; end: number; peak: number },
	globalProgress: ScrollProgress | null
) => {
	const [isInRange, setIsInRange] = useState<boolean>(false)
	const [localProgress, setLocalProgress] = useState<number>(0)

	// 前回の値をキャッシュして無駄な更新を防ぐ
	const lastGlobalProgress = useRef<number>(-1)
	const lastIsInRange = useRef<boolean>(false)
	const lastLocalProgress = useRef<number>(-1)

	useEffect(() => {
		if (!globalProgress) {
			if (lastIsInRange.current !== false) {
				setIsInRange(false)
				lastIsInRange.current = false
			}
			if (lastLocalProgress.current !== 0) {
				setLocalProgress(0)
				lastLocalProgress.current = 0
			}
			return
		}

		const progress = globalProgress.overall

		// 進行度が変化していない場合はスキップ
		if (Math.abs(progress - lastGlobalProgress.current) < 0.005) {
			return
		}

		lastGlobalProgress.current = progress

		const { start, end } = imageScrollRange
		const inRange = progress >= start && progress <= end

		// 範囲状態が変化した場合のみ更新
		if (inRange !== lastIsInRange.current) {
			setIsInRange(inRange)
			lastIsInRange.current = inRange
		}

		if (inRange) {
			// 画像のスクロール範囲内での相対進行度を計算（0-1）
			const rangeProgress = (progress - start) / (end - start)
			const newLocalProgress = Math.max(0, Math.min(1, rangeProgress))

			// 有意な変化がある場合のみ更新
			if (Math.abs(newLocalProgress - lastLocalProgress.current) > 0.02) {
				setLocalProgress(newLocalProgress)
				lastLocalProgress.current = newLocalProgress
			}
		} else {
			const newLocalProgress = progress < start ? 0 : 1
			if (Math.abs(newLocalProgress - lastLocalProgress.current) > 0.02) {
				setLocalProgress(newLocalProgress)
				lastLocalProgress.current = newLocalProgress
			}
		}

	}, [globalProgress?.overall, imageScrollRange.start, imageScrollRange.end]) // 必要最小限の依存関係

	return { isInRange, localProgress }
}

export default useScrollProgress
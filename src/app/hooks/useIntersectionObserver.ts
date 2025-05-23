// src/app/hooks/useIntersectionObserver.ts

'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import { UseIntersectionObserverReturn, VisibilityConfig } from '../types/visibility'
import { DEFAULT_VISIBILITY_CONFIG, DEBUG_CONFIG } from '../config/visibilityConfig'

/**
 * Intersection Observer カスタムフック
 * 要素の可視性を効率的に監視する
 */
export const useIntersectionObserver = (
	config: Partial<VisibilityConfig> = {},
	enabled: boolean = true
): UseIntersectionObserverReturn => {
	const elementRef = useRef<HTMLElement>(null)
	const observerRef = useRef<IntersectionObserver | null>(null)
	const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null)

	// 設定のマージ
	const finalConfig = { ...DEFAULT_VISIBILITY_CONFIG, ...config }

	// 状態管理
	const [entry, setEntry] = useState<IntersectionObserverEntry | null>(null)
	const [isIntersecting, setIsIntersecting] = useState(false)
	const [intersectionRatio, setIntersectionRatio] = useState(0)

	// デバウンス処理付きの状態更新
	const updateState = useCallback((newEntry: IntersectionObserverEntry) => {
		if (debounceTimeoutRef.current) {
			clearTimeout(debounceTimeoutRef.current)
		}

		debounceTimeoutRef.current = setTimeout(() => {
			setEntry(newEntry)
			setIsIntersecting(newEntry.isIntersecting)
			setIntersectionRatio(newEntry.intersectionRatio)

			// デバッグログ
			if (DEBUG_CONFIG.ENABLED && DEBUG_CONFIG.LOG_LEVEL === 'debug') {
				console.debug('[useIntersectionObserver] State updated:', {
					isIntersecting: newEntry.isIntersecting,
					intersectionRatio: newEntry.intersectionRatio,
					boundingClientRect: newEntry.boundingClientRect,
					rootBounds: newEntry.rootBounds,
				})
			}
		}, finalConfig.debounceMs)
	}, [finalConfig.debounceMs])

	// Intersection Observer の初期化
	useEffect(() => {
		if (!enabled || !elementRef.current) {
			return
		}

		// Intersection Observer 未対応ブラウザのフォールバック
		if (!window.IntersectionObserver) {
			console.warn('[useIntersectionObserver] IntersectionObserver not supported, falling back to always visible')
			setIsIntersecting(true)
			setIntersectionRatio(1)
			return
		}

		const element = elementRef.current

		// Observer のコールバック関数
		const handleIntersection = (entries: IntersectionObserverEntry[]) => {
			const [currentEntry] = entries
			if (currentEntry) {
				updateState(currentEntry)
			}
		}

		// Observer の作成
		try {
			observerRef.current = new IntersectionObserver(handleIntersection, {
				root: null, // viewport をルートとして使用
				rootMargin: finalConfig.rootMargin,
				threshold: finalConfig.threshold,
			})

			// 要素の監視開始
			observerRef.current.observe(element)

			if (DEBUG_CONFIG.ENABLED && DEBUG_CONFIG.LOG_LEVEL === 'info') {
				console.info('[useIntersectionObserver] Observer initialized:', {
					rootMargin: finalConfig.rootMargin,
					threshold: finalConfig.threshold,
					element: element.tagName,
				})
			}
		} catch (error) {
			console.error('[useIntersectionObserver] Failed to create observer:', error)
			// エラー時は可視として扱う（安全側の動作）
			setIsIntersecting(true)
			setIntersectionRatio(1)
		}

		// クリーンアップ関数
		return () => {
			if (observerRef.current) {
				observerRef.current.disconnect()
				observerRef.current = null
			}

			if (debounceTimeoutRef.current) {
				clearTimeout(debounceTimeoutRef.current)
				debounceTimeoutRef.current = null
			}

			if (DEBUG_CONFIG.ENABLED && DEBUG_CONFIG.LOG_LEVEL === 'debug') {
				console.debug('[useIntersectionObserver] Observer cleaned up')
			}
		}
	}, [enabled, finalConfig.rootMargin, finalConfig.threshold, updateState])

	// enabled が false になった時の処理
	useEffect(() => {
		if (!enabled) {
			// 監視を停止し、状態をリセット
			if (observerRef.current) {
				observerRef.current.disconnect()
				observerRef.current = null
			}

			setEntry(null)
			setIsIntersecting(false)
			setIntersectionRatio(0)

			if (DEBUG_CONFIG.ENABLED && DEBUG_CONFIG.LOG_LEVEL === 'debug') {
				console.debug('[useIntersectionObserver] Observer disabled')
			}
		}
	}, [enabled])

	// パフォーマンス監視（開発時のみ）
	useEffect(() => {
		if (!DEBUG_CONFIG.ENABLED || !DEBUG_CONFIG.SHOW_PERFORMANCE_METRICS) {
			return
		}

		const startTime = performance.now()

		return () => {
			const endTime = performance.now()
			const duration = endTime - startTime

			if (duration > 100) { // 100ms を超える場合は警告
				console.warn('[useIntersectionObserver] Long-running hook detected:', {
					duration: `${duration.toFixed(2)}ms`,
					config: finalConfig,
				})
			}
		}
	}, [finalConfig])

	// Window resize イベントの処理（root bounds の更新）
	useEffect(() => {
		if (!enabled || !observerRef.current || !elementRef.current) {
			return
		}

		const handleResize = () => {
			// Observer を再初期化して root bounds を更新
			if (observerRef.current && elementRef.current) {
				observerRef.current.unobserve(elementRef.current)
				observerRef.current.observe(elementRef.current)

				if (DEBUG_CONFIG.ENABLED && DEBUG_CONFIG.LOG_LEVEL === 'debug') {
					console.debug('[useIntersectionObserver] Observer refreshed due to resize')
				}
			}
		}

		// リサイズイベントをデバウンス
		let resizeTimeout: NodeJS.Timeout
		const debouncedResize = () => {
			clearTimeout(resizeTimeout)
			resizeTimeout = setTimeout(handleResize, 250)
		}

		window.addEventListener('resize', debouncedResize, { passive: true })

		return () => {
			window.removeEventListener('resize', debouncedResize)
			clearTimeout(resizeTimeout)
		}
	}, [enabled])

	return {
		elementRef,
		entry,
		isIntersecting,
		intersectionRatio,
	}
}
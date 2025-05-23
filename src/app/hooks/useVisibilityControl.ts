// src/app/hooks/useVisibilityControl.ts

'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import {
	VisibilityState,
	ComponentType,
	VisibilityInfo,
	CanvasControlState,
	UseVisibilityControlReturn,
	VisibilityConfig
} from '../types/visibility'
import { useIntersectionObserver } from './useIntersectionObserver'
import { getVisibilityConfig, COMPONENT_IMPORTANCE, DEBUG_CONFIG } from '../config/visibilityConfig'

/**
 * 可視性制御の中心となるカスタムフック
 * Intersection Observer と Canvas制御を統合管理
 */
export const useVisibilityControl = (
	componentId: string,
	componentType: ComponentType,
	config?: Partial<VisibilityConfig>
): UseVisibilityControlReturn => {
	const configRef = useRef(getVisibilityConfig(componentType))
	const lastStateChangeRef = useRef(Date.now())
	const memoryReleaseTimeoutRef = useRef<NodeJS.Timeout | null>(null)
	const initializationTimeoutRef = useRef<NodeJS.Timeout | null>(null)

	// カスタム設定があれば適用
	if (config) {
		configRef.current = { ...configRef.current, ...config }
	}

	// Intersection Observer の初期化
	const { elementRef, isIntersecting, intersectionRatio } = useIntersectionObserver(
		configRef.current,
		true
	)

	// 可視性状態の管理
	const [visibilityState, setVisibilityState] = useState<VisibilityState>('hidden')
	const [canvasState, setCanvasState] = useState<CanvasControlState>({
		frameloop: 'never',
		priority: 1,
		isInitialized: false,
		isAnimating: false,
	})

	// 可視性状態の計算
	const calculateVisibilityState = useCallback((
		intersecting: boolean,
		ratio: number
	): VisibilityState => {
		if (!intersecting) {
			return 'hidden'
		}

		if (ratio < 0.1) {
			return 'approaching'
		} else if (ratio < 0.5) {
			return 'partial'
		} else {
			return 'visible'
		}
	}, [])

	// 優先度の計算
	const calculatePriority = useCallback((state: VisibilityState, ratio: number): number => {
		const baseImportance = COMPONENT_IMPORTANCE[componentType] || 5

		switch (state) {
			case 'visible':
				return Math.min(10, baseImportance + (ratio * 3))
			case 'partial':
				return Math.min(8, baseImportance + (ratio * 2))
			case 'approaching':
				return Math.min(6, baseImportance + 1)
			case 'hidden':
			default:
				return 1
		}
	}, [componentType])

	// Canvas制御の更新
	const updateCanvasState = useCallback((newVisibilityState: VisibilityState, ratio: number) => {
		const priority = calculatePriority(newVisibilityState, ratio)

		setCanvasState(prev => {
			const newState: CanvasControlState = { ...prev, priority }

			switch (newVisibilityState) {
				case 'hidden':
					newState.frameloop = 'never'
					newState.isAnimating = false
					break

				case 'approaching':
					newState.frameloop = 'demand'
					newState.isAnimating = false
					// 初期化開始（遅延実行）
					if (!prev.isInitialized) {
						if (initializationTimeoutRef.current) {
							clearTimeout(initializationTimeoutRef.current)
						}
						initializationTimeoutRef.current = setTimeout(() => {
							setCanvasState(current => ({ ...current, isInitialized: true }))
						}, 100)
					}
					break

				case 'partial':
					newState.frameloop = 'always'
					newState.isAnimating = true
					newState.isInitialized = true
					break

				case 'visible':
					newState.frameloop = 'always'
					newState.isAnimating = true
					newState.isInitialized = true
					break
			}

			return newState
		})
	}, [calculatePriority])

	// メモリ解放の管理
	const scheduleMemoryRelease = useCallback(() => {
		if (memoryReleaseTimeoutRef.current) {
			clearTimeout(memoryReleaseTimeoutRef.current)
		}

		memoryReleaseTimeoutRef.current = setTimeout(() => {
			if (visibilityState === 'hidden') {
				setCanvasState(prev => ({
					...prev,
					isInitialized: false,
					frameloop: 'never',
					isAnimating: false,
				}))

				if (DEBUG_CONFIG.ENABLED) {
					console.info(`[useVisibilityControl] Memory released for ${componentId}`)
				}
			}
		}, configRef.current.memoryReleaseDelay)
	}, [componentId, visibilityState])

	// 可視性状態の変更処理
	useEffect(() => {
		const newState = calculateVisibilityState(isIntersecting, intersectionRatio)

		if (newState !== visibilityState) {
			const now = Date.now()
			lastStateChangeRef.current = now

			setVisibilityState(newState)
			updateCanvasState(newState, intersectionRatio)

			// メモリ解放のスケジューリング
			if (newState === 'hidden') {
				scheduleMemoryRelease()
			} else {
				// 可視状態になったらメモリ解放をキャンセル
				if (memoryReleaseTimeoutRef.current) {
					clearTimeout(memoryReleaseTimeoutRef.current)
					memoryReleaseTimeoutRef.current = null
				}
			}

			if (DEBUG_CONFIG.ENABLED && DEBUG_CONFIG.LOG_LEVEL === 'info') {
				console.info(`[useVisibilityControl] ${componentId} state changed:`, {
					from: visibilityState,
					to: newState,
					ratio: intersectionRatio,
					isIntersecting,
				})
			}
		} else if (visibilityState !== 'hidden') {
			// 状態は同じだが比率が変わった場合の優先度更新
			updateCanvasState(newState, intersectionRatio)
		}
	}, [
		isIntersecting,
		intersectionRatio,
		visibilityState,
		calculateVisibilityState,
		updateCanvasState,
		scheduleMemoryRelease,
		componentId
	])

	// 制御関数の定義
	const controls = {
		startAnimation: useCallback(() => {
			setCanvasState(prev => ({
				...prev,
				isAnimating: true,
				frameloop: 'always',
			}))

			if (DEBUG_CONFIG.ENABLED) {
				console.info(`[useVisibilityControl] Animation started for ${componentId}`)
			}
		}, [componentId]),

		stopAnimation: useCallback(() => {
			setCanvasState(prev => ({
				...prev,
				isAnimating: false,
				frameloop: prev.isInitialized ? 'demand' : 'never',
			}))

			if (DEBUG_CONFIG.ENABLED) {
				console.info(`[useVisibilityControl] Animation stopped for ${componentId}`)
			}
		}, [componentId]),

		forceRender: useCallback(() => {
			setCanvasState(prev => ({
				...prev,
				frameloop: 'always',
				isInitialized: true,
				isAnimating: true,
				priority: 10,
			}))

			if (DEBUG_CONFIG.ENABLED) {
				console.info(`[useVisibilityControl] Force render triggered for ${componentId}`)
			}
		}, [componentId]),

		dispose: useCallback(() => {
			// すべてのタイマーをクリア
			if (memoryReleaseTimeoutRef.current) {
				clearTimeout(memoryReleaseTimeoutRef.current)
				memoryReleaseTimeoutRef.current = null
			}
			if (initializationTimeoutRef.current) {
				clearTimeout(initializationTimeoutRef.current)
				initializationTimeoutRef.current = null
			}

			// 状態をリセット
			setCanvasState({
				frameloop: 'never',
				priority: 1,
				isInitialized: false,
				isAnimating: false,
			})

			setVisibilityState('hidden')

			if (DEBUG_CONFIG.ENABLED) {
				console.info(`[useVisibilityControl] Disposed ${componentId}`)
			}
		}, [componentId]),
	}

	// クリーンアップ
	useEffect(() => {
		return () => {
			controls.dispose()
		}
	}, [controls])

	// パフォーマンス監視（開発時のみ）
	useEffect(() => {
		if (!DEBUG_CONFIG.ENABLED || !DEBUG_CONFIG.SHOW_PERFORMANCE_METRICS) {
			return
		}

		const startTime = performance.now()

		return () => {
			const endTime = performance.now()
			const duration = endTime - startTime

			if (duration > 50) {
				console.warn(`[useVisibilityControl] Performance warning for ${componentId}:`, {
					duration: `${duration.toFixed(2)}ms`,
					state: visibilityState,
					canvasState,
				})
			}
		}
	}, [componentId, visibilityState, canvasState])

	// 可視性情報の構築
	const visibilityInfo: VisibilityInfo = {
		state: visibilityState,
		intersectionRatio,
		isIntersecting,
		lastStateChange: lastStateChangeRef.current,
		componentType,
	}

	return {
		visibilityInfo,
		canvasState,
		elementRef,
		controls,
	}
}
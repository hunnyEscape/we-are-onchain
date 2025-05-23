// src/app/hooks/useCanvasControl.ts

'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { CanvasControlState } from '../types/visibility'
import { getPerformanceConfig, DEBUG_CONFIG } from '../config/visibilityConfig'

export interface CanvasControlOptions {
	/** 初期のframeloop設定 */
	initialFrameloop?: 'always' | 'never' | 'demand'
	/** 自動FPS制限を有効にするか */
	enableFPSLimit?: boolean
	/** カスタムFPS目標値 */
	targetFPS?: number
	/** メモリ使用量の監視を有効にするか */
	enableMemoryMonitoring?: boolean
}

export interface CanvasControlReturn {
	/** 現在のCanvas制御状態 */
	canvasState: CanvasControlState
	/** frameloopを設定 */
	setFrameloop: (frameloop: 'always' | 'never' | 'demand') => void
	/** アニメーションを開始 */
	startAnimation: () => void
	/** アニメーションを停止 */
	stopAnimation: () => void
	/** 初期化状態を設定 */
	setInitialized: (initialized: boolean) => void
	/** 優先度を設定 */
	setPriority: (priority: number) => void
	/** パフォーマンス統計 */
	performanceStats: {
		currentFPS: number
		averageFPS: number
		frameTime: number
		memoryUsage: number
	}
	/** Canvas要素の参照 */
	canvasRef: React.RefObject<HTMLCanvasElement>
}

/**
 * Canvas の frameloop とパフォーマンスを制御するフック
 */
export const useCanvasControl = (
	componentId: string,
	options: CanvasControlOptions = {}
): CanvasControlReturn => {
	const {
		initialFrameloop = 'never',
		enableFPSLimit = true,
		targetFPS,
		enableMemoryMonitoring = true,
	} = options

	const canvasRef = useRef<HTMLCanvasElement>(null)
	const frameCountRef = useRef(0)
	const lastTimeRef = useRef(performance.now())
	const fpsHistoryRef = useRef<number[]>([])
	const animationFrameRef = useRef<number | null>(null)

	const performanceConfig = getPerformanceConfig()
	const finalTargetFPS = targetFPS || performanceConfig.TARGET_FPS

	// Canvas制御状態
	const [canvasState, setCanvasState] = useState<CanvasControlState>({
		frameloop: initialFrameloop,
		priority: 1,
		isInitialized: false,
		isAnimating: false,
	})

	// パフォーマンス統計
	const [performanceStats, setPerformanceStats] = useState({
		currentFPS: 0,
		averageFPS: 0,
		frameTime: 0,
		memoryUsage: 0,
	})

	// FPS測定
	const measureFPS = useCallback(() => {
		const now = performance.now()
		const delta = now - lastTimeRef.current

		if (delta >= 1000) { // 1秒ごとに測定
			const fps = (frameCountRef.current * 1000) / delta

			// FPS履歴を更新（最大100件保持）
			fpsHistoryRef.current.push(fps)
			if (fpsHistoryRef.current.length > 100) {
				fpsHistoryRef.current.shift()
			}

			const averageFPS = fpsHistoryRef.current.reduce((a, b) => a + b, 0) / fpsHistoryRef.current.length

			setPerformanceStats(prev => ({
				...prev,
				currentFPS: Math.round(fps),
				averageFPS: Math.round(averageFPS),
				frameTime: delta / frameCountRef.current,
			}))

			frameCountRef.current = 0
			lastTimeRef.current = now

			// FPS が目標を下回った場合の警告
			if (DEBUG_CONFIG.ENABLED && fps < performanceConfig.MIN_FPS) {
				console.warn(`[useCanvasControl] Low FPS detected for ${componentId}:`, {
					currentFPS: fps,
					targetFPS: finalTargetFPS,
					minFPS: performanceConfig.MIN_FPS,
				})
			}
		}

		frameCountRef.current++
	}, [componentId, finalTargetFPS, performanceConfig.MIN_FPS])

	// メモリ使用量の測定
	const measureMemoryUsage = useCallback(() => {
		if (!enableMemoryMonitoring || !('memory' in performance)) {
			return
		}

		try {
			const memInfo = (performance as any).memory
			const memoryUsage = memInfo.usedJSHeapSize / (1024 * 1024) // MB変換

			setPerformanceStats(prev => ({
				...prev,
				memoryUsage: Math.round(memoryUsage),
			}))

			// メモリ使用量の警告
			if (memoryUsage > performanceConfig.MEMORY_WARNING_THRESHOLD) {
				const level = memoryUsage > performanceConfig.MEMORY_CRITICAL_THRESHOLD ? 'error' : 'warn'
				console[level](`[useCanvasControl] High memory usage for ${componentId}:`, {
					current: `${memoryUsage.toFixed(1)}MB`,
					warning: `${performanceConfig.MEMORY_WARNING_THRESHOLD}MB`,
					critical: `${performanceConfig.MEMORY_CRITICAL_THRESHOLD}MB`,
				})
			}
		} catch (error) {
			if (DEBUG_CONFIG.ENABLED) {
				console.debug(`[useCanvasControl] Memory measurement failed for ${componentId}:`, error)
			}
		}
	}, [componentId, enableMemoryMonitoring, performanceConfig])

	// フレームループの監視
	const frameLoop = useCallback(() => {
		if (canvasState.frameloop === 'always' && canvasState.isAnimating) {
			measureFPS()

			// FPS制限の実装
			if (enableFPSLimit) {
				const targetFrameTime = 1000 / finalTargetFPS
				const currentTime = performance.now()
				const elapsedTime = currentTime - lastTimeRef.current

				if (elapsedTime < targetFrameTime) {
					// フレームレート制限のため次のフレームを遅延
					setTimeout(() => {
						animationFrameRef.current = requestAnimationFrame(frameLoop)
					}, targetFrameTime - elapsedTime)
					return
				}
			}

			animationFrameRef.current = requestAnimationFrame(frameLoop)
		}
	}, [canvasState.frameloop, canvasState.isAnimating, measureFPS, enableFPSLimit, finalTargetFPS])

	// フレームループの開始/停止制御
	useEffect(() => {
		if (canvasState.frameloop === 'always' && canvasState.isAnimating) {
			animationFrameRef.current = requestAnimationFrame(frameLoop)
		} else {
			if (animationFrameRef.current !== null) {
				cancelAnimationFrame(animationFrameRef.current)
				animationFrameRef.current = null
			}
		}

		return () => {
			if (animationFrameRef.current !== null) {
				cancelAnimationFrame(animationFrameRef.current)
				animationFrameRef.current = null
			}
		}
	}, [canvasState.frameloop, canvasState.isAnimating, frameLoop])

	// メモリ測定の定期実行
	useEffect(() => {
		if (!enableMemoryMonitoring) return

		const interval = setInterval(measureMemoryUsage, performanceConfig.METRICS_UPDATE_INTERVAL)

		return () => clearInterval(interval)
	}, [measureMemoryUsage, enableMemoryMonitoring, performanceConfig.METRICS_UPDATE_INTERVAL])

	// 制御関数
	const setFrameloop = useCallback((frameloop: 'always' | 'never' | 'demand') => {
		setCanvasState(prev => ({ ...prev, frameloop }))

		if (DEBUG_CONFIG.ENABLED) {
			console.info(`[useCanvasControl] Frameloop changed for ${componentId}:`, {
				from: canvasState.frameloop,
				to: frameloop,
			})
		}
	}, [componentId, canvasState.frameloop])

	const startAnimation = useCallback(() => {
		setCanvasState(prev => ({
			...prev,
			isAnimating: true,
			frameloop: prev.frameloop === 'never' ? 'always' : prev.frameloop,
		}))

		if (DEBUG_CONFIG.ENABLED) {
			console.info(`[useCanvasControl] Animation started for ${componentId}`)
		}
	}, [componentId])

	const stopAnimation = useCallback(() => {
		setCanvasState(prev => ({ ...prev, isAnimating: false }))

		if (DEBUG_CONFIG.ENABLED) {
			console.info(`[useCanvasControl] Animation stopped for ${componentId}`)
		}
	}, [componentId])

	const setInitialized = useCallback((initialized: boolean) => {
		setCanvasState(prev => ({ ...prev, isInitialized: initialized }))

		if (DEBUG_CONFIG.ENABLED) {
			console.info(`[useCanvasControl] Initialization state changed for ${componentId}:`, initialized)
		}
	}, [componentId])

	const setPriority = useCallback((priority: number) => {
		const clampedPriority = Math.max(1, Math.min(10, priority))
		setCanvasState(prev => ({ ...prev, priority: clampedPriority }))

		if (DEBUG_CONFIG.ENABLED && DEBUG_CONFIG.LOG_LEVEL === 'debug') {
			console.debug(`[useCanvasControl] Priority changed for ${componentId}:`, {
				from: canvasState.priority,
				to: clampedPriority,
			})
		}
	}, [componentId, canvasState.priority])

	// Canvas要素の監視
	useEffect(() => {
		if (!canvasRef.current) return

		const canvas = canvasRef.current

		// Canvas のコンテキストロスト/復元の処理
		const handleContextLost = (event: Event) => {
			event.preventDefault()
			console.warn(`[useCanvasControl] WebGL context lost for ${componentId}`)
			setCanvasState(prev => ({ ...prev, isAnimating: false, frameloop: 'never' }))
		}

		const handleContextRestored = () => {
			console.info(`[useCanvasControl] WebGL context restored for ${componentId}`)
			setCanvasState(prev => ({ ...prev, isInitialized: false }))
		}

		canvas.addEventListener('webglcontextlost', handleContextLost)
		canvas.addEventListener('webglcontextrestored', handleContextRestored)

		return () => {
			canvas.removeEventListener('webglcontextlost', handleContextLost)
			canvas.removeEventListener('webglcontextrestored', handleContextRestored)
		}
	}, [componentId])

	// デバッグ情報の出力
	useEffect(() => {
		if (!DEBUG_CONFIG.ENABLED || !DEBUG_CONFIG.SHOW_PERFORMANCE_METRICS) return

		const interval = setInterval(() => {
			console.debug(`[useCanvasControl] Performance stats for ${componentId}:`, {
				canvasState,
				performanceStats,
			})
		}, 5000) // 5秒ごと

		return () => clearInterval(interval)
	}, [componentId, canvasState, performanceStats])

	return {
		canvasState,
		setFrameloop,
		startAnimation,
		stopAnimation,
		setInitialized,
		setPriority,
		performanceStats,
		canvasRef,
	}
}
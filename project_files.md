-e 
### FILE: ./src/app/types/visibility.ts

// src/app/types/visibility.ts

/**
 * 可視性状態の定義
 */
export type VisibilityState =
	| 'hidden'      // 完全非表示（Canvas非レンダリング）
	| 'approaching' // 接近中（初期化開始）
	| 'visible'     // 可視（フルアニメーション）
	| 'partial'     // 部分可視（制限付き処理）

/**
 * 3Dコンポーネントの種類
 */
export type ComponentType =
	| 'sphere'
	| 'pepe3d'
	| 'floating-images'
	| 'glowing-text'
	| 'pepe-push'

/**
 * 可視性制御の設定
 */
export interface VisibilityConfig {
	/** Intersection Observerの閾値 */
	threshold: number | number[]
	/** ルートマージン（事前準備の範囲） */
	rootMargin: string
	/** デバウンス時間（ms） */
	debounceMs: number
	/** 長時間非表示後のメモリ解放時間（ms） */
	memoryReleaseDelay: number
}

/**
 * 可視性状態の詳細情報
 */
export interface VisibilityInfo {
	/** 現在の可視性状態 */
	state: VisibilityState
	/** 可視領域の割合（0-1） */
	intersectionRatio: number
	/** 要素が画面内にあるかどうか */
	isIntersecting: boolean
	/** 状態が変更された時刻 */
	lastStateChange: number
	/** コンポーネントの種類 */
	componentType: ComponentType
}

/**
 * Canvas制御の状態
 */
export interface CanvasControlState {
	/** frameloopの状態 */
	frameloop: 'always' | 'never' | 'demand'
	/** レンダリング優先度（1-10、10が最高） */
	priority: number
	/** 初期化完了フラグ */
	isInitialized: boolean
	/** アニメーション実行フラグ */
	isAnimating: boolean
}

/**
 * パフォーマンス監視データ
 */
export interface PerformanceMetrics {
	/** アクティブなCanvas数 */
	activeCanvasCount: number
	/** useFrame実行回数/フレーム */
	frameCallsPerFrame: number
	/** メモリ使用量（MB） */
	memoryUsage: number
	/** 現在のFPS */
	currentFPS: number
	/** 最後の測定時刻 */
	lastMeasured: number
}

/**
 * 可視性制御フックの戻り値
 */
export interface UseVisibilityControlReturn {
	/** 現在の可視性情報 */
	visibilityInfo: VisibilityInfo
	/** Canvas制御状態 */
	canvasState: CanvasControlState
	/** 要素の参照（Intersection Observer用） */
	elementRef: React.RefObject<HTMLElement>
	/** Canvas制御関数 */
	controls: {
		/** アニメーション開始 */
		startAnimation: () => void
		/** アニメーション停止 */
		stopAnimation: () => void
		/** 強制的にレンダリング開始 */
		forceRender: () => void
		/** リソース解放 */
		dispose: () => void
	}
}

/**
 * Intersection Observer フックの戻り値
 */
export interface UseIntersectionObserverReturn {
	/** 要素の参照 */
	elementRef: React.RefObject<HTMLElement>
	/** 交差情報 */
	entry: IntersectionObserverEntry | null
	/** 可視性フラグ */
	isIntersecting: boolean
	/** 可視領域の割合 */
	intersectionRatio: number
}

/**
 * 可視性管理マネージャーのインターface
 */
export interface VisibilityManager {
	/** コンポーネントを登録 */
	register: (id: string, componentType: ComponentType, config?: Partial<VisibilityConfig>) => void
	/** コンポーネントの登録解除 */
	unregister: (id: string) => void
	/** 状態を更新 */
	updateState: (id: string, state: VisibilityState, intersectionRatio: number) => void
	/** 優先度を取得 */
	getPriority: (id: string) => number
	/** アクティブなコンポーネント一覧を取得 */
	getActiveComponents: () => string[]
	/** パフォーマンス指標を取得 */
	getMetrics: () => PerformanceMetrics
}

/**
 * デバッグ情報
 */
export interface DebugInfo {
	/** 登録されたコンポーネント一覧 */
	registeredComponents: Record<string, {
		type: ComponentType
		state: VisibilityState
		priority: number
		lastUpdate: number
	}>
	/** パフォーマンス履歴 */
	performanceHistory: PerformanceMetrics[]
	/** エラーログ */
	errors: {
		timestamp: number
		component: string
		message: string
		stack?: string
	}[]
}

/**
 * エラーハンドリング用の型
 */
export interface VisibilityError extends Error {
	componentId?: string
	componentType?: ComponentType
	state?: VisibilityState
	timestamp: number
}-e 
### FILE: ./src/app/config/visibilityConfig.ts

// src/app/config/visibilityConfig.ts

import { VisibilityConfig, ComponentType } from '../types/visibility'

/**
 * デフォルトの可視性制御設定
 */
export const DEFAULT_VISIBILITY_CONFIG: VisibilityConfig = {
	// 10%が可視になった時点で検知
	threshold: [0, 0.1, 0.25, 0.5, 0.75, 1.0],
	// 画面端から200px手前で事前準備開始
	rootMargin: '200px',
	// イベント頻度制限（50ms）
	debounceMs: 50,
	// 5分間非表示後にメモリ解放
	memoryReleaseDelay: 5 * 60 * 1000,
}

/**
 * コンポーネント別の可視性制御設定
 */
export const COMPONENT_VISIBILITY_CONFIGS: Record<ComponentType, Partial<VisibilityConfig>> = {
	// SphereTop - 大きなテクスチャを持つため早めに準備
	sphere: {
		rootMargin: '300px',
		threshold: [0, 0.05, 0.1, 0.5, 1.0],
		debounceMs: 100, // 少し長めのデバウンス
	},

	// PepeTop - スクロールメッセージとの協調が重要
	'pepe3d': {
		rootMargin: '250px',
		threshold: [0, 0.1, 0.3, 0.5, 0.8, 1.0],
		debounceMs: 30, // 細かい制御が必要
	},

	// FloatingImages - 35枚の画像、最も重要な最適化対象
	'floating-images': {
		rootMargin: '400px', // 最も早く準備開始
		threshold: [0, 0.1, 0.25, 0.5, 0.75, 1.0],
		debounceMs: 25, // 最も細かい制御
		memoryReleaseDelay: 3 * 60 * 1000, // 3分で解放（頻繁なアクセス想定）
	},

	// GlowingText - 複数モデルの協調制御
	'glowing-text': {
		rootMargin: '200px',
		threshold: [0, 0.1, 0.5, 1.0],
		debounceMs: 50,
	},

	// PepePush - スクロール連動アニメーション
	'pepe-push': {
		rootMargin: '250px',
		threshold: [0, 0.1, 0.3, 0.5, 0.7, 1.0],
		debounceMs: 16, // 60FPS相当の細かい制御
	},
}

/**
 * パフォーマンス制御の設定
 */
export const PERFORMANCE_CONFIG = {
	// 同時にアクティブにできる最大Canvas数
	MAX_ACTIVE_CANVAS: 2,

	// フレームレート制限
	TARGET_FPS: 60,
	MIN_FPS: 30,

	// メモリ使用量の閾値（MB）
	MEMORY_WARNING_THRESHOLD: 200,
	MEMORY_CRITICAL_THRESHOLD: 400,

	// パフォーマンス測定間隔（ms）
	METRICS_UPDATE_INTERVAL: 1000,

	// 優先度スコアの重み
	PRIORITY_WEIGHTS: {
		VISIBILITY_RATIO: 40,     // 可視領域の割合（40%）
		DISTANCE_FROM_CENTER: 30, // 画面中央からの距離（30%）
		COMPONENT_IMPORTANCE: 20,  // コンポーネントの重要度（20%）
		USER_INTERACTION: 10,      // ユーザー操作履歴（10%）
	},
} as const

/**
 * コンポーネントの重要度設定（1-10、10が最高）
 */
export const COMPONENT_IMPORTANCE: Record<ComponentType, number> = {
	'floating-images': 10, // 最重要（最も重い処理）
	'sphere': 8,
	'pepe3d': 7,
	'pepe-push': 6,
	'glowing-text': 5,
}

/**
 * デバッグモードの設定
 */
export const DEBUG_CONFIG = {
	// デバッグモードの有効化（開発環境のみ）
	ENABLED: process.env.NODE_ENV === 'development',

	// デバッグ情報の表示設定
	SHOW_VISIBILITY_OVERLAY: false,
	SHOW_PERFORMANCE_METRICS: true,
	SHOW_COMPONENT_BOUNDARIES: false,

	// ログレベル
	LOG_LEVEL: 'info' as 'debug' | 'info' | 'warn' | 'error',

	// パフォーマンス履歴の保持数
	PERFORMANCE_HISTORY_SIZE: 100,

	// エラーログの保持数
	ERROR_LOG_SIZE: 50,
}

/**
 * レスポンシブ設定
 */
export const RESPONSIVE_CONFIG = {
	// モバイルでの設定調整
	MOBILE: {
		// より積極的なメモリ管理
		memoryReleaseDelay: 2 * 60 * 1000, // 2分で解放
		// より大きなマージン（タッチスクロールを考慮）
		rootMarginMultiplier: 1.5,
		// より少ない同時Canvas数
		maxActiveCanvas: 1,
		// より低いフレームレート目標
		targetFPS: 30,
	},

	// タブレットでの設定調整
	TABLET: {
		memoryReleaseDelay: 3 * 60 * 1000, // 3分で解放
		rootMarginMultiplier: 1.2,
		maxActiveCanvas: 2,
		targetFPS: 45,
	},
}

/**
 * 画面サイズ判定の閾値
 */
export const BREAKPOINTS = {
	MOBILE: 768,
	TABLET: 1024,
	DESKTOP: 1280,
} as const

/**
 * コンポーネント設定を取得するヘルパー関数
 */
export const getVisibilityConfig = (componentType: ComponentType): VisibilityConfig => {
	const defaultConfig = DEFAULT_VISIBILITY_CONFIG
	const componentConfig = COMPONENT_VISIBILITY_CONFIGS[componentType] || {}

	// レスポンシブ設定の適用
	const screenWidth = typeof window !== 'undefined' ? window.innerWidth : 1920
	let responsiveConfig = {}

	if (screenWidth <= BREAKPOINTS.MOBILE) {
		responsiveConfig = {
			rootMargin: `${parseInt(defaultConfig.rootMargin) * RESPONSIVE_CONFIG.MOBILE.rootMarginMultiplier}px`,
			memoryReleaseDelay: RESPONSIVE_CONFIG.MOBILE.memoryReleaseDelay,
		}
	} else if (screenWidth <= BREAKPOINTS.TABLET) {
		responsiveConfig = {
			rootMargin: `${parseInt(defaultConfig.rootMargin) * RESPONSIVE_CONFIG.TABLET.rootMarginMultiplier}px`,
			memoryReleaseDelay: RESPONSIVE_CONFIG.TABLET.memoryReleaseDelay,
		}
	}

	return {
		...defaultConfig,
		...componentConfig,
		...responsiveConfig,
	}
}

/**
 * パフォーマンス設定を取得するヘルパー関
 */
export const getPerformanceConfig = () => {
	const screenWidth = typeof window !== 'undefined' ? window.innerWidth : 1920

	if (screenWidth <= BREAKPOINTS.MOBILE) {
		return {
			...PERFORMANCE_CONFIG,
			MAX_ACTIVE_CANVAS: RESPONSIVE_CONFIG.MOBILE.maxActiveCanvas,
			TARGET_FPS: RESPONSIVE_CONFIG.MOBILE.targetFPS,
		}
	} else if (screenWidth <= BREAKPOINTS.TABLET) {
		return {
			...PERFORMANCE_CONFIG,
			MAX_ACTIVE_CANVAS: RESPONSIVE_CONFIG.TABLET.maxActiveCanvas,
			TARGET_FPS: RESPONSIVE_CONFIG.TABLET.targetFPS,
		}
	}

	return PERFORMANCE_CONFIG
}-e 
### FILE: ./src/app/hooks/useIntersectionObserver.ts

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
}-e 
### FILE: ./src/app/hooks/useCanvasControl.ts

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
}-e 
### FILE: ./src/app/hooks/useVisibilityControl.ts

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
}-e 
### FILE: ./src/app/utils/visibilityManager.ts

// src/app/utils/visibilityManager.ts

'use client'

import {
	VisibilityManager,
	VisibilityState,
	ComponentType,
	PerformanceMetrics,
	DebugInfo,
	VisibilityConfig
} from '../types/visibility'
import {
	getPerformanceConfig,
	COMPONENT_IMPORTANCE,
	DEBUG_CONFIG
} from '../config/visibilityConfig'

interface ComponentInfo {
	id: string
	type: ComponentType
	state: VisibilityState
	intersectionRatio: number
	priority: number
	lastUpdate: number
	config: VisibilityConfig
	isActive: boolean
}

/**
 * 可視性管理の中央制御システム
 * 複数の3Dコンポーネントの優先度制御とパフォーマンス監視を行う
 */
class VisibilityManagerImpl implements VisibilityManager {
	private components = new Map<string, ComponentInfo>()
	private performanceHistory: PerformanceMetrics[] = []
	private errorLog: DebugInfo['errors'] = []
	private performanceConfig = getPerformanceConfig()
	private metricsInterval: NodeJS.Timeout | null = null

	constructor() {
		this.startPerformanceMonitoring()

		if (DEBUG_CONFIG.ENABLED) {
			this.setupDebugMode()
		}
	}

	/**
	 * コンポーネントを登録
	 */
	register(id: string, componentType: ComponentType, config?: Partial<VisibilityConfig>): void {
		try {
			if (this.components.has(id)) {
				console.warn(`[VisibilityManager] Component ${id} is already registered`)
				return
			}

			const componentInfo: ComponentInfo = {
				id,
				type: componentType,
				state: 'hidden',
				intersectionRatio: 0,
				priority: 1,
				lastUpdate: Date.now(),
				config: config as VisibilityConfig, // 実際の使用時には完全な設定が渡される
				isActive: false,
			}

			this.components.set(id, componentInfo)

			if (DEBUG_CONFIG.ENABLED) {
				console.info(`[VisibilityManager] Registered component:`, {
					id,
					type: componentType,
					totalComponents: this.components.size,
				})
			}
		} catch (error) {
			this.logError(id, `Failed to register component: ${error}`, error as Error)
		}
	}

	/**
	 * コンポーネントの登録解除
	 */
	unregister(id: string): void {
		try {
			if (!this.components.has(id)) {
				console.warn(`[VisibilityManager] Component ${id} is not registered`)
				return
			}

			this.components.delete(id)

			if (DEBUG_CONFIG.ENABLED) {
				console.info(`[VisibilityManager] Unregistered component:`, {
					id,
					remainingComponents: this.components.size,
				})
			}
		} catch (error) {
			this.logError(id, `Failed to unregister component: ${error}`, error as Error)
		}
	}

	/**
	 * 状態を更新し、優先度を再計算
	 */
	updateState(id: string, state: VisibilityState, intersectionRatio: number): void {
		try {
			const component = this.components.get(id)
			if (!component) {
				console.warn(`[VisibilityManager] Component ${id} is not registered`)
				return
			}

			const previousState = component.state
			const previousPriority = component.priority

			// 状態更新
			component.state = state
			component.intersectionRatio = intersectionRatio
			component.lastUpdate = Date.now()
			component.priority = this.calculatePriority(component)
			component.isActive = state !== 'hidden'

			// 全体の優先度バランスを調整
			this.rebalancePriorities()

			// パフォーマンス制限の適用
			this.enforcePerformanceLimits()

			if (DEBUG_CONFIG.ENABLED && DEBUG_CONFIG.LOG_LEVEL === 'debug') {
				console.debug(`[VisibilityManager] State updated for ${id}:`, {
					state: `${previousState} → ${state}`,
					priority: `${previousPriority} → ${component.priority}`,
					ratio: intersectionRatio,
					activeComponents: this.getActiveComponents().length,
				})
			}
		} catch (error) {
			this.logError(id, `Failed to update state: ${error}`, error as Error)
		}
	}

	/**
	 * 優先度を取得
	 */
	getPriority(id: string): number {
		const component = this.components.get(id)
		return component?.priority || 1
	}

	/**
	 * アクティブなコンポーネント一覧を取得
	 */
	getActiveComponents(): string[] {
		return Array.from(this.components.values())
			.filter(component => component.isActive)
			.sort((a, b) => b.priority - a.priority)
			.map(component => component.id)
	}

	/**
	 * パフォーマンス指標を取得
	 */
	getMetrics(): PerformanceMetrics {
		const activeCount = this.getActiveComponents().length
		const frameCallsPerFrame = this.estimateFrameCalls()
		const memoryUsage = this.estimateMemoryUsage()
		const currentFPS = this.estimateCurrentFPS()

		return {
			activeCanvasCount: activeCount,
			frameCallsPerFrame,
			memoryUsage,
			currentFPS,
			lastMeasured: Date.now(),
		}
	}

	/**
	 * デバッグ情報を取得
	 */
	getDebugInfo(): DebugInfo {
		const registeredComponents: DebugInfo['registeredComponents'] = {}

		this.components.forEach((component, id) => {
			registeredComponents[id] = {
				type: component.type,
				state: component.state,
				priority: component.priority,
				lastUpdate: component.lastUpdate,
			}
		})

		return {
			registeredComponents,
			performanceHistory: [...this.performanceHistory],
			errors: [...this.errorLog],
		}
	}

	/**
	 * 優先度の計算
	 */
	private calculatePriority(component: ComponentInfo): number {
		const baseImportance = COMPONENT_IMPORTANCE[component.type] || 5
		const visibilityBonus = this.getVisibilityBonus(component.state, component.intersectionRatio)
		const distanceFromCenter = this.getDistanceFromCenterBonus(component.intersectionRatio)

		const priority = Math.min(10, baseImportance + visibilityBonus + distanceFromCenter)
		return Math.max(1, priority)
	}

	/**
	 * 可視性に基づくボーナス計算
	 */
	private getVisibilityBonus(state: VisibilityState, ratio: number): number {
		switch (state) {
			case 'visible':
				return 3 + (ratio * 2) // 最大5ポイント
			case 'partial':
				return 2 + (ratio * 1.5) // 最大3.5ポイント
			case 'approaching':
				return 1 + (ratio * 0.5) // 最大1.5ポイント
			case 'hidden':
			default:
				return 0
		}
	}

	/**
	 * 画面中央からの距離に基づくボーナス計算
	 */
	private getDistanceFromCenterBonus(ratio: number): number {
		// 完全に中央に表示されている場合（ratio = 1）に最大ボーナス
		return ratio > 0.5 ? (ratio - 0.5) * 2 : 0
	}

	/**
	 * 全コンポーネントの優先度バランス調整
	 */
	private rebalancePriorities(): void {
		const activeComponents = Array.from(this.components.values())
			.filter(component => component.isActive)
			.sort((a, b) => b.priority - a.priority)

		// 上位コンポーネントの優先度を保証
		activeComponents.forEach((component, index) => {
			if (index === 0) {
				// 最高優先度は10に固定
				component.priority = Math.max(component.priority, 8)
			} else if (index === 1) {
				// 2番目は最高優先度より低く設定
				component.priority = Math.min(component.priority, activeComponents[0].priority - 1)
			}
		})
	}

	/**
	 * パフォーマンス制限の適用
	 */
	private enforcePerformanceLimits(): void {
		const activeComponents = this.getActiveComponents()
		const maxActive = this.performanceConfig.MAX_ACTIVE_CANVAS

		if (activeComponents.length <= maxActive) {
			return
		}

		// 優先度の低いコンポーネントを非アクティブ化
		const componentsToDeactivate = activeComponents.slice(maxActive)

		componentsToDeactivate.forEach(componentId => {
			const component = this.components.get(componentId)
			if (component && component.state !== 'hidden') {
				// 強制的に approaching 状態にダウングレード
				component.state = 'approaching'
				component.isActive = false
				component.priority = Math.max(1, component.priority - 3)

				if (DEBUG_CONFIG.ENABLED) {
					console.warn(`[VisibilityManager] Component ${componentId} deactivated due to performance limits`)
				}
			}
		})
	}

	/**
	 * フレーム呼び出し数の推定
	 */
	private estimateFrameCalls(): number {
		let totalCalls = 0

		this.components.forEach(component => {
			if (component.isActive) {
				switch (component.type) {
					case 'floating-images':
						totalCalls += 35 // 35枚の画像
						break
					case 'sphere':
					case 'pepe3d':
					case 'pepe-push':
						totalCalls += 1
						break
					case 'glowing-text':
						totalCalls += 2 // 2つのモデル
						break
				}
			}
		})

		return totalCalls
	}

	/**
	 * メモリ使用量の推定
	 */
	private estimateMemoryUsage(): number {
		if (!('memory' in performance)) {
			return 0
		}

		try {
			const memInfo = (performance as any).memory
			return memInfo.usedJSHeapSize / (1024 * 1024) // MB変換
		} catch {
			return 0
		}
	}

	/**
	 * 現在のFPSの推定
	 */
	private estimateCurrentFPS(): number {
		if (this.performanceHistory.length === 0) {
			return 60 // デフォルト値
		}

		const recent = this.performanceHistory.slice(-5) // 直近5回の平均
		const avgFPS = recent.reduce((sum, metrics) => sum + metrics.currentFPS, 0) / recent.length
		return Math.round(avgFPS)
	}

	/**
	 * パフォーマンス監視の開始
	 */
	private startPerformanceMonitoring(): void {
		this.metricsInterval = setInterval(() => {
			const metrics = this.getMetrics()

			// 履歴に追加（最大100件保持）
			this.performanceHistory.push(metrics)
			if (this.performanceHistory.length > 100) {
				this.performanceHistory.shift()
			}

			// パフォーマンス警告
			if (metrics.currentFPS < this.performanceConfig.MIN_FPS) {
				console.warn('[VisibilityManager] Low FPS detected:', {
					currentFPS: metrics.currentFPS,
					activeComponents: metrics.activeCanvasCount,
					frameCalls: metrics.frameCallsPerFrame,
				})
			}

			if (metrics.memoryUsage > this.performanceConfig.MEMORY_WARNING_THRESHOLD) {
				console.warn('[VisibilityManager] High memory usage detected:', {
					current: `${metrics.memoryUsage}MB`,
					threshold: `${this.performanceConfig.MEMORY_WARNING_THRESHOLD}MB`,
				})
			}
		}, this.performanceConfig.METRICS_UPDATE_INTERVAL)
	}

	/**
	 * デバッグモードの設定
	 */
	private setupDebugMode(): void {
		if (typeof window !== 'undefined') {
			// グローバル関数として公開
			(window as any).visibilityManager = {
				getComponents: () => Array.from(this.components.entries()),
				getMetrics: () => this.getMetrics(),
				getDebugInfo: () => this.getDebugInfo(),
				forceRebalance: () => this.rebalancePriorities(),
				setMaxActive: (max: number) => {
					this.performanceConfig = { ...this.performanceConfig, MAX_ACTIVE_CANVAS: max }
				},
			}

			console.info('[VisibilityManager] Debug mode enabled. Use window.visibilityManager for debugging.')
		}

		// デバッグ情報の定期出力
		if (DEBUG_CONFIG.SHOW_PERFORMANCE_METRICS) {
			setInterval(() => {
				const activeComponents = this.getActiveComponents()
				const metrics = this.getMetrics()

				console.debug('[VisibilityManager] Debug Summary:', {
					activeComponents: activeComponents.length,
					totalComponents: this.components.size,
					metrics,
					topPriority: activeComponents.slice(0, 3),
				})
			}, 10000) // 10秒ごと
		}
	}

	/**
	 * エラーログの記録
	 */
	private logError(componentId: string, message: string, error?: Error): void {
		const errorEntry = {
			timestamp: Date.now(),
			component: componentId,
			message,
			stack: error?.stack,
		}

		this.errorLog.push(errorEntry)

		// エラーログの上限管理
		if (this.errorLog.length > DEBUG_CONFIG.ERROR_LOG_SIZE) {
			this.errorLog.shift()
		}

		console.error(`[VisibilityManager] Error in ${componentId}:`, message, error)
	}

	/**
	 * クリーンアップ
	 */
	destroy(): void {
		if (this.metricsInterval) {
			clearInterval(this.metricsInterval)
			this.metricsInterval = null
		}

		this.components.clear()
		this.performanceHistory.length = 0
		this.errorLog.length = 0

		if (typeof window !== 'undefined') {
			delete (window as any).visibilityManager
		}

		if (DEBUG_CONFIG.ENABLED) {
			console.info('[VisibilityManager] Destroyed')
		}
	}
}

// シングルトンインスタンス
let visibilityManagerInstance: VisibilityManagerImpl | null = null

/**
 * VisibilityManager のシングルトンインスタンスを取得
 */
export const getVisibilityManager = (): VisibilityManager => {
	if (!visibilityManagerInstance) {
		visibilityManagerInstance = new VisibilityManagerImpl()
	}
	return visibilityManagerInstance
}

/**
 * VisibilityManager インスタンスを破棄
 */
export const destroyVisibilityManager = (): void => {
	if (visibilityManagerInstance) {
		visibilityManagerInstance.destroy()
		visibilityManagerInstance = null
	}
}

// ページ離脱時のクリーンアップ
if (typeof window !== 'undefined') {
	window.addEventListener('beforeunload', () => {
		destroyVisibilityManager()
	})
}-e 
### FILE: ./src/app/components/layered-gallery/constants.ts

// src/app/components/layered-gallery/constants.ts

import { LayeredImageConfig, LayeredGallerySectionConfig, ResponsiveConfig } from './types'
import { imageFiles, ImageFile, ImageSize } from '../floating-images-fix/constants'

/**
 * 画面サイズ判定関数
 */
const isMobile = (): boolean => {
	if (typeof window === 'undefined') return false
	return window.innerWidth <= 768
}

/**
 * CDNパス設定（直接定義）
 */
const CDN_URL = process.env.NEXT_PUBLIC_CLOUDFRONT_URL || ""

/**
 * 画像パスを生成する関数（floating-images-fixと同じロジック）
 */
const generateImagePath = (filename: string): string => {
	const folder = isMobile() ? 'pepe/gallery-small' : 'pepe'
	return `${CDN_URL}/${folder}/${filename}`
}

/**
 * 基本画像データ（パスなし）- floating-images-fixから基本データのみ抽出
 */
const baseImageData: Array<{ id: number; filename: string; size: ImageSize }> = [
	{ id: 1, filename: '1L.webp', size: 'L' },
	{ id: 2, filename: '2M.webp', size: 'M' },
	{ id: 3, filename: '3S.webp', size: 'S' },
	{ id: 4, filename: '4S.webp', size: 'S' },
	{ id: 5, filename: '5M.webp', size: 'M' },
	{ id: 6, filename: '6L.webp', size: 'L' },
	{ id: 7, filename: '7M.webp', size: 'M' },
	{ id: 8, filename: '8M.webp', size: 'M' },
	{ id: 9, filename: '9L.webp', size: 'L' },
	{ id: 10, filename: '10S.webp', size: 'S' },
	{ id: 11, filename: '11S.webp', size: 'S' },
	{ id: 12, filename: '12M.webp', size: 'M' },
	{ id: 13, filename: '13L.webp', size: 'L' },
	{ id: 14, filename: '14L.webp', size: 'L' },
	{ id: 15, filename: '15M.webp', size: 'M' },
	{ id: 16, filename: '16S.webp', size: 'S' },
	{ id: 17, filename: '17S.webp', size: 'S' },
	{ id: 18, filename: '18M.webp', size: 'M' },
	{ id: 19, filename: '19L.webp', size: 'L' },
	{ id: 20, filename: '20L.webp', size: 'L' },
	{ id: 21, filename: '21S.webp', size: 'S' },
	{ id: 22, filename: '22S.webp', size: 'S' },
	{ id: 23, filename: '23L.webp', size: 'L' },
	{ id: 24, filename: '24L.webp', size: 'L' },
	{ id: 25, filename: '25S.webp', size: 'S' },
	{ id: 26, filename: '26S.webp', size: 'S' },
	{ id: 27, filename: '27S.webp', size: 'S' },
	{ id: 28, filename: '28L.webp', size: 'L' },
	{ id: 29, filename: '29S.webp', size: 'S' },
	{ id: 30, filename: '30S.webp', size: 'S' },
	{ id: 31, filename: '31M.webp', size: 'M' },
	{ id: 32, filename: '32M.webp', size: 'M' },
	{ id: 33, filename: '33M.webp', size: 'M' },
	{ id: 34, filename: '34S.webp', size: 'S' },
	{ id: 35, filename: '35L.webp', size: 'L' },
]

/**
 * 実行時に正しいパスで画像ファイルを生成
 */
const generateRuntimeImageFiles = (): ImageFile[] => {
	return baseImageData.map(image => ({
		...image,
		path: generateImagePath(image.filename)
	}))
}

/**
 * レスポンシブ設定
 */
export const RESPONSIVE_CONFIG: ResponsiveConfig = {
	desktop: {
		scaleMultiplier: 1.0,
		positionMultiplier: 1.0,
		zoomMultiplier: 1.0,
	},
	mobile: {
		scaleMultiplier: 0.7,
		positionMultiplier: 0.8,
		zoomMultiplier: 0.8,
	}
}

/**
 * セクション基本設定
 */
export const SECTION_CONFIG: LayeredGallerySectionConfig = {
	sectionHeight: 4, // 4倍のviewport height
	padding: {
		top: 100,
		bottom: 100,
	},
	camera: {
		fov: 75,
		near: 0.1,
		far: 1000,
		position: {
			x: 0,
			y: 0,
			z: 10,
		}
	},
	responsive: RESPONSIVE_CONFIG,
}

/**
 * サイズ別基本Z位置
 */
const Z_POSITIONS = {
	L: 0,   // 最前面
	M: -5,  // 中間
	S: -10, // 最奥
} as const

/**
 * サイズ別基本スケール
 */
const BASE_SCALES = {
	L: 4,
	M: 3,
	S: 2,
} as const

/**
 * 拡張画像設定を生成（最適化版）
 * 実行時に正しいパスで画像設定を作成
 */
export const layeredImageConfigs: LayeredImageConfig[] = (() => {
	// 実行時に画像ファイルリストを取得
	const runtimeImageFiles = generateRuntimeImageFiles()

	return runtimeImageFiles.map((image, index) => {
		const totalImages = runtimeImageFiles.length
		const progress = index / (totalImages - 1) // 0-1の進行度

		// 基本位置の計算（縦一列ではなく、ある程度ランダムに配置）
		const baseX = (Math.random() - 0.5) * 8 // -4 to 4
		const baseY = progress * 20 - 10 // -10 to 10（縦方向に分散）
		const baseZ = Z_POSITIONS[image.size]

		// スクロール範囲の計算（各画像が異なるタイミングでズーム）
		const scrollStart = Math.max(0, progress - 0.15) // 少し重なりを持たせる
		const scrollEnd = Math.min(1, progress + 0.15)
		const scrollPeak = progress

		// ズーム倍率の計算（サイズに応じて調整）
		const baseScale = BASE_SCALES[image.size]
		const zoomMin = baseScale * 0.5
		const zoomMax = baseScale * 1.8

		// 視差速度（奥にあるものほど遅く）
		const parallaxSpeed = image.size === 'L' ? 1.0 :
			image.size === 'M' ? 0.85 : 0.7

		// イージングカーブ（バリエーションを持たせる）
		const easingTypes = ['easeInOut', 'easeOutQuart', 'easeInQuart'] as const
		const easing = easingTypes[index % easingTypes.length]

		return {
			...image,
			position: {
				x: baseX,
				y: baseY,
				z: baseZ,
			},
			randomOffset: {
				x: 1.5, // ±1.5の範囲でランダムオフセット
				y: 1.0, // ±1.0の範囲でランダムオフセット
			},
			scrollRange: {
				start: scrollStart,
				end: scrollEnd,
				peak: scrollPeak,
			},
			zoom: {
				min: zoomMin,
				max: zoomMax,
				curve: easing,
			},
			parallax: {
				speed: parallaxSpeed,
			},
			// 一部の画像に微細な回転を追加
			...(index % 7 === 0 && {
				rotation: {
					axis: ['x', 'y', 'z'][index % 3] as 'x' | 'y' | 'z',
					amount: (Math.random() - 0.5) * 0.2, // ±0.1ラジアン
				}
			}),
		}
	})
})()

/**
 * 特定画像の設定をカスタマイズ
 * 重要な画像やアクセント画像の個別調整
 */
export const customizeImageConfig = (configs: LayeredImageConfig[]): LayeredImageConfig[] => {
	return configs.map((config, index) => {
		// 最初と最後の画像は特別扱い
		if (index === 0) {
			return {
				...config,
				position: { ...config.position, x: 0, y: -12 }, // 中央配置
				zoom: { ...config.zoom, max: config.zoom.max * 1.2 }, // より大きくズーム
				scrollRange: { start: 0, end: 0.3, peak: 0.15 }, // 早めに登場
			}
		}

		if (index === configs.length - 1) {
			return {
				...config,
				position: { ...config.position, x: 0, y: 12 }, // 中央配置
				zoom: { ...config.zoom, max: config.zoom.max * 1.2 }, // より大きくズーム
				scrollRange: { start: 0.7, end: 1, peak: 0.85 }, // 最後に登場
			}
		}

		// Lサイズの画像は少し特別扱い
		if (config.size === 'L') {
			return {
				...config,
				zoom: { ...config.zoom, max: config.zoom.max * 1.1 }, // 少し大きめ
			}
		}

		return config
	})
}

/**
 * 最終的な画像設定
 */
export const LAYERED_IMAGES = customizeImageConfig(layeredImageConfigs)

/**
 * デバッグ用設定（本番環境向けに最適化）
 */
export const DEBUG_CONFIG = {
	showBoundingBoxes: false,        // 境界ボックス表示 - 本番では false
	showScrollRanges: true,          // スクロール範囲表示
	showPositionLabels: false,       // 位置ラベル表示 - 本番では false
	logAnimationStates: false,       // アニメーション状態ログ - 本番では false に設定
	logImagePaths: true,             // 画像パス確認ログ
	showTestImage: true,             // テスト画像表示
}

/**
 * テスト用：画像パスの確認（ログ制限付き）
 */
let pathsLogged = false // 一度だけログ出力
export const logImagePaths = () => {
	if (DEBUG_CONFIG.logImagePaths && !pathsLogged) {
		pathsLogged = true
		const testPaths = generateRuntimeImageFiles().slice(0, 5) // 最初の5枚をテスト
		console.log('[LayeredGallery] Image paths test:', {
			CDN_URL,
			envVariable: process.env.NEXT_PUBLIC_CLOUDFRONT_URL,
			isMobile: isMobile(),
			folder: isMobile() ? 'pepe/gallery-small' : 'pepe',
			samplePaths: testPaths.map(img => ({
				filename: img.filename,
				path: img.path,
				fullURL: `${CDN_URL}/${isMobile() ? 'pepe/gallery-small' : 'pepe'}/${img.filename}`
			}))
		})
	}
}

/**
 * アニメーション設定（最適化）
 */
export const ANIMATION_CONFIG = {
	// スクロール制御
	scrollDamping: 0.05,           // より軽いダンピング
	scrollThreshold: 0.005,        // より大きな閾値で更新頻度を下げる

	// フレームレート制御
	targetFPS: 60,
	animationTolerance: 0.005,     // より大きな許容値

	// イージング設定
	easingStiffness: 0.1,
	easingDamping: 0.8,
}

/**
 * 現在の設定を取得（レスポンシブ対応・キャッシュ付き）
 */
let cachedConfig: any = null
let lastWindowWidth = 0

export const getCurrentConfig = () => {
	// キャッシュチェック
	if (typeof window !== 'undefined') {
		const currentWidth = window.innerWidth
		if (cachedConfig && lastWindowWidth === currentWidth) {
			return cachedConfig
		}
		lastWindowWidth = currentWidth
	}

	const mobile = isMobile()

	// デバッグ：画像パスの確認（一度だけ）
	logImagePaths()

	cachedConfig = {
		images: LAYERED_IMAGES,
		section: SECTION_CONFIG,
		responsive: mobile ? RESPONSIVE_CONFIG.mobile : RESPONSIVE_CONFIG.desktop,
		animation: ANIMATION_CONFIG,
		debug: DEBUG_CONFIG,
	}

	return cachedConfig
}-e 
### FILE: ./src/app/components/layered-gallery/types/index.ts

// src/app/components/layered-gallery/types/index.ts

import { ImageFile, ImageSize } from '../../../floating-images-fix/constants'

// React Three Fiber の型拡張
declare global {
	namespace JSX {
		interface IntrinsicElements {
			group: any
			mesh: any
			planeGeometry: any
			meshBasicMaterial: any
			boxGeometry: any
			axesHelper: any
			gridHelper: any
			ringGeometry: any
			ambientLight: any
			directionalLight: any
		}
	}
}

/**
 * レイヤードギャラリー用の拡張画像設定
 */
export interface LayeredImageConfig extends ImageFile {
	// 3D配置設定
	position: {
		x: number
		y: number
		z: number
	}

	// ランダムオフセット範囲（オプション）
	randomOffset?: {
		x: number
		y: number
	}

	// 個別スクロール範囲（全体進行度 0-1 に対する相対値）
	scrollRange: {
		start: number    // アニメーション開始位置
		end: number      // アニメーション終了位置
		peak: number     // 最大ズーム位置
	}

	// ズーム設定
	zoom: {
		min: number      // 最小倍率
		max: number      // 最大倍率
		curve: EasingType // イージングカーブ
	}

	// 視差効果設定
	parallax: {
		speed: number    // 視差速度（1.0が標準）
	}

	// 回転設定（オプション）
	rotation?: {
		axis: 'x' | 'y' | 'z'
		amount: number   // 回転量（ラジアン）
	}
}

/**
 * イージングタイプ
 */
export type EasingType =
	| 'linear'
	| 'easeIn'
	| 'easeOut'
	| 'easeInOut'
	| 'easeInQuart'
	| 'easeOutQuart'

/**
 * スクロール進行度情報
 */
export interface ScrollProgress {
	// 全体の進行度（0-1）
	overall: number

	// セクション内での進行度（0-1）
	section: number

	// スクロール方向
	direction: 'up' | 'down'

	// スクロール速度
	velocity: number
}

/**
 * 画像アニメーション状態
 */
export interface ImageAnimationState {
	// 現在の位置
	position: {
		x: number
		y: number
		z: number
	}

	// 現在のスケール
	scale: number

	// 現在の透明度
	opacity: number

	// 現在の回転
	rotation: {
		x: number
		y: number
		z: number
	}

	// アニメーション中かどうか
	isAnimating: boolean

	// 可視状態
	isVisible: boolean
}

/**
 * レスポンシブ設定
 */
export interface ResponsiveConfig {
	// デスクトップ設定
	desktop: {
		scaleMultiplier: number
		positionMultiplier: number
		zoomMultiplier: number
	}

	// モバイル設定
	mobile: {
		scaleMultiplier: number
		positionMultiplier: number
		zoomMultiplier: number
	}
}

/**
 * セクション設定
 */
export interface LayeredGallerySectionConfig {
	// セクションの高さ（viewport height の倍数）
	sectionHeight: number

	// パディング設定
	padding: {
		top: number
		bottom: number
	}

	// カメラ設定
	camera: {
		fov: number
		near: number
		far: number
		position: {
			x: number
			y: number
			z: number
		}
	}

	// レスポンシブ設定
	responsive: ResponsiveConfig
}-e 
### FILE: ./src/app/components/layered-gallery/LayeredGallerySection.tsx

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

export default LayeredGallerySection-e 
### FILE: ./src/app/components/layered-gallery/hooks/useScrollProgress.ts

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

export default useScrollProgress-e 
### FILE: ./src/app/components/layered-gallery/hooks/useImageAnimation.ts

// src/app/components/layered-gallery/hooks/useImageAnimation.ts

'use client'

import { useState, useEffect, useMemo } from 'react'
import { LayeredImageConfig, ScrollProgress, ImageAnimationState } from '../types'
import { useImageScrollRange } from './useScrollProgress'
import { calculateScrollBasedPosition, calculateFinalPosition } from '../utils/positionCalculator'
import { calculateZoomScale, calculateOpacity } from '../utils/zoomCalculator'
import { DEBUG_CONFIG, ANIMATION_CONFIG } from '../constants'

/**
 * 個別画像のアニメーション状態を管理するカスタムフック
 */
export const useImageAnimation = (
	imageConfig: LayeredImageConfig,
	globalScrollProgress: ScrollProgress | null
): ImageAnimationState | null => {

	// 画像のスクロール範囲内判定
	const { isInRange, localProgress } = useImageScrollRange(
		imageConfig.scrollRange,
		globalScrollProgress
	)

	// アニメーション状態
	const [animationState, setAnimationState] = useState<ImageAnimationState | null>(null)

	// 基本位置の計算（メモ化）
	const basePosition = useMemo(() => {
		return calculateFinalPosition(imageConfig, imageConfig.id)
	}, [imageConfig])

	// アニメーション状態の計算
	useEffect(() => {
		if (!globalScrollProgress) {
			setAnimationState(null)
			return
		}

		// 現在位置の計算
		const currentPosition = calculateScrollBasedPosition(
			basePosition,
			imageConfig,
			globalScrollProgress
		)

		// ズームスケールの計算
		const zoomScale = calculateZoomScale(
			imageConfig.zoom,
			localProgress,
			isInRange
		)

		// 透明度の計算
		const opacity = calculateOpacity(
			localProgress,
			isInRange,
			globalScrollProgress.overall,
			imageConfig.scrollRange
		)

		// 回転の計算
		let rotation = { x: 0, y: 0, z: 0 }
		if (imageConfig.rotation && isInRange) {
			const rotationProgress = Math.sin(localProgress * Math.PI) // サイン波で滑らかな回転
			const { axis, amount } = imageConfig.rotation

			switch (axis) {
				case 'x':
					rotation.x = rotationProgress * amount
					break
				case 'y':
					rotation.y = rotationProgress * amount
					break
				case 'z':
					rotation.z = rotationProgress * amount
					break
			}
		}

		// 可視性の判定
		const isVisible = opacity > ANIMATION_CONFIG.animationTolerance
		const isAnimating = isInRange && isVisible

		const newState: ImageAnimationState = {
			position: currentPosition,
			scale: zoomScale,
			opacity,
			rotation,
			isAnimating,
			isVisible,
		}

		// 状態の変化をチェック（パフォーマンス最適化）
		setAnimationState(prevState => {
			if (!prevState) return newState

			// 微細な変化は無視
			const positionChanged =
				Math.abs(prevState.position.x - newState.position.x) > ANIMATION_CONFIG.animationTolerance ||
				Math.abs(prevState.position.y - newState.position.y) > ANIMATION_CONFIG.animationTolerance ||
				Math.abs(prevState.position.z - newState.position.z) > ANIMATION_CONFIG.animationTolerance

			const scaleChanged =
				Math.abs(prevState.scale - newState.scale) > ANIMATION_CONFIG.animationTolerance

			const opacityChanged =
				Math.abs(prevState.opacity - newState.opacity) > ANIMATION_CONFIG.animationTolerance

			const rotationChanged =
				Math.abs(prevState.rotation.x - newState.rotation.x) > ANIMATION_CONFIG.animationTolerance ||
				Math.abs(prevState.rotation.y - newState.rotation.y) > ANIMATION_CONFIG.animationTolerance ||
				Math.abs(prevState.rotation.z - newState.rotation.z) > ANIMATION_CONFIG.animationTolerance

			const stateChanged =
				prevState.isAnimating !== newState.isAnimating ||
				prevState.isVisible !== newState.isVisible

			if (positionChanged || scaleChanged || opacityChanged || rotationChanged || stateChanged) {
				return newState
			}

			return prevState
		})

		// デバッグログ
		if (DEBUG_CONFIG.logAnimationStates && isInRange) {
			console.log(`[useImageAnimation] ${imageConfig.filename} animation updated:`, {
				localProgress: localProgress.toFixed(3),
				globalProgress: globalScrollProgress.overall.toFixed(3),
				isInRange,
				scale: zoomScale.toFixed(3),
				opacity: opacity.toFixed(3),
				position: {
					x: currentPosition.x.toFixed(2),
					y: currentPosition.y.toFixed(2),
					z: currentPosition.z.toFixed(2),
				},
			})
		}

	}, [
		globalScrollProgress,
		localProgress,
		isInRange,
		imageConfig,
		basePosition
	])

	return animationState
}

/**
 * 複数画像の一括アニメーション管理フック
 */
export const useMultipleImageAnimations = (
	imageConfigs: LayeredImageConfig[],
	globalScrollProgress: ScrollProgress | null
): (ImageAnimationState | null)[] => {

	const [animationStates, setAnimationStates] = useState<(ImageAnimationState | null)[]>([])

	useEffect(() => {
		if (!globalScrollProgress) {
			setAnimationStates(new Array(imageConfigs.length).fill(null))
			return
		}

		const newStates = imageConfigs.map(config => {
			// 各画像のアニメーション状態を個別計算
			const { isInRange, localProgress } = useImageScrollRange(
				config.scrollRange,
				globalScrollProgress
			)

			if (!isInRange) return null

			const basePosition = calculateFinalPosition(config, config.id)
			const currentPosition = calculateScrollBasedPosition(
				basePosition,
				config,
				globalScrollProgress
			)

			const zoomScale = calculateZoomScale(
				config.zoom,
				localProgress,
				isInRange
			)

			const opacity = calculateOpacity(
				localProgress,
				isInRange,
				globalScrollProgress.overall,
				config.scrollRange
			)

			let rotation = { x: 0, y: 0, z: 0 }
			if (config.rotation) {
				const rotationProgress = Math.sin(localProgress * Math.PI)
				const { axis, amount } = config.rotation

				switch (axis) {
					case 'x':
						rotation.x = rotationProgress * amount
						break
					case 'y':
						rotation.y = rotationProgress * amount
						break
					case 'z':
						rotation.z = rotationProgress * amount
						break
				}
			}

			return {
				position: currentPosition,
				scale: zoomScale,
				opacity,
				rotation,
				isAnimating: true,
				isVisible: opacity > ANIMATION_CONFIG.animationTolerance,
			}
		})

		setAnimationStates(newStates)

	}, [imageConfigs, globalScrollProgress])

	return animationStates
}

/**
 * アニメーション状態の統計情報を取得するフック
 */
export const useAnimationStats = (
	animationStates: (ImageAnimationState | null)[]
) => {
	const stats = useMemo(() => {
		const activeAnimations = animationStates.filter(state => state?.isAnimating).length
		const visibleImages = animationStates.filter(state => state?.isVisible).length
		const totalImages = animationStates.length

		const averageOpacity = animationStates.reduce((sum, state) => {
			return sum + (state?.opacity || 0)
		}, 0) / totalImages

		const averageScale = animationStates.reduce((sum, state) => {
			return sum + (state?.scale || 1)
		}, 0) / totalImages

		return {
			activeAnimations,
			visibleImages,
			totalImages,
			averageOpacity,
			averageScale,
			animationRatio: activeAnimations / totalImages,
			visibilityRatio: visibleImages / totalImages,
		}
	}, [animationStates])

	// パフォーマンス警告
	useEffect(() => {
		if (DEBUG_CONFIG.logAnimationStates && stats.activeAnimations > 10) {
			console.warn('[useAnimationStats] High number of active animations:', {
				active: stats.activeAnimations,
				total: stats.totalImages,
				ratio: stats.animationRatio,
			})
		}
	}, [stats])

	return stats
}

export default useImageAnimation-e 
### FILE: ./src/app/components/layered-gallery/utils/zoomCalculator.ts

// src/app/components/layered-gallery/utils/zoomCalculator.ts

import { EasingType } from '../types'
import { getCurrentConfig } from '../constants'

/**
 * ズーム計算の中心ロジック
 */

/**
 * イージング関数の実装
 */
export const easeInOut = (t: number): number => {
	return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
}

export const easeIn = (t: number): number => {
	return t * t
}

export const easeOut = (t: number): number => {
	return t * (2 - t)
}

export const easeInQuart = (t: number): number => {
	return t * t * t * t
}

export const easeOutQuart = (t: number): number => {
	return 1 - (--t) * t * t * t
}

export const linear = (t: number): number => {
	return t
}

/**
 * イージングタイプに応じた関数を取得
 */
export const getEasingFunction = (easingType: EasingType): ((t: number) => number) => {
	switch (easingType) {
		case 'easeIn':
			return easeIn
		case 'easeOut':
			return easeOut
		case 'easeInOut':
			return easeInOut
		case 'easeInQuart':
			return easeInQuart
		case 'easeOutQuart':
			return easeOutQuart
		case 'linear':
		default:
			return linear
	}
}

/**
 * ズームスケールを計算
 * @param zoomConfig ズーム設定
 * @param localProgress 画像のローカル進行度（0-1）
 * @param isInRange 画像がスクロール範囲内にあるか
 * @returns 計算されたスケール値
 */
export const calculateZoomScale = (
	zoomConfig: { min: number; max: number; curve: EasingType },
	localProgress: number,
	isInRange: boolean
): number => {
	const config = getCurrentConfig()

	if (!isInRange) {
		return zoomConfig.min * config.responsive.scaleMultiplier
	}

	// ベルカーブ（山型）のズーム効果を計算
	// 0 → peak → 1 の進行で min → max → min のズーム
	const easingFunc = getEasingFunction(zoomConfig.curve)

	// 山型カーブの計算（0.5で最大値）
	const normalizedProgress = Math.abs(0.5 - localProgress) * 2 // 0-1の範囲で中央が0
	const invertedProgress = 1 - normalizedProgress // 中央で最大値
	const easedProgress = easingFunc(invertedProgress)

	// スケール値の補間
	const scaleRange = zoomConfig.max - zoomConfig.min
	const calculatedScale = zoomConfig.min + (scaleRange * easedProgress)

	// レスポンシブ調整を適用
	const responsiveScale = calculatedScale * config.responsive.scaleMultiplier

	// 最小値の保証
	return Math.max(zoomConfig.min * config.responsive.scaleMultiplier, responsiveScale)
}

/**
 * 透明度を計算
 * @param localProgress 画像のローカル進行度（0-1）
 * @param isInRange 画像がスクロール範囲内にあるか
 * @param globalProgress 全体のスクロール進行度
 * @param scrollRange 画像のスクロール範囲
 * @returns 計算された透明度（0-1）
 */
export const calculateOpacity = (
	localProgress: number,
	isInRange: boolean,
	globalProgress: number,
	scrollRange: { start: number; end: number; peak: number }
): number => {
	const baseOpacity = 0.7 // 基本透明度
	const fadeDistance = 0.1 // フェード距離（範囲の10%）

	if (!isInRange) {
		// 範囲外での距離に基づくフェード
		const distanceFromRange = Math.min(
			Math.abs(globalProgress - scrollRange.start),
			Math.abs(globalProgress - scrollRange.end)
		)

		if (distanceFromRange > fadeDistance) {
			return 0 // 完全に透明
		}

		// 範囲端でのフェード効果
		const fadeRatio = 1 - (distanceFromRange / fadeDistance)
		return baseOpacity * fadeRatio * 0.3 // 範囲外は薄く表示
	}

	// 範囲内でのフェードイン/アウト
	const fadeInThreshold = 0.1
	const fadeOutThreshold = 0.9

	let opacityMultiplier = 1

	// フェードイン（範囲開始時）
	if (localProgress < fadeInThreshold) {
		opacityMultiplier = localProgress / fadeInThreshold
	}
	// フェードアウト（範囲終了時）
	else if (localProgress > fadeOutThreshold) {
		opacityMultiplier = (1 - localProgress) / (1 - fadeOutThreshold)
	}

	// ピーク付近で最大透明度
	const peakDistance = Math.abs(localProgress - 0.5) // ピークは中央（0.5）
	const peakBonus = Math.max(0, 1 - peakDistance * 2) * 0.3 // ピーク付近で30%ボーナス

	const finalOpacity = baseOpacity * opacityMultiplier + peakBonus
	return Math.max(0, Math.min(1, finalOpacity))
}

/**
 * 視差効果によるポジションオフセットを計算
 * @param basePosition 基本位置
 * @param parallaxSpeed 視差速度（1.0が標準）
 * @param globalProgress 全体のスクロール進行度
 * @returns オフセット値
 */
export const calculateParallaxOffset = (
	basePosition: { x: number; y: number; z: number },
	parallaxSpeed: number,
	globalProgress: number
): { x: number; y: number; z: number } => {
	// Y軸方向の視差効果（主要）
	const yOffset = globalProgress * 20 * (1 - parallaxSpeed)

	// X軸方向の微細な視差効果
	const xOffset = globalProgress * 2 * (1 - parallaxSpeed) * Math.sin(globalProgress * Math.PI)

	// Z軸方向の奥行き効果
	const zOffset = globalProgress * 5 * (1 - parallaxSpeed)

	return {
		x: xOffset,
		y: yOffset,
		z: zOffset,
	}
}

/**
 * スケールに基づく相対的な位置調整
 * 大きくズームした画像は画面中央に寄る効果
 */
export const calculateScaleBasedPositionAdjustment = (
	basePosition: { x: number; y: number; z: number },
	currentScale: number,
	maxScale: number
): { x: number; y: number; z: number } => {
	// スケールが大きいほど中央に寄る効果
	const scaleRatio = Math.min(1, currentScale / maxScale)
	const centeringStrength = scaleRatio * 0.3 // 最大30%中央に寄る

	return {
		x: basePosition.x * (1 - centeringStrength),
		y: basePosition.y * (1 - centeringStrength),
		z: basePosition.z,
	}
}

/**
 * 画像サイズと距離に基づくLOD（Level of Detail）計算
 */
export const calculateLOD = (
	imageSize: 'L' | 'M' | 'S',
	distanceFromCamera: number,
	currentScale: number
): 1 | 2 | 3 => {
	// 基本LODレベル
	let baseLOD: 1 | 2 | 3 = imageSize === 'L' ? 1 : imageSize === 'M' ? 2 : 3

	// 距離による調整
	if (distanceFromCamera > 15) {
		baseLOD = Math.min(3, baseLOD + 1) as 1 | 2 | 3
	} else if (distanceFromCamera < 5) {
		baseLOD = Math.max(1, baseLOD - 1) as 1 | 2 | 3
	}

	// スケールによる調整
	if (currentScale > 2) {
		baseLOD = Math.max(1, baseLOD - 1) as 1 | 2 | 3
	} else if (currentScale < 0.5) {
		baseLOD = Math.min(3, baseLOD + 1) as 1 | 2 | 3
	}

	return baseLOD
}

/**
 * 複数画像の相対的ズーム調整
 * 同時に表示される画像間でのズーム競合を解決
 */
export const adjustRelativeZoom = (
	imageConfigs: Array<{
		id: number
		currentScale: number
		priority: number
		scrollRange: { start: number; end: number }
	}>,
	globalProgress: number
): Array<{ id: number; adjustedScale: number }> => {
	// 現在のスクロール位置で影響を受ける画像を特定
	const activeImages = imageConfigs.filter(config => {
		return globalProgress >= config.scrollRange.start - 0.1 &&
			globalProgress <= config.scrollRange.end + 0.1
	})

	// 優先度に基づくスケール調整
	return activeImages.map(config => {
		let adjustedScale = config.currentScale

		// 他の画像との競合チェック
		const competitors = activeImages.filter(other =>
			other.id !== config.id &&
			Math.abs(other.priority - config.priority) < 2
		)

		if (competitors.length > 0) {
			// 競合がある場合、優先度に基づいて調整
			const competitorScales = competitors.map(c => c.currentScale)
			const maxCompetitorScale = Math.max(...competitorScales)

			if (config.currentScale > maxCompetitorScale && config.priority < Math.max(...competitors.map(c => c.priority))) {
				// 優先度が低いのにスケールが大きい場合、調整
				adjustedScale = config.currentScale * 0.8
			}
		}

		return {
			id: config.id,
			adjustedScale: Math.max(0.1, adjustedScale)
		}
	})
}

/**
 * デバッグ用：ズーム状態の詳細情報を生成
 */
export const generateZoomDebugInfo = (
	zoomConfig: { min: number; max: number; curve: EasingType },
	localProgress: number,
	calculatedScale: number,
	opacity: number
) => {
	return {
		config: zoomConfig,
		progress: {
			local: localProgress.toFixed(3),
			eased: getEasingFunction(zoomConfig.curve)(localProgress).toFixed(3),
		},
		scale: {
			calculated: calculatedScale.toFixed(3),
			min: zoomConfig.min.toFixed(3),
			max: zoomConfig.max.toFixed(3),
			range: (zoomConfig.max - zoomConfig.min).toFixed(3),
		},
		opacity: opacity.toFixed(3),
	}
}-e 
### FILE: ./src/app/components/layered-gallery/utils/positionCalculator.ts

// src/app/components/layered-gallery/utils/positionCalculator.ts

import { LayeredImageConfig, ScrollProgress, ImageAnimationState } from '../types'
import { getCurrentConfig } from '../constants'

/**
 * 3D位置計算のユーティリティ関数群（レスポンシブ対応版）
 */

/**
 * ビューポートサイズに基づく画面情報
 */
interface ViewportInfo {
	width: number
	height: number
	aspectRatio: number
	isMobile: boolean
	isTablet: boolean
	isDesktop: boolean
}

/**
 * 現在のビューポート情報を取得
 */
export const getViewportInfo = (): ViewportInfo => {
	if (typeof window === 'undefined') {
		return {
			width: 1920,
			height: 1080,
			aspectRatio: 16/9,
			isMobile: false,
			isTablet: false,
			isDesktop: true
		}
	}

	const width = window.innerWidth
	const height = window.innerHeight
	const aspectRatio = width / height

	return {
		width,
		height,
		aspectRatio,
		isMobile: width <= 768,
		isTablet: width > 768 && width <= 1024,
		isDesktop: width > 1024
	}
}

/**
 * レスポンシブグリッド設定
 */
interface GridConfig {
	columns: number
	maxWidth: number
	spacing: {
		x: number
		y: number
	}
	bounds: {
		minX: number
		maxX: number
		minY: number
		maxY: number
	}
}

/**
 * ビューポートに応じたグリッド設定を取得
 */
export const getResponsiveGridConfig = (viewport: ViewportInfo): GridConfig => {
	if (viewport.isMobile) {
		return {
			columns: 3,
			maxWidth: 0.9, // ビューポート幅の90%
			spacing: { x: 2.5, y: 4 },
			bounds: { minX: -4, maxX: 4, minY: -15, maxY: 15 }
		}
	}
	
	if (viewport.isTablet) {
		return {
			columns: 5,
			maxWidth: 0.85, // ビューポート幅の85%
			spacing: { x: 3.0, y: 4.5 },
			bounds: { minX: -6, maxX: 6, minY: -20, maxY: 20 }
		}
	}

	// Desktop
	return {
		columns: 7,
		maxWidth: 0.8, // ビューポート幅の80%
		spacing: { x: 3.5, y: 5 },
		bounds: { minX: -10, maxX: 10, minY: -25, maxY: 25 }
	}
}

/**
 * 相対位置に基づく3D座標計算
 */
export const calculateRelativePosition = (
	imageConfig: LayeredImageConfig,
	index: number,
	totalImages: number,
	seed?: number
): { x: number; y: number; z: number } => {
	const viewport = getViewportInfo()
	const gridConfig = getResponsiveGridConfig(viewport)
	const config = getCurrentConfig()

	// グリッド位置の計算
	const { columns } = gridConfig
	const col = index % columns
	const row = Math.floor(index / columns)

	// 中央揃えのためのオフセット
	const centerOffset = (columns - 1) / 2

	// 基本X位置（相対値で計算）
	const relativeX = (col - centerOffset) / centerOffset // -1 to 1
	const baseX = relativeX * gridConfig.bounds.maxX * gridConfig.maxWidth

	// 基本Y位置（縦方向の分散）
	const baseY = -row * gridConfig.spacing.y + (totalImages / columns) * gridConfig.spacing.y * 0.5

	// Z位置（サイズに応じた奥行き）
	const baseZ = imageConfig.size === 'L' ? 0 :
		imageConfig.size === 'M' ? -3 : -6

	// 擬似ランダムオフセット（一貫性のため）
	const pseudoRandom = (index: number): number => {
		const seedValue = seed || imageConfig.id
		const x = Math.sin(seedValue * index) * 10000
		return x - Math.floor(x)
	}

	let finalX = baseX
	let finalY = baseY
	let finalZ = baseZ

	// ランダムオフセットの適用（ビューポートに応じて調整）
	if (imageConfig.randomOffset) {
		const offsetMultiplier = viewport.isMobile ? 0.5 : viewport.isTablet ? 0.75 : 1.0
		const offsetX = (pseudoRandom(1) - 0.5) * 2 * imageConfig.randomOffset.x * offsetMultiplier
		const offsetY = (pseudoRandom(2) - 0.5) * 2 * imageConfig.randomOffset.y * offsetMultiplier

		finalX += offsetX
		finalY += offsetY
	}

	// 境界制限の適用
	finalX = Math.max(gridConfig.bounds.minX, Math.min(gridConfig.bounds.maxX, finalX))
	finalY = Math.max(gridConfig.bounds.minY, Math.min(gridConfig.bounds.maxY, finalY))

	// レスポンシブ調整の適用
	finalX *= config.responsive.positionMultiplier
	finalY *= config.responsive.positionMultiplier

	return { x: finalX, y: finalY, z: finalZ }
}

/**
 * ランダムオフセットを適用した最終位置を計算（レスポンシブ対応版）
 */
export const calculateFinalPosition = (
	imageConfig: LayeredImageConfig,
	seed?: number,
	totalImages?: number,
	index?: number
): { x: number; y: number; z: number } => {
	// 新しい相対位置計算を使用
	if (typeof index === 'number' && typeof totalImages === 'number') {
		return calculateRelativePosition(imageConfig, index, totalImages, seed)
	}

	// フォールバック：従来の固定位置計算
	const config = getCurrentConfig()
	const { position, randomOffset } = imageConfig

	const pseudoRandom = (index: number): number => {
		const seedValue = seed || imageConfig.id
		const x = Math.sin(seedValue * index) * 10000
		return x - Math.floor(x)
	}

	let finalX = position.x
	let finalY = position.y
	let finalZ = position.z

	if (randomOffset) {
		const offsetX = (pseudoRandom(1) - 0.5) * 2 * randomOffset.x
		const offsetY = (pseudoRandom(2) - 0.5) * 2 * randomOffset.y

		finalX += offsetX
		finalY += offsetY
	}

	finalX *= config.responsive.positionMultiplier
	finalY *= config.responsive.positionMultiplier

	return { x: finalX, y: finalY, z: finalZ }
}

/**
 * スクロール進行度に基づく動的位置を計算（改良版）
 */
export const calculateScrollBasedPosition = (
	basePosition: { x: number; y: number; z: number },
	imageConfig: LayeredImageConfig,
	scrollProgress: ScrollProgress
): { x: number; y: number; z: number } => {
	const { parallax } = imageConfig
	const { overall } = scrollProgress
	const viewport = getViewportInfo()

	// ビューポートに応じた視差効果の調整
	const parallaxMultiplier = viewport.isMobile ? 15 : viewport.isTablet ? 18 : 20
	const parallaxOffset = overall * parallaxMultiplier * (1 - parallax.speed)

	// X軸方向の微細な揺れ（オプション）
	const lateralOffset = Math.sin(overall * Math.PI * 2) * 0.5 * (1 - parallax.speed)

	return {
		x: basePosition.x + lateralOffset,
		y: basePosition.y - parallaxOffset, // Y軸方向に視差効果を適用
		z: basePosition.z,
	}
}

/**
 * 画像間の衝突検出（レスポンシブ対応版）
 */
export const checkCollision = (
	pos1: { x: number; y: number; z: number },
	pos2: { x: number; y: number; z: number },
	size1: number,
	size2: number,
	threshold: number = 0.5
): boolean => {
	const viewport = getViewportInfo()
	
	// ビューポートに応じた衝突判定の調整
	const adjustedThreshold = viewport.isMobile ? threshold * 0.8 : threshold

	const distance = Math.sqrt(
		Math.pow(pos1.x - pos2.x, 2) +
		Math.pow(pos1.y - pos2.y, 2) +
		Math.pow(pos1.z - pos2.z, 2)
	)

	const combinedRadius = (size1 + size2) * adjustedThreshold
	return distance < combinedRadius
}

/**
 * レスポンシブ境界内での位置制限
 */
export const constrainToResponsiveBounds = (
	position: { x: number; y: number; z: number },
	margin: number = 1
): { x: number; y: number; z: number } => {
	const viewport = getViewportInfo()
	const gridConfig = getResponsiveGridConfig(viewport)

	return {
		x: Math.max(
			gridConfig.bounds.minX + margin, 
			Math.min(gridConfig.bounds.maxX - margin, position.x)
		),
		y: Math.max(
			gridConfig.bounds.minY + margin, 
			Math.min(gridConfig.bounds.maxY - margin, position.y)
		),
		z: position.z,
	}
}

/**
 * 複数画像の位置を一括計算（レスポンシブ対応版）
 */
export const calculateAllPositions = (
	imageConfigs: LayeredImageConfig[],
	scrollProgress: ScrollProgress | null,
	options: {
		resolveCollisions?: boolean
		constrainToBounds?: boolean
		useRelativePositioning?: boolean
	} = {}
): Array<{ x: number; y: number; z: number }> => {
	const { useRelativePositioning = true } = options

	// 基本位置の計算
	const basePositions = imageConfigs.map((config, index) => ({
		config,
		position: useRelativePositioning 
			? calculateRelativePosition(config, index, imageConfigs.length, config.id)
			: calculateFinalPosition(config, config.id + index)
	}))

	// スクロール効果の適用
	let finalPositions = basePositions.map(({ config, position }) => {
		if (scrollProgress) {
			return calculateScrollBasedPosition(position, config, scrollProgress)
		}
		return position
	})

	// 衝突解決
	if (options.resolveCollisions) {
		finalPositions = resolveCollisions(basePositions)
	}

	// レスポンシブ境界制限
	if (options.constrainToBounds) {
		finalPositions = finalPositions.map(position =>
			constrainToResponsiveBounds(position)
		)
	}

	return finalPositions
}

/**
 * 衝突を回避する位置を計算（既存関数・変更なし）
 */
export const resolveCollisions = (
	positions: Array<{ config: LayeredImageConfig; position: { x: number; y: number; z: number } }>,
	maxIterations: number = 10
): Array<{ x: number; y: number; z: number }> => {
	const resolvedPositions = positions.map(p => ({ ...p.position }))

	for (let iteration = 0; iteration < maxIterations; iteration++) {
		let hasCollision = false

		for (let i = 0; i < positions.length; i++) {
			for (let j = i + 1; j < positions.length; j++) {
				const pos1 = resolvedPositions[i]
				const pos2 = resolvedPositions[j]
				const config1 = positions[i].config
				const config2 = positions[j].config

				// 同じZ軸レベルでの衝突のみチェック
				if (Math.abs(pos1.z - pos2.z) > 2) continue

				const size1 = config1.zoom.max
				const size2 = config2.zoom.max

				if (checkCollision(pos1, pos2, size1, size2)) {
					hasCollision = true

					// 衝突解決：より重要度の低い画像を移動
					const moveIndex = config1.size === 'L' ? j :
						config2.size === 'L' ? i :
							config1.size === 'M' ? j : i

					// 移動方向の計算
					const dx = pos2.x - pos1.x
					const dy = pos2.y - pos1.y
					const distance = Math.sqrt(dx * dx + dy * dy) || 1

					const moveDistance = (size1 + size2) * 0.6
					const moveX = (dx / distance) * moveDistance
					const moveY = (dy / distance) * moveDistance

					if (moveIndex === i) {
						resolvedPositions[i].x -= moveX * 0.5
						resolvedPositions[i].y -= moveY * 0.5
					} else {
						resolvedPositions[j].x += moveX * 0.5
						resolvedPositions[j].y += moveY * 0.5
					}
				}
			}
		}

		if (!hasCollision) break
	}

	return resolvedPositions
}

/**
 * カメラからの距離を計算（既存関数・変更なし）
 */
export const calculateDistanceFromCamera = (
	position: { x: number; y: number; z: number },
	cameraPosition: { x: number; y: number; z: number } = { x: 0, y: 0, z: 10 }
): number => {
	return Math.sqrt(
		Math.pow(position.x - cameraPosition.x, 2) +
		Math.pow(position.y - cameraPosition.y, 2) +
		Math.pow(position.z - cameraPosition.z, 2)
	)
}

/**
 * 視野角内にあるかどうかを判定（既存関数・変更なし）
 */
export const isInViewFrustum = (
	position: { x: number; y: number; z: number },
	cameraPosition: { x: number; y: number; z: number },
	fov: number,
	aspect: number,
	near: number,
	far: number
): boolean => {
	const distance = calculateDistanceFromCamera(position, cameraPosition)

	// 距離チェック
	if (distance < near || distance > far) return false

	// 視野角チェック（簡略化）
	const dx = Math.abs(position.x - cameraPosition.x)
	const dy = Math.abs(position.y - cameraPosition.y)
	const dz = Math.abs(position.z - cameraPosition.z)

	const fovRad = (fov * Math.PI) / 180
	const halfHeight = Math.tan(fovRad / 2) * dz
	const halfWidth = halfHeight * aspect

	return dx <= halfWidth && dy <= halfHeight
}

/**
 * デバッグ用：位置情報の可視化データを生成（レスポンシブ情報追加）
 */
export const generatePositionDebugData = (
	imageConfigs: LayeredImageConfig[],
	positions: Array<{ x: number; y: number; z: number }>
) => {
	const viewport = getViewportInfo()
	const gridConfig = getResponsiveGridConfig(viewport)

	return {
		viewport,
		gridConfig,
		images: imageConfigs.map((config, index) => ({
			id: config.id,
			filename: config.filename,
			size: config.size,
			originalPosition: config.position,
			finalPosition: positions[index],
			scrollRange: config.scrollRange,
			zoomRange: config.zoom,
		}))
	}
}-e 
### FILE: ./src/app/components/layered-gallery/LayeredGalleryCanvas.tsx

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
		let baseScale = imageConfig.size === 'L' ? 4.0 :
			imageConfig.size === 'M' ? 3 : 2

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
					opacity={0.7}
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
				opacity={0.7}
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
		<>
			{showGallery && <FullGalleryScene viewport={viewport} />}
		</>
	)
}

export default LayeredGalleryCanvas-e 
### FILE: ./src/app/components/layout/constants.ts

// src/app/components/floating-images-fix/cyber-scroll-messages/constants.ts

export type GlitchEffectType = 'rgb' | 'slice' | 'wave' | 'pulse' | 'jitter' | 'none';
export type TextDirection = 'horizontal' | 'vertical';
export type TextAlignment = 'left' | 'center' | 'right';

export interface MessageConfig {
	id: string;
	text: string;
	position: {
		start: number; // vh単位での開始位置
		end: number;   // vh単位での終了位置
	};
	style: TextDirection;
	size: string;
	align?: TextAlignment;
	glitchEffect?: GlitchEffectType;
	keywords?: string[]; // 特別強調するキーワード
	delay?: number;      // 表示遅延 (ms)
	color?: string;      // オーバーライド色
}

export interface GlitchEffectConfig {
	className: string;
	intensity: number;
}

// メッセージ定義
export const cyberMessages: MessageConfig[] = [
	{
		id: 'message-1',
		text: 'Pepe Ascends.',
		position: { start: 0, end: 200 },
		style: 'horizontal',
		size: '4rem',
		align: 'left',
		glitchEffect: 'rgb',
		keywords: ['mystery', 'miracle'],
		color: '#ffffff', // 白色ベース
	},
	{
		id: 'message-2',
		text: 'Pepe Summons Us Here.',
		position: { start: 200, end: 400 },
		style: 'horizontal',
		size: '4rem',
		align: 'right',
		glitchEffect: 'slice',
		keywords: ['限られた', 'たどり着く'],
		color: '#ffffff', // 白色ベース
	},
	{
		id: 'message-3',
		text: 'The<br/>Awakening',
		position: { start: 400, end: 700 },
		style: 'horizontal',
		size: '10rem',
		align: 'left',
		glitchEffect: 'rgb',
		keywords: ['境地'],
		color: '#ffffff', // 白色ベース
	}
];

// グリッチエフェクト設定
export const glitchEffects: Record<GlitchEffectType, GlitchEffectConfig> = {
	rgb: {
		className: 'rgbSplit',
		intensity: 2
	},
	wave: {
		className: 'waveDistort',
		intensity: 1.5
	},
	slice: {
		className: 'sliceGlitch',
		intensity: 3
	},
	pulse: {
		className: 'pulseEffect',
		intensity: 2
	},
	jitter: {
		className: 'jitterEffect',
		intensity: 1
	},
	none: {
		className: '',
		intensity: 0
	}
};

// システムステータス表示用テキスト
export const systemStatusText = {
	loading: 'Loading...',
	ready: 'Activate',
	awakening: 'Start...',
	complete: 'END'
};

// 装飾用ランダムバイナリ生成
export const generateRandomBinary = (length: number): string => {
	return Array.from({ length }, () => Math.round(Math.random())).join('');
};

// 装飾用16進数生成
export const generateRandomHex = (length: number): string => {
	const hexChars = '0123456789ABCDEF';
	return Array.from(
		{ length },
		() => hexChars[Math.floor(Math.random() * hexChars.length)]
	).join('');
};-e 
### FILE: ./src/app/components/layout/CyberInterface.tsx

// src/app/components/floating-images-fix/cyber-scroll-messages/CyberInterface.tsx

'use client';

import React, { useEffect, useState } from 'react';
import styles from './styles.module.css';
import {
	generateRandomBinary,
	generateRandomHex,
	systemStatusText,
	cyberMessages
} from './constants';

interface CyberInterfaceProps {
}

const CyberInterface: React.FC<CyberInterfaceProps> = ({

}) => {
	const [dataStream, setDataStream] = useState<string[]>([]);
	const [systemTime, setSystemTime] = useState<string>('');
	const [scrollProgress, setScrollProgress] = useState<number>(0);
	const [activeIndex, setActiveIndex] = useState<number | null>(null);
	const [randomGlitch, setRandomGlitch] = useState<boolean>(false);
	const [isFlashActive, setIsFlashActive] = useState<boolean>(false);
	const [debugInfo, setDebugInfo] = useState<{ [key: string]: any }>({});

	// 強制的に全てのメッセージをアクティブにする（デバッグ用）
	const [forceAllActive, setForceAllActive] = useState<boolean>(false);

	useEffect(() => {
		const handleScroll = () => {
			// 現在のページ全体のスクロール位置
			const scrollTop = window.scrollY;
			const winHeight = window.innerHeight;
			const docHeight = document.documentElement.scrollHeight;

			// まず全体のスクロール進捗を計算
			const totalScrollProgress = scrollTop / (docHeight - winHeight);

			// FloatingImagesFixSectionを特定のセレクターで検索
			const targetSection = document.querySelector('#floating-images-fix-section') as HTMLElement;

			if (!targetSection) {
				// フォールバック: クラス名でも検索
				const fallbackSection = document.querySelector('.floating-images-fix-section') as HTMLElement;

				if (!fallbackSection) {
					// セクションが見つからない場合、ページの相対位置で推定
					console.log('Target section not found, estimating position');

					// ページの相対位置から推定（調整された値）
					const estimatedStart = docHeight * 0.5;  // 0.66から0.5に調整
					const estimatedHeight = docHeight * 0.25;

					// 相対スクロール位置を計算
					const relativeScroll = Math.max(0, Math.min(1,
						(scrollTop - estimatedStart) / estimatedHeight
					));

					setScrollProgress(relativeScroll);
					setDebugInfo({
						scrollTop,
						docHeight,
						estimatedStart,
						estimatedHeight,
						relativeScroll,
						mode: 'estimated'
					});

					// メッセージ表示の判定
					updateActiveMessage(relativeScroll * 800);
				} else {
					// フォールバックセクションを使用
					processSectionScroll(fallbackSection, scrollTop);
				}
			} else {
				// メインのIDセレクターで見つかった場合
				processSectionScroll(targetSection, scrollTop);
			}

			// ランダムグリッチの発生
			triggerRandomGlitch();
		};

		// セクションスクロール処理を共通化
		const processSectionScroll = (section: HTMLElement, scrollTop: number) => {
			const rect = section.getBoundingClientRect();
			const sectionTop = rect.top + scrollTop;
			const sectionHeight = rect.height;

			// セクション内相対位置を計算
			let relativeScroll = 0;
			if (scrollTop < sectionTop) {
				relativeScroll = 0;
			} else if (scrollTop > sectionTop + sectionHeight) {
				relativeScroll = 1;
			} else {
				relativeScroll = (scrollTop - sectionTop) / sectionHeight;
			}

			setScrollProgress(relativeScroll);
			setDebugInfo({
				scrollTop,
				sectionTop,
				sectionHeight,
				relativeScroll,
				viewportOffset: rect.top,
				mode: 'section-based',
				sectionFound: section.id || section.className
			});

			// メッセージ表示の判定
			updateActiveMessage(relativeScroll * 800);
		};

		// メッセージのアクティブ状態を更新
		const updateActiveMessage = (currentVhPosition: number) => {
			if (forceAllActive) {
				setActiveIndex(0);
				return;
			}

			// セクション検出が正常に動作している場合は、オフセット調整を少なくする
			const adjustedPosition = currentVhPosition - 50; // 150から50に調整

			let foundActive = false;
			let activeIdx = null;


			setActiveIndex(foundActive ? activeIdx : null);
		};

		// フラッシュエフェクトをトリガー
		const triggerFlashEffect = () => {
			setIsFlashActive(true);
			setTimeout(() => setIsFlashActive(false), 300);
		};

		// ランダムなグリッチエフェクトをトリガー
		const triggerRandomGlitch = () => {
			if (Math.random() > 0.95) {
				setRandomGlitch(true);
				setTimeout(() => setRandomGlitch(false), 150);
			}
		};

		window.addEventListener('scroll', handleScroll);
		handleScroll(); // 初期化時に一度実行

		// キーボードショートカット：Dキーでデバッグモード切替
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === 'd' || e.key === 'D') {
				setForceAllActive(prev => !prev);
				console.log('Debug mode:', !forceAllActive);
			}
		};

		window.addEventListener('keydown', handleKeyDown);

		return () => {
			window.removeEventListener('scroll', handleScroll);
			window.removeEventListener('keydown', handleKeyDown);
		};
	}, [forceAllActive, isFlashActive]);


	// システムステータステキスト
	const getStatusText = () => {
		if (activeIndex === null) return systemStatusText.loading;
		if (activeIndex === 0) return systemStatusText.ready;
		if (activeIndex === 1) return systemStatusText.awakening;
		if (activeIndex === 2) return systemStatusText.complete;
		return systemStatusText.loading;
	};

	// データストリームを生成
	useEffect(() => {
		// 初期データストリームを生成
		const initialData: string[] = [];
		for (let i = 0; i < 50; i++) {
			if (Math.random() > 0.7) {
				initialData.push(generateRandomHex(16));
			} else {
				initialData.push(generateRandomBinary(16));
			}
		}
		setDataStream(initialData);

		// 定期的にデータストリームを更新
		const interval = setInterval(() => {
			setDataStream(prev => {
				const newData = [...prev];
				// 1-3行をランダムに置き換え
				const replaceCount = Math.floor(Math.random() * 3) + 1;
				for (let i = 0; i < replaceCount; i++) {
					const index = Math.floor(Math.random() * newData.length);
					if (Math.random() > 0.7) {
						newData[index] = generateRandomHex(16);
					} else {
						newData[index] = generateRandomBinary(16);
					}
				}
				return newData;
			});

			// ランダムなグリッチ効果
			if (Math.random() > 0.9) {
				setRandomGlitch(true);
				setTimeout(() => setRandomGlitch(false), 200);
			}
		}, 500);

		// システム時間の更新
		const timeInterval = setInterval(() => {
			const now = new Date();
			setSystemTime(`SYS://AWAKENING_SEQUENCE v2.4.7 | ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`);
		}, 1000);

		return () => {
			clearInterval(interval);
			clearInterval(timeInterval);
		};
	}, []);

	// エネルギーレベル（スクロール進行に基づく）
	const energyLevel = Math.max(5, Math.min(100, scrollProgress * 100));

	return (
		<>


			{/* フラッシュエフェクト */}
			<div className={`${styles.flashEffect} ${isFlashActive ? styles.flashActive : ''}`}></div>

			{/* コーナーマーカー */}
			<div className={styles.cyberFrame}>
				<div className={`${styles.cornerMarker} ${styles.topLeft} ${randomGlitch ? styles.jitterEffect : ''}`}></div>
				<div className={`${styles.cornerMarker} ${styles.topRight} ${randomGlitch ? styles.jitterEffect : ''}`}></div>
				<div className={`${styles.cornerMarker} ${styles.bottomLeft} ${randomGlitch ? styles.jitterEffect : ''}`}></div>
				<div className={`${styles.cornerMarker} ${styles.bottomRight} ${randomGlitch ? styles.jitterEffect : ''}`}></div>
			</div>

			<div className={`${styles.thickScanline}`} />
			<div className={`${styles.scanline}`}></div>
			{/* データストリーム */}
			<div className={`${styles.dataStream} `}>
				<div className={styles.dataContent}>
					{dataStream.map((line, index) => (
						<div key={index} className={randomGlitch && index % 5 === 0 ? styles.jitterEffect : ''}>
							{line}
						</div>
					))}
				</div>
			</div>

			{/* エネルギーメーター */}
			<div className={`${styles.energyMeter} hidden sm:block`}>
				<div
					className={styles.energyLevel}
					style={{ height: `${energyLevel}%` }}
				></div>
			</div>

			{/* システムステータス */}
			<div className={`${styles.systemStatus} hidden sm:block`}>
				<div>{systemTime}</div>
				<div>SECTION: {activeIndex !== null ? activeIndex + 1 : 0}/{cyberMessages.length}</div>
				<div>ENERGY: {Math.floor(energyLevel)}%</div>
				<div>{getStatusText()}</div>
			</div>

		</>
	);
};

export default CyberInterface;-e 
### FILE: ./src/app/components/layout/ScanlineEffect.tsx

// src/app/components/ui/ScanlineEffect.tsx
import React from 'react';

export const ScanlineEffect: React.FC = () => {
  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden hidden sm:block">
      <div className="absolute inset-0 z-10 h-full w-full bg-transparent opacity-10">
        {/* スキャンライン効果 */}
        <div className="absolute left-0 top-0 h-[1px] w-full animate-scanline bg-neonGreen opacity-50 shadow-[0_0_5px_#00FF7F] hidden sm:block"></div>
    
      </div>
    </div>
  );
};

export default ScanlineEffect;-e 
### FILE: ./src/app/components/layout/PulsatingComponent.tsx

'use client';
import { useState, useEffect } from 'react';

const PulsatingComponent = () => {
	const [pulses, setPulses] = useState<{ id: number; size: number; opacity: number }[]>([]);

	// Create a new pulse every second
	useEffect(() => {
		const interval = setInterval(() => {
			setPulses(prev => [
				...prev,
				{
					id: Date.now(),   // 安全にユニークにするなら timestamp など
					size: 0,
					opacity: 0.8
				}
			]);
		}, 1000);

		return () => clearInterval(interval);
	}, []);

	// Update pulses animation
	useEffect(() => {
		const animationInterval = setInterval(() => {
			setPulses(prev =>
				prev
					.map(pulse => ({
						...pulse,
						size: pulse.size + 3,
						opacity: Math.max(0, pulse.opacity - 0.01),
					}))
					.filter(pulse => pulse.opacity > 0)
			);
		}, 50);

		return () => clearInterval(animationInterval);
	}, []);

	return (
		<div className="w-full h-[80vh] relative overflow-hidden bg-black">
			<div className="absolute inset-0 flex items-center justify-center pointer-events-none">
				{pulses.map(pulse => (
					<div
						key={pulse.id}
						className="absolute rounded-full border border-neonGreen"
						style={{
							width: `${pulse.size}px`,
							height: `${pulse.size}px`,
							opacity: pulse.opacity,
							left: '50%',     // ← 中心
							top: '50%',      // ← 中心
							transform: 'translate(-50%, -50%)',  // ← 真ん中合わせ
						}}
					/>
				))}

				<div className="z-10 border border-neonGreen px-8 py-3 text-white font-mono whitespace-nowrap bg-black bg-opacity-70">
					We Are <span className="text-orange-500">On-Chain</span>
				</div>
			</div>
		</div>
	);
};

export default PulsatingComponent;
-e 
### FILE: ./src/app/components/sphere/SmoothRotation.tsx

'use client';

import { useRef, useEffect } from 'react';
import * as THREE from 'three';

interface SmoothRotationProps {
  targetRef: React.RefObject<HTMLElement>;
  rotationRef: React.MutableRefObject<number>;  // ★ 変更
  sensitivity?: number;
  decay?: number;
}

/**
 * 物理ベース慣性スクロール → 回転変換
 */
const SmoothRotation: React.FC<SmoothRotationProps> = ({
  targetRef,
  rotationRef,
  sensitivity = 0.002,
  decay = 0.95,
}) => {
  const velocity = useRef(0);
  const isAnimating = useRef(false);
  const lastScrollY = useRef(0);

  const animate = () => {
    if (Math.abs(velocity.current) > 1e-5) {
      rotationRef.current += velocity.current;
      rotationRef.current %= Math.PI * 2;          // 正規化
      velocity.current *= decay;
      requestAnimationFrame(animate);
    } else {
      isAnimating.current = false;
    }
  };

  const onScroll = () => {
    const delta = window.scrollY - lastScrollY.current;
    lastScrollY.current = window.scrollY;

    velocity.current += delta * sensitivity;
    velocity.current = THREE.MathUtils.clamp(velocity.current, -0.1, 0.1);

    if (!isAnimating.current) {
      isAnimating.current = true;
      requestAnimationFrame(animate);
    }
  };

  useEffect(() => {
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return null;
};

export default SmoothRotation;
-e 
### FILE: ./src/app/components/sphere/SphereTop.tsx

'use client';
import Sphere from './Sphere';
import MessageOverlay from './MessageOverlay';
import { useMediaQuery } from 'react-responsive'; // 推奨：メディアクエリのためのフック

const SphereTop: React.FC = () => {
	const isMobile = useMediaQuery({ maxWidth: 767 }); // Tailwindのmdブレイクポイントに合わせる

	const backgroundImage = {
		desktop: `${process.env.NEXT_PUBLIC_CLOUDFRONT_URL}/pepe/cyberpunk-cityscape.webp`,
		mobile: `${process.env.NEXT_PUBLIC_CLOUDFRONT_URL}/pepe/cyberpunk-cityscape.webp`
	};

	return (
		<div className="w-full relative h-[300vh] md:h-[500vh] hidden sm:block">
			{/* グラデーションオーバーレイ */}
			<div
				className="absolute inset-0 z-10 pointer-events-none"
				style={{
					background: `linear-gradient(to bottom,
            rgba(0,0,0,1) 0%,
            rgba(0,0,0,0.85) 10%,
            rgba(0,0,0,0.0) 30%,
            rgba(0,0,0,0.0) 70%,
            rgba(0,0,0,0.85) 90%,
            rgba(0,0,0,1) 100%)`,
				}}
			/>

			{/* 背景スフィア */}
			<div className="sticky top-0 h-screen w-full overflow-hidden">
				<Sphere
					enableControls={false}
					rotationSpeed={0.3}
					backgroundImage={isMobile ? backgroundImage.mobile : backgroundImage.desktop}
					useDefaultEnvironment={false}
					isMobile={isMobile}
				/>
			</div>

			{/* テキスト・UIオーバーレイ */}
			<div className="sticky top-0 h-screen w-full pointer-events-none">
				<MessageOverlay />
			</div>
		</div>
	);
};

export default SphereTop;-e 
### FILE: ./src/app/components/sphere/MessageOverlay.tsx

// src/app/components/SelfCustodySection.tsx
'use client';

import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

/**
 * Self Custody Text Effect Section
 * - Tall scrollable region (300vh)
 * - Scanline overlay fixed across viewport
 * - After 200vh scroll, messages stick to top-left
 * - Typewriter intro line
 * - Scroll-triggered fade & slide key line
 * - Rainbow-tinted weak glitch effect
 * - Adjustable line breaks via whitespace-pre-line
 */
const SelfCustodySection: React.FC = () => {
	return (
		<section className="snap-start relative overflow-hidden">
			{/* Scanline Overlay */}
			<div className="pointer-events-none fixed inset-0 bg-gradient-to-b from-transparent via-black/10 to-transparent opacity-30 animate-scanline z-10" />

			{/* Sticky container: intro + key line stick after 200vh */}
			<div className="sticky top-0 pt-[200vh] z-20">
				<div className="absolute top-0 left-0 mt-8 ml-8 w-full text-left">
					{/* Typewriter Intro */}
					<motion.div
						initial={{ width: 0 }}
						animate={{ width: '100%' }}
						transition={{ duration: 2, ease: 'easeInOut' }}
					>
						<div className="overflow-hidden whitespace-nowrap border-r-2 border-neonGreen font-mono text-neonGreen text-sm mb-6">
						  &gt; selfcustody.exe
						</div>
					</motion.div>
					<KeyLine
						text={`Awaken\nYour soul.`}
						colorClass="text-neonGreen font-heading text-[14vw] font-extrabold"
						borderClass="border-l-2 border-neonGreen"
					/>
				</div>
			</div>

			{/* Rainbow glitch keyframes and class */}
			<style jsx global>{`
        .glitchRainbow {
          position: relative;
          animation: glitchRainbow 3s ease-in-out infinite;
        }
        @keyframes glitchRainbow {
          0%,100% { text-shadow: none; }
          20% { text-shadow: 4px 0 #f00, -4px 0 #0ff; }
          40% { text-shadow: 4px 0 #ff0, -4px 0 #00f; }
          60% { text-shadow: 4px 0 #0f0, -4px 0 #f0f; }
          80% { text-shadow: 4px 0 #f0f, -4px 0 #ff0; }
        }
      `}</style>
		</section>
	);
};

interface KeyLineProps {
	text: string;
	colorClass: string;
	borderClass: string;
}

const KeyLine: React.FC<KeyLineProps> = ({ text, colorClass, borderClass }) => {
	const ref = useRef<HTMLDivElement>(null);
	const { scrollYProgress } = useScroll({ target: ref as React.RefObject<HTMLElement>, offset: ['start end', 'end end'] });
	const opacity = useTransform(scrollYProgress, [0, 0.2], [0, 1]);
	const y = useTransform(scrollYProgress, [0, 0.2], [20, 0]);

	return (
		<motion.div
			ref={ref}
			style={{ opacity, y }}
		>
			<span className={`${colorClass} glitchRainbow whitespace-pre-line leading-none`}>
				{text}
			</span>
		</motion.div>
	);
};

export default SelfCustodySection;
-e 
### FILE: ./src/app/components/sphere/Sphere.tsx

'use client';
import React, { useRef, useState, useEffect, ReactNode } from 'react';
import { Environment, PerspectiveCamera, OrbitControls } from '@react-three/drei';
import { useFrame, Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import styles from './Sphere.module.css';

// エラーバウンダリーコンポーネン (前回と同じ)
interface ErrorBoundaryProps {
	children: React.ReactNode;
	fallback: React.ReactNode;
}

interface ErrorBoundaryState {
	hasError: boolean;
	error?: Error;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
	constructor(props: ErrorBoundaryProps) {
		super(props);
		this.state = { hasError: false };
	}

	static getDerivedStateFromError(error: Error) {
		return { hasError: true, error };
	}

	render() {
		if (this.state.hasError) {
			return this.props.fallback;
		}
		return this.props.children;
	}
}

// 回転制御コンポーネント
type RotatingGroupProps = {
	rotationY?: number;
	rotationSpeed?: number;
	autoRotate?: boolean;
	children: ReactNode;
};

const RotatingGroup: React.FC<RotatingGroupProps> = ({
	rotationY = 0,
	rotationSpeed = 0.3,
	autoRotate = true,
	children,
}) => {
	const groupRef = useRef<THREE.Group>(null);

	useFrame((_, delta) => {
		if (!groupRef.current) return;

		// 自動回転が有効な場合
		if (autoRotate) {
			groupRef.current.rotation.y += 0.2 * delta;
		} else {
			// 外部から渡された回転値を適用
			groupRef.current.rotation.y += 0.2 * delta;
		}
	});

	return (
		// @ts-expect-error React Three Fiber JSX elements
		<group ref={groupRef}>
			{children}
			{/* @ts-expect-error React Three Fiber JSX elements */}
		</group>
	);
};

interface BackgroundSphereProps {
	backgroundImage?: string;
	isMobile?: boolean;
}

// 背景用の球体コンポーネント
const BackgroundSphere: React.FC<BackgroundSphereProps> = ({ backgroundImage, isMobile = false }) => {
	const [texture, setTexture] = useState<THREE.Texture | null>(null);

	useEffect(() => {
		if (backgroundImage) {
			const textureLoader = new THREE.TextureLoader();
			const loadedTexture = textureLoader.load(backgroundImage);
			loadedTexture.mapping = THREE.EquirectangularReflectionMapping;

			// Use colorSpace instead of deprecated encoding
			loadedTexture.colorSpace = THREE.SRGBColorSpace;

			setTexture(loadedTexture);
		}
	}, [backgroundImage]);

	if (!texture) return null;

	return (
		// @ts-expect-error React Three Fiber JSX elements
		<mesh>
			{/* @ts-expect-error React Three Fiber JSX elements */}
			<sphereGeometry args={[isMobile ? 1.6 : 2, isMobile ? 32 : 64, isMobile ? 32 : 64]} />
			{/* @ts-expect-error React Three Fiber JSX elements */}
			<meshBasicMaterial map={texture} side={THREE.BackSide} />
			{/* @ts-expect-error React Three Fiber JSX elements */}
		</mesh>
	);
};

// メインのエクスポートコンポーネン
interface SphereProps {
	className?: string;
	autoRotate?: boolean;
	enableControls?: boolean; // マウスによる水平回転（Y軸周り）操作を許可するかどうか
	rotationSpeed?: number;
	backgroundImage?: string; // カスタム背景画像のパス
	useDefaultEnvironment?: boolean; // デフォルト環境マップを使用するかどうか
	manualRotation?: number; // 手動で指定する回転値（ラジアン）
	isMobile?: boolean; // モバイルデバイスかどうかのフラグ
}

const Sphere: React.FC<SphereProps> = ({
	className = '',
	autoRotate = true,
	enableControls = false,
	rotationSpeed = 0.3,
	backgroundImage = '',
	useDefaultEnvironment = true,
	manualRotation = 0,
	isMobile = false
}) => {
	const [isClient, setIsClient] = useState(false);
	const [isHdrBackground, setIsHdrBackground] = useState(false);

	// サーバーサイドレンダリング対策
	useEffect(() => {
		setIsClient(true);
		// HDRファイルかどうかを確認
		if (backgroundImage && backgroundImage.toLowerCase().endsWith('.hdr')) {
			setIsHdrBackground(true);
		}
	}, [backgroundImage]);

	if (!isClient) {
		return (
			<div className={`${styles.modelContainer} ${className}`}>
				<div className={styles.loadingIndicator}>
					<div className={styles.loadingSpinner}></div>
					<span>Loading Model...</span>
				</div>
			</div>
		);
	}

	// 背景画像がCSSで設定される場合はスタイルを追加
	const containerStyle = {};

	return (
		<div
			className={`${styles.modelContainer} ${className}`}
			style={containerStyle}
		>
			{/* サイバーパンク風の装飾 */}
			<div className={`${styles.decorLine} ${styles.decorLineTop}`}></div>
			<div className={`${styles.decorLine} ${styles.decorLineBottom}`}></div>

			<div className={styles.canvasWrapper}>
				<Canvas
					className="w-full h-full"
					gl={{ antialias: false }}
					dpr={1}
					shadows={false}
					frameloop="always"
				>
					<ErrorBoundary
						fallback={
							<div className={styles.errorMessage}>
								エラー: 3Dモデルの読み込みに失敗しました
							</div>
						}
					>
						{/* 回転制御コンポーネントで背景を囲む */}
						<RotatingGroup
							rotationY={manualRotation}
							rotationSpeed={rotationSpeed}
							autoRotate={!isMobile && autoRotate}
						>
							<BackgroundSphere
								backgroundImage={backgroundImage}
								isMobile={isMobile}
							/>
						</RotatingGroup>

						{/* カメラ設定 */}
						<PerspectiveCamera makeDefault position={[0, 0, 4]} fov={45} />

						{/* コントロール設定 */}
						{enableControls && (
							<OrbitControls
								enableZoom={false}
								enablePan={false}
								enableRotate={true}
								minPolarAngle={Math.PI / 2}
								maxPolarAngle={Math.PI / 2}
								dampingFactor={0.05}
								rotateSpeed={0.5}
							/>
						)}
					</ErrorBoundary>
				</Canvas>
			</div>

			{/* 情報オーバーレイ */}
			<div className={styles.infoOverlay}>
				MODEL: MATRIX-SPHERE v1.0
			</div>
		</div>
	);
};

export default Sphere;-e 
### FILE: ./src/app/components/ui/Footer.tsx

'use client';

import Link from 'next/link';

const Footer = () => {
	const currentYear = new Date().getFullYear();

	const productLinks = [
		{ href: '/products/whey-protein', label: 'Whey Protein' },
		{ href: '/products/bcaa', label: 'BCAA' },
		{ href: '/products/pre-workout', label: 'Pre-Workout' },
		{ href: '/products/creatine', label: 'Creatine' },
	];

	const companyLinks = [
		{ href: '/about', label: 'About Us' },
		{ href: '/how-to-buy', label: 'How to Buy' },
		{ href: '/whitepaper', label: 'White Paper' },
		{ href: '/roadmap', label: 'Roadmap' },
	];

	const communityLinks = [
		{ href: '/discord', label: 'Discord' },
		{ href: '/telegram', label: 'Telegram' },
		{ href: '/twitter', label: 'Twitter' },
		{ href: '/medium', label: 'Medium' },
	];

	const legalLinks = [
		{ href: '/privacy', label: 'Privacy Policy' },
		{ href: '/terms', label: 'Terms of Service' },
		{ href: '/cookies', label: 'Cookie Policy' },
	];

	return (
		<footer className="w-full relative bg-black border-t border-dark-300 overflow-hidden z-20">
			{/* Background Effects */}
			<div className="absolute inset-0 bg-gradient-to-t from-dark-100 to-black"></div>

			{/* Animated scanline */}
			<div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-neonGreen to-transparent animate-pulse opacity-50"></div>

			{/* Grid pattern overlay */}
			<div className="absolute inset-0 opacity-5">
				<div className="w-full h-full" style={{
					backgroundImage: `
            linear-gradient(rgba(0, 255, 127, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 255, 127, 0.1) 1px, transparent 1px)
          `,
					backgroundSize: '50px 50px'
				}}></div>
			</div>

			<div className="relative px-4 sm:px-6 lg:px-8 py-12">
				<div className="max-w-7xl mx-auto">
					{/* Main Footer Content */}
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
						{/* Brand Section */}
						<div className="lg:col-span-1">
							<div className="flex items-center space-x-2 mb-6">
								<div className="relative">
									<div className="w-10 h-10 bg-gradient-to-br from-neonGreen to-neonOrange rounded-sm animate-pulse-fast"></div>
									<div className="absolute inset-0 w-10 h-10 bg-gradient-to-br from-neonGreen to-neonOrange rounded-sm blur-md opacity-50"></div>
								</div>
								<span className="text-2xl font-heading font-bold text-white md:animate-glitch-slow">
									We are on-chain
								</span>
							</div>

							<p className="text-gray-400 text-sm leading-relaxed mb-6">
								The first Web3-native protein brand. Premium supplements powered by blockchain technology and community governance.
							</p>


							{/* Connect Wallet */}
							<button className="w-full px-6 py-3 bg-gradient-to-r from-neonGreen to-neonOrange text-black font-semibold rounded-sm transition-all duration-200 hover:shadow-lg hover:shadow-neonGreen/25 group">
								<span className="relative z-10 text-sm">Login</span>
							</button>
						</div>

						{/* Products */}
						<div>
							<h3 className="text-white font-heading font-semibold mb-4 relative">
								Products
								<div className="absolute bottom-0 left-0 w-8 h-px bg-gradient-to-r from-neonGreen to-transparent"></div>
							</h3>
							<ul className="space-y-3">
								{productLinks.map((link, index) => (
									<li key={link.href}>
										<Link
											href={link.href}
											className="text-gray-400 hover:text-neonGreen transition-colors duration-200 text-sm block relative group"
											style={{ animationDelay: `${index * 50}ms` }}
										>
											<span className="relative z-10">{link.label}</span>
											<div className="absolute left-0 bottom-0 w-0 h-px bg-neonGreen group-hover:w-full transition-all duration-200"></div>
										</Link>
									</li>
								))}
							</ul>
						</div>
						
						<div>
							<h3 className="text-white font-heading font-semibold mb-4 relative">
								Company
								<div className="absolute bottom-0 left-0 w-8 h-px bg-gradient-to-r from-neonOrange to-transparent"></div>
							</h3>
							<ul className="space-y-3">
								{companyLinks.map((link, index) => (
									<li key={link.href}>
										<Link
											href={link.href}
											className="text-gray-400 hover:text-neonGreen transition-colors duration-200 text-sm block relative group"
											style={{ animationDelay: `${index * 50}ms` }}
										>
											<span className="relative z-10">{link.label}</span>
											<div className="absolute left-0 bottom-0 w-0 h-px bg-neonGreen group-hover:w-full transition-all duration-200"></div>
										</Link>
									</li>
								))}
							</ul>
						</div>

						{/* Community */}
						<div>
							<h3 className="text-white font-heading font-semibold mb-4 relative">
								Community
								<div className="absolute bottom-0 left-0 w-8 h-px bg-gradient-to-r from-neonGreen to-neonOrange"></div>
							</h3>
							<ul className="space-y-3">
								{communityLinks.map((link, index) => (
									<li key={link.href}>
										<Link
											href={link.href}
											className="text-gray-400 hover:text-neonGreen transition-colors duration-200 text-sm block relative group"
											style={{ animationDelay: `${index * 50}ms` }}
										>
											<span className="relative z-10">{link.label}</span>
											<div className="absolute left-0 bottom-0 w-0 h-px bg-neonGreen group-hover:w-full transition-all duration-200"></div>
										</Link>
									</li>
								))}
							</ul>
						</div>
					</div>

					{/* Divider */}
					<div className="relative mb-8">
						<div className="absolute inset-0 flex items-center">
							<div className="w-full border-t border-dark-300"></div>
						</div>
						<div className="relative flex justify-center">
							<div className="bg-black px-4">
								<div className="w-2 h-2 bg-neonGreen rounded-full animate-pulse"></div>
							</div>
						</div>
					</div>

			
					<div className="flex flex-col lg:flex-row justify-between items-center space-y-4 lg:space-y-0">
						{/* Legal Links */}
						<div className="flex flex-wrap items-center space-x-6">
							{legalLinks.map((link, index) => (
								<Link
									key={link.href}
									href={link.href}
									className="text-gray-500 hover:text-gray-300 transition-colors duration-200 text-xs"
									style={{ animationDelay: `${index * 25}ms` }}
								>
									{link.label}
								</Link>
							))}
						</div>

						{/* Copyright */}
						<div className="text-center lg:text-right">
							<p className="text-gray-500 text-xs">
								© {currentYear} We are on-chain. All rights reserved.
							</p>
							<p className="text-gray-600 text-xs mt-1">
								Powered by Web3 • Built on Blockchain
							</p>
						</div>
					</div>

					{/* Glitch Effect */}
					<div className="absolute bottom-4 right-4 opacity-20">
						<div className="text-neonGreen font-pixel text-xs md:animate-glitch">
							[BLOCKCHAIN_ENABLED]
						</div>
					</div>
				</div>
			</div>
		</footer>
	);
};

export default Footer;-e 
### FILE: ./src/app/components/ui/Header.tsx

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

const Header = () => {
	const [isVisible, setIsVisible] = useState(true);
	const [lastScrollY, setLastScrollY] = useState(0);
	const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

	useEffect(() => {
		const handleScroll = () => {
			const currentScrollY = window.scrollY;

			if (currentScrollY < lastScrollY || currentScrollY < 100) {
				setIsVisible(true);
			} else if (currentScrollY > lastScrollY && currentScrollY > 100) {
				setIsVisible(false);
			}

			setLastScrollY(currentScrollY);
		};

		window.addEventListener('scroll', handleScroll, { passive: true });
		return () => window.removeEventListener('scroll', handleScroll);
	}, [lastScrollY]);

	const navLinks = [
		{ href: '/shop', label: 'Shop', isHome: true },
		{ href: '/how-to-buy', label: 'How to Buy' },
		{ href: '/whitepaper', label: 'White Paper' },
	];

	return (
		<header
			className={`fixed top-0 left-0 right-0 z-50 transition-transform duration-300 ease-out ${isVisible ? 'translate-y-0' : '-translate-y-full'
				}`}
		>
			{/* Background with blur effect */}
			<div className="absolute inset-0 bg-black/90 backdrop-blur-md border-b border-dark-300"></div>

			{/* Scanline effect */}
			<div className="absolute inset-0 overflow-hidden pointer-events-none">
				<div className="absolute w-full h-px bg-gradient-to-r from-transparent via-neonGreen to-transparent animate-scanline opacity-30"></div>
			</div>

			<nav className="relative px-4 sm:px-6 lg:px-8">
				<div className="flex items-center justify-between h-16 max-w-7xl mx-auto">
					{/* Logo/Brand */}
					<Link href="/" className="flex items-center space-x-2 group">
						<div className="relative">
							<div className="w-8 h-8 bg-gradient-to-br from-neonGreen to-neonOrange rounded-sm animate-pulse-fast"></div>
							<div className="absolute inset-0 w-8 h-8 bg-gradient-to-br from-neonGreen to-neonOrange rounded-sm blur-sm opacity-50"></div>
						</div>
						<span className="text-xl font-heading font-bold text-white group-hover:text-neonGreen transition-colors duration-200 md:animate-glitch-slow">
							We are on-chain
						</span>
					</Link>

					{/* Desktop Navigation */}
					<div className="hidden md:flex items-center space-x-8">
						{navLinks.map((link, index) => (
							<Link
								key={link.href}
								href={link.href}
								className={`relative px-4 py-2 text-sm font-medium transition-all duration-200 group ${link.isHome
										? 'text-neonGreen'
										: 'text-gray-300 hover:text-white'
									}`}
								style={{ animationDelay: `${index * 100}ms` }}
							>
								<span className="relative z-10">{link.label}</span>

								{/* Hover effect */}
								<div className="absolute inset-0 bg-gradient-to-r from-neonGreen/20 to-neonOrange/20 rounded-sm transform scale-0 group-hover:scale-100 transition-transform duration-200"></div>

								{/* Border animation */}
								<div className="absolute bottom-0 left-0 w-0 h-px bg-gradient-to-r from-neonGreen to-neonOrange group-hover:w-full transition-all duration-300"></div>

								{/* Glitch effect for active link */}
								{link.isHome && (
									<div className="absolute inset-0 bg-neonGreen/10 rounded-sm animate-glitch opacity-30"></div>
								)}
							</Link>
						))}

						{/* Connect Wallet Button */}
						<button className="relative px-6 py-2 bg-gradient-to-r from-neonGreen to-neonOrange text-black font-semibold rounded-sm overflow-hidden group transition-all duration-200 hover:shadow-lg hover:shadow-neonGreen/25">
							<span className="relative z-10 text-sm">Login</span>
							<div className="absolute inset-0 bg-gradient-to-r from-neonOrange to-neonGreen transform scale-x-0 group-hover:scale-x-100 transition-transform duration-200 origin-left"></div>
							<div className="absolute inset-0 animate-pulse bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
						</button>
					</div>

					{/* Mobile menu button */}
					<button
						onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
						className="md:hidden relative w-10 h-10 flex flex-col items-center justify-center space-y-1 group"
						aria-label="Toggle mobile menu"
					>
						<span className={`w-6 h-0.5 bg-white transition-all duration-200 ${isMobileMenuOpen ? 'rotate-45 translate-y-1.5' : ''}`}></span>
						<span className={`w-6 h-0.5 bg-white transition-all duration-200 ${isMobileMenuOpen ? 'opacity-0' : ''}`}></span>
						<span className={`w-6 h-0.5 bg-white transition-all duration-200 ${isMobileMenuOpen ? '-rotate-45 -translate-y-1.5' : ''}`}></span>
					</button>
				</div>

				{/* Mobile Navigation */}
				<div className={`md:hidden transition-all duration-300 ease-out overflow-hidden ${isMobileMenuOpen ? 'max-h-64 opacity-100' : 'max-h-0 opacity-0'
					}`}>
					<div className="px-4 py-4 space-y-3 border-t border-dark-300 bg-black/50">
						{navLinks.map((link, index) => (
							<Link
								key={link.href}
								href={link.href}
								className={`block px-4 py-3 text-base font-medium transition-all duration-200 rounded-sm ${link.isHome
										? 'text-neonGreen bg-neonGreen/10 border border-neonGreen/20'
										: 'text-gray-300 hover:text-white hover:bg-dark-200'
									}`}
								onClick={() => setIsMobileMenuOpen(false)}
								style={{ animationDelay: `${index * 50}ms` }}
							>
								{link.label}
							</Link>
						))}

						<button
							className="w-full mt-4 px-6 py-3 bg-gradient-to-r from-neonGreen to-neonOrange text-black font-semibold rounded-sm transition-all duration-200 hover:shadow-lg hover:shadow-neonGreen/25"
							onClick={() => setIsMobileMenuOpen(false)}
						>
							Login
						</button>
					</div>
				</div>
			</nav>
		</header>
	);
};

export default Header;-e 
### FILE: ./src/app/components/ui/GlitchText.tsx

// src/app/components/ui/GlitchText.tsx
'use client';
import React, { useState, useEffect } from 'react';

interface GlitchTextProps {
	text: string;
	className?: string;
	glitchIntensity?: 'low' | 'medium' | 'high';
	color?: string;
	isMainTitle?: boolean;
}

export const GlitchText: React.FC<GlitchTextProps> = ({
	text,
	className = '',
	glitchIntensity = 'medium',
	color = 'text-neonGreen',
	isMainTitle = false,
}) => {
	const [isGlitching, setIsGlitching] = useState(false);
	const [rgbShift, setRgbShift] = useState({ r: 0, g: 0, b: 0 });

	// グリッチ効果のランダム発生
	useEffect(() => {
		const triggerGlitch = () => {
			const shouldGlitch = Math.random() > (
				glitchIntensity === 'low' ? 0.9 :
					glitchIntensity === 'medium' ? 0.8 : 0.7
			);

			if (shouldGlitch) {
				setIsGlitching(true);

				// RGB分離エフェクト用の値を設定
				setRgbShift({
					r: Math.random() * 4 - 2,
					g: Math.random() * 4 - 2,
					b: Math.random() * 4 - 2
				});

				// 短い時間後にグリッチを終了
				setTimeout(() => {
					setIsGlitching(false);
					setRgbShift({ r: 0, g: 0, b: 0 });
				}, Math.random() * 200 + 50);
			}
		};

		const intervalId = setInterval(triggerGlitch, Math.random() * 3000 + 2000);
		return () => clearInterval(intervalId);
	}, [glitchIntensity]);

	const baseClasses = `relative ${color} ${className} ${isMainTitle ? 'font-heading font-bold tracking-wider' : ''}`;

	const glitchClasses = isGlitching ? 'animate-glitch' : '';

	const textShadow = isMainTitle
		? `0 0 5px currentColor, 0 0 10px currentColor, 0 0 20px currentColor`
		: `0 0 3px currentColor`;

	return (
		<div className="relative">
			{/* RGB分離効果 */}
			{isGlitching && (
				<>
					<span
						className={`absolute ${baseClasses} opacity-50 text-red-500`}
						style={{
							transform: `translate(${rgbShift.r}px, 0)`,
							textShadow: '0 0 2px currentColor',
							left: 0,
							top: 0,
							filter: 'blur(0.5px)'
						}}
						aria-hidden="true"
					>
						{text}
					</span>
					<span
						className={`absolute ${baseClasses} opacity-50 text-green-500`}
						style={{
							transform: `translate(${rgbShift.g}px, 0)`,
							textShadow: '0 0 2px currentColor',
							left: 0,
							top: 0,
							filter: 'blur(0.5px)'
						}}
						aria-hidden="true"
					>
						{text}
					</span>
					<span
						className={`absolute ${baseClasses} opacity-50 text-blue-500`}
						style={{
							transform: `translate(${rgbShift.b}px, 0)`,
							textShadow: '0 0 2px currentColor',
							left: 0,
							top: 0,
							filter: 'blur(0.5px)'
						}}
						aria-hidden="true"
					>
						{text}
					</span>
				</>
			)}

			{/* メインテキスト */}
			<span
				className={`${baseClasses} ${glitchClasses} inline-block`}
				style={{
					textShadow,
					animation: isMainTitle ? 'pulse 2s ease-in-out infinite' : undefined,
				}}
			>
				{text}
			</span>
		</div>
	);
};

export default GlitchText;-e 
### FILE: ./src/app/components/hero-section/GlitchEffects.tsx

// src/app/components/hero-section/GlitchEffects.tsx
'use client';
import { useState, useEffect } from 'react';

export interface GlitchState {
  active: boolean;
  intensity: number;
  type: 'none' | 'horizontal' | 'vertical' | 'rgb' | 'rgb-horizontal' | 'rgb-vertical' | 'rgb-shift';
}

// グリッチシーケンスの定義
const defaultGlitchSequence = [
  // 中程度のRGBシフト
  { delay: 2000, duration: 400, type: 'rgb', intensity: 2 },
  // 間隔
  { delay: 1000, duration: 0, type: 'none', intensity: 0 },
  // 水平グリッチ + RGB
  { delay: 300, duration: 250, type: 'rgb-horizontal', intensity: 3 },
  // 短い間隔
  { delay: 800, duration: 0, type: 'none', intensity: 0 },
  // 垂直グリッチ + RGB
  { delay: 250, duration: 200, type: 'rgb-vertical', intensity: 2 },
  // 中程度の間隔
  { delay: 1500, duration: 0, type: 'none', intensity: 0 },
  // 強いRGBシフト + 水平グリッチ
  { delay: 200, duration: 300, type: 'rgb-horizontal', intensity: 4 },
  // 長い間隔
  { delay: 3000, duration: 0, type: 'none', intensity: 0 },
  // 一連の短いRGBグリッチ
  { delay: 150, duration: 80, type: 'rgb-shift', intensity: 3 },
  { delay: 100, duration: 50, type: 'rgb-horizontal', intensity: 2 },
  { delay: 200, duration: 100, type: 'rgb-vertical', intensity: 3 },
  // 長い休止
  { delay: 4000, duration: 0, type: 'none', intensity: 0 },
];

export function useGlitchEffect(
  sequence = defaultGlitchSequence,
  initialDelay = 3000
) {
  const [glitchState, setGlitchState] = useState<GlitchState>({
    active: false,
    intensity: 0,
    type: 'none',
  });

  useEffect(() => {
    let currentIndex = 0;
    let timeoutId: NodeJS.Timeout;

    const runGlitchSequence = () => {
      const { delay, duration, type, intensity } = sequence[currentIndex];

      // グリッチの実行
      if (duration > 0) {
        setGlitchState({ 
          active: true, 
          type: type as GlitchState['type'], 
          intensity 
        });

        // グリッチの終了
        setTimeout(() => {
          setGlitchState({ active: false, type: 'none', intensity: 0 });
        }, duration);
      }

      // 次のグリッチへ
      currentIndex = (currentIndex + 1) % sequence.length;
      timeoutId = setTimeout(runGlitchSequence, delay);
    };

    // シーケンス開始
    timeoutId = setTimeout(runGlitchSequence, initialDelay);

    return () => clearTimeout(timeoutId);
  }, [sequence, initialDelay]);

  // グリッチスタイル計算関数
  const getGlitchStyle = (baseTransform: string = '') => {
    if (!glitchState.active) return {};

    const { type, intensity } = glitchState;
    let transform = baseTransform;
    let filter = '';

    // 強度に応じたスタイル
    const intensityFactor = intensity * 0.5;

    switch (type) {
      case 'horizontal':
        transform += ` translateX(${Math.random() * intensity * 4 - intensity * 2}px)`;
        filter = `contrast(${1 + intensityFactor * 0.1})`;
        break;
      case 'vertical':
        transform += ` translateY(${Math.random() * intensity * 2 - intensity}px)`;
        filter = `contrast(${1 + intensityFactor * 0.05})`;
        break;
      case 'rgb':
        filter = `hue-rotate(${intensityFactor * 15}deg) contrast(${1 + intensityFactor * 0.15})`;
        break;
      case 'rgb-horizontal':
        transform += ` translateX(${Math.random() * intensity * 4 - intensity * 2}px)`;
        filter = `hue-rotate(${intensityFactor * 20}deg) contrast(${1 + intensityFactor * 0.2})`;
        break;
      case 'rgb-vertical':
        transform += ` translateY(${Math.random() * intensity * 3 - intensity * 1.5}px)`;
        filter = `hue-rotate(${intensityFactor * 20}deg) contrast(${1 + intensityFactor * 0.15})`;
        break;
      case 'rgb-shift':
        // RGBずれ効果のみ (変形なし)
        filter = `hue-rotate(${intensityFactor * 30}deg) saturate(${1 + intensityFactor * 0.5})`;
        break;
      default:
        break;
    }

    return {
      transform,
      filter,
      transition: 'transform 0.05s linear, filter 0.05s linear',
    };
  };

  return { glitchState, getGlitchStyle };
}-e 
### FILE: ./src/app/components/hero-section/HeroTitle.tsx

// src/app/components/hero-section/HeroTitle.tsx
import React from 'react';
import GlitchText from '../ui/GlitchText';
import styles from './HeroSection.module.css';
interface HeroTitleProps {
	style?: React.CSSProperties;
}

export const HeroTitle: React.FC<HeroTitleProps> = ({ style }) => {
	return (
		<div className={styles.titleContainer} style={style}>
			{/* メインタイトル */}
			<div className={styles.titleGroup}>
				<GlitchText
					text="NO BANKS"
					className="text-6xl md:text-7xl lg:text-9xl"
					color="text-neonOrange"
					glitchIntensity="high"
					isMainTitle={true}
				/>
				<GlitchText
					text="PEER-TO-PEER"
					className="text-6xl md:text-7xl lg:text-9xl"
					color="text-neonGreen"
					glitchIntensity="medium"
					isMainTitle={true}
				/>
				<GlitchText
					text="JUST PROTEIN"
					className="text-6xl md:text-7xl lg:text-9xl"
					color="text-white"
					glitchIntensity="high"
					isMainTitle={true}
				/>
			</div>
			<p className="mt-6 text-sm md:text-lg text-white">
				Only non-custodial wallets accepted.<br />
				Built for the chain. Priced for the degens.
			</p>
		</div>
	);
};

export default HeroTitle;-e 
### FILE: ./src/app/components/hero-section/HeroBackground.tsx

// src/app/components/hero-section/HeroBackground.tsx

import React from 'react';
import styles from './HeroSection.module.css';
import { GlitchState } from './GlitchEffects';

interface HeroBackgroundProps {
	backgroundTransform: string;
	midLayerTransform: string;
	glitchState: GlitchState;
	getGlitchStyle: (baseTransform: string) => any;
}

export const HeroBackground: React.FC<HeroBackgroundProps> = ({
	backgroundTransform,
	midLayerTransform,
	glitchState,
	getGlitchStyle,
}) => {
	return (
		<>
			{/* 背景画像 - グリッチ効果に対応 */}
			<div
				className={`${styles.backgroundImage} ${glitchState.active ? styles.glitchActive : ''}`}
				style={{
					backgroundImage: `url('${process.env.NEXT_PUBLIC_CLOUDFRONT_URL}/pepe/pepe-cyberpunk.webp')`,
					...(!glitchState.active
						? {
							filter: 'contrast(1.1) brightness(0.9)',
							transform: backgroundTransform,
							transition: 'transform 2s ease-out',
						}
						: getGlitchStyle(backgroundTransform))
				}}
			/>

			{/* ライトとオーバーレイは常時レンダリング */}
			<div
				className={`${styles.darkOverlay} w-full`}
				style={{
					// transformを削除し、オーバーレイは固定に
					transition: 'transform 1.5s ease-out',
				}}
			/>

			{/* 重いエフェクト: モバイルでは非表示 */}
			<div className="hidden sm:block">
				<div
					className={styles.centerLight}
					style={{
						transform: midLayerTransform,
						transition: 'transform 1.5s ease-out',
					}}
				/>
				{/* メインノイズ */}
				<div className={`${styles.mainNoise} ${glitchState.active ? styles.noiseIntense : ''
					}`} />

				{/* 格子状ノイズ */}
				<div
					className={styles.gridNoise}
					style={{
						backgroundImage: `url('${process.env.NEXT_PUBLIC_CLOUDFRONT_URL}/noisy_grid.webp')`,
						transform: midLayerTransform,
						transition: 'transform 1.5s ease-out',
					}}
				/>

				{/* 動くノイズ */}
				<div className={styles.movingNoise} />

				{/* RGB分離効果 */}
				<div className={`${styles.rgbSplit} ${glitchState.active && glitchState.type.includes('rgb') ? styles.rgbActive : ''
					}`} />

				{/* グリッチブロックエフェクト */}
				{glitchState.active && glitchState.intensity > 2 && (
					<div
						className={styles.glitchBlocks}
						style={{
							backgroundImage: `url('${process.env.NEXT_PUBLIC_CLOUDFRONT_URL}/pepe/pepe-cyberpunk.webp')`,
							opacity: 0.4 + glitchState.intensity * 0.05,
						}}
					/>
				)}

				{/* RGBスライス効果 */}
				{glitchState.active && glitchState.type.includes('rgb') && glitchState.intensity > 2 && (
					<>
						<div
							className={styles.rgbSliceRed}
							style={{
								backgroundImage: `url('${process.env.NEXT_PUBLIC_CLOUDFRONT_URL}/pepe/pepe-cyberpunk.webp')`,
								transform: `translateX(${glitchState.intensity * 1.5}px)`,
							}}
						/>
						<div
							className={styles.rgbSliceBlue}
							style={{
								backgroundImage: `url('${process.env.NEXT_PUBLIC_CLOUDFRONT_URL}/pepe/pepe-cyberpunk.webp')`,
								transform: `translateX(-${glitchState.intensity * 1.5}px)`,
							}}
						/>
					</>
				)}
			</div>
		</>
	);
};

export default HeroBackground;
-e 
### FILE: ./src/app/components/hero-section/HeroSection.tsx

'use client';
import React, { useState, useEffect } from 'react';
import styles from './HeroSection.module.css';
import { useGlitchEffect } from './GlitchEffects';
import HeroBackground from './HeroBackground';
import HeroTitle from './HeroTitle';

export const HeroSection: React.FC = () => {
	const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
	const { glitchState, getGlitchStyle } = useGlitchEffect();

	useEffect(() => {
		const handleMouseMove = (e: MouseEvent) => {
			setMousePosition({
				x: e.clientX / window.innerWidth,
				y: e.clientY / window.innerHeight,
			});
		};
		window.addEventListener('mousemove', handleMouseMove);
		return () => window.removeEventListener('mousemove', handleMouseMove);
	}, []);

	const backgroundTransform = `
    scale(1.05)
    translateX(${(mousePosition.x - 0.5) * 10}px)
    translateY(${(mousePosition.y - 0.5) * 10}px)
  `;
	const midLayerTransform = `
    translateX(${(mousePosition.x - 0.5) * -15}px)
    translateY(${(mousePosition.y - 0.5) * -7.5}px)
  `;
	const foregroundTransform = `
    translateX(${(mousePosition.x - 0.5) * -25}px)
    translateY(${(mousePosition.y - 0.5) * -12.5}px)
  `;

	return (
		<div className="sticky w-full top-0 h-[80vh] md:h-[90vh] overflow-hidden">
			<HeroBackground
				backgroundTransform={backgroundTransform}
				midLayerTransform={midLayerTransform}
				glitchState={glitchState}
				getGlitchStyle={getGlitchStyle}
			/>
			<div
				className={`${styles.contentContainer} mt-10 max-w-screen-xl mx-auto flex justify-center items-center`}
				style={{
					transform: foregroundTransform,
					transition: 'transform 0.5s ease-out',
				}}
			>
				<HeroTitle />
			</div>
		</div>

	);
};

export default HeroSection;
-e 
### FILE: ./src/app/components/pepe-gallery/ScrollableImages.tsx

'use client';

import { useRef, useState, useEffect, useMemo } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { useScroll, Scroll } from '@react-three/drei';
import { imageFiles } from './utils/constants';
import { calculateOptimalImagePositions } from './utils/imageLoader';
import ImageItem from './ImageItem';
import * as THREE from 'three'

const ScrollableImages: React.FC = () => {
	// スクロールデータを取得
	const data = useScroll();
	const groupRef = useRef<THREE.Group>(null);

	// ビューポートのサイズを取得
	const { width, height } = useThree((state) => state.viewport);

	// 画面に表示可能な画像数の制限（パフォーマンス最適化）
	const [visibleRange, setVisibleRange] = useState({ start: 0, end: 12 });

	// サイズに基づいた最適な画像配置を計算
	const imagePositions = useMemo(() => {
		return calculateOptimalImagePositions(imageFiles, width, height);
	}, [width, height]);

	// スクロール位置に基づいて表示する画像範囲を更新
	useEffect(() => {
		const updateVisibleRange = () => {
			// スクロール位置に基づいて表示範囲を計算
			const scrollOffset = Math.floor(data.offset * imageFiles.length);
			const start = Math.max(0, scrollOffset - 6);
			const end = Math.min(imageFiles.length, scrollOffset + 12);

			setVisibleRange({ start, end });
		};

		// スクロールイベントのリスナーを追加
		const scrollElement = data.el;
		if (scrollElement) {
			scrollElement.addEventListener('scroll', updateVisibleRange);
		}

		// 初期表示範囲を設定
		updateVisibleRange();

		// クリーンアップ関数
		return () => {
			if (scrollElement) {
				scrollElement.removeEventListener('scroll', updateVisibleRange);
			}
		};
	}, [data]);

	// 各フレームでのスクロールに基づくアニメーション
	useFrame(() => {
		if (groupRef.current) {
			// 各画像の状態を更新（必要に応じて）
			if (groupRef.current.children.length > 0) {
				// 例: スクロール範囲に基づく透明度や位置の調整
				const scrollRange = data.range(0, 1);

				// 必要に応じてここに追加のスクロールアニメーションを実装
			}
		}
	});

	return (
		<Scroll>
			{/* @ts-expect-error React Three Fiber JSX elements */}
			<group ref={groupRef}>
				{imageFiles.map((image, index) => {
					// 画像の位置を取得（デフォルト位置を設定）
					const position = imagePositions[image.id] || [
						(index % 5 - 2) * 2,
						-Math.floor(index / 5) * 3,
						0
					];

					// スクロール範囲内の画像のみをレンダリング
					const isVisible = index >= visibleRange.start && index <= visibleRange.end;

					// 画像のスクロール進行状況を計算
					const scrollProgress = data.range(
						index / imageFiles.length,
						1 / imageFiles.length
					);

					return (
						<ImageItem
							key={image.id}
							image={image}
							position={position}
							scrollProgress={scrollProgress}
							isVisible={isVisible}
							index={index}
						/>
					);
				})}
				{/* @ts-expect-error React Three Fiber JSX elements */}
			</group>
		</Scroll>
	);
};

export default ScrollableImages;-e 
### FILE: ./src/app/components/pepe-gallery/ImageItem.tsx

'use client';

import { useRef, useState, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Image as DreiImage } from '@react-three/drei';
import { ImageFile, SIZE_SCALES } from './utils/constants';
import styles from './styles/GalleryEffects.module.css';
import { useImageLoader } from './utils/imageLoader';
import { easing } from 'maath';

interface ImageItemProps {
  image: ImageFile;
  position: [number, number, number];
  scrollProgress: number;
  isVisible?: boolean;
  index: number;
}

const ImageItem: React.FC<ImageItemProps> = ({
  image,
  position,
  scrollProgress,
  isVisible = true,
  index
}) => {
  const ref = useRef<any>(null);
  const { size } = image;
  const scale = SIZE_SCALES[size];
  
  // スケールのサイズに基づく調整
  const scaleFactor = typeof scale === 'number' ? scale : 
                     Array.isArray(scale) ? [scale[0], scale[1], 1] : [scale, scale, 1];
  
  // ビューポートの幅と高さを取得
  const { width, height } = useThree((state) => state.viewport);
  
  // 画像の読み込み状態を取得
  const { loading, error } = useImageLoader(image.path);
  
  // スクロール位置に基づく動的なズーム効果
  const scrollBasedZoom = 1 + (scrollProgress * 0.2);
  
  // グレースケール効果の状態
  const [grayscale, setGrayscale] = useState(1);
  
  // スクロール位置に基づいてグレースケール効果を更新
  useEffect(() => {
    // インデックスに基づいて異なるスクロール範囲でグレースケール効果を適用
    const startPoint = (index % 5) * 0.1 + 0.2;
    const endPoint = startPoint + 0.3;
    
    // スクロール範囲内に入ったらカラーに変化
    if (scrollProgress > startPoint && scrollProgress < endPoint) {
      setGrayscale(0); // カラー
    } else {
      setGrayscale(1); // グレースケール
    }
  }, [scrollProgress, index]);
  
  // 各フレームで適用するアニメーション
  useFrame((state, delta) => {
    if (ref.current) {
      // 滑らかなホバリングエフェクト（浮遊感）
      const time = state.clock.getElapsedTime();
      const hoverEffect = Math.sin(time * 0.3 + index) * 0.1;
      
      // スクロールに応じた移動とスケール変更
      easing.damp3(
        ref.current.position,
        [
          position[0] + Math.sin(time * 0.1 + index) * 0.3,
          position[1] + hoverEffect,
          position[2]
        ],
        0.2,
        delta
      );
      
      // スクロールに応じたサイズ変化
      easing.damp3(
        ref.current.scale,
        0.3,
        delta
      );
      
      // スクロールに応じた回転効果
      easing.dampE(
        ref.current.rotation,
        [0, 0, Math.sin(time * 0.2 + index) * 0.05],
        0.3,
        delta
      );
      
      // グレースケール効果の滑らかな遷移
      easing.damp(
        ref.current.material,
        'grayscale',
        grayscale,
        0.3,
        delta
      );
    }
  });
  
  if (!isVisible || loading || error) {
    return null;
  }
  
  return (
    <DreiImage
      ref={ref}
      url={image.path}
      position={position}
      transparent
      opacity={1}
      toneMapped={false}
    />
  );
};

export default ImageItem;-e 
### FILE: ./src/app/components/pepe-gallery/GalleryTypography.tsx

'use client';

import React, { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Text, useScroll } from '@react-three/drei';
import { TYPOGRAPHY_POSITIONS } from './utils/constants';
import { applyTextFadeEffect, applyFloatingAnimation } from './utils/scrollAnimation';

// テキスト要素の型定義
interface TextElement {
	id: number;
	text: string;
	position: [number, number, number];
	anchorX?: 'left' | 'center' | 'right';
	visibleRange: [number, number]; // [表示開始位置, 表示終了位置]
}

const GalleryTypography: React.FC = () => {
	// テキスト要素の定義
	const textElements: TextElement[] = [
		{
			id: 1,
			text: "PEPE",
			position: TYPOGRAPHY_POSITIONS[0].position as [number, number, number],
			anchorX: TYPOGRAPHY_POSITIONS[0].anchorX as 'left' | 'center' | 'right',
			visibleRange: [0, 0.4] // スクロール0%〜40%の間で表示
		},
		{
			id: 2,
			text: "GALLERY",
			position: TYPOGRAPHY_POSITIONS[1].position as [number, number, number],
			anchorX: TYPOGRAPHY_POSITIONS[1].anchorX as 'left' | 'center' | 'right',
			visibleRange: [0.3, 0.7] // スクロール30%〜70%の間で表示
		},
		{
			id: 3,
			text: "COLLECTION",
			position: TYPOGRAPHY_POSITIONS[2].position as [number, number, number],
			anchorX: TYPOGRAPHY_POSITIONS[2].anchorX as 'left' | 'center' | 'right',
			visibleRange: [0.6, 1.0] // スクロール60%〜100%の間で表示
		}
	];

	// スクロールデータを取得
	const data = useScroll();

	// テキスト要素の参照を保持する配列
	const textRefs = useRef<Array<React.RefObject<any>>>([]);

	// テキスト要素の参照を初期化
	if (textRefs.current.length !== textElements.length) {
		textRefs.current = Array(textElements.length)
			.fill(null)
			.map((_, i) => textRefs.current[i] || React.createRef());
	}

	// ビューポートのサイズを取得
	const { width, height } = useThree((state) => state.viewport);

	// テキストのスタイル設定
	const textStyle = {
		font: '/Inter-Regular.woff', // プロジェクトに合わせて変更
		fontSize: width * 0.08,
		letterSpacing: -0.05,
		lineHeight: 1,
		'material-toneMapped': false
	};

	// 各フレームでのアニメーション処理
	useFrame((state, delta) => {
		const scrollOffset = data.offset; // スクロール位置（0-1）
		const time = state.clock.getElapsedTime();

		// 各テキスト要素にアニメーション効果を適用
		textElements.forEach((element, index) => {
			const ref = textRefs.current[index];
			if (ref && ref.current) {
				// フェードイン/アウト効果の適用
				applyTextFadeEffect(ref, scrollOffset, element.visibleRange, delta);

				// 浮遊アニメーションの適用
				applyFloatingAnimation(
					ref,
					time + index,
					element.position,
					0.05 // 浮遊の振幅
				);
			}
		});
	});

	return (
		<>
			{textElements.map((element, index) => (
				<Text
					key={element.id}
					ref={textRefs.current[index]}
					position={element.position}
					anchorX={element.anchorX || 'center'}
					anchorY="middle"
					color="black"
					{...textStyle}
				>
					{element.text}
				</Text>
			))}
		</>
	);
};

export default GalleryTypography;-e 
### FILE: ./src/app/components/pepe-gallery/utils/constants.ts

// 画像サイズの定義
export type ImageSize = 'S' | 'M' | 'L';

// 画像ファイルの型定義
export interface ImageFile {
  id: number;
  filename: string;
  size: ImageSize;
  path: string;
}

// CDN URL設定（必要に応じて環境変数から取得する実装に変更可能）
export const CDN_URL = process.env.NEXT_PUBLIC_CLOUDFRONT_URL || '';

// 画像サイズに応じたスケール係数の定義
export const SIZE_SCALES = {
  S: 1.5,
  M: 2.5,
  L: 3
};

// 画像サイズに応じたZ位置（深度）設定
export const SIZE_Z_POSITIONS = {
  S: 10,
  M: 5,
  L: 0
};

// スクロール効果の設定
export const SCROLL_SETTINGS = {
  damping: 0.2,  // スクロールの減衰係数
  pages: 5,      // スクロールページ数
  distance: 0.5  // スクロール距離係数
};

// アニメーション設定
export const ANIMATION_SETTINGS = {
  zoomFactor: 0.3,    // ズーム効果の強さ
  transitionSpeed: 0.15,  // 遷移の速さ
  rotationFactor: 0.02    // 回転効果の強さ
};

// 画像ファイルのリスト
export const imageFiles: ImageFile[] = [
  { id: 1, filename: '1L.webp', size: 'L', path: `${CDN_URL}/pepe/1L.webp` },
  { id: 2, filename: '2M.webp', size: 'M', path: `${CDN_URL}/pepe/2M.webp` },
  { id: 3, filename: '3S.webp', size: 'S', path: `${CDN_URL}/pepe/3S.webp` },
  { id: 4, filename: '4S.webp', size: 'S', path: `${CDN_URL}/pepe/4S.webp` },
  { id: 5, filename: '5M.webp', size: 'M', path: `${CDN_URL}/pepe/5M.webp` },
  { id: 6, filename: '6L.webp', size: 'L', path: `${CDN_URL}/pepe/6L.webp` },
  { id: 7, filename: '7M.webp', size: 'M', path: `${CDN_URL}/pepe/7M.webp` },
  { id: 8, filename: '8M.webp', size: 'M', path: `${CDN_URL}/pepe/8M.webp` },
  { id: 9, filename: '9L.webp', size: 'L', path: `${CDN_URL}/pepe/9L.webp` },
  { id: 10, filename: '10S.webp', size: 'S', path: `${CDN_URL}/pepe/10S.webp` },
  { id: 11, filename: '11S.webp', size: 'S', path: `${CDN_URL}/pepe/11S.webp` },
  { id: 12, filename: '12M.webp', size: 'M', path: `${CDN_URL}/pepe/12M.webp` },
  { id: 13, filename: '13L.webp', size: 'L', path: `${CDN_URL}/pepe/13L.webp` },
  { id: 14, filename: '14L.webp', size: 'L', path: `${CDN_URL}/pepe/14L.webp` },
  { id: 15, filename: '15M.webp', size: 'M', path: `${CDN_URL}/pepe/15M.webp` },
  { id: 16, filename: '16S.webp', size: 'S', path: `${CDN_URL}/pepe/16S.webp` },
  { id: 17, filename: '17S.webp', size: 'S', path: `${CDN_URL}/pepe/17S.webp` },
  { id: 18, filename: '18M.webp', size: 'M', path: `${CDN_URL}/pepe/18M.webp` },
  { id: 19, filename: '19L.webp', size: 'L', path: `${CDN_URL}/pepe/19L.webp` },
  { id: 20, filename: '20L.webp', size: 'L', path: `${CDN_URL}/pepe/20L.webp` },
  { id: 21, filename: '21S.webp', size: 'S', path: `${CDN_URL}/pepe/21S.webp` },
  { id: 22, filename: '22S.webp', size: 'S', path: `${CDN_URL}/pepe/22S.webp` },
  { id: 23, filename: '23L.webp', size: 'L', path: `${CDN_URL}/pepe/23L.webp` },
  { id: 24, filename: '24L.webp', size: 'L', path: `${CDN_URL}/pepe/24L.webp` },
  { id: 25, filename: '25S.webp', size: 'S', path: `${CDN_URL}/pepe/25S.webp` },
  { id: 26, filename: '26S.webp', size: 'S', path: `${CDN_URL}/pepe/26S.webp` },
  { id: 27, filename: '27S.webp', size: 'S', path: `${CDN_URL}/pepe/27S.webp` },
  { id: 28, filename: '28L.webp', size: 'L', path: `${CDN_URL}/pepe/28L.webp` },
  { id: 29, filename: '29S.webp', size: 'S', path: `${CDN_URL}/pepe/29S.webp` },
  { id: 30, filename: '30S.webp', size: 'S', path: `${CDN_URL}/pepe/30S.webp` },
  { id: 31, filename: '31M.webp', size: 'M', path: `${CDN_URL}/pepe/31M.webp` },
  { id: 32, filename: '32M.webp', size: 'M', path: `${CDN_URL}/pepe/32M.webp` },
  { id: 33, filename: '33M.webp', size: 'M', path: `${CDN_URL}/pepe/33M.webp` },
  { id: 34, filename: '34S.webp', size: 'S', path: `${CDN_URL}/pepe/34S.webp` },
  { id: 35, filename: '35L.webp', size: 'L', path: `${CDN_URL}/pepe/35L.webp` },
];

// テキスト要素の配置設定
export const TYPOGRAPHY_POSITIONS = [
  { text: "PEPE", position: [-2, 0, 12], anchorX: "left" },
  { text: "GALLERY", position: [2, -2, 12], anchorX: "right" },
  { text: "COLLECTION", position: [0, -4.5, 12], anchorX: "center" }
];-e 
### FILE: ./src/app/components/pepe-gallery/utils/imageLoader.ts

import { useState, useEffect, useCallback } from 'react';
import * as THREE from 'three';
import { ImageFile } from './constants';

/**
 * 画像読み込み状態の型定義
 */
interface ImageLoadingState {
  texture: THREE.Texture | null;
  loading: boolean;
  error: Error | null;
}

/**
 * 画像読み込み用カスタムフック
 * 指定されたURLから画像をテクスチャとして読み込む
 */
export const useImageLoader = (imageUrl: string): ImageLoadingState => {
  const [state, setState] = useState<ImageLoadingState>({
    texture: null,
    loading: true,
    error: null
  });

  useEffect(() => {
    // 画像を読み込むたびに状態をリセット
    setState({ texture: null, loading: true, error: null });

    const textureLoader = new THREE.TextureLoader();
    
    textureLoader.load(
      imageUrl,
      // 読み込み成功時
      (loadedTexture) => {
        loadedTexture.needsUpdate = true;
        setState({
          texture: loadedTexture,
          loading: false,
          error: null
        });
      },
      // 読み込み進捗時（必要に応じて実装）
      undefined,
      // 読み込み失敗時
      (error) => {
        console.error(`Error loading texture from ${imageUrl}:`, error);
      }
    );

    // クリーンアップ関数
    return () => {
      // コンポーネントのアンマウント時にテクスチャを破棄
      if (state.texture) {
        state.texture.dispose();
      }
    };
  }, [imageUrl]);

  return state;
};

/**
 * 複数画像の事前読み込み用ユーティリティ
 * 指定された画像リストを非同期で事前読み込みする
 */
export const preloadImages = async (images: ImageFile[]): Promise<void> => {
  const textureLoader = new THREE.TextureLoader();
  
  // すべての画像を非同期で読み込む
  const loadPromises = images.map(img => {
    return new Promise<void>((resolve, reject) => {
      textureLoader.load(
        img.path,
        () => resolve(),
        undefined,
        (error) => {
          console.warn(`Failed to preload image ${img.filename}:`, error);
          resolve(); // エラーでも続行するため、rejectではなくresolveを呼び出す
        }
      );
    });
  });

  // すべての読み込みが完了するまで待機
  await Promise.all(loadPromises);
};

/**
 * 画像配置を最適化するためのユーティリティ
 * サイズに基づいて画像の最適な配置を計算する
 */
export const calculateOptimalImagePositions = (
  images: ImageFile[],
  viewportWidth: number,
  viewportHeight: number
): { [key: number]: [number, number, number] } => {
  // 画像IDをキーとし、位置座標[x, y, z]を値とするオブジェクト
  const positions: { [key: number]: [number, number, number] } = {};
  
  // 特大画像(L)、中型画像(M)、小型画像(S)をグループ化
  const largeImages = images.filter(img => img.size === 'L');
  const mediumImages = images.filter(img => img.size === 'M');
  const smallImages = images.filter(img => img.size === 'S');
  
  // 視覚的な配置の多様性のために使用する係数
  const diversityFactor = 0.7;
  
  // Lサイズ画像の配置 - 主要な位置に配置
  largeImages.forEach((img, index) => {
    const xPos = (index % 3 - 1) * viewportWidth / 2.5;
    const yPos = -Math.floor(index / 3) * viewportHeight / 1.5;
    const zPos = 0; // 前面に配置
    positions[img.id] = [xPos, yPos, zPos];
  });
  
  // Mサイズ画像の配置 - Lサイズの間を埋める
  mediumImages.forEach((img, index) => {
    const xPos = ((index % 4) - 1.5) * viewportWidth / 3 * diversityFactor;
    const yPos = -Math.floor(index / 4) * viewportHeight / 2 - viewportHeight / 4;
    const zPos = 5; // Lの後ろに配置
    positions[img.id] = [xPos, yPos, zPos];
  });
  
  // Sサイズ画像の配置 - 埋め草的に散らす
  smallImages.forEach((img, index) => {
    const xPos = ((index % 5) - 2) * viewportWidth / 4 * diversityFactor;
    const yPos = -Math.floor(index / 5) * viewportHeight / 2.5 - viewportHeight / 3;
    const zPos = 10; // 最も後ろに配置
    positions[img.id] = [xPos, yPos, zPos];
  });
  
  return positions;
};-e 
### FILE: ./src/app/components/pepe-gallery/utils/scrollAnimation.ts

import { MutableRefObject } from 'react';
import { Object3D, Vector3, Euler } from 'three';
import { easing } from 'maath';

/**
 * スクロール位置に基づくアニメーション値の計算
 * @param start 効果の開始位置 (0-1)
 * @param end 効果の終了位置 (0-1)
 * @param scrollOffset 現在のスクロール位置 (0-1)
 * @param minValue 最小値
 * @param maxValue 最大値
 * @returns 計算された値
 */
export const calculateScrollValue = (
	start: number,
	end: number,
	scrollOffset: number,
	minValue: number,
	maxValue: number
): number => {
	// スクロール範囲外の場合
	if (scrollOffset < start) return minValue;
	if (scrollOffset > end) return maxValue;

	// 範囲内の場合は線形補間
	const normalizedOffset = (scrollOffset - start) / (end - start);
	return minValue + normalizedOffset * (maxValue - minValue);
};

/**
 * スクロール位置に基づく回転効果
 */
export const applyScrollRotation = (
	ref: MutableRefObject<Object3D | null>,
	scrollOffset: number,
	delta: number,
	intensity: number = 0.1
): void => {
	if (!ref.current) return;

	// スクロール位置に基づく回転角度の計算
	const targetRotation = new Euler(
		0,
		scrollOffset * Math.PI * intensity,
		0
	);

	// 滑らかな回転の適用
	easing.dampE(
		ref.current.rotation,
		[targetRotation.x, targetRotation.y, targetRotation.z],
		0.3,
		delta
	);
};

/**
 * スクロール位置に基づくズーム効果
 */
export const applyScrollZoom = (
	ref: MutableRefObject<Object3D | null>,
	scrollOffset: number,
	delta: number,
	baseScale: number | [number, number, number] = 1,
	intensity: number = 0.2
): void => {
	if (!ref.current) return;

	// ベーススケールの処理
	const baseScaleVector = typeof baseScale === 'number'
		? [baseScale, baseScale, baseScale]
		: baseScale;

	// スクロール位置に基づくスケール係数の計算
	const zoomFactor = 1 + (scrollOffset * intensity);

	// 目標スケールの計算
	const targetScale = [
		baseScaleVector[0] * zoomFactor,
		baseScaleVector[1] * zoomFactor,
		baseScaleVector[2]
	];

	// 滑らかなスケールの適用
	easing.damp3(
		ref.current.scale,
		0.2,
		delta
	);
};

/**
 * スクロール位置に基づく移動効果
 */
export const applyScrollMovement = (
	ref: MutableRefObject<Object3D | null>,
	scrollOffset: number,
	delta: number,
	basePosition: [number, number, number],
	movementVector: [number, number, number] = [0, -1, 0],
	intensity: number = 1
): void => {
	if (!ref.current) return;

	// スクロール位置に基づく移動量の計算
	const targetPosition = [
		basePosition[0] + (movementVector[0] * scrollOffset * intensity),
		basePosition[1] + (movementVector[1] * scrollOffset * intensity),
		basePosition[2] + (movementVector[2] * scrollOffset * intensity)
	];

	// 滑らかな移動の適用
	easing.damp3(
		ref.current.position,
		0.15,
		delta
	);
};

/**
 * テキスト表示のフェードイン/アウト効果
 */
export const applyTextFadeEffect = (
	ref: MutableRefObject<any | null>,
	scrollOffset: number,
	visibleRange: [number, number], // [表示開始位置, 表示終了位置]
	delta: number
): void => {
	if (!ref.current || !ref.current.material) return;

	const [start, end] = visibleRange;
	const targetOpacity = calculateScrollValue(start, start + 0.1, scrollOffset, 0, 1);
	const fadeOutOpacity = calculateScrollValue(end - 0.1, end, scrollOffset, 1, 0);

	// 最終的な不透明度の計算
	const finalOpacity = Math.min(targetOpacity, fadeOutOpacity);

	// 滑らかな不透明度の適用
	easing.damp(
		ref.current.material,
		'opacity',
		finalOpacity,
		0.2,
		delta
	);
};

/**
 * 浮遊効果のアニメーション（時間ベース）
 */
export const applyFloatingAnimation = (
	ref: MutableRefObject<Object3D | null>,
	time: number,
	basePosition: [number, number, number],
	amplitude: number = 0.1
): void => {
	if (!ref.current) return;

	// 時間に基づく浮遊効果の計算
	const floatingY = Math.sin(time * 0.5) * amplitude;

	// 位置の更新
	ref.current.position.set(
		basePosition[0],
		basePosition[1] + floatingY,
		basePosition[2]
	);
};-e 
### FILE: ./src/app/components/pepePush/types/index.ts

// types/index.ts
export interface ControlPoint {
  scrollProgress: number; // 0-1の範囲
  position: [number, number, number]; // x, y, z座標
  rotation?: [number, number, number]; // オプショナルな回転
  scale?: [number, number, number]; // オプショナルなスケール
}

export interface ScrollState {
  scrollProgress: number; // 0-1の範囲でのスクロール進行度
  isInSection: boolean; // セッション内にいるかどうか
}

export interface ModelTransform {
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
}

export interface PepePushProps {
  className?: string;
}

export interface StickyCanvasProps {
  children: React.ReactNode;
  className?: string;
}-e 
### FILE: ./src/app/components/pepePush/config/controlPoints.ts

// config/controlPoints.ts
import { ControlPoint } from '../types';

// スマホ判定のヘルパー関数
const isMobile = () => {
	if (typeof window === 'undefined') return false;
	return window.innerWidth <= 768;
};

export const controlPoints: ControlPoint[] = [
	{
		scrollProgress: 0,
		position: [0, -1, 0],
		rotation: [Math.PI / 4, -Math.PI / 12, 0],
		scale: [1, 1, 1]
	},
	{
		scrollProgress: 0.25,
		position: [0, 0, 0],
		rotation: [0, 0, 0],
		scale: [1.2, 1.2, 1.2]
	},
	{
		scrollProgress: 0.5,
		position: [2, 1, -1],
		rotation: [0, Math.PI / 3, 0],
		scale: [1, 1, 1]
	},
	{
		scrollProgress: 0.75,
		position: [0, -1, 2],
		rotation: [0, Math.PI, 0],
		scale: [0.8, 0.8, 0.8]
	},
	{
		scrollProgress: 1,
		position: [0, -2, 0],
		rotation: [0, -Math.PI / 2, 0],
		scale: isMobile() ? [0.6, 0.6, 0.6] : [1, 1, 1] // スマホでは小さく
	}
];

// レスポンシブ対応の制御点を取得する関数
export const getResponsiveControlPoints = (): ControlPoint[] => {
	const mobile = isMobile();

	return [
		{
			scrollProgress: 0,
			position: [0, -1, 0],
			rotation: [Math.PI / 4, -Math.PI / 12, 0],
			scale: [1, 1, 1]
		},
		{
			scrollProgress: 0.25,
			position: [0, 0, 0],
			rotation: [0, 0, 0],
			scale: [1.2, 1.2, 1.2]
		},
		{
			scrollProgress: 0.5,
			position: [2, 1, -1],
			rotation: [0, Math.PI / 3, 0],
			scale: [1, 1, 1]
		},
		{
			scrollProgress: 0.75,
			position: [0, -1, 2],
			rotation: [0, Math.PI, 0],
			scale: [0.8, 0.8, 0.8]
		},
		{
			scrollProgress: 1,
			position: [0, -2, 0],
			rotation: [0, -Math.PI / 2, 0],
			scale: mobile ? [0.6, 0.6, 0.6] : [1, 1, 1] // スマホでは60%のサイズ
		}
	];
};

// 設定値の調整用ヘルパー
export const CONFIG = {
	// セッションの高さ（vh）
	SECTION_HEIGHT_VH: 600,

	// アニメーション補間の滑らかさ
	LERP_FACTOR: 0.1,

	// デバッグモード（開発時にスクロール位置を表示）
	DEBUG_MODE: false,

	// レスポンシブ設定
	MOBILE_BREAKPOINT: 768,
	MOBILE_SCALE_FACTOR: 0.6 // スマホでの最終スケール
} as const;-e 
### FILE: ./src/app/components/pepePush/config/animations.ts

// config/animations.ts

export const ANIMATION_CONFIG = {
	// 基本アニメーション設定
	PRIMARY_ANIMATION: 'PushUp',
	ARMATURE_FADE_IN_DURATION: 0.3,

	// アニメーション速度調整
	ANIMATION_SPEED: {
		PUSH_UP: 1.0,
		IDLE: 0.8,
		TRANSITION: 1.2
	},

	// ループ設定
	LOOP_SETTINGS: {
		PUSH_UP: {
			enabled: true,
			count: Infinity // 無限ループ
		}
	},

	// スクロール位置に応じたアニメーション変更（将来の拡張用）
	SCROLL_BASED_ANIMATIONS: {
		0: { animation: 'PushUp', speed: 0.5 },
		0.25: { animation: 'PushUp', speed: 1.0 },
		0.5: { animation: 'PushUp', speed: 1.5 },
		0.75: { animation: 'PushUp', speed: 1.2 },
		1: { animation: 'PushUp', speed: 0.8 }
	},

	// パフォーマンス設定
	PERFORMANCE: {
		// フレームレート制限（必要に応じて）
		MAX_FPS: 60,

		// LOD設定（距離に応じた詳細度）
		LOD_DISTANCES: [10, 50, 100],

		// アニメーション品質
		ANIMATION_QUALITY: {
			HIGH: { timeScale: 1.0, precision: 'high' },
			MEDIUM: { timeScale: 0.8, precision: 'medium' },
			LOW: { timeScale: 0.5, precision: 'low' }
		}
	}
} as const;

// アニメーション状態の型定義
export type AnimationState = {
	currentAnimation: string;
	speed: number;
	isPlaying: boolean;
	loopCount: number;
};

// アニメーション制御のヘルパー関数
export const getAnimationForScrollProgress = (progress: number) => {
	const scrollAnimations = ANIMATION_CONFIG.SCROLL_BASED_ANIMATIONS;
	const keys = Object.keys(scrollAnimations).map(Number).sort((a, b) => a - b);

	let targetKey = keys[0];
	for (const key of keys) {
		if (progress >= key) {
			targetKey = key;
		} else {
			break;
		}
	}

	return scrollAnimations[targetKey as keyof typeof scrollAnimations];
};-e 
### FILE: ./src/app/components/pepePush/StickyCanvas.tsx

// StickyCanvas.tsx
'use client';

import React from 'react';
import { Canvas } from '@react-three/fiber';
import { StickyCanvasProps } from './types';

export default function StickyCanvas({ children, className = '' }: StickyCanvasProps) {
	return (
		<div className={`sticky top-0 w-full h-screen z-10 ${className}`}>
			<Canvas
				className="w-full h-full"
				gl={{ antialias: false }}
				shadows={false}
				frameloop="always"
				camera={{
					position: [0, 0, 5],
					fov: 75,
					near: 0.1,
					far: 1000
				}}
				dpr={1}
			>
				{/* @ts-expect-error React Three Fiber JSX elements */}
				<ambientLight intensity={0.3} />
				{/* @ts-expect-error React Three Fiber JSX elements */}
				<directionalLight
					position={[5, 10, 7]}
					intensity={1}
					castShadow={false}
				/>

				{/* 子コンポーネント（3Dモデルなど）を描画 */}
				{children}
			</Canvas>
		</div>
	);
}-e 
### FILE: ./src/app/components/pepePush/hooks/useScrollProgress.ts

// hooks/useScrollProgress.ts
'use client';

import React,{ useState, useEffect, useRef, useCallback } from 'react';
import { ScrollState } from '../types';
import { CONFIG } from '../config/controlPoints';

export function useScrollProgress() {
  const [scrollState, setScrollState] = useState<ScrollState>({
    scrollProgress: 0,
    isInSection: false
  });
  
  const sectionRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<number>(null);

  const updateScrollProgress = useCallback(() => {
    if (!sectionRef.current) return;

    const rect = sectionRef.current.getBoundingClientRect();
    const windowHeight = window.innerHeight;
    const sectionHeight = rect.height;
    
    // セクションが画面に入っているかチェック
    const isInView = rect.top < windowHeight && rect.bottom > 0;
    
    if (!isInView) {
      setScrollState(prev => ({ ...prev, isInSection: false }));
      return;
    }

    // スクロール進行度を計算（0-1の範囲）
    const scrollTop = -rect.top;
    const maxScroll = sectionHeight - windowHeight;
    const progress = Math.max(0, Math.min(1, scrollTop / maxScroll));

    setScrollState({
      scrollProgress: progress,
      isInSection: true
    });

    if (CONFIG.DEBUG_MODE) {
      console.log('Scroll Progress:', progress.toFixed(3));
    }
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
      
      frameRef.current = requestAnimationFrame(updateScrollProgress);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // 初期化

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [updateScrollProgress]);

  return { scrollState, sectionRef };
}-e 
### FILE: ./src/app/components/pepePush/hooks/useModelPosition.ts

// hooks/useModelPosition.ts
'use client';

import { useMemo } from 'react';
import { ModelTransform } from '../types';
import { getResponsiveControlPoints } from '../config/controlPoints';

export function useModelPosition(scrollProgress: number): ModelTransform {
	return useMemo(() => {
		// レスポンシブ対応の制御点を取得
		const controlPoints = getResponsiveControlPoints();

		// スクロール進行度が0-1の範囲外の場合の処理
		if (scrollProgress <= 0) {
			const firstPoint = controlPoints[0];
			return {
				position: firstPoint.position,
				rotation: firstPoint.rotation || [0, 0, 0],
				scale: firstPoint.scale || [1, 1, 1]
			};
		}

		if (scrollProgress >= 1) {
			const lastPoint = controlPoints[controlPoints.length - 1];
			return {
				position: lastPoint.position,
				rotation: lastPoint.rotation || [0, 0, 0],
				scale: lastPoint.scale || [1, 1, 1]
			};
		}

		// 現在のスクロール位置に対応する制御点のペアを見つける
		let fromIndex = 0;
		let toIndex = 1;

		for (let i = 0; i < controlPoints.length - 1; i++) {
			if (scrollProgress >= controlPoints[i].scrollProgress &&
				scrollProgress <= controlPoints[i + 1].scrollProgress) {
				fromIndex = i;
				toIndex = i + 1;
				break;
			}
		}

		const fromPoint = controlPoints[fromIndex];
		const toPoint = controlPoints[toIndex];

		// 2つの制御点間での進行度を計算
		const segmentProgress = (scrollProgress - fromPoint.scrollProgress) /
			(toPoint.scrollProgress - fromPoint.scrollProgress);

		// 線形補間
		const lerp = (start: number, end: number, factor: number) =>
			start + (end - start) * factor;

		const lerpArray = (start: number[], end: number[], factor: number): [number, number, number] => [
			lerp(start[0], end[0], factor),
			lerp(start[1], end[1], factor),
			lerp(start[2], end[2], factor)
		];

		return {
			position: lerpArray(
				fromPoint.position,
				toPoint.position,
				segmentProgress
			),
			rotation: lerpArray(
				fromPoint.rotation || [0, 0, 0],
				toPoint.rotation || [0, 0, 0],
				segmentProgress
			),
			scale: lerpArray(
				fromPoint.scale || [1, 1, 1],
				toPoint.scale || [1, 1, 1],
				segmentProgress
			)
		};
	}, [scrollProgress]);
}-e 
### FILE: ./src/app/components/pepePush/PepeModel3D.tsx

// PepeModel3D.tsx
'use client';

import React, { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF, useAnimations } from '@react-three/drei';
import * as THREE from 'three';
import { ModelTransform } from './types';
import { CONFIG } from './config/controlPoints';

interface PepeModel3DProps {
	transform: ModelTransform;
	url?: string;
}

export default function PepeModel3D({
	transform,
	url = `${process.env.NEXT_PUBLIC_CLOUDFRONT_URL}/pepe/push-up-pepe.glb`
}: PepeModel3DProps) {
	const { scene, animations } = useGLTF(url);
	const { actions, mixer } = useAnimations(animations, scene);
	const groupRef = useRef<THREE.Group>(null);

	// 現在の変換値を保持（スムーズな補間のため）
	const currentTransform = useRef<ModelTransform>({
		position: [0, 0, 0],
		rotation: [0, 0, 0],
		scale: [1, 1, 1]
	});

	// マテリアルとアニメーション初期化
	useEffect(() => {
		// 色管理を有効化
		THREE.ColorManagement.enabled = true;

		// 重ねられた2つのテキストオブジェクトの発光マテリアル設定
		scene.traverse((child) => {
			if (child instanceof THREE.Mesh && child.material) {
				const materials = Array.isArray(child.material) ? child.material : [child.material];

				materials.forEach((material) => {
					if (material instanceof THREE.MeshStandardMaterial) {
						// Text.001 (緑色発光)
						if (child.name === 'Text.001') {
							material.emissive = new THREE.Color(0x00ff00); // 緑色
							material.emissiveIntensity = 3.0;
							material.toneMapped = false; // 重要：色変換を防止
							// 少し前に配置
							child.position.z += 0.01;
							console.log('Applied green emissive to Text.001');
						}

						// Text.004 (オレンジ色発光)
						else if (child.name === 'Text.004') {
							material.emissive = new THREE.Color(0xff4500); // オレンジ色
							material.emissiveIntensity = 3.0;
							material.toneMapped = false; // 重要：色変換を防止
							// 少し後ろに配置
							child.position.z -= 0.01;
							console.log('Applied orange emissive to Text.004');
						}

						// その他のオブジェクトは既存のマテリアル設定を保持
						else if (material.emissive && !material.emissive.equals(new THREE.Color(0x000000))) {
							material.toneMapped = false; // 他の発光オブジェクトも色変換を防止
							if (material.emissiveIntensity === undefined || material.emissiveIntensity === 0) {
								material.emissiveIntensity = 1;
							}
						}
					}
				});
			}
		});

		// 既存のアニメーションを停止
		Object.values(actions).forEach((action) => action?.stop());

		// PushUpアニメーションを再生
		if (actions['PushUp']) {
			actions['PushUp'].reset().play();
		}

		// Armatureアニメーションがあれば再生
		const bodyKey = Object.keys(actions).find((key) =>
			key.includes('Armature')
		);
		if (bodyKey && actions[bodyKey]) {
			actions[bodyKey].reset().fadeIn(0.3).play();
		}
	}, [actions, scene]);

	// フレームごとの更新
	useFrame((_, delta) => {
		// アニメーションミキサーを更新
		mixer.update(delta);

		// スムーズな位置変更（線形補間）
		if (groupRef.current) {
			const group = groupRef.current;
			const lerpFactor = CONFIG.LERP_FACTOR;

			// 位置の補間
			const targetPos = new THREE.Vector3(...transform.position);
			group.position.lerp(targetPos, lerpFactor);

			// 回転の補間
			const targetRot = new THREE.Euler(...transform.rotation);
			group.rotation.x += (targetRot.x - group.rotation.x) * lerpFactor;
			group.rotation.y += (targetRot.y - group.rotation.y) * lerpFactor;
			group.rotation.z += (targetRot.z - group.rotation.z) * lerpFactor;

			// スケールの補間
			const targetScale = new THREE.Vector3(...transform.scale);
			group.scale.lerp(targetScale, lerpFactor);

			// デバッグ情報
			if (CONFIG.DEBUG_MODE) {
				currentTransform.current = {
					position: [group.position.x, group.position.y, group.position.z],
					rotation: [group.rotation.x, group.rotation.y, group.rotation.z],
					scale: [group.scale.x, group.scale.y, group.scale.z]
				};
			}
		}
	});

	// glTFファイルのマテリアルをそのまま適用
	return (
		// @ts-expect-error React Three Fiber JSX elements
		<group ref={groupRef}>
			{/* @ts-expect-error React Three Fiber JSX elements */}
			<primitive object={scene} />
			{/* @ts-expect-error React Three Fiber JSX elements */}
		</group>
	);
}

// モデルのプリロード
useGLTF.preload(`${process.env.NEXT_PUBLIC_CLOUDFRONT_URL}/pepe/push-up-pepe.glb`);-e 
### FILE: ./src/app/components/pepePush/PepePush.tsx

// components/PepePush.tsx
// PepePush.tsx
'use client';

import React from 'react';
import ScrollController from './ScrollController';
import { PepePushProps } from './types';

export default function PepePush({ className = '' }: PepePushProps) {
	return (
		<section className={`relative w-full ${className}`}>
			<ScrollController className="bg-black" />
		</section>
	);
}
/*
'use client';

import React, { useEffect, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, useAnimations, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

export default function PepePush() {
	return (
		<Canvas
			className="w-full h-full"
			gl={{ antialias: false }}
			dpr={1}
			shadows={false}
			frameloop="always"
		>
			<ambientLight intensity={0.3} />
			<directionalLight position={[5, 10, 7]} intensity={1} />
			<Suspense fallback={null}>
				<PepeModel url="/models/push-up-pepe.glb" />
			</Suspense>
			<OrbitControls />
		</Canvas>
	);
}

function PepeModel({ url }: { url: string }) {
	const { scene, animations } = useGLTF(url);
	const { actions, mixer } = useAnimations(animations, scene);

	// アニメーション再生
	useEffect(() => {
		Object.values(actions).forEach((a) => a.stop());
		actions['PushUp']?.reset().play();
		const bodyKey = Object.keys(actions).find((k) => k.includes('Armature'));
		if (bodyKey) {
			actions[bodyKey]?.reset().fadeIn(0.3).play();
		}
	}, [actions]);

	// 毎フレーム、ミキサーを更新
	useFrame((_, dt) => {
		mixer.update(dt);
	});

	// glTF に含まれるマテリアルを一切触らずそのまま適用
	return <primitive object={scene} />;
}

// モデルのプリロード
useGLTF.preload('/models/push-up-pepe.glb');
*/
-e 
### FILE: ./src/app/components/pepePush/ScrollController.tsx

// ScrollController.tsx
'use client';

import React, { Suspense } from 'react';
import StickyCanvas from './StickyCanvas';
import PepeModel3D from './PepeModel3D';
import { useScrollProgress } from './hooks/useScrollProgress';
import { useModelPosition } from './hooks/useModelPosition';
import { CONFIG } from './config/controlPoints';

interface ScrollControllerProps {
	className?: string;
}

export default function ScrollController({ className = '' }: ScrollControllerProps) {
	const { scrollState, sectionRef } = useScrollProgress();
	const modelTransform = useModelPosition(scrollState.scrollProgress);

	return (
		<div
			ref={sectionRef}
			className={`relative w-full ${className}`}
			style={{ height: `${CONFIG.SECTION_HEIGHT_VH}vh` }}
		>
			{/* Sticky Canvas */}
			<StickyCanvas>
				<Suspense fallback={null}>
					<PepeModel3D transform={modelTransform} />
				</Suspense>
			</StickyCanvas>

			{/* デバッグ情報表示（開発時のみ） */}
			{CONFIG.DEBUG_MODE && scrollState.isInSection && (
				<div className="fixed top-4 right-4 bg-black/80 text-white p-4 rounded-lg font-mono text-sm z-50">
					<div>Progress: {scrollState.scrollProgress.toFixed(3)}</div>
					<div>Position: [{modelTransform.position.map(v => v.toFixed(2)).join(', ')}]</div>
					<div>Rotation: [{modelTransform.rotation.map(v => v.toFixed(2)).join(', ')}]</div>
					<div>Scale: [{modelTransform.scale.map(v => v.toFixed(2)).join(', ')}]</div>
				</div>
			)}

			{/* スクロール進行を示すインジケーター（オプション） */}
			{scrollState.isInSection && (
				<div className="fixed top-8 left-1/2 transform -translate-x-1/2 z-40">
					<div className="w-64 h-2 bg-white/20 rounded-full overflow-hidden">
						<div
							className="h-full bg-white/80 rounded-full transition-all duration-100"
							style={{ width: `${scrollState.scrollProgress * 100}%` }}
						/>
					</div>
					<div className="text-center text-white/60 text-xs mt-2">
						Training Progress
					</div>
				</div>
			)}
		</div>
	);
}-e 
### FILE: ./src/app/components/pepe3d/types.d.ts

// types.d.ts
type GlitchEffectType = 'rgb' | 'slice' | 'wave' | 'pulse' | 'jitter' | 'none';

interface MessageConfig {
	id: string;
	text: string;
	top?: string;
	left?: string;
	width?: string;
	fontSize?: string;
	glitchEffect?: GlitchEffectType;
	keywords?: string[];  // 特別強調するキーワード
	delay?: number;       // 表示遅延
}

interface CyberInterfaceProps {
	scrollProgress: number; // 0から1の間の値
	activeIndex: number | null;
	totalSections: number;
}

// ハイライト用のテキスト処理関連
interface TextFragment {
	text: string;
	isKeyword: boolean;
	keywordType?: string;
}-e 
### FILE: ./src/app/components/pepe3d/types/messageTypes.ts

// pepe3d/types/messageTypes.ts

export type GlitchEffectType = 'rgb' | 'slice' | 'wave' | 'pulse' | 'jitter' | 'none';

export interface MessageConfig {
  id: string;
  text: string;
  top?: string;
  left?: string;
  width?: string;
  fontSize?: string;
  glitchEffect?: GlitchEffectType;
  keywords?: string[];
  delay?: number;
}

export interface MessageControlPoint {
  scrollProgress: number; // 0-1の範囲
  message: MessageConfig;
  visibility: number; // 0-1の透明度
  animations?: GlitchEffectType[]; // 適用するアニメーション
  fadeInDuration?: number; // フェードイン時間（ms）
  fadeOutDuration?: number; // フェードアウト時間（ms）
}

export interface ScrollMessageState {
  scrollProgress: number;
  activeMessageIndex: number | null;
  visibleMessages: {
    index: number;
    opacity: number;
    isActive: boolean;
  }[];
}

// 修正：実際の実装に合わせて型を統一
export interface MessageVisibilityHookResult {
  activeMessages: {
    config: MessageControlPoint;  // MessageConfigではなくMessageControlPoint
    opacity: number;
    isActive: boolean;
  }[];
  scrollProgress: number;
  debugInfo?: {
    scrollProgress: number;
    currentPointIndex: number;
    nextPointIndex: number;
    totalPoints: number;
    activeMessages: number;
  };
  sectionRef: React.RefObject<HTMLDivElement>;  // オプショナルから必須に変更
}

// レスポンシブ設定
export interface ResponsiveMessageConfig {
  desktop: Partial<MessageConfig>;
  mobile: Partial<MessageConfig>;
}

export interface PepeScrollConfig {
  // セクションの高さ設定
  SECTION_HEIGHT_VH: number;
  
  // スクロール感度
  SCROLL_SENSITIVITY: number;
  
  // デバッグモード
  DEBUG_MODE: boolean;
  
  // レスポンシブ設定
  MOBILE_BREAKPOINT: number;
  
  // アニメーション設定
  DEFAULT_FADE_DURATION: number;
  SMOOTH_FACTOR: number;
}-e 
### FILE: ./src/app/components/pepe3d/ScrollMessage.tsx

// pepe3d/ScrollMessage.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useMessageVisibility } from './hooks/useMessageVisibility';
import { getGlitchClass, ANIMATION_CONFIG } from './config/animationConfig';
import { MessageConfig } from './types/messageTypes';
import { CONFIG } from './config/messageControlPoints';
import styles from './PepeStyles.module.css';

const ScrollMessage: React.FC = () => {
	const { activeMessages, scrollProgress, debugInfo, sectionRef } = useMessageVisibility() as any;
	const [randomGlitch, setRandomGlitch] = useState<boolean>(false);

	// ランダムグリッチエフェクト
	useEffect(() => {
		const interval = setInterval(() => {
			if (Math.random() < ANIMATION_CONFIG.RANDOM_GLITCH.PROBABILITY) {
				setRandomGlitch(true);
				setTimeout(() => setRandomGlitch(false), ANIMATION_CONFIG.RANDOM_GLITCH.DURATION);
			}
		}, 100);

		return () => clearInterval(interval);
	}, []);

	// キーワードを含むテキストをレンダリング
	const renderMessageText = (message: MessageConfig, isActive: boolean) => {
		if (!message.keywords || message.keywords.length === 0) {
			return (
				<span className={getGlitchClass(message.glitchEffect)}>
					{message.text}
				</span>
			);
		}

		// キーワードを検出してハイライト
		const words = message.text.split(' ');
		return words.map((word, wordIndex) => {
			const isKeyword = message.keywords?.some(keyword =>
				keyword.toLowerCase().includes(word.toLowerCase()) ||
				word.toLowerCase().includes(keyword.toLowerCase())
			);

			if (isKeyword) {
				return (
					<span
						key={`word-${wordIndex}`}
						className={`${styles.keywordGlitch} ${getGlitchClass(message.glitchEffect)}`}
						data-text={word}
						style={{
							textShadow: isActive
								? '0 0 12px rgba(0, 255, 102, 0.9)'
								: '0 0 8px rgba(0, 255, 102, 0.7)'
						}}
					>
						{word}{' '}
					</span>
				);
			}

			return (
				<span
					key={`word-${wordIndex}`}
					className={getGlitchClass(message.glitchEffect)}
				>
					{word}{' '}
				</span>
			);
		});
	};

	return (
		<>
			{/* セクションの高さを設定するコンテナ */}
			<div
				ref={sectionRef}
				className="relative w-full"
				style={{ height: `${CONFIG.SECTION_HEIGHT_VH}vh` }}
			>
				{/* アクティブなメッセージを表示 */}
				{activeMessages.map((messageData: any, index: number) => {
					const { config, opacity, isActive } = messageData;
					const message = config.message;

					return (
						<div
							key={message.id}
							className={`fixed z-50 font-pixel text-white pointer-events-none
                ${randomGlitch ? styles.jitter : ''}
                ${isActive ? 'animate-pulse' : ''}
                whitespace-pre-wrap
              `}
							style={{
								top: message.top,
								left: message.left,
								width: message.width,
								fontSize: message.fontSize,
								opacity: opacity,
								textShadow: isActive
									? '0 0 12px rgba(0, 255, 102, 0.9)'
									: '0 0 8px rgba(0, 255, 102, 0.7)',
								transition: ANIMATION_CONFIG.TRANSITIONS.ALL,
								transform: `translateY(${(1 - opacity) * 20}px)`, // 滑らかな出現
							}}
						>
							{renderMessageText(message, isActive)}
						</div>
					);
				})}

				{/* デバッグ情報表示 */}
				{CONFIG.DEBUG_MODE && debugInfo && (
					<div className="fixed top-4 left-4 bg-black/80 text-green-400 p-4 rounded-lg font-mono text-sm z-50">
						<div>Scroll Progress: {debugInfo.scrollProgress.toFixed(3)}</div>
						<div>Current Point: {debugInfo.currentPointIndex}</div>
						<div>Next Point: {debugInfo.nextPointIndex}</div>
						<div>Active Messages: {debugInfo.activeMessages}</div>
						<div>Total Points: {debugInfo.totalPoints}</div>
					</div>
				)}

				{/* サイバーパンク風グリッドバックグラウンド */}
				<div
					className="fixed inset-0 pointer-events-none z-0 opacity-30"
					style={{
						backgroundImage: `
              linear-gradient(rgba(0, 255, 102, 0.05) 1px, transparent 1px), 
              linear-gradient(90deg, rgba(0, 255, 102, 0.05) 1px, transparent 1px)
            `,
						backgroundSize: '20px 20px',
						backgroundPosition: 'center center',
					}}
				/>

			</div>
		</>
	);
};

export default ScrollMessage;-e 
### FILE: ./src/app/components/pepe3d/config/messageControlPoints.ts

// pepe3d/config/messageControlPoints.ts
import { MessageControlPoint, PepeScrollConfig } from '../types/messageTypes';

// スマホ判定のヘルパー関数
const isMobile = () => {
	if (typeof window === 'undefined') return false;
	return window.innerWidth <= 768;
};

// 基本設定
export const CONFIG: PepeScrollConfig = {
	SECTION_HEIGHT_VH: 400, // PepeTopセクションの高さ
	SCROLL_SENSITIVITY: 1.0,
	DEBUG_MODE: false,
	MOBILE_BREAKPOINT: 768,
	DEFAULT_FADE_DURATION: 700,
	SMOOTH_FACTOR: 0.1
};

// レスポンシブ対応のメッセージ制御点
export const getMessageControlPoints = (): MessageControlPoint[] => {
	const mobile = isMobile();

	return [
		{
			scrollProgress: 0.15,
			visibility: 1,
			fadeInDuration: 700,
			fadeOutDuration: 500,
			message: {
				id: 'deep-green-source',
				text: 'The Deep Green Source — a spring hidden within an ancient forest.',
				top: mobile ? '15vh' : '20vh',
				left: mobile ? '5vw' : '10vw',
				width: 'auto',
				fontSize: mobile ? '1.5rem' : '2rem',
				glitchEffect: 'rgb',
				keywords: ['Deep Green Source', 'ancient forest'],
			}
		},
		{
			scrollProgress: 0.35,
			visibility: 1,
			fadeInDuration: 700,
			fadeOutDuration: 500,
			message: {
				id: 'green-source-rich',
				text: 'The Green Source — rich, deep and sweet.',
				top: mobile ? '35vh' : '30vh',
				left: mobile ? '10vw' : '30vw',
				width: 'auto',
				fontSize: mobile ? '1.5rem' : '2rem',
				glitchEffect: 'rgb',
				keywords: ['Green Source'],
			}
		},
		{
			scrollProgress: 0.55,
			visibility: 1,
			fadeInDuration: 700,
			fadeOutDuration: 500,
			message: {
				id: 'fuels-drive',
				text: 'It fuels your drive for what\'s next.',
				top: mobile ? '50vh' : '40vh',
				left: mobile ? '5vw' : '10vw',
				width: 'auto',
				fontSize: mobile ? '1.5rem' : '2rem',
				glitchEffect: 'wave',
				keywords: ['fuels your drive'],
			}
		},
		{
			scrollProgress: 0.8,
			visibility: 1,
			fadeInDuration: 700,
			fadeOutDuration: 500,
			animations: ['pulse'],
			message: {
				id: 'green-power',
				text: 'Feel the green power — right in your hands.',
				top: mobile ? '65vh' : '60vh',
				left: mobile ? '10vw' : '30vw',
				width: 'auto',
				fontSize: mobile ? '1.5rem' : '3rem',
				glitchEffect: 'slice',
				keywords: ['green power'],
			}
		}
	];
};

// スクロール進行度に基づいてアクティブなメッセージを取得
export const getActiveMessages = (scrollProgress: number) => {
	const controlPoints = getMessageControlPoints();
	const activeMessages: Array<{
		config: MessageControlPoint;
		opacity: number;
		isActive: boolean;
	}> = [];

	controlPoints.forEach((point, index) => {
		// 最後のメッセージかどうかを判定
		const isLastMessage = index === controlPoints.length - 1;

		// メッセージの表示範囲を計算
		const showStart = point.scrollProgress - 0.15; // 表示開始（早める）
		const showPeak = point.scrollProgress; // 完全表示

		// 最後のメッセージは早めに終了、他は延長
		const showEnd = isLastMessage
			? point.scrollProgress + 0.15  // 最後のメッセージは通常の長さ
			: point.scrollProgress + 0.25; // 他のメッセージは延長

		let opacity = 0;
		let isActive = false;

		if (scrollProgress >= showStart && scrollProgress <= showEnd) {
			if (scrollProgress <= showPeak) {
				// フェードイン（より滑らかに）
				const fadeInProgress = (scrollProgress - showStart) / (showPeak - showStart);
				opacity = Math.max(0, Math.min(1, fadeInProgress));
			} else {
				// フェードアウト
				const fadeOutProgress = (scrollProgress - showPeak) / (showEnd - showPeak);
				opacity = Math.max(0, Math.min(1, 1 - fadeOutProgress));
			}

			// ピーク付近でアクティブ状態（範囲を拡大）
			isActive = Math.abs(scrollProgress - showPeak) < 0.08;

			if (opacity > 0) {
				activeMessages.push({
					config: point,
					opacity,
					isActive
				});
			}
		}
	});

	return activeMessages;
};

// デバッグ情報を取得
export const getDebugInfo = (scrollProgress: number) => {
	const controlPoints = getMessageControlPoints();
	let currentPointIndex = -1;
	let nextPointIndex = -1;

	for (let i = 0; i < controlPoints.length; i++) {
		if (scrollProgress >= controlPoints[i].scrollProgress) {
			currentPointIndex = i;
		} else {
			nextPointIndex = i;
			break;
		}
	}

	return {
		scrollProgress,
		currentPointIndex,
		nextPointIndex,
		totalPoints: controlPoints.length,
		activeMessages: getActiveMessages(scrollProgress).length
	};
};-e 
### FILE: ./src/app/components/pepe3d/config/animationConfig.ts

// pepe3d/config/animationConfig.ts
import { GlitchEffectType } from '../types/messageTypes';

export const ANIMATION_CONFIG = {
	// 基本的なトランジション設定
	TRANSITIONS: {
		OPACITY: 'opacity 0.7s ease-in-out',
		TRANSFORM: 'transform 0.3s ease-out',
		ALL: 'all 0.5s ease-in-out'
	},

	// グリッチエフェクトの設定
	GLITCH_EFFECTS: {
		rgb: {
			duration: '0.4s',
			intensity: 'normal',
			textShadow: '-2px 0 #ff0000, 2px 0 #00ffff'
		},
		slice: {
			duration: '3s',
			intensity: 'high',
			clipPath: true
		},
		wave: {
			duration: '2s',
			intensity: 'low',
			transform: 'translateY'
		},
		pulse: {
			duration: '1.5s',
			intensity: 'medium',
			scale: 1.05
		},
		jitter: {
			duration: '0.1s',
			intensity: 'high',
			infinite: true
		}
	},

	// ランダムグリッチの設定
	RANDOM_GLITCH: {
		PROBABILITY: 0.01, // 1%の確率
		DURATION: 150, // ms
		EFFECTS: ['jitter', 'rgb'] as GlitchEffectType[]
	},

	// メッセージ固有のアニメーション
	MESSAGE_ANIMATIONS: {
		FADE_IN: {
			from: { opacity: 0, transform: 'translateY(20px)' },
			to: { opacity: 1, transform: 'translateY(0)' },
			duration: 700
		},
		FADE_OUT: {
			from: { opacity: 1, transform: 'translateY(0)' },
			to: { opacity: 0, transform: 'translateY(-10px)' },
			duration: 500
		},
		GLOW_PULSE: {
			textShadow: [
				'0 0 8px rgba(0, 255, 102, 0.7)',
				'0 0 16px rgba(0, 255, 102, 0.9)',
				'0 0 8px rgba(0, 255, 102, 0.7)'
			],
			duration: 2000
		}
	}
} as const;

// グリッチエフェクトのCSSクラスマッピング
export const getGlitchClass = (effect?: GlitchEffectType): string => {
	const classMap = {
		rgb: 'rgbSplit',
		slice: 'sliceGlitch',
		wave: 'waveDistort',
		pulse: 'pulse',
		jitter: 'jitter',
		none: ''
	};

	return effect ? classMap[effect] || '' : '';
};

// キーワードハイライト用のクラス
export const KEYWORD_CLASSES = {
	GLITCH: 'keywordGlitch',
	HIGHLIGHT: 'highlight',
	GLOW: 'glow-effect'
} as const;

// レスポンシブアニメーション設定
export const getResponsiveAnimationConfig = () => {
	const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;

	return {
		SCALE_FACTOR: isMobile ? 0.8 : 1.0,
		ANIMATION_SPEED: isMobile ? 0.8 : 1.0,
		REDUCED_MOTION: isMobile,
		GLITCH_INTENSITY: isMobile ? 'low' : 'normal'
	};
};-e 
### FILE: ./src/app/components/pepe3d/PepeTop.tsx

// pepe3d/PepeTop.tsx
'use client';

import React from 'react';
import PepeModel3D from './PepeModel3D';
import ScrollMessage from './ScrollMessage';

const PepeTop: React.FC = () => {
	return (
		<div className="w-full relative">
			{/* Sticky PepeModel3D - 3Dモデルを背景として固定表示 */}
			<div className="sticky top-0 h-screen w-full overflow-hidden z-10">
				<PepeModel3D
					autoRotate={true}
					enableControls={false}
					rotationSpeed={0.3}
					useDefaultEnvironment={true}
				/>

				{/* 放射状グラデーションオーバーレイ - モデルの上に重ねる */}
				<div
					className="absolute inset-0 z-20 pointer-events-none"
					style={{
						background: `radial-gradient(
              ellipse 100% 50% at center,
              rgba(0, 0, 0, 0.1) 10%,
              rgba(0, 0, 0, 0.4) 50%,
              rgba(0, 0, 0, 0.7) 70%,
              rgba(0, 0, 0, 0.9) 85%,
              rgba(0, 0, 0, 1) 100%
            )`,
					}}
				/>
			</div>

			{/* スクロールメッセージセクション - 改良されたトリガー管理 */}
			<ScrollMessage />

			{/* 最終的なグラデーションオーバーレイ - セクション全体の下部をフェードアウト */}
			<div
				className="absolute bottom-0 left-0 w-full h-32 z-30 pointer-events-none"
				style={{
					background: `linear-gradient(
            to bottom,
            rgba(0, 0, 0, 0) 0%,
            rgba(0, 0, 0, 0.8) 70%,
            rgba(0, 0, 0, 1) 100%
          )`,
				}}
			/>

			{/* サイバーパンク風装飾要素 */}
			<div className="absolute inset-0 z-25 pointer-events-none">
				{/* コーナーマーカー */}
				<div className="absolute top-4 left-4 w-8 h-8 border-l-2 border-t-2 border-green-400 opacity-60" />
				<div className="absolute top-4 right-4 w-8 h-8 border-r-2 border-t-2 border-green-400 opacity-60" />
				<div className="absolute bottom-4 left-4 w-8 h-8 border-l-2 border-b-2 border-green-400 opacity-60" />
				<div className="absolute bottom-4 right-4 w-8 h-8 border-r-2 border-b-2 border-green-400 opacity-60" />

				{/* システムステータス */}
				<div className="absolute bottom-4 left-12 text-green-400 text-xs font-mono opacity-70">
					SYSTEM: PEPE_NEURAL_NETWORK v2.1 | STATUS: ACTIVE
				</div>
			</div>
		</div>
	);
};

export default PepeTop;-e 
### FILE: ./src/app/components/pepe3d/hooks/useMessageVisibility.ts

// pepe3d/hooks/useMessageVisibility.ts
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { MessageVisibilityHookResult } from '../types/messageTypes';
import { getActiveMessages, getDebugInfo, CONFIG } from '../config/messageControlPoints';

export function useMessageVisibility(): MessageVisibilityHookResult {
	const [scrollProgress, setScrollProgress] = useState<number>(0);
	const [isInSection, setIsInSection] = useState<boolean>(false);
	const sectionRef = useRef<HTMLDivElement>(null);
	const frameRef = useRef<number>(null);

	const updateScrollProgress = useCallback(() => {
		if (!sectionRef.current) return;

		const rect = sectionRef.current.getBoundingClientRect();
		const windowHeight = window.innerHeight;
		const sectionHeight = rect.height;

		// セクションが画面に入っているかチェック
		const isInView = rect.top < windowHeight && rect.bottom > 0;
		setIsInSection(isInView);

		if (!isInView) return;

		// スクロール進行度を計算（0-1の範囲）
		const scrollTop = -rect.top;
		const maxScroll = sectionHeight - windowHeight;
		const progress = Math.max(0, Math.min(1, scrollTop / maxScroll));

		setScrollProgress(progress);

		if (CONFIG.DEBUG_MODE) {
			console.log('PepeTop Scroll Progress:', progress.toFixed(3));
		}
	}, []);

	useEffect(() => {
		const handleScroll = () => {
			if (frameRef.current) {
				cancelAnimationFrame(frameRef.current);
			}

			frameRef.current = requestAnimationFrame(updateScrollProgress);
		};

		window.addEventListener('scroll', handleScroll, { passive: true });
		handleScroll(); // 初期化

		return () => {
			window.removeEventListener('scroll', handleScroll);
			if (frameRef.current) {
				cancelAnimationFrame(frameRef.current);
			}
		};
	}, [updateScrollProgress]);

	// アクティブなメッセージを計算
	const activeMessages = getActiveMessages(scrollProgress);

	// デバッグ情報
	const debugInfo = CONFIG.DEBUG_MODE ? getDebugInfo(scrollProgress) : undefined;

	return {
		activeMessages,
		scrollProgress,
		debugInfo,
		// sectionRefを外部から使用できるように公開
		sectionRef
	} as MessageVisibilityHookResult & { sectionRef: React.RefObject<HTMLDivElement> };
}-e 
### FILE: ./src/app/components/pepe3d/PepeModel3D.tsx

'use client';
import React, { useRef, useState, useEffect } from 'react';
import { useGLTF, Environment, PerspectiveCamera, OrbitControls } from '@react-three/drei';
import { useFrame, Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import styles from './PepeStyles.module.css';

// エラーバウンダリーコンポーネント
interface ErrorBoundaryProps {
	children: React.ReactNode;
	fallback: React.ReactNode;
}

interface ErrorBoundaryState {
	hasError: boolean;
	error?: Error;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
	constructor(props: ErrorBoundaryProps) {
		super(props);
		this.state = { hasError: false };
	}

	static getDerivedStateFromError(error: Error) {
		return { hasError: true, error };
	}

	render() {
		if (this.state.hasError) {
			return this.props.fallback;
		}
		return this.props.children;
	}
}

// Pepeモデルコンテナコンポーネント
interface PepeContainerProps {
	autoRotate?: boolean;
	rotationSpeed?: number;
}

const PepeContainer: React.FC<PepeContainerProps> = ({
	autoRotate = true,
	rotationSpeed = 0.3
}) => {
	const groupRef = useRef<THREE.Group>(null);
	const [modelScale, setModelScale] = useState(0.7); // 固定スケール
	const [modelPosition, setModelPosition] = useState([0, -2, 0]); // 初期位置
	const [isLoading, setIsLoading] = useState(true);

	// GLTFモデルの読み込み
	const { scene, animations } = useGLTF(`${process.env.NEXT_PUBLIC_CLOUDFRONT_URL}/pepe/pepe.glb`);

	// モデル情報をログに出力と位置調整
	useEffect(() => {
		if (scene) {
			console.log('Model loaded successfully');
			setIsLoading(false);

			// バウンディングボックスを計算して自動的に位置調整
			const box = new THREE.Box3().setFromObject(scene);
			const size = box.getSize(new THREE.Vector3());
			const center = box.getCenter(new THREE.Vector3());

			console.log('Model size:', size);
			console.log('Model center:', center);

			// モデルのスケールと位置を自動調整（固定スケール）
			if (size.length() > 10) {
				// サイズが大きい場合は適切な固定値に調整
				setModelScale(6 / size.length());
			} else if (size.length() < 2) {
				// サイズが小さすぎる場合は大きめに
				setModelScale(1.2);
			}

			// モデルを画面中央に配置（Y軸方向を調整して上に移動）
			setModelPosition([-center.x, -center.y + 1.0, -center.z]); // Y軸方向に上げる
		}
	}, [scene]);


	// モデルが読み込まれていない場合のローディング表示
	if (isLoading || !scene) {
		return (
			//@ts-expect-error React Three Fiber JSX elements
			<mesh>
				{/* @ts-expect-error React Three Fiber JSX elements */}
				<boxGeometry args={[1, 1, 1]} />
				{/* @ts-expect-error React Three Fiber JSX elements */}
				<meshStandardMaterial color="lime" wireframe />
				{/* @ts-expect-error React Three Fiber JSX elements */}
			</mesh>
		);
	}

	// GLTFモデル表示
	return (
		//@ts-expect-error React Three Fiber JSX elements
		<group
			ref={groupRef}
			scale={[modelScale, modelScale, modelScale]} // 固定スケール
			position={[modelPosition[0], modelPosition[1], modelPosition[2]]}
			rotation={[0, 0, 0]} // 正面向きの初期回転
		>
			{/* @ts-expect-error React Three Fiber JSX elements */}
			<primitive object={scene.clone()} />
			{/* @ts-expect-error React Three Fiber JSX elements */}
		</group>
	);
};

// メインのエクスポートコンポーネント
interface PepeModel3DProps {
	className?: string;
	autoRotate?: boolean;
	enableControls?: boolean; // マウスによる水平回転（Y軸周り）操作を許可するかどうか
	rotationSpeed?: number;
	backgroundImage?: string; // カスタム背景画像のパス
	useDefaultEnvironment?: boolean; // デフォルト環境マップを使用するかどうか
}

const PepeModel3D: React.FC<PepeModel3DProps> = ({
	className = '',
	autoRotate = true,
	enableControls = false,
	rotationSpeed = 0.3,
	backgroundImage = '',
	useDefaultEnvironment = true
}) => {
	const [isClient, setIsClient] = useState(false);
	const [isHdrBackground, setIsHdrBackground] = useState(false);

	// サーバーサイドレンダリング対策
	useEffect(() => {
		setIsClient(true);
		// HDRファイルかどうかを確認
		if (backgroundImage && backgroundImage.toLowerCase().endsWith('.hdr')) {
			setIsHdrBackground(true);
		}
	}, [backgroundImage]);

	if (!isClient) {
		return (
			<div className={`${styles.modelContainer} ${className}`}>
				<div className={styles.loadingIndicator}>
					<div className={styles.loadingSpinner}></div>
					<span>Loading Model...</span>
				</div>
			</div>
		);
	}

	// 背景画像がCSSで設定される場合はスタイルを追加
	const containerStyle = {};

	return (
		<div className={`h-[100vh]`}>
			<div
				className={`${styles.modelContainer} ${className}`}
				style={containerStyle}
			>
				{/* サイバーパンク風の装飾 */}
				<div className={`${styles.decorLine} ${styles.decorLineTop}`}></div>
				<div className={`${styles.decorLine} ${styles.decorLineBottom}`}></div>

				<div className={styles.canvasWrapper}>
					<Canvas
						className="w-full h-full"
						gl={{ antialias: false }}
						dpr={1}
						shadows={false}
						frameloop="demand"
					>

						{/* @ts-expect-error React Three Fiber JSX elements */}
						<ambientLight intensity={0.8} />
						{/* @ts-expect-error React Three Fiber JSX elements */}
						<directionalLight position={[5, 5, 5]} intensity={1.0} castShadow />
						{/* @ts-expect-error React Three Fiber JSX elements */}
						<spotLight position={[-5, 8, -5]} angle={0.15} penumbra={1} intensity={1.5} castShadow />
						{/* @ts-expect-error React Three Fiber JSX elements */}
						<hemisphereLight intensity={0.4} color="#88eeff" groundColor="#553333" />


						{/* Pepeモデル */}
						<PepeContainer autoRotate={autoRotate} rotationSpeed={rotationSpeed} />

						{/* カメラ設定 - 少し下向きにして顔が中心に来るように */}
						<PerspectiveCamera makeDefault position={[0, 1, 4]} fov={45} />

						{/* コントロール設定 - Y軸周りの回転のみ許可（水平方向のみ回転可能） */}
						{enableControls && (
							<OrbitControls
								enableZoom={false}
								enablePan={false}
								enableRotate={true}
								minPolarAngle={Math.PI / 2} // 90度 - 常に赤道面に固定
								maxPolarAngle={Math.PI / 2} // 90度 - 常に赤道面に固定
								dampingFactor={0.05}
								rotateSpeed={0.5}
							/>
						)}
					</Canvas>
				</div>

				{/* 情報オーバーレイ（オプション） */}
				<div className={styles.infoOverlay}>
					MODEL: PEPE-3D v1.0
				</div>
			</div>
		</div>
	);
};

export default PepeModel3D;

// グローバルにモデルをプリロード
useGLTF.preload(`${process.env.NEXT_PUBLIC_CLOUDFRONT_URL}/pepe/pepe.glb`);-e 
### FILE: ./src/app/components/glowing-3d-text/PepeFlavorModel.tsx

'use client';
import { useRef, useEffect, useState } from 'react';
import { useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { MotionValue } from 'framer-motion';
import * as THREE from 'three';

interface PepeFlavorModelProps {
	scrollProgress: MotionValue<number>;
	preserveOriginalMaterials?: boolean; // Blenderのマテリアルをそのまま使用するかどうか
}

const PepeFlavorModel: React.FC<PepeFlavorModelProps> = ({
	scrollProgress,
	preserveOriginalMaterials = true // デフォルトでBlenderのマテリアルを保持
}) => {
	// GLBモデルをロード
	const { scene, nodes, materials } = useGLTF(`${process.env.NEXT_PUBLIC_CLOUDFRONT_URL}/pepe/pepe_flavor.glb`);
	const modelRef = useRef<THREE.Group>(null);

	// 画面サイズの状態管理
	const [isMobile, setIsMobile] = useState(false);

	// 画面サイズの監視
	useEffect(() => {
		const checkMobile = () => {
			setIsMobile(window.innerWidth <= 768); // 768px以下をモバイルと判定
		};

		// 初期チェック
		checkMobile();

		// リサイズイベントリスナーを追加
		window.addEventListener('resize', checkMobile);

		// クリーンアップ
		return () => window.removeEventListener('resize', checkMobile);
	}, []);

	// モデルの初期設定
	useEffect(() => {
		if (!scene) return;

		console.log("Loading Pepe Flavor model with materials:", materials);

		// 色管理を有効化 - これは常に有効にするとよい
		THREE.ColorManagement.enabled = true;

		// Blenderから読み込んだマテリアルを処理
		scene.traverse((object) => {
			if (object instanceof THREE.Mesh && object.material) {
				console.log(`Found mesh: ${object.name} with material:`, object.material);

				if (preserveOriginalMaterials) {
					// オリジナルのマテリアルを保持しつつ、設定を最適化
					if (object.material instanceof THREE.Material) {

						// トーンマッピングを無効化して色変換を防止
						object.material.toneMapped = false;

						// メタリック・反射設定を微調整（必要に応じて）
						if ('metalness' in object.material) object.material.metalness = 0.8;
						if ('roughness' in object.material) object.material.roughness = 0.2;

						console.log(`Enhanced original material for ${object.name}`);
					}
				} else {
					// オリジナルの色を保持
					const originalColor = object.material.color ? object.material.color.clone() : new THREE.Color("#00ff9f");

					// マテリアルをカスタムシェーダーマテリアルに置き換え
					const material = new THREE.MeshPhysicalMaterial({
						color: originalColor, // オリジナルの色を使用
						emissive: originalColor.clone(),
						emissiveIntensity: 1.2,
						metalness: 0.7,
						roughness: 0.2,
						clearcoat: 0.5,
						clearcoatRoughness: 0.2,
						transmission: 0.2,
						thickness: 0.5,
						toneMapped: false,
					});

					// オリジナルマテリアルから必要なプロパティをコピー
					if (object.material.map) material.map = object.material.map;
					if (object.material.normalMap) material.normalMap = object.material.normalMap;

					// マテリアルを置き換え
					object.material = material;
				}
			}
		});
	}, [scene, preserveOriginalMaterials]);

	const INITIAL_Y = Math.PI / 4;

	// スクロール位置に応じたアニメーション
	useFrame((state, delta) => {
		if (!modelRef.current) return;

		// 現在のスクロール位置を取得
		const progress = scrollProgress.get();

		modelRef.current.rotation.y = THREE.MathUtils.lerp(
			modelRef.current.rotation.y,
			Math.sin(state.clock.elapsedTime * 0.1) * 0.1 - progress * Math.PI * 0.1,
			0.05
		);

		// わずかな浮遊アニメーション
		modelRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.05;

		// スクロールに応じたZ位置の調整
		modelRef.current.position.z = THREE.MathUtils.lerp(
			modelRef.current.position.z,
			-2 + progress * 5, // 奥から手前に移動
			0.05
		);
	});

	return (
		// @ts-expect-error React Three Fiber JSX elements
		<primitive
			ref={modelRef}
			object={scene}
			scale={0.9}
			position={[0, 0, 0]}
			rotation={[0, 0, 0]}
		/>
	);
};

// モデルの事前ロード
useGLTF.preload(`${process.env.NEXT_PUBLIC_CLOUDFRONT_URL}/pepe/pepe_flavor.glb`);

export default PepeFlavorModel;-e 
### FILE: ./src/app/components/glowing-3d-text/GlowingTextScene.tsx

import { Canvas } from '@react-three/fiber';
import { Suspense } from 'react';
import { MotionValue } from 'framer-motion';
import { PerspectiveCamera } from '@react-three/drei';
import PepeFlavorModel from './PepeFlavorModel';

interface GlowingTextSceneProps {
	scrollProgress: MotionValue<number>;
}

const GlowingTextScene: React.FC<GlowingTextSceneProps> = ({
	scrollProgress
}) => {
	return (
		<Canvas
			className="w-full h-full"
			gl={{ antialias: false }}
			dpr={1}
			shadows={false}
			frameloop="always"
		>
			<PerspectiveCamera makeDefault position={[0, 0, 5]} fov={20} />
			<Suspense fallback={null}>
				<PepeFlavorModel scrollProgress={scrollProgress} />
			</Suspense>
		</Canvas>
	);
};

export default GlowingTextScene;-e 
### FILE: ./src/app/components/glowing-3d-text/HeroModel.tsx

// src/app/components/hero-section/HeroModel.tsx
import React from 'react';
import ProteinModel from './ProteinModel';

interface HeroModelProps {
	style?: React.CSSProperties;
	scale?: number;
}

export const HeroModel: React.FC<HeroModelProps> = ({
	style,
	scale = 1.2
}) => {
	return (
		<ProteinModel
			autoRotate={true}
			scale={scale}
		/>
	);
};

export default HeroModel;-e 
### FILE: ./src/app/components/glowing-3d-text/ProteinModel.tsx

// src/app/components/3d/ProteinModel.tsx
'use client';
import React, { useRef, useState, useEffect } from 'react';
import { useGLTF, Environment, OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { useFrame, Canvas } from '@react-three/fiber';
import * as THREE from 'three';

// エラーバウンダリーコンポーネント
interface ErrorBoundaryProps {
	children: React.ReactNode;
	fallback: React.ReactNode;
}
interface ErrorBoundaryState {
	hasError: boolean;
}
class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
	constructor(props: ErrorBoundaryProps) {
		super(props);
		this.state = { hasError: false };
	}
	static getDerivedStateFromError(error: any) {
		return { hasError: true };
	}
	render() {
		if (this.state.hasError) {
			return this.props.fallback;
		}
		return this.props.children;
	}
}

// プロテインモデルコンテナ
interface ProteinContainerProps {
	autoRotate?: boolean;
	scale?: number;
	rotationSpeed?: number;
}
const ProteinContainer: React.FC<ProteinContainerProps> = ({ autoRotate = true, scale = 1, rotationSpeed = 0.5 }) => {
	const groupRef = useRef<THREE.Group>(null);
	const { scene } = useGLTF(`${process.env.NEXT_PUBLIC_CLOUDFRONT_URL}/pepe/protein_powder.glb`);

	useFrame((_, delta) => {
		if (autoRotate && groupRef.current) {
			groupRef.current.rotation.y += delta * rotationSpeed;
		}
	});

	if (!scene) {
		return (
			//@ts-expect-error React Three Fiber JSX elements
			<mesh>
				{/* @ts-expect-error React Three Fiber JSX elements */}
				<boxGeometry args={[1, 1, 1]} />
				{/* @ts-expect-error React Three Fiber JSX elements */}
				<meshBasicMaterial color="hotpink" />
				{/* @ts-expect-error React Three Fiber JSX elements */}
			</mesh>
		);
	}

	return (
		//@ts-expect-error React Three Fiber JSX elements
		<group
			ref={groupRef}
			scale={[scale, scale, scale]}
			position={[0, -0.5, 0]}
			rotation={[0, Math.PI * 0.25, 0]}
		>
			{/* @ts-expect-error React Three Fiber JSX elements */}
			<primitive object={scene.clone()} />
			{/* @ts-expect-error React Three Fiber JSX elements */}
		</group>
	);
};

// メインコンポーネント
interface ProteinModelProps extends ProteinContainerProps {
	className?: string;
}
const ProteinModel: React.FC<ProteinModelProps> = ({ className = '', autoRotate = true, scale = 1, rotationSpeed = 0.5 }) => {
	// モバイル判定
	const [isMobile, setIsMobile] = useState(false);
	useEffect(() => {
		const check = () => setIsMobile(window.innerWidth <= 768);
		check();
		window.addEventListener('resize', check);
		return () => window.removeEventListener('resize', check);
	}, []);

	return (
		<div className={`w-full h-full ${className}`}>
			<Canvas
				gl={{ antialias: false }}
				dpr={1}
				shadows={false}
				frameloop="always"
				style={{ touchAction: 'pan-y' }}
			>
				<ErrorBoundary fallback={<div className="text-center p-4">エラー: 3Dモデルの読み込みに失敗しました</div>}>
					<ProteinContainer autoRotate={autoRotate} scale={scale} rotationSpeed={rotationSpeed} />
				</ErrorBoundary>

				<Environment preset="city" />
				<PerspectiveCamera makeDefault position={[0, 0, 3]} fov={40} />

				{/* モバイルでは触れないよう完全シャットダウン、PC のみ水平回転許可 */}
				{!isMobile && (
					<OrbitControls
						enableZoom={false}
						enablePan={false}
						enableRotate={true}
						// Y軸水平回転全域
						minAzimuthAngle={-Infinity}
						maxAzimuthAngle={Infinity}
						// X軸固定
						minPolarAngle={Math.PI / 2.6}
						maxPolarAngle={Math.PI / 2.6}
						makeDefault
					/>
				)}
			</Canvas>
		</div>
	);
};

export default ProteinModel;

// モデルプリロード
if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_CLOUDFRONT_URL) {
	useGLTF.preload(`${process.env.NEXT_PUBLIC_CLOUDFRONT_URL}/pepe/protein_powder.glb`);
}
-e 
### FILE: ./src/app/components/glowing-3d-text/GlowingTextSection.tsx

"use client";
import { useRef } from 'react';
import { useScroll } from 'framer-motion';
import GlowingTextScene from './GlowingTextScene';
import { motion } from 'framer-motion';
import HeroModel from './HeroModel';
const GlowingTextSection = () => {
	const sectionRef = useRef<HTMLDivElement>(null);

	// スクロール位置の検出
	const { scrollYProgress } = useScroll({
		target: sectionRef as React.RefObject<HTMLElement>,
		offset: ["start end", "end start"]
	});

	return (
		<section
			ref={sectionRef}
			className="relative w-full overflow-hidden bg-black flex flex-col items-center justify-center"
		>
			<motion.div
				initial={{ opacity: 0, y: -10 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ delay: 0.5, duration: 0.8, repeat: Infinity, repeatType: "reverse" }}
			>
				<div className="text-xl text-center mb-2 mt-5">↓</div>
				<div className="text-sm font-mono">SCROLL DOWN</div>
			</motion.div>


			<div className="flex w-full justify-center mt-40">
				<div className="relative w-full h-[110px] md:w-[800px] md:h-[150px] lg:w-[1200px] lg:h-[200px] pointer-events-auto">
					<GlowingTextScene scrollProgress={scrollYProgress} />
				</div>
			</div>
			<div className="flex w-full justify-center">
				<div className="w-[300px] h-[400px] md:w-[400px] md:h-[500px] lg:w-[500px] lg:h-[600px] pointer-events-auto">
					<HeroModel scale={1.2} />
				</div>
			</div>
			<p className="text-center w-full text-white">
				Not just protein. It’s a story of courage and humor - encrypted in every scoop.
			</p>
			<div className="text-xs mt-8 w-full max-w-sm px-4">
				<table className="w-full table-auto border-collapse border border-white text-white">
					<tbody>
						<tr>
							<td className="border border-white px-2 py-1 text-center">Nutritional Profile</td>
							<td className="border border-white px-2 py-1 text-left"> per 50g</td>
						</tr>
						<tr>
							<td className="border border-white px-2 py-1 text-center">Protein</td>
							<td className="border border-white px-2 py-1 text-left">25 g</td>
						</tr>
						<tr>
							<td className="border border-white px-2 py-1 text-center">Fat</td>
							<td className="border border-white px-2 py-1 text-left">1.5 g</td>
						</tr>
						<tr>
							<td className="border border-white px-2 py-1 text-center">Carbs</td>
							<td className="border border-white px-2 py-1 text-left">2 g</td>
						</tr>
						<tr>
							<td className="border border-white px-2 py-1 text-center">Minerals</td>
							<td className="border border-white px-2 py-1 text-left">1 g</td>
						</tr>
						<tr>
							<td className="border border-white px-2 py-1 text-center">allergen</td>
							<td className="border border-white px-2 py-1 text-left">Milk</td>
						</tr>
					</tbody>
				</table>
			</div>


		</section>
	);
};

export default GlowingTextSection;-e 
### FILE: ./src/app/components/glowing-3d-text/LightingSetup.tsx

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const LightingSetup = () => {
  // ライトの参照を保持
  const spotLightRef = useRef<THREE.SpotLight>(null);
  const pointLightRef = useRef<THREE.PointLight>(null);
  
  // ライトのアニメーション
  useFrame(({ clock }) => {
    const time = clock.getElapsedTime();
    
    // スポットライトの位置を微妙に変化
    if (spotLightRef.current) {
      spotLightRef.current.position.x = Math.sin(time * 0.3) * 3;
      spotLightRef.current.position.z = Math.cos(time * 0.2) * 3;
    }
    
    // ポイントライトの強度を変化（パルス効果）
    if (pointLightRef.current) {
      pointLightRef.current.intensity = 1 + Math.sin(time * 2) * 0.3;
    }
  });
  
  return (
    <>
      {/* 環境光 - 暗めの基本照明 */}

      
      {/* メインのスポットライト - テキストを照らす */}
    </>
  );
};

export default LightingSetup;-e 
### FILE: ./src/app/components/floating-images-fix/constants.ts

// src/app/components/floating-images-fix/constants.ts

export type ImageSize = 'L' | 'M' | 'S';

export interface ImageFile {
  id: number;
  filename: string;
  size: ImageSize;
  path: string;
}

// CDNパス
const CDN_URL = process.env.NEXT_PUBLIC_CLOUDFRONT_URL || "";

// 画面サイズ判定（768px以下をモバイルとする）
const isMobile = () => {
  if (typeof window === 'undefined') return false;
  return window.innerWidth <= 768;
};

// 画像パスを生成する関数
const generateImagePath = (filename: string): string => {
  const folder = isMobile() ? 'gallery-small' : 'pepe';
  return `${CDN_URL}/${folder}/${filename}`;
};

// 画像ファイルリスト
export const imageFiles: ImageFile[] = [
  { id: 1, filename: '1L.webp', size: 'L', path: generateImagePath('1L.webp') },
  { id: 2, filename: '2M.webp', size: 'M', path: generateImagePath('2M.webp') },
  { id: 3, filename: '3S.webp', size: 'S', path: generateImagePath('3S.webp') },
  { id: 4, filename: '4S.webp', size: 'S', path: generateImagePath('4S.webp') },
  { id: 5, filename: '5M.webp', size: 'M', path: generateImagePath('5M.webp') },
  { id: 6, filename: '6L.webp', size: 'L', path: generateImagePath('6L.webp') },
  { id: 7, filename: '7M.webp', size: 'M', path: generateImagePath('7M.webp') },
  { id: 8, filename: '8M.webp', size: 'M', path: generateImagePath('8M.webp') },
  { id: 9, filename: '9L.webp', size: 'L', path: generateImagePath('9L.webp') },
  { id: 10, filename: '10S.webp', size: 'S', path: generateImagePath('10S.webp') },
  { id: 11, filename: '11S.webp', size: 'S', path: generateImagePath('11S.webp') },
  { id: 12, filename: '12M.webp', size: 'M', path: generateImagePath('12M.webp') },
  { id: 13, filename: '13L.webp', size: 'L', path: generateImagePath('13L.webp') },
  { id: 14, filename: '14L.webp', size: 'L', path: generateImagePath('14L.webp') },
  { id: 15, filename: '15M.webp', size: 'M', path: generateImagePath('15M.webp') },
  { id: 16, filename: '16S.webp', size: 'S', path: generateImagePath('16S.webp') },
  { id: 17, filename: '17S.webp', size: 'S', path: generateImagePath('17S.webp') },
  { id: 18, filename: '18M.webp', size: 'M', path: generateImagePath('18M.webp') },
  { id: 19, filename: '19L.webp', size: 'L', path: generateImagePath('19L.webp') },
  { id: 20, filename: '20L.webp', size: 'L', path: generateImagePath('20L.webp') },
  { id: 21, filename: '21S.webp', size: 'S', path: generateImagePath('21S.webp') },
  { id: 22, filename: '22S.webp', size: 'S', path: generateImagePath('22S.webp') },
  { id: 23, filename: '23L.webp', size: 'L', path: generateImagePath('23L.webp') },
  { id: 24, filename: '24L.webp', size: 'L', path: generateImagePath('24L.webp') },
  { id: 25, filename: '25S.webp', size: 'S', path: generateImagePath('25S.webp') },
  { id: 26, filename: '26S.webp', size: 'S', path: generateImagePath('26S.webp') },
  { id: 27, filename: '27S.webp', size: 'S', path: generateImagePath('27S.webp') },
  { id: 28, filename: '28L.webp', size: 'L', path: generateImagePath('28L.webp') },
  { id: 29, filename: '29S.webp', size: 'S', path: generateImagePath('29S.webp') },
  { id: 30, filename: '30S.webp', size: 'S', path: generateImagePath('30S.webp') },
  { id: 31, filename: '31M.webp', size: 'M', path: generateImagePath('31M.webp') },
  { id: 32, filename: '32M.webp', size: 'M', path: generateImagePath('32M.webp') },
  { id: 33, filename: '33M.webp', size: 'M', path: generateImagePath('33M.webp') },
  { id: 34, filename: '34S.webp', size: 'S', path: generateImagePath('34S.webp') },
  { id: 35, filename: '35L.webp', size: 'L', path: generateImagePath('35L.webp') },
];

// サイズに応じたスケール（デスクトップ用）
const DESKTOP_SCALE_MAP: Record<ImageSize, number> = {
  L: 4,
  M: 3,
  S: 2,
};

// サイズに応じたスケール（モバイル用）
const MOBILE_SCALE_MAP: Record<ImageSize, number> = {
  L: 2.5,
  M: 2,
  S: 1.5,
};

// 現在の画面サイズに応じたスケールマップを取得
export const getScaleMap = (): Record<ImageSize, number> => {
  return isMobile() ? MOBILE_SCALE_MAP : DESKTOP_SCALE_MAP;
};

// 後方互換性のため
export const SCALE_MAP = DESKTOP_SCALE_MAP;-e 
### FILE: ./src/app/components/floating-images-fix/cyber-scroll-messages/constants.ts

// src/app/components/floating-images-fix/cyber-scroll-messages/constants.ts

export type GlitchEffectType = 'rgb' | 'slice' | 'wave' | 'pulse' | 'jitter' | 'none';
export type TextDirection = 'horizontal' | 'vertical';
export type TextAlignment = 'left' | 'center' | 'right';

export interface MessageConfig {
	id: string;
	text: string;
	position: {
		start: number; // vh単位での開始位置
		end: number;   // vh単位での終了位置
	};
	style: TextDirection;
	size: string;
	align?: TextAlignment;
	glitchEffect?: GlitchEffectType;
	keywords?: string[]; // 特別強調するキーワード
	delay?: number;      // 表示遅延 (ms)
	color?: string;      // オーバーライド色
}

export interface GlitchEffectConfig {
	className: string;
	intensity: number;
}

// メッセージ定義
export const cyberMessages: MessageConfig[] = [
	{
		id: 'message-1',
		text: 'Pepe ascends.',
		position: { start: 0, end: 200 },
		style: 'horizontal',
		size: '4rem',
		align: 'left',
		glitchEffect: 'rgb',
		keywords: ['Pepe', 'Ascends'],
		color: '#ffffff', // 白色ベース
	},
	{
		id: 'message-2',
		text: 'Pepe summons us here.',
		position: { start: 200, end: 400 },
		style: 'horizontal',
		size: '4rem',
		align: 'right',
		glitchEffect: 'slice',
		keywords: ['Pepe', 'Summons'],
		color: '#ffffff', // 白色ベース
	},
	{
		id: 'message-3',
		text: `Pepe <br/>Makes us <br/>Free.`,
		position: { start: 400, end: 700 },
		style: 'horizontal',
		size: '10rem',
		align: 'left',
		glitchEffect: 'rgb',
		keywords: ['境地'],
		color: '#ffffff', // 白色ベース
	}
];

// グリッチエフェクト設定
export const glitchEffects: Record<GlitchEffectType, GlitchEffectConfig> = {
	rgb: {
		className: 'rgbSplit',
		intensity: 2
	},
	wave: {
		className: 'waveDistort',
		intensity: 1.5
	},
	slice: {
		className: 'sliceGlitch',
		intensity: 3
	},
	pulse: {
		className: 'pulseEffect',
		intensity: 2
	},
	jitter: {
		className: 'jitterEffect',
		intensity: 1
	},
	none: {
		className: '',
		intensity: 0
	}
};

// システムステータス表示用テキスト
export const systemStatusText = {
	loading: 'Loading...',
	ready: 'Activate',
	awakening: 'Start...',
	complete: 'END'
};

// 装飾用ランダムバイナリ生成
export const generateRandomBinary = (length: number): string => {
	return Array.from({ length }, () => Math.round(Math.random())).join('');
};

// 装飾用16進数生成
export const generateRandomHex = (length: number): string => {
	const hexChars = '0123456789ABCDEF';
	return Array.from(
		{ length },
		() => hexChars[Math.floor(Math.random() * hexChars.length)]
	).join('');
};-e 
### FILE: ./src/app/components/floating-images-fix/cyber-scroll-messages/MessageDisplay.tsx

// src/app/components/floating-images-fix/cyber-scroll-messages/MessageDisplay.tsx

'use client';

import React, { useEffect, useState, useRef } from 'react';
import styles from './styles.module.css';
import { MessageConfig, GlitchEffectType } from './constants';

interface MessageDisplayProps {
	message: MessageConfig;
	isActive: boolean;
	scrollProgress: number;
	randomGlitch: boolean;
}

const MessageDisplay: React.FC<MessageDisplayProps> = ({
	message,
	isActive,
	scrollProgress,
	randomGlitch
}) => {
	const messageRef = useRef<HTMLDivElement>(null);
	// ① モバイル判定用ステート
	const [isMobile, setIsMobile] = useState(false);

	useEffect(() => {
		const mql = window.matchMedia('(max-width: 640px)');
		const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
		setIsMobile(mql.matches);
		mql.addEventListener('change', handler);
		return () => mql.removeEventListener('change', handler);
	}, []);

	// グリッチエフェクトに対応するクラス名を取得
	const getGlitchClass = (effect?: GlitchEffectType): string => {
		switch (effect) {
			case 'rgb': return styles.rgbSplit;
			case 'slice': return styles.sliceGlitch;
			case 'wave': return styles.waveDistort;
			case 'pulse': return styles.pulseEffect;
			case 'jitter': return styles.jitterEffect;
			default: return '';
		}
	};

	// 単語がキーワードかどうかチェック
	const isKeyword = (word: string): boolean => {
		if (!message.keywords) return false;
		return message.keywords.some(keyword =>
			word.includes(keyword) || keyword.includes(word)
		);
	};

	// 単語ごとに分割してキーワードを強調
	const renderWords = () => {
		const parts = message.text.split(/(<br\s*\/?>)/i); // 改行タグも含めて分割

		return parts.map((part, index) => {
			if (part.match(/<br\s*\/?>/i)) {
				return <br key={`br-${index}`} />;
			}

			const isKeywordWord = isKeyword(part.trim());

			return (
				<span
					key={`word-${index}`}
					className={`${isKeywordWord ? styles.keywordGlitch : ''} ${getGlitchClass(message.glitchEffect)}`}
					data-text={part}
				>
					{part}
				</span>
			);
		});
	};

	// スタイルの計算
	const getStyleProps = () => {
		// 基本スタイル
		let styleProps: React.CSSProperties = {
			color: message.color || '#ffffff', // 白色をデフォルトに
			fontSize: message.size || '3rem',
			fontWeight: 'bold',
			textShadow: '0 0 10px rgba(255, 255, 255, 0.7), 0 0 20px rgba(255, 255, 255, 0.5)', // 白いグロー
			opacity: isActive ? 1 : 0,
			transition: 'opacity 0.7s ease-in-out',
			zIndex: 25,
			lineHeight: 0.9,
		};

		// 縦書き/横書きの設定
		if (message.style === 'vertical') {
			styleProps.writingMode = 'vertical-rl';
			styleProps.textOrientation = 'upright';
		}

		// 配置の設定
		if (message.align === 'right') {
			styleProps.right = message.style === 'vertical' ? '20vw' : '10vw';
			styleProps.textAlign = 'right';
		} else if (message.align === 'center') {
			styleProps.left = '50%';
			styleProps.transform = 'translateX(-50%)';
			styleProps.textAlign = 'center';
		} else {
			styleProps.left = message.style === 'vertical' ? '20vw' : '10vw';
			styleProps.textAlign = 'left';
		}

		// メッセージごとに固定位置を指定
		if (message.id === 'message-1') {
			// 「受け継がれし、神秘の奇跡」- 横書き、上部
			styleProps.position = 'fixed';
			styleProps.top = '20vh';
		} else if (message.id === 'message-2') {
			// 「限られた者がたどり着く」- 横書き、中央右寄り
			styleProps.position = 'fixed';
			styleProps.top = '40vh';
			styleProps.transform = styleProps.transform
				? `${styleProps.transform} translateY(-50%)`
				: 'translateY(-50%)';
		} else if (message.id === 'message-3') {
			// 「境地」- 縦書き、中央左寄り
			styleProps.position = 'fixed';
			styleProps.top = '60vh';
			styleProps.transform = styleProps.transform
				? `${styleProps.transform} translateY(-50%)`
				: 'translateY(-50%)';
		}
		if (isMobile) {
			styleProps.left = '10vw';
			styleProps.right = undefined;
			styleProps.textAlign = 'left';
			styleProps.fontSize = '4rem';
			// 縦方向の translate は必要なければ外して OK
			if (styleProps.transform) {
				styleProps.transform = styleProps.transform.replace(/translateY\(-50%\)/, '');
			}
		}

		return styleProps;
	};

	return (
		<div
			ref={messageRef}
			className={`
        ${randomGlitch ? styles.jitterEffect : ''}
      `}
			style={getStyleProps()}
			data-message-id={message.id}
			data-active={isActive}
		>
			{renderWords()}
		</div>
	);
};

export default MessageDisplay;-e 
### FILE: ./src/app/components/floating-images-fix/cyber-scroll-messages/index.tsx

// src/app/components/floating-images-fix/cyber-scroll-messages/index.tsx

'use client';

import CyberScrollMessages from './CyberScrollMessages';

// 明示的にデフォルトエクスポート
export default CyberScrollMessages;
-e 
### FILE: ./src/app/components/floating-images-fix/cyber-scroll-messages/CyberScrollMessages.tsx

// src/app/components/floating-images-fix/cyber-scroll-messages/CyberScrollMessages.tsx

'use client';

import React, { useEffect, useState, useRef } from 'react';
import { cyberMessages } from './constants';
import MessageDisplay from './MessageDisplay';

const CyberScrollMessages: React.FC = () => {
	const [scrollProgress, setScrollProgress] = useState<number>(0);
	const [activeIndex, setActiveIndex] = useState<number | null>(null);
	const [randomGlitch, setRandomGlitch] = useState<boolean>(false);
	const [isFlashActive, setIsFlashActive] = useState<boolean>(false);
	const [debugInfo, setDebugInfo] = useState<{ [key: string]: any }>({});

	// 強制的に全てのメッセージをアクティブにする（デバッグ用）
	const [forceAllActive, setForceAllActive] = useState<boolean>(false);

	useEffect(() => {
		const handleScroll = () => {
			// 現在のページ全体のスクロール位置
			const scrollTop = window.scrollY;
			const winHeight = window.innerHeight;
			const docHeight = document.documentElement.scrollHeight;

			// まず全体のスクロール進捗を計算
			const totalScrollProgress = scrollTop / (docHeight - winHeight);

			// FloatingImagesFixSectionを特定のセレクターで検索
			const targetSection = document.querySelector('#floating-images-fix-section') as HTMLElement;

			if (!targetSection) {
				// フォールバック: クラス名でも検索
				const fallbackSection = document.querySelector('.floating-images-fix-section') as HTMLElement;

				if (!fallbackSection) {
					// セクションが見つからない場合、ページの相対位置で推定
					console.log('Target section not found, estimating position');

					// ページの相対位置から推定（調整された値）
					const estimatedStart = docHeight * 0.5;  // 0.66から0.5に調整
					const estimatedHeight = docHeight * 0.25;

					// 相対スクロール位置を計算
					const relativeScroll = Math.max(0, Math.min(1,
						(scrollTop - estimatedStart) / estimatedHeight
					));

					setScrollProgress(relativeScroll);
					setDebugInfo({
						scrollTop,
						docHeight,
						estimatedStart,
						estimatedHeight,
						relativeScroll,
						mode: 'estimated'
					});

					// メッセージ表示の判定
					updateActiveMessage(relativeScroll * 800);
				} else {
					// フォールバックセクションを使用
					processSectionScroll(fallbackSection, scrollTop);
				}
			} else {
				// メインのIDセレクターで見つかった場合
				processSectionScroll(targetSection, scrollTop);
			}

			// ランダムグリッチの発生
			triggerRandomGlitch();
		};

		// セクションスクロール処理を共通化
		const processSectionScroll = (section: HTMLElement, scrollTop: number) => {
			const rect = section.getBoundingClientRect();
			const sectionTop = rect.top + scrollTop;
			const sectionHeight = rect.height;

			// セクション内相対位置を計算
			let relativeScroll = 0;
			if (scrollTop < sectionTop) {
				relativeScroll = 0;
			} else if (scrollTop > sectionTop + sectionHeight) {
				relativeScroll = 1;
			} else {
				relativeScroll = (scrollTop - sectionTop) / sectionHeight;
			}

			setScrollProgress(relativeScroll);
			setDebugInfo({
				scrollTop,
				sectionTop,
				sectionHeight,
				relativeScroll,
				viewportOffset: rect.top,
				mode: 'section-based',
				sectionFound: section.id || section.className
			});

			// メッセージ表示の判定
			updateActiveMessage(relativeScroll * 800);
		};

		// メッセージのアクティブ状態を更新
		const updateActiveMessage = (currentVhPosition: number) => {
			if (forceAllActive) {
				setActiveIndex(0);
				return;
			}

			// セクション検出が正常に動作している場合は、オフセット調整を少なくする
			const adjustedPosition = currentVhPosition - 50; // 150から50に調整

			let foundActive = false;
			let activeIdx = null;

			cyberMessages.forEach((msg, idx) => {
				// 調整した位置で判定
				if (adjustedPosition >= msg.position.start && adjustedPosition <= msg.position.end) {
					activeIdx = idx;
					foundActive = true;

					if (idx === 2 && !isFlashActive &&
						adjustedPosition >= msg.position.start &&
						adjustedPosition <= msg.position.start + 20) {
						triggerFlashEffect();
					}
				}
			});

			setActiveIndex(foundActive ? activeIdx : null);
		};

		// フラッシュエフェクトをトリガー
		const triggerFlashEffect = () => {
			setIsFlashActive(true);
			setTimeout(() => setIsFlashActive(false), 300);
		};

		// ランダムなグリッチエフェクトをトリガー
		const triggerRandomGlitch = () => {
			if (Math.random() > 0.95) {
				setRandomGlitch(true);
				setTimeout(() => setRandomGlitch(false), 150);
			}
		};

		window.addEventListener('scroll', handleScroll);
		handleScroll(); // 初期化時に一度実行

		// キーボードショートカット：Dキーでデバッグモード切替
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === 'd' || e.key === 'D') {
				setForceAllActive(prev => !prev);
				console.log('Debug mode:', !forceAllActive);
			}
		};

		window.addEventListener('keydown', handleKeyDown);

		return () => {
			window.removeEventListener('scroll', handleScroll);
			window.removeEventListener('keydown', handleKeyDown);
		};
	}, [forceAllActive, isFlashActive]);

	return (
		<div className="absolute inset-0 pointer-events-none z-15 h-[800vh]">
			{cyberMessages.map((message, index) => (
				<MessageDisplay
					key={message.id}
					message={message}
					isActive={forceAllActive || activeIndex === index}
					scrollProgress={scrollProgress}
					randomGlitch={randomGlitch}
				/>
			))}
		</div>
	);
};

export default CyberScrollMessages;-e 
### FILE: ./src/app/components/floating-images-fix/FloatingImageFix.tsx

// src/app/components/floating-images-fix/FloatingImageFix.tsx

import { useRef, useState, useEffect } from 'react';
import { useFrame, extend } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import type { ImageFile } from './constants';
import { VisibilityState } from '../../types/visibility';
import * as THREE from 'three';

extend({
	Mesh: THREE.Mesh,
	PlaneGeometry: THREE.PlaneGeometry,
	MeshBasicMaterial: THREE.MeshBasicMaterial
});

interface FloatingImageFixProps {
	image: ImageFile;
	position: [number, number, number];
	scale: number;
	rotationSpeed?: number;
	isVisible: boolean;
	visibilityState: VisibilityState;
	globalIntersectionRatio: number;
}

/**
 * 個別画像の可視性制御対応版
 * 画面内の画像のみアニメーション実行
 */
const FloatingImageFix: React.FC<FloatingImageFixProps> = ({
	image,
	position,
	scale,
	rotationSpeed = 0.005,
	isVisible,
	visibilityState,
	globalIntersectionRatio,
}) => {
	const meshRef = useRef<THREE.Mesh>(null);
	const texture = useTexture(image.path);

	// 個別画像の可視性状態
	const [isInViewport, setIsInViewport] = useState(false);
	const [shouldAnimate, setShouldAnimate] = useState(false);
	const [opacity, setOpacity] = useState(1);

	// 最新のrotationSpeedを参照するref
	const speedRef = useRef(rotationSpeed);
	const lastFrameTimeRef = useRef(0);

	useEffect(() => {
		speedRef.current = rotationSpeed;
	}, [rotationSpeed]);

	// アスペクト比の計算
	const [aspect, setAspect] = useState(1);
	useEffect(() => {
		if (texture?.image) {
			setAspect(texture.image.width / texture.image.height);
		}
	}, [texture]);

	// 画面内判定の計算
	useEffect(() => {
		if (!meshRef.current) return;

		const mesh = meshRef.current;
		const meshPosition = mesh.position;

		// 簡易的な画面内判定（カメラ視野に基づく）
		const frustumCheck = () => {
			const camera = mesh.parent?.userData?.camera;
			if (!camera) {
				// フォールバック: Z位置に基づく簡易判定
				const isInFrustum = Math.abs(meshPosition.x) < 10 &&
					Math.abs(meshPosition.y) < 6 &&
					meshPosition.z > -5 && meshPosition.z < 5;
				return isInFrustum;
			}

			// より正確な視錐台判定（パフォーマンスを考慮して簡略化）
			const distance = meshPosition.distanceTo(camera.position);
			return distance < 15; // 15単位以内なら可視と判定
		};

		const inViewport = frustumCheck();
		setIsInViewport(inViewport);
	}, [position, globalIntersectionRatio]);

	// アニメーション状態の決定
	useEffect(() => {
		let shouldStart = false;

		switch (visibilityState) {
			case 'hidden':
				shouldStart = false;
				setOpacity(0);
				break;

			case 'approaching':
				shouldStart = isInViewport && globalIntersectionRatio > 0.05;
				setOpacity(0.3);
				break;

			case 'partial':
				shouldStart = isInViewport;
				setOpacity(0.6 + (globalIntersectionRatio * 0.4));
				break;

			case 'visible':
				shouldStart = true; // visible時は全画像をアニメーション
				setOpacity(1);
				break;
		}

		setShouldAnimate(shouldStart && isVisible);
	}, [visibilityState, isInViewport, globalIntersectionRatio, isVisible]);

	// パフォーマンス最適化されたuseFrame
	useFrame((state, delta) => {
		if (!meshRef.current || !shouldAnimate) return;

		const now = state.clock.elapsedTime;

		// フレームレート制限（60FPS以下に制限）
		if (now - lastFrameTimeRef.current < 1 / 60) return;

		lastFrameTimeRef.current = now;

		// 回転アニメーション
		meshRef.current.rotation.z += (speedRef.current ?? 0.06) * delta;

		// 可視性状態に応じた追加エフェクト
		if (visibilityState === 'visible' && globalIntersectionRatio > 0.8) {
			// 完全可視時の微細な浮遊効果
			const floatEffect = Math.sin(now * 0.5 + position[0]) * 0.02;
			meshRef.current.position.y = position[1] + floatEffect;
		}
	});

	// テクスチャの最適化
	useEffect(() => {
		if (texture) {
			// テクスチャ設定の最適化
			texture.generateMipmaps = false; // ミップマップ無効化でメモリ節約
			texture.minFilter = THREE.LinearFilter;
			texture.magFilter = THREE.LinearFilter;
			texture.flipY = false; // 不要な反転処理を無効化

			// 非可視時はテクスチャを一時的に解放
			if (visibilityState === 'hidden') {
				texture.needsUpdate = false;
			} else {
				texture.needsUpdate = true;
			}
		}
	}, [texture, visibilityState]);

	// メモリ管理: 長時間非表示の場合にテクスチャを解放
	useEffect(() => {
		if (visibilityState === 'hidden') {
			const timeout = setTimeout(() => {
				if (texture && meshRef.current) {
					// テクスチャの一時的な解放
					texture.dispose();
				}
			}, 5000); // 5秒後に解放

			return () => clearTimeout(timeout);
		}
	}, [visibilityState, texture]);

	// デバッグ情報（開発環境のみ）
	useEffect(() => {
		if (process.env.NODE_ENV === 'development' && image.id === 1) { // 最初の画像のみログ出力
			console.debug('[FloatingImageFix] State update:', {
				imageId: image.id,
				visibilityState,
				isInViewport,
				shouldAnimate,
				opacity,
				globalIntersectionRatio: globalIntersectionRatio.toFixed(3),
			});
		}
	}, [image.id, visibilityState, isInViewport, shouldAnimate, opacity, globalIntersectionRatio]);

	const width = scale;
	const height = scale / aspect;

	// 非表示時は何もレンダリングしない - デバッグのため一時的に無効化
	// if (visibilityState === 'hidden' || opacity === 0) {
	//   return null;
	// }

	return (
		// @ts-expect-error React Three Fiber JSX elements
		<mesh
			ref={meshRef}
			position={position}
			castShadow={false}
			receiveShadow={false}
			userData={{
				imageId: image.id,
				visibilityState,
				shouldAnimate,
				isInViewport
			}}
		>
			{/* @ts-expect-error React Three Fiber JSX elements */}
			<planeGeometry args={[width, height]} />
			{/* @ts-expect-error React Three Fiber JSX elements */}
			<meshBasicMaterial
				map={texture}
				transparent
				opacity={0.6} // 半透明に設定（60%の透明度）
				toneMapped={false}
				alphaTest={0.01} // 完全透明部分の描画スキップ
				depthWrite={false} // 半透明なのでデプス書き込み無効
			/>
			{/* @ts-expect-error React Three Fiber JSX elements */}
		</mesh>
	);
};

export default FloatingImageFix;-e 
### FILE: ./src/app/components/floating-images-fix/useResponsiveImages.ts

// src/app/components/floating-images-fix/useResponsiveImages.ts

import { useState, useEffect, useMemo, useCallback } from 'react';
import { ImageFile, ImageSize } from './constants';

const CDN_URL = process.env.NEXT_PUBLIC_CLOUDFRONT_URL || "";

// 画面サイズ判定（768px以下をモバイルとする）
const isMobile = () => {
	if (typeof window === 'undefined') return false;
	return window.innerWidth <= 768;
};

// 画像データの基本定義
const baseImageData = [
	{ id: 1, filename: '1L.webp', size: 'L' as ImageSize },
	{ id: 2, filename: '2M.webp', size: 'M' as ImageSize },
	{ id: 3, filename: '3S.webp', size: 'S' as ImageSize },
	{ id: 4, filename: '4S.webp', size: 'S' as ImageSize },
	{ id: 5, filename: '5M.webp', size: 'M' as ImageSize },
	{ id: 6, filename: '6L.webp', size: 'L' as ImageSize },
	{ id: 7, filename: '7M.webp', size: 'M' as ImageSize },
	{ id: 8, filename: '8M.webp', size: 'M' as ImageSize },
	{ id: 9, filename: '9L.webp', size: 'L' as ImageSize },
	{ id: 10, filename: '10S.webp', size: 'S' as ImageSize },
	{ id: 11, filename: '11S.webp', size: 'S' as ImageSize },
	{ id: 12, filename: '12M.webp', size: 'M' as ImageSize },
	{ id: 13, filename: '13L.webp', size: 'L' as ImageSize },
	{ id: 14, filename: '14L.webp', size: 'L' as ImageSize },
	{ id: 15, filename: '15M.webp', size: 'M' as ImageSize },
	{ id: 16, filename: '16S.webp', size: 'S' as ImageSize },
	{ id: 17, filename: '17S.webp', size: 'S' as ImageSize },
	{ id: 18, filename: '18M.webp', size: 'M' as ImageSize },
	{ id: 19, filename: '19L.webp', size: 'L' as ImageSize },
	{ id: 20, filename: '20L.webp', size: 'L' as ImageSize },
	{ id: 21, filename: '21S.webp', size: 'S' as ImageSize },
	{ id: 22, filename: '22S.webp', size: 'S' as ImageSize },
	{ id: 23, filename: '23L.webp', size: 'L' as ImageSize },
	{ id: 24, filename: '24L.webp', size: 'L' as ImageSize },
	{ id: 25, filename: '25S.webp', size: 'S' as ImageSize },
	{ id: 26, filename: '26S.webp', size: 'S' as ImageSize },
	{ id: 27, filename: '27S.webp', size: 'S' as ImageSize },
	{ id: 28, filename: '28L.webp', size: 'L' as ImageSize },
	{ id: 29, filename: '29S.webp', size: 'S' as ImageSize },
	{ id: 30, filename: '30S.webp', size: 'S' as ImageSize },
	{ id: 31, filename: '31M.webp', size: 'M' as ImageSize },
	{ id: 32, filename: '32M.webp', size: 'M' as ImageSize },
	{ id: 33, filename: '33M.webp', size: 'M' as ImageSize },
	{ id: 34, filename: '34S.webp', size: 'S' as ImageSize },
	{ id: 35, filename: '35L.webp', size: 'L' as ImageSize },
];

// サイズに応じたスケール（最適化済み）
const DESKTOP_SCALE_MAP: Record<ImageSize, number> = {
	L: 0.8, // 0.9 → 0.8に削減
	M: 0.7, // 0.9 → 0.7に削減
	S: 0.6, // 0.9 → 0.6に削減
};

const MOBILE_SCALE_MAP: Record<ImageSize, number> = {
	L: 0.4, // 0.5 → 0.4に削減
	M: 0.35, // 0.5 → 0.35に削減
	S: 0.3, // 0.5 → 0.3に削減
};

/**
 * パフォーマンス最適化された画像管理フック
 */
export const useResponsiveImages = () => {
	const [isMobileView, setIsMobileView] = useState(false);
	const [imageLoadingState, setImageLoadingState] = useState<'loading' | 'ready' | 'error'>('loading');
	const [loadedImageCount, setLoadedImageCount] = useState(0);

	// 画面サイズの監視（デバウンス付き）
	const checkScreenSize = useCallback(() => {
		setIsMobileView(isMobile());
	}, []);

	useEffect(() => {
		// 初期チェック
		checkScreenSize();

		// デバウンスされたリサイズハンドラー
		let timeoutId: NodeJS.Timeout;
		const debouncedResize = () => {
			clearTimeout(timeoutId);
			timeoutId = setTimeout(checkScreenSize, 250);
		};

		window.addEventListener('resize', debouncedResize);
		return () => {
			window.removeEventListener('resize', debouncedResize);
			clearTimeout(timeoutId);
		};
	}, [checkScreenSize]);

	// 画像データを生成（画面サイズに応じてパスを切り替え）
	const imageFiles: ImageFile[] = useMemo(() => {
		const folder = isMobileView ? 'pepe/gallery-small2' : 'pepe';

		return baseImageData.map(item => ({
			...item,
			path: `${CDN_URL}/${folder}/${item.filename}`
		}));
	}, [isMobileView]);

	// スケールマップを取得（最適化済み）
	const scaleMap = useMemo(() => {
		return isMobileView ? MOBILE_SCALE_MAP : DESKTOP_SCALE_MAP;
	}, [isMobileView]);

	// 画像の事前読み込み状態管理
	useEffect(() => {
		let loadCount = 0;
		const totalImages = imageFiles.length;

		setImageLoadingState('loading');
		setLoadedImageCount(0);

		// 画像の事前読み込み（パフォーマンス最適化のため段階的に実行）
		const preloadImages = async () => {
			const promises = imageFiles.map((imageFile, index) => {
				return new Promise<void>((resolve) => {
					const img = new Image();

					img.onload = () => {
						loadCount++;
						setLoadedImageCount(loadCount);

						if (process.env.NODE_ENV === 'development') {
							console.debug(`[useResponsiveImages] Image loaded: ${imageFile.filename} (${loadCount}/${totalImages})`);
						}

						resolve();
					};

					img.onerror = () => {
						console.warn(`[useResponsiveImages] Failed to load image: ${imageFile.filename}`);
						loadCount++;
						setLoadedImageCount(loadCount);
						resolve();
					};

					// 段階的読み込み（最初の10枚を優先）
					setTimeout(() => {
						img.src = imageFile.path;
					}, index < 10 ? 0 : index * 50);
				});
			});

			try {
				await Promise.all(promises);
				setImageLoadingState('ready');

				if (process.env.NODE_ENV === 'development') {
					console.info('[useResponsiveImages] All images preloaded successfully');
				}
			} catch (error) {
				console.error('[useResponsiveImages] Image preloading failed:', error);
				setImageLoadingState('error');
			}
		};

		preloadImages();
	}, [imageFiles]);

	// 優先度付き画像リスト（重要な画像を先頭に配置）
	const prioritizedImageFiles = useMemo(() => {
		const sorted = [...imageFiles];

		// Lサイズを優先、次にM、最後にS
		sorted.sort((a, b) => {
			const sizeOrder = { L: 3, M: 2, S: 1 };
			return sizeOrder[b.size] - sizeOrder[a.size];
		});

		return sorted;
	}, [imageFiles]);

	// パフォーマンス統計
	const performanceStats = useMemo(() => ({
		totalImages: imageFiles.length,
		loadedImages: loadedImageCount,
		loadingProgress: (loadedImageCount / imageFiles.length) * 100,
		isReady: imageLoadingState === 'ready',
		isMobile: isMobileView,
		averageScale: Object.values(scaleMap).reduce((a, b) => a + b, 0) / Object.values(scaleMap).length,
	}), [imageFiles.length, loadedImageCount, imageLoadingState, isMobileView, scaleMap]);

	// メモリ使用量の推定
	const estimatedMemoryUsage = useMemo(() => {
		const averageImageSize = isMobileView ? 0.5 : 1.2; // MB per image (推定)
		return loadedImageCount * averageImageSize;
	}, [loadedImageCount, isMobileView]);

	// デバッグ情報の出力
	useEffect(() => {
		if (process.env.NODE_ENV === 'development' && imageLoadingState === 'ready') {
			console.info('[useResponsiveImages] Performance stats:', {
				...performanceStats,
				estimatedMemoryUsage: `${estimatedMemoryUsage.toFixed(1)}MB`,
				scaleReduction: `${((1 - performanceStats.averageScale) * 100).toFixed(1)}%`,
			});
		}
	}, [performanceStats, estimatedMemoryUsage, imageLoadingState]);

	return {
		imageFiles: prioritizedImageFiles,
		scaleMap,
		isMobileView,
		imageLoadingState,
		loadedImageCount,
		performanceStats,
		estimatedMemoryUsage,
	};
};-e 
### FILE: ./src/app/components/floating-images-fix/FloatingImagesFixSection.tsx

// src/app/components/floating-images-fix/FloatingImagesFixSection.tsx

'use client';

import React from 'react';
import { useVisibilityControl } from '../../hooks/useVisibilityControl';
import { useCanvasControl } from '../../hooks/useCanvasControl';
import FloatingImagesFixCanvas from './FloatingImagesFixCanvas';
import CyberScrollMessages from './cyber-scroll-messages';

/**
 * 可視性制御が統合されたFloatingImagesFixSection
 * 35枚の画像による最も重い3D処理を最適化
 */
const FloatingImagesFixSection: React.FC = () => {
  // 可視性制御を一時的に無効化してデバッグ
  const elementRef = React.useRef<HTMLDivElement>(null);
  
  // 簡単なステート管理に変更
  const [debugInfo, setDebugInfo] = React.useState({
    state: 'visible',
    ratio: 1.0,
    frameloop: 'always'
  });

  // 可視性制御フックを一時的にコメントアウト
  // const {
  //   visibilityInfo,
  //   canvasState,
  //   elementRef,
  //   controls
  // } = useVisibilityControl('floating-images-section', 'floating-images', {
  //   // FloatingImages専用の最適化設定
  //   rootMargin: '400px', // 最も早い事前準備
  //   threshold: [0, 0.1, 0.25, 0.5, 0.75, 1.0],
  //   debounceMs: 25, // 細かい制御
  //   memoryReleaseDelay: 3 * 60 * 1000, // 3分でメモリ解放
  // });

  // Canvas制御フックも一時的にコメントアウト
  // const {
  //   canvasState: canvasControlState,
  //   setFrameloop,
  //   startAnimation,
  //   stopAnimation,
  //   performanceStats
  // } = useCanvasControl('floating-images-canvas', {
  //   initialFrameloop: 'never',
  //   enableFPSLimit: true,
  //   targetFPS: 60,
  //   enableMemoryMonitoring: true,
  // });

  // 状態に応じたレンダリング最適化 - デバッグのため一時的に常時表示
  const shouldRenderCanvas = true;
  const shouldRenderMessages = true; // メッセージを再有効化

  return (
    <>
      <div className='w-full relative h-[50vh] bg-black' />
      
      <section
        ref={elementRef}
        className="w-screen h-[800vh] relative overflow-hidden bg-black floating-images-fix-section"
        id="floating-images-fix-section"
        data-visibility-state={debugInfo.state}
        data-canvas-priority="5"
      >
        <div className="w-screen h-full sticky top-0 left-0 pointer-events-none z-10">
          {/* グラデーションオーバーレイ - 常時表示 */}
          <div className="absolute top-0 left-0 w-full h-[100vh] z-20
                  bg-gradient-to-b from-black via-black/40 to-black/0
                  pointer-events-none"
          />
          
          {/* モバイル用背景画像 - 常時表示 */}
          <div
            className="absolute inset-0 z-10 block sm:hidden bg-center bg-cover"
            style={{
              backgroundImage: `url(${process.env.NEXT_PUBLIC_CLOUDFRONT_URL}/pepe/garally_small2.webp)`
            }}
          />

          {/* 3D Canvas - Suspense で包む */}
          {shouldRenderCanvas && (
            <React.Suspense fallback={
              <div className="absolute inset-0 flex items-center justify-center text-white">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neonGreen mx-auto mb-4"></div>
                  <div>Loading 3D Gallery...</div>
                </div>
              </div>
            }>
              <FloatingImagesFixCanvas
                visibilityState="visible"
                intersectionRatio={1.0}
                canvasFrameloop="always"
                isAnimating={true}
                priority={5}
              />
            </React.Suspense>
          )}

          {/* サイバーメッセージ - 再有効化 */}
          {shouldRenderMessages && <CyberScrollMessages />}
          
          {/* 下部グラデーション - 常時表示 */}
          <div className="absolute bottom-0 left-0 w-full h-[100vh] z-20
                  bg-gradient-to-b from-black/0 via-black/40 to-black
                  pointer-events-none"
          />
        </div>

        {/* デバッグ情報表示（開発環境のみ） - 一時的に簡略化 */}
        {process.env.NODE_ENV === 'development' && (
          <div className="fixed top-4 right-4 bg-black/80 text-green-400 p-4 rounded-lg font-mono text-xs z-50 max-w-xs">
            <div className="text-white font-bold mb-2">FloatingImages Debug (Simplified)</div>
            <div>State: <span className="text-yellow-400">{debugInfo.state}</span></div>
            <div>Ratio: <span className="text-blue-400">{debugInfo.ratio}</span></div>
            <div>Frameloop: <span className="text-green-400">{debugInfo.frameloop}</span></div>
            <div className="mt-2 text-xs text-gray-400">
              Canvas: {shouldRenderCanvas ? 'Active' : 'Hidden'}<br/>
              Messages: {shouldRenderMessages ? 'Active' : 'Hidden'}
            </div>
          </div>
        )}
      </section>
      
      <div className='w-full relative h-[150vh] bg-black' />
    </>
  );
};

export default FloatingImagesFixSection;-e 
### FILE: ./src/app/components/floating-images-fix/FloatingImagesFixCanvas.tsx

// src/app/components/floating-images-fix/FloatingImagesFixCanvas.tsx

'use client';

import React, { useMemo, useRef, useEffect } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import FloatingImageFix from './FloatingImageFix';
import { ImageSize, ImageFile } from './constants';
import { useResponsiveImages } from './useResponsiveImages';
import { VisibilityState } from '../../types/visibility';

const CANVAS_DEPTH = 3;
const PADDING_X = 0.2;
const PADDING_Y = 1.5;

// Z位置計算（サイズ別）
const getZBySize = (size: ImageSize) => {
	if (size === 'L') return CANVAS_DEPTH * 0.42 + Math.random();
	if (size === 'M') return Math.random() * 2 - 1;
	return -CANVAS_DEPTH * 0.42 + Math.random();
};

interface FloatingImagesFixCanvasProps {
	visibilityState: VisibilityState;
	intersectionRatio: number;
	canvasFrameloop: 'always' | 'never' | 'demand';
	isAnimating: boolean;
	priority: number;
}

/**
 * 可視性制御が統合された内部Canvas制御コンポーネント
 */
const FloatingImagesFixInner: React.FC<{
	imageFiles: ImageFile[];
	scaleMap: Record<ImageSize, number>;
	visibilityState: VisibilityState;
	intersectionRatio: number;
	isAnimating: boolean;
}> = ({ imageFiles, scaleMap, visibilityState, intersectionRatio, isAnimating }) => {
	const { viewport } = useThree();
	const count = imageFiles.length;
	const cols = Math.ceil(Math.sqrt(count));
	const rows = Math.ceil(count / cols);

	// 画像位置の計算（メモ化）
	const positions = useMemo(() => {
		const arr: [number, number, number][] = [];
		const images = imageFiles.slice().reverse();

		for (let i = 0; i < count; i++) {
			const col = i % cols;
			const row = Math.floor(i / cols);
			const image = images[i];

			const x =
				((col + 0.5) / cols) * (viewport.width - PADDING_X * 2) +
				PADDING_X -
				viewport.width / 2;
			const y =
				((row + 0.5) / rows) * (viewport.height - PADDING_Y * 2) +
				PADDING_Y -
				viewport.height / 2;

			const z = getZBySize(image.size);
			arr.push([x, y, z]);
		}
		return arr;
	}, [count, cols, rows, viewport.width, viewport.height, imageFiles]);

	// 回転速度（メモ化） - 可視性状態に応じて調整
	const speeds = useMemo(() => {
		const baseSpeed = 0.03;
		let speedMultiplier = 1;

		switch (visibilityState) {
			case 'hidden':
				speedMultiplier = 0;
				break;
			case 'approaching':
				speedMultiplier = 0.3;
				break;
			case 'partial':
				speedMultiplier = 0.7;
				break;
			case 'visible':
				speedMultiplier = 1.0;
				break;
		}

		return imageFiles.map(() =>
			(baseSpeed + Math.random() * 0.05) * speedMultiplier
		);
	}, [imageFiles.length, visibilityState]);

	// 画像リスト（メモ化）
	const images = useMemo(() => imageFiles.slice().reverse(), [imageFiles]);

	// 可視範囲の計算（パフォーマンス最適化） - デバッグのため全画像表示
	const visibleIndices = useMemo(() => {
		// デバッグ用に全画像を表示
		return Array.from({ length: images.length }, (_, i) => i);

		// 本来の可視性制御（コメントアウト）
		// switch (visibilityState) {
		//   case 'hidden':
		//     return [];
		//   case 'approaching':
		//     return Array.from({ length: Math.min(10, images.length) }, (_, i) => i);
		//   case 'partial':
		//     return Array.from({ length: Math.min(20, images.length) }, (_, i) => i);
		//   case 'visible':
		//     return Array.from({ length: images.length }, (_, i) => i);
		//   default:
		//     return [];
		// }
	}, [images.length]); // visibilityStateの依存関係を一時的に削除

	// 開発環境でのパフォーマンス監視
	useEffect(() => {
		if (process.env.NODE_ENV === 'development') {
			console.debug('[FloatingImagesFixInner] Render optimization:', {
				totalImages: images.length,
				visibleImages: visibleIndices.length,
				visibilityState,
				intersectionRatio: intersectionRatio.toFixed(3),
				isAnimating,
			});
		}
	}, [images.length, visibleIndices.length, visibilityState, intersectionRatio, isAnimating]);

	return (
		<>
			{visibleIndices.map((i) => {
				const image = images[i];
				if (!image) return null;

				return (
					<FloatingImageFix
						key={image.id}
						image={image}
						position={positions[i]}
						scale={scaleMap[image.size]}
						rotationSpeed={speeds[i]}
						isVisible={true} // デバッグ用に強制的にtrue
						visibilityState={visibilityState}
						globalIntersectionRatio={intersectionRatio}
					/>
				);
			})}
		</>
	);
};

/**
 * 可視性制御対応のFloatingImagesFixCanvas
 */
const FloatingImagesFixCanvas: React.FC<FloatingImagesFixCanvasProps> = ({
	visibilityState,
	intersectionRatio,
	canvasFrameloop,
	isAnimating,
	priority
}) => {
	const { imageFiles, scaleMap } = useResponsiveImages();
	const canvasRef = useRef<HTMLCanvasElement>(null);

	// Canvas要素への参照設定とパフォーマンス監視
	useEffect(() => {
		if (canvasRef.current && process.env.NODE_ENV === 'development') {
			const canvas = canvasRef.current;
			console.debug('[FloatingImagesFixCanvas] Canvas initialized:', {
				width: canvas.width,
				height: canvas.height,
				frameloop: canvasFrameloop,
				visibilityState,
				priority,
			});
		}
	}, [canvasFrameloop, visibilityState, priority]);

	// WebGLコンテキストの監視
	useEffect(() => {
		if (!canvasRef.current) return;

		const canvas = canvasRef.current;

		const handleContextLost = (event: Event) => {
			event.preventDefault();
			console.warn('[FloatingImagesFixCanvas] WebGL context lost');
		};

		const handleContextRestored = () => {
			console.info('[FloatingImagesFixCanvas] WebGL context restored');
		};

		canvas.addEventListener('webglcontextlost', handleContextLost);
		canvas.addEventListener('webglcontextrestored', handleContextRestored);

		return () => {
			canvas.removeEventListener('webglcontextlost', handleContextLost);
			canvas.removeEventListener('webglcontextrestored', handleContextRestored);
		};
	}, []);

	// パフォーマンス最適化: 非表示時は完全に非レンダリング
	if (visibilityState === 'hidden') {
		return null;
	}

	return (
		<Canvas
			ref={canvasRef}
			className="w-full h-full hidden sm:block"
			gl={{
				antialias: false,
				powerPreference: 'high-performance', // パフォーマンス優先
				alpha: true,
				premultipliedAlpha: true,
				preserveDrawingBuffer: false, // メモリ節約
			}}
			dpr={Math.min(window.devicePixelRatio, 2)} // DPR制限でパフォーマンス向上
			shadows={false}
			frameloop={canvasFrameloop}
			performance={{
				min: 0.5, // 最小パフォーマンス閾値
				max: 1.0,
				debounce: 200, // デバウンス時間
			}}
			onCreated={(state) => {
				// Canvas作成時の最適化設定
				const { gl } = state;
				gl.setClearColor(0x000000, 0); // 透明背景

				if (process.env.NODE_ENV === 'development') {
					console.info('[FloatingImagesFixCanvas] Canvas created with optimization:', {
						renderer: gl.info.render,
						memory: gl.info.memory,
						maxTextures: gl.capabilities.maxTextures,
					});
				}
			}}
		>
			<FloatingImagesFixInner
				imageFiles={imageFiles}
				scaleMap={scaleMap}
				visibilityState={visibilityState}
				intersectionRatio={intersectionRatio}
				isAnimating={isAnimating}
			/>
		</Canvas>
	);
};

export default FloatingImagesFixCanvas;-e 
### FILE: ./src/app/layout.tsx

import { Montserrat, Space_Grotesk } from 'next/font/google';
import './globals.css';
import type { Metadata } from 'next';
// フォントの設定
const montserrat = Montserrat({
	subsets: ['latin'],
	variable: '--font-montserrat',
	display: 'swap',
});

const spaceGrotesk = Space_Grotesk({
	subsets: ['latin'],
	variable: '--font-space-grotesk',
	display: 'swap',
});
// メタデータ設定
export const metadata: Metadata = {
	title: 'We Are On-Chain | Pepe Protein',
	description: 'Pay, Pump, Live. The crypto-exclusive protein for the blockchain generation.',
	keywords: 'crypto, protein, blockchain, pepe, fitness, cryptocurrency',
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang="en" className={`${montserrat.variable} ${spaceGrotesk.variable}`}>
			<body className="bg-black text-white min-h-screen font-sans antialiased">
				{children}
			</body>
		</html>
	);
}-e 
### FILE: ./src/app/page.tsx

import HeroSection from './components/hero-section/HeroSection';
import SphereTop from './components/sphere/SphereTop';
import PepeTop from './components/pepe3d/PepeTop';
import GlowingTextSection from './components/glowing-3d-text/GlowingTextSection';
import PulsatingComponent from './components/layout/PulsatingComponent';
import FloatingImagesFixSection from './components/floating-images-fix/FloatingImagesFixSection';
import Header from './components/ui/Header';
import Footer from './components/ui/Footer';
import CyberInterface from './components/layout/CyberInterface';
import PepePush from './components/pepePush/PepePush';
import LayeredGallerySection from './components/layered-gallery/LayeredGallerySection'
export default function Home() {
	return (
		<main className="relative flex flex-col items-center w-full">

			<LayeredGallerySection />
			<HeroSection />

		</main>
	);
}

/*
			<Header />
			<HeroSection />
			<CyberInterface />
			<GlowingTextSection />
			<PulsatingComponent />
			<PepeTop />
			<SphereTop />
			<PepePush />
			<Footer />

*/-e 
### FILE: ./types/react-three-fiber.d.ts

// types/react-three-fiber.d.ts
import { ReactThreeFiber } from '@react-three/fiber'
import * as THREE from 'three'

declare global {
  namespace JSX {
    interface IntrinsicElements {
      mesh: ReactThreeFiber.Object3DNode<THREE.Mesh, typeof THREE.Mesh>
      group: ReactThreeFiber.Object3DNode<THREE.Group, typeof THREE.Group>
      planeGeometry: ReactThreeFiber.Node<THREE.PlaneGeometry, typeof THREE.PlaneGeometry>
      boxGeometry: ReactThreeFiber.Node<THREE.BoxGeometry, typeof THREE.BoxGeometry>
      sphereGeometry: ReactThreeFiber.Node<THREE.SphereGeometry, typeof THREE.SphereGeometry>
      meshBasicMaterial: ReactThreeFiber.Node<THREE.MeshBasicMaterial, typeof THREE.MeshBasicMaterial>
      meshStandardMaterial: ReactThreeFiber.Node<THREE.MeshStandardMaterial, typeof THREE.MeshStandardMaterial>
      ambientLight: ReactThreeFiber.Object3DNode<THREE.AmbientLight, typeof THREE.AmbientLight>
      directionalLight: ReactThreeFiber.Object3DNode<THREE.DirectionalLight, typeof THREE.DirectionalLight>
      spotLight: ReactThreeFiber.Object3DNode<THREE.SpotLight, typeof THREE.SpotLight>
      pointLight: ReactThreeFiber.Object3DNode<THREE.PointLight, typeof THREE.PointLight>
    }
  }
}

export {}-e 
### FILE: ./tailwind.config.js

/** @type {import('tailwindcss').Config} */
module.exports = {
	content: [
		'./src/pages/**/*.{js,ts,jsx,tsx,mdx}',
		'./src/components/**/*.{js,ts,jsx,tsx,mdx}',
		'./src/app/**/*.{js,ts,jsx,tsx,mdx}',
	],
	theme: {
		extend: {
			colors: {
				neonGreen: '#00FF7F',
				neonOrange: '#FF6D00',
				dark: {
					100: '#111111',
					200: '#222222',
					300: '#333333',
					400: '#444444',
					500: '#555555',
				},
			},
			fontFamily: {
				sans: ['var(--font-montserrat)', 'sans-serif'],
				heading: ['var(--font-space-grotesk)', 'sans-serif'],
				pixel: ['var(--font-pixel)', 'sans-serif'],
			},
			animation: {
				glitch: 'glitch 0.2s ease-in-out infinite',
				'glitch-slow': 'glitch 2s ease-in-out infinite',
				pulse: 'pulse 2s ease-in-out infinite',
				'pulse-fast': 'pulse 1s ease-in-out infinite',
				scanline: 'scanline 8s linear infinite',
				typewriter: 'typewriter 4s steps(40) 1s infinite',
			},
			keyframes: {
				glitch: {
					'0%, 100%': { transform: 'translate(0)' },
					'20%': { transform: 'translate(-2px, 2px)' },
					'40%': { transform: 'translate(-2px, -2px)' },
					'60%': { transform: 'translate(2px, 2px)' },
					'80%': { transform: 'translate(2px, -2px)' },
				},
				pulse: {
					'0%, 100%': {
						opacity: '1',
						filter: 'brightness(1) blur(0px)',
					},
					'50%': {
						opacity: '0.8',
						filter: 'brightness(1.2) blur(1px)',
					},
				},
				scanline: {
					'0%': {
						transform: 'translateY(-100%)',
					},
					'100%': {
						transform: 'translateY(100vh)',
					},
				},
				typewriter: {
					'0%, 100%': {
						width: '0%',
					},
					'20%, 80%': {
						width: '100%',
					},
				},
			},
			transitionProperty: {
				'transform': 'transform',
			},
			transitionTimingFunction: {
				'out-sine': 'cubic-bezier(0.39, 0.575, 0.565, 1)',
			},
			// クリップパスの追加（ClipPath プラグインを使わない場合）
			clipPath: {
				'diagonal-transition': 'polygon(100% 0, 100% 100%, 0 100%, 45% 0)',
				'diagonal-transition-mobile': 'polygon(100% 0, 100% 100%, 0 100%, 35% 0)',
			},
		},
	},
	plugins: [],
}-e 
### FILE: ./postcss.config.js

module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
-e 
### FILE: ./next.config.js

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['three', '@react-three/fiber', '@react-three/drei'], // この行を追加
  images: {
    domains: [],
    formats: ["image/avif", "image/webp"],
  },
  // WebGLキャンバスサポート
  webpack: (config) => {
    config.module.rules.push({
      test: /\.(glsl|vs|fs|vert|frag)$/,
      type: "asset/source",
    });

    return config;
  },
  // 実験的機能
  experimental: {
    optimizeCss: true,
    scrollRestoration: true,
    esmExternals: 'loose', // この行も追加
  },
};

module.exports = nextConfig;-e 
### FILE: ./next-env.d.ts

/// <reference types="next" />
/// <reference types="next/image-types/global" />

// NOTE: This file should not be edited
// see https://nextjs.org/docs/basic-features/typescript for more information.

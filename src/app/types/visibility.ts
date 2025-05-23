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
}
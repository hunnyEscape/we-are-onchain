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
}
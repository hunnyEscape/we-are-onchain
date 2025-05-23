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
}
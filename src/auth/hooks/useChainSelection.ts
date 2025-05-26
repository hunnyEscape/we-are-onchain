// src/auth/hooks/useChainSelection.ts (完成版)
import { useState, useCallback, useEffect, useRef } from 'react';
import { SelectableChainId, SelectableChain, ChainSwitchResult } from '@/types/chain-selection';
import { testnetUtils } from '@/auth/config/testnet-chains';
import { ChainSelectionUtils } from '@/auth/utils/chain-utils';
import { AuthEventType } from '@/types/auth';

/**
 * チェーン切り替え履歴エントリ
 */
interface ChainSwitchHistoryEntry {
	from: SelectableChainId | null;
	to: SelectableChainId;
	success: boolean;
	timestamp: Date;
	duration: number;
	error?: string;
}

/**
 * チェーン選択の統計情報
 */
interface ChainSwitchStats {
	totalSwitches: number;
	successfulSwitches: number;
	failedSwitches: number;
	averageSwitchTime: number;
	successRate: number;
	mostUsedChain: SelectableChainId | null;
	fastestSwitch: number;
	slowestSwitch: number;
}

/**
 * チェーン選択の設定オプション
 */
interface ChainSelectionOptions {
	// 初期設定
	defaultChain?: SelectableChainId;
	availableChains?: SelectableChainId[];

	// 動作設定
	autoDetectChain?: boolean;
	enableSwitchHistory?: boolean;
	maxHistoryEntries?: number;

	// コールバック
	onChainSelected?: (chainId: SelectableChainId, chain: SelectableChain) => void;
	onChainSwitchStart?: (chainId: SelectableChainId) => void;
	onChainSwitchComplete?: (chainId: SelectableChainId, duration: number) => void;
	onChainSwitchError?: (error: string, chainId: SelectableChainId) => void;

	// デバッグ
	enableLogging?: boolean;
}

/**
 * 完成版のチェーン選択カスタムフック
 */
export const useChainSelection = (
	evmWalletChainId?: number,
	evmWalletConnected?: boolean,
	evmWalletSwitchChain?: (chainId: number) => Promise<void>,
	emitEvent?: (type: AuthEventType, data?: any) => void,
	options: ChainSelectionOptions = {}
) => {
	// デフォルトオプション
	const {
		defaultChain,
		availableChains = ['sepolia', 'avalanche-fuji'],
		autoDetectChain = true,
		enableSwitchHistory = true,
		maxHistoryEntries = 20,
		onChainSelected,
		onChainSwitchStart,
		onChainSwitchComplete,
		onChainSwitchError,
		enableLogging = process.env.NODE_ENV === 'development',
	} = options;

	// 基本状態
	const [selectedChain, setSelectedChain] = useState<SelectableChainId | null>(defaultChain || null);
	const [supportedChains] = useState<SelectableChain[]>(
		testnetUtils.getAllSupportedChains().filter(chain =>
			availableChains.includes(chain.id)
		)
	);
	const [chainSwitchInProgress, setChainSwitchInProgress] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(false);

	// 履歴とタイマー管理
	const [chainSwitchHistory, setChainSwitchHistory] = useState<ChainSwitchHistoryEntry[]>([]);
	const switchTimerRef = useRef<{ start: number; chainId: SelectableChainId } | null>(null);
	const retryCountRef = useRef<Map<SelectableChainId, number>>(new Map());

	// ログ出力
	const log = useCallback((message: string, data?: any) => {
		if (enableLogging) {
			console.log(`🔗 [ChainSelection] ${message}`, data || '');
		}
	}, [enableLogging]);

	// エラー処理
	const handleError = useCallback((error: string | Error, chainId?: SelectableChainId) => {
		const errorMessage = error instanceof Error ? error.message : error;
		setError(errorMessage);

		if (chainId && onChainSwitchError) {
			onChainSwitchError(errorMessage, chainId);
		}

		log(`❌ Error: ${errorMessage}`, { chainId });
	}, [onChainSwitchError, log]);

	// エラークリア
	const clearError = useCallback(() => {
		setError(null);
	}, []);

	// 現在のウォレットのチェーンIDから選択されたチェーンを推測
	useEffect(() => {
		if (autoDetectChain && evmWalletChainId && evmWalletConnected) {
			const currentChain = testnetUtils.getChainByWagmiId(evmWalletChainId);
			if (currentChain && !selectedChain && availableChains.includes(currentChain.id)) {
				setSelectedChain(currentChain.id);
				log(`Auto-detected chain: ${currentChain.displayName} (${evmWalletChainId})`);

				if (onChainSelected) {
					onChainSelected(currentChain.id, currentChain);
				}
			}
		}
	}, [evmWalletChainId, evmWalletConnected, selectedChain, autoDetectChain, availableChains, onChainSelected, log]);

	// 履歴エントリの追加
	const addHistoryEntry = useCallback((entry: ChainSwitchHistoryEntry) => {
		if (!enableSwitchHistory) return;

		setChainSwitchHistory(prev => {
			const newHistory = [entry, ...prev].slice(0, maxHistoryEntries);
			log(`Added history entry: ${entry.from} → ${entry.to} (${entry.success ? 'success' : 'failed'})`, {
				duration: entry.duration,
				error: entry.error
			});
			return newHistory;
		});
	}, [enableSwitchHistory, maxHistoryEntries, log]);

	// チェーン選択（基本）
	const selectChain = useCallback(async (chainId: SelectableChainId): Promise<boolean> => {
		try {
			clearError();
			log(`Selecting chain: ${chainId}`);

			// バリデーション
			if (!availableChains.includes(chainId)) {
				throw new Error(`Chain ${chainId} is not in available chains`);
			}

			const chain = testnetUtils.getChainById(chainId);
			if (!chain || !chain.isSupported) {
				throw new Error(`Chain ${chainId} is not supported`);
			}

			// 詳細バリデーション
			const validation = ChainSelectionUtils.validateChain(chainId, {
				strict: true,
				checkWalletSupport: true,
				warningLevel: 'basic',
			});

			if (!validation.isValid) {
				throw new Error(`Chain validation failed: ${validation.errors.join(', ')}`);
			}

			// 状態を更新
			const previousChain = selectedChain;
			setSelectedChain(chainId);

			// イベント発火
			emitEvent?.('chain-selected', {
				chainId,
				chain,
				previousChain
			});

			// コールバック実行
			if (onChainSelected) {
				onChainSelected(chainId, chain);
			}

			log(`✅ Chain selected: ${chain.displayName}`);
			return true;

		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Chain selection failed';
			handleError(errorMessage, chainId);
			return false;
		}
	}, [availableChains, selectedChain, emitEvent, onChainSelected, clearError, handleError, log]);

	// チェーン切り替え（上級）
	const switchToChain = useCallback(async (
		chainId: SelectableChainId,
		options: {
			forceSwitch?: boolean;
			retryOnFailure?: boolean;
			maxRetries?: number;
		} = {}
	): Promise<boolean> => {
		const { forceSwitch = false, retryOnFailure = true, maxRetries = 3 } = options;

		if (chainSwitchInProgress) {
			log('🔄 Chain switch already in progress');
			return false;
		}

		// リトライ回数チェック
		const currentRetries = retryCountRef.current.get(chainId) || 0;
		if (retryOnFailure && currentRetries >= maxRetries) {
			const error = `Max retries (${maxRetries}) exceeded for chain ${chainId}`;
			handleError(error, chainId);
			return false;
		}

		const startTime = Date.now();
		setChainSwitchInProgress(true);
		setIsLoading(true);
		clearError();

		// タイマー開始
		switchTimerRef.current = { start: startTime, chainId };

		try {
			log(`🔄 Switching to chain: ${chainId}`, {
				forceSwitch,
				retryAttempt: currentRetries + 1
			});

			// チェーンバリデーション
			const chain = testnetUtils.getChainById(chainId);
			if (!chain || !chain.isSupported) {
				throw new Error(`Chain ${chainId} is not supported`);
			}

			// 既に同じチェーンの場合
			if (!forceSwitch && evmWalletChainId === chain.chainId) {
				log(`✅ Already on chain ${chain.displayName}`);
				await selectChain(chainId); // 状態を同期
				return true;
			}

			// ウォレット接続チェック
			if (!evmWalletConnected) {
				throw new Error('Wallet not connected');
			}

			if (!evmWalletSwitchChain) {
				throw new Error('Wallet switch function not available');
			}

			// 切り替え開始通知
			if (onChainSwitchStart) {
				onChainSwitchStart(chainId);
			}

			emitEvent?.('chain-switch-start', {
				chainId,
				targetChainId: chain.chainId
			});

			// Wagmiを使用してチェーン切り替え
			log(`🔄 Requesting chain switch to ${chain.chainId} via Wagmi...`);
			await evmWalletSwitchChain(chain.chainId);

			// 成功後の処理
			await selectChain(chainId);
			const switchDuration = Date.now() - startTime;

			// 履歴に記録
			addHistoryEntry({
				from: selectedChain,
				to: chainId,
				success: true,
				timestamp: new Date(),
				duration: switchDuration,
			});

			// リトライ回数リセット
			retryCountRef.current.delete(chainId);

			// 成功通知
			if (onChainSwitchComplete) {
				onChainSwitchComplete(chainId, switchDuration);
			}

			emitEvent?.('chain-switch-complete', {
				chainId,
				targetChainId: chain.chainId,
				duration: switchDuration
			});

			log(`✅ Chain switched successfully to ${chain.displayName} in ${switchDuration}ms`);
			return true;

		} catch (error) {
			const switchDuration = Date.now() - startTime;
			const errorMessage = error instanceof Error ? error.message : 'Chain switch failed';

			// リトライ回数を増加
			if (retryOnFailure) {
				retryCountRef.current.set(chainId, currentRetries + 1);
			}

			// 失敗履歴に記録
			addHistoryEntry({
				from: selectedChain,
				to: chainId,
				success: false,
				timestamp: new Date(),
				duration: switchDuration,
				error: errorMessage,
			});

			handleError(errorMessage, chainId);

			emitEvent?.('chain-switch-failed', {
				chainId,
				error: errorMessage,
				duration: switchDuration,
				retryCount: currentRetries + 1
			});

			// 自動リトライ
			if (retryOnFailure && currentRetries < maxRetries - 1) {
				log(`🔄 Retrying chain switch (${currentRetries + 2}/${maxRetries}) in 2 seconds...`);
				setTimeout(() => {
					switchToChain(chainId, options);
				}, 2000);
				return false;
			}

			return false;

		} finally {
			setChainSwitchInProgress(false);
			setIsLoading(false);
			switchTimerRef.current = null;
		}
	}, [
		chainSwitchInProgress,
		selectedChain,
		evmWalletConnected,
		evmWalletChainId,
		evmWalletSwitchChain,
		selectChain,
		emitEvent,
		onChainSwitchStart,
		onChainSwitchComplete,
		addHistoryEntry,
		handleError,
		clearError,
		log
	]);

	// 選択されたチェーンの取得
	const getSelectedChain = useCallback((): SelectableChain | null => {
		return selectedChain ? testnetUtils.getChainById(selectedChain) : null;
	}, [selectedChain]);

	// チェーンサポート確認
	const isChainSupported = useCallback((chainId: SelectableChainId): boolean => {
		return testnetUtils.isChainSupported(chainId) && availableChains.includes(chainId);
	}, [availableChains]);

	// チェーン選択のリセット
	const resetSelection = useCallback(() => {
		setSelectedChain(defaultChain || null);
		clearError();
		log('🔄 Chain selection reset', { defaultChain });
	}, [defaultChain, clearError, log]);

	// 履歴のクリア
	const clearHistory = useCallback(() => {
		setChainSwitchHistory([]);
		retryCountRef.current.clear();
		log('🗑️ Chain switch history cleared');
	}, [log]);

	// 統計情報の取得
	const getStats = useCallback((): ChainSwitchStats => {
		if (chainSwitchHistory.length === 0) {
			return {
				totalSwitches: 0,
				successfulSwitches: 0,
				failedSwitches: 0,
				averageSwitchTime: 0,
				successRate: 0,
				mostUsedChain: null,
				fastestSwitch: 0,
				slowestSwitch: 0
			};
		}

		const totalSwitches = chainSwitchHistory.length;
		const successfulSwitches = chainSwitchHistory.filter(entry => entry.success).length;
		const failedSwitches = totalSwitches - successfulSwitches;
		const successfulEntries = chainSwitchHistory.filter(entry => entry.success);

		const averageSwitchTime = successfulEntries.length > 0
			? successfulEntries.reduce((avg, entry) => avg + entry.duration, 0) / successfulEntries.length
			: 0;

		const successRate = totalSwitches > 0 ? successfulSwitches / totalSwitches : 0;

		// 最も使用されたチェーン
		const chainUsage = chainSwitchHistory.reduce((acc, entry) => {
			acc[entry.to] = (acc[entry.to] || 0) + 1;
			return acc;
		}, {} as Record<SelectableChainId, number>);

		const mostUsedChain = Object.entries(chainUsage).reduce((a, b) =>
			chainUsage[a[0] as SelectableChainId] > chainUsage[b[0] as SelectableChainId] ? a : b
		)?.[0] as SelectableChainId || null;

		const switchTimes = successfulEntries.map(entry => entry.duration);
		const fastestSwitch = switchTimes.length > 0 ? Math.min(...switchTimes) : 0;
		const slowestSwitch = switchTimes.length > 0 ? Math.max(...switchTimes) : 0;

		return {
			totalSwitches,
			successfulSwitches,
			failedSwitches,
			averageSwitchTime,
			successRate,
			mostUsedChain,
			fastestSwitch,
			slowestSwitch,
		};
	}, [chainSwitchHistory]);

	// 推奨チェーンの取得
	const getRecommendedChain = useCallback((): SelectableChain | null => {
		// 使用統計に基づく推奨
		const stats = getStats();
		if (stats.mostUsedChain) {
			return testnetUtils.getChainById(stats.mostUsedChain);
		}

		// デフォルト推奨（開発環境ではAvalanche優先）
		const recommendedId = process.env.NODE_ENV === 'development' ? 'avalanche-fuji' : 'sepolia';
		return availableChains.includes(recommendedId)
			? testnetUtils.getChainById(recommendedId)
			: supportedChains[0] || null;
	}, [getStats, availableChains, supportedChains]);

	// チェーン切り替えの強制停止
	const cancelSwitch = useCallback(() => {
		if (chainSwitchInProgress) {
			setChainSwitchInProgress(false);
			setIsLoading(false);
			switchTimerRef.current = null;
			log('⏹️ Chain switch cancelled');
		}
	}, [chainSwitchInProgress, log]);

	// デバッグ情報
	const getDebugInfo = useCallback(() => {
		return {
			selectedChain,
			supportedChains: supportedChains.map(c => c.id),
			availableChains,
			chainSwitchInProgress,
			isLoading,
			error,
			historyCount: chainSwitchHistory.length,
			retryCountsMap: Object.fromEntries(retryCountRef.current),
			currentTimer: switchTimerRef.current,
			stats: getStats(),
		};
	}, [
		selectedChain,
		supportedChains,
		availableChains,
		chainSwitchInProgress,
		isLoading,
		error,
		chainSwitchHistory.length,
		getStats
	]);

	return {
		// 基本状態
		selectedChain,
		supportedChains,
		chainSwitchInProgress,
		isLoading,
		error,

		// 基本アクション
		selectChain,
		switchToChain,
		resetSelection,
		clearError,
		cancelSwitch,

		// 高度なアクション
		clearHistory,

		// ヘルパー
		getSelectedChain,
		isChainSupported,
		getRecommendedChain,

		// 統計と履歴
		chainSwitchHistory,
		getStats,

		// デバッグ
		getDebugInfo,
	};
};
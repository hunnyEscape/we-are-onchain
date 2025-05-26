// src/auth/hooks/useChainSelectionState.ts
import { useState, useCallback, useEffect } from 'react';
import { SelectableChainId, SelectableChain } from '@/types/chain-selection';
import { testnetUtils } from '@/auth/config/testnet-chains';
import { AuthEventType } from '@/types/auth';

interface ChainSwitchHistoryEntry {
  from: SelectableChainId | null;
  to: SelectableChainId;
  success: boolean;
  timestamp: Date;
  duration: number;
}

/**
 * チェーン選択状態管理のカスタムフック
 */
export const useChainSelectionState = (
  evmWalletChainId?: number,
  evmWalletConnected?: boolean,
  emitEvent?: (type: AuthEventType, data?: any) => void
) => {
  const [selectedChain, setSelectedChain] = useState<SelectableChainId | null>(null);
  const [supportedChains] = useState<SelectableChain[]>(testnetUtils.getAllSupportedChains());
  const [chainSwitchInProgress, setChainSwitchInProgress] = useState(false);
  const [chainSwitchHistory, setChainSwitchHistory] = useState<ChainSwitchHistoryEntry[]>([]);

  // 現在のウォレットのチェーンIDから選択されたチェーンを推測
  useEffect(() => {
    if (evmWalletChainId && evmWalletConnected) {
      const currentChain = testnetUtils.getChainByWagmiId(evmWalletChainId);
      if (currentChain && !selectedChain) {
        setSelectedChain(currentChain.id);
        console.log(`🔗 Auto-detected chain: ${currentChain.displayName} (${evmWalletChainId})`);
      }
    }
  }, [evmWalletChainId, evmWalletConnected, selectedChain]);

  const selectChain = useCallback(async (chainId: SelectableChainId): Promise<{
    success: boolean;
    chain?: SelectableChain;
    switched?: boolean;
    error?: string;
  }> => {
    try {
      console.log(`🔗 Selecting chain: ${chainId}`);

      // チェーンが有効かチェック
      const chain = testnetUtils.getChainById(chainId);
      if (!chain || !chain.isSupported) {
        throw new Error(`Chain ${chainId} is not supported`);
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

      console.log(`✅ Chain selected: ${chain.displayName}`);
      return {
        success: true,
        chain,
        switched: false,
        error: undefined
      };

    } catch (error) {
      console.error('❌ Chain selection failed:', error);
      return {
        success: false,
        chain: undefined,
        switched: false,
        error: error instanceof Error ? error.message : 'Chain selection failed'
      };
    }
  }, [selectedChain, emitEvent]);

  const switchToChain = useCallback(async (
    chainId: SelectableChainId,
    evmWalletSwitchChain?: (chainId: number) => Promise<void>
  ): Promise<boolean> => {
    if (chainSwitchInProgress) {
      console.warn('🔄 Chain switch already in progress');
      return false;
    }

    const startTime = Date.now();
    setChainSwitchInProgress(true);

    try {
      console.log(`🔄 Switching to chain: ${chainId}`);

      // チェーンが有効かチェック
      const chain = testnetUtils.getChainById(chainId);
      if (!chain || !chain.isSupported) {
        throw new Error(`Chain ${chainId} is not supported`);
      }

      // 既に同じチェーンの場合
      if (evmWalletChainId === chain.chainId) {
        console.log(`✅ Already on chain ${chain.displayName}`);
        await selectChain(chainId); // 状態を同期
        return true;
      }

      // ウォレットが接続されているかチェック
      if (!evmWalletConnected) {
        throw new Error('Wallet not connected');
      }

      // Wagmiを使用してチェーン切り替え
      console.log(`🔄 Requesting chain switch to ${chain.chainId} via Wagmi...`);
      
      emitEvent?.('chain-switch-start', { 
        chainId, 
        targetChainId: chain.chainId 
      });

      if (evmWalletSwitchChain) {
        await evmWalletSwitchChain(chain.chainId);
      }

      // 切り替え成功時の処理
      await selectChain(chainId);

      const switchDuration = Date.now() - startTime;

      // デバッグ履歴に記録
      setChainSwitchHistory(prev => [
        ...prev.slice(-9), // 最新10件を保持
        {
          from: selectedChain,
          to: chainId,
          success: true,
          timestamp: new Date(),
          duration: switchDuration,
        }
      ]);

      emitEvent?.('chain-switch-complete', { 
        chainId, 
        targetChainId: chain.chainId,
        duration: switchDuration
      });

      console.log(`✅ Chain switched successfully to ${chain.displayName} in ${switchDuration}ms`);
      return true;

    } catch (error) {
      const switchDuration = Date.now() - startTime;

      // 失敗時もデバッグ履歴に記録
      setChainSwitchHistory(prev => [
        ...prev.slice(-9),
        {
          from: selectedChain,
          to: chainId,
          success: false,
          timestamp: new Date(),
          duration: switchDuration,
        }
      ]);

      console.error(`❌ Chain switch failed:`, error);

      emitEvent?.('chain-switch-failed', { 
        chainId, 
        error: error instanceof Error ? error.message : 'Switch failed',
        duration: switchDuration
      });

      return false;

    } finally {
      setChainSwitchInProgress(false);
    }
  }, [
    chainSwitchInProgress, 
    selectedChain, 
    evmWalletConnected, 
    evmWalletChainId, 
    selectChain, 
    emitEvent
  ]);

  const getSelectedChain = useCallback((): SelectableChain | null => {
    return selectedChain ? testnetUtils.getChainById(selectedChain) : null;
  }, [selectedChain]);

  const isChainSupported = useCallback((chainId: SelectableChainId): boolean => {
    return testnetUtils.isChainSupported(chainId);
  }, []);

  const resetChainSelection = useCallback(() => {
    setSelectedChain(null);
    console.log('🔄 Chain selection reset');
  }, []);

  // 統計情報
  const getChainSwitchStats = useCallback(() => {
    if (chainSwitchHistory.length === 0) {
      return { 
        averageSwitchTime: 0, 
        successRate: 0, 
        totalSwitches: 0 
      };
    }

    const totalSwitches = chainSwitchHistory.length;
    const successfulSwitches = chainSwitchHistory.filter(entry => entry.success).length;
    const averageSwitchTime = chainSwitchHistory.reduce((avg, entry) => avg + entry.duration, 0) / totalSwitches;

    return {
      averageSwitchTime,
      successRate: successfulSwitches / totalSwitches,
      totalSwitches,
    };
  }, [chainSwitchHistory]);

  return {
    // 状態
    selectedChain,
    supportedChains,
    chainSwitchInProgress,
    chainSwitchHistory,
    
    // アクション
    selectChain,
    switchToChain,
    getSelectedChain,
    isChainSupported,
    resetChainSelection,
    
    // 統計
    getChainSwitchStats,
  };
};
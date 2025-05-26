// src/auth/utils/chain-utils.ts
import { 
  SelectableChain, 
  SelectableChainId, 
  ChainSwitchResult, 
  ChainCompatibility,
  ChainSelectionValidation 
} from '@/types/chain-selection';
import { testnetUtils, TESTNET_CHAIN_MAP } from '@/auth/config/testnet-chains';
import { ChainType } from '@/types/wallet';

/**
 * チェーン操作とバリデーション用のユーティリティ関数
 */

// エラータイプの定義
export type ChainUtilError = 
  | 'CHAIN_NOT_SUPPORTED'
  | 'WALLET_NOT_CONNECTED'
  | 'USER_REJECTED'
  | 'NETWORK_ERROR'
  | 'INVALID_CHAIN_ID'
  | 'SWITCH_FAILED'
  | 'UNKNOWN_ERROR';

// チェーン切り替えのオプション
export interface ChainSwitchOptions {
  // 動作設定
  forceSwitch?: boolean;
  skipConfirmation?: boolean;
  
  // 失敗時の設定
  retryCount?: number;
  retryDelay?: number; // milliseconds
  
  // UI設定
  showProgress?: boolean;
  showNotification?: boolean;
  
  // コールバック
  onProgress?: (step: string, progress: number) => void;
  onSuccess?: (result: ChainSwitchResult) => void;
  onError?: (error: string) => void;
}

// バリデーションオプション
export interface ValidationOptions {
  // 厳密性
  strict?: boolean;
  
  // チェック項目
  checkWalletSupport?: boolean;
  checkNetworkConnectivity?: boolean;
  checkFeatureSupport?: boolean;
  
  // 警告レベル
  warningLevel?: 'none' | 'basic' | 'detailed';
}

/**
 * チェーン選択の主要ユーティリティクラス
 */
export class ChainSelectionUtils {
  // 現在選択されているチェーンの状態
  private static currentChain: SelectableChainId | null = null;
  private static lastSwitchTime: number = 0;
  
  /**
   * チェーンの基本バリデーション
   */
  static validateChain(chainId: SelectableChainId, options: ValidationOptions = {}): ChainSelectionValidation {
    const {
      strict = false,
      checkWalletSupport = true,
      checkNetworkConnectivity = false,
      warningLevel = 'basic'
    } = options;

    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: ChainSelectionValidation['suggestions'] = [];

    // 基本的なチェーン存在確認
    const chain = testnetUtils.getChainById(chainId);
    if (!chain) {
      errors.push(`Chain ${chainId} is not defined`);
      return { isValid: false, errors, warnings, suggestions };
    }

    // サポート状況確認
    if (!chain.isSupported) {
      errors.push(`Chain ${chainId} is not currently supported`);
      suggestions.push({
        type: 'configuration',
        message: 'This chain may be supported in future versions',
      });
    }

    // テストネット確認
    if (!chain.isTestnet && process.env.NODE_ENV === 'development') {
      if (strict) {
        errors.push('Mainnet chains are not allowed in development environment');
      } else {
        warnings.push('Using mainnet chain in development environment');
      }
    }

    // ネットワーク接続確認（オプション）
    if (checkNetworkConnectivity) {
      // 実際のネットワーク確認は非同期になるため、ここでは基本チェックのみ
      if (!chain.network.rpcUrl) {
        errors.push('No RPC URL configured for this chain');
      }
    }

    // ウォレットサポート確認
    if (checkWalletSupport) {
      const compatibility = this.getChainCompatibility(chainId);
      if (!compatibility.isSupported) {
        warnings.push('Limited wallet support for this chain');
        suggestions.push({
          type: 'userAction',
          message: 'Consider using a different wallet or browser',
        });
      }
    }

    // 警告レベルに応じた追加チェック
    if (warningLevel === 'detailed') {
      // ブロック時間の警告
      if (chain.metadata.averageBlockTime > 15) {
        warnings.push('This chain has slower block times (>15s)');
      }

      // 確認数の警告
      if (chain.metadata.confirmations > 10) {
        warnings.push('This chain requires many confirmations for safety');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions,
    };
  }

  /**
   * チェーン互換性の確認
   */
  static getChainCompatibility(chainId: SelectableChainId): ChainCompatibility {
    const chain = testnetUtils.getChainById(chainId);
    
    if (!chain) {
      return {
        chainId,
        isSupported: false,
        features: {
          walletConnect: false,
          metamask: false,
          eip1559: false,
          contracts: false,
        },
        limitations: ['Chain not found'],
        recommendations: {},
      };
    }

    // ブラウザ環境の確認
    const hasMetaMask = typeof window !== 'undefined' && 
      typeof (window as any).ethereum !== 'undefined';
    
    // 機能サポートの確認
    const features = {
      walletConnect: true, // WalletConnectは基本的に全チェーンサポート
      metamask: hasMetaMask,
      eip1559: chain.chainId === 11155111, // Sepoliaのみ
      contracts: true, // EVMチェーンは基本的にサポート
    };

    const limitations: string[] = [];
    
    if (!hasMetaMask) {
      limitations.push('MetaMask not detected');
    }
    
    if (chain.metadata.averageBlockTime > 10) {
      limitations.push('Slower transaction confirmation');
    }

    const recommendations: ChainCompatibility['recommendations'] = {};
    
    if (chain.id === 'avalanche-fuji') {
      recommendations.gasPrice = 'auto';
      recommendations.gasLimit = 2000000;
      recommendations.priority = 'speed';
    } else if (chain.id === 'sepolia') {
      recommendations.gasPrice = 'auto';
      recommendations.gasLimit = 21000;
      recommendations.priority = 'cost';
    }

    return {
      chainId,
      isSupported: chain.isSupported && features.metamask,
      features,
      limitations,
      recommendations,
    };
  }

  /**
   * チェーン間の比較
   */
  static compareChains(
    chainA: SelectableChainId, 
    chainB: SelectableChainId
  ): {
    speed: 'A' | 'B' | 'equal';
    cost: 'A' | 'B' | 'equal';
    features: 'A' | 'B' | 'equal';
    recommendation: SelectableChainId;
  } {
    const chainDataA = testnetUtils.getChainById(chainA);
    const chainDataB = testnetUtils.getChainById(chainB);

    if (!chainDataA || !chainDataB) {
      throw new Error('Invalid chain IDs for comparison');
    }

    // 速度比較（ブロック時間）
    const speedComparison = 
      chainDataA.metadata.averageBlockTime < chainDataB.metadata.averageBlockTime ? 'A' :
      chainDataA.metadata.averageBlockTime > chainDataB.metadata.averageBlockTime ? 'B' : 'equal';

    // コスト比較（一般的にAvalancheの方が安い）
    const costComparison = chainA === 'avalanche-fuji' ? 'A' : 'B';

    // 機能比較
    const featuresComparison = 
      chainDataA.metadata.features.length > chainDataB.metadata.features.length ? 'A' :
      chainDataA.metadata.features.length < chainDataB.metadata.features.length ? 'B' : 'equal';

    // 総合推奨（開発環境ではAvalanche優先）
    const recommendation = process.env.NODE_ENV === 'development' ? 'avalanche-fuji' : 'sepolia';

    return {
      speed: speedComparison,
      cost: costComparison,
      features: featuresComparison,
      recommendation,
    };
  }

  /**
   * チェーン切り替えの実行
   */
  static async switchChain(
    chainId: SelectableChainId,
    wagmiSwitchChain: (params: { chainId: number }) => Promise<any>,
    options: ChainSwitchOptions = {}
  ): Promise<ChainSwitchResult> {
    const {
      forceSwitch = false,
      retryCount = 3,
      retryDelay = 1000,
      onProgress,
      onSuccess,
      onError,
    } = options;

    try {
      onProgress?.('Validating chain', 0);

      // チェーンバリデーション
      const validation = this.validateChain(chainId, { strict: true });
      if (!validation.isValid) {
        const errorMsg = `Chain validation failed: ${validation.errors.join(', ')}`;
        onError?.(errorMsg);
        return {
          success: false,
          error: errorMsg,
        };
      }

      const chain = testnetUtils.getChainById(chainId)!;
      const startTime = Date.now();

      onProgress?.('Switching to chain', 25);

      // 既に同じチェーンの場合はスキップ
      if (!forceSwitch && this.currentChain === chainId) {
        const result: ChainSwitchResult = {
          success: true,
          chainId: chain.chainId,
          details: {
            previousChain: chain.chainId,
            newChain: chain.chainId,
            switchTime: 0,
            requiresUserAction: false,
          },
        };
        onSuccess?.(result);
        return result;
      }

      onProgress?.('Requesting wallet switch', 50);

      // リトライロジック付きでチェーン切り替え実行
      let lastError: Error | null = null;
      
      for (let attempt = 0; attempt < retryCount; attempt++) {
        try {
          await wagmiSwitchChain({ chainId: chain.chainId });
          
          onProgress?.('Verifying switch', 75);

          // 切り替え成功
          const previousChain = this.currentChain;
          this.currentChain = chainId;
          this.lastSwitchTime = Date.now();

          onProgress?.('Switch completed', 100);

          const result: ChainSwitchResult = {
            success: true,
            chainId: chain.chainId,
            details: {
              previousChain: previousChain ? testnetUtils.getChainById(previousChain)?.chainId : undefined,
              newChain: chain.chainId,
              switchTime: Date.now() - startTime,
              requiresUserAction: attempt > 0,
            },
          };

          onSuccess?.(result);
          return result;

        } catch (error) {
          lastError = error as Error;
          
          if (attempt < retryCount - 1) {
            onProgress?.(`Retrying... (${attempt + 1}/${retryCount})`, 25 + (attempt * 15));
            await new Promise(resolve => setTimeout(resolve, retryDelay));
          }
        }
      }

      // すべてのリトライが失敗
      const errorType = this.classifyChainError(lastError);
      const errorMsg = `Chain switch failed after ${retryCount} attempts: ${lastError?.message || 'Unknown error'}`;
      
      onError?.(errorMsg);

      return {
        success: false,
        error: errorMsg,
        details: {
          previousChain: this.currentChain ? testnetUtils.getChainById(this.currentChain)?.chainId : undefined,
          switchTime: Date.now() - startTime,
          requiresUserAction: true,
        },
      };

    } catch (error) {
      const errorMsg = `Unexpected error during chain switch: ${error instanceof Error ? error.message : 'Unknown error'}`;
      onError?.(errorMsg);
      
      return {
        success: false,
        error: errorMsg,
      };
    }
  }

  /**
   * エラーの分類
   */
  private static classifyChainError(error: Error | null): ChainUtilError {
    if (!error) return 'UNKNOWN_ERROR';

    const message = error.message.toLowerCase();

    if (message.includes('user rejected') || message.includes('user denied')) {
      return 'USER_REJECTED';
    }
    
    if (message.includes('network') || message.includes('connection')) {
      return 'NETWORK_ERROR';
    }
    
    if (message.includes('unsupported') || message.includes('not supported')) {
      return 'CHAIN_NOT_SUPPORTED';
    }
    
    if (message.includes('wallet') || message.includes('not connected')) {
      return 'WALLET_NOT_CONNECTED';
    }
    
    if (message.includes('invalid') || message.includes('chain id')) {
      return 'INVALID_CHAIN_ID';
    }

    return 'SWITCH_FAILED';
  }

  /**
   * 現在のチェーン状態を取得
   */
  static getCurrentChain(): SelectableChainId | null {
    return this.currentChain;
  }

  /**
   * 最後の切り替え時刻を取得
   */
  static getLastSwitchTime(): number {
    return this.lastSwitchTime;
  }

  /**
   * チェーン状態をリセット
   */
  static resetChainState(): void {
    this.currentChain = null;
    this.lastSwitchTime = 0;
  }

  /**
   * デバッグ情報の取得
   */
  static getDebugInfo() {
    return {
      currentChain: this.currentChain,
      lastSwitchTime: this.lastSwitchTime,
      supportedChains: Object.keys(TESTNET_CHAIN_MAP),
      compatibility: Object.keys(TESTNET_CHAIN_MAP).map(chainId => ({
        chainId,
        compatibility: this.getChainCompatibility(chainId as SelectableChainId),
      })),
    };
  }
}

/**
 * 便利なヘルパー関数
 */

// チェーンの簡易バリデーション
export const isValidChain = (chainId: SelectableChainId): boolean => {
  return ChainSelectionUtils.validateChain(chainId).isValid;
};

// チェーン互換性の簡易チェック
export const isChainCompatible = (chainId: SelectableChainId): boolean => {
  return ChainSelectionUtils.getChainCompatibility(chainId).isSupported;
};

// 推奨チェーンの取得
export const getRecommendedChain = (availableChains: SelectableChainId[]): SelectableChainId => {
  // 開発環境では Avalanche 優先
  if (process.env.NODE_ENV === 'development' && availableChains.includes('avalanche-fuji')) {
    return 'avalanche-fuji';
  }
  
  // デフォルトは Sepolia
  if (availableChains.includes('sepolia')) {
    return 'sepolia';
  }
  
  // フォールバック
  return availableChains[0];
};

// チェーン選択のプリフライトチェック
export const preflightCheck = async (chainId: SelectableChainId): Promise<{
  canProceed: boolean;
  warnings: string[];
  blockers: string[];
}> => {
  const validation = ChainSelectionUtils.validateChain(chainId, {
    strict: false,
    checkWalletSupport: true,
    warningLevel: 'detailed',
  });

  const compatibility = ChainSelectionUtils.getChainCompatibility(chainId);

  return {
    canProceed: validation.isValid && compatibility.isSupported,
    warnings: validation.warnings,
    blockers: validation.errors,
  };
};

// エラーメッセージの人間読みやすい形式への変換
export const formatChainError = (error: ChainUtilError, chainId?: SelectableChainId): string => {
  const chainName = chainId ? testnetUtils.getDisplayName(chainId) : 'the selected network';
  
  switch (error) {
    case 'USER_REJECTED':
      return 'Connection was cancelled. Please try again and approve the network switch.';
    case 'CHAIN_NOT_SUPPORTED':
      return `${chainName} is not supported by your wallet.`;
    case 'WALLET_NOT_CONNECTED':
      return 'Please connect your wallet before switching networks.';
    case 'NETWORK_ERROR':
      return `Unable to connect to ${chainName}. Please check your internet connection.`;
    case 'INVALID_CHAIN_ID':
      return `Invalid network configuration for ${chainName}.`;
    case 'SWITCH_FAILED':
      return `Failed to switch to ${chainName}. Please try again.`;
    default:
      return 'An unexpected error occurred while switching networks.';
  }
};
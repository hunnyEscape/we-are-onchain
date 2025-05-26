// src/types/chain-selection.ts
/**
 * チェーン選択機能専用の型定義
 * EVM内でのテストネット選択をサポート
 */

// チェーン選択で使用するチェーンID
export type SelectableChainId = 'sepolia' | 'avalanche-fuji';

// チェーン選択UI用の基本情報
export interface SelectableChain {
  // 識別子
  id: SelectableChainId;
  chainId: number;
  
  // 表示情報
  name: string;
  displayName: string;
  description: string;
  
  // UI要素
  icon: string;
  colors: {
    primary: string;
    secondary: string;
  };
  
  // ネットワーク情報
  network: {
    rpcUrl: string;
    blockExplorer: string;
    faucetUrls: string[];
  };
  
  // 機能フラグ
  isTestnet: boolean;
  isSupported: boolean;
  
  // メタデータ
  metadata: {
    averageBlockTime: number; // seconds
    confirmations: number;
    gasTokenSymbol: string;
    features: string[];
  };
}

// チェーン選択の状態
export interface ChainSelectionState {
  // 現在の選択
  selectedChain: SelectableChainId | null;
  
  // UI状態
  isSelecting: boolean;
  isLoading: boolean;
  
  // エラー状態
  error: string | null;
  
  // 選択履歴
  lastSelected: SelectableChainId | null;
  selectionHistory: Array<{
    chainId: SelectableChainId;
    selectedAt: Date;
    success: boolean;
  }>;
}

// チェーン選択のアクション
export interface ChainSelectionActions {
  // チェーン選択
  selectChain: (chainId: SelectableChainId) => Promise<boolean>;
  
  // リセット
  resetSelection: () => void;
  clearError: () => void;
  
  // 状態取得
  getSelectedChain: () => SelectableChain | null;
  getSupportedChains: () => SelectableChain[];
  
  // バリデーション
  isChainSupported: (chainId: SelectableChainId) => boolean;
  canSelectChain: (chainId: SelectableChainId) => boolean;
}

// チェーン選択コンポーネントのプロパティ
export interface ChainSelectorProps {
  // 動作設定
  onChainSelect: (chain: SelectableChain) => void;
  onBack?: () => void;
  
  // 表示設定
  title?: string;
  description?: string;
  showBackButton?: boolean;
  
  // 制約
  allowedChains?: SelectableChainId[];
  disabledChains?: SelectableChainId[];
  
  // UI設定
  variant?: 'default' | 'compact' | 'detailed';
  columns?: 1 | 2;
  
  // 状態
  loading?: boolean;
  error?: string;
  
  // スタイル
  className?: string;
}

// 個別チェーンカードのプロパティ
export interface ChainCardProps {
  // チェーン情報
  chain: SelectableChain;
  
  // 状態
  isSelected?: boolean;
  isDisabled?: boolean;
  isLoading?: boolean;
  
  // イベント
  onClick: (chain: SelectableChain) => void;
  onInfoClick?: (chain: SelectableChain) => void;
  
  // 表示設定
  variant?: 'default' | 'compact' | 'detailed';
  showDescription?: boolean;
  showMetadata?: boolean;
  
  // スタイル
  className?: string;
}

// チェーン選択のコンテキスト
export interface ChainSelectionContext {
  // 状態
  state: ChainSelectionState;
  
  // アクション
  actions: ChainSelectionActions;
  
  // 設定
  config: {
    supportedChains: SelectableChain[];
    defaultChain: SelectableChainId | null;
    allowManualInput: boolean;
    maxSelectionHistory: number;
  };
  
  // イベント
  addEventListener: (
    event: 'chainSelected' | 'selectionFailed' | 'stateChanged',
    callback: (data: any) => void
  ) => () => void;
}

// チェーン切り替えの結果
export interface ChainSwitchResult {
  success: boolean;
  chainId?: number;
  error?: string;
  
  // 詳細情報
  details?: {
    previousChain?: number;
    newChain?: number;
    switchTime?: number;
    requiresUserAction?: boolean;
  };
}

// チェーン互換性チェック
export interface ChainCompatibility {
  chainId: SelectableChainId;
  isSupported: boolean;
  
  // 機能サポート
  features: {
    walletConnect: boolean;
    metamask: boolean;
    eip1559: boolean;
    contracts: boolean;
  };
  
  // 制限事項
  limitations: string[];
  
  // 推奨設定
  recommendations: {
    gasPrice?: string;
    gasLimit?: number;
    priority?: 'speed' | 'cost';
  };
}

// チェーン選択のバリデーション
export interface ChainSelectionValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  
  // 自動修正の提案
  suggestions: Array<{
    type: 'autoFix' | 'userAction' | 'configuration';
    message: string;
    action?: () => void;
  }>;
}

// エクスポート用のユーティリティ型
export type ChainSelectionEvent = 
  | { type: 'chainSelected'; payload: { chain: SelectableChain } }
  | { type: 'selectionFailed'; payload: { error: string; chainId: SelectableChainId } }
  | { type: 'stateChanged'; payload: { state: ChainSelectionState } };

// プリセット設定
export interface ChainSelectionPreset {
  name: string;
  description: string;
  chains: SelectableChainId[];
  defaultChain: SelectableChainId;
  
  // UI設定
  ui: {
    title: string;
    description: string;
    variant: ChainSelectorProps['variant'];
    columns: ChainSelectorProps['columns'];
  };
}

// デバッグ情報
export interface ChainSelectionDebugInfo {
  // 現在の状態
  currentState: ChainSelectionState;
  
  // 統計
  stats: {
    totalSelections: number;
    successfulSelections: number;
    failedSelections: number;
    averageSelectionTime: number;
  };
  
  // エラー履歴
  errorHistory: Array<{
    error: string;
    chainId: SelectableChainId;
    timestamp: Date;
    context: string;
  }>;
  
  // パフォーマンス
  performance: {
    lastSelectionTime: number;
    componentRenderCount: number;
    apiCallCount: number;
  };
}
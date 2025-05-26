// types/auth.ts (Extended対応版 + チェーン選択)
import { User as FirebaseUser } from 'firebase/auth';
import { FirestoreUser } from './user';
import { ExtendedFirestoreUser, WalletOperationResult } from './user-extended';
import { WalletConnection, WalletAuthResult, ChainType } from './wallet';

// チェーン選択関連のインポート
import { SelectableChainId, SelectableChain, ChainSelectionPreset } from './chain-selection';

// 統合認証方式
export type AuthMethod = 'firebase' | 'wallet' | 'hybrid';

// 統合認証状態（Extended対応）
export interface UnifiedAuthState {
	// 認証方式
	authMethod: AuthMethod;

	// Firebase認証
	firebaseUser: FirebaseUser | null;
	firebaseLoading: boolean;

	// Wallet認証
	walletConnection: WalletConnection | null;
	walletLoading: boolean;

	// Firestore統合（Extended対応）
	firestoreUser: ExtendedFirestoreUser | null; // ExtendedFirestoreUserに変更
	firestoreLoading: boolean;

	// 全体の状態
	isAuthenticated: boolean;
	isLoading: boolean;

	// エラー
	error: string | null;
}

// 認証設定
export interface AuthConfig {
	// 認証方式の優先順位
	preferredMethod: AuthMethod;

	// 各認証方式の有効/無効
	enableFirebase: boolean;
	enableWallet: boolean;

	// 自動ログイン
	autoConnect: boolean;

	// セッション管理
	sessionTimeout: number; // minutes

	// ウォレット設定
	walletConfig?: {
		enabledChains: ChainType[];
		preferredChain: ChainType;
	};
}

// ★ 新規追加: 認証フロー状態（チェーン選択対応）
export interface AuthFlowState {
	// 現在のステップ
	currentStep: 'idle' | 'chain-select' | 'connecting' | 'signing' | 'verifying' | 'success' | 'error';
	
	// 進捗状況（0-100）
	progress: number;
	
	// ステップ別の状態
	signatureRequired: boolean;
	verificationRequired: boolean;
	
	// ★ 新規追加: チェーン選択関連
	chainSelection?: {
		// 選択状態
		selectedChain: SelectableChainId | null;
		availableChains: SelectableChainId[];
		
		// 切り替え状態
		isSwitching: boolean;
		switchProgress: number;
		
		// エラー状態
		switchError: string | null;
		
		// 履歴
		selectionHistory: Array<{
			chainId: SelectableChainId;
			timestamp: Date;
			success: boolean;
		}>;
	};
	
	// ★ 新規追加: ステップ管理
	stepManagement?: {
		// ステップ履歴
		visitedSteps: AuthFlowState['currentStep'][];
		
		// ナビゲーション状態
		canGoBack: boolean;
		canSkipStep: boolean;
		
		// 自動進行設定
		autoAdvance: boolean;
		autoAdvanceDelay: number; // milliseconds
	};
	
	// 既存のフィールド（互換性維持）
	selectedChain?: ChainType;
	selectedWallet?: string;
}

// Extended認証アクション（チェーン選択対応）
export interface AuthActions {
	// Firebase認証
	signInWithEmail: (email: string, password: string) => Promise<void>;
	signUpWithEmail: (email: string, password: string) => Promise<void>;
	signInWithGoogle: () => Promise<void>;

	// Wallet認証
	connectWallet: (chainType?: ChainType, walletType?: string) => Promise<WalletConnection>;
	authenticateWallet: (chainType?: ChainType, address?: string) => Promise<WalletAuthResult>;
	switchWalletChain: (chainType: ChainType, chainId: number | string) => Promise<void>;

	// ★ 新規追加: チェーン選択アクション
	selectChain: (chainId: SelectableChainId) => Promise<{
		success: boolean;
		chain?: SelectableChain;
		switched?: boolean;
		error?: string;
	}>;
	
	switchToSelectedChain: (chainId: SelectableChainId) => Promise<{
		success: boolean;
		previousChain?: SelectableChainId;
		newChain?: SelectableChainId;
		error?: string;
	}>;
	
	resetChainSelection: () => void;
	
	// ★ 新規追加: フロー管理アクション
	setAuthStep: (step: AuthFlowState['currentStep']) => void;
	goBackStep: () => boolean;
	skipCurrentStep: () => boolean;
	resetAuthFlow: () => void;
	
	// ★ 新規追加: 認証フロー制御
	startChainSelection: (options?: {
		availableChains?: SelectableChainId[];
		defaultChain?: SelectableChainId;
	}) => void;
	
	completeChainSelection: (chainId: SelectableChainId) => Promise<void>;
	
	// 統合ログアウト
	logout: () => Promise<void>;

	// Extended プロフィール更新
	updateProfile: (data: Partial<ExtendedFirestoreUser>) => Promise<WalletOperationResult>;

	// Extended セッション管理
	refreshSession: () => Promise<void>;
}

// 認証イベント（チェーン選択対応）
export type AuthEventType =
	| 'firebase-login'
	| 'firebase-logout'
	| 'wallet-connect'
	| 'wallet-disconnect'
	| 'wallet-authenticate'
	| 'unified-login'
	| 'unified-logout'
	| 'profile-update'
	| 'error'
	// ★ 新規追加: チェーン選択イベント
	| 'chain-selected'
	| 'chain-switch-start'
	| 'chain-switch-complete'
	| 'chain-switch-failed'
	| 'chain-selection-reset'
	// ★ 新規追加: フローイベント
	| 'step-changed'
	| 'step-back'
	| 'step-skip'
	| 'flow-reset'
	| 'flow-complete';

export interface AuthEvent {
	type: AuthEventType;
	timestamp: Date;
	data?: any;
	error?: string;
}

// 認証モーダルのオプション設定（拡張版）
export interface AuthModalOptions {
	// 既存のオプション
	preferredChain?: ChainType;
	onSuccess?: (user: ExtendedFirestoreUser) => void;
	onError?: (error: any) => void; // AppError型参照を一時的に削除
	title?: string;
	redirectAfterSuccess?: string;
	autoClose?: boolean; // 成功時の自動クローズ
	
	// ★ 新規追加: チェーン選択機能
	showChainSelector?: boolean; // チェーン選択の表示
	
	// ★ 新規追加: チェーン選択の詳細設定
	chainSelection?: {
		// 利用可能なチェーン
		availableChains?: SelectableChainId[];
		
		// デフォルト選択チェーン
		defaultChain?: SelectableChainId;
		
		// UI設定
		variant?: 'default' | 'compact' | 'detailed';
		columns?: 1 | 2;
		
		// 動作設定
		allowChainSwitch?: boolean;
		requireChainSwitch?: boolean;
		
		// プリセット使用
		preset?: string; // プリセット名
		
		// カスタマイズ
		customTitle?: string;
		customDescription?: string;
		
		// コールバック
		onChainSelect?: (chainId: SelectableChainId) => void;
		onChainSwitchStart?: (chainId: SelectableChainId) => void;
		onChainSwitchComplete?: (chainId: SelectableChainId) => void;
		onChainSwitchError?: (error: string, chainId: SelectableChainId) => void;
	};
	
	// ★ 新規追加: ステップ管理
	step?: {
		// 初期ステップ
		initialStep?: 'chain-select' | 'wallet-connect' | 'wallet-sign';
		
		// ステップスキップ設定
		skipChainSelection?: boolean;
		skipWalletConnection?: boolean;
		
		// ステップ間の動作
		allowStepBack?: boolean;
		showStepProgress?: boolean;
		
		// ステップ別のタイトル
		stepTitles?: {
			chainSelect?: string;
			walletConnect?: string;
			walletSign?: string;
			success?: string;
			error?: string;
		};
	};
	
	// ★ 新規追加: 高度な設定
	advanced?: {
		// デバッグモード
		debugMode?: boolean;
		
		// 実験的機能
		experimentalFeatures?: string[];
		
		// パフォーマンス設定
		enablePreloading?: boolean;
		cacheChainData?: boolean;
		
		// アクセシビリティ
		reducedMotion?: boolean;
		highContrast?: boolean;
		
		// 分析
		trackingEnabled?: boolean;
		analyticsId?: string;
	};
}

// Extended認証フック用の戻り値
export interface UseAuthReturn extends UnifiedAuthState, AuthActions {
	// 便利なゲッター
	primaryUserId: string | null;
	displayName: string | null;
	emailAddress: string | null;
	walletAddress: string | null;

	// 状態チェック
	isFirebaseAuth: boolean;
	isWalletAuth: boolean;
	hasMultipleAuth: boolean;

	// イベント
	addEventListener: (type: AuthEventType, callback: (event: AuthEvent) => void) => () => void;
}

// ウォレット接続結果
export interface WalletConnectionResult {
	success: boolean;
	connection?: WalletConnection;
	error?: string;
}

// 認証統合結果（Extended対応）
export interface AuthIntegrationResult {
	success: boolean;
	authMethod: AuthMethod;
	firebaseUser?: FirebaseUser;
	walletConnection?: WalletConnection;
	firestoreUser?: ExtendedFirestoreUser; // ExtendedFirestoreUserに変更
	error?: string;
}

// Firebase + Wallet統合データ（Extended対応）
export interface IntegratedUserData {
	// Firebase認証データ
	firebaseUid?: string;
	email?: string;
	emailVerified?: boolean;

	// Extended Wallet認証データ
	connectedWallets: WalletConnection[];
	primaryWallet?: WalletConnection;

	// Extended認証履歴
	authHistory: Array<{
		method: AuthMethod;
		timestamp: Date;
		chainType?: ChainType;
		success: boolean;
		ipAddress?: string;
		userAgent?: string;
	}>;

	// Extended設定
	preferences: {
		preferredAuthMethod: AuthMethod;
		autoConnect: boolean;
		preferredChain?: ChainType;
	};

	// Extended セキュリティ設定
	securitySettings: {
		requireSignatureForUpdates: boolean;
		allowedChains: ChainType[];
		maxSessionDuration: number;
	};

	// Extended 通知設定
	notificationSettings: {
		email: boolean;
		push: boolean;
		sms: boolean;
		newOrders: boolean;
		priceAlerts: boolean;
		securityAlerts: boolean;
	};
}

// Extended認証プロバイダーのProps
export interface UnifiedAuthProviderProps {
	children: React.ReactNode;
	config?: Partial<AuthConfig>;
}

// Extended認証コンテキストの型
export interface UnifiedAuthContextType extends UseAuthReturn {
	// 設定
	config: AuthConfig;

	// Extended状態
	extendedUser: ExtendedFirestoreUser | null;
	authFlowState: AuthFlowState; // 型を更新

	// Extended操作
	refreshExtendedUser: () => Promise<void>;
	getAuthHistory: () => any[] | null;
	getConnectedWallets: () => WalletConnection[] | null;
	updateUserProfile: (profileData: any) => Promise<WalletOperationResult>;

	// 内部状態
	_internal?: {
		eventEmitter: EventTarget;
		sessionStorage: Map<string, any>;
	};

	// デバッグ情報
	_debug: {
		firebaseReady: boolean;
		walletReady: boolean;
		lastError: string | null;
		apiCalls: number;
		lastApiCall: Date | null;
	};
}

// 後方互換性のための従来の型（非推奨）
export interface LegacyAuthActions {
	updateProfile: (data: Partial<FirestoreUser>) => Promise<void>;
}

// Extended専用のヘルパー型
export interface ExtendedAuthHelpers {
	// Extended ユーザー操作
	getExtendedUserStats: () => ExtendedFirestoreUser['stats'] | null;
	getExtendedUserSecurity: () => ExtendedFirestoreUser['securitySettings'] | null;
	getExtendedUserNotifications: () => ExtendedFirestoreUser['notificationSettings'] | null;
	
	// Extended Wallet操作
	addWalletConnection: (connection: WalletConnection) => Promise<WalletOperationResult>;
	removeWalletConnection: (address: string) => Promise<WalletOperationResult>;
	setPrimaryWallet: (address: string) => Promise<WalletOperationResult>;
	
	// Extended 設定操作
	updateSecuritySettings: (settings: Partial<ExtendedFirestoreUser['securitySettings']>) => Promise<WalletOperationResult>;
	updateNotificationSettings: (settings: Partial<ExtendedFirestoreUser['notificationSettings']>) => Promise<WalletOperationResult>;
}
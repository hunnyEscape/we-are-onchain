// types/auth.ts (Extended対応版)
import { User as FirebaseUser } from 'firebase/auth';
import { FirestoreUser } from './user';
import { ExtendedFirestoreUser, WalletOperationResult } from './user-extended';
import { WalletConnection, WalletAuthResult, ChainType } from './wallet';

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

// Extended認証アクション
export interface AuthActions {
	// Firebase認証
	signInWithEmail: (email: string, password: string) => Promise<void>;
	signUpWithEmail: (email: string, password: string) => Promise<void>;
	signInWithGoogle: () => Promise<void>;

	// Wallet認証
	connectWallet: (chainType?: ChainType, walletType?: string) => Promise<WalletConnection>;
	authenticateWallet: (chainType?: ChainType) => Promise<WalletAuthResult>;
	switchWalletChain: (chainType: ChainType, chainId: number | string) => Promise<void>;

	// 統合ログアウト
	logout: () => Promise<void>;

	// Extended プロフィール更新（戻り値型を変更）
	updateProfile: (data: Partial<ExtendedFirestoreUser>) => Promise<WalletOperationResult>;

	// Extended セッション管理
	refreshSession: () => Promise<void>;
}

// 認証イベント
export type AuthEventType =
	| 'firebase-login'
	| 'firebase-logout'
	| 'wallet-connect'
	| 'wallet-disconnect'
	| 'wallet-authenticate'
	| 'unified-login'
	| 'unified-logout'
	| 'profile-update'
	| 'error';

export interface AuthEvent {
	type: AuthEventType;
	timestamp: Date;
	data?: any;
	error?: string;
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
	authFlowState: any; // AuthFlowState

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
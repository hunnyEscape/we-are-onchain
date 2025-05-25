// types/auth.ts
import { User as FirebaseUser } from 'firebase/auth';
import { FirestoreUser } from './user';
import { WalletConnection, WalletAuthResult, ChainType } from './wallet';

// 統合認証方式
export type AuthMethod = 'firebase' | 'wallet' | 'hybrid';

// 統合認証状態
export interface UnifiedAuthState {
	// 認証方式
	authMethod: AuthMethod;

	// Firebase認証
	firebaseUser: FirebaseUser | null;
	firebaseLoading: boolean;

	// Wallet認証
	walletConnection: WalletConnection | null;
	walletLoading: boolean;

	// Firestore統合
	firestoreUser: FirestoreUser | null;
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

// 認証アクション
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

	// プロフィール更新
	updateProfile: (data: Partial<FirestoreUser>) => Promise<void>;

	// セッション管理
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

// 認証フック用の戻り値
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

// 認証統合結果
export interface AuthIntegrationResult {
	success: boolean;
	authMethod: AuthMethod;
	firebaseUser?: FirebaseUser;
	walletConnection?: WalletConnection;
	firestoreUser?: FirestoreUser;
	error?: string;
}

// Firebase + Wallet統合データ
export interface IntegratedUserData {
	// Firebase認証データ
	firebaseUid?: string;
	email?: string;
	emailVerified?: boolean;

	// Wallet認証データ
	connectedWallets: WalletConnection[];
	primaryWallet?: WalletConnection;

	// 認証履歴
	authHistory: Array<{
		method: AuthMethod;
		timestamp: Date;
		chainType?: ChainType;
		success: boolean;
	}>;

	// 設定
	preferences: {
		preferredAuthMethod: AuthMethod;
		autoConnect: boolean;
		preferredChain?: ChainType;
	};
}

// 認証プロバイダーのProps
export interface UnifiedAuthProviderProps {
	children: React.ReactNode;
	config?: Partial<AuthConfig>;
}

// 認証コンテキストの型
export interface UnifiedAuthContextType extends UseAuthReturn {
	// 設定
	config: AuthConfig;

	// 内部状態
	_internal: {
		eventEmitter: EventTarget;
		sessionStorage: Map<string, any>;
	};
}
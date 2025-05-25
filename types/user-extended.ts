// types/user-extended.ts
import { Timestamp } from 'firebase/firestore';
import { FirestoreUser } from './user';
import { WalletConnection, ChainType, AuthMethod } from './wallet';

// 拡張されたFirestoreUser（Wallet認証対応）
export interface ExtendedFirestoreUser extends Omit<FirestoreUser, 'walletAddress'> {
	// 認証方式
	authMethod: AuthMethod;
	
	// マルチウォレット対応
	connectedWallets: WalletConnection[];
	primaryWallet?: WalletConnection;
	
	// 後方互換性のため残す（deprecatedとして扱う）
	walletAddress?: string;
	
	// 認証履歴
	authHistory: Array<{
		method: AuthMethod;
		timestamp: Timestamp;
		chainType?: ChainType;
		walletAddress?: string;
		success: boolean;
		ipAddress?: string;
	}>;
	
	// ユーザー設定
	preferences: {
		preferredAuthMethod: AuthMethod;
		autoConnectWallet: boolean;
		preferredChain?: ChainType;
		hideWalletAddress: boolean;
		notificationSettings: {
			walletConnection: boolean;
			newChainDetected: boolean;
			securityAlerts: boolean;
		};
	};
	
	// セキュリティ情報
	security: {
		lastPasswordChange?: Timestamp;
		twoFactorEnabled: boolean;
		trustedDevices: Array<{
			deviceId: string;
			deviceName: string;
			lastUsed: Timestamp;
			ipAddress: string;
		}>;
		suspiciousActivity: Array<{
			type: string;
			timestamp: Timestamp;
			details: any;
			resolved: boolean;
		}>;
	};
	
	// Wallet固有の統計
	walletStats?: {
		totalTransactions: number;
		totalGasSpent: number;
		chainsUsed: ChainType[];
		favoriteWallets: string[];
		firstWalletConnection: Timestamp;
	};
}

// ユーザー作成時のデータ（拡張版）
export interface CreateExtendedUserData extends Omit<ExtendedFirestoreUser, 'id' | 'createdAt' | 'updatedAt' | 'lastLoginAt'> {
	id: string;
	email: string;
	displayName: string;
	authMethod: AuthMethod;
	connectedWallets: WalletConnection[];
	authHistory: Array<{
		method: AuthMethod;
		timestamp: Timestamp;
		chainType?: ChainType;
		walletAddress?: string;
		success: boolean;
		ipAddress?: string;
	}>;
	preferences: ExtendedFirestoreUser['preferences'];
	security: ExtendedFirestoreUser['security'];
}

// プロフィール更新用（拡張版）
export interface UpdateExtendedUserProfile {
	displayName?: string;
	nickname?: string;
	profileImage?: string;
	address?: Partial<FirestoreUser['address']>;
	isProfileComplete?: boolean;
	
	// Wallet関連の更新
	connectedWallets?: WalletConnection[];
	primaryWallet?: WalletConnection;
	preferences?: Partial<ExtendedFirestoreUser['preferences']>;
	
	// セキュリティ設定の更新
	security?: Partial<ExtendedFirestoreUser['security']>;
}

// ウォレット操作の結果
export interface WalletOperationResult {
	success: boolean;
	walletConnection?: WalletConnection;
	error?: string;
	requiresVerification?: boolean;
}

// 認証統合の結果
export interface AuthIntegrationResult {
	success: boolean;
	user: ExtendedFirestoreUser;
	newUser: boolean;
	walletLinked: boolean;
	error?: string;
}

// ウォレット検証の状態
export interface WalletVerificationStatus {
	isVerified: boolean;
	verificationMethod: 'signature' | 'transaction' | 'none';
	verifiedAt?: Timestamp;
	verificationHash?: string;
}

// マルチウォレット管理
export interface MultiWalletConfig {
	maxWallets: number;
	requireVerification: boolean;
	allowDuplicateChains: boolean;
	autoSwitchToPrimary: boolean;
}

// ウォレット統計の詳細
export interface DetailedWalletStats {
	// 基本統計
	totalConnections: number;
	totalTransactions: number;
	totalGasSpent: number;
	
	// チェーン別統計
	chainStats: Record<ChainType, {
		connections: number;
		transactions: number;
		gasSpent: number;
		lastUsed: Timestamp;
	}>;
	
	// ウォレット別統計
	walletStats: Record<string, {
		connections: number;
		transactions: number;
		lastUsed: Timestamp;
		favoriteChains: ChainType[];
	}>;
	
	// 時系列データ
	timeSeriesData: Array<{
		date: Timestamp;
		connections: number;
		transactions: number;
		gasSpent: number;
	}>;
}

// 認証フロー状態
export interface AuthFlowState {
	currentStep: 'idle' | 'connecting' | 'signing' | 'verifying' | 'completing' | 'error';
	selectedChain?: ChainType;
	selectedWallet?: string;
	signatureRequired: boolean;
	verificationRequired: boolean;
	error?: string;
	progress: number; // 0-100
}

// Firestore用のヘルパー関数の型
export interface ExtendedUserHelpers {
	// ウォレット管理
	addWalletToUser: (userId: string, wallet: WalletConnection) => Promise<void>;
	removeWalletFromUser: (userId: string, walletAddress: string) => Promise<void>;
	setPrimaryWallet: (userId: string, walletAddress: string) => Promise<void>;
	verifyWallet: (userId: string, walletAddress: string, verificationData: any) => Promise<void>;
	
	// 認証履歴
	addAuthHistory: (userId: string, authEvent: ExtendedFirestoreUser['authHistory'][0]) => Promise<void>;
	
	// 統計更新
	updateWalletStats: (userId: string, stats: Partial<DetailedWalletStats>) => Promise<void>;
	
	// セキュリティ
	addTrustedDevice: (userId: string, device: ExtendedFirestoreUser['security']['trustedDevices'][0]) => Promise<void>;
	reportSuspiciousActivity: (userId: string, activity: ExtendedFirestoreUser['security']['suspiciousActivity'][0]) => Promise<void>;
}

// 移行用のヘルパー
export interface UserMigrationHelpers {
	// 既存ユーザーの拡張
	migrateExistingUser: (oldUser: FirestoreUser) => ExtendedFirestoreUser;
	
	// 既存walletAddressからconnectedWalletsへの移行
	migrateWalletAddress: (oldUser: FirestoreUser) => WalletConnection[];
	
	// デフォルト設定の生成
	generateDefaultPreferences: () => ExtendedFirestoreUser['preferences'];
	generateDefaultSecurity: () => ExtendedFirestoreUser['security'];
}
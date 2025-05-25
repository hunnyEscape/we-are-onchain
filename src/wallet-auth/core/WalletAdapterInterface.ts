// src/wallet-auth/core/WalletAdapterInterface.ts
import {
	ChainType,
	WalletConnection,
	WalletSignatureData,
	WalletAuthResult,
	WalletState,
	WalletError,
	ChainConfig,
	WalletProvider
} from '../../../types/wallet';

/**
 * 全チェーン共通のWallet Adapterインターフェース
 * 各チェーン（EVM、Solana、SUI）は、このインターフェースを実装する
 */
export interface WalletAdapter {
	// 基本情報
	readonly chainType: ChainType;
	readonly supportedWallets: WalletProvider[];
	readonly isSupported: boolean;

	// 状態管理
	getState(): WalletState;
	subscribe(callback: (state: WalletState) => void): () => void;

	// ウォレット接続
	connect(walletType?: string): Promise<WalletConnection>;
	disconnect(): Promise<void>;
	reconnect(): Promise<WalletConnection | null>;

	// ウォレット情報
	getAddress(): string | null;
	getChainId(): number | string | null;
	getWalletType(): string | null;
	isConnected(): boolean;

	// 署名機能
	signMessage(message: string): Promise<string>;
	signAuthMessage(nonce: string): Promise<WalletSignatureData>;

	// チェーン管理（対応している場合）
	switchChain?(chainId: number | string): Promise<void>;
	addChain?(chainConfig: ChainConfig): Promise<void>;
	getSupportedChains(): ChainConfig[];

	// ユーティリティ
	validateAddress(address: string): boolean;
	formatAddress(address: string): string;
	getExplorerUrl(address: string): string;
}

/**
 * Wallet認証サービスのインターフェース
 */
export interface WalletAuthService {
	// Nonce管理
	generateNonce(): string;
	validateNonce(nonce: string): boolean;
	storeNonce(address: string, nonce: string): void;
	clearNonce(address: string): void;

	// 認証メッセージ
	createAuthMessage(address: string, nonce: string, chainType: ChainType): string;
	parseAuthMessage(message: string): {
		address: string;
		nonce: string;
		timestamp: number;
		domain: string;
	} | null;

	// 署名検証
	verifySignature(
		signature: string,
		message: string,
		address: string,
		chainType: ChainType
	): Promise<boolean>;

	// 認証実行
	authenticate(adapter: WalletAdapter): Promise<WalletAuthResult>;
	logout(address: string): Promise<void>;

	// セッション管理
	createSession(authResult: WalletAuthResult): Promise<string>;
	validateSession(sessionToken: string): Promise<boolean>;
	refreshSession(sessionToken: string): Promise<string>;
	destroySession(sessionToken: string): Promise<void>;
}

/**
 * マルチチェーンウォレット管理のインターフェース
 */
export interface MultiChainWalletManager {
	// アダプター管理
	registerAdapter(adapter: WalletAdapter): void;
	getAdapter(chainType: ChainType): WalletAdapter | null;
	getSupportedChains(): ChainType[];

	// 接続管理
	connectWallet(chainType: ChainType, walletType?: string): Promise<WalletConnection>;
	disconnectWallet(chainType: ChainType): Promise<void>;
	disconnectAll(): Promise<void>;

	// 状態取得
	getConnectedWallets(): WalletConnection[];
	getPrimaryWallet(): WalletConnection | null;
	setPrimaryWallet(address: string, chainType: ChainType): Promise<void>;

	// 認証
	authenticateWallet(chainType: ChainType): Promise<WalletAuthResult>;
	isAuthenticated(chainType?: ChainType): boolean;

	// イベント
	subscribe(
		event: 'connect' | 'disconnect' | 'change' | 'error',
		callback: (data: any) => void
	): () => void;
}

/**
 * ウォレット設定管理のインターフェース
 */
export interface WalletConfigManager {
	// チェーン設定
	addChainConfig(chainType: ChainType, config: ChainConfig): void;
	getChainConfig(chainType: ChainType, chainId: number | string): ChainConfig | null;
	getAllChainConfigs(): Record<ChainType, ChainConfig[]>;

	// 優先設定
	setPreferredChain(chainType: ChainType): void;
	getPreferredChain(): ChainType;
	setPreferredWallet(chainType: ChainType, walletType: string): void;
	getPreferredWallet(chainType: ChainType): string | null;

	// 機能設定
	enableChain(chainType: ChainType, enabled: boolean): void;
	isChainEnabled(chainType: ChainType): boolean;
	setAutoConnect(enabled: boolean): void;
	isAutoConnectEnabled(): boolean;
}

/**
 * ウォレット検出のインターフェース
 */
export interface WalletDetector {
	// インストール検出
	detectInstalledWallets(chainType: ChainType): Promise<WalletProvider[]>;
	isWalletInstalled(chainType: ChainType, walletType: string): boolean;

	// 推奨ウォレット
	getRecommendedWallets(chainType: ChainType): WalletProvider[];
	getWalletDownloadUrl(chainType: ChainType, walletType: string): string | null;

	// ブラウザ互換性
	isBrowserSupported(): boolean;
	isMobileSupported(): boolean;
	isWalletAvailable(chainType: ChainType, walletType: string): boolean;
}

/**
 * エラーハンドリングのインターフェース
 */
export interface WalletErrorHandler {
	// エラー分類
	classifyError(error: any, chainType: ChainType): WalletError;

	// エラー処理
	handleConnectionError(error: WalletError): void;
	handleSignatureError(error: WalletError): void;
	handleChainError(error: WalletError): void;

	// エラー回復
	canRecover(error: WalletError): boolean;
	suggestRecovery(error: WalletError): string[];

	// ログ
	logError(error: WalletError, context?: string): void;
}

/**
 * ウォレット統計のインターフェース
 */
export interface WalletAnalytics {
	// 使用統計
	trackConnection(chainType: ChainType, walletType: string): void;
	trackDisconnection(chainType: ChainType, walletType: string): void;
	trackAuthentication(chainType: ChainType, success: boolean): void;
	trackError(error: WalletError): void;

	// 統計取得
	getConnectionStats(): Record<string, number>;
	getPopularWallets(): Array<{ chainType: ChainType; walletType: string; usage: number }>;
	getErrorRate(): number;

	// レポート
	generateReport(period: 'day' | 'week' | 'month'): any;
}
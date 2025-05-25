// types/wallet.ts
export type ChainType = 'evm' | 'solana' | 'sui';
export type WalletType = 'metamask' | 'walletconnect' | 'coinbase' | 'phantom' | 'solflare' | 'sui-wallet' | 'ethos';
export type AuthMethod = 'firebase' | 'wallet' | 'hybrid';

// 基本的なウォレット接続情報
export interface WalletConnection {
	address: string;
	chainType: ChainType;
	chainId?: number | string;
	walletType: string;
	isConnected: boolean;
	connectedAt?: Date;
	lastUsedAt?: Date;
}

// ウォレット認証で使用する署名データ
export interface WalletSignatureData {
	message: string;
	signature: string;
	address: string;
	chainType: ChainType;
	chainId?: number | string;
	nonce: string;
	timestamp: number;
}

// 認証結果
export interface WalletAuthResult {
	success: boolean;
	user?: {
		address: string;
		chainType: ChainType;
		chainId?: number | string;
	};
	error?: string;
	signature?: WalletSignatureData;
}

// ウォレット状態
export interface WalletState {
	isConnecting: boolean;
	isConnected: boolean;
	isAuthenticated: boolean;
	address?: string;
	chainType?: ChainType;
	chainId?: number | string;
	walletType?: string;
	error?: string;
}

// チェーン設定
export interface ChainConfig {
	chainId: number | string;
	name: string;
	nativeCurrency: {
		name: string;
		symbol: string;
		decimals: number;
	};
	rpcUrls: string[];
	blockExplorerUrls?: string[];
	iconUrls?: string[];
	isTestnet?: boolean;
}

// EVM固有の設定
export interface EVMChainConfig extends ChainConfig {
	chainId: number;
}

// Solana固有の設定
export interface SolanaChainConfig extends ChainConfig {
	chainId: string;
	cluster: 'mainnet-beta' | 'testnet' | 'devnet';
}

// SUI固有の設定
export interface SUIChainConfig extends ChainConfig {
	chainId: string;
	network: 'mainnet' | 'testnet' | 'devnet';
}

// サポートされているチェーンの設定
export interface SupportedChains {
	evm: EVMChainConfig[];
	solana: SolanaChainConfig[];
	sui: SUIChainConfig[];
}

// ウォレット機能
export interface WalletCapabilities {
	canSwitchChain: boolean;
	canAddChain: boolean;
	canSignMessage: boolean;
	canSignTransaction: boolean;
	supportsEIP1559: boolean; // EVM固有
}

// ウォレットプロバイダー情報
export interface WalletProvider {
	id: string;
	name: string;
	chainType: ChainType;
	icon?: string;
	downloadUrl?: string;
	isInstalled: boolean;
	capabilities: WalletCapabilities;
}

// 複数ウォレット管理用
export interface ConnectedWallet extends WalletConnection {
	id: string;
	isVerified: boolean;
	isPrimary: boolean;
	nickname?: string;
}

// ウォレット切り替え用
export interface WalletSwitchRequest {
	fromAddress: string;
	toAddress: string;
	chainType: ChainType;
	reason: string;
}

// 認証設定
export interface WalletAuthConfig {
	enabledChains: ChainType[];
	preferredChain: ChainType;
	authMessage: string;
	nonceExpiry: number; // seconds
	enableMultiWallet: boolean;
	autoConnect: boolean;
}

// エラー型
export interface WalletError {
	code: string;
	message: string;
	details?: any;
	chainType?: ChainType;
}

// ウォレット統計
export interface WalletStats {
	totalConnections: number;
	lastConnected: Date;
	connectionHistory: Array<{
		address: string;
		chainType: ChainType;
		connectedAt: Date;
		disconnectedAt?: Date;
	}>;
}
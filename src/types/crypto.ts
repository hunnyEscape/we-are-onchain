// types/crypto.ts
import { Timestamp } from 'firebase/firestore';

// Firestore crypto_prices コレクションの型定義
export interface FirestoreCryptoPriceData {
	id: string;
	symbol: string;
	name: string;
	price_usd: number;
	price_change_24h: number;
	price_change_percentage_24h: number;
	market_cap_usd: number;
	volume_24h_usd: number;
	last_updated: Timestamp;
	source: 'coingecko';
}

// フロントエンド用に変換された価格データ
export interface CryptoPriceData {
	id: string;
	symbol: string;
	name: string;
	price_usd: number;
	price_change_24h: number;
	price_change_percentage_24h: number;
	market_cap_usd: number;
	volume_24h_usd: number;
	last_updated: Date;
	source: string;
}

// 価格データのマップ型
export interface CryptoPricesMap {
	[symbol: string]: CryptoPriceData;
}

// 暗号通貨メタデータ
export interface CryptoMetadata {
	supported_currencies: string[];
	update_frequency_minutes: number;
	last_sync_timestamp: Timestamp;
	sync_status: 'success' | 'error' | 'in_progress';
	error_message?: string;
	coingecko_rate_limit_remaining?: number;
	total_api_calls_today?: number;
}

// サポートされている暗号通貨の設定
export const SUPPORTED_CRYPTOS = {
	BTC: {
		id: 'bitcoin',
		symbol: 'BTC',
		name: 'Bitcoin',
		icon: '₿',
		decimals: 6,
		color: '#F7931A'
	},
	ETH: {
		id: 'ethereum',
		symbol: 'ETH',
		name: 'Ethereum',
		icon: 'Ξ',
		decimals: 4,
		color: '#627EEA'
	},
	SOL: {
		id: 'solana',
		symbol: 'SOL',
		name: 'Solana',
		icon: '◎',
		decimals: 4,
		color: '#14F195'
	},
	AVAX: {
		id: 'avalanche-2',
		symbol: 'AVAX',
		name: 'Avalanche',
		icon: '🔺',
		decimals: 4,
		color: '#E84142'
	},
	SUI: {
		id: 'sui',
		symbol: 'SUI',
		name: 'Sui Network',
		icon: '💧',
		decimals: 4,
		color: '#4DA2FF'
	}
} as const;

export type SupportedCryptoSymbol = keyof typeof SUPPORTED_CRYPTOS;

// Firestore操作の結果型
export interface CryptoFetchResult {
	success: boolean;
	data?: CryptoPricesMap;
	error?: string;
	lastUpdated?: Date;
}

// 価格変換の結果型
export interface PriceConversionResult {
	originalAmount: number;
	originalCurrency: 'USD';
	convertedAmount: number;
	targetCurrency: string;
	exchangeRate: number;
	lastUpdated: Date;
}

// エラーハンドリング用の型
export interface CryptoError {
	code: 'fetch-failed' | 'conversion-failed' | 'unsupported-currency' | 'stale-data' | 'network-error';
	message: string;
	details?: any;
	timestamp: Date;
}

// ローディング状態の管理
export interface CryptoLoadingState {
	isLoading: boolean;
	isRefreshing: boolean;
	lastFetch: Date | null;
	retryCount: number;
	maxRetries: number;
}

// リアルタイム購読の設定
export interface CryptoSubscriptionOptions {
	enableRealtime: boolean;
	refreshInterval?: number; // milliseconds
	staleDataThreshold?: number; // milliseconds
	autoRetry: boolean;
	maxRetries?: number;
}

// デフォルトの設定値
export const CRYPTO_DEFAULTS = {
	REFRESH_INTERVAL: 30000, // 30秒
	STALE_DATA_THRESHOLD: 300000, // 5分
	MAX_RETRIES: 3,
	DECIMAL_PLACES: {
		BTC: 6,
		ETH: 4,
		SOL: 4,
		AVAX: 4,
		SUI: 4,
		USD: 2
	}
} as const;
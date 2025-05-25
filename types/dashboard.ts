// types/dashboard.ts
export type SectionType = 'shop' | 'how-to-buy' | 'purchase-scan' | 'whitepaper' | 'profile' | 'cart';

export interface DashboardState {
	activeSection: SectionType | null;
	isSlideOpen: boolean;
	cartItems: CartItem[];
	userProfile: UserProfile | null;
	walletConnected: boolean;
}

export interface DashboardCardProps {
	id: SectionType;
	title: string;
	description: string;
	icon: React.ReactNode;
	stats?: string;
	badge?: string;
	onClick: (section: SectionType) => void;
	className?: string;
}

export interface CartItem {
	id: string;
	name: string;
	price: number;
	quantity: number;
	currency: 'BTC' | 'ETH' | 'SOL' | 'AVAX' | 'SUI'; // 更新: 新しい暗号通貨に対応
	image?: string;
}

export interface UserProfile {
	walletAddress: string;
	displayName?: string;
	totalSpent: number;
	totalOrders: number;
	rank: number;
	badges: string[];
	joinDate: Date;
}

export interface SlideInPanelProps {
	isOpen: boolean;
	onClose: () => void;
	title: string;
	children: React.ReactNode;
	className?: string;
}

export interface PurchaseRecord {
	rank: number;
	walletAddress: string;
	displayAddress: string; // 部分匿名化されたアドレス
	totalSpent: number;
	totalSpentUSD: number;
	purchaseCount: number;
	lastPurchase: Date;
	txHashes: string[];
	badges?: string[];
	isCurrentUser?: boolean;
}

export interface FilterOptions {
	period: 'today' | 'week' | 'month' | 'all';
	minAmount?: number;
	maxAmount?: number;
	sortBy: 'amount' | 'count' | 'date';
	sortOrder: 'asc' | 'desc';
}

// 新規追加: 暗号通貨価格関連の型定義
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

export interface CryptoPricesMap {
	[symbol: string]: CryptoPriceData;
}

export interface UseCryptoPricesReturn {
	prices: CryptoPricesMap;
	loading: boolean;
	error: string | null;
	lastUpdated: Date | null;
	refreshPrices: () => void;
}

export interface UsePriceConverterReturn {
	convertUSDTo: (usdAmount: number, targetCurrency: string) => number;
	formatCryptoPrice: (amount: number, currency: string) => string;
	formatUSDPrice: (amount: number) => string;
	isSupported: (currency: string) => boolean;
	isLoading: boolean;
	error: string | null;
}

export interface PriceDisplayProps {
	usdAmount: number;
	selectedCurrency: string;
	showBoth?: boolean;
	showChange?: boolean;
	size?: 'sm' | 'md' | 'lg';
	className?: string;
}

// 支払い方法のマッピング
export const PAYMENT_METHODS = {
	SOL: { name: 'Solana', symbol: 'SOL', icon: '◎' },
	BTC: { name: 'Lightning', symbol: 'BTC', icon: '₿' },
	AVAX: { name: 'Avalanche c-chain', symbol: 'AVAX', icon: '🔺' },
	SUI: { name: 'Sui', symbol: 'SUI', icon: '💧' },
	ETH: { name: 'Ethereum mainnet', symbol: 'ETH', icon: 'Ξ' },
} as const;

export type PaymentMethodKey = keyof typeof PAYMENT_METHODS;
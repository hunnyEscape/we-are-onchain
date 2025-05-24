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
	currency: 'ETH' | 'USDC' | 'USDT';
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
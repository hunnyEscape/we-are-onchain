// types/user.ts
import { Timestamp } from 'firebase/firestore';
import { UserProfile } from './dashboard';

// Firestoreで管理するユーザーデータの型
export interface FirestoreUser {
	id: string;                    // Firebase Auth UID
	email: string;
	displayName: string;
	nickname?: string;             // ユーザーが設定可能なニックネーム
	profileImage?: string;
	walletAddress?: string;        // 将来のウォレット連携用

	// 住所情報（初期値：空）
	address?: {
		country?: string;
		prefecture?: string;          // 都道府県
		city?: string;               // 市区町村
		addressLine1?: string;       // 番地・建物名
		addressLine2?: string;      // アパート・部屋番号等
		postalCode?: string;         // 郵便番号
		phone?: string;
	};

	// アカウント情報
	createdAt: Timestamp;
	updatedAt: Timestamp;
	lastLoginAt: Timestamp;

	// ユーザーステータス
	isEmailVerified: boolean;
	isActive: boolean;
	membershipTier: 'bronze' | 'silver' | 'gold' | 'platinum';
	isProfileComplete: boolean;     // 住所等必須情報が入力済みか

	// 統計情報
	stats: {
		totalSpent: number;         // ETH（初期値：0）
		totalSpentUSD: number;      // USD（初期値：0）
		totalOrders: number;        // 初期値：0
		rank: number;               // 初期値：999999
		badges: string[];           // 初期値：['New Member']
	};
}

// 初期ユーザー作成用の型
export interface CreateUserData {
	id: string;
	email: string;
	displayName: string;
	nickname?: string;
	profileImage?: string;
	address?: {};
	isEmailVerified: boolean;
	isActive: true;
	membershipTier: 'bronze';
	isProfileComplete: false;
	stats: {
		totalSpent: 0;
		totalSpentUSD: 0;
		totalOrders: 0;
		rank: 999999;
		badges: ['New Member'];
	};
}

// プロフィール更新用の部分型
export interface UpdateUserProfile {
	displayName?: string;
	nickname?: string;
	profileImage?: string;
	address?: Partial<FirestoreUser['address']>;
	isProfileComplete?: boolean;
}

// ユーザー統計更新用の型
export interface UpdateUserStats {
	totalSpent?: number;
	totalSpentUSD?: number;
	totalOrders?: number;
	rank?: number;
	badges?: string[];
}

// 注文データの型
export interface Order {
	id: string;                   // 注文ID
	userId: string;               // ユーザーID（Firebase Auth UID）

	// 注文情報
	products: OrderItem[];
	totalAmount: number;          // ETH
	totalAmountUSD: number;
	status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';

	// ブロックチェーン情報
	transactionHash?: string;     // トランザクションハッシュ
	blockNumber?: number;
	networkId: number;            // 1 (Ethereum), 137 (Polygon) etc.

	// 配送情報
	shippingAddress: FirestoreUser['address'];
	trackingNumber?: string;

	// タイムスタンプ
	createdAt: Timestamp;
	updatedAt: Timestamp;
	shippedAt?: Timestamp;
	deliveredAt?: Timestamp;
}

export interface OrderItem {
	productId: string;
	productName: string;
	quantity: number;
	priceETH: number;
	priceUSD: number;
}

// 既存のUserProfileとFirestoreUserの変換用ヘルパー型
export interface UserProfileAdapter {
	fromFirestoreUser: (firestoreUser: FirestoreUser) => UserProfile;
	toFirestoreUser: (userProfile: UserProfile, userId: string, email: string) => Partial<FirestoreUser>;
}

// プロフィール完成度チェック用
export interface ProfileCompleteness {
	isComplete: boolean;
	completionPercentage: number;
	missingFields: string[];
	requiredFields: (keyof FirestoreUser)[];
}
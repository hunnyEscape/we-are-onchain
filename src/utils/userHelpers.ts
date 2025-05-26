// src/utils/userHelpers.ts
import { Timestamp } from 'firebase/firestore';
import { User as FirebaseUser } from 'firebase/auth';
import { FirestoreUser, ProfileCompleteness } from '@/types/user';
import { UserProfile } from '@/types/dashboard';

/**
 * FirestoreUserを既存のUserProfile形式に変換
 */
export const convertFirestoreUserToUserProfile = (firestoreUser: FirestoreUser): UserProfile => {
	return {
		walletAddress: firestoreUser.walletAddress || firestoreUser.id,
		displayName: firestoreUser.displayName,
		totalSpent: firestoreUser.stats.totalSpent,
		totalOrders: firestoreUser.stats.totalOrders,
		rank: firestoreUser.stats.rank,
		badges: firestoreUser.stats.badges,
		joinDate: firestoreUser.createdAt instanceof Timestamp
			? firestoreUser.createdAt.toDate()
			: new Date(firestoreUser.createdAt as any)
	};
};

/**
 * Firebase UserからFirestoreUser作成時の初期データを生成
 */
export const generateInitialUserData = (firebaseUser: FirebaseUser) => {
	return {
		id: firebaseUser.uid,
		email: firebaseUser.email || '',
		displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Anonymous User',
		nickname: firebaseUser.displayName || undefined,
		profileImage: firebaseUser.photoURL || undefined,
		address: {},
		isEmailVerified: firebaseUser.emailVerified,
		isActive: true as const,
		membershipTier: 'bronze' as const,
		isProfileComplete: false,
		stats: {
			totalSpent: 0,
			totalSpentUSD: 0,
			totalOrders: 0,
			rank: 999999,
			badges: ['New Member']
		}
	};
};

/**
 * プロフィール完成度を計算
 */
export const calculateProfileCompleteness = (user: FirestoreUser): ProfileCompleteness => {
	const requiredFields = [
		'displayName',
		'address.country',
		'address.prefecture',
		'address.city',
		'address.addressLine1',
		'address.postalCode'
	];

	const missingFields: string[] = [];
	let completedFields = 0;

	// 表示名チェック
	if (!user.displayName?.trim()) {
		missingFields.push('Display Name');
	} else {
		completedFields++;
	}

	// 住所情報チェック
	const addressFields = [
		{ key: 'country', label: 'Country' },
		{ key: 'prefecture', label: 'Prefecture' },
		{ key: 'city', label: 'City' },
		{ key: 'addressLine1', label: 'Address Line 1' },
		{ key: 'postalCode', label: 'Postal Code' }
	];

	addressFields.forEach(field => {
		const value = user.address?.[field.key as keyof typeof user.address];
		if (!value || !value.trim()) {
			missingFields.push(field.label);
		} else {
			completedFields++;
		}
	});

	const totalFields = requiredFields.length;
	const completionPercentage = Math.round((completedFields / totalFields) * 100);
	const isComplete = missingFields.length === 0;

	return {
		isComplete,
		completionPercentage,
		missingFields,
		requiredFields: requiredFields as (keyof FirestoreUser)[]
	};
};

/**
 * ユーザーの表示名を取得（フォールバック付き）
 */
export const getUserDisplayName = (
	firestoreUser?: FirestoreUser | null,
	firebaseUser?: FirebaseUser | null
): string => {
	if (firestoreUser?.nickname) return firestoreUser.nickname;
	if (firestoreUser?.displayName) return firestoreUser.displayName;
	if (firebaseUser?.displayName) return firebaseUser.displayName;
	if (firebaseUser?.email) return firebaseUser.email.split('@')[0];
	return 'Anonymous User';
};

/**
 * ユーザーのアバター画像URLを取得（フォールバック付き）
 */
export const getUserAvatarUrl = (
	firestoreUser?: FirestoreUser | null,
	firebaseUser?: FirebaseUser | null
): string | null => {
	if (firestoreUser?.profileImage) return firestoreUser.profileImage;
	if (firebaseUser?.photoURL) return firebaseUser.photoURL;
	return null;
};

/**
 * ユーザーのイニシャルを取得
 */
export const getUserInitials = (
	firestoreUser?: FirestoreUser | null,
	firebaseUser?: FirebaseUser | null
): string => {
	const displayName = getUserDisplayName(firestoreUser, firebaseUser);
	return displayName[0].toUpperCase();
};

/**
 * メンバーシップティアの表示用ラベルを取得
 */
export const getMembershipTierLabel = (tier: FirestoreUser['membershipTier']): string => {
	const labels = {
		bronze: '🥉 Bronze',
		silver: '🥈 Silver',
		gold: '🥇 Gold',
		platinum: '💎 Platinum'
	};
	return labels[tier];
};

/**
 * メンバーシップティアの色を取得
 */
export const getMembershipTierColor = (tier: FirestoreUser['membershipTier']): string => {
	const colors = {
		bronze: 'text-amber-600',
		silver: 'text-gray-400',
		gold: 'text-yellow-400',
		platinum: 'text-cyan-400'
	};
	return colors[tier];
};

/**
 * 統計データをフォーマット
 */
export const formatUserStats = (stats: FirestoreUser['stats']) => {
	return {
		totalSpentFormatted: `Ξ ${stats.totalSpent.toFixed(3)}`,
		totalSpentUSDFormatted: `$${stats.totalSpentUSD.toLocaleString()}`,
		rankFormatted: `#${stats.rank.toLocaleString()}`,
		badgeCount: stats.badges.length
	};
};

/**
 * 住所を1行のテキストにフォーマット
 */
export const formatAddress = (address?: FirestoreUser['address']): string => {
	if (!address) return 'No address provided';

	const parts = [
		address.addressLine1,
		address.addressLine2,
		address.city,
		address.prefecture,
		address.postalCode,
		address.country
	].filter(Boolean);

	return parts.length > 0 ? parts.join(', ') : 'No address provided';
};

/**
 * 日付をフォーマット
 */
export const formatDate = (timestamp: Timestamp | Date | string): string => {
	let date: Date;

	if (timestamp instanceof Timestamp) {
		date = timestamp.toDate();
	} else if (timestamp instanceof Date) {
		date = timestamp;
	} else {
		date = new Date(timestamp);
	}

	return date.toLocaleDateString('en-US', {
		year: 'numeric',
		month: 'short',
		day: 'numeric'
	});
};

/**
 * 相対時間をフォーマット（例：2 days ago）
 */
export const formatRelativeTime = (timestamp: Timestamp | Date | string): string => {
	let date: Date;

	if (timestamp instanceof Timestamp) {
		date = timestamp.toDate();
	} else if (timestamp instanceof Date) {
		date = timestamp;
	} else {
		date = new Date(timestamp);
	}

	const now = new Date();
	const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

	if (diffInSeconds < 60) return 'Just now';
	if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
	if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
	if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} days ago`;

	return formatDate(date);
};
// src/lib/firestore/users-wallet.ts
import { getAdminFirestore, handleAdminError } from '@/lib/firebase-admin';
import { ChainType, WalletConnection } from '../../../types/wallet';
import { Timestamp } from 'firebase-admin/firestore';

/**
 * Wallet認証専用のFirestore操作関数
 * Admin SDK経由でサーバーサイドからのみ操作
 */

// コレクション名
const USERS_COLLECTION = 'users';

/**
 * Wallet用の拡張ユーザーデータ型
 */
export interface WalletFirestoreUser {
  id: string; // walletAddress
  chainType: ChainType;
  chainId?: number | string;
  
  // 基本情報
  displayName: string;
  nickname?: string;
  profileImage?: string;
  
  // Wallet固有情報
  walletAddress: string;
  isWalletVerified: boolean;
  lastAuthAt: Timestamp;
  
  // 住所情報（オプション）
  address?: {
    country?: string;
    prefecture?: string;
    city?: string;
    addressLine1?: string;
    addressLine2?: string;
    postalCode?: string;
    phone?: string;
  };
  
  // アカウント情報
  createdAt: Timestamp;
  updatedAt: Timestamp;
  isActive: boolean;
  membershipTier: 'bronze' | 'silver' | 'gold' | 'platinum';
  isProfileComplete: boolean;
  
  // 統計情報
  stats: {
    totalSpent: number;
    totalSpentUSD: number;
    totalOrders: number;
    rank: number;
    badges: string[];
  };

  // 認証履歴
  authHistory: Array<{
    chainType: ChainType;
    chainId?: number | string;
    timestamp: Timestamp;
    success: boolean;
    ipAddress?: string;
    userAgent?: string;
  }>;
}

/**
 * Wallet用の初期ユーザーデータ生成
 */
export const generateWalletUserData = (
  walletAddress: string,
  chainType: ChainType,
  chainId?: number | string
): Omit<WalletFirestoreUser, 'createdAt' | 'updatedAt' | 'lastAuthAt'> => {
  // アドレスから表示名を生成
  const displayName = `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`;
  
  return {
    id: walletAddress.toLowerCase(),
    chainType,
    chainId,
    
    // 基本情報
    displayName,
    
    // Wallet固有情報
    walletAddress: walletAddress.toLowerCase(),
    isWalletVerified: true,
    
    // アカウント情報
    isActive: true,
    membershipTier: 'bronze',
    isProfileComplete: false,
    
    // 統計情報
    stats: {
      totalSpent: 0,
      totalSpentUSD: 0,
      totalOrders: 0,
      rank: 999999,
      badges: ['New Member', 'Wallet User']
    },

    // 認証履歴
    authHistory: []
  };
};

/**
 * Walletユーザーが存在するかチェック
 */
export const checkWalletUserExists = async (walletAddress: string): Promise<boolean> => {
  try {
    const adminDb = getAdminFirestore();
    const userId = walletAddress.toLowerCase();
    
    const userRef = adminDb.collection(USERS_COLLECTION).doc(userId);
    const userSnap = await userRef.get();
    
    const exists = userSnap.exists;
    console.log(`🔍 Wallet user existence check: ${userId} = ${exists}`);
    
    return exists;
  } catch (error) {
    handleAdminError(error, 'checkWalletUserExists');
  }
};

/**
 * WalletアドレスでFirestoreユーザーデータを取得
 */
export const getWalletUserByAddress = async (
  walletAddress: string
): Promise<WalletFirestoreUser | null> => {
  try {
    const adminDb = getAdminFirestore();
    const userId = walletAddress.toLowerCase();
    
    const userRef = adminDb.collection(USERS_COLLECTION).doc(userId);
    const userSnap = await userRef.get();
    
    if (userSnap.exists) {
      const userData = { id: userSnap.id, ...userSnap.data() } as WalletFirestoreUser;
      console.log(`✅ Wallet user retrieved: ${userId}`);
      return userData;
    }
    
    console.log(`❌ Wallet user not found: ${userId}`);
    return null;
  } catch (error) {
    handleAdminError(error, 'getWalletUserByAddress');
  }
};

/**
 * 新規Walletユーザーを作成
 */
export const createWalletUser = async (
  walletAddress: string,
  chainType: ChainType,
  chainId?: number | string,
  additionalData?: {
    ipAddress?: string;
    userAgent?: string;
  }
): Promise<WalletFirestoreUser> => {
  try {
    const adminDb = getAdminFirestore();
    const userId = walletAddress.toLowerCase();
    
    // 初期データ生成
    const userData = generateWalletUserData(walletAddress, chainType, chainId);
    const now = Timestamp.now();
    
    // 認証履歴の初回エントリ
    const initialAuthHistory = {
      chainType,
      chainId,
      timestamp: now,
      success: true,
      ipAddress: additionalData?.ipAddress,
      userAgent: additionalData?.userAgent,
    };
    
    const firestoreUserData: WalletFirestoreUser = {
      ...userData,
      createdAt: now,
      updatedAt: now,
      lastAuthAt: now,
      authHistory: [initialAuthHistory]
    };
    
    const userRef = adminDb.collection(USERS_COLLECTION).doc(userId);
    await userRef.set(firestoreUserData);
    
    console.log(`🆕 Wallet user created: ${userId} (${chainType})`);
    return firestoreUserData;
  } catch (error) {
    handleAdminError(error, 'createWalletUser');
  }
};

/**
 * Walletユーザーの最終認証時刻を更新
 */
export const updateWalletUserLastAuth = async (
  walletAddress: string,
  chainType: ChainType,
  chainId?: number | string,
  additionalData?: {
    ipAddress?: string;
    userAgent?: string;
  }
): Promise<void> => {
  try {
    const adminDb = getAdminFirestore();
    const userId = walletAddress.toLowerCase();
    const now = Timestamp.now();
    
    // 認証履歴エントリ
    const authHistoryEntry = {
      chainType,
      chainId,
      timestamp: now,
      success: true,
      ipAddress: additionalData?.ipAddress,
      userAgent: additionalData?.userAgent,
    };
    
    const userRef = adminDb.collection(USERS_COLLECTION).doc(userId);
    
    // 認証履歴を追加（最新の10件のみ保持）
    await adminDb.runTransaction(async (transaction) => {
      const userDoc = await transaction.get(userRef);
      
      if (!userDoc.exists) {
        throw new Error(`Wallet user not found: ${userId}`);
      }
      
      const userData = userDoc.data() as WalletFirestoreUser;
      const currentHistory = userData.authHistory || [];
      
      // 新しい履歴を追加し、最新10件のみ保持
      const updatedHistory = [authHistoryEntry, ...currentHistory].slice(0, 10);
      
      transaction.update(userRef, {
        lastAuthAt: now,
        updatedAt: now,
        authHistory: updatedHistory,
        isWalletVerified: true // 認証成功時に再確認
      });
    });
    
    console.log(`🔄 Wallet user last auth updated: ${userId}`);
  } catch (error) {
    handleAdminError(error, 'updateWalletUserLastAuth');
  }
};

/**
 * Walletユーザープロフィールを更新
 */
export const updateWalletUserProfile = async (
  walletAddress: string,
  profileData: Partial<Pick<WalletFirestoreUser, 
    'displayName' | 'nickname' | 'profileImage' | 'address' | 'isProfileComplete'
  >>
): Promise<void> => {
  try {
    const adminDb = getAdminFirestore();
    const userId = walletAddress.toLowerCase();
    
    const userRef = adminDb.collection(USERS_COLLECTION).doc(userId);
    
    // プロフィール完成度をチェック
    if (profileData.address) {
      const isComplete = !!(
        profileData.address.country &&
        profileData.address.prefecture &&
        profileData.address.city &&
        profileData.address.addressLine1 &&
        profileData.address.postalCode
      );
      profileData.isProfileComplete = isComplete;
    }
    
    await userRef.update({
      ...profileData,
      updatedAt: Timestamp.now()
    });
    
    console.log(`📝 Wallet user profile updated: ${userId}`);
  } catch (error) {
    handleAdminError(error, 'updateWalletUserProfile');
  }
};

/**
 * Walletユーザー統計を更新
 */
export const updateWalletUserStats = async (
  walletAddress: string,
  statsData: Partial<WalletFirestoreUser['stats']>
): Promise<void> => {
  try {
    const adminDb = getAdminFirestore();
    const userId = walletAddress.toLowerCase();
    
    const userRef = adminDb.collection(USERS_COLLECTION).doc(userId);
    
    // ネストされたフィールドの更新
    const updateData: any = {
      updatedAt: Timestamp.now()
    };
    
    Object.keys(statsData).forEach(key => {
      updateData[`stats.${key}`] = statsData[key as keyof WalletFirestoreUser['stats']];
    });
    
    await userRef.update(updateData);
    
    console.log(`📊 Wallet user stats updated: ${userId}`);
  } catch (error) {
    handleAdminError(error, 'updateWalletUserStats');
  }
};

/**
 * Wallet認証とFirestore同期の統合処理
 */
export const syncWalletAuthWithFirestore = async (
  walletAddress: string,
  chainType: ChainType,
  chainId?: number | string,
  additionalData?: {
    ipAddress?: string;
    userAgent?: string;
  }
): Promise<WalletFirestoreUser> => {
  try {
    console.log(`🔄 Syncing wallet auth with Firestore: ${walletAddress}`);
    
    // 1. ユーザー存在確認
    const existingUser = await getWalletUserByAddress(walletAddress);
    
    if (!existingUser) {
      // 2. 存在しない場合：新規ユーザー作成
      console.log(`🆕 Creating new wallet user: ${walletAddress}`);
      return await createWalletUser(walletAddress, chainType, chainId, additionalData);
    } else {
      // 3. 存在する場合：最終認証時刻を更新
      console.log(`🔄 Updating existing wallet user: ${walletAddress}`);
      await updateWalletUserLastAuth(walletAddress, chainType, chainId, additionalData);
      
      // 最新データを取得して返す
      const updatedUser = await getWalletUserByAddress(walletAddress);
      return updatedUser!;
    }
  } catch (error) {
    handleAdminError(error, 'syncWalletAuthWithFirestore');
  }
};

/**
 * 複数のWalletアドレスでユーザーを検索（バッチ処理用）
 */
export const getWalletUsersByAddresses = async (
  walletAddresses: string[]
): Promise<WalletFirestoreUser[]> => {
  try {
    const adminDb = getAdminFirestore();
    
    // 最大10件までの制限（Firestoreの'in'クエリ制限）
    const addresses = walletAddresses.slice(0, 10).map(addr => addr.toLowerCase());
    
    const usersRef = adminDb.collection(USERS_COLLECTION);
    const snapshot = await usersRef.where('walletAddress', 'in', addresses).get();
    
    const users: WalletFirestoreUser[] = [];
    snapshot.forEach(doc => {
      users.push({ id: doc.id, ...doc.data() } as WalletFirestoreUser);
    });
    
    console.log(`📋 Retrieved ${users.length} wallet users from batch query`);
    return users;
  } catch (error) {
    handleAdminError(error, 'getWalletUsersByAddresses');
  }
};
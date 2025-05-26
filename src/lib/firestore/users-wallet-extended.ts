// src/lib/firestore/users-wallet-extended.ts
import { getAdminFirestore, handleAdminError } from '@/lib/firebase-admin';
import { ChainType } from '../../../types/wallet';
import { 
  ExtendedFirestoreUser, 
  CreateExtendedUserData,
  UpdateExtendedUserProfile,
  UpdateExtendedUserStats,
  WalletAuthHistoryEntry,
  ExtendedUserQuery,
  ExtendedUserQueryResult,
  UserSettings
} from '../../../types/user-extended';
import { Timestamp } from 'firebase-admin/firestore';

/**
 * ExtendedFirestoreUser用のFirestore操作関数
 * Admin SDK経由でサーバーサイドからのみ操作
 */

// コレクション名
const USERS_COLLECTION = 'users';
const USER_ACTIVITIES_COLLECTION = 'user_activities';
const USER_NOTIFICATIONS_COLLECTION = 'user_notifications';

/**
 * デフォルトユーザー設定
 */
const DEFAULT_USER_SETTINGS: UserSettings = {
  theme: 'dark',
  language: 'en',
  currency: 'USD',
  showProfileToPublic: true,
  showStatsToPublic: true,
  showBadgesToPublic: true,
  defaultChain: 'evm',
  slippageTolerance: 0.5,
  gasSettings: 'standard',
  requireConfirmationForLargeOrders: true,
  largeOrderThreshold: 1000,
  sessionTimeout: 60,
};

/**
 * Extended Wallet用の初期ユーザーデータ生成
 */
export const generateExtendedWalletUserData = (
  data: CreateExtendedUserData
): Omit<ExtendedFirestoreUser, 'createdAt' | 'updatedAt' | 'lastAuthAt' | 'lastLoginAt'> => {
  const { walletAddress, chainType, chainId, displayName, nickname, profileImage } = data;
  
  // アドレスから表示名を生成（指定がない場合）
  const generatedDisplayName = displayName || 
    `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`;
  
  // undefinedフィールドを除去する関数
  const removeUndefined = (obj: any): any => {
    const cleaned: any = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          const cleanedNested = removeUndefined(value);
          if (Object.keys(cleanedNested).length > 0) {
            cleaned[key] = cleanedNested;
          }
        } else {
          cleaned[key] = value;
        }
      }
    }
    return cleaned;
  };

  const baseData = {
    id: walletAddress.toLowerCase(),
    authMethod: 'wallet' as const,
    
    // 基本情報（既存のFirestoreUserフィールド）
    email: `${walletAddress.toLowerCase()}@wallet.local`, // 仮想メール
    displayName: generatedDisplayName,
    ...(nickname && { nickname }), // nicknameが存在する場合のみ追加
    ...(profileImage && { profileImage }), // profileImageが存在する場合のみ追加
    
    // Wallet固有情報
    walletAddress: walletAddress.toLowerCase(),
    connectedWallets: [{
      address: walletAddress.toLowerCase(),
      chainType,
      chainId,
      walletType: 'unknown',
      isConnected: true,
      connectedAt: new Date(),
      lastUsedAt: new Date(),
      isVerified: true,
      isPrimary: true,
    }],
    primaryWallet: {
      address: walletAddress.toLowerCase(),
      chainType,
      chainId,
      walletType: 'unknown',
      isConnected: true,
      connectedAt: new Date(),
      lastUsedAt: new Date(),
      isVerified: true,
      isPrimary: true,
    },
    isWalletVerified: true,
    
    // アカウント情報
    isEmailVerified: false, // Wallet認証では不要
    isActive: true,
    membershipTier: 'bronze' as const,
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
    authHistory: [],
    
    // セキュリティ設定
    securitySettings: {
      requireSignatureForUpdates: true,
      allowedChains: [chainType],
      maxSessionDuration: 60, // 1時間
    },
    
    // 通知設定
    notificationSettings: {
      email: false, // Wallet認証では無効
      push: true,
      sms: false,
      newOrders: true,
      priceAlerts: true,
      securityAlerts: true,
    },
    
    // 住所情報（空で初期化）
    address: {},
  };

  // undefined値を完全に除去
  return removeUndefined(baseData);
};

/**
 * Extended Walletユーザーが存在するかチェック
 */
export const checkExtendedWalletUserExists = async (walletAddress: string): Promise<boolean> => {
  try {
    const adminDb = getAdminFirestore();
    const userId = walletAddress.toLowerCase();
    
    const userRef = adminDb.collection(USERS_COLLECTION).doc(userId);
    const userSnap = await userRef.get();
    
    const exists = userSnap.exists;
    console.log(`🔍 Extended wallet user existence check: ${userId} = ${exists}`);
    
    return exists;
  } catch (error) {
    handleAdminError(error, 'checkExtendedWalletUserExists');
    return false; // エラー時はfalseを返す
  }
};

/**
 * WalletアドレスでExtendedFirestoreユーザーデータを取得
 */
export const getExtendedWalletUserByAddress = async (
  walletAddress: string
): Promise<ExtendedFirestoreUser | null> => {
  try {
    const adminDb = getAdminFirestore();
    const userId = walletAddress.toLowerCase();
    
    const userRef = adminDb.collection(USERS_COLLECTION).doc(userId);
    const userSnap = await userRef.get();
    
    if (userSnap.exists) {
      const userData = { id: userSnap.id, ...userSnap.data() } as ExtendedFirestoreUser;
      console.log(`✅ Extended wallet user retrieved: ${userId}`);
      return userData;
    }
    
    console.log(`❌ Extended wallet user not found: ${userId}`);
    return null;
  } catch (error) {
    handleAdminError(error, 'getExtendedWalletUserByAddress');
    return null; // エラー時はnullを返す
  }
};

/**
 * 新規Extended Walletユーザーを作成
 */
export const createExtendedWalletUser = async (
  data: CreateExtendedUserData
): Promise<ExtendedFirestoreUser> => {
  try {
    const adminDb = getAdminFirestore();
    const userId = data.walletAddress.toLowerCase();
    
    // 初期データ生成
    const userData = generateExtendedWalletUserData(data);
    const now = Timestamp.now();
    
    // 認証履歴の初回エントリ
    const initialAuthHistory: WalletAuthHistoryEntry = {
      chainType: data.chainType,
      chainId: data.chainId,
      walletAddress: data.walletAddress.toLowerCase(),
      timestamp: now,
      success: true,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
    };
    
    const firestoreUserData: ExtendedFirestoreUser = {
      ...userData,
      createdAt: now,
      updatedAt: now,
      lastAuthAt: now,
      lastLoginAt: now, // lastLoginAtも設定
      authHistory: [initialAuthHistory]
    };
    
    const userRef = adminDb.collection(USERS_COLLECTION).doc(userId);
    await userRef.set(firestoreUserData);
    
    // ユーザーアクティビティログ
    await logUserActivity(userId, 'login', 'First wallet authentication', {
      chainType: data.chainType,
      walletAddress: data.walletAddress,
      isNewUser: true,
    }, data.ipAddress);
    
    console.log(`🆕 Extended wallet user created: ${userId} (${data.chainType})`);
    return firestoreUserData;
  } catch (error) {
    handleAdminError(error, 'createExtendedWalletUser');
    throw error; // エラーを再throw
  }
};

/**
 * Extended Walletユーザーの最終認証時刻を更新
 */
export const updateExtendedWalletUserLastAuth = async (
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
    const authHistoryEntry: WalletAuthHistoryEntry = {
      chainType,
      chainId,
      walletAddress: walletAddress.toLowerCase(),
      timestamp: now,
      success: true,
      ipAddress: additionalData?.ipAddress,
      userAgent: additionalData?.userAgent,
    };
    
    const userRef = adminDb.collection(USERS_COLLECTION).doc(userId);
    
    // 認証履歴を追加（最新の20件のみ保持）
    await adminDb.runTransaction(async (transaction) => {
      const userDoc = await transaction.get(userRef);
      
      if (!userDoc.exists) {
        throw new Error(`Extended wallet user not found: ${userId}`);
      }
      
      const userData = userDoc.data() as ExtendedFirestoreUser;
      const currentHistory = userData.authHistory || [];
      
      // 新しい履歴を追加し、最新20件のみ保持
      const updatedHistory = [authHistoryEntry, ...currentHistory].slice(0, 20);
      
      transaction.update(userRef, {
        lastAuthAt: now,
        lastLoginAt: now, // lastLoginAtも更新
        updatedAt: now,
        authHistory: updatedHistory,
        isWalletVerified: true
      });
    });
    
    // ユーザーアクティビティログ
    await logUserActivity(userId, 'login', 'Wallet authentication', {
      chainType,
      walletAddress,
    }, additionalData?.ipAddress);
    
    console.log(`🔄 Extended wallet user last auth updated: ${userId}`);
  } catch (error) {
    handleAdminError(error, 'updateExtendedWalletUserLastAuth');
    throw error; // エラーを再throw
  }
};

/**
 * Extended Walletユーザープロフィールを更新
 */
export const updateExtendedWalletUserProfile = async (
  walletAddress: string,
  profileData: UpdateExtendedUserProfile
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
      (profileData as any).isProfileComplete = isComplete;
    }
    
    await userRef.update({
      ...profileData,
      updatedAt: Timestamp.now()
    });
    
    // ユーザーアクティビティログ
    await logUserActivity(userId, 'profile_update', 'Profile information updated', {
      updatedFields: Object.keys(profileData),
    });
    
    console.log(`📝 Extended wallet user profile updated: ${userId}`);
  } catch (error) {
    handleAdminError(error, 'updateExtendedWalletUserProfile');
  }
};

/**
 * Extended Walletユーザー統計を更新
 */
export const updateExtendedWalletUserStats = async (
  walletAddress: string,
  statsData: UpdateExtendedUserStats
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
      if (key === 'newAchievements') {
        // 新しいバッジを既存のバッジに追加
        return; // 別途処理
      }
      updateData[`stats.${key}`] = statsData[key as keyof UpdateExtendedUserStats];
    });
    
    // 新しいアチーブメントがある場合
    if (statsData.newAchievements && statsData.newAchievements.length > 0) {
      const userDoc = await userRef.get();
      if (userDoc.exists) {
        const userData = userDoc.data() as ExtendedFirestoreUser;
        const currentBadges = userData.stats.badges || [];
        const updatedBadges = [...new Set([...currentBadges, ...statsData.newAchievements])];
        updateData['stats.badges'] = updatedBadges;
        
        // 新しいアチーブメント通知
        for (const achievement of statsData.newAchievements) {
          await createUserNotification(userId, {
            type: 'success',
            title: 'New Achievement!',
            message: `You earned the "${achievement}" badge!`,
            metadata: { badgeName: achievement }
          });
        }
      }
    }
    
    await userRef.update(updateData);
    
    console.log(`📊 Extended wallet user stats updated: ${userId}`);
  } catch (error) {
    handleAdminError(error, 'updateExtendedWalletUserStats');
  }
};

/**
 * ユーザーアクティビティをログ
 */
export const logUserActivity = async (
  userId: string,
  type: string,
  description: string,
  metadata?: any,
  ipAddress?: string
): Promise<void> => {
  try {
    const adminDb = getAdminFirestore();
    
    const activityData = {
      userId,
      type,
      description,
      metadata: metadata || {},
      timestamp: Timestamp.now(),
      ipAddress,
    };
    
    await adminDb.collection(USER_ACTIVITIES_COLLECTION).add(activityData);
  } catch (error) {
    console.warn('Failed to log user activity:', error);
    // アクティビティログの失敗は致命的エラーではない
  }
};

/**
 * ユーザー通知を作成
 */
export const createUserNotification = async (
  userId: string,
  notification: {
    type: 'info' | 'success' | 'warning' | 'error';
    title: string;
    message: string;
    actionUrl?: string;
    actionText?: string;
    metadata?: any;
    expiresAt?: Date;
  }
): Promise<void> => {
  try {
    const adminDb = getAdminFirestore();
    
    const notificationData = {
      userId,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      isRead: false,
      actionUrl: notification.actionUrl,
      actionText: notification.actionText,
      metadata: notification.metadata || {},
      createdAt: Timestamp.now(),
      expiresAt: notification.expiresAt ? Timestamp.fromDate(notification.expiresAt) : undefined,
    };
    
    await adminDb.collection(USER_NOTIFICATIONS_COLLECTION).add(notificationData);
  } catch (error) {
    console.warn('Failed to create user notification:', error);
  }
};

/**
 * Extended Wallet認証とFirestore同期の統合処理（メイン関数）
 */
export const syncExtendedWalletAuthWithFirestore = async (
  data: CreateExtendedUserData
): Promise<ExtendedFirestoreUser> => {
  try {
    console.log(`🔄 Syncing extended wallet auth with Firestore: ${data.walletAddress}`);
    
    // 1. ユーザー存在確認
    const existingUser = await getExtendedWalletUserByAddress(data.walletAddress);
    
    if (!existingUser) {
      // 2. 存在しない場合：新規ユーザー作成
      console.log(`🆕 Creating new extended wallet user: ${data.walletAddress}`);
      return await createExtendedWalletUser(data);
    } else {
      // 3. 存在する場合：最終認証時刻を更新
      console.log(`🔄 Updating existing extended wallet user: ${data.walletAddress}`);
      await updateExtendedWalletUserLastAuth(
        data.walletAddress, 
        data.chainType, 
        data.chainId, 
        {
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
        }
      );
      
      // 最新データを取得して返す
      const updatedUser = await getExtendedWalletUserByAddress(data.walletAddress);
      if (!updatedUser) {
        throw new Error(`Failed to retrieve updated user: ${data.walletAddress}`);
      }
      return updatedUser;
    }
  } catch (error) {
    handleAdminError(error, 'syncExtendedWalletAuthWithFirestore');
    throw error; // エラーを再throw
  }
};
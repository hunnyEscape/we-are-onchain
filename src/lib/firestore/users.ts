// src/lib/firestore/users.ts
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  onSnapshot,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { User as FirebaseUser } from 'firebase/auth';
import { db } from '@/lib/firebase';
import { 
  FirestoreUser, 
  CreateUserData, 
  UpdateUserProfile, 
  UpdateUserStats,
  ProfileCompleteness 
} from '../../../types/user';
import { UserProfile } from '../../../types/dashboard';

// コレクション名
const USERS_COLLECTION = 'users';

/**
 * ユーザーが存在するかチェック
 */
export const checkUserExists = async (userId: string): Promise<boolean> => {
  try {
    const userRef = doc(db, USERS_COLLECTION, userId);
    const userSnap = await getDoc(userRef);
    return userSnap.exists();
  } catch (error) {
    console.error('Error checking user existence:', error);
    return false;
  }
};

/**
 * ユーザーIDでFirestoreユーザーデータを取得
 */
export const getUserById = async (userId: string): Promise<FirestoreUser | null> => {
  try {
    const userRef = doc(db, USERS_COLLECTION, userId);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      return { id: userSnap.id, ...userSnap.data() } as FirestoreUser;
    }
    return null;
  } catch (error) {
    console.error('Error getting user:', error);
    return null;
  }
};

/**
 * EmptyUserデータを生成
 */
export const generateEmptyUserData = (firebaseUser: FirebaseUser): CreateUserData => {
  return {
    id: firebaseUser.uid,
    email: firebaseUser.email || '',
    displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Anonymous User',
    nickname: firebaseUser.displayName || undefined,
    profileImage: firebaseUser.photoURL || undefined,
    address: {},
    isEmailVerified: firebaseUser.emailVerified,
    isActive: true,
    membershipTier: 'bronze',
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
 * 新規ユーザーをFirestoreに作成
 */
export const createEmptyUser = async (firebaseUser: FirebaseUser): Promise<FirestoreUser> => {
  try {
    const userData = generateEmptyUserData(firebaseUser);
    const userRef = doc(db, USERS_COLLECTION, firebaseUser.uid);
    
    const firestoreUserData = {
      ...userData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastLoginAt: serverTimestamp(),
    };

    await setDoc(userRef, firestoreUserData);
    
    // 作成されたデータを返す（serverTimestampはFirestoreで自動変換される）
    const createdUser = await getUserById(firebaseUser.uid);
    if (!createdUser) {
      throw new Error('Failed to retrieve created user');
    }
    
    console.log('✅ New user created in Firestore:', firebaseUser.uid);
    return createdUser;
  } catch (error) {
    console.error('Error creating empty user:', error);
    throw error;
  }
};

/**
 * 最終ログイン時刻を更新
 */
export const updateLastLogin = async (userId: string): Promise<void> => {
  try {
    const userRef = doc(db, USERS_COLLECTION, userId);
    await updateDoc(userRef, {
      lastLoginAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    console.log('✅ Last login updated for user:', userId);
  } catch (error) {
    console.error('Error updating last login:', error);
    throw error;
  }
};

/**
 * プロフィール情報を更新
 */
export const updateUserProfile = async (
  userId: string, 
  profileData: UpdateUserProfile
): Promise<void> => {
  try {
    const userRef = doc(db, USERS_COLLECTION, userId);
    await updateDoc(userRef, {
      ...profileData,
      updatedAt: serverTimestamp()
    });
    console.log('✅ User profile updated:', userId);
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};

/**
 * ユーザー統計を更新
 */
export const updateUserStats = async (
  userId: string, 
  statsData: UpdateUserStats
): Promise<void> => {
  try {
    const userRef = doc(db, USERS_COLLECTION, userId);
    await updateDoc(userRef, {
      'stats.totalSpent': statsData.totalSpent,
      'stats.totalSpentUSD': statsData.totalSpentUSD,
      'stats.totalOrders': statsData.totalOrders,
      'stats.rank': statsData.rank,
      'stats.badges': statsData.badges,
      updatedAt: serverTimestamp()
    });
    console.log('✅ User stats updated:', userId);
  } catch (error) {
    console.error('Error updating user stats:', error);
    throw error;
  }
};

/**
 * Firebase AuthとFirestoreの自動同期
 */
export const syncAuthWithFirestore = async (firebaseUser: FirebaseUser): Promise<FirestoreUser> => {
  try {
    // 1. ユーザー存在確認
    const existingUser = await getUserById(firebaseUser.uid);
    
    if (!existingUser) {
      // 2. 存在しない場合：EmptyUserを作成
      return await createEmptyUser(firebaseUser);
    } else {
      // 3. 存在する場合：lastLoginAtを更新
      await updateLastLogin(firebaseUser.uid);
      
      // 最新データを取得して返す
      const updatedUser = await getUserById(firebaseUser.uid);
      return updatedUser!;
    }
  } catch (error) {
    console.error('Error syncing auth with Firestore:', error);
    throw error;
  }
};

/**
 * リアルタイムでユーザーデータを監視
 */
export const subscribeToUser = (
  userId: string, 
  callback: (user: FirestoreUser | null) => void
): (() => void) => {
  const userRef = doc(db, USERS_COLLECTION, userId);
  
  return onSnapshot(userRef, (doc) => {
    if (doc.exists()) {
      callback({ id: doc.id, ...doc.data() } as FirestoreUser);
    } else {
      callback(null);
    }
  }, (error) => {
    console.error('Error subscribing to user:', error);
    callback(null);
  });
};

/**
 * プロフィール完成度をチェック
 */
export const checkProfileCompleteness = (user: FirestoreUser): ProfileCompleteness => {
  const requiredFields: (keyof FirestoreUser)[] = [
    'displayName',
    'address'
  ];
  
  const missingFields: string[] = [];
  let completedFields = 0;
  
  // 基本情報チェック
  if (!user.displayName?.trim()) {
    missingFields.push('Display Name');
  } else {
    completedFields++;
  }
  
  // 住所情報チェック
  if (!user.address?.country || !user.address?.prefecture || 
      !user.address?.city || !user.address?.addressLine1 || 
      !user.address?.postalCode) {
    missingFields.push('Address Information');
  } else {
    completedFields++;
  }
  
  const completionPercentage = Math.round((completedFields / requiredFields.length) * 100);
  const isComplete = missingFields.length === 0;
  
  return {
    isComplete,
    completionPercentage,
    missingFields,
    requiredFields
  };
};

/**
 * FirestoreUserを既存のUserProfile形式に変換
 */
export const firestoreUserToUserProfile = (firestoreUser: FirestoreUser): UserProfile => {
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
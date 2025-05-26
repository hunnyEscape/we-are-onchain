// types/user-extended.ts
import { Timestamp } from 'firebase-admin/firestore'; // Admin SDK版を使用
import { FirestoreUser } from './user';
import { ChainType, WalletConnection } from './wallet';

/**
 * Wallet認証対応の拡張ユーザーデータ型
 * 既存のFirestoreUserにWallet機能を追加
 */
export interface ExtendedFirestoreUser extends Omit<FirestoreUser, 'id' | 'walletAddress'> {
  id: string; // walletAddress または firebaseUID
  
  // 認証方式の識別
  authMethod: 'firebase' | 'wallet' | 'hybrid';
  
  // Firebase認証情報（オプション）
  firebaseUid?: string;
  
  // Wallet認証情報
  walletAddress: string; // 必須（Wallet認証では主キー）
  connectedWallets: WalletConnection[];
  primaryWallet?: WalletConnection;
  isWalletVerified: boolean;
  
  // 最終認証時刻（既存のlastLoginAtも保持）
  lastAuthAt: Timestamp;
  
  // 認証履歴
  authHistory: WalletAuthHistoryEntry[];
  
  // セキュリティ設定
  securitySettings: {
    requireSignatureForUpdates: boolean;
    allowedChains: ChainType[];
    maxSessionDuration: number; // minutes
  };
  
  // 通知設定
  notificationSettings: {
    email: boolean;
    push: boolean;
    sms: boolean;
    newOrders: boolean;
    priceAlerts: boolean;
    securityAlerts: boolean;
  };
}

/**
 * 認証履歴エントリ
 */
export interface WalletAuthHistoryEntry {
  chainType: ChainType;
  chainId?: number | string;
  walletAddress: string;
  timestamp: Timestamp;
  success: boolean;
  ipAddress?: string;
  userAgent?: string;
  location?: {
    country?: string;
    city?: string;
  };
  failureReason?: string;
}

/**
 * Wallet操作結果
 */
export interface WalletOperationResult<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  metadata?: {
    transactionHash?: string;
    blockNumber?: number;
    gasUsed?: string;
    timestamp: Date;
  };
}

/**
 * 認証フロー状態
 */
export interface AuthFlowState {
  currentStep: 'idle' | 'connecting' | 'signing' | 'verifying' | 'success' | 'error';
  signatureRequired: boolean;
  verificationRequired: boolean;
  progress: number; // 0-100
  selectedChain?: ChainType;
  selectedWallet?: string;
  errorMessage?: string;
  retryCount?: number;
}

/**
 * ユーザー設定
 */
export interface UserSettings {
  // 表示設定
  theme: 'light' | 'dark' | 'system';
  language: 'en' | 'ja' | 'zh' | 'ko';
  currency: 'USD' | 'JPY' | 'ETH' | 'BTC';
  
  // プライバシー設定
  showProfileToPublic: boolean;
  showStatsToPublic: boolean;
  showBadgesToPublic: boolean;
  
  // 取引設定
  defaultChain: ChainType;
  slippageTolerance: number; // %
  gasSettings: 'slow' | 'standard' | 'fast' | 'custom';
  
  // セキュリティ設定
  requireConfirmationForLargeOrders: boolean;
  largeOrderThreshold: number; // USD
  sessionTimeout: number; // minutes
}

/**
 * ExtendedFirestoreUser作成用のデータ
 */
export interface CreateExtendedUserData {
  // 必須フィールド
  authMethod: 'wallet';
  walletAddress: string;
  chainType: ChainType;
  chainId?: number | string;
  
  // オプションフィールド
  displayName?: string;
  nickname?: string;
  profileImage?: string;
  
  // リクエスト情報
  ipAddress?: string;
  userAgent?: string;
  
  // 初期設定
  initialSettings?: Partial<UserSettings>;
}

/**
 * プロフィール更新データ
 */
export interface UpdateExtendedUserProfile {
  displayName?: string;
  nickname?: string;
  profileImage?: string;
  address?: ExtendedFirestoreUser['address'];
  notificationSettings?: Partial<ExtendedFirestoreUser['notificationSettings']>;
  securitySettings?: Partial<ExtendedFirestoreUser['securitySettings']>;
  userSettings?: Partial<UserSettings>;
}

/**
 * 統計情報更新データ
 */
export interface UpdateExtendedUserStats {
  totalSpent?: number;
  totalSpentUSD?: number;
  totalOrders?: number;
  rank?: number;
  badges?: string[];
  newAchievements?: string[];
}

/**
 * Wallet接続情報（拡張版）
 */
export interface ExtendedWalletConnection extends WalletConnection {
  // 追加情報
  nickname?: string;
  isHardwareWallet: boolean;
  securityLevel: 'low' | 'medium' | 'high';
  
  // 使用統計
  totalTransactions: number;
  totalValue: number; // ETH
  firstUsed: Date;
  lastUsed: Date;
  
  // 設定
  isDefault: boolean;
  notifications: boolean;
  autoConnect: boolean;
}

/**
 * ユーザーアクティビティ
 */
export interface UserActivity {
  id: string;
  userId: string;
  type: 'login' | 'logout' | 'purchase' | 'profile_update' | 'wallet_connect' | 'wallet_disconnect';
  description: string;
  metadata?: any;
  timestamp: Timestamp;
  chainType?: ChainType;
  walletAddress?: string;
  ipAddress?: string;
}

/**
 * ユーザー通知
 */
export interface UserNotification {
  id: string;
  userId: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  isRead: boolean;
  actionUrl?: string;
  actionText?: string;
  metadata?: any;
  createdAt: Timestamp;
  expiresAt?: Timestamp;
}

/**
 * バッチ操作用
 */
export interface BatchExtendedUserOperation {
  operation: 'create' | 'update' | 'delete';
  userId: string;
  data?: Partial<ExtendedFirestoreUser>;
}

export interface BatchExtendedUserResult {
  success: boolean;
  results: Array<{
    userId: string;
    success: boolean;
    error?: string;
  }>;
  summary: {
    total: number;
    successful: number;
    failed: number;
  };
}

/**
 * 検索・フィルタ用
 */
export interface ExtendedUserQuery {
  walletAddresses?: string[];
  chainTypes?: ChainType[];
  authMethods?: ('firebase' | 'wallet' | 'hybrid')[];
  membershipTiers?: ('bronze' | 'silver' | 'gold' | 'platinum')[];
  isActive?: boolean;
  isWalletVerified?: boolean;
  createdAfter?: Date;
  createdBefore?: Date;
  lastAuthAfter?: Date;
  lastAuthBefore?: Date;
  minTotalSpent?: number;
  maxTotalSpent?: number;
  hasBadges?: string[];
  limit?: number;
  offset?: number;
  sortBy?: 'createdAt' | 'lastAuthAt' | 'totalSpent' | 'rank';
  sortOrder?: 'asc' | 'desc';
}

export interface ExtendedUserQueryResult {
  users: ExtendedFirestoreUser[];
  total: number;
  hasMore: boolean;
  nextOffset?: number;
}
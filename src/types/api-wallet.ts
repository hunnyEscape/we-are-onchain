// types/api-wallet.ts
import { ChainType } from './wallet';
import { WalletFirestoreUser } from '../src/lib/firestore/users-wallet';
import { ExtendedFirestoreUser } from './user-extended'; // 追加

/**
 * Wallet認証API用の型定義
 */

// Wallet認証リクエスト
export interface WalletAuthRequest {
  // 署名データ
  signature: string;
  message: string;
  address: string;
  chainType: ChainType;
  chainId?: number | string;
  nonce: string;
  timestamp: number;
  
  // リクエスト情報（セキュリティ用）
  ipAddress?: string;
  userAgent?: string;
}

// Wallet認証レスポンス
export interface WalletAuthResponse {
  success: boolean;
  data?: {
    user: ExtendedFirestoreUser; // ExtendedFirestoreUserに変更
    sessionToken?: string;
    isNewUser: boolean;
    message: string;
  };
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

// プロフィール更新リクエスト
export interface UpdateWalletProfileRequest {
  address: string;
  signature: string; // 本人確認用署名
  
  profileData: {
    displayName?: string;
    nickname?: string;
    profileImage?: string;
    address?: {
      country?: string;
      prefecture?: string;
      city?: string;
      addressLine1?: string;
      addressLine2?: string;
      postalCode?: string;
      phone?: string;
    };
  };
}

// プロフィール更新レスポンス
export interface UpdateWalletProfileResponse {
  success: boolean;
  data?: {
    user: ExtendedFirestoreUser; // ExtendedFirestoreUserに変更
    message: string;
  };
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

// ユーザー情報取得レスポンス
export interface GetWalletUserResponse {
  success: boolean;
  data?: {
    user: ExtendedFirestoreUser; // ExtendedFirestoreUserに変更
    exists: boolean;
  };
  error?: {
    code: string;
    message: string;
  };
}

// 統計更新リクエスト
export interface UpdateWalletStatsRequest {
  address: string;
  signature: string; // 本人確認用署名
  
  statsData: {
    totalSpent?: number;
    totalSpentUSD?: number;
    totalOrders?: number;
    rank?: number;
    badges?: string[];
  };
}

// エラーコード定義
export type WalletApiErrorCode = 
  | 'INVALID_SIGNATURE'
  | 'EXPIRED_NONCE'
  | 'ADDRESS_MISMATCH'
  | 'INVALID_CHAIN'
  | 'USER_NOT_FOUND'
  | 'VALIDATION_ERROR'
  | 'FIRESTORE_ERROR'
  | 'PERMISSION_DENIED'
  | 'RATE_LIMITED'
  | 'INTERNAL_ERROR';

// API エラー型
export interface WalletApiError {
  code: WalletApiErrorCode;
  message: string;
  details?: any;
  timestamp: string;
  requestId?: string;
}

// セッション情報
export interface WalletSession {
  address: string;
  chainType: ChainType;
  chainId?: number | string;
  token: string;
  expiresAt: number;
  createdAt: number;
}

// バッチ操作用
export interface BatchWalletUsersRequest {
  addresses: string[];
}

export interface BatchWalletUsersResponse {
  success: boolean;
  data?: {
    users: ExtendedFirestoreUser[]; // ExtendedFirestoreUserに変更
    found: number;
    total: number;
  };
  error?: WalletApiError;
}
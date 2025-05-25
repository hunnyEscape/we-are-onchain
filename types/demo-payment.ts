// types/demo-payment.ts
import { Timestamp } from 'firebase/firestore';

/**
 * デモInvoiceの状態
 */
export type DemoInvoiceStatus = 
  | 'pending'     // 支払い待機中
  | 'confirming'  // ブロック確認中（1-3 confirmations）
  | 'completed'   // 支払い完了
  | 'expired'     // 期限切れ
  | 'error';      // エラー状態

/**
 * サポートされるブロックチェーン
 */
export type SupportedChain = 'avalanche-fuji';

/**
 * Avalanche FUJI ネットワーク設定
 */
export interface AvalancheConfig {
  chainId: number;
  name: string;
  rpcUrl: string;
  blockExplorer: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  faucetUrl: string;
  averageBlockTime: number; // milliseconds
  confirmationBlocks: number;
}

/**
 * デモInvoice作成リクエスト
 */
export interface CreateDemoInvoiceRequest {
  chainId?: number; // デフォルト: 43113 (FUJI)
  userAgent?: string;
  ipAddress?: string;
}

/**
 * デモInvoice作成レスポンス
 */
export interface CreateDemoInvoiceResponse {
  success: boolean;
  data?: {
    invoiceId: string;
    paymentAddress: string;
    amount: string; // AVAX amount
    amountWei: string; // Wei amount  
    chainId: number;
    qrCodeDataURL: string; // Base64 QR code image
    paymentURI: string; // EIP-681 URI
    expiresAt: string; // ISO string
    estimatedGasFee: string; // AVAX amount
  };
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

/**
 * デモInvoiceステータスレスポンス
 */
export interface DemoInvoiceStatusResponse {
  success: boolean;
  data?: {
    invoiceId: string;
    status: DemoInvoiceStatus;
    paymentAddress: string;
    amount: string;
    chainId: number;
    createdAt: string;
    expiresAt: string;
    transactionHash?: string;
    blockNumber?: number;
    confirmations?: number;
    paidAt?: string;
    timeRemaining?: number; // seconds
  };
  error?: {
    code: string;
    message: string;
  };
}

/**
 * Firestore保存用のデモInvoiceデータ
 */
export interface DemoInvoiceDocument {
  invoiceId: string;
  paymentAddress: string;
  privateKey: string; // 暗号化して保存予定
  amount: string; // AVAX amount
  amountWei: string; // Wei amount
  chainId: number;
  status: DemoInvoiceStatus;
  
  // リクエスト情報
  userAgent?: string;
  ipAddress?: string;
  
  // タイムスタンプ
  createdAt: Timestamp;
  expiresAt: Timestamp;
  
  // 支払い完了後の情報
  transactionHash?: string;
  blockNumber?: number;
  confirmations?: number;
  paidAt?: Timestamp;
  paidAmount?: string; // 実際に支払われた金額
}

/**
 * ウォレット生成結果
 */
export interface GeneratedWallet {
  address: string;
  privateKey: string;
  publicKey: string;
  index: number; // HD wallet index
  derivationPath: string;
}

/**
 * 決済監視設定
 */
export interface PaymentMonitorConfig {
  pollInterval: number; // milliseconds
  maxPollDuration: number; // milliseconds  
  confirmationBlocks: number;
  retryAttempts: number;
  backoffMultiplier: number;
}

/**
 * QRコード生成設定
 */
export interface QRCodeConfig {
  size: number;
  margin: number;
  colorDark: string;
  colorLight: string;
  errorCorrectionLevel: 'L' | 'M' | 'Q' | 'H';
}

/**
 * Rate limiting設定
 */
export interface RateLimitConfig {
  maxInvoicesPerIP: number;
  windowMinutes: number;
  maxInvoicesPerHour: number;
  cleanupIntervalMinutes: number;
}

/**
 * デモ決済エラーコード
 */
export type DemoPaymentErrorCode = 
  | 'RATE_LIMIT_EXCEEDED'
  | 'INVALID_CHAIN_ID'
  | 'WALLET_GENERATION_FAILED'
  | 'FIRESTORE_ERROR'
  | 'QR_GENERATION_FAILED'
  | 'INVOICE_NOT_FOUND'
  | 'INVOICE_EXPIRED'
  | 'RPC_CONNECTION_FAILED'
  | 'PAYMENT_MONITORING_FAILED'
  | 'INVALID_TRANSACTION'
  | 'INSUFFICIENT_CONFIRMATIONS';

/**
 * デモ決済エラー
 */
export interface DemoPaymentError {
  code: DemoPaymentErrorCode;
  message: string;
  details?: any;
  timestamp: Date;
  invoiceId?: string;
}

/**
 * 統計データ（analytics用）
 */
export interface DemoAnalytics {
  date: string; // YYYY-MM-DD
  invoicesGenerated: number;
  invoicesCompleted: number;
  invoicesExpired: number;
  averageCompletionTime: number; // seconds
  totalAmountPaid: string; // AVAX
  uniqueIPs: number;
  popularTimeSlots: Record<string, number>; // hour -> count
}

/**
 * フロントエンド用のUI状態
 */
export interface DemoPaymentUIState {
  status: 'idle' | 'generating' | 'waiting' | 'confirming' | 'completed' | 'expired' | 'error';
  invoiceId?: string;
  paymentAddress?: string;
  qrCodeDataURL?: string;
  paymentURI?: string;
  timeRemaining?: number; // seconds
  confirmations?: number;
  transactionHash?: string;
  errorMessage?: string;
  isPolling: boolean;
}
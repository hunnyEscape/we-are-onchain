// src/lib/avalanche-config.ts
import { AvalancheConfig, PaymentMonitorConfig, QRCodeConfig, RateLimitConfig } from '../../types/demo-payment';

/**
 * Avalanche FUJI Testnet 設定
 */
export const AVALANCHE_FUJI_CONFIG: AvalancheConfig = {
  chainId: 43113,
  name: 'Avalanche FUJI C-Chain',
  rpcUrl: process.env.AVALANCHE_FUJI_RPC_URL || 'https://api.avax-test.network/ext/bc/C/rpc',
  blockExplorer: 'https://testnet.snowscan.xyz',
  nativeCurrency: {
    name: 'Avalanche',
    symbol: 'AVAX',
    decimals: 18
  },
  faucetUrl: 'https://faucet.avax.network/',
  averageBlockTime: 2000, // 2秒
  confirmationBlocks: 3
};

/**
 * フォールバック RPC エンドポイント（冗長性確保）
 */
export const AVALANCHE_FUJI_RPC_ENDPOINTS = [
  'https://api.avax-test.network/ext/bc/C/rpc',
  'https://avalanche-fuji.public.blastapi.io/ext/bc/C/rpc',
  'https://rpc.ankr.com/avalanche_fuji'
];

/**
 * ガス価格設定（FUJI Testnet用）
 */
export const GAS_CONFIG = {
  gasLimit: '21000', // 標準送金
  maxFeePerGas: '30000000000', // 30 gwei
  maxPriorityFeePerGas: '2000000000', // 2 gwei
  gasBuffer: 1.2 // 20%のバッファ
};

/**
 * デモ決済設定
 */
export const DEMO_PAYMENT_CONFIG = {
  // 基本設定
  defaultAmount: process.env.DEMO_INVOICE_AMOUNT || '0.001', // AVAX
  expiryMinutes: parseInt(process.env.INVOICE_EXPIRY_MINUTES || '5'),
  
  // HDウォレット設定
  masterMnemonic: process.env.MASTER_WALLET_MNEMONIC || 'test test test test test test test test test test test junk',
  derivationPath: "m/44'/43113'/0'/0/", // Avalanche用のBIP44パス
  
  // セキュリティ設定
  maxAddressReuse: 1000, // 最大1000アドレスまで生成
  addressPoolSize: 100, // 事前生成プール
};

/**
 * 決済監視設定
 */
export const PAYMENT_MONITOR_CONFIG: PaymentMonitorConfig = {
  pollInterval: 5000, // 5秒間隔
  maxPollDuration: 300000, // 5分間
  confirmationBlocks: 3, // 3ブロック確認
  retryAttempts: 3,
  backoffMultiplier: 1.5
};

/**
 * QRコード生成設定
 */
export const QR_CODE_CONFIG: QRCodeConfig = {
  size: 300,
  margin: 4,
  colorDark: '#000000',
  colorLight: '#ffffff',
  errorCorrectionLevel: 'M' // 中程度のエラー訂正
};

/**
 * Rate Limiting設定
 */
export const RATE_LIMIT_CONFIG: RateLimitConfig = {
  maxInvoicesPerIP: 3, // IPあたり最大3個
  windowMinutes: 60, // 1時間ウィンドウ
  maxInvoicesPerHour: 10, // 1時間あたり最大10個
  cleanupIntervalMinutes: 5 // 5分間隔でクリーンアップ
};

/**
 * Firestore コレクション名
 */
export const FIRESTORE_COLLECTIONS = {
  DEMO_INVOICES: 'demo_invoices',
  DEMO_TRANSACTIONS: 'demo_transactions',
  DEMO_ANALYTICS: 'demo_analytics',
  DEMO_RATE_LIMITS: 'demo_rate_limits'
} as const;

/**
 * 環境変数バリデーション
 */
export function validateEnvironmentVariables(): { isValid: boolean; missingVars: string[] } {
  const requiredVars = [
    'AVALANCHE_FUJI_RPC_URL',
    'MASTER_WALLET_MNEMONIC',
    'NEXT_PUBLIC_FIREBASE_PROJECT_ID'
  ];
  
  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  return {
    isValid: missingVars.length === 0,
    missingVars
  };
}

/**
 * Avalanche用のEIP-681 URI生成
 */
export function generatePaymentURI(address: string, amountWei: string, chainId: number = 43113): string {
  return `ethereum:${address}?value=${amountWei}&chainId=${chainId}`;
}

/**
 * Wei から AVAX への変換
 */
export function weiToAVAX(weiAmount: string): string {
  const wei = BigInt(weiAmount);
  const avax = Number(wei) / Math.pow(10, 18);
  return avax.toFixed(6); // 6桁精度
}

/**
 * AVAX から Wei への変換
 */
export function avaxToWei(avaxAmount: string): string {
  const avax = parseFloat(avaxAmount);
  const wei = BigInt(Math.floor(avax * Math.pow(10, 18)));
  return wei.toString();
}

/**
 * ブロックエクスプローラーURL生成
 */
export function getExplorerURL(type: 'tx' | 'address', value: string): string {
  const baseUrl = AVALANCHE_FUJI_CONFIG.blockExplorer;
  return type === 'tx' 
    ? `${baseUrl}/tx/${value}`
    : `${baseUrl}/address/${value}`;
}

/**
 * デモ用の統計データ初期化
 */
export function createInitialAnalytics(date: string) {
  return {
    date,
    invoicesGenerated: 0,
    invoicesCompleted: 0,
    invoicesExpired: 0,
    averageCompletionTime: 0,
    totalAmountPaid: '0',
    uniqueIPs: 0,
    popularTimeSlots: {}
  };
}

/**
 * 開発環境判定
 */
export const isDevelopment = process.env.NODE_ENV === 'development';
export const isProduction = process.env.NODE_ENV === 'production';

/**
 * ログ設定
 */
export const LOGGING_CONFIG = {
  enableDebugLogs: isDevelopment,
  enableAPILogs: true,
  enableErrorTracking: isProduction,
  logLevel: isDevelopment ? 'debug' : 'info'
};

/**
 * セキュリティ設定
 */
export const SECURITY_CONFIG = {
  // Private key暗号化（将来実装）
  enablePrivateKeyEncryption: false,
  encryptionKey: process.env.ENCRYPTION_KEY,
  
  // IPアドレス記録
  recordIPAddresses: true,
  enableGeoLocation: false,
  
  // CORS設定
  allowedOrigins: isDevelopment 
    ? ['http://localhost:3000', 'http://127.0.0.1:3000']
    : [process.env.NEXT_PUBLIC_APP_URL || 'https://your-domain.com']
};
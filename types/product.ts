// types/product.ts
import { Timestamp } from 'firebase/firestore';

// Firestoreで管理する商品データの型
export interface FirestoreProduct {
  id: string;
  name: string;
  description: string;
  
  // 価格情報
  price: {
    usd: number;
    eth?: number; // ETH価格（自動計算可能）
  };
  
  // 在庫管理
  inventory: {
    totalStock: number;      // 総在庫数
    availableStock: number;  // 利用可能在庫数
    reservedStock: number;   // 予約済み在庫数（カート内商品）
  };
  
  // メタデータ
  metadata: {
    rating: number;
    reviewCount: number;
    features: string[];
    nutritionFacts: Record<string, string>;
    images: string[];
    tags: string[];
  };
  
  // 設定
  settings: {
    maxOrderQuantity: number;
    minOrderQuantity: number;
    isActive: boolean;
    category: string;
    sku: string;
  };
  
  // タイムスタンプ
  timestamps: {
    createdAt: Timestamp;
    updatedAt: Timestamp;
  };
}

// 商品作成用の型
export interface CreateProductData {
  name: string;
  description: string;
  price: {
    usd: number;
  };
  inventory: {
    totalStock: number;
    availableStock: number;
    reservedStock: 0;
  };
  metadata: {
    rating: number;              // 0 から number に変更
    reviewCount: number;         // 0 から number に変更
    features: string[];
    nutritionFacts: Record<string, string>;
    images: string[];
    tags: string[];
  };
  settings: {
    maxOrderQuantity: number;
    minOrderQuantity: 1;
    isActive: boolean;
    category: string;
    sku: string;
  };
}

// 商品更新用の部分型
export interface UpdateProductData {
  name?: string;
  description?: string;
  price?: Partial<FirestoreProduct['price']>;
  metadata?: Partial<FirestoreProduct['metadata']>;
  settings?: Partial<FirestoreProduct['settings']>;
}

// 在庫更新用の型
export interface UpdateInventoryData {
  totalStock?: number;
  availableStock?: number;
  reservedStock?: number;
}

// カート予約の型
export interface CartReservation {
  id: string;                    // 予約ID（ユニーク）
  userId?: string;               // ユーザーID（ログイン済みの場合）
  sessionId: string;             // セッションID（匿名ユーザー用）
  productId: string;
  quantity: number;
  
  // タイムスタンプ
  createdAt: Timestamp;
  expiresAt: Timestamp;          // 予約期限（15分後）
  
  // 状態
  status: 'active' | 'expired' | 'confirmed' | 'cancelled';
}

// 在庫チェック結果の型
export interface StockCheckResult {
  productId: string;
  requestedQuantity: number;
  
  // 在庫状況
  totalStock: number;
  availableStock: number;
  reservedStock: number;
  
  // チェック結果
  canReserve: boolean;
  maxCanReserve: number;
  
  // 制限理由
  limitReasons: {
    exceedsStock: boolean;
    exceedsOrderLimit: boolean;
    productInactive: boolean;
  };
  
  // 既存予約情報
  existingReservation?: {
    quantity: number;
    expiresAt: Timestamp;
  };
}

// 商品フィルター・検索用の型
export interface ProductFilters {
  category?: string;
  isActive?: boolean;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  tags?: string[];
  searchQuery?: string;
}

// 商品ソート用の型
export interface ProductSortOptions {
  field: 'name' | 'price.usd' | 'metadata.rating' | 'timestamps.createdAt' | 'inventory.availableStock';
  direction: 'asc' | 'desc';
}

// 商品リスト取得のオプション
export interface GetProductsOptions {
  filters?: ProductFilters;
  sort?: ProductSortOptions;
  limit?: number;
  offset?: number;
}

// ダッシュボード表示用に簡略化された商品型
export interface ProductSummary {
  id: string;
  name: string;
  price: number;
  availableStock: number;
  isActive: boolean;
  category: string;
  rating: number;
  image?: string;
}

// 商品詳細表示用の型（FirestoreProductの表示用ラッパー）
export interface ProductDetails {
  id: string;
  name: string;
  description: string;
  price: {
    usd: number;
    formatted: string;
  };
  inventory: {
    inStock: number;
    isAvailable: boolean;
    stockLevel: 'high' | 'medium' | 'low' | 'out';
  };
  metadata: {
    rating: number;
    reviewCount: number;
    features: string[];
    nutritionFacts: Record<string, string>;
    images: string[];
    tags: string[];
  };
  settings: {
    maxOrderQuantity: number;
    minOrderQuantity: number;
  };
  timestamps: {
    createdAt: Date;
    updatedAt: Date;
  };
}

// バッチ処理用の型
export interface BatchInventoryUpdate {
  productId: string;
  updates: UpdateInventoryData;
}

// 統計・分析用の型
export interface ProductAnalytics {
  productId: string;
  views: number;
  cartAdditions: number;
  purchases: number;
  conversionRate: number;
  averageRating: number;
  totalRevenue: number;
  period: {
    from: Date;
    to: Date;
  };
}

// エラー型
export interface ProductError {
  code: 'not-found' | 'insufficient-stock' | 'reservation-expired' | 'product-inactive' | 'validation-error';
  message: string;
  productId?: string;
  requestedQuantity?: number;
  availableStock?: number;
}
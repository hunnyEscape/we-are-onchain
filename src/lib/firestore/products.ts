// src/lib/firestore/products.ts
import {
	doc,
	collection,
	getDocs,
	getDoc,
	query,
	where,
	orderBy,
	limit as firestoreLimit,
	onSnapshot,
	serverTimestamp,
	Timestamp,
	Query,
	DocumentSnapshot
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
	FirestoreProduct,
	CreateProductData,
	UpdateProductData,
	ProductFilters,
	ProductSortOptions,
	GetProductsOptions,
	ProductSummary,
	ProductDetails,
	ProductError
} from '../../../types/product';
import { handleAsyncOperation } from '@/utils/errorHandling';

// コレクション名
const PRODUCTS_COLLECTION = 'products';

/**
 * 商品が存在するかチェック
 */
export const checkProductExists = async (productId: string): Promise<boolean> => {
	try {
		const productRef = doc(db, PRODUCTS_COLLECTION, productId);
		const productSnap = await getDoc(productRef);
		return productSnap.exists();
	} catch (error) {
		console.error('Error checking product existence:', error);
		return false;
	}
};

/**
 * 商品IDで商品データを取得
 */
export const getProductById = async (productId: string): Promise<FirestoreProduct | null> => {
	const result = await handleAsyncOperation(async () => {
		const productRef = doc(db, PRODUCTS_COLLECTION, productId);
		const productSnap = await getDoc(productRef);

		if (productSnap.exists()) {
			return { id: productSnap.id, ...productSnap.data() } as FirestoreProduct;
		}
		return null;
	}, 'product-fetch');

	if (result.error) {
		console.error('Error getting product:', result.error);
		return null;
	}

	return result.data || null;
};

/**
 * 複数商品を取得（フィルター・ソート対応）
 */
export const getProducts = async (options: GetProductsOptions = {}): Promise<FirestoreProduct[]> => {
	const result = await handleAsyncOperation(async () => {
		let q: Query = collection(db, PRODUCTS_COLLECTION);

		// フィルター適用
		if (options.filters) {
			const { category, isActive, minPrice, maxPrice, inStock, tags } = options.filters;

			if (category) {
				q = query(q, where('settings.category', '==', category));
			}

			if (isActive !== undefined) {
				q = query(q, where('settings.isActive', '==', isActive));
			}

			if (minPrice !== undefined) {
				q = query(q, where('price.usd', '>=', minPrice));
			}

			if (maxPrice !== undefined) {
				q = query(q, where('price.usd', '<=', maxPrice));
			}

			if (inStock) {
				q = query(q, where('inventory.availableStock', '>', 0));
			}

			if (tags && tags.length > 0) {
				q = query(q, where('metadata.tags', 'array-contains-any', tags));
			}
		}

		// ソート適用
		if (options.sort) {
			q = query(q, orderBy(options.sort.field, options.sort.direction));
		} else {
			// デフォルトソート: アクティブ → 在庫あり → 作成日新しい順
			q = query(q, orderBy('settings.isActive', 'desc'), orderBy('inventory.availableStock', 'desc'));
		}

		// 制限適用
		if (options.limit) {
			q = query(q, firestoreLimit(options.limit));
		}

		const querySnapshot = await getDocs(q);
		const products: FirestoreProduct[] = [];

		querySnapshot.forEach((doc) => {
			products.push({ id: doc.id, ...doc.data() } as FirestoreProduct);
		});

		// クライアントサイドでの追加フィルタリング（Firestoreの制限対応）
		let filteredProducts = products;

		if (options.filters?.searchQuery) {
			const searchQuery = options.filters.searchQuery.toLowerCase();
			filteredProducts = products.filter(product =>
				product.name.toLowerCase().includes(searchQuery) ||
				product.description.toLowerCase().includes(searchQuery) ||
				product.metadata.tags.some(tag => tag.toLowerCase().includes(searchQuery))
			);
		}

		return filteredProducts;
	}, 'products-fetch');

	if (result.error) {
		console.error('Error getting products:', result.error);
		return [];
	}

	return result.data || [];
};

/**
 * アクティブな商品のみを取得
 */
export const getActiveProducts = async (limit?: number): Promise<FirestoreProduct[]> => {
	return getProducts({
		filters: { isActive: true, inStock: true },
		sort: { field: 'metadata.rating', direction: 'desc' },
		limit
	});
};

/**
 * 商品をサマリー形式で取得
 */
export const getProductsSummary = async (options: GetProductsOptions = {}): Promise<ProductSummary[]> => {
	const products = await getProducts(options);

	return products.map(product => ({
		id: product.id,
		name: product.name,
		price: product.price.usd,
		availableStock: product.inventory.availableStock,
		isActive: product.settings.isActive,
		category: product.settings.category,
		rating: product.metadata.rating,
		image: product.metadata.images[0] || undefined
	}));
};

/**
 * 商品詳細を表示用フォーマットで取得
 */
export const getProductDetails = async (productId: string): Promise<ProductDetails | null> => {
	const product = await getProductById(productId);

	if (!product) return null;

	// 在庫レベルを計算
	const getStockLevel = (available: number, total: number): 'high' | 'medium' | 'low' | 'out' => {
		if (available === 0) return 'out';
		const ratio = available / total;
		if (ratio > 0.5) return 'high';
		if (ratio > 0.2) return 'medium';
		return 'low';
	};

	return {
		id: product.id,
		name: product.name,
		description: product.description,
		price: {
			usd: product.price.usd,
			formatted: `$${product.price.usd.toFixed(2)}`
		},
		inventory: {
			inStock: product.inventory.availableStock,
			isAvailable: product.inventory.availableStock > 0,
			stockLevel: getStockLevel(product.inventory.availableStock, product.inventory.totalStock)
		},
		metadata: {
			rating: product.metadata.rating,
			reviewCount: product.metadata.reviewCount,
			features: product.metadata.features,
			nutritionFacts: product.metadata.nutritionFacts,
			images: product.metadata.images,
			tags: product.metadata.tags
		},
		settings: {
			maxOrderQuantity: product.settings.maxOrderQuantity,
			minOrderQuantity: product.settings.minOrderQuantity
		},
		timestamps: {
			createdAt: product.timestamps.createdAt instanceof Timestamp
				? product.timestamps.createdAt.toDate()
				: new Date(product.timestamps.createdAt as any),
			updatedAt: product.timestamps.updatedAt instanceof Timestamp
				? product.timestamps.updatedAt.toDate()
				: new Date(product.timestamps.updatedAt as any)
		}
	};
};

/**
 * 商品をリアルタイムで監視
 */
export const subscribeToProduct = (
	productId: string,
	callback: (product: FirestoreProduct | null) => void
): (() => void) => {
	const productRef = doc(db, PRODUCTS_COLLECTION, productId);

	return onSnapshot(productRef, (doc) => {
		if (doc.exists()) {
			callback({ id: doc.id, ...doc.data() } as FirestoreProduct);
		} else {
			callback(null);
		}
	}, (error) => {
		console.error('Error subscribing to product:', error);
		callback(null);
	});
};

/**
 * 商品リストをリアルタイムで監視
 */
export const subscribeToProducts = (
	options: GetProductsOptions = {},
	callback: (products: FirestoreProduct[]) => void
): (() => void) => {
	let q: Query = collection(db, PRODUCTS_COLLECTION);

	// フィルター適用（subscribeToProductsでは基本的なもののみ）
	if (options.filters?.isActive !== undefined) {
		q = query(q, where('settings.isActive', '==', options.filters.isActive));
	}

	if (options.filters?.category) {
		q = query(q, where('settings.category', '==', options.filters.category));
	}

	// ソート適用
	if (options.sort) {
		q = query(q, orderBy(options.sort.field, options.sort.direction));
	} else {
		q = query(q, orderBy('settings.isActive', 'desc'), orderBy('inventory.availableStock', 'desc'));
	}

	// 制限適用
	if (options.limit) {
		q = query(q, firestoreLimit(options.limit));
	}

	return onSnapshot(q, (querySnapshot) => {
		const products: FirestoreProduct[] = [];
		querySnapshot.forEach((doc) => {
			products.push({ id: doc.id, ...doc.data() } as FirestoreProduct);
		});

		// クライアントサイドフィルタリング
		let filteredProducts = products;

		if (options.filters?.searchQuery) {
			const searchQuery = options.filters.searchQuery.toLowerCase();
			filteredProducts = products.filter(product =>
				product.name.toLowerCase().includes(searchQuery) ||
				product.description.toLowerCase().includes(searchQuery)
			);
		}

		if (options.filters?.inStock) {
			filteredProducts = filteredProducts.filter(product => product.inventory.availableStock > 0);
		}

		callback(filteredProducts);
	}, (error) => {
		console.error('Error subscribing to products:', error);
		callback([]);
	});
};

/**
 * カテゴリ一覧を取得
 */
export const getProductCategories = async (): Promise<string[]> => {
	const result = await handleAsyncOperation(async () => {
		const products = await getProducts({ filters: { isActive: true } });
		const categories = new Set(products.map(product => product.settings.category));
		return Array.from(categories).sort();
	}, 'categories-fetch');

	return result.data || [];
};

/**
 * 商品の在庫状況をチェック
 */
export const checkProductStock = async (
	productId: string,
	requestedQuantity: number
): Promise<{ available: boolean; stock: number; maxAllowed: number }> => {
	const product = await getProductById(productId);

	if (!product) {
		return { available: false, stock: 0, maxAllowed: 0 };
	}

	if (!product.settings.isActive) {
		return { available: false, stock: product.inventory.availableStock, maxAllowed: 0 };
	}

	const maxAllowed = Math.min(
		product.inventory.availableStock,
		product.settings.maxOrderQuantity
	);

	return {
		available: requestedQuantity <= maxAllowed,
		stock: product.inventory.availableStock,
		maxAllowed
	};
};

/**
 * 商品検索（全文検索対応）
 */
export const searchProducts = async (
	searchQuery: string,
	options: Omit<GetProductsOptions, 'filters'> & { filters?: Omit<ProductFilters, 'searchQuery'> } = {}
): Promise<FirestoreProduct[]> => {
	return getProducts({
		...options,
		filters: {
			...options.filters,
			searchQuery,
			isActive: true // 検索時はアクティブな商品のみ
		}
	});
};

/**
 * エラーハンドリング用のヘルパー関数
 */
export const createProductError = (
	code: ProductError['code'],
	message: string,
	productId?: string,
	requestedQuantity?: number,
	availableStock?: number
): ProductError => {
	return {
		code,
		message,
		productId,
		requestedQuantity,
		availableStock
	};
};

// 商品関連の定数
export const PRODUCT_CONSTANTS = {
	MAX_PRODUCTS_PER_PAGE: 20,
	DEFAULT_MAX_ORDER_QUANTITY: 10,
	DEFAULT_MIN_ORDER_QUANTITY: 1,
	STOCK_LEVELS: {
		HIGH_THRESHOLD: 0.5,
		MEDIUM_THRESHOLD: 0.2
	},
	CATEGORIES: {
		PROTEIN: 'protein',
		SUPPLEMENTS: 'supplements',
		MERCHANDISE: 'merchandise'
	}
} as const;
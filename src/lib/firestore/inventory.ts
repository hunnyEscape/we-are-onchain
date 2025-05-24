// src/lib/firestore/inventory.ts
import {
	doc,
	collection,
	getDocs,
	getDoc,
	setDoc,
	updateDoc,
	deleteDoc,
	query,
	where,
	orderBy,
	limit as firestoreLimit,
	writeBatch,
	runTransaction,
	serverTimestamp,
	Timestamp,
	addDoc
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
	CartReservation,
	StockCheckResult,
	UpdateInventoryData,
	BatchInventoryUpdate,
	ProductError
} from '../../../types/product';
import { getProductById } from './products';
import { handleAsyncOperation } from '@/utils/errorHandling';

// コレクション名
const RESERVATIONS_COLLECTION = 'cart_reservations';
const PRODUCTS_COLLECTION = 'products';

// 予約の有効期限（15分）
const RESERVATION_EXPIRY_MINUTES = 15;
const RESERVATION_EXPIRY_MS = RESERVATION_EXPIRY_MINUTES * 60 * 1000;

/**
 * セッションIDを生成（匿名ユーザー用）
 */
export const generateSessionId = (): string => {
	return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * 予約期限を計算
 */
const calculateExpiryTime = (): Timestamp => {
	const expiryTime = new Date(Date.now() + RESERVATION_EXPIRY_MS);
	return Timestamp.fromDate(expiryTime);
};

/**
 * 在庫チェック（詳細情報付き）
 */
export const checkStockAvailability = async (
	productId: string,
	requestedQuantity: number,
	userId?: string,
	sessionId?: string
): Promise<StockCheckResult> => {
	const result = await handleAsyncOperation(async () => {
		const product = await getProductById(productId);

		if (!product) {
			throw new Error(`Product not found: ${productId}`);
		}

		// 既存予約を確認
		let existingReservation: StockCheckResult['existingReservation'] = undefined;

		if (userId || sessionId) {
			const reservationQuery = query(
				collection(db, RESERVATIONS_COLLECTION),
				where('productId', '==', productId),
				where('status', '==', 'active'),
				userId ? where('userId', '==', userId) : where('sessionId', '==', sessionId)
			);

			const reservationSnapshot = await getDocs(reservationQuery);

			if (!reservationSnapshot.empty) {
				const reservation = reservationSnapshot.docs[0].data() as CartReservation;
				existingReservation = {
					quantity: reservation.quantity,
					expiresAt: reservation.expiresAt
				};
			}
		}

		// 利用可能数量を計算（既存予約は除外）
		const availableForUser = product.inventory.availableStock + (existingReservation?.quantity || 0);
		const maxOrderQuantity = product.settings.maxOrderQuantity;
		const maxCanReserve = Math.min(availableForUser, maxOrderQuantity);

		// 制限理由をチェック
		const limitReasons = {
			exceedsStock: requestedQuantity > availableForUser,
			exceedsOrderLimit: requestedQuantity > maxOrderQuantity,
			productInactive: !product.settings.isActive
		};

		const canReserve = requestedQuantity <= maxCanReserve &&
			product.settings.isActive &&
			!limitReasons.exceedsStock &&
			!limitReasons.exceedsOrderLimit;

		return {
			productId,
			requestedQuantity,
			totalStock: product.inventory.totalStock,
			availableStock: product.inventory.availableStock,
			reservedStock: product.inventory.reservedStock,
			canReserve,
			maxCanReserve: Math.max(0, maxCanReserve),
			limitReasons,
			existingReservation
		};
	}, 'stock-check');

	if (result.error) {
		console.error('Error checking stock availability:', result.error);
		// エラー時は安全側に倒す
		return {
			productId,
			requestedQuantity,
			totalStock: 0,
			availableStock: 0,
			reservedStock: 0,
			canReserve: false,
			maxCanReserve: 0,
			limitReasons: {
				exceedsStock: true,
				exceedsOrderLimit: false,
				productInactive: false
			}
		};
	}

	return result.data!;
};

/**
 * 在庫を予約
 */
export const reserveStock = async (
	productId: string,
	quantity: number,
	userId?: string,
	sessionId?: string
): Promise<{ success: boolean; reservationId?: string; error?: ProductError }> => {
	if (!userId && !sessionId) {
		return {
			success: false,
			error: {
				code: 'validation-error',
				message: 'Either userId or sessionId is required',
				productId
			}
		};
	}

	const result = await handleAsyncOperation(async () => {
		return await runTransaction(db, async (transaction) => {
			// 1. 在庫チェック
			const stockCheck = await checkStockAvailability(productId, quantity, userId, sessionId);

			if (!stockCheck.canReserve) {
				let errorCode: ProductError['code'] = 'insufficient-stock';
				let message = 'Cannot reserve stock';

				if (stockCheck.limitReasons.productInactive) {
					errorCode = 'product-inactive';
					message = 'Product is not available';
				} else if (stockCheck.limitReasons.exceedsStock) {
					errorCode = 'insufficient-stock';
					message = `Only ${stockCheck.maxCanReserve} items available`;
				}

				throw new Error(`${errorCode}:${message}`);
			}

			// 2. 既存予約を処理
			if (stockCheck.existingReservation) {
				// 既存予約を更新
				const existingReservationQuery = query(
					collection(db, RESERVATIONS_COLLECTION),
					where('productId', '==', productId),
					where('status', '==', 'active'),
					userId ? where('userId', '==', userId) : where('sessionId', '==', sessionId)
				);

				const existingSnapshot = await getDocs(existingReservationQuery);
				if (!existingSnapshot.empty) {
					const existingReservationDoc = existingSnapshot.docs[0];
					const existingReservation = existingReservationDoc.data() as CartReservation;

					// 予約数量を更新
					transaction.update(existingReservationDoc.ref, {
						quantity,
						expiresAt: calculateExpiryTime()
					});

					// 商品の予約在庫を更新
					const productRef = doc(db, PRODUCTS_COLLECTION, productId);
					const stockDiff = quantity - existingReservation.quantity;

					transaction.update(productRef, {
						'inventory.availableStock': stockCheck.availableStock - stockDiff,
						'inventory.reservedStock': stockCheck.reservedStock + stockDiff,
						'timestamps.updatedAt': serverTimestamp()
					});

					return { reservationId: existingReservationDoc.id };
				}
			}

			// 3. 新規予約を作成
			const reservationData: Omit<CartReservation, 'id'> = {
				userId,
				sessionId: sessionId || `session_${Date.now()}`,
				productId,
				quantity,
				createdAt: serverTimestamp() as Timestamp,
				expiresAt: calculateExpiryTime(),
				status: 'active'
			};

			const reservationRef = doc(collection(db, RESERVATIONS_COLLECTION));
			transaction.set(reservationRef, reservationData);

			// 4. 商品の在庫を更新
			const productRef = doc(db, PRODUCTS_COLLECTION, productId);
			transaction.update(productRef, {
				'inventory.availableStock': stockCheck.availableStock - quantity,
				'inventory.reservedStock': stockCheck.reservedStock + quantity,
				'timestamps.updatedAt': serverTimestamp()
			});

			return { reservationId: reservationRef.id };
		});
	}, 'stock-reservation');

	if (result.error) {
		console.error('Error reserving stock:', result.error);

		// エラーメッセージからエラーコードを抽出
		const errorMessage = result.error.message;
		if (errorMessage.includes('insufficient-stock')) {
			return {
				success: false,
				error: {
					code: 'insufficient-stock',
					message: errorMessage.split(':')[1] || 'Insufficient stock',
					productId,
					requestedQuantity: quantity
				}
			};
		}

		if (errorMessage.includes('product-inactive')) {
			return {
				success: false,
				error: {
					code: 'product-inactive',
					message: 'Product is not available',
					productId
				}
			};
		}

		return {
			success: false,
			error: {
				code: 'validation-error',
				message: 'Failed to reserve stock',
				productId,
				requestedQuantity: quantity
			}
		};
	}

	return {
		success: true,
		reservationId: result.data!.reservationId
	};
};

/**
 * 予約をキャンセル（在庫を解放）
 */
export const cancelReservation = async (
	productId: string,
	userId?: string,
	sessionId?: string
): Promise<{ success: boolean; error?: ProductError }> => {
	const result = await handleAsyncOperation(async () => {
		return await runTransaction(db, async (transaction) => {
			// 1. 予約を検索
			const reservationQuery = query(
				collection(db, RESERVATIONS_COLLECTION),
				where('productId', '==', productId),
				where('status', '==', 'active'),
				userId ? where('userId', '==', userId) : where('sessionId', '==', sessionId)
			);

			const reservationSnapshot = await getDocs(reservationQuery);

			if (reservationSnapshot.empty) {
				throw new Error('Reservation not found');
			}

			const reservationDoc = reservationSnapshot.docs[0];
			const reservation = reservationDoc.data() as CartReservation;

			// 2. 予約をキャンセル状態に更新
			transaction.update(reservationDoc.ref, {
				status: 'cancelled'
			});

			// 3. 商品の在庫を復元
			const productRef = doc(db, PRODUCTS_COLLECTION, productId);
			const productSnapshot = await transaction.get(productRef);

			if (productSnapshot.exists()) {
				const currentStock = productSnapshot.data().inventory;

				transaction.update(productRef, {
					'inventory.availableStock': currentStock.availableStock + reservation.quantity,
					'inventory.reservedStock': currentStock.reservedStock - reservation.quantity,
					'timestamps.updatedAt': serverTimestamp()
				});
			}

			return { success: true };
		});
	}, 'cancel-reservation');

	if (result.error) {
		console.error('Error cancelling reservation:', result.error);
		return {
			success: false,
			error: {
				code: 'not-found',
				message: 'Reservation not found or already processed',
				productId
			}
		};
	}

	return result.data || { success: false };
};

/**
 * 期限切れ予約を自動削除
 */
export const cleanupExpiredReservations = async (): Promise<number> => {
	const result = await handleAsyncOperation(async () => {
		const now = Timestamp.now();
		const expiredQuery = query(
			collection(db, RESERVATIONS_COLLECTION),
			where('status', '==', 'active'),
			where('expiresAt', '<=', now)
		);

		const expiredSnapshot = await getDocs(expiredQuery);

		if (expiredSnapshot.empty) {
			return 0;
		}

		const batch = writeBatch(db);
		const productUpdates: { [productId: string]: number } = {};

		// 期限切れ予約を処理
		expiredSnapshot.docs.forEach((doc) => {
			const reservation = doc.data() as CartReservation;

			// 予約を期限切れ状態に更新
			batch.update(doc.ref, { status: 'expired' });

			// 商品ごとの復元数量を集計
			if (!productUpdates[reservation.productId]) {
				productUpdates[reservation.productId] = 0;
			}
			productUpdates[reservation.productId] += reservation.quantity;
		});

		// 商品の在庫を復元
		for (const [productId, quantity] of Object.entries(productUpdates)) {
			const productRef = doc(db, PRODUCTS_COLLECTION, productId);

			// トランザクションではなくバッチで処理（パフォーマンス優先）
			batch.update(productRef, {
				'inventory.availableStock': serverTimestamp(), // FieldValue.increment(quantity) の代替
				'inventory.reservedStock': serverTimestamp(), // FieldValue.increment(-quantity) の代替
				'timestamps.updatedAt': serverTimestamp()
			});
		}

		await batch.commit();

		// 実際の在庫更新（increment処理）
		for (const [productId, quantity] of Object.entries(productUpdates)) {
			const productRef = doc(db, PRODUCTS_COLLECTION, productId);
			const productDoc = await getDoc(productRef);

			if (productDoc.exists()) {
				const currentInventory = productDoc.data().inventory;
				await updateDoc(productRef, {
					'inventory.availableStock': currentInventory.availableStock + quantity,
					'inventory.reservedStock': Math.max(0, currentInventory.reservedStock - quantity)
				});
			}
		}

		return expiredSnapshot.docs.length;
	}, 'cleanup-expired-reservations');

	if (result.error) {
		console.error('Error cleaning up expired reservations:', result.error);
		return 0;
	}

	return result.data || 0;
};

/**
 * ユーザー/セッションの全予約を取得
 */
export const getUserReservations = async (
	userId?: string,
	sessionId?: string
): Promise<CartReservation[]> => {
	const result = await handleAsyncOperation(async () => {
		if (!userId && !sessionId) {
			return [];
		}

		const reservationQuery = query(
			collection(db, RESERVATIONS_COLLECTION),
			where('status', '==', 'active'),
			userId ? where('userId', '==', userId) : where('sessionId', '==', sessionId),
			orderBy('createdAt', 'desc')
		);

		const snapshot = await getDocs(reservationQuery);
		const reservations: CartReservation[] = [];

		snapshot.forEach((doc) => {
			reservations.push({ id: doc.id, ...doc.data() } as CartReservation);
		});

		return reservations;
	}, 'get-user-reservations');

	return result.data || [];
};

/**
 * 予約を確定（チェックアウト時）
 */
export const confirmReservations = async (
	reservationIds: string[]
): Promise<{ success: boolean; confirmedIds: string[]; errors: ProductError[] }> => {
	const result = await handleAsyncOperation(async () => {
		const confirmedIds: string[] = [];
		const errors: ProductError[] = [];

		const batch = writeBatch(db);

		for (const reservationId of reservationIds) {
			try {
				const reservationRef = doc(db, RESERVATIONS_COLLECTION, reservationId);
				const reservationDoc = await getDoc(reservationRef);

				if (!reservationDoc.exists()) {
					errors.push({
						code: 'not-found',
						message: `Reservation ${reservationId} not found`
					});
					continue;
				}

				const reservation = reservationDoc.data() as CartReservation;

				// 期限チェック
				if (reservation.expiresAt.toMillis() < Date.now()) {
					errors.push({
						code: 'reservation-expired',
						message: `Reservation ${reservationId} has expired`,
						productId: reservation.productId
					});
					continue;
				}

				// 予約を確定状態に更新
				batch.update(reservationRef, { status: 'confirmed' });
				confirmedIds.push(reservationId);

			} catch (error) {
				errors.push({
					code: 'validation-error',
					message: `Error processing reservation ${reservationId}: ${error}`
				});
			}
		}

		await batch.commit();

		return {
			success: confirmedIds.length > 0,
			confirmedIds,
			errors
		};
	}, 'confirm-reservations');

	if (result.error) {
		return {
			success: false,
			confirmedIds: [],
			errors: [{
				code: 'validation-error',
				message: 'Failed to confirm reservations'
			}]
		};
	}

	return result.data!;
};

// 定期クリーンアップを設定（ブラウザ環境で定期実行）
let cleanupInterval: NodeJS.Timeout | null = null;

export const startPeriodicCleanup = () => {
	if (cleanupInterval) return;

	// 10分ごとに期限切れ予約をクリーンアップ
	cleanupInterval = setInterval(() => {
		cleanupExpiredReservations()
			.then((cleaned) => {
				if (cleaned > 0) {
					console.log(`🧹 Cleaned up ${cleaned} expired reservations`);
				}
			})
			.catch((error) => {
				console.error('Error in periodic cleanup:', error);
			});
	}, 10 * 60 * 1000);
};

export const stopPeriodicCleanup = () => {
	if (cleanupInterval) {
		clearInterval(cleanupInterval);
		cleanupInterval = null;
	}
};
// src/app/dashboard/context/DashboardContext.tsx
'use client';

import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { DashboardState, CartItem, UserProfile, SectionType } from '../../../../types/dashboard';
import { 
	cancelReservation, 
	generateSessionId, 
	getUserReservations,
	startPeriodicCleanup,
	stopPeriodicCleanup 
} from '@/lib/firestore/inventory';
import { useAuth } from '@/contexts/AuthContext';

// カート有効期限（30日）
const CART_EXPIRY_DAYS = 30;
const CART_EXPIRY_MS = CART_EXPIRY_DAYS * 24 * 60 * 60 * 1000;

// 拡張されたCartItemの型（有効期限付き）
interface CartItemWithExpiry extends CartItem {
	addedAt: string; // ISO string
	reservationId?: string; // Firestore予約ID
}

// Actions
type DashboardAction =
	| { type: 'SET_USER_PROFILE'; payload: UserProfile | null }
	| { type: 'ADD_TO_CART'; payload: CartItem & { maxStock?: number; reservationId?: string } }
	| { type: 'REMOVE_FROM_CART'; payload: string }
	| { type: 'UPDATE_CART_QUANTITY'; payload: { id: string; quantity: number; maxStock?: number } }
	| { type: 'CLEAR_CART' }
	| { type: 'CLEAR_EXPIRED_ITEMS' }
	| { type: 'SYNC_WITH_RESERVATIONS'; payload: CartItemWithExpiry[] }
	| { type: 'LOAD_FROM_STORAGE'; payload: Partial<DashboardState> }
	| { type: 'SET_HYDRATED'; payload: boolean }
	| { type: 'SET_ACTIVE_SECTION'; payload: SectionType | null }
	| { type: 'SET_SLIDE_OPEN'; payload: boolean };

// Helper functions for cart management
const isItemExpired = (addedAt: string): boolean => {
	const addedTime = new Date(addedAt).getTime();
	const currentTime = Date.now();
	return currentTime - addedTime > CART_EXPIRY_MS;
};

const validateQuantity = (quantity: number, maxStock?: number): number => {
	const validQuantity = Math.max(1, Math.min(quantity, 10)); // 最低1個、最大10個
	return maxStock ? Math.min(validQuantity, maxStock) : validQuantity;
};

const removeExpiredItems = (items: CartItemWithExpiry[]): CartItemWithExpiry[] => {
	return items.filter(item => !isItemExpired(item.addedAt));
};

//拡張されたDashboardStateの型
interface ExtendedDashboardState extends DashboardState {
	sessionId: string;
	isFirestoreSynced: boolean;
	isHydrated: boolean; // ハイドレーション完了フラグを追加
}

// Initial state
const initialState: ExtendedDashboardState = {
	activeSection: null,
	isSlideOpen: false,
	cartItems: [],
	userProfile: null,
	walletConnected: false,
	sessionId: generateSessionId(),
	isFirestoreSynced: false,
	isHydrated: false, // 初期状態では false
};

// Reducer
function dashboardReducer(state: ExtendedDashboardState, action: DashboardAction): ExtendedDashboardState {
	switch (action.type) {
		case 'SET_USER_PROFILE':
			return { ...state, userProfile: action.payload };

		case 'ADD_TO_CART': {
			const { maxStock, reservationId, ...itemData } = action.payload;
			const newItem: CartItemWithExpiry = {
				...itemData,
				addedAt: new Date().toISOString(),
				reservationId
			};

			// 期限切れアイテムを除去
			const validItems = removeExpiredItems(state.cartItems as CartItemWithExpiry[]);
			
			const existingItem = validItems.find(item => item.id === newItem.id);
			
			if (existingItem) {
				const newQuantity = validateQuantity(existingItem.quantity + newItem.quantity, maxStock);
				return {
					...state,
					cartItems: validItems.map(item =>
						item.id === newItem.id
							? { ...item, quantity: newQuantity, reservationId: reservationId || (item as CartItemWithExpiry).reservationId }
							: item
					),
				};
			}

			// 新しいアイテムの数量検証
			const validatedQuantity = validateQuantity(newItem.quantity, maxStock);
			
			return {
				...state,
				cartItems: [...validItems, { ...newItem, quantity: validatedQuantity }],
			};
		}

		case 'REMOVE_FROM_CART': {
			const validItems = removeExpiredItems(state.cartItems as CartItemWithExpiry[]);
			const itemToRemove = validItems.find(item => item.id === action.payload) as CartItemWithExpiry;
			
			// Firestore予約もキャンセル（非同期）
			if (itemToRemove?.reservationId) {
				cancelReservation(action.payload, undefined, state.sessionId)
					.catch(error => console.error('Failed to cancel reservation:', error));
			}
			
			return {
				...state,
				cartItems: validItems.filter(item => item.id !== action.payload),
			};
		}

		case 'UPDATE_CART_QUANTITY': {
			const { id, quantity, maxStock } = action.payload;
			const validItems = removeExpiredItems(state.cartItems as CartItemWithExpiry[]);
			
			if (quantity <= 0) {
				const itemToRemove = validItems.find(item => item.id === id) as CartItemWithExpiry;
				
				// Firestore予約もキャンセル（非同期）
				if (itemToRemove?.reservationId) {
					cancelReservation(id, undefined, state.sessionId)
						.catch(error => console.error('Failed to cancel reservation:', error));
				}
				
				return {
					...state,
					cartItems: validItems.filter(item => item.id !== id),
				};
			}

			const validatedQuantity = validateQuantity(quantity, maxStock);
			
			return {
				...state,
				cartItems: validItems.map(item =>
					item.id === id
						? { ...item, quantity: validatedQuantity }
						: item
				),
			};
		}

		case 'CLEAR_CART': {
			// 全ての予約をキャンセル（非同期）
			const itemsWithReservations = state.cartItems.filter(item => (item as CartItemWithExpiry).reservationId);
			itemsWithReservations.forEach(item => {
				cancelReservation(item.id, undefined, state.sessionId)
					.catch(error => console.error('Failed to cancel reservation:', error));
			});
			
			return { ...state, cartItems: [] };
		}

		case 'CLEAR_EXPIRED_ITEMS': {
			const validItems = removeExpiredItems(state.cartItems as CartItemWithExpiry[]);
			return { ...state, cartItems: validItems };
		}

		case 'SYNC_WITH_RESERVATIONS': {
			return { 
				...state, 
				cartItems: action.payload,
				isFirestoreSynced: true 
			};
		}

		case 'LOAD_FROM_STORAGE': {
			// ストレージからロード時も期限チェック
			const loadedData = { ...action.payload };
			if (loadedData.cartItems) {
				loadedData.cartItems = removeExpiredItems(loadedData.cartItems as CartItemWithExpiry[]);
			}
			return { ...state, ...loadedData };
		}

		case 'SET_HYDRATED':
			return { ...state, isHydrated: action.payload };

		case 'SET_ACTIVE_SECTION':
			return { ...state, activeSection: action.payload };

		case 'SET_SLIDE_OPEN':
			return { ...state, isSlideOpen: action.payload };

		default:
			return state;
	}
}

// Context
const DashboardContext = createContext<{
	state: ExtendedDashboardState;
	dispatch: React.Dispatch<DashboardAction>;
} | null>(null);

// Provider
export function DashboardProvider({ children }: { children: React.ReactNode }) {
	const [state, dispatch] = useReducer(dashboardReducer, initialState);
	const { user } = useAuth();

	// Load from localStorage on mount (クライアントサイドのみ)
	useEffect(() => {
		// ブラウザ環境でのみ実行
		if (typeof window === 'undefined') return;
		
		try {
			const savedState = localStorage.getItem('dashboard-state');
			if (savedState) {
				const parsed = JSON.parse(savedState);
				console.log('📦 Loading from localStorage:', parsed);
				dispatch({ type: 'LOAD_FROM_STORAGE', payload: parsed });
			}
		} catch (error) {
			console.error('Failed to load dashboard state from localStorage:', error);
		} finally {
			// ハイドレーション完了をマーク
			dispatch({ type: 'SET_HYDRATED', payload: true });
		}
	}, []);

	// Firestore予約との同期
	useEffect(() => {
		const syncWithFirestore = async () => {
			try {
				const userId = user?.uid;
				const sessionId = state.sessionId;
				
				// Firestore予約を取得
				const reservations = await getUserReservations(userId, sessionId);
				
				if (reservations.length > 0) {
					// 予約をカートアイテムに変換
					const reservedItems: CartItemWithExpiry[] = reservations.map(reservation => ({
						id: reservation.productId,
						name: `Product ${reservation.productId}`, // 実際は商品データから取得
						price: 27.8, // 実際は商品データから取得
						quantity: reservation.quantity,
						currency: 'ETH' as const,
						addedAt: reservation.createdAt.toDate().toISOString(),
						reservationId: reservation.id
					}));
					
					// ローカルカートと予約を同期
					dispatch({ type: 'SYNC_WITH_RESERVATIONS', payload: reservedItems });
				}
			} catch (error) {
				console.error('Failed to sync with Firestore reservations:', error);
			}
		};

		// 初回ロード時にFirestore同期
		if (!state.isFirestoreSynced) {
			syncWithFirestore();
		}
	}, [user, state.sessionId, state.isFirestoreSynced]);

	// 定期的なクリーンアップの開始
	useEffect(() => {
		startPeriodicCleanup();
		
		return () => {
			stopPeriodicCleanup();
		};
	}, []);

	// Save to localStorage when state changes (ハイドレーション完了後のみ)
	useEffect(() => {
		// ハイドレーション完了前は保存しない
		if (!state.isHydrated) return;
		
		try {
			const stateToSave = {
				cartItems: state.cartItems,
				userProfile: state.userProfile,
				sessionId: state.sessionId,
				lastUpdated: new Date().toISOString(),
			};
			console.log('💾 Saving to localStorage:', stateToSave);
			localStorage.setItem('dashboard-state', JSON.stringify(stateToSave));
		} catch (error) {
			console.error('Failed to save dashboard state to localStorage:', error);
		}
	}, [state.cartItems, state.userProfile, state.sessionId, state.isHydrated]);

	// Notify header about cart changes (ハイドレーション完了後のみ)
	useEffect(() => {
		// ハイドレーション完了前は通知しない
		if (!state.isHydrated) return;
		
		const itemCount = state.cartItems.reduce((count, item) => count + item.quantity, 0);
		
		// カスタムイベントでヘッダーにカート数を通知
		const cartUpdateEvent = new CustomEvent('cartUpdated', {
			detail: { itemCount }
		});
		window.dispatchEvent(cartUpdateEvent);
		console.log('🔔 Cart updated notification sent:', itemCount);
	}, [state.cartItems, state.isHydrated]);

	// Set up cart click handler for header
	useEffect(() => {
		const cartClickHandler = () => {
			dispatch({ type: 'SET_ACTIVE_SECTION', payload: 'cart' });
			dispatch({ type: 'SET_SLIDE_OPEN', payload: true });
		};

		// カスタムイベントでヘッダーにクリックハンドラーを登録
		const handlerEvent = new CustomEvent('cartClickHandlerSet', {
			detail: { clickHandler: cartClickHandler }
		});
		window.dispatchEvent(handlerEvent);
	}, []);

	return (
		<DashboardContext.Provider value={{ state, dispatch }}>
			{children}
		</DashboardContext.Provider>
	);
}

// Hook
export function useDashboard() {
	const context = useContext(DashboardContext);
	if (!context) {
		throw new Error('useDashboard must be used within a DashboardProvider');
	}
	return context;
}

// Panel management hook
export function usePanel() {
	const { state, dispatch } = useDashboard();

	const openPanel = (section: SectionType) => {
		dispatch({ type: 'SET_ACTIVE_SECTION', payload: section });
		dispatch({ type: 'SET_SLIDE_OPEN', payload: true });
	};

	const closePanel = () => {
		dispatch({ type: 'SET_SLIDE_OPEN', payload: false });
		// アニメーション完了後にactiveSectionをクリア
		setTimeout(() => {
			dispatch({ type: 'SET_ACTIVE_SECTION', payload: null });
		}, 300);
	};

	return {
		activeSection: state.activeSection,
		isSlideOpen: state.isSlideOpen,
		openPanel,
		closePanel,
	};
}

// Cart management hook
export function useCart() {
	const { state, dispatch } = useDashboard();

	const addToCart = (item: CartItem, maxStock?: number, reservationId?: string) => {
		dispatch({ type: 'ADD_TO_CART', payload: { ...item, maxStock, reservationId } });
	};

	const removeFromCart = (id: string) => {
		dispatch({ type: 'REMOVE_FROM_CART', payload: id });
	};

	const updateQuantity = (id: string, quantity: number, maxStock?: number) => {
		dispatch({ type: 'UPDATE_CART_QUANTITY', payload: { id, quantity, maxStock } });
	};

	const clearCart = () => {
		dispatch({ type: 'CLEAR_CART' });
	};

	const getCartTotal = () => {
		return state.cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
	};

	const getCartItemCount = () => {
		return state.cartItems.reduce((count, item) => count + item.quantity, 0);
	};

	// カート内のアイテムの残り有効期限を取得
	const getItemTimeLeft = (addedAt: string) => {
		const addedTime = new Date(addedAt).getTime();
		const currentTime = Date.now();
		const timeLeft = CART_EXPIRY_MS - (currentTime - addedTime);
		
		if (timeLeft <= 0) return null;
		
		const daysLeft = Math.floor(timeLeft / (24 * 60 * 60 * 1000));
		const hoursLeft = Math.floor((timeLeft % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
		
		if (daysLeft > 0) return `${daysLeft} day${daysLeft > 1 ? 's' : ''} left`;
		if (hoursLeft > 0) return `${hoursLeft} hour${hoursLeft > 1 ? 's' : ''} left`;
		return 'Expires soon';
	};

	// 在庫チェック機能
	const checkStock = (id: string, requestedQuantity: number, availableStock: number) => {
		const currentItem = state.cartItems.find(item => item.id === id);
		const currentQuantity = currentItem ? currentItem.quantity : 0;
		const totalRequested = currentQuantity + requestedQuantity;
		
		return {
			canAdd: totalRequested <= availableStock && totalRequested <= 10,
			maxCanAdd: Math.min(availableStock - currentQuantity, 10 - currentQuantity),
			willExceedStock: totalRequested > availableStock,
			willExceedLimit: totalRequested > 10
		};
	};

	// Firestore予約情報を含むカートアイテムを取得
	const getCartItemsWithReservations = () => {
		return state.cartItems.map(item => {
			const itemWithReservation = item as CartItemWithExpiry;
			return {
				...item,
				reservationId: itemWithReservation.reservationId,
				addedAt: itemWithReservation.addedAt,
				timeLeft: getItemTimeLeft(itemWithReservation.addedAt)
			};
		});
	};

	// セッションIDを取得
	const getSessionId = () => state.sessionId;

	// Firestore同期状態を取得
	const isFirestoreSynced = () => state.isFirestoreSynced;

	return {
		cartItems: state.cartItems,
		addToCart,
		removeFromCart,
		updateQuantity,
		clearCart,
		getCartTotal,
		getCartItemCount,
		getItemTimeLeft,
		checkStock,
		getCartItemsWithReservations,
		getSessionId,
		isFirestoreSynced,
	};
}

// Profile management hook
export function useProfile() {
	const { state, dispatch } = useDashboard();

	const setUserProfile = (profile: UserProfile | null) => {
		dispatch({ type: 'SET_USER_PROFILE', payload: profile });
	};

	return {
		userProfile: state.userProfile,
		setUserProfile,
	};
}

// Optional wallet hook for future integration
export function useWallet() {
	const { state } = useDashboard();

	const connectWallet = () => {
		console.log('Wallet connection not required for invoice payments');
	};

	const disconnectWallet = () => {
		console.log('Wallet disconnection not required for invoice payments');
	};

	return {
		walletConnected: false,
		userProfile: state.userProfile,
		connectWallet,
		disconnectWallet,
	};
}
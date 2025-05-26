// src/app/dashboard/context/DashboardContext.tsx
'use client';

import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { DashboardState, CartItem, UserProfile, SectionType } from '../../../../types/dashboard';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';

// カート有効期限（30日）
const CART_EXPIRY_DAYS = 30;
const CART_EXPIRY_MS = CART_EXPIRY_DAYS * 24 * 60 * 60 * 1000;

// 簡素化されたCartItemの型（有効期限のみ）
interface CartItemWithExpiry extends CartItem {
	addedAt: string; // ISO string
}

// Actions
type DashboardAction =
	| { type: 'SET_USER_PROFILE'; payload: UserProfile | null }
	| { type: 'ADD_TO_CART'; payload: CartItem & { maxStock?: number } }
	| { type: 'REMOVE_FROM_CART'; payload: string }
	| { type: 'UPDATE_CART_QUANTITY'; payload: { id: string; quantity: number; maxStock?: number } }
	| { type: 'CLEAR_CART' }
	| { type: 'CLEAR_EXPIRED_ITEMS' }
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

// 拡張されたDashboardStateの型
interface ExtendedDashboardState extends DashboardState {
	isHydrated: boolean; // ハイドレーション完了フラグ
}

// Initial state
const initialState: ExtendedDashboardState = {
	activeSection: null,
	isSlideOpen: false,
	cartItems: [],
	userProfile: null,
	walletConnected: false,
	isHydrated: false, // 初期状態では false
};

// Reducer
function dashboardReducer(state: ExtendedDashboardState, action: DashboardAction): ExtendedDashboardState {
	switch (action.type) {
		case 'SET_USER_PROFILE':
			return { ...state, userProfile: action.payload };

		case 'ADD_TO_CART': {
			const { maxStock, ...itemData } = action.payload;
			const newItem: CartItemWithExpiry = {
				...itemData,
				addedAt: new Date().toISOString()
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
							? { ...item, quantity: newQuantity }
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

			return {
				...state,
				cartItems: validItems.filter(item => item.id !== action.payload),
			};
		}

		case 'UPDATE_CART_QUANTITY': {
			const { id, quantity, maxStock } = action.payload;
			const validItems = removeExpiredItems(state.cartItems as CartItemWithExpiry[]);

			if (quantity <= 0) {
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
			return { ...state, cartItems: [] };
		}

		case 'CLEAR_EXPIRED_ITEMS': {
			const validItems = removeExpiredItems(state.cartItems as CartItemWithExpiry[]);
			return { ...state, cartItems: validItems };
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
	const { isAuthenticated, walletAddress } = useUnifiedAuth()

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

	// 期限切れアイテムの定期クリーンアップ（1時間ごと）
	useEffect(() => {
		const cleanup = () => {
			dispatch({ type: 'CLEAR_EXPIRED_ITEMS' });
		};

		// 初回クリーンアップ
		cleanup();

		// 1時間ごとにクリーンアップ
		const interval = setInterval(cleanup, 60 * 60 * 1000);

		return () => clearInterval(interval);
	}, []);

	// Save to localStorage when state changes (ハイドレーション完了後のみ)
	useEffect(() => {
		// ハイドレーション完了前は保存しない
		if (!state.isHydrated) return;

		try {
			const stateToSave = {
				cartItems: state.cartItems,
				userProfile: state.userProfile,
				lastUpdated: new Date().toISOString(),
			};
			console.log('💾 Saving to localStorage:', stateToSave);
			localStorage.setItem('dashboard-state', JSON.stringify(stateToSave));
		} catch (error) {
			console.error('Failed to save dashboard state to localStorage:', error);
		}
	}, [state.cartItems, state.userProfile, state.isHydrated]);

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

	const addToCart = (item: CartItem, maxStock?: number) => {
		dispatch({ type: 'ADD_TO_CART', payload: { ...item, maxStock } });
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

	// 在庫チェック機能（ローカル版）
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

	// カートアイテムの詳細情報を取得（期限情報付き）
	const getCartItemsWithDetails = () => {
		return state.cartItems.map(item => {
			const itemWithExpiry = item as CartItemWithExpiry;
			return {
				...item,
				addedAt: itemWithExpiry.addedAt,
				timeLeft: getItemTimeLeft(itemWithExpiry.addedAt)
			};
		});
	};

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
		getCartItemsWithDetails,
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
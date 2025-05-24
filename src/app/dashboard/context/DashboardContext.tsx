// src/app/dashboard/context/DashboardContext.tsx
'use client';

import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { DashboardState, CartItem, UserProfile, SectionType } from '../../../../types/dashboard';

// Actions
type DashboardAction =
	| { type: 'SET_USER_PROFILE'; payload: UserProfile | null }
	| { type: 'ADD_TO_CART'; payload: CartItem }
	| { type: 'REMOVE_FROM_CART'; payload: string }
	| { type: 'UPDATE_CART_QUANTITY'; payload: { id: string; quantity: number } }
	| { type: 'CLEAR_CART' }
	| { type: 'LOAD_FROM_STORAGE'; payload: Partial<DashboardState> }
	| { type: 'SET_ACTIVE_SECTION'; payload: SectionType | null }
	| { type: 'SET_SLIDE_OPEN'; payload: boolean };

// Initial state
const initialState: DashboardState = {
	activeSection: null,
	isSlideOpen: false,
	cartItems: [],
	userProfile: null,
	walletConnected: false,
};

// Reducer
function dashboardReducer(state: DashboardState, action: DashboardAction): DashboardState {
	switch (action.type) {
		case 'SET_USER_PROFILE':
			return { ...state, userProfile: action.payload };

		case 'ADD_TO_CART': {
			const existingItem = state.cartItems.find(item => item.id === action.payload.id);
			if (existingItem) {
				return {
					...state,
					cartItems: state.cartItems.map(item =>
						item.id === action.payload.id
							? { ...item, quantity: item.quantity + action.payload.quantity }
							: item
					),
				};
			}
			return {
				...state,
				cartItems: [...state.cartItems, action.payload],
			};
		}

		case 'REMOVE_FROM_CART':
			return {
				...state,
				cartItems: state.cartItems.filter(item => item.id !== action.payload),
			};

		case 'UPDATE_CART_QUANTITY':
			return {
				...state,
				cartItems: state.cartItems.map(item =>
					item.id === action.payload.id
						? { ...item, quantity: Math.max(0, action.payload.quantity) }
						: item
				).filter(item => item.quantity > 0),
			};

		case 'CLEAR_CART':
			return { ...state, cartItems: [] };

		case 'LOAD_FROM_STORAGE':
			return { ...state, ...action.payload };

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
	state: DashboardState;
	dispatch: React.Dispatch<DashboardAction>;
} | null>(null);

// Provider
export function DashboardProvider({ children }: { children: React.ReactNode }) {
	const [state, dispatch] = useReducer(dashboardReducer, initialState);

	// Load from localStorage on mount
	useEffect(() => {
		try {
			const savedState = localStorage.getItem('dashboard-state');
			if (savedState) {
				const parsed = JSON.parse(savedState);
				dispatch({ type: 'LOAD_FROM_STORAGE', payload: parsed });
			}
		} catch (error) {
			console.error('Failed to load dashboard state from localStorage:', error);
		}
	}, []);

	// Save to localStorage when state changes
	useEffect(() => {
		try {
			const stateToSave = {
				cartItems: state.cartItems,
				userProfile: state.userProfile,
			};
			localStorage.setItem('dashboard-state', JSON.stringify(stateToSave));
		} catch (error) {
			console.error('Failed to save dashboard state to localStorage:', error);
		}
	}, [state.cartItems, state.userProfile]);

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

	const addToCart = (item: CartItem) => {
		dispatch({ type: 'ADD_TO_CART', payload: item });
	};

	const removeFromCart = (id: string) => {
		dispatch({ type: 'REMOVE_FROM_CART', payload: id });
	};

	const updateQuantity = (id: string, quantity: number) => {
		dispatch({ type: 'UPDATE_CART_QUANTITY', payload: { id, quantity } });
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

	return {
		cartItems: state.cartItems,
		addToCart,
		removeFromCart,
		updateQuantity,
		clearCart,
		getCartTotal,
		getCartItemCount,
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
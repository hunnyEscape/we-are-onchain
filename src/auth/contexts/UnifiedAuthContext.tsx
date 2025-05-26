// src/auth/contexts/UnifiedAuthContext.tsx (簡素化版)
'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { ChainType } from '@/types/wallet';
import { SelectableChainId, SelectableChain } from '@/types/chain-selection';
import { testnetUtils } from '@/auth/config/testnet-chains';
import {
	ExtendedFirestoreUser,
	WalletOperationResult,
	AuthFlowState
} from '@/types/user-extended';
import { UnifiedAuthState, AuthConfig, AuthActions, AuthEvent, AuthEventType, UseAuthReturn } from '@/types/auth';
import { WalletAuthRequest, WalletAuthResponse } from '@/types/api-wallet';

// サブモジュールのインポート
import { useChainSelection } from '@/auth/hooks/useChainSelection';
import { useAuthFlow, ExtendedAuthStep } from '@/auth/hooks/useAuthFlow';
import { AuthActionsService } from '@/auth/services/AuthActionsService';

// EVMWalletProviderはオプショナルにする
let useEVMWallet: any = null;
try {
	const evmModule = require('@/auth/providers/EVMWalletAdapterWrapper');
	useEVMWallet = evmModule.useEVMWallet;
} catch (error) {
	console.warn('EVMWallet not available:', error);
}

// デフォルト設定（Extended Wallet専用）
const DEFAULT_CONFIG: AuthConfig = {
	preferredMethod: 'wallet',
	enableFirebase: false,
	enableWallet: true,
	autoConnect: true,
	sessionTimeout: 24 * 60,
	walletConfig: {
		enabledChains: ['evm'],
		preferredChain: 'evm',
	},
};

/**
 * 簡素化されたUnifiedAuthContextの型定義
 */
interface SimplifiedUnifiedAuthContextType extends Omit<UseAuthReturn, 'selectChain'> {
	// 設定
	config: AuthConfig;

	// 基本状態
	extendedUser: ExtendedFirestoreUser | null;
	authFlowState: AuthFlowState;

	// サブモジュール
	chainSelection: ReturnType<typeof useChainSelection>;
	authFlow: ReturnType<typeof useAuthFlow>;
	evmWallet: any; // EVMWallet interface

	// 基本アクション（簡素化）
	connectWallet: (chainType?: ChainType, walletType?: string) => Promise<any>;
	authenticateWallet: (chainType?: ChainType, address?: string) => Promise<any>;
	logout: () => Promise<void>;
	refreshExtendedUser: () => Promise<void>;

	// 統合アクション（新規）
	connectWithChain: (chainId: SelectableChainId, walletType?: string) => Promise<any>;
	completeAuthFlow: (chainId: SelectableChainId, walletType?: string) => Promise<any>;

	// ユーティリティ
	updateUserProfile: (profileData: any) => Promise<WalletOperationResult>;
	getAuthHistory: () => ExtendedFirestoreUser['authHistory'] | null;
	getConnectedWallets: () => ExtendedFirestoreUser['connectedWallets'] | null;

	// デバッグ情報
	_debug: {
		firebaseReady: boolean;
		walletReady: boolean;
		lastError: string | null;
		apiCalls: number;
		lastApiCall: Date | null;
		authActions: any;
		modules: {
			chainSelection: any;
			authFlow: any;
			evmWallet: any;
		};
	};
}

const UnifiedAuthContext = createContext<SimplifiedUnifiedAuthContextType | undefined>(undefined);

interface UnifiedAuthProviderProps {
	children: React.ReactNode;
	config?: Partial<AuthConfig>;
}

/**
 * 簡素化されたUnifiedAuthProvider
 */
export const UnifiedAuthProvider = ({ children, config: userConfig = {} }: UnifiedAuthProviderProps) => {
	const config = { ...DEFAULT_CONFIG, ...userConfig };

	// 基本状態
	const [extendedUser, setExtendedUser] = useState<ExtendedFirestoreUser | null>(null);
	const [isAuthenticated, setIsAuthenticated] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [firestoreLoading, setFirestoreLoading] = useState(false);

	// デバッグ情報
	const [debugInfo, setDebugInfo] = useState({
		firebaseReady: false,
		walletReady: false,
		lastError: null as string | null,
		apiCalls: 0,
		lastApiCall: null as Date | null,
	});

	// EVMウォレットの初期化
	const evmWallet = useEVMWallet ? useEVMWallet() : {
		walletState: {
			isConnecting: false,
			isConnected: false,
			isAuthenticated: false,
			chainType: 'evm' as ChainType,
		},
		connectWallet: async () => { throw new Error('EVM Wallet not available'); },
		disconnectWallet: async () => { throw new Error('EVM Wallet not available'); },
		isConnecting: false,
		isConnected: false,
		address: null,
		chainId: null,
		chainName: null,
		authenticate: async () => ({ success: false, error: 'EVM Wallet not available' }),
		isAuthenticated: false,
		signMessage: async () => { throw new Error('EVM Wallet not available'); },
		signAuthMessage: async () => { throw new Error('EVM Wallet not available'); },
		switchChain: async () => { throw new Error('EVM Wallet not available'); },
		openConnectModal: undefined,
		openAccountModal: undefined,
		error: null,
	};

	// イベントエミッター
	const eventListeners = useState(new Map<string, Set<(event: AuthEvent) => void>>())[0];

	// イベント発火
	const emitEvent = useCallback((type: AuthEventType, data?: any) => {
		const event: AuthEvent = {
			type,
			timestamp: new Date(),
			data,
		};

		console.log('🔔 Auth Event:', event);

		const listeners = eventListeners.get(type);
		if (listeners) {
			listeners.forEach(callback => callback(event));
		}
	}, [eventListeners]);

	// エラーハンドリング
	const handleError = useCallback((error: any, context?: string) => {
		const errorMessage = error?.message || error?.toString() || 'Unknown error';
		const fullError = context ? `${context}: ${errorMessage}` : errorMessage;

		console.error('🚨 UnifiedAuth Error:', fullError, error);
		setError(fullError);
		setDebugInfo(prev => ({ ...prev, lastError: fullError }));

		emitEvent('error', { error: fullError, context });
	}, [emitEvent]);

	// API呼び出しヘルパー
	const callExtendedAPI = useCallback(async (url: string, options: RequestInit = {}) => {
		setDebugInfo(prev => ({
			...prev,
			apiCalls: prev.apiCalls + 1,
			lastApiCall: new Date()
		}));

		const response = await fetch(url, {
			headers: {
				'Content-Type': 'application/json',
				...options.headers,
			},
			...options,
		});

		if (!response.ok) {
			throw new Error(`API call failed: ${response.status} ${response.statusText}`);
		}

		return response.json();
	}, []);

	// サブモジュールの初期化
	const chainSelection = useChainSelection(
		evmWallet.chainId,
		evmWallet.isConnected,
		evmWallet.switchChain,
		emitEvent,
		{
			availableChains: ['sepolia', 'avalanche-fuji'],
			defaultChain: 'avalanche-fuji',
			onChainSelected: (chainId, chain) => {
				console.log(`🔗 Chain selected via hook: ${chain.displayName}`);
				emitEvent('chain-selected', { chainId, chain });
			},
			enableLogging: true,
		}
	);

	const authFlow = useAuthFlow({
		enableStepHistory: true,
		allowBackNavigation: true,
		stepTimeouts: {
			connecting: 30000,
			signing: 60000,
			verifying: 30000,
		},
		onStepChange: (step, previousStep) => {
			console.log(`📍 Auth step: ${previousStep} → ${step}`);
			emitEvent('auth-step-changed', { step, previousStep });
		},
		onFlowComplete: (duration) => {
			console.log(`✅ Auth flow completed in ${duration}ms`);
			emitEvent('auth-flow-complete', { duration });
		},
		onFlowError: (error, step) => {
			console.error(`❌ Auth flow error at ${step}: ${error}`);
			emitEvent('auth-flow-error', { error, step });
		},
		enableLogging: true,
	});

	// AuthActionsServiceの初期化
	const authActions = useMemo(() => {
		if (!evmWallet) return null;

		return new AuthActionsService(
			// EVMウォレットインターフェース
			{
				address: evmWallet.address,
				chainId: evmWallet.chainId,
				isConnected: evmWallet.isConnected,
				isAuthenticated: evmWallet.isAuthenticated,
				connectWallet: evmWallet.connectWallet,
				disconnectWallet: evmWallet.disconnectWallet,
				signMessage: evmWallet.signMessage,
				switchChain: evmWallet.switchChain,
			},
			// 認証フロー制御
			{
				setStep: authFlow.setStep,
				updateProgress: authFlow.updateProgress,
				setSignatureRequired: authFlow.setSignatureRequired,
				setVerificationRequired: authFlow.setVerificationRequired,
				setError: authFlow.setError,
				completeSuccess: authFlow.completeSuccess,
			},
			// チェーン選択インターフェース
			{
				selectedChain: chainSelection.selectedChain,
				selectChain: chainSelection.selectChain,
				switchToChain: chainSelection.switchToChain,
				getSelectedChain: chainSelection.getSelectedChain,
			},
			// API クライアント
			{
				callAPI: callExtendedAPI,
			},
			// ユーザーストア
			{
				setExtendedUser,
				setIsAuthenticated,
			},
			// イベントエミッター
			{
				emitEvent,
			},
			// エラーハンドラー
			{
				handleError,
			}
		);
	}, [
		evmWallet,
		authFlow.setStep,
		authFlow.updateProgress,
		authFlow.setSignatureRequired,
		authFlow.setVerificationRequired,
		authFlow.setError,
		authFlow.completeSuccess,
		chainSelection.selectedChain,
		chainSelection.selectChain,
		chainSelection.switchToChain,
		chainSelection.getSelectedChain,
		callExtendedAPI,
		emitEvent,
		handleError,
	]);

	// Extended Walletユーザー情報の更新
	const refreshExtendedUser = useCallback(async () => {
		if (!evmWallet.address) return;

		try {
			setFirestoreLoading(true);

			const result = await callExtendedAPI(
				`/api/auth/wallet?address=${evmWallet.address}`
			);

			if (result.success && result.data.user) {
				setExtendedUser(result.data.user);
				console.log('🔄 Extended user refreshed:', result.data.user.walletAddress);
			}
		} catch (error) {
			console.warn('Failed to refresh extended user:', error);
		} finally {
			setFirestoreLoading(false);
		}
	}, [evmWallet.address, callExtendedAPI]);

	// 基本アクション（AuthActionsService経由）
	const connectWallet = useCallback(async (chainType?: ChainType, walletType?: string) => {
		if (!authActions) throw new Error('AuthActions not available');
		return authActions.connectWallet(chainType, walletType);
	}, [authActions]);

	const authenticateWallet = useCallback(async (chainType?: ChainType, address?: string) => {
		if (!authActions) throw new Error('AuthActions not available');
		return authActions.authenticateWallet(chainType, address);
	}, [authActions]);

	const logout = useCallback(async () => {
		if (!authActions) throw new Error('AuthActions not available');
		return authActions.logout();
	}, [authActions]);

	// 統合アクション（新機能）
	const connectWithChain = useCallback(async (chainId: SelectableChainId, walletType?: string) => {
		if (!authActions) throw new Error('AuthActions not available');
		return authActions.connectWithChainSelection(chainId, walletType);
	}, [authActions]);

	const completeAuthFlow = useCallback(async (chainId: SelectableChainId, walletType?: string) => {
		if (!authActions) throw new Error('AuthActions not available');
		return authActions.completeAuthFlow(chainId, walletType);
	}, [authActions]);

	// プロフィール更新
	const updateUserProfile = useCallback(async (profileData: any): Promise<WalletOperationResult> => {
		if (!authActions) throw new Error('AuthActions not available');
		return authActions.updateProfile(profileData, extendedUser);
	}, [authActions, extendedUser]);

	// ヘルパー関数
	const getAuthHistory = useCallback(() => {
		return extendedUser?.authHistory || null;
	}, [extendedUser]);

	const getConnectedWallets = useCallback(() => {
		return extendedUser?.connectedWallets || null;
	}, [extendedUser]);

	// 統合認証状態の更新
	useEffect(() => {
		const hasWalletAuth = evmWallet.isAuthenticated;
		setIsAuthenticated(hasWalletAuth);

		if (hasWalletAuth) {
			emitEvent('unified-login', { authMethod: 'wallet' });
		}
	}, [evmWallet.isAuthenticated, emitEvent]);

	// Wallet接続監視
	useEffect(() => {
		setDebugInfo(prev => ({ ...prev, walletReady: true }));

		if (evmWallet.isConnected && evmWallet.address) {
			emitEvent('wallet-connect', {
				address: evmWallet.address,
				chainId: evmWallet.chainId,
				chainType: 'evm'
			});

			refreshExtendedUser();
		}

		if (evmWallet.isAuthenticated) {
			emitEvent('wallet-authenticate', {
				address: evmWallet.address,
				chainType: 'evm'
			});
		}
	}, [evmWallet.isConnected, evmWallet.isAuthenticated, evmWallet.address, emitEvent, refreshExtendedUser]);

	// イベントリスナー管理
	const addEventListener = useCallback((type: AuthEventType, callback: (event: AuthEvent) => void) => {
		if (!eventListeners.has(type)) {
			eventListeners.set(type, new Set());
		}
		eventListeners.get(type)!.add(callback);

		return () => {
			const listeners = eventListeners.get(type);
			if (listeners) {
				listeners.delete(callback);
			}
		};
	}, [eventListeners]);

	// AuthFlowStateの統合（後方互換性）
	const unifiedAuthFlowState: AuthFlowState = {
		currentStep: authFlow.currentStep as any, // 型変換
		signatureRequired: authFlow.signatureRequired,
		verificationRequired: authFlow.verificationRequired,
		progress: authFlow.progress,
	};

	// デバッグ情報の更新
	const enhancedDebugInfo = {
		...debugInfo,
		authActions: authActions?.getDebugInfo() || null,
		modules: {
			chainSelection: chainSelection.getDebugInfo(),
			authFlow: authFlow.getDebugInfo(),
			evmWallet: {
				isConnected: evmWallet.isConnected,
				isAuthenticated: evmWallet.isAuthenticated,
				address: evmWallet.address,
				chainId: evmWallet.chainId,
			},
		},
	};

	// 統合状態の構築
	const unifiedState: UnifiedAuthState = {
		authMethod: 'wallet',
		firebaseUser: null,
		firebaseLoading: false,
		walletConnection: evmWallet.isConnected ? {
			address: evmWallet.address!,
			chainType: 'evm',
			chainId: evmWallet.chainId,
			walletType: 'unknown',
			isConnected: evmWallet.isConnected,
			isVerified: evmWallet.isAuthenticated,
		} : null,
		walletLoading: evmWallet.isConnecting,
		firestoreUser: extendedUser,
		firestoreLoading,
		isAuthenticated,
		isLoading: evmWallet.isConnecting || firestoreLoading,
		error,
	};

	// コンテキスト値
	const contextValue: SimplifiedUnifiedAuthContextType = {
		...unifiedState,

		// 設定
		config,

		// 基本状態
		extendedUser,
		authFlowState: unifiedAuthFlowState,

		// サブモジュール
		chainSelection,
		authFlow,
		evmWallet,

		// 基本アクション
		connectWallet,
		authenticateWallet,
		logout,
		refreshExtendedUser,

		// 統合アクション
		connectWithChain,
		completeAuthFlow,

		// ユーティリティ
		updateUserProfile,
		getAuthHistory,
		getConnectedWallets,

		// 便利なゲッター
		primaryUserId: extendedUser?.walletAddress || null,
		displayName: extendedUser?.displayName || null,
		emailAddress: null,
		walletAddress: evmWallet.address || null,

		// 状態チェック
		isFirebaseAuth: false,
		isWalletAuth: isAuthenticated,
		hasMultipleAuth: false,

		// イベント管理
		addEventListener,

		// 後方互換性（AuthActions互換）
		signInWithEmail: async () => { throw new Error('Firebase disabled'); },
		signUpWithEmail: async () => { throw new Error('Firebase disabled'); },
		signInWithGoogle: async () => { throw new Error('Firebase disabled'); },
		switchWalletChain: async (chainType: ChainType, chainId: number | string) => {
			if (!authActions) throw new Error('AuthActions not available');
			return authActions.switchWalletChain(chainType, chainId);
		},
		updateProfile: updateUserProfile,
		refreshSession: async () => {
			if (!authActions) throw new Error('AuthActions not available');
			return authActions.refreshSession();
		},

		// デバッグ情報
		_debug: enhancedDebugInfo,
	};

	return (
		<UnifiedAuthContext.Provider value={contextValue}>
			{children}
		</UnifiedAuthContext.Provider>
	);
};

/**
 * 簡素化されたUnifiedAuthを使用するhook
 */
export const useUnifiedAuth = (): SimplifiedUnifiedAuthContextType => {
	const context = useContext(UnifiedAuthContext);
	if (!context) {
		throw new Error('useUnifiedAuth must be used within UnifiedAuthProvider');
	}
	return context;
};

/**
 * 認証状態のみを取得する軽量hook
 */
export const useAuthState = () => {
	const {
		isAuthenticated,
		isLoading,
		primaryUserId,
		displayName,
		walletAddress,
		extendedUser,
		error
	} = useUnifiedAuth();

	return {
		isAuthenticated,
		isLoading,
		authMethod: 'wallet' as const,
		primaryUserId,
		displayName,
		emailAddress: null,
		walletAddress,
		extendedUser,
		connectedWalletsCount: extendedUser?.connectedWallets.length || 0,
		authHistoryCount: extendedUser?.authHistory.length || 0,
		membershipTier: extendedUser?.membershipTier || 'bronze',
		totalBadges: extendedUser?.stats.badges.length || 0,
		error,
	};
};

/**
 * 認証アクションのみを取得するhook
 */
export const useAuthActions = () => {
	const {
		connectWallet,
		authenticateWallet,
		logout,
		updateUserProfile,
		refreshExtendedUser,
		connectWithChain,
		completeAuthFlow,
	} = useUnifiedAuth();

	return {
		connectWallet,
		authenticateWallet,
		logout,
		updateUserProfile,
		refreshExtendedUser,
		connectWithChain,
		completeAuthFlow,
	};
};

/**
 * チェーン選択専用のhook
 */
export const useChainSelectionOnly = () => {
	const { chainSelection } = useUnifiedAuth();
	return chainSelection;
};

/**
 * 認証フロー専用のhook
 */
export const useAuthFlowOnly = () => {
	const { authFlow } = useUnifiedAuth();
	return authFlow;
};
// src/contexts/UnifiedAuthContext.tsx
'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { ChainType } from '../../types/wallet';
import { ExtendedFirestoreUser, WalletOperationResult, AuthFlowState } from '../../types/user-extended';
import { UnifiedAuthState, AuthConfig, AuthActions, AuthEvent, AuthEventType, UseAuthReturn } from '../../types/auth';

// EVMWalletProviderはオプショナルにする
let useEVMWallet: any = null;
try {
	const evmModule = require('@/wallet-auth/adapters/evm/EVMWalletAdapterWrapper');
	useEVMWallet = evmModule.useEVMWallet;
} catch (error) {
	console.warn('EVMWallet not available:', error);
}

// デフォルト設定（Wallet専用）
const DEFAULT_CONFIG: AuthConfig = {
	preferredMethod: 'wallet', // wallet固定
	enableFirebase: false,     // Firebase無効
	enableWallet: true,
	autoConnect: true,
	sessionTimeout: 24 * 60, // 24時間
	walletConfig: {
		enabledChains: ['evm'],
		preferredChain: 'evm',
	},
};

interface UnifiedAuthContextType extends UseAuthReturn {
	// 設定
	config: AuthConfig;

	// 追加の状態
	authFlowState: AuthFlowState;

	// 内部状態（デバッグ用）
	_debug: {
		firebaseReady: boolean;
		walletReady: boolean;
		lastError: string | null;
	};
}

const UnifiedAuthContext = createContext<UnifiedAuthContextType | undefined>(undefined);

interface UnifiedAuthProviderProps {
	children: React.ReactNode;
	config?: Partial<AuthConfig>;
}

export const UnifiedAuthProvider = ({ children, config: userConfig = {} }: UnifiedAuthProviderProps) => {
	const config = { ...DEFAULT_CONFIG, ...userConfig };

	// Firestore状態（Wallet基準）
	const [firestoreUser, setFirestoreUser] = useState<ExtendedFirestoreUser | null>(null);
	const [firestoreLoading, setFirestoreLoading] = useState(false);

	// Wallet状態（EVMのみ現在対応）
	const evmWallet = useEVMWallet ? useEVMWallet() : {
		// フォールバックオブジェクト
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

	// 統合状態（Wallet専用）
	const [isAuthenticated, setIsAuthenticated] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// 認証フロー状態
	const [authFlowState, setAuthFlowState] = useState<AuthFlowState>({
		currentStep: 'idle',
		signatureRequired: false,
		verificationRequired: false,
		progress: 0,
	});

	// イベントエミッター
	const eventEmitter = useRef(new EventTarget());
	const [eventListeners] = useState(new Map<string, Set<(event: AuthEvent) => void>>());

	// デバッグ情報
	const [debugInfo, setDebugInfo] = useState({
		firebaseReady: false,  // 常にfalse
		walletReady: false,
		lastError: null as string | null,
	});

	// エラーハンドリング
	const handleError = useCallback((error: any, context?: string) => {
		const errorMessage = error?.message || error?.toString() || 'Unknown error';
		const fullError = context ? `${context}: ${errorMessage}` : errorMessage;

		console.error('UnifiedAuth Error:', fullError, error);
		setError(fullError);
		setDebugInfo(prev => ({ ...prev, lastError: fullError }));

		// エラーイベントを発火
		emitEvent('error', { error: fullError, context });
	}, []);

	// イベント発火
	const emitEvent = useCallback((type: AuthEventType, data?: any) => {
		const event: AuthEvent = {
			type,
			timestamp: new Date(),
			data,
		};

		console.log('Auth Event:', event);

		// リスナーに通知
		const listeners = eventListeners.get(type);
		if (listeners) {
			listeners.forEach(callback => callback(event));
		}
	}, [eventListeners]);

	// Wallet認証の監視
	useEffect(() => {
		setDebugInfo(prev => ({ ...prev, walletReady: true }));

		if (evmWallet.isConnected && evmWallet.address) {
			emitEvent('wallet-connect', {
				address: evmWallet.address,
				chainId: evmWallet.chainId,
				chainType: 'evm'
			});
		}

		if (evmWallet.isAuthenticated) {
			emitEvent('wallet-authenticate', {
				address: evmWallet.address,
				chainType: 'evm'
			});
		}

		// 認証状態の更新
		updateAuthenticationState();
	}, [evmWallet.isConnected, evmWallet.isAuthenticated, evmWallet.address, emitEvent]);

	// 統合認証状態の更新（Wallet専用）
	const updateAuthenticationState = useCallback(() => {
		const hasWalletAuth = evmWallet.isAuthenticated;
		setIsAuthenticated(hasWalletAuth);

		if (hasWalletAuth) {
			emitEvent('unified-login', { authMethod: 'wallet' });
		}
	}, [evmWallet.isAuthenticated, emitEvent]);

	// 認証アクション実装（Wallet専用）
	const authActions: AuthActions = {
		// Firebase認証（削除済み - エラーを投げる）
		signInWithEmail: async (email: string, password: string) => {
			throw new Error('Firebase authentication is disabled. Please use wallet authentication.');
		},

		signUpWithEmail: async (email: string, password: string) => {
			throw new Error('Firebase authentication is disabled. Please use wallet authentication.');
		},

		signInWithGoogle: async () => {
			throw new Error('Firebase authentication is disabled. Please use wallet authentication.');
		},

		// Wallet認証
		connectWallet: async (chainType: ChainType = 'evm', walletType?: string) => {
			try {
				setAuthFlowState(prev => ({
					...prev,
					currentStep: 'connecting',
					selectedChain: chainType,
					selectedWallet: walletType,
					progress: 25
				}));

				if (chainType === 'evm') {
					const connection = await evmWallet.connectWallet(walletType);
					setAuthFlowState(prev => ({ ...prev, currentStep: 'idle', progress: 100 }));
					return connection;
				} else {
					throw new Error(`Chain type ${chainType} not supported yet`);
				}
			} catch (error) {
				handleError(error, 'Wallet connect');
				setAuthFlowState(prev => ({ ...prev, currentStep: 'error' }));
				throw error;
			}
		},

		authenticateWallet: async (chainType: ChainType = 'evm') => {
			try {
				setAuthFlowState(prev => ({
					...prev,
					currentStep: 'signing',
					signatureRequired: true,
					progress: 50
				}));

				if (chainType === 'evm') {
					const result = await evmWallet.authenticate();
					setAuthFlowState(prev => ({
						...prev,
						currentStep: 'idle',
						signatureRequired: false,
						progress: 100
					}));
					return result;
				} else {
					throw new Error(`Chain type ${chainType} not supported yet`);
				}
			} catch (error) {
				handleError(error, 'Wallet authenticate');
				setAuthFlowState(prev => ({
					...prev,
					currentStep: 'error',
					signatureRequired: false
				}));
				throw error;
			}
		},

		switchWalletChain: async (chainType: ChainType, chainId: number | string) => {
			try {
				if (chainType === 'evm' && typeof chainId === 'number') {
					await evmWallet.switchChain(chainId);
				} else {
					throw new Error(`Chain switching not supported for ${chainType}`);
				}
			} catch (error) {
				handleError(error, 'Chain switch');
				throw error;
			}
		},

		// 統合ログアウト（Wallet専用）
		logout: async () => {
			try {
				setAuthFlowState(prev => ({ ...prev, currentStep: 'connecting', progress: 25 }));

				// Wallet ログアウト
				if (evmWallet.isConnected) {
					await evmWallet.disconnectWallet();
				}

				// 状態リセット
				setFirestoreUser(null);
				setIsAuthenticated(false);
				setError(null);

				setAuthFlowState(prev => ({ ...prev, currentStep: 'idle', progress: 100 }));
				emitEvent('unified-logout');
			} catch (error) {
				handleError(error, 'Logout');
				setAuthFlowState(prev => ({ ...prev, currentStep: 'error' }));
				throw error;
			}
		},

		// プロフィール更新
		updateProfile: async (data: Partial<ExtendedFirestoreUser>) => {
			try {
				// TODO: ExtendedFirestoreUser用の更新ロジック
				throw new Error('Not implemented yet');
			} catch (error) {
				handleError(error, 'Profile update');
				throw error;
			}
		},

		// セッション更新
		refreshSession: async () => {
			try {
				// TODO: セッション更新ロジック
				throw new Error('Not implemented yet');
			} catch (error) {
				handleError(error, 'Session refresh');
				throw error;
			}
		},
	};

	// イベントリスナー管理
	const addEventListener = useCallback((type: AuthEventType, callback: (event: AuthEvent) => void) => {
		if (!eventListeners.has(type)) {
			eventListeners.set(type, new Set());
		}
		eventListeners.get(type)!.add(callback);

		// Unsubscribe関数を返す
		return () => {
			const listeners = eventListeners.get(type);
			if (listeners) {
				listeners.delete(callback);
			}
		};
	}, [eventListeners]);

	// 統合状態の構築（Wallet専用）
	const unifiedState: UnifiedAuthState = {
		authMethod: 'wallet', // 常にwallet
		firebaseUser: null,   // 常にnull
		firebaseLoading: false, // 常にfalse
		walletConnection: evmWallet.isConnected ? {
			address: evmWallet.address!,
			chainType: 'evm',
			chainId: evmWallet.chainId,
			walletType: 'unknown',
			isConnected: evmWallet.isConnected,
			isVerified: evmWallet.isAuthenticated,
		} : null,
		walletLoading: evmWallet.isConnecting,
		firestoreUser,
		firestoreLoading,
		isAuthenticated,
		isLoading: evmWallet.isConnecting || firestoreLoading,
		error,
	};

	// コンテキスト値
	const contextValue: UnifiedAuthContextType = {
		...unifiedState,
		...authActions,

		// 便利なゲッター
		primaryUserId: evmWallet.address || null,
		displayName: firestoreUser?.displayName || null,
		emailAddress: null, // Firebase無効のためnull
		walletAddress: evmWallet.address || null,

		// 状態チェック（Wallet専用）
		isFirebaseAuth: false,    // 常にfalse
		isWalletAuth: isAuthenticated,
		hasMultipleAuth: false,   // 常にfalse

		// イベント管理
		addEventListener,

		// 設定と内部状態
		config,
		authFlowState,
		_debug: debugInfo,
	};

	return (
		<UnifiedAuthContext.Provider value={contextValue}>
			{children}
		</UnifiedAuthContext.Provider>
	);
};

/**
 * 統合認証を使用するhook（Wallet専用）
 */
export const useUnifiedAuth = (): UnifiedAuthContextType => {
	const context = useContext(UnifiedAuthContext);
	if (!context) {
		throw new Error('useUnifiedAuth must be used within UnifiedAuthProvider');
	}
	return context;
};

/**
 * 認証状態のみを取得するhook（Wallet専用）
 */
export const useAuthState = () => {
	const {
		isAuthenticated,
		isLoading,
		primaryUserId,
		displayName,
		walletAddress,
		error
	} = useUnifiedAuth();

	return {
		isAuthenticated,
		isLoading,
		authMethod: 'wallet' as const,
		primaryUserId,
		displayName,
		emailAddress: null, // Firebase無効
		walletAddress,
		error,
	};
};

/**
 * 認証アクションのみを取得するhook（Wallet専用）
 */
export const useAuthActions = () => {
	const {
		connectWallet,
		authenticateWallet,
		switchWalletChain,
		logout,
		updateProfile
	} = useUnifiedAuth();

	return {
		// Firebase認証は削除
		connectWallet,
		authenticateWallet,
		switchWalletChain,
		logout,
		updateProfile,
	};
};
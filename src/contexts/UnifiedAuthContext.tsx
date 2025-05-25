// src/contexts/UnifiedAuthContext.tsx
'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { User as FirebaseUser, onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { AuthMethod, ChainType } from '../../types/wallet';
import { ExtendedFirestoreUser, AuthIntegrationResult, WalletOperationResult, AuthFlowState } from '../../types/user-extended';
import { UnifiedAuthState, AuthConfig, AuthActions, AuthEvent, AuthEventType, UseAuthReturn } from '../../types/auth';

// EVMWalletProviderはオプショナルにする
let useEVMWallet: any = null;
try {
	const evmModule = require('@/wallet-auth/adapters/evm/EVMWalletAdapterWrapper');
	useEVMWallet = evmModule.useEVMWallet;
} catch (error) {
	console.warn('EVMWallet not available:', error);
}

// デフォルト設定
const DEFAULT_CONFIG: AuthConfig = {
	preferredMethod: 'hybrid',
	enableFirebase: true,
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
	
	// Firebase状態
	const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
	const [firebaseLoading, setFirebaseLoading] = useState(true);
	
	// Firestore状態
	const [firestoreUser, setFirestoreUser] = useState<ExtendedFirestoreUser | null>(null);
	const [firestoreLoading, setFirestoreLoading] = useState(false);
	
	// Wallet状態（EVMのみ現在対応）
	const evmWallet = useEVMWallet ? useEVMWallet() : {
		isConnected: false,
		isConnecting: false,
		isAuthenticated: false,
		address: null,
		chainId: null,
		chainName: null,
		error: null,
		connect: async () => { throw new Error('EVM Wallet not available'); },
		disconnect: async () => { throw new Error('EVM Wallet not available'); },
		authenticate: async () => ({ success: false, error: 'EVM Wallet not available' }),
		switchChain: async () => { throw new Error('EVM Wallet not available'); },
	};
	
	// 統合状態
	const [authMethod, setAuthMethod] = useState<AuthMethod>('firebase');
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
		firebaseReady: false,
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

	// Firebase認証の監視
	useEffect(() => {
		const unsubscribe = onAuthStateChanged(auth, async (user) => {
			console.log('🔄 Firebase auth state changed:', user?.uid || 'null');
			
			setFirebaseUser(user);
			setFirebaseLoading(false);
			setDebugInfo(prev => ({ ...prev, firebaseReady: true }));
			
			if (user) {
				emitEvent('firebase-login', { uid: user.uid, email: user.email });
				
				// Firestoreとの同期（既存の実装を利用）
				try {
					setFirestoreLoading(true);
					// TODO: ExtendedFirestoreUserとの同期ロジック
					// 既存のsyncAuthWithFirestoreを拡張使用
					
					setFirestoreLoading(false);
				} catch (error) {
					handleError(error, 'Firebase sync');
					setFirestoreLoading(false);
				}
			} else {
				emitEvent('firebase-logout');
				setFirestoreUser(null);
			}
			
			// 認証状態の更新
			updateAuthenticationState();
		});
		
		return unsubscribe;
	}, [handleError, emitEvent]);

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

	// 統合認証状態の更新
	const updateAuthenticationState = useCallback(() => {
		const hasFirebaseAuth = !!firebaseUser;
		const hasWalletAuth = evmWallet.isAuthenticated;
		
		let newAuthMethod: AuthMethod = 'firebase';
		let newIsAuthenticated = false;
		
		if (hasFirebaseAuth && hasWalletAuth) {
			newAuthMethod = 'hybrid';
			newIsAuthenticated = true;
		} else if (hasFirebaseAuth) {
			newAuthMethod = 'firebase';
			newIsAuthenticated = true;
		} else if (hasWalletAuth) {
			newAuthMethod = 'wallet';
			newIsAuthenticated = true;
		}
		
		setAuthMethod(newAuthMethod);
		setIsAuthenticated(newIsAuthenticated);
		
		if (newIsAuthenticated) {
			emitEvent('unified-login', { authMethod: newAuthMethod });
		}
	}, [firebaseUser, evmWallet.isAuthenticated, emitEvent]);

	// 認証アクション実装
	const authActions: AuthActions = {
		// Firebase認証（既存実装を利用）
		signInWithEmail: async (email: string, password: string) => {
			try {
				setAuthFlowState(prev => ({ ...prev, currentStep: 'connecting', progress: 25 }));
				// TODO: 既存のsignIn実装を呼び出し
				setAuthFlowState(prev => ({ ...prev, currentStep: 'idle', progress: 100 }));
			} catch (error) {
				handleError(error, 'Email sign in');
				setAuthFlowState(prev => ({ ...prev, currentStep: 'error' }));
				throw error;
			}
		},

		signUpWithEmail: async (email: string, password: string) => {
			try {
				setAuthFlowState(prev => ({ ...prev, currentStep: 'connecting', progress: 25 }));
				// TODO: 既存のsignUp実装を呼び出し
				setAuthFlowState(prev => ({ ...prev, currentStep: 'idle', progress: 100 }));
			} catch (error) {
				handleError(error, 'Email sign up');
				setAuthFlowState(prev => ({ ...prev, currentStep: 'error' }));
				throw error;
			}
		},

		signInWithGoogle: async () => {
			try {
				setAuthFlowState(prev => ({ ...prev, currentStep: 'connecting', progress: 25 }));
				// TODO: 既存のsignInWithGoogle実装を呼び出し
				setAuthFlowState(prev => ({ ...prev, currentStep: 'idle', progress: 100 }));
			} catch (error) {
				handleError(error, 'Google sign in');
				setAuthFlowState(prev => ({ ...prev, currentStep: 'error' }));
				throw error;
			}
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
					const connection = await evmWallet.connect(walletType);
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

		// 統合ログアウト
		logout: async () => {
			try {
				setAuthFlowState(prev => ({ ...prev, currentStep: 'connecting', progress: 25 }));
				
				// Firebase ログアウト
				if (firebaseUser) {
					await signOut(auth);
				}
				
				// Wallet ログアウト
				if (evmWallet.isConnected) {
					await evmWallet.disconnect();
				}
				
				// 状態リセット
				setFirestoreUser(null);
				setIsAuthenticated(false);
				setAuthMethod('firebase');
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

	// 統合状態の構築
	const unifiedState: UnifiedAuthState = {
		authMethod,
		firebaseUser,
		firebaseLoading,
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
		isLoading: firebaseLoading || evmWallet.isConnecting || firestoreLoading,
		error,
	};

	// 便利なゲッター
	const contextValue: UnifiedAuthContextType = {
		...unifiedState,
		...authActions,
		
		// 便利なゲッター
		primaryUserId: firebaseUser?.uid || evmWallet.address || null,
		displayName: firestoreUser?.displayName || firebaseUser?.displayName || null,
		emailAddress: firestoreUser?.email || firebaseUser?.email || null,
		walletAddress: evmWallet.address || null,
		
		// 状態チェック
		isFirebaseAuth: authMethod === 'firebase' || authMethod === 'hybrid',
		isWalletAuth: authMethod === 'wallet' || authMethod === 'hybrid',
		hasMultipleAuth: authMethod === 'hybrid',
		
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
 * 統合認証を使用するhook
 */
export const useUnifiedAuth = (): UnifiedAuthContextType => {
	const context = useContext(UnifiedAuthContext);
	if (!context) {
		throw new Error('useUnifiedAuth must be used within UnifiedAuthProvider');
	}
	return context;
};

/**
 * 認証状態のみを取得するhook
 */
export const useAuthState = () => {
	const { 
		isAuthenticated, 
		isLoading, 
		authMethod, 
		primaryUserId, 
		displayName, 
		emailAddress, 
		walletAddress,
		error 
	} = useUnifiedAuth();
	
	return {
		isAuthenticated,
		isLoading,
		authMethod,
		primaryUserId,
		displayName,
		emailAddress,
		walletAddress,
		error,
	};
};

/**
 * 認証アクションのみを取得するhook
 */
export const useAuthActions = () => {
	const { 
		signInWithEmail,
		signUpWithEmail,
		signInWithGoogle,
		connectWallet,
		authenticateWallet,
		switchWalletChain,
		logout,
		updateProfile 
	} = useUnifiedAuth();
	
	return {
		signInWithEmail,
		signUpWithEmail,
		signInWithGoogle,
		connectWallet,
		authenticateWallet,
		switchWalletChain,
		logout,
		updateProfile,
	};
};
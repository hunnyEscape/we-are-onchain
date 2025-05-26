// src/auth/contexts/UnifiedAuthContext.tsx (Enhanced with Chain Selection)
'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
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

interface ExtendedUnifiedAuthContextType extends Omit<UseAuthReturn, 'selectChain'> {
	// 設定
	config: AuthConfig;

	// Extended状態
	authFlowState: AuthFlowState;
	extendedUser: ExtendedFirestoreUser | null;

	// ★ 強化されたチェーン選択機能
	selectedChain: SelectableChainId | null;
	supportedChains: SelectableChain[];
	
	// Extended操作
	refreshExtendedUser: () => Promise<void>;
	getAuthHistory: () => ExtendedFirestoreUser['authHistory'] | null;
	getConnectedWallets: () => ExtendedFirestoreUser['connectedWallets'] | null;
	updateUserProfile: (profileData: any) => Promise<WalletOperationResult>;

	// ★ 強化されたチェーン選択アクション
	selectChain: (chainId: SelectableChainId) => Promise<{
		success: boolean;
		chain?: SelectableChain;
		switched?: boolean;
		error?: string;
	}>;
	switchToChain: (chainId: SelectableChainId) => Promise<boolean>;
	getSelectedChain: () => SelectableChain | null;
	isChainSupported: (chainId: SelectableChainId) => boolean;

	// 内部状態（デバッグ用）
	_debug: {
		firebaseReady: boolean;
		walletReady: boolean;
		lastError: string | null;
		apiCalls: number;
		lastApiCall: Date | null;
		chainSwitchHistory: Array<{
			from: SelectableChainId | null;
			to: SelectableChainId;
			success: boolean;
			timestamp: Date;
			duration: number;
		}>;
	};
}

const UnifiedAuthContext = createContext<ExtendedUnifiedAuthContextType | undefined>(undefined);

interface UnifiedAuthProviderProps {
	children: React.ReactNode;
	config?: Partial<AuthConfig>;
}

export const UnifiedAuthProvider = ({ children, config: userConfig = {} }: UnifiedAuthProviderProps) => {
	const config = { ...DEFAULT_CONFIG, ...userConfig };

	// Extended Firestore状態
	const [extendedUser, setExtendedUser] = useState<ExtendedFirestoreUser | null>(null);
	const [firestoreLoading, setFirestoreLoading] = useState(false);

	// ★ チェーン選択状態（新規追加）
	const [selectedChain, setSelectedChain] = useState<SelectableChainId | null>(null);
	const [supportedChains] = useState<SelectableChain[]>(testnetUtils.getAllSupportedChains());
	const [chainSwitchInProgress, setChainSwitchInProgress] = useState(false);

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

	// 統合状態（Extended Wallet専用）
	const [isAuthenticated, setIsAuthenticated] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// Extended認証フロー状態（型拡張）
	const [authFlowState, setAuthFlowState] = useState<AuthFlowState & {
		currentStep: 'idle' | 'chain-select' | 'wallet-connect' | 'wallet-sign' | 'connecting' | 'signing' | 'verifying' | 'success' | 'error';
	}>({
		currentStep: 'idle',
		signatureRequired: false,
		verificationRequired: false,
		progress: 0,
	});

	// イベントエミッター
	const eventEmitter = useRef(new EventTarget());
	const [eventListeners] = useState(new Map<string, Set<(event: AuthEvent) => void>>());

	// デバッグ情報（Extended + チェーン切り替え履歴）
	const [debugInfo, setDebugInfo] = useState({
		firebaseReady: false,  // 常にfalse
		walletReady: false,
		lastError: null as string | null,
		apiCalls: 0,
		lastApiCall: null as Date | null,
		chainSwitchHistory: [] as Array<{
			from: SelectableChainId | null;
			to: SelectableChainId;
			success: boolean;
			timestamp: Date;
			duration: number;
		}>,
	});

	// ★ チェーン選択の初期化
	useEffect(() => {
		// 現在のウォレットのチェーンIDから選択されたチェーンを推測
		if (evmWallet.chainId && evmWallet.isConnected) {
			const currentChain = testnetUtils.getChainByWagmiId(evmWallet.chainId);
			if (currentChain && !selectedChain) {
				setSelectedChain(currentChain.id);
				console.log(`🔗 Auto-detected chain: ${currentChain.displayName} (${evmWallet.chainId})`);
			}
		}
	}, [evmWallet.chainId, evmWallet.isConnected, selectedChain]);

	// エラーハンドリング
	const handleError = useCallback((error: any, context?: string) => {
		const errorMessage = error?.message || error?.toString() || 'Unknown error';
		const fullError = context ? `${context}: ${errorMessage}` : errorMessage;

		console.error('Extended UnifiedAuth Error:', fullError, error);
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

		console.log('Extended Auth Event:', event);

		// リスナーに通知
		const listeners = eventListeners.get(type);
		if (listeners) {
			listeners.forEach(callback => callback(event));
		}
	}, [eventListeners]);

	// Extended API呼び出しヘルパー
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

	// Wallet認証の監視（Extended版）
	useEffect(() => {
		setDebugInfo(prev => ({ ...prev, walletReady: true }));

		if (evmWallet.isConnected && evmWallet.address) {
			emitEvent('wallet-connect', {
				address: evmWallet.address,
				chainId: evmWallet.chainId,
				chainType: 'evm'
			});

			// Extended userの自動取得
			refreshExtendedUser();
		}

		if (evmWallet.isAuthenticated) {
			emitEvent('wallet-authenticate', {
				address: evmWallet.address,
				chainType: 'evm'
			});
		}

		// 認証状態の更新
		updateAuthenticationState();
	}, [evmWallet.isConnected, evmWallet.isAuthenticated, evmWallet.address, emitEvent, refreshExtendedUser]);

	// 統合認証状態の更新（Extended Wallet専用）
	const updateAuthenticationState = useCallback(() => {
		const hasWalletAuth = evmWallet.isAuthenticated;
		setIsAuthenticated(hasWalletAuth);

		if (hasWalletAuth) {
			emitEvent('unified-login', { authMethod: 'wallet' });
		}
	}, [evmWallet.isAuthenticated, emitEvent]);

	// ★ 強化されたチェーン選択アクション
	const selectChain = useCallback(async (chainId: SelectableChainId): Promise<{
		success: boolean;
		chain?: SelectableChain;
		switched?: boolean;
		error?: string;
	}> => {
		try {
			console.log(`🔗 Selecting chain: ${chainId}`);

			// チェーンが有効かチェック
			const chain = testnetUtils.getChainById(chainId);
			if (!chain || !chain.isSupported) {
				throw new Error(`Chain ${chainId} is not supported`);
			}

			// 状態を更新
			const previousChain = selectedChain;
			setSelectedChain(chainId);

			// イベント発火
			emitEvent('chain-selected', { 
				chainId, 
				chain, 
				previousChain 
			});

			console.log(`✅ Chain selected: ${chain.displayName}`);
			return {
				success: true,
				chain,
				switched: false,
				error: undefined
			};

		} catch (error) {
			console.error('❌ Chain selection failed:', error);
			handleError(error, 'Chain selection');
			return {
				success: false,
				chain: undefined,
				switched: false,
				error: error instanceof Error ? error.message : 'Chain selection failed'
			};
		}
	}, [selectedChain, emitEvent, handleError]);

	// ★ 強化されたチェーン切り替えアクション
	const switchToChain = useCallback(async (chainId: SelectableChainId): Promise<boolean> => {
		if (chainSwitchInProgress) {
			console.warn('🔄 Chain switch already in progress');
			return false;
		}

		const startTime = Date.now();
		setChainSwitchInProgress(true);

		try {
			console.log(`🔄 Switching to chain: ${chainId}`);

			// チェーンが有効かチェック
			const chain = testnetUtils.getChainById(chainId);
			if (!chain || !chain.isSupported) {
				throw new Error(`Chain ${chainId} is not supported`);
			}

			// 既に同じチェーンの場合
			if (evmWallet.chainId === chain.chainId) {
				console.log(`✅ Already on chain ${chain.displayName}`);
				await selectChain(chainId); // 状態を同期
				return true;
			}

			// ウォレットが接続されているかチェック
			if (!evmWallet.isConnected) {
				throw new Error('Wallet not connected');
			}

			// Wagmiを使用してチェーン切り替え
			console.log(`🔄 Requesting chain switch to ${chain.chainId} via Wagmi...`);
			
			emitEvent('chain-switch-start', { 
				chainId, 
				targetChainId: chain.chainId 
			});

			await evmWallet.switchChain(chain.chainId);

			// 切り替え成功時の処理
			await selectChain(chainId);

			const switchDuration = Date.now() - startTime;

			// デバッグ履歴に記録
			setDebugInfo(prev => ({
				...prev,
				chainSwitchHistory: [
					...prev.chainSwitchHistory.slice(-9), // 最新10件を保持
					{
						from: selectedChain,
						to: chainId,
						success: true,
						timestamp: new Date(),
						duration: switchDuration,
					}
				],
			}));

			emitEvent('chain-switch-complete', { 
				chainId, 
				targetChainId: chain.chainId,
				duration: switchDuration
			});

			console.log(`✅ Chain switched successfully to ${chain.displayName} in ${switchDuration}ms`);
			return true;

		} catch (error) {
			const switchDuration = Date.now() - startTime;

			// 失敗時もデバッグ履歴に記録
			setDebugInfo(prev => ({
				...prev,
				chainSwitchHistory: [
					...prev.chainSwitchHistory.slice(-9),
					{
						from: selectedChain,
						to: chainId,
						success: false,
						timestamp: new Date(),
						duration: switchDuration,
					}
				],
			}));

			console.error(`❌ Chain switch failed:`, error);
			handleError(error, 'Chain switch');

			emitEvent('chain-switch-failed', { 
				chainId, 
				error: error instanceof Error ? error.message : 'Switch failed',
				duration: switchDuration
			});

			return false;

		} finally {
			setChainSwitchInProgress(false);
		}
	}, [
		chainSwitchInProgress, 
		selectedChain, 
		evmWallet.isConnected, 
		evmWallet.chainId, 
		evmWallet.switchChain, 
		selectChain, 
		emitEvent, 
		handleError
	]);

	// ★ チェーン情報取得ヘルパー
	const getSelectedChain = useCallback((): SelectableChain | null => {
		return selectedChain ? testnetUtils.getChainById(selectedChain) : null;
	}, [selectedChain]);

	const isChainSupported = useCallback((chainId: SelectableChainId): boolean => {
		return testnetUtils.isChainSupported(chainId);
	}, []);

	// Extended認証アクション実装
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

		// Extended Wallet認証
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
				handleError(error, 'Extended Wallet connect');
				setAuthFlowState(prev => ({ ...prev, currentStep: 'error' }));
				throw error;
			}
		},

		// Extended Wallet認証（修正版）
		authenticateWallet: async (
			chainType: ChainType = 'evm',
			address?: string
		) => {
			try {
				setAuthFlowState(prev => ({
					...prev,
					currentStep: 'signing',
					signatureRequired: true,
					progress: 25
				}));

				if (chainType === 'evm') {
					// 1. EVMAuthServiceの初期化とNonce生成
					const authService = new (await import('@/auth/services/EVMAuthService')).EVMAuthService();
					const nonce = authService.generateNonce();

					// 2. ウォレットアドレス確認（evmWallet.addressを使用）
					const currentAddress = address || evmWallet.address;
					console.log('currentAddress_authenticateWallet_nonce',currentAddress,nonce);
					const isConnectedCheck = evmWallet.isConnected;

					console.log('🔍 Wallet status check:', {
						evmWalletAddress: evmWallet.address,
						currentAddress,
						evmWalletConnected: evmWallet.isConnected,
						evmWalletConnecting: evmWallet.isConnecting,
						chainId: evmWallet.chainId,
						chainName: evmWallet.chainName
					});

					if (!currentAddress) {
						throw new Error('Wallet address not available. Please ensure wallet is connected.');
					}

					console.log('🔗 Using wallet address for authentication:', currentAddress);

					// 4. Nonceを保存（フロントエンド側）
					authService.storeNonce(currentAddress, nonce);
					console.log(`🔑 Generated and stored nonce: ${nonce} for address: ${currentAddress}`);

					// 署名要求の準備
					setAuthFlowState(prev => ({ ...prev, progress: 50 }));

					// 5. 認証メッセージ作成
					const authMessage = authService.createAuthMessage(currentAddress, nonce, chainType);

					// 6. ウォレットから署名取得（EVMWalletを直接使用）
					console.log('📝 Requesting signature for message:', authMessage.substring(0, 100) + '...');

					let signature: string;
					try {
						signature = await evmWallet.signMessage(authMessage);
						console.log('✅ Signature obtained:', signature.substring(0, 20) + '...');
					} catch (signError: any) {
						console.error('❌ Signature failed:', signError);
						throw new Error(`Signature failed: ${signError.message || 'User rejected or wallet error'}`);
					}

					// 7. 署名データ構築
					const signatureData = {
						message: authMessage,
						signature,
						address: currentAddress,
						chainType,
						chainId: evmWallet.chainId,
						nonce,
						timestamp: Date.now(),
					};

					setAuthFlowState(prev => ({
						...prev,
						currentStep: 'verifying',
						signatureRequired: false,
						verificationRequired: true,
						progress: 75
					}));

					console.log('🚀 Sending extended wallet auth to API...', {
						address: signatureData.address,
						nonce: signatureData.nonce,
						hasSignature: !!signatureData.signature,
						messageLength: signatureData.message.length
					});

					// 8. Extended API Routes経由でFirestore認証
					const apiRequest: WalletAuthRequest = {
						signature: signatureData.signature,
						message: signatureData.message,
						address: signatureData.address,
						chainType: signatureData.chainType,
						chainId: signatureData.chainId,
						nonce: signatureData.nonce,
						timestamp: signatureData.timestamp,
					};

					const result: WalletAuthResponse = await callExtendedAPI('/api/auth/wallet', {
						method: 'POST',
						body: JSON.stringify(apiRequest),
					});

					if (!result.success) {
						throw new Error(result.error?.message || 'Extended API authentication failed');
					}

					console.log('✅ Extended API authentication successful:', result.data);

					// 9. Extended Firestoreユーザーデータを保存
					if (result.data?.user) {
						setExtendedUser(result.data.user);

						console.log('🎉 Extended user data received:', {
							address: result.data.user.walletAddress,
							authMethod: result.data.user.authMethod,
							isNewUser: result.data.isNewUser,
							connectedWallets: result.data.user.connectedWallets.length,
							authHistory: result.data.user.authHistory.length,
							badges: result.data.user.stats.badges,
						});
					}

					setAuthFlowState(prev => ({
						...prev,
						currentStep: 'success',
						verificationRequired: false,
						progress: 100
					}));

					// 成功時は少し待ってからidleに戻す
					setTimeout(() => {
						setAuthFlowState(prev => ({ ...prev, currentStep: 'idle' }));
					}, 2000);

					return {
						success: true,
						user: {
							address: signatureData.address,
							chainType: signatureData.chainType,
							chainId: signatureData.chainId,
						},
						signature: signatureData
					};
				} else {
					throw new Error(`Chain type ${chainType} not supported yet`);
				}
			} catch (error) {
				console.error('💥 Extended Wallet authenticate error:', error);
				handleError(error, 'Extended Wallet authenticate');
				setAuthFlowState(prev => ({
					...prev,
					currentStep: 'error',
					signatureRequired: false,
					verificationRequired: false
				}));

				return {
					success: false,
					error: error instanceof Error ? error.message : 'Extended authentication failed'
				};
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
				handleError(error, 'Extended Chain switch');
				throw error;
			}
		},

		// Extended統合ログアウト
		logout: async () => {
			try {
				setAuthFlowState(prev => ({ ...prev, currentStep: 'connecting', progress: 25 }));

				// Wallet ログアウト
				if (evmWallet.isConnected) {
					await evmWallet.disconnectWallet();
				}

				// Extended状態リセット
				setExtendedUser(null);
				setIsAuthenticated(false);
				setError(null);
				setSelectedChain(null); // ★ チェーン選択もリセット

				setAuthFlowState(prev => ({ ...prev, currentStep: 'idle', progress: 100 }));
				emitEvent('unified-logout');
			} catch (error) {
				handleError(error, 'Extended Logout');
				setAuthFlowState(prev => ({ ...prev, currentStep: 'error' }));
				throw error;
			}
		},

		// Extended プロフィール更新
		updateProfile: async (data: Partial<ExtendedFirestoreUser>) => {
			try {
				if (!extendedUser) {
					throw new Error('No extended user data available');
				}

				// TODO: API Routes経由でプロフィール更新
				console.log('Extended profile update requested:', data);

				// 暫定的にローカル更新
				setExtendedUser(prev => prev ? { ...prev, ...data } : null);

				return {
					success: true,
					data: { message: 'Profile updated successfully' }
				};
			} catch (error) {
				handleError(error, 'Extended Profile update');
				return {
					success: false,
					error: {
						code: 'UPDATE_FAILED',
						message: error instanceof Error ? error.message : 'Profile update failed'
					}
				};
			}
		},

		// Extended セッション更新
		refreshSession: async () => {
			try {
				await refreshExtendedUser();
			} catch (error) {
				handleError(error, 'Extended Session refresh');
				throw error;
			}
		},

		// ★ AuthActions型で要求されるチェーン選択関連メソッド（型互換性のため）
		selectChain: selectChain, // 既に適切な型で実装済み

		switchToSelectedChain: async (chainId: SelectableChainId) => {
			const previousChain = selectedChain;
			const success = await switchToChain(chainId);
			return {
				success,
				previousChain,
				newChain: success ? chainId : undefined,
				error: success ? undefined : 'Chain switch failed'
			};
		},

		resetChainSelection: () => {
			setSelectedChain(null);
			console.log('🔄 Chain selection reset');
		},

		setAuthStep: (step: 'idle' | 'chain-select' | 'wallet-connect' | 'wallet-sign' | 'connecting' | 'signing' | 'verifying' | 'success' | 'error') => {
			setAuthFlowState(prev => ({ ...prev, currentStep: step }));
		},

		goBackStep: () => {
			// 簡易的な戻る実装
			const steps: Array<'idle' | 'chain-select' | 'wallet-connect' | 'wallet-sign' | 'connecting' | 'signing' | 'verifying' | 'success' | 'error'> = ['chain-select', 'wallet-connect', 'wallet-sign', 'success', 'error'];
			const currentIndex = steps.indexOf(authFlowState.currentStep);
			if (currentIndex > 0) {
				const previousStep = steps[currentIndex - 1];
				setAuthFlowState(prev => ({ ...prev, currentStep: previousStep }));
				return true;
			}
			return false;
		},

		skipCurrentStep: () => {
			// 簡易的なスキップ実装
			const steps: Array<'idle' | 'chain-select' | 'wallet-connect' | 'wallet-sign' | 'success'> = ['chain-select', 'wallet-connect', 'wallet-sign', 'success'];
			const currentIndex = steps.indexOf(authFlowState.currentStep as any);
			if (currentIndex < steps.length - 1) {
				const nextStep = steps[currentIndex + 1];
				setAuthFlowState(prev => ({ ...prev, currentStep: nextStep }));
				return true;
			}
			return false;
		},

		resetAuthFlow: () => {
			setAuthFlowState({
				currentStep: 'idle',
				signatureRequired: false,
				verificationRequired: false,
				progress: 0,
			});
		},

		startChainSelection: (options?: any) => {
			setAuthFlowState(prev => ({ 
				...prev, 
				currentStep: 'chain-select',
				progress: 0 
			}));
		},

		completeChainSelection: async (chainId: SelectableChainId) => {
			const result = await selectChain(chainId);
			if (result.success) {
				setAuthFlowState(prev => ({ 
					...prev, 
					currentStep: 'wallet-connect',
					progress: 50 
				}));
			}
		},
	};

	// Extended ヘルパー関数
	const getAuthHistory = useCallback(() => {
		return extendedUser?.authHistory || null;
	}, [extendedUser]);

	const getConnectedWallets = useCallback(() => {
		return extendedUser?.connectedWallets || null;
	}, [extendedUser]);

	const updateUserProfile = useCallback(async (profileData: any): Promise<WalletOperationResult> => {
		return await authActions.updateProfile(profileData);
	}, [authActions]);

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

	// Extended統合状態の構築
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
		firestoreUser: extendedUser,
		firestoreLoading,
		isAuthenticated,
		isLoading: evmWallet.isConnecting || firestoreLoading,
		error,
	};

	// Extended コンテキスト値
	const contextValue: ExtendedUnifiedAuthContextType = {
		...unifiedState,
		...authActions,

		// 便利なゲッター（Extended版）
		primaryUserId: extendedUser?.walletAddress || null,
		displayName: extendedUser?.displayName || null,
		emailAddress: null, // Firebase無効のためnull
		walletAddress: evmWallet.address || null,

		// 状態チェック（Extended Wallet専用）
		isFirebaseAuth: false,    // 常にfalse
		isWalletAuth: isAuthenticated,
		hasMultipleAuth: false,   // 常にfalse

		// イベント管理
		addEventListener,

		// Extended設定と状態
		config,
		authFlowState,
		extendedUser,

		// ★ 強化されたチェーン選択機能
		selectedChain,
		supportedChains,
		selectChain,
		switchToChain,
		getSelectedChain,
		isChainSupported,

		// Extended操作
		refreshExtendedUser,
		getAuthHistory,
		getConnectedWallets,
		updateUserProfile,

		// デバッグ情報
		_debug: debugInfo,
	};

	return (
		<UnifiedAuthContext.Provider value={contextValue}>
			{children}
		</UnifiedAuthContext.Provider>
	);
};

/**
 * Extended統合認証を使用するhook
 */
export const useUnifiedAuth = (): ExtendedUnifiedAuthContextType => {
	const context = useContext(UnifiedAuthContext);
	if (!context) {
		throw new Error('useUnifiedAuth must be used within UnifiedAuthProvider');
	}
	return context;
};

/**
 * Extended認証状態のみを取得するhook
 */
export const useAuthState = () => {
	const {
		isAuthenticated,
		isLoading,
		primaryUserId,
		displayName,
		walletAddress,
		extendedUser,
		selectedChain,
		supportedChains,
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
		extendedUser,
		connectedWalletsCount: extendedUser?.connectedWallets.length || 0,
		authHistoryCount: extendedUser?.authHistory.length || 0,
		membershipTier: extendedUser?.membershipTier || 'bronze',
		totalBadges: extendedUser?.stats.badges.length || 0,
		// ★ チェーン選択状態
		selectedChain,
		supportedChainsCount: supportedChains.length,
		error,
	};
};

/**
 * Extended認証アクションのみを取得するhook
 */
export const useAuthActions = () => {
	const {
		connectWallet,
		authenticateWallet,
		switchWalletChain,
		logout,
		updateUserProfile,
		refreshExtendedUser,
		// ★ チェーン選択アクション
		selectChain,
		switchToChain,
		getSelectedChain,
		isChainSupported,
	} = useUnifiedAuth();

	return {
		connectWallet,
		authenticateWallet,
		switchWalletChain,
		logout,
		updateUserProfile,
		refreshExtendedUser,
		// ★ チェーン選択アクション
		selectChain,
		switchToChain,
		getSelectedChain,
		isChainSupported,
	};
};

/**
 * ★ チェーン選択専用のhook
 */
export const useChainSelection = () => {
	const {
		selectedChain,
		supportedChains,
		selectChain,
		switchToChain,
		getSelectedChain,
		isChainSupported,
		_debug,
	} = useUnifiedAuth();

	return {
		// 状態
		selectedChain,
		selectedChainData: getSelectedChain(),
		supportedChains,
		
		// アクション
		selectChain,
		switchToChain,
		isChainSupported,
		
		// 統計情報
		chainSwitchHistory: _debug.chainSwitchHistory,
		lastSwitchSuccess: _debug.chainSwitchHistory.length > 0 
			? _debug.chainSwitchHistory[_debug.chainSwitchHistory.length - 1].success 
			: null,
		averageSwitchTime: _debug.chainSwitchHistory.length > 0
			? _debug.chainSwitchHistory.reduce((avg, entry) => avg + entry.duration, 0) / _debug.chainSwitchHistory.length
			: 0,
	};
};
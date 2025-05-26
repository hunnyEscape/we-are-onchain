// src/wallet-auth/adapters/evm/EVMWalletAdapterWrapper.tsx
'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import {
	useAccount,
	useConnect,
	useDisconnect,
	useSignMessage,
	useSwitchChain,
	useChainId
} from 'wagmi';
import { useConnectModal, useAccountModal } from '@rainbow-me/rainbowkit';
import {
	ChainType,
	WalletConnection,
	WalletSignatureData,
	WalletState,
	WalletAuthResult
} from '@/types/wallet';
import { EVMAuthService } from '../services/EVMAuthService';

interface EVMWalletContextType {
	// 基本状態
	walletState: WalletState;

	// 接続管理
	connectWallet: (walletType?: string) => Promise<WalletConnection>;
	disconnectWallet: () => Promise<void>;
	isConnecting: boolean;
	isConnected: boolean;

	// ウォレット情報
	address: string | undefined;
	chainId: number | undefined;
	chainName: string | undefined;

	// 認証
	authenticate: () => Promise<WalletAuthResult>;
	isAuthenticated: boolean;

	// 署名
	signMessage: (message: string) => Promise<string>;
	signAuthMessage: (nonce: string) => Promise<WalletSignatureData>;

	// チェーン操作
	switchChain: (chainId: number) => Promise<void>;

	// UI操作
	openConnectModal: (() => void) | undefined;
	openAccountModal: (() => void) | undefined;

	// エラー
	error: string | undefined;
}

const EVMWalletContext = createContext<EVMWalletContextType | undefined>(undefined);

interface EVMWalletProviderProps {
	children: React.ReactNode;
}

/**
 * EVM Wallet用のReactプロバイダー（Wagmi v2対応）
 */
export const EVMWalletProvider = ({ children }: EVMWalletProviderProps) => {
	// Wagmi v2 hooks
	const { address, isConnected, isConnecting, connector } = useAccount();
	const chainId = useChainId();
	const { connectAsync, connectors, isPending } = useConnect();
	const { disconnectAsync } = useDisconnect();
	const { signMessageAsync } = useSignMessage();
	const { switchChainAsync } = useSwitchChain();
	const { openConnectModal } = useConnectModal();
	const { openAccountModal } = useAccountModal();

	// 内部状態
	const [isAuthenticated, setIsAuthenticated] = useState(false);
	const [error, setError] = useState<string | undefined>();
	const [authService] = useState(() => new EVMAuthService());

	// 接続待機用のPromise解決関数を保持
	const connectionResolverRef = useRef<{
		resolve: (value: WalletConnection) => void;
		reject: (error: Error) => void;
		timeout: NodeJS.Timeout;
	} | null>(null);

	// ウォレット状態の構築
	const walletState: WalletState = {
		isConnecting: isConnecting || isPending,
		isConnected,
		isAuthenticated,
		address,
		chainType: 'evm',
		chainId,
		walletType: connector?.name,
		error,
	};

	// エラーハンドリング
	const handleError = useCallback((error: any, context?: string) => {
		console.error(`EVM Wallet Error (${context}):`, error);
		const errorMessage = error?.message || error?.toString() || 'An unknown error occurred';
		setError(errorMessage);
	}, []);

	// エラークリア
	const clearError = useCallback(() => {
		setError(undefined);
	}, []);

	// 接続状態の変更を監視
	// 接続状態の監視を強化
	useEffect(() => {
		if (address && isConnected) {
			// 状態更新の遅延を考慮した確実な更新
			const updateStateWithDelay = () => {
				//setDebugInfo(prev => ({ ...prev, walletReady: true }));

				if (connectionResolverRef.current) {
					const { resolve, timeout } = connectionResolverRef.current;
					clearTimeout(timeout);

					resolve({
						address,
						chainType: 'evm',
						chainId,
						walletType: connector?.name || 'unknown',
						isConnected: true,
						connectedAt: new Date(),
						lastUsedAt: new Date(),
					});

					connectionResolverRef.current = null;
				}
			};

			// 即座に実行 + 100ms後にも実行（状態同期保証）
			updateStateWithDelay();
			setTimeout(updateStateWithDelay, 100);
		}
	}, [address, isConnected, chainId, connector]);

	// ウォレット接続
	const connectWallet = useCallback(async (walletType?: string): Promise<WalletConnection> => {
		try {
			clearError();

			// 既に接続済みの場合はそのまま返す
			if (address && isConnected) {
				return {
					address,
					chainType: 'evm',
					chainId,
					walletType: connector?.name || 'unknown',
					isConnected: true,
					connectedAt: new Date(),
					lastUsedAt: new Date(),
				};
			}

			// RainbowKitモーダルを開く方法を優先
			if (openConnectModal) {
				return new Promise((resolve, reject) => {
					const timeout = setTimeout(() => {
						connectionResolverRef.current = null;
						reject(new Error('Connection timeout'));
					}, 30000);

					// Promiseの解決関数を保持
					connectionResolverRef.current = { resolve, reject, timeout };

					// モーダルを開く
					openConnectModal();
				});
			}

			// フォールバック：直接接続
			if (connectors.length > 0) {
				const result = await connectAsync({ connector: connectors[0] });
				return {
					address: result.accounts[0],
					chainType: 'evm',
					chainId: result.chainId,
					walletType: connector?.name || 'unknown',
					isConnected: true,
					connectedAt: new Date(),
					lastUsedAt: new Date(),
				};
			}

			throw new Error('No connectors available');
		} catch (error) {
			handleError(error, 'connect');
			throw error;
		}
	}, [address, isConnected, chainId, connector, connectAsync, connectors, openConnectModal, clearError, handleError]);

	// ウォレット切断
	const disconnectWallet = useCallback(async (): Promise<void> => {
		try {
			clearError();
			setIsAuthenticated(false);

			// セッションクリア
			if (address) {
				await authService.logout(address);
			}

			await disconnectAsync();
		} catch (error) {
			handleError(error, 'disconnect');
			throw error;
		}
	}, [disconnectAsync, address, authService, clearError, handleError]);

	// 認証
	const authenticate = useCallback(async (): Promise<WalletAuthResult> => {
		try {
			clearError();

			if (!address || !isConnected) {
				throw new Error('Wallet not connected');
			}

			// 簡易的なアダプター作成
			const mockAdapter = {
				isConnected: () => isConnected,
				getAddress: () => address,
				signAuthMessage: async (nonce: string) => {
					const message = authService.createAuthMessage(address, nonce, 'evm');
					const signature = await signMessageAsync({ message });

					return {
						message,
						signature,
						address,
						chainType: 'evm' as ChainType,
						chainId,
						nonce,
						timestamp: Date.now(),
					};
				}
			} as any;

			const result = await authService.authenticate(mockAdapter);

			if (result.success) {
				setIsAuthenticated(true);
				// セッション作成
				await authService.createSession(result);
			}

			return result;
		} catch (error) {
			handleError(error, 'authenticate');
			return {
				success: false,
				error: error instanceof Error ? error.message : 'Authentication failed'
			};
		}
	}, [address, isConnected, chainId, signMessageAsync, authService, clearError, handleError]);

	// メッセージ署名
	const signMessage = useCallback(async (message: string): Promise<string> => {
		try {
			clearError();
			return await signMessageAsync({ message });
		} catch (error) {
			handleError(error, 'signMessage');
			throw error;
		}
	}, [isConnected, address, signMessageAsync, clearError, handleError]);
	// 認証メッセージ署名
	const signAuthMessage = useCallback(async (nonce: string): Promise<WalletSignatureData> => {
		try {
			clearError();

			if (!address || !isConnected) {
				throw new Error('Wallet not connected');
			}

			const message = authService.createAuthMessage(address, nonce, 'evm');
			const signature = await signMessage(message);

			return {
				message,
				signature,
				address,
				chainType: 'evm',
				chainId,
				nonce,
				timestamp: Date.now(),
			};
		} catch (error) {
			handleError(error, 'signAuthMessage');
			throw error;
		}
	}, [address, isConnected, chainId, signMessage, authService, clearError, handleError]);

	// チェーン切り替え
	const switchChain = useCallback(async (targetChainId: number): Promise<void> => {
		try {
			clearError();

			if (!switchChainAsync) {
				throw new Error('Chain switching not supported');
			}

			await switchChainAsync({ chainId: targetChainId });
		} catch (error) {
			handleError(error, 'switchChain');
			throw error;
		}
	}, [switchChainAsync, clearError, handleError]);

	// 認証状態の復元
	useEffect(() => {
		const restoreAuthentication = async () => {
			if (address && isConnected) {
				try {
					const sessionKey = `wallet_session_${address.toLowerCase()}`;
					const sessionData = localStorage.getItem(sessionKey);

					if (sessionData) {
						const session = JSON.parse(sessionData);
						const isValid = await authService.validateSession(session.token);
						setIsAuthenticated(isValid);
					}
				} catch (error) {
					console.warn('Failed to restore authentication:', error);
				}
			} else {
				setIsAuthenticated(false);
			}
		};

		restoreAuthentication();
	}, [address, isConnected, authService]);

	// 定期的なセッションクリーンアップ
	useEffect(() => {
		const cleanup = () => {
			authService.cleanupExpiredSessions();
		};

		cleanup();
		const interval = setInterval(cleanup, 60 * 60 * 1000);
		return () => clearInterval(interval);
	}, [authService]);

	// クリーンアップ：コンポーネントアンマウント時
	useEffect(() => {
		return () => {
			// 未解決の接続待機がある場合はキャンセル
			if (connectionResolverRef.current) {
				clearTimeout(connectionResolverRef.current.timeout);
				connectionResolverRef.current.reject(new Error('Component unmounted'));
				connectionResolverRef.current = null;
			}
		};
	}, []);

	// コンテキスト値
	const contextValue: EVMWalletContextType = {
		// 基本状態
		walletState,

		// 接続管理
		connectWallet,
		disconnectWallet,
		isConnecting: walletState.isConnecting,
		isConnected: walletState.isConnected,

		// ウォレット情報
		address,
		chainId,
		chainName: chainId ? `Chain ${chainId}` : undefined,

		// 認証
		authenticate,
		isAuthenticated,

		// 署名
		signMessage,
		signAuthMessage,

		// チェーン操作
		switchChain,

		// UI操作
		openConnectModal,
		openAccountModal,

		// エラー
		error,
	};

	return (
		<EVMWalletContext.Provider value={contextValue}>
			{children}
		</EVMWalletContext.Provider>
	);
};

/**
 * EVMWalletContextを使用するhook
 */
export const useEVMWallet = (): EVMWalletContextType => {
	const context = useContext(EVMWalletContext);
	if (!context) {
		throw new Error('useEVMWallet must be used within EVMWalletProvider');
	}
	return context;
};

/**
 * EVMウォレットの接続状態のみを取得するhook
 */
export const useEVMWalletConnection = () => {
	const { isConnected, isConnecting, address, chainId, chainName, error } = useEVMWallet();

	return {
		isConnected,
		isConnecting,
		address,
		chainId,
		chainName,
		error,
	};
};

/**
 * EVMウォレット認証のみを取得するhook
 */
export const useEVMWalletAuth = () => {
	const { authenticate, isAuthenticated, signMessage, signAuthMessage } = useEVMWallet();

	return {
		authenticate,
		isAuthenticated,
		signMessage,
		signAuthMessage,
	};
};
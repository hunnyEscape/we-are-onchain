// src/wallet-auth/adapters/evm/EVMWalletAdapterWrapper.tsx
'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { 
	useAccount, 
	useConnect, 
	useDisconnect, 
	useSignMessage, 
	useSwitchNetwork,
	useNetwork
} from 'wagmi';
import { useConnectModal, useAccountModal } from '@rainbow-me/rainbowkit';
import {
	ChainType,
	WalletConnection,
	WalletSignatureData,
	WalletState,
	WalletAuthResult
} from '../../../../types/wallet';
import { EVMWalletAdapter } from './EVMWalletAdapter';
import { EVMAuthService } from './EVMAuthService';

interface EVMWalletContextType {
	// 基本状態
	walletState: WalletState;
	
	// 接続管理
	connect: (walletType?: string) => Promise<WalletConnection>;
	disconnect: () => Promise<void>;
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
 * EVM Wallet用のReactプロバイダー
 * Wagmi hooksをラップして統一されたインターフェースを提供
 */
export const EVMWalletProvider = ({ children }: EVMWalletProviderProps) => {
	// Wagmi hooks
	const { address, isConnected, isConnecting, connector } = useAccount();
	const { chain } = useNetwork();
	const { connect: wagmiConnect, connectors, isLoading: isConnectLoading } = useConnect();
	const { disconnect: wagmiDisconnect } = useDisconnect();
	const { signMessageAsync } = useSignMessage();
	const { switchNetwork } = useSwitchNetwork();
	const { openConnectModal } = useConnectModal();
	const { openAccountModal } = useAccountModal();

	// 内部状態
	const [isAuthenticated, setIsAuthenticated] = useState(false);
	const [error, setError] = useState<string | undefined>();
	const [authService] = useState(() => new EVMAuthService());

	// ウォレット状態の構築
	const walletState: WalletState = {
		isConnecting: isConnecting || isConnectLoading,
		isConnected,
		isAuthenticated,
		address,
		chainType: 'evm',
		chainId: chain?.id,
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

	// 接続関数
	const connect = useCallback(async (walletType?: string): Promise<WalletConnection> => {
		try {
			clearError();
			
			// RainbowKitモーダルを開く
			if (openConnectModal) {
				openConnectModal();
			}

			// 接続完了を待機（実際の接続はRainbowKitが処理）
			// useAccountの状態変化で接続完了を検知
			return new Promise((resolve, reject) => {
				const checkConnection = () => {
					if (address && isConnected) {
						resolve({
							address,
							chainType: 'evm',
							chainId: chain?.id,
							walletType: connector?.name || 'unknown',
							isConnected: true,
							connectedAt: new Date(),
							lastUsedAt: new Date(),
						});
					}
				};

				// 既に接続済みの場合
				if (address && isConnected) {
					checkConnection();
					return;
				}

				// 接続待機のタイムアウト
				const timeout = setTimeout(() => {
					reject(new Error('Connection timeout'));
				}, 30000); // 30秒

				// 状態変化の監視（簡易実装）
				const interval = setInterval(() => {
					if (address && isConnected) {
						clearTimeout(timeout);
						clearInterval(interval);
						checkConnection();
					}
				}, 1000);
			});
		} catch (error) {
			handleError(error, 'connect');
			throw error;
		}
	}, [address, isConnected, chain, connector, openConnectModal, clearError, handleError]);

	// 切断関数
	const disconnect = useCallback(async (): Promise<void> => {
		try {
			clearError();
			setIsAuthenticated(false);
			
			// セッションクリア
			if (address) {
				await authService.logout(address);
			}
			
			await wagmiDisconnect();
		} catch (error) {
			handleError(error, 'disconnect');
			throw error;
		}
	}, [wagmiDisconnect, address, authService, clearError, handleError]);

	// 認証関数
	const authenticate = useCallback(async (): Promise<WalletAuthResult> => {
		try {
			clearError();
			
			if (!address || !isConnected) {
				throw new Error('Wallet not connected');
			}

			// 簡易的なアダプター作成（実際の署名は以下で実装）
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
						chainId: chain?.id,
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
	}, [address, isConnected, chain, signMessageAsync, authService, clearError, handleError]);

	// メッセージ署名
	const signMessage = useCallback(async (message: string): Promise<string> => {
		try {
			clearError();
			
			if (!isConnected) {
				throw new Error('Wallet not connected');
			}
			
			return await signMessageAsync({ message });
		} catch (error) {
			handleError(error, 'signMessage');
			throw error;
		}
	}, [isConnected, signMessageAsync, clearError, handleError]);

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
				chainId: chain?.id,
				nonce,
				timestamp: Date.now(),
			};
		} catch (error) {
			handleError(error, 'signAuthMessage');
			throw error;
		}
	}, [address, isConnected, chain, signMessage, authService, clearError, handleError]);

	// チェーン切り替え
	const switchChain = useCallback(async (chainId: number): Promise<void> => {
		try {
			clearError();
			
			if (!switchNetwork) {
				throw new Error('Chain switching not supported');
			}
			
			switchNetwork(chainId);
		} catch (error) {
			handleError(error, 'switchChain');
			throw error;
		}
	}, [switchNetwork, clearError, handleError]);

	// 認証状態の復元
	useEffect(() => {
		const restoreAuthentication = async () => {
			if (address && isConnected) {
				// ローカルストレージからセッション確認
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

		// 初回実行
		cleanup();

		// 1時間ごとに実行
		const interval = setInterval(cleanup, 60 * 60 * 1000);

		return () => clearInterval(interval);
	}, [authService]);

	// コンテキスト値
	const contextValue: EVMWalletContextType = {
		// 基本状態
		walletState,
		
		// 接続管理
		connect,
		disconnect,
		isConnecting: walletState.isConnecting,
		isConnected: walletState.isConnected,
		
		// ウォレット情報
		address,
		chainId: chain?.id,
		chainName: chain?.name,
		
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
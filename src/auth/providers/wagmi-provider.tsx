// src/wallet-auth/adapters/evm/wagmi-provider.tsx
'use client';

import React, { ReactNode } from 'react';
import { WagmiProvider, createConfig, http } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RainbowKitProvider, getDefaultConfig, darkTheme } from '@rainbow-me/rainbowkit';
import { mainnet, sepolia, polygon, avalanche, avalancheFuji } from 'wagmi/chains';

// RainbowKit CSS import（グローバルレベルで必要）
import '@rainbow-me/rainbowkit/styles.css';

interface EVMWalletProviderProps {
	children: ReactNode;
	appName?: string;
	projectId?: string;
}

/**
 * サポートするチェーンの設定（Wagmi v2）
 */
const getSupportedChains = () => {
	const isDevelopment = process.env.NODE_ENV === 'development';
	
	if (isDevelopment) {
		// 開発環境：テストネットも含める
		return [mainnet, polygon, avalanche, sepolia, avalancheFuji];
	} else {
		// 本番環境：メインネットのみ
		return [mainnet, polygon, avalanche];
	}
};

/**
 * デフォルトチェーンを取得
 */
const getDefaultChain = () => {
	const isDevelopment = process.env.NODE_ENV === 'development';
	return isDevelopment ? avalancheFuji : mainnet;
};

/**
 * Wagmi + RainbowKit プロバイダー（v2対応）
 */
export const EVMWalletProvider = ({
	children,
	appName = 'We are on-chain',
	projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID
}: EVMWalletProviderProps) => {
	// サポートするチェーン
	const chains = getSupportedChains();
	const defaultChain = getDefaultChain();

	// WalletConnect Project IDの確認
	if (!projectId) {
		console.warn('⚠️ WalletConnect Project ID not found. Some wallets may not work properly.');
	}

	// Wagmi設定（v2 API）
	const config = getDefaultConfig({
		appName,
		projectId: projectId || 'dummy-project-id',
		chains: chains as any,
		ssr: true, // Next.jsのSSR対応
	});

	// React Query Client（v5対応）
	const queryClient = new QueryClient({
		defaultOptions: {
			queries: {
				staleTime: 1000 * 60 * 5, // 5分
				refetchOnWindowFocus: false,
				retry: (failureCount, error) => {
					// ネットワークエラーのみリトライ
					if (failureCount < 3 && error?.message?.includes('network')) {
						return true;
					}
					return false;
				},
			},
		},
	});

	return (
		<WagmiProvider config={config}>
			<QueryClientProvider client={queryClient}>
				<RainbowKitProvider
					initialChain={defaultChain}
					appInfo={{
						appName,
						learnMoreUrl: 'https://wagmi.sh',
					}}
					theme={darkTheme({
						accentColor: '#00FF7F', // neonGreen
						accentColorForeground: '#000000',
						borderRadius: 'medium',
						fontStack: 'system',
						overlayBlur: 'small',
					})}
					modalSize="compact"
					coolMode={true} // サイバーパンクに合うエフェクト
				>
					{children}
				</RainbowKitProvider>
			</QueryClientProvider>
		</WagmiProvider>
	);
};

/**
 * EVMウォレットプロバイダー用のhook
 * プロバイダーが正しく設定されているかチェック
 */
export const useEVMWalletProvider = () => {
	const configStatus = React.useMemo(() => {
		try {
			// 基本的な設定チェック
			const hasProjectId = !!process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;
			const supportedChains = getSupportedChains();
			const hasChains = supportedChains.length > 0;
			const defaultChain = getDefaultChain();
			
			return {
				isConfigured: hasProjectId && hasChains,
				hasProjectId,
				hasChains,
				chainCount: supportedChains.length,
				defaultChain: defaultChain.name,
				supportedNetworks: supportedChains.map(chain => ({
					id: chain.id,
					name: chain.name,
					testnet: chain.testnet || false,
				})),
				projectId: hasProjectId ? 'Set' : 'Missing',
				environment: process.env.NODE_ENV,
			};
		} catch (error) {
			console.error('EVMWalletProvider configuration error:', error);
			return {
				isConfigured: false,
				hasProjectId: false,
				hasChains: false,
				chainCount: 0,
				defaultChain: 'Unknown',
				supportedNetworks: [],
				projectId: 'Error',
				environment: process.env.NODE_ENV,
				error: error instanceof Error ? error.message : 'Unknown error',
			};
		}
	}, []);

	return configStatus;
};

/**
 * Wagmi設定のバリデーター
 */
export const validateWagmiConfig = () => {
	const errors: string[] = [];
	const warnings: string[] = [];

	// Project ID チェック
	if (!process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID) {
		errors.push('NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID is not set');
	}

	// チェーン設定チェック
	try {
		const chains = getSupportedChains();
		if (chains.length === 0) {
			errors.push('No supported chains configured');
		}

		// 開発環境での警告
		if (process.env.NODE_ENV === 'development') {
			warnings.push('Development mode: testnet chains enabled');
		}
	} catch (error) {
		errors.push(`Chain configuration error: ${error}`);
	}

	return {
		isValid: errors.length === 0,
		errors,
		warnings,
	};
};

/**
 * デバッグ用のプロバイダー情報コンポーネント（v2対応）
 */
export const EVMProviderDebugInfo = () => {
	const providerInfo = useEVMWalletProvider();
	const validation = validateWagmiConfig();

	if (process.env.NODE_ENV !== 'development') {
		return null;
	}

	return (
		<div className="fixed bottom-4 right-4 p-4 bg-black/90 border border-neonGreen/30 rounded-sm text-xs text-white z-50 max-w-xs">
			<div className="font-bold text-neonGreen mb-2">🦊 EVM Provider Debug (v2)</div>
			
			{/* 基本ステータス */}
			<div className="space-y-1 mb-3">
				<div className="flex justify-between">
					<span>Configured:</span>
					<span className={providerInfo.isConfigured ? 'text-neonGreen' : 'text-red-400'}>
						{providerInfo.isConfigured ? '✅' : '❌'}
					</span>
				</div>
				<div className="flex justify-between">
					<span>Project ID:</span>
					<span className={providerInfo.hasProjectId ? 'text-neonGreen' : 'text-red-400'}>
						{providerInfo.projectId}
					</span>
				</div>
				<div className="flex justify-between">
					<span>Chains:</span>
					<span className="text-white">{providerInfo.chainCount}</span>
				</div>
				<div className="flex justify-between">
					<span>Default:</span>
					<span className="text-neonOrange">{providerInfo.defaultChain}</span>
				</div>
				<div className="flex justify-between">
					<span>Environment:</span>
					<span className="text-gray-300">{providerInfo.environment}</span>
				</div>
			</div>

			{/* サポートされているネットワーク */}
			{providerInfo.supportedNetworks.length > 0 && (
				<div className="mb-3">
					<div className="text-gray-400 mb-1">Networks:</div>
					<div className="space-y-1">
						{providerInfo.supportedNetworks.map((network) => (
							<div key={network.id} className="flex justify-between text-xs">
								<span className={network.testnet ? 'text-yellow-400' : 'text-white'}>
									{network.name}
								</span>
								<span className="text-gray-400">
									{network.testnet ? '🧪' : '🌐'}
								</span>
							</div>
						))}
					</div>
				</div>
			)}

			{/* バリデーション結果 */}
			{!validation.isValid && (
				<div className="mb-3">
					<div className="text-red-400 mb-1">Errors:</div>
					{validation.errors.map((error, index) => (
						<div key={index} className="text-red-300 text-xs">
							• {error}
						</div>
					))}
				</div>
			)}

			{validation.warnings.length > 0 && (
				<div className="mb-3">
					<div className="text-yellow-400 mb-1">Warnings:</div>
					{validation.warnings.map((warning, index) => (
						<div key={index} className="text-yellow-300 text-xs">
							• {warning}
						</div>
					))}
				</div>
			)}

			{/* エラー情報 */}
			{providerInfo.error && (
				<div className="mt-3 p-2 bg-red-900/30 border border-red-500/50 rounded">
					<div className="text-red-400 text-xs font-bold mb-1">Error:</div>
					<div className="text-red-300 text-xs break-all">
						{providerInfo.error}
					</div>
				</div>
			)}

			{/* 成功インジケーター */}
			{validation.isValid && providerInfo.isConfigured && (
				<div className="mt-3 p-2 bg-neonGreen/20 border border-neonGreen/50 rounded">
					<div className="text-neonGreen text-xs font-bold">
						🚀 Ready for Web3!
					</div>
				</div>
			)}
		</div>
	);
};

/**
 * Wagmi設定情報を取得するhook
 */
export const useWagmiConfigInfo = () => {
	return React.useMemo(() => {
		const chains = getSupportedChains();
		const defaultChain = getDefaultChain();
		
		return {
			supportedChains: chains,
			defaultChain,
			chainIds: chains.map(chain => chain.id),
			isTestnetEnabled: process.env.NODE_ENV === 'development',
			projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID,
		};
	}, []);
};
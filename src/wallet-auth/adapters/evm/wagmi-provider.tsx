// src/wallet-auth/adapters/evm/wagmi-provider.tsx
'use client';

import React, { ReactNode } from 'react';
import { WagmiConfig, createConfig, configureChains } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RainbowKitProvider, getDefaultWallets, darkTheme, lightTheme } from '@rainbow-me/rainbowkit';
import { publicProvider } from 'wagmi/providers/public';
import { getEVMChains, getDefaultChain } from './chain-config';

// RainbowKit CSS import（グローバルレベルで必要）
import '@rainbow-me/rainbowkit/styles.css';

interface EVMWalletProviderProps {
	children: ReactNode;
	appName?: string;
	projectId?: string;
}

/**
 * Wagmi + RainbowKit プロバイダー
 * EVM系ウォレット接続の基盤となるプロバイダー
 */
export const EVMWalletProvider = ({ 
	children, 
	appName = 'We are on-chain',
	projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID 
}: EVMWalletProviderProps) => {
	// サポートするチェーン
	const chains = getEVMChains();
	const defaultChain = getDefaultChain();

	// WalletConnect Project IDの確認
	if (!projectId) {
		console.warn('⚠️ WalletConnect Project ID not found. Some wallets may not work properly.');
	}

	// チェーンとプロバイダーの設定
	const { chains: configuredChains, publicClient, webSocketPublicClient } = configureChains(
		chains,
		[
			publicProvider(),
		]
	);

	// ウォレット設定
	const { connectors } = getDefaultWallets({
		appName,
		projectId: projectId || 'dummy-project-id',
		chains: configuredChains,
	});

	// Wagmi設定
	const config = createConfig({
		autoConnect: true,
		connectors,
		publicClient,
		webSocketPublicClient,
	});

	// React Query Client
	const queryClient = new QueryClient({
		defaultOptions: {
			queries: {
				staleTime: 1000 * 60 * 5, // 5分
				refetchOnWindowFocus: false,
			},
		},
	});

	return (
		<WagmiConfig config={config}>
			<QueryClientProvider client={queryClient}>
				<RainbowKitProvider
					chains={configuredChains}
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
		</WagmiConfig>
	);
};

/**
 * EVMウォレットプロバイダー用のhook
 * プロバイダーが正しく設定されているかチェック
 */
export const useEVMWalletProvider = () => {
	const isConfigured = React.useMemo(() => {
		try {
			// 基本的な設定チェック
			const hasProjectId = !!process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;
			const hasChains = getEVMChains().length > 0;
			
			return {
				isConfigured: hasProjectId && hasChains,
				hasProjectId,
				hasChains,
				chainCount: getEVMChains().length,
				defaultChain: getDefaultChain().name,
			};
		} catch (error) {
			console.error('EVMWalletProvider configuration error:', error);
			return {
				isConfigured: false,
				hasProjectId: false,
				hasChains: false,
				chainCount: 0,
				defaultChain: 'Unknown',
				error: error instanceof Error ? error.message : 'Unknown error',
			};
		}
	}, []);

	return isConfigured;
};

/**
 * デバッグ用のプロバイダー情報コンポーネント
 */
export const EVMProviderDebugInfo = () => {
	const providerInfo = useEVMWalletProvider();

	if (process.env.NODE_ENV !== 'development') {
		return null;
	}

	return (
		<div className="fixed bottom-4 right-4 p-3 bg-black/80 border border-neonGreen/30 rounded-sm text-xs text-white z-50">
			<div className="font-bold text-neonGreen mb-2">EVM Provider Debug</div>
			<div>Configured: {providerInfo.isConfigured ? '✅' : '❌'}</div>
			<div>Project ID: {providerInfo.hasProjectId ? '✅' : '❌'}</div>
			<div>Chains: {providerInfo.chainCount}</div>
			<div>Default: {providerInfo.defaultChain}</div>
			{providerInfo.error && (
				<div className="text-red-400 mt-1">Error: {providerInfo.error}</div>
			)}
		</div>
	);
};
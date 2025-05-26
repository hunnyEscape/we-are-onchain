// src/app/layout-updated.tsx
import { Montserrat, Space_Grotesk } from 'next/font/google';
import './globals.css';
import type { Metadata } from 'next';
import { EVMWalletProvider } from '@/wallet-auth/adapters/evm/wagmi-provider';
import { EVMWalletProvider as EVMWalletContextProvider } from '@/wallet-auth/adapters/evm/EVMWalletAdapterWrapper';
import { UnifiedAuthProvider } from '@/contexts/UnifiedAuthContext';

// フォントの設定
const montserrat = Montserrat({
	subsets: ['latin'],
	variable: '--font-montserrat',
	display: 'swap',
});

const spaceGrotesk = Space_Grotesk({
	subsets: ['latin'],
	variable: '--font-space-grotesk',
	display: 'swap',
});

// メタデータ設定
export const metadata: Metadata = {
	title: 'We Are On-Chain | Pepe Protein',
	description: 'Pay, Pump, Live. The crypto-exclusive protein for the blockchain generation.',
	keywords: 'crypto, protein, blockchain, pepe, fitness, cryptocurrency',
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang="en" className={`${montserrat.variable} ${spaceGrotesk.variable}`}>
			<body className="bg-black text-white min-h-screen font-sans antialiased">
				{/* Wagmi + RainbowKit Provider (最下層) */}
				<EVMWalletProvider
					appName="We are on-chain"
					projectId={process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID}
				>
					{/* EVM Wallet Context Provider */}
					<EVMWalletContextProvider>
						{/* Firebase Auth Provider (既存) */}

							{/* 統合認証プロバイダー */}
							<UnifiedAuthProvider
								config={{
									preferredMethod: 'hybrid',
									enableFirebase: true,
									enableWallet: true,
									autoConnect: true,
									sessionTimeout: 24 * 60, // 24時間
									walletConfig: {
										enabledChains: ['evm'],
										preferredChain: 'evm',
									},
								}}
							>
								{children}
							</UnifiedAuthProvider>

					</EVMWalletContextProvider>
				</EVMWalletProvider>
			</body>
		</html>
	);
}
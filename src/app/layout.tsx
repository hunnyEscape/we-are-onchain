// src/app/layout.tsx
import { Montserrat, Space_Grotesk } from 'next/font/google';
import './globals.css';
import type { Metadata } from 'next';
import { EVMWalletProvider } from '@/wallet-auth/adapters/evm/wagmi-provider';
import { EVMWalletProvider as EVMWalletContextProvider } from '@/wallet-auth/adapters/evm/EVMWalletAdapterWrapper';
import { UnifiedAuthProvider } from '@/contexts/UnifiedAuthContext';

// フォント設定の最適化
const montserrat = Montserrat({
	subsets: ['latin'],
	variable: '--font-montserrat',
	display: 'swap',
	preload: true,
});

const spaceGrotesk = Space_Grotesk({
	subsets: ['latin'],
	variable: '--font-space-grotesk',
	display: 'swap',
	preload: true,
});

// SEO最適化されたメタデータ
export const metadata: Metadata = {
	title: 'We Are On-Chain | Pepe Protein',
	description: 'Pay, Pump, Live. The crypto-exclusive protein for the blockchain generation.',
	keywords: 'crypto, protein, blockchain, pepe, fitness, cryptocurrency, web3',
	metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'https://weareonchain.com'),
	openGraph: {
		title: 'We Are On-Chain | Pepe Protein',
		description: 'The crypto-exclusive protein for the blockchain generation.',
		type: 'website',
	},
	twitter: {
		card: 'summary_large_image',
		title: 'We Are On-Chain | Pepe Protein',
		description: 'Pay, Pump, Live. The crypto-exclusive protein for the blockchain generation.',
	},
	viewport: {
		width: 'device-width',
		initialScale: 1,
	},
};

// 認証設定の定数化
const AUTH_CONFIG: Partial<any> = {
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

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html
			lang="en"
			className={`${montserrat.variable} ${spaceGrotesk.variable}`}
			suppressHydrationWarning={true}
		>
			<body className="bg-black text-white min-h-screen font-sans antialiased">
				{/* Wallet & Auth Provider Stack */}
				<EVMWalletProvider
					appName="We are on-chain"
					projectId={process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID}
				>
					<EVMWalletContextProvider>
						<UnifiedAuthProvider config={AUTH_CONFIG}>
							{children}
						</UnifiedAuthProvider>
					</EVMWalletContextProvider>
				</EVMWalletProvider>
			</body>
		</html>
	);
}
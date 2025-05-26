// src/app/layout.tsx
import { Montserrat, Space_Grotesk } from 'next/font/google';
import './globals.css';
import type { Metadata } from 'next';
import { EVMWalletProvider } from '@/auth/providers/wagmi-provider';
import { EVMWalletProvider as EVMWalletContextProvider } from '@/auth/providers/EVMWalletAdapterWrapper';
import { UnifiedAuthProvider } from '@/auth/contexts/UnifiedAuthContext';
import { AuthModalProvider } from '@/contexts/AuthModalContext';
import { GlobalAuthModal } from './components/modals/AuthModalProvider';

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

// 認証設定の定数化（Updated: Wallet専用）
const AUTH_CONFIG: Partial<any> = {
	preferredMethod: 'wallet', // wallet専用に変更
	enableFirebase: false,     // Firebase無効
	enableWallet: true,
	autoConnect: true,
	sessionTimeout: 24 * 60, // 24時間
	walletConfig: {
		enabledChains: ['evm'],
		preferredChain: 'evm',
	},
};

// グローバル認証モーダルのデフォルト設定
const GLOBAL_MODAL_CONFIG = {
	preferredChain: 'evm' as const,
	autoClose: true,
	showChainSelector: true,
	title: 'Connect Your Wallet',
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
				{/* Provider Stack - 正しい階層順序 */}
				<EVMWalletProvider
					appName="We are on-chain"
					projectId={process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID}
				>
					<EVMWalletContextProvider>
						<UnifiedAuthProvider config={AUTH_CONFIG}>
							<AuthModalProvider defaultOptions={GLOBAL_MODAL_CONFIG}>
								{/* メインコンテンツ */}
								{children}
								
								{/* グローバル認証モーダル - 最上位レイヤー */}
								<GlobalAuthModal />
							</AuthModalProvider>
						</UnifiedAuthProvider>
					</EVMWalletContextProvider>
				</EVMWalletProvider>



				{/* 開発環境用のデバッグスクリプト */}
				{process.env.NODE_ENV === 'development' && (
					<script
						dangerouslySetInnerHTML={{
							__html: `
								// グローバル認証モーダルのデバッグヘルパー
								window.debugAuthModal = {
									open: (options = {}) => {
										window.dispatchEvent(new CustomEvent('openAuthModal', { detail: options }));
									},
									close: () => {
										window.dispatchEvent(new CustomEvent('closeAuthModal'));
									},
									test: () => {
										console.log('🧪 Testing AuthModal...');
										window.debugAuthModal.open({ 
											title: 'Debug Test Modal',
											preferredChain: 'evm'
										});
									}
								};
								
								// コンソールにヘルプを表示
								console.log('🔐 AuthModal Debug Commands:');
								console.log('  window.debugAuthModal.open({ title: "Test" })');
								console.log('  window.debugAuthModal.close()');
								console.log('  window.debugAuthModal.test()');
							`,
						}}
					/>
				)}
			</body>
		</html>
	);
}
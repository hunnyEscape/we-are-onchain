import { Montserrat, Space_Grotesk, DotGothic16 } from 'next/font/google';
import './globals.css';
import type { Metadata } from 'next';
import SmoothScroll from './components/layout/SmoothScroll';
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
const pixel = DotGothic16({
  weight: '400',
  subsets: ['latin', 'latin-ext'],
  variable: '--font-pixel',
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
		<html lang="en" className={`${montserrat.variable} ${spaceGrotesk.variable} ${pixel.variable}`}>
			<body className="bg-black text-white min-h-screen font-sans antialiased">

				{children}

			</body>
		</html>
	);
}
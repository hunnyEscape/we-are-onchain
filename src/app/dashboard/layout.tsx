// src/app/dashboard/layout.tsx
'use client';

import Header from '../components/ui/Header';
import Footer from '../components/ui/Footer';
import GridPattern from '../components/common/GridPattern';
import SlideInPanel from './components/SlideInPanel';
import { DashboardProvider, usePanel } from './context/DashboardContext';

// セクションコンポーネントのインポート
import ShopSection from './components/sections/ShopSection';
import HowToBuySection from './components/sections/HowToBuySection';
import WhitepaperSection from './components/sections/WhitepaperSection';
import ProfileSection from './components/sections/ProfileSection';
import CartSection from './components/sections/CartSection';
import { SectionType } from '../../../types/dashboard';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';
interface DashboardLayoutProps {
	children: React.ReactNode;
}

// パネル管理コンポーネント
function DashboardPanelManager() {
	const { activeSection, isSlideOpen, closePanel } = usePanel();

	const renderSectionContent = () => {
		switch (activeSection) {
			case 'shop':
				return <ShopSection />;
			case 'how-to-buy':
				return <HowToBuySection />;
			case 'whitepaper':
				return <WhitepaperSection />;
			case 'profile':
				return <ProfileSection />;
			case 'cart':
				return <CartSection />;
			default:
				return <div className="text-white">Loading...</div>;
		}
	};

	const getSectionTitle = (section: SectionType | null): string => {
		const titles = {
			'shop': 'Shop',
			'how-to-buy': 'How to Buy',
			'whitepaper': 'Whitepaper',
			'profile': 'Profile',
			'cart': 'Cart'
		};
		return section ? titles[section] : '';
	};

	return (
		<SlideInPanel
			isOpen={isSlideOpen}
			onClose={closePanel}
			title={getSectionTitle(activeSection)}
		>
			{renderSectionContent()}
		</SlideInPanel>
	);
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
	return (
		<DashboardProvider>
			<div className="min-h-screen bg-black text-white relative">
				{/* Header */}
				<Header />

				{/* Background Effects */}
				<div className="fixed inset-0 z-0">
					<div className="absolute inset-0 bg-gradient-to-b from-black via-dark-100 to-black opacity-80" />
					<GridPattern
						size={40}
						opacity={0.02}
						color="rgba(0, 255, 127, 0.05)"
					/>
				</div>

				{/* Main Content */}
				<main className="relative z-10 pt-16 min-h-[calc(100vh-4rem)]">
					<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
						{children}
					</div>
				</main>

				{/* Footer */}
				<Footer />

				{/* SlideInPanel - 最前面に配置 */}
				<DashboardPanelManager />
			</div>
		</DashboardProvider>
	);
}
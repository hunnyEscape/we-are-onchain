// src/app/dashboard/page.tsx
'use client';

import React, { useState } from 'react';
import DashboardGrid from './components/DashboardGrid';
import SlideInPanel from './components/SlideInPanel';
import { SectionType } from '../../../types/dashboard';

// Import actual section components
import ShopSection from './components/sections/ShopSection';
import HowToBuySection from './components/sections/HowToBuySection';
import PurchaseScanSection from './components/sections/PurchaseScanSection';
import WhitepaperSection from './components/sections/WhitepaperSection';
import ProfileSection from './components/sections/ProfileSection';
import CartSection from './components/sections/CartSection';

export default function DashboardPage() {
	const [activeSection, setActiveSection] = useState<SectionType | null>(null);
	const [isSlideOpen, setIsSlideOpen] = useState(false);

	const handleCardClick = (section: SectionType) => {
		setActiveSection(section);
		setIsSlideOpen(true);
	};

	const handleCloseSlide = () => {
		setIsSlideOpen(false);
		// アニメーション完了後にactiveSectionをクリア
		setTimeout(() => setActiveSection(null), 300);
	};

	const renderSectionContent = () => {
		switch (activeSection) {
			case 'shop':
				return <ShopSection />;
			case 'how-to-buy':
				return <HowToBuySection />;
			case 'purchase-scan':
				return <PurchaseScanSection />;
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
			'purchase-scan': 'Purchase Scan',
			'whitepaper': 'Whitepaper',
			'profile': 'Profile',
			'cart': 'Cart'
		};
		return section ? titles[section] : '';
	};

	return (
		<>
			{/* ダッシュボードヘッダー */}
			<div className="mb-8">
				<h1 className="text-4xl font-heading font-bold text-white mb-2">
					Dashboard
				</h1>
				<p className="text-gray-400">
					Welcome to your Web3 protein command center
				</p>
			</div>

			{/* ダッシュボードグリッド */}
			<DashboardGrid onCardClick={handleCardClick} />

			{/* スライドインパネル */}
			<SlideInPanel
				isOpen={isSlideOpen}
				onClose={handleCloseSlide}
				title={getSectionTitle(activeSection)}
			>
				{renderSectionContent()}
			</SlideInPanel>
		</>
	);
}
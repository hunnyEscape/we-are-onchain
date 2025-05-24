// src/app/dashboard/page.tsx
'use client';

import React, { useState } from 'react';
import DashboardGrid from './components/DashboardGrid';
import SlideInPanel from './components/SlideInPanel';
import { SectionType } from '../../../types/dashboard';

// Section Components (仮実装 - Phase 3で詳細実装)
const ShopSection = () => <div className="text-white">Shop Section - Coming Soon</div>;
const PurchaseScanSection = () => <div className="text-white">Purchase Scan Section - Coming Soon</div>;
const WhitepaperSection = () => <div className="text-white">Whitepaper Section - Coming Soon</div>;
const ProfileSection = () => <div className="text-white">Profile Section - Coming Soon</div>;
const SettingsSection = () => <div className="text-white">Settings Section - Coming Soon</div>;
const CartSection = () => <div className="text-white">Cart Section - Coming Soon</div>;

export default function DashboardPage() {
	const [activeSection, setActiveSection] = useState<SectionType | null>(null);
	const [isSlideOpen, setIsSlideOpen] = useState(false);

	const handleCardClick = (section: SectionType) => {
		setActiveSection(section);
		setIsSlideOpen(true);
	};

	const handleCloseSlide = () => {
		setIsSlideOpen(false);
		// アニメーション完了後にactiveSection をクリア
		setTimeout(() => setActiveSection(null), 300);
	};

	const renderSectionContent = () => {
		switch (activeSection) {
			case 'shop':
				return <ShopSection />;
			case 'purchase-scan':
				return <PurchaseScanSection />;
			case 'whitepaper':
				return <WhitepaperSection />;
			case 'profile':
				return <ProfileSection />;
			case 'settings':
				return <SettingsSection />;
			case 'cart':
				return <CartSection />;
			default:
				return null;
		}
	};

	const getSectionTitle = (section: SectionType | null): string => {
		const titles = {
			'shop': 'Shop',
			'purchase-scan': 'Purchase Scan',
			'whitepaper': 'Whitepaper',
			'profile': 'Profile',
			'settings': 'Settings',
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
// src/app/dashboard/page.tsx
'use client';

import React from 'react';
import DashboardGrid from './components/DashboardGrid';
import PurchaseScanSection from './components/sections/PurchaseScanSection';
import { usePanel } from '@/contexts/DashboardContext';

export default function DashboardPage() {
	const { openPanel } = usePanel();

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
			<div className="mb-12">
				<DashboardGrid onCardClick={openPanel} />
			</div>

			{/* Purchase Scan セクション - 独立表示 */}
			<div className="border-t border-dark-300 pt-12">
				<PurchaseScanSection />
			</div>
		</>
	);
}
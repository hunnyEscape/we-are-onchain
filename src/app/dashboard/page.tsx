// src/app/dashboard/page.tsx
'use client';

import React from 'react';
import DashboardGrid from './components/DashboardGrid';
import { usePanel } from './context/DashboardContext';

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
			<DashboardGrid onCardClick={openPanel} />
		</>
	);
}
// src/app/dashboard/components/sections/PurchaseScanSection.tsx
'use client';

import React, { useState } from 'react';
import CyberCard from '../../../components/common/CyberCard';
import CyberButton from '../../../components/common/CyberButton';
import { PurchaseRecord, FilterOptions } from '@/types/dashboard';
import { TrendingUp, Users, DollarSign, Activity, Trophy, ExternalLink } from 'lucide-react';

const PurchaseScanSection: React.FC = () => {
	const [filterOptions, setFilterOptions] = useState<FilterOptions>({
		period: 'all',
		sortBy: 'amount',
		sortOrder: 'desc'
	});

	// モックデータ
	const mockPurchases: PurchaseRecord[] = [
		{
			rank: 1,
			walletAddress: '0x742d35CC6634C0532925a3b8D404e22d65be3b32',
			displayAddress: '0x742d...3b32',
			totalSpent: 2.45,
			totalSpentUSD: 8234.50,
			purchaseCount: 47,
			lastPurchase: new Date('2024-05-20'),
			txHashes: ['0xabc123...', '0xdef456...'],
			badges: ['Whale', 'Early Adopter'],
			isCurrentUser: false
		},
		{
			rank: 2,
			walletAddress: '0x8ba1f109551bD432803012645Hac136c0E46c33e',
			displayAddress: '0x8ba1...c33e',
			totalSpent: 1.89,
			totalSpentUSD: 6345.75,
			purchaseCount: 32,
			lastPurchase: new Date('2024-05-19'),
			txHashes: ['0x123abc...'],
			badges: ['Power User'],
			isCurrentUser: false
		},
		{
			rank: 42,
			walletAddress: '0x1234567890123456789012345678901234567890',
			displayAddress: '0x1234...7890',
			totalSpent: 0.125,
			totalSpentUSD: 420.25,
			purchaseCount: 3,
			lastPurchase: new Date('2024-05-15'),
			txHashes: ['0x789xyz...'],
			badges: ['New Member'],
			isCurrentUser: true
		}
	];

	const stats = {
		totalPurchases: 247,
		totalVolume: 89.7,
		totalVolumeUSD: 301456.78,
		activeUsers: 156
	};

	const handleFilterChange = (key: keyof FilterOptions, value: any) => {
		setFilterOptions(prev => ({ ...prev, [key]: value }));
	};

	const formatDate = (date: Date) => {
		return date.toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	};

	return (
		<div className="space-y-8">
			{/* Header */}
			<div className="text-center">
				<h2 className="text-3xl font-heading font-bold text-white mb-2">
					Purchase Scan
				</h2>
				<p className="text-gray-400">
					Community purchase rankings and transaction transparency
				</p>
			</div>

			{/* Stats Cards */}
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
				<CyberCard showEffects={false} className="text-center">
					<TrendingUp className="w-8 h-8 text-neonGreen mx-auto mb-2" />
					<div className="text-2xl font-bold text-white">{stats.totalPurchases}</div>
					<div className="text-xs text-gray-400">Total Purchases</div>
				</CyberCard>

				<CyberCard showEffects={false} className="text-center">
					<DollarSign className="w-8 h-8 text-neonOrange mx-auto mb-2" />
					<div className="text-2xl font-bold text-white">Ξ {stats.totalVolume}</div>
					<div className="text-xs text-gray-400">Total Volume</div>
				</CyberCard>

				<CyberCard showEffects={false} className="text-center">
					<Activity className="w-8 h-8 text-neonGreen mx-auto mb-2" />
					<div className="text-2xl font-bold text-white">${stats.totalVolumeUSD.toLocaleString()}</div>
					<div className="text-xs text-gray-400">USD Volume</div>
				</CyberCard>

				<CyberCard showEffects={false} className="text-center">
					<Users className="w-8 h-8 text-neonOrange mx-auto mb-2" />
					<div className="text-2xl font-bold text-white">{stats.activeUsers}</div>
					<div className="text-xs text-gray-400">Active Users</div>
				</CyberCard>
			</div>

			{/* Filters */}
			<CyberCard title="Filters" showEffects={false}>
				<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
					<div>
						<label className="block text-sm font-medium text-white mb-2">Period</label>
						<select
							value={filterOptions.period}
							onChange={(e) => handleFilterChange('period', e.target.value)}
							className="w-full px-3 py-2 bg-dark-200 border border-dark-300 rounded-sm text-white focus:border-neonGreen focus:outline-none"
						>
							<option value="today">Today</option>
							<option value="week">This Week</option>
							<option value="month">This Month</option>
							<option value="all">All Time</option>
						</select>
					</div>

					<div>
						<label className="block text-sm font-medium text-white mb-2">Sort By</label>
						<select
							value={filterOptions.sortBy}
							onChange={(e) => handleFilterChange('sortBy', e.target.value)}
							className="w-full px-3 py-2 bg-dark-200 border border-dark-300 rounded-sm text-white focus:border-neonGreen focus:outline-none"
						>
							<option value="amount">Total Amount</option>
							<option value="count">Purchase Count</option>
							<option value="date">Last Purchase</option>
						</select>
					</div>

					<div>
						<label className="block text-sm font-medium text-white mb-2">Order</label>
						<select
							value={filterOptions.sortOrder}
							onChange={(e) => handleFilterChange('sortOrder', e.target.value)}
							className="w-full px-3 py-2 bg-dark-200 border border-dark-300 rounded-sm text-white focus:border-neonGreen focus:outline-none"
						>
							<option value="desc">Highest First</option>
							<option value="asc">Lowest First</option>
						</select>
					</div>
				</div>
			</CyberCard>

			{/* Rankings Table */}
			<CyberCard title="Top Purchasers" showEffects={false}>
				<div className="overflow-x-auto">
					<table className="w-full">
						<thead>
							<tr className="border-b border-dark-300">
								<th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Rank</th>
								<th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Address</th>
								<th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Total Spent</th>
								<th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Purchases</th>
								<th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Last Activity</th>
								<th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Badges</th>
								<th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Actions</th>
							</tr>
						</thead>
						<tbody>
							{mockPurchases.map((record) => (
								<tr
									key={record.walletAddress}
									className={`border-b border-dark-300/50 hover:bg-dark-200/30 transition-colors ${record.isCurrentUser ? 'bg-neonGreen/5 border-neonGreen/20' : ''
										}`}
								>
									<td className="py-4 px-4">
										<div className="flex items-center space-x-2">
											{record.rank <= 3 && (
												<Trophy className={`w-4 h-4 ${record.rank === 1 ? 'text-yellow-400' :
														record.rank === 2 ? 'text-gray-300' :
															'text-orange-400'
													}`} />
											)}
											<span className={`font-bold ${record.isCurrentUser ? 'text-neonGreen' : 'text-white'}`}>
												#{record.rank}
											</span>
										</div>
									</td>
									<td className="py-4 px-4">
										<div className="font-mono text-sm">
											{record.displayAddress}
											{record.isCurrentUser && (
												<span className="ml-2 text-xs bg-neonGreen/20 text-neonGreen px-2 py-1 rounded-sm">
													You
												</span>
											)}
										</div>
									</td>
									<td className="py-4 px-4">
										<div>
											<div className="font-bold text-neonGreen">Ξ {record.totalSpent}</div>
											<div className="text-xs text-gray-400">${record.totalSpentUSD.toLocaleString()}</div>
										</div>
									</td>
									<td className="py-4 px-4 text-white">{record.purchaseCount}</td>
									<td className="py-4 px-4 text-sm text-gray-400">
										{formatDate(record.lastPurchase)}
									</td>
									<td className="py-4 px-4">
										<div className="flex flex-wrap gap-1">
											{record.badges?.map((badge, index) => (
												<span
													key={index}
													className="text-xs bg-neonOrange/20 text-neonOrange px-2 py-1 rounded-sm"
												>
													{badge}
												</span>
											))}
										</div>
									</td>
									<td className="py-4 px-4">
										<CyberButton
											variant="outline"
											size="sm"
											className="flex items-center space-x-1"
										>
											<ExternalLink className="w-3 h-3" />
											<span>View</span>
										</CyberButton>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</CyberCard>
		</div>
	);
};

export default PurchaseScanSection;
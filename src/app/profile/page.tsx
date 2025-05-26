// src/app/profile/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useUnifiedAuth } from '@/auth/contexts/UnifiedAuthContext';
import CyberCard from '../components/common/CyberCard';
import CyberButton from '../components/common/CyberButton';
import { ProfileEditModal } from '../dashboard/components/sections/ProfileEditModal';
import {
	Wallet,
	Trophy,
	Award,
	ExternalLink,
	Copy,
	Check,
	Shield,
	Edit,
	AlertCircle,
	CheckCircle,
	ArrowLeft
} from 'lucide-react';
import {
	formatUserStats,
	formatDate,
	formatAddress,
	calculateProfileCompleteness
} from '@/utils/userHelpers';

export default function ProfilePage() {
	// Wallet認証のみ使用
	const {
		isAuthenticated,
		isLoading,
		walletAddress,
		displayName,
		firestoreUser,
		firestoreLoading
	} = useUnifiedAuth();

	const [copiedAddress, setCopiedAddress] = useState(false);
	const [isEditModalOpen, setIsEditModalOpen] = useState(false);

	// ページタイトルの設定
	useEffect(() => {
		document.title = 'Profile - We are on-chain';
		return () => {
			document.title = 'We are on-chain';
		};
	}, []);

	// ローディング状態
	if (isLoading || firestoreLoading) {
		return (
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				<div className="space-y-8">
					<div className="text-center">
						<h1 className="text-4xl font-heading font-bold text-white mb-2">
							Profile
						</h1>
						<p className="text-gray-400">
							Loading your Web3 protein journey...
						</p>
					</div>

					<CyberCard showEffects={false}>
						<div className="flex items-center justify-center py-12">
							<div className="flex items-center space-x-3">
								<div className="w-8 h-8 border-2 border-neonGreen border-t-transparent rounded-full animate-spin"></div>
								<span className="text-white">Loading profile data...</span>
							</div>
						</div>
					</CyberCard>
				</div>
			</div>
		);
	}

	// 未認証の場合のプロンプト
	if (!isAuthenticated) {
		return (
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				<div className="space-y-8">
					<div className="text-center">
						<h1 className="text-4xl font-heading font-bold text-white mb-2">
							Profile
						</h1>
						<p className="text-gray-400">
							Your Web3 protein journey and achievements
						</p>
					</div>

					<CyberCard showEffects={false}>
						<div className="text-center py-12">
							<div className="w-20 h-20 bg-gradient-to-br from-neonGreen/20 to-neonOrange/20 rounded-full flex items-center justify-center mx-auto mb-6">
								<Shield className="w-10 h-10 text-neonGreen" />
							</div>

							<h3 className="text-2xl font-bold text-white mb-4">
								Wallet Connection Required
							</h3>

							<p className="text-gray-400 mb-8 max-w-md mx-auto">
								Please connect your wallet to access your profile, view your order history, and track your achievements in the on-chain protein revolution.
							</p>

							<div className="flex flex-col sm:flex-row gap-4 justify-center">
								<CyberButton
									variant="primary"
									className="flex items-center space-x-2"
									onClick={() => {
										const loginEvent = new CustomEvent('openAuthModal');
										window.dispatchEvent(loginEvent);
									}}
								>
									<Wallet className="w-4 h-4" />
									<span>Connect Wallet</span>
								</CyberButton>

								<CyberButton
									variant="outline"
									onClick={() => window.location.href = '/dashboard'}
									className="flex items-center space-x-2"
								>
									<ArrowLeft className="w-4 h-4" />
									<span>Back to Dashboard</span>
								</CyberButton>
							</div>

							<div className="mt-8 p-4 border border-neonGreen/30 rounded-sm bg-neonGreen/5">
								<h4 className="text-neonGreen font-semibold mb-2">Why Connect?</h4>
								<ul className="text-sm text-gray-300 space-y-1 text-left max-w-xs mx-auto">
									<li>• Track your order history</li>
									<li>• Earn badges and achievements</li>
									<li>• Access exclusive member benefits</li>
									<li>• Join the community leaderboard</li>
								</ul>
							</div>
						</div>
					</CyberCard>
				</div>
			</div>
		);
	}

	// Firestoreユーザーデータが存在しない場合
	if (!firestoreUser) {
		return (
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				<div className="space-y-8">
					<div className="text-center">
						<h1 className="text-4xl font-heading font-bold text-white mb-2">
							Profile
						</h1>
						<p className="text-gray-400">
							Setting up your profile...
						</p>
					</div>

					<CyberCard showEffects={false}>
						<div className="text-center py-12">
							<div className="w-20 h-20 bg-gradient-to-br from-neonOrange/20 to-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
								<AlertCircle className="w-10 h-10 text-neonOrange" />
							</div>

							<h3 className="text-2xl font-bold text-white mb-4">
								Profile Setup in Progress
							</h3>

							<p className="text-gray-400 mb-8 max-w-md mx-auto">
								We're setting up your profile based on your wallet. This usually takes just a moment.
							</p>

							<div className="flex flex-col sm:flex-row gap-4 justify-center">
								<CyberButton
									variant="outline"
									onClick={() => window.location.reload()}
								>
									Refresh Page
								</CyberButton>

								<CyberButton
									variant="outline"
									onClick={() => window.location.href = '/dashboard'}
									className="flex items-center space-x-2"
								>
									<ArrowLeft className="w-4 h-4" />
									<span>Back to Dashboard</span>
								</CyberButton>
							</div>
						</div>
					</CyberCard>
				</div>
			</div>
		);
	}

	// プロフィール完成度を計算
	const profileCompleteness = calculateProfileCompleteness(firestoreUser);
	const formattedStats = formatUserStats(firestoreUser.stats);

	// Wallet専用のユーザー情報
	const userDisplayName = displayName || walletAddress?.slice(0, 6) + '...' + walletAddress?.slice(-4) || 'Anonymous';
	const userInitials = displayName ? displayName[0].toUpperCase() : (walletAddress ? walletAddress[2].toUpperCase() : 'U');

	const handleCopyAddress = () => {
		navigator.clipboard.writeText(walletAddress || firestoreUser.id);
		setCopiedAddress(true);
		setTimeout(() => setCopiedAddress(false), 2000);
	};

	const orderHistory = [
		{
			id: 'order-001',
			date: new Date('2024-05-15'),
			product: 'Pepe Flavor Protein',
			quantity: 1,
			amount: 0.025,
			amountUSD: 89.99,
			status: 'Delivered',
			txHash: '0x789xyz...def456'
		},
		{
			id: 'order-002',
			date: new Date('2024-04-28'),
			product: 'Pepe Flavor Protein',
			quantity: 2,
			amount: 0.05,
			amountUSD: 179.98,
			status: 'Delivered',
			txHash: '0xabc123...789def'
		},
		{
			id: 'order-003',
			date: new Date('2024-04-10'),
			product: 'Pepe Flavor Protein',
			quantity: 1,
			amount: 0.05,
			amountUSD: 189.99,
			status: 'Delivered',
			txHash: '0x456def...123abc'
		}
	];

	const achievements = [
		{ name: 'First Purchase', description: 'Made your first crypto purchase', earned: true },
		{ name: 'Loyal Customer', description: 'Made 5+ purchases', earned: false, progress: firestoreUser.stats.totalOrders },
		{ name: 'Community Champion', description: 'Active in Discord for 30 days', earned: true },
		{ name: 'Whale Status', description: 'Spent over 1 ETH total', earned: false, progress: firestoreUser.stats.totalSpent }
	];

	const getStatusColor = (status: string) => {
		switch (status) {
			case 'Delivered': return 'text-neonGreen';
			case 'Shipped': return 'text-neonOrange';
			case 'Processing': return 'text-yellow-400';
			default: return 'text-gray-400';
		}
	};

	return (
		<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
			<div className="space-y-8">
				{/* Header with Back Button */}
				<div className="flex items-center justify-between">
					<div>
						<div className="flex items-center space-x-4 mb-2">
							<CyberButton
								variant="outline"
								size="sm"
								onClick={() => window.location.href = '/dashboard'}
								className="flex items-center space-x-2"
							>
								<ArrowLeft className="w-4 h-4" />
								<span>Dashboard</span>
							</CyberButton>
							<h1 className="text-4xl font-heading font-bold text-white">
								Profile
							</h1>
						</div>
						<p className="text-gray-400">
							Your Web3 protein journey and achievements
						</p>
					</div>
				</div>

				{/* Profile Completeness Alert */}
				{!profileCompleteness.isComplete && (
					<div className="bg-gradient-to-r from-neonOrange/10 to-yellow-500/10 border border-neonOrange/30 rounded-sm p-4">
						<div className="flex items-start space-x-3">
							<AlertCircle className="w-5 h-5 text-neonOrange mt-0.5" />
							<div className="flex-1">
								<h4 className="text-neonOrange font-semibold mb-1">
									Complete Your Profile ({profileCompleteness.completionPercentage}%)
								</h4>
								<p className="text-sm text-gray-300 mb-3">
									Add missing information to unlock all features and improve your experience.
								</p>
								<div className="w-full bg-dark-300 rounded-full h-2 mb-3">
									<div
										className="bg-gradient-to-r from-neonOrange to-yellow-500 h-2 rounded-full transition-all duration-300"
										style={{ width: `${profileCompleteness.completionPercentage}%` }}
									/>
								</div>
								<div className="flex flex-wrap gap-2 mb-3">
									{profileCompleteness.missingFields.map((field, index) => (
										<span key={index} className="text-xs bg-neonOrange/20 text-neonOrange px-2 py-1 rounded">
											{field}
										</span>
									))}
								</div>
								<CyberButton
									variant="outline"
									size="sm"
									onClick={() => setIsEditModalOpen(true)}
									className="flex items-center space-x-2"
								>
									<Edit className="w-3 h-3" />
									<span>Complete Profile</span>
								</CyberButton>
							</div>
						</div>
					</div>
				)}

				{/* Welcome Message - Wallet Version */}
				<div className="bg-gradient-to-r from-neonGreen/10 to-neonOrange/10 border border-neonGreen/30 rounded-sm p-4">
					<div className="flex items-center justify-between">
						<div className="flex items-center space-x-3">
							<div className="w-10 h-10 bg-gradient-to-br from-neonGreen to-neonOrange rounded-full flex items-center justify-center">
								{profileCompleteness.isComplete ? (
									<CheckCircle className="w-5 h-5 text-black" />
								) : (
									<Wallet className="w-5 h-5 text-black" />
								)}
							</div>
							<div>
								<h3 className="text-white font-semibold">Welcome back, {userDisplayName}!</h3>
								<p className="text-sm text-gray-400">
									Connected via Wallet
									{profileCompleteness.isComplete && <span className="text-neonGreen ml-2">✓ Complete</span>}
								</p>
							</div>
						</div>
						<CyberButton
							variant="outline"
							size="sm"
							onClick={() => setIsEditModalOpen(true)}
							className="flex items-center space-x-2"
						>
							<Edit className="w-3 h-3" />
							<span>Edit</span>
						</CyberButton>
					</div>
				</div>

				{/* Profile Overview */}
				<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
					{/* Main Profile Card */}
					<CyberCard showEffects={false} className="lg:col-span-2">
						<div className="flex items-start space-x-6">
							{/* Avatar */}
							<div className="flex-shrink-0">
								<div className="w-20 h-20 bg-gradient-to-br from-neonGreen to-neonOrange rounded-full flex items-center justify-center">
									<span className="text-2xl font-bold text-black">
										{userInitials}
									</span>
								</div>
							</div>

							{/* Profile Info */}
							<div className="flex-1">
								<div className="flex items-center space-x-3 mb-2">
									<h3 className="text-xl font-bold text-white">{userDisplayName}</h3>
									{firestoreUser.nickname && firestoreUser.nickname !== userDisplayName && (
										<span className="text-sm text-gray-400">({firestoreUser.nickname})</span>
									)}
								</div>

								<div className="flex items-center space-x-2 mb-4">
									<Wallet className="w-4 h-4 text-gray-400" />
									<span className="font-mono text-sm text-gray-300">
										{walletAddress ?
											`${walletAddress.slice(0, 10)}...${walletAddress.slice(-8)}` :
											`User ID: ${firestoreUser.id.slice(0, 8)}...${firestoreUser.id.slice(-4)}`
										}
									</span>
									<button
										onClick={handleCopyAddress}
										className="text-gray-400 hover:text-neonGreen transition-colors"
									>
										{copiedAddress ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
									</button>
								</div>

								<div className="grid grid-cols-2 gap-4">
									<div>
										<div className="text-sm text-gray-400">Member Since</div>
					
									</div>
									<div>
										<div className="text-sm text-gray-400">Community Rank</div>
										<div className="text-neonGreen font-semibold">{formattedStats.rankFormatted}</div>
									</div>
								</div>

								{/* Address Display */}
								{firestoreUser.address && (
									<div className="mt-4 p-3 bg-dark-200/30 rounded-sm">
										<div className="text-sm text-gray-400 mb-1">Shipping Address</div>
										<div className="text-sm text-gray-300">{formatAddress(firestoreUser.address)}</div>
									</div>
								)}
							</div>
						</div>
					</CyberCard>

					{/* Stats Card */}
					<CyberCard title="Stats" showEffects={false}>
						<div className="space-y-4">
							<div className="flex justify-between items-center">
								<span className="text-gray-400">Total Spent</span>
								<div className="text-right">
									<div className="text-neonGreen font-bold">{formattedStats.totalSpentFormatted}</div>
									<div className="text-xs text-gray-500">{formattedStats.totalSpentUSDFormatted}</div>
								</div>
							</div>

							<div className="flex justify-between items-center">
								<span className="text-gray-400">Total Orders</span>
								<span className="text-white font-semibold">{firestoreUser.stats.totalOrders}</span>
							</div>

							<div className="flex justify-between items-center">
								<span className="text-gray-400">Badges Earned</span>
								<span className="text-neonOrange font-semibold">{formattedStats.badgeCount}</span>
							</div>

							<div className="flex justify-between items-center">
								<span className="text-gray-400">Profile Status</span>
								<span className={`font-semibold ${profileCompleteness.isComplete ? 'text-neonGreen' : 'text-neonOrange'}`}>
									{profileCompleteness.isComplete ? 'Complete' : `${profileCompleteness.completionPercentage}%`}
								</span>
							</div>
						</div>
					</CyberCard>
				</div>

				{/* Badges */}
				{/* Badges */}
				<CyberCard title="Badges & Achievements" showEffects={false}>
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
						{firestoreUser.stats.badges.map((badge: string, index: number) => (
							<div key={index} className="flex items-center space-x-3 p-3 border border-neonOrange/30 rounded-sm bg-neonOrange/5">
								<Award className="w-5 h-5 text-neonOrange" />
								<span className="text-white font-medium">{badge}</span>
							</div>
						))}
					</div>
				</CyberCard>

				{/* Achievement Progress */}
				<CyberCard title="Achievement Progress" showEffects={false}>
					<div className="space-y-4">
						{achievements.map((achievement, index) => (
							<div key={index} className="flex items-center justify-between p-4 border border-dark-300 rounded-sm">
								<div className="flex items-center space-x-3">
									<Trophy className={`w-5 h-5 ${achievement.earned ? 'text-neonGreen' : 'text-gray-400'}`} />
									<div>
										<div className="text-white font-medium">{achievement.name}</div>
										<div className="text-sm text-gray-400">{achievement.description}</div>
									</div>
								</div>

								<div className="text-right">
									{achievement.earned ? (
										<span className="text-neonGreen font-semibold">Earned</span>
									) : (
										<div>
											<div className="text-sm text-gray-400">
												Progress: {achievement.progress}/{achievement.name === 'Loyal Customer' ? '5' : '1'}
											</div>
											<div className="w-24 h-2 bg-dark-300 rounded-full overflow-hidden">
												<div
													className="h-full bg-neonOrange transition-all duration-300"
													style={{
														width: `${achievement.name === 'Loyal Customer'
															? (achievement.progress! / 5) * 100
															: (achievement.progress! / 1) * 100}%`
													}}
												/>
											</div>
										</div>
									)}
								</div>
							</div>
						))}
					</div>
				</CyberCard>

				{/* Order History */}
				<CyberCard title="Recent Orders" showEffects={false}>
					<div className="overflow-x-auto">
						<table className="w-full">
							<thead>
								<tr className="border-b border-dark-300">
									<th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Date</th>
									<th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Product</th>
									<th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Amount</th>
									<th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Status</th>
									<th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Actions</th>
								</tr>
							</thead>
							<tbody>
								{orderHistory.map((order) => (
									<tr key={order.id} className="border-b border-dark-300/50 hover:bg-dark-200/30 transition-colors">
										<td className="py-4 px-4 text-sm text-gray-300">{formatDate(order.date)}</td>
										<td className="py-4 px-4">
											<div>
												<div className="text-white font-medium">{order.product}</div>
												<div className="text-xs text-gray-400">Qty: {order.quantity}</div>
											</div>
										</td>
										<td className="py-4 px-4">
											<div>
												<div className="text-neonGreen font-bold">Ξ {order.amount}</div>
												<div className="text-xs text-gray-400">${order.amountUSD}</div>
											</div>
										</td>
										<td className="py-4 px-4">
											<span className={`font-medium ${getStatusColor(order.status)}`}>
												{order.status}
											</span>
										</td>
										<td className="py-4 px-4">
											<CyberButton variant="outline" size="sm" className="flex items-center space-x-1">
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

				{/* Profile Edit Modal */}
				<ProfileEditModal
					isOpen={isEditModalOpen}
					onClose={() => setIsEditModalOpen(false)}
					firestoreUser={firestoreUser}
				/>
			</div>
		</div>
	);
}
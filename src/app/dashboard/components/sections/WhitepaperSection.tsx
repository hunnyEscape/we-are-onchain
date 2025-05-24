// src/app/dashboard/components/sections/WhitepaperSection.tsx
'use client';

import React, { useState } from 'react';
import CyberCard from '../../../components/common/CyberCard';
import CyberButton from '../../../components/common/CyberButton';
import {
	FileText,
	ShoppingCart,
	Shield,
	Zap,
	Users,
	BarChart3,
	Download,
	ExternalLink
} from 'lucide-react';

interface WhitepaperSection {
	id: string;
	title: string;
	icon: React.ReactNode;
	content: React.ReactNode;
	subsections?: string[];
}

const WhitepaperSection: React.FC = () => {
	const [activeSection, setActiveSection] = useState<string>('overview');

	const sections: WhitepaperSection[] = [
		{
			id: 'overview',
			title: 'Overview',
			icon: <FileText className="w-5 h-5" />,
			content: (
				<div className="space-y-6">
					<div>
						<h3 className="text-xl font-bold text-white mb-4">Executive Summary</h3>
						<p className="text-gray-300 leading-relaxed mb-4">
							We are on-chain represents the first Web3-native protein brand, combining premium nutrition
							with blockchain technology to create a transparent, community-driven supplement ecosystem.
						</p>
						<p className="text-gray-300 leading-relaxed">
							Our flagship product, Pepe Flavor Protein, leverages smart contracts for quality assurance,
							decentralized governance for product development, and cryptocurrency payments for seamless
							global distribution.
						</p>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
						<div className="text-center">
							<div className="text-2xl font-bold text-neonGreen">100%</div>
							<div className="text-sm text-gray-400">Blockchain Verified</div>
						</div>
						<div className="text-center">
							<div className="text-2xl font-bold text-neonOrange">247</div>
							<div className="text-sm text-gray-400">Community Members</div>
						</div>
						<div className="text-center">
							<div className="text-2xl font-bold text-neonGreen">25g</div>
							<div className="text-sm text-gray-400">Protein per Serving</div>
						</div>
					</div>
				</div>
			)
		},
		{
			id: 'how-to-buy',
			title: 'How to Buy',
			icon: <ShoppingCart className="w-5 h-5" />,
			content: (
				<div className="space-y-6">
					<div>
						<h3 className="text-xl font-bold text-white mb-4">Purchase Process</h3>
						<div className="space-y-4">
							<div className="flex items-start space-x-4">
								<div className="flex-shrink-0 w-8 h-8 bg-neonGreen rounded-full flex items-center justify-center text-black font-bold">1</div>
								<div>
									<h4 className="font-semibold text-white">Connect Your Wallet</h4>
									<p className="text-gray-400 text-sm">Support for MetaMask, WalletConnect, and major Web3 wallets</p>
								</div>
							</div>

							<div className="flex items-start space-x-4">
								<div className="flex-shrink-0 w-8 h-8 bg-neonOrange rounded-full flex items-center justify-center text-black font-bold">2</div>
								<div>
									<h4 className="font-semibold text-white">Select Payment Method</h4>
									<p className="text-gray-400 text-sm">Pay with ETH, USDC, USDT, or other supported cryptocurrencies</p>
								</div>
							</div>

							<div className="flex items-start space-x-4">
								<div className="flex-shrink-0 w-8 h-8 bg-neonGreen rounded-full flex items-center justify-center text-black font-bold">3</div>
								<div>
									<h4 className="font-semibold text-white">Confirm Transaction</h4>
									<p className="text-gray-400 text-sm">Review order details and approve the smart contract transaction</p>
								</div>
							</div>

							<div className="flex items-start space-x-4">
								<div className="flex-shrink-0 w-8 h-8 bg-neonOrange rounded-full flex items-center justify-center text-black font-bold">4</div>
								<div>
									<h4 className="font-semibold text-white">Receive Your Order</h4>
									<p className="text-gray-400 text-sm">Fast global shipping with blockchain-verified tracking</p>
								</div>
							</div>
						</div>
					</div>

					<CyberCard title="Supported Wallets" showEffects={false}>
						<div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
							<div className="p-4 border border-dark-300 rounded-sm">
								<div className="font-semibold text-white">MetaMask</div>
							</div>
							<div className="p-4 border border-dark-300 rounded-sm">
								<div className="font-semibold text-white">WalletConnect</div>
							</div>
							<div className="p-4 border border-dark-300 rounded-sm">
								<div className="font-semibold text-white">Coinbase Wallet</div>
							</div>
							<div className="p-4 border border-dark-300 rounded-sm">
								<div className="font-semibold text-white">Trust Wallet</div>
							</div>
						</div>
					</CyberCard>
				</div>
			)
		},
		{
			id: 'technology',
			title: 'Technology & Security',
			icon: <Shield className="w-5 h-5" />,
			content: (
				<div className="space-y-6">
					<div>
						<h3 className="text-xl font-bold text-white mb-4">Blockchain Infrastructure</h3>
						<p className="text-gray-300 leading-relaxed mb-4">
							Our platform leverages Ethereum smart contracts to ensure transparent transactions,
							immutable quality records, and decentralized governance.
						</p>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
						<CyberCard title="Smart Contracts" showEffects={false}>
							<ul className="space-y-2 text-sm">
								<li className="flex items-center space-x-2">
									<div className="w-2 h-2 bg-neonGreen rounded-full"></div>
									<span>Automated payment processing</span>
								</li>
								<li className="flex items-center space-x-2">
									<div className="w-2 h-2 bg-neonGreen rounded-full"></div>
									<span>Quality assurance verification</span>
								</li>
								<li className="flex items-center space-x-2">
									<div className="w-2 h-2 bg-neonGreen rounded-full"></div>
									<span>Supply chain tracking</span>
								</li>
							</ul>
						</CyberCard>

						<CyberCard title="Security Features" showEffects={false}>
							<ul className="space-y-2 text-sm">
								<li className="flex items-center space-x-2">
									<div className="w-2 h-2 bg-neonOrange rounded-full"></div>
									<span>Multi-signature wallets</span>
								</li>
								<li className="flex items-center space-x-2">
									<div className="w-2 h-2 bg-neonOrange rounded-full"></div>
									<span>Audited smart contracts</span>
								</li>
								<li className="flex items-center space-x-2">
									<div className="w-2 h-2 bg-neonOrange rounded-full"></div>
									<span>Decentralized storage</span>
								</li>
							</ul>
						</CyberCard>
					</div>
				</div>
			)
		},
		{
			id: 'tokenomics',
			title: 'Tokenomics',
			icon: <BarChart3 className="w-5 h-5" />,
			content: (
				<div className="space-y-6">
					<div>
						<h3 className="text-xl font-bold text-white mb-4">Future Token Economy</h3>
						<p className="text-gray-300 leading-relaxed mb-4">
							Our roadmap includes launching a native governance token that will enable community-driven
							decision making, reward loyal customers, and facilitate decentralized product development.
						</p>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
						<CyberCard title="Governance (40%)" showEffects={false}>
							<div className="text-sm text-gray-300">
								Community voting on product development, flavor innovations, and platform upgrades.
							</div>
						</CyberCard>

						<CyberCard title="Rewards (30%)" showEffects={false}>
							<div className="text-sm text-gray-300">
								Loyalty rewards, purchase bonuses, and staking incentives for active community members.
							</div>
						</CyberCard>

						<CyberCard title="Development (30%)" showEffects={false}>
							<div className="text-sm text-gray-300">
								Platform development, security audits, and ecosystem expansion funding.
							</div>
						</CyberCard>
					</div>
				</div>
			)
		},
		{
			id: 'community',
			title: 'Community & Governance',
			icon: <Users className="w-5 h-5" />,
			content: (
				<div className="space-y-6">
					<div>
						<h3 className="text-xl font-bold text-white mb-4">Decentralized Community</h3>
						<p className="text-gray-300 leading-relaxed mb-4">
							We believe in community-driven innovation. Our governance model empowers token holders
							to participate in key decisions about product development, flavors, and platform features.
						</p>
					</div>

					<div className="space-y-4">
						<CyberCard title="Community Proposals" showEffects={false}>
							<p className="text-sm text-gray-300 mb-3">
								Submit and vote on new flavor ideas, packaging designs, and platform improvements.
							</p>
							<CyberButton variant="outline" size="sm">
								<span>View Active Proposals</span>
								<ExternalLink className="w-3 h-3 ml-1" />
							</CyberButton>
						</CyberCard>

						<CyberCard title="Discord Community" showEffects={false}>
							<p className="text-sm text-gray-300 mb-3">
								Join our active Discord server for real-time discussions, AMAs, and exclusive updates.
							</p>
							<CyberButton variant="outline" size="sm">
								<span>Join Discord</span>
								<ExternalLink className="w-3 h-3 ml-1" />
							</CyberButton>
						</CyberCard>
					</div>
				</div>
			)
		},
		{
			id: 'roadmap',
			title: 'Roadmap',
			icon: <Zap className="w-5 h-5" />,
			content: (
				<div className="space-y-6">
					<div>
						<h3 className="text-xl font-bold text-white mb-4">Development Timeline</h3>
					</div>

					<div className="space-y-6">
						<div className="flex items-start space-x-4">
							<div className="flex-shrink-0 w-12 h-12 bg-neonGreen rounded-full flex items-center justify-center text-black font-bold">Q1</div>
							<div>
								<h4 className="font-semibold text-white mb-2">Platform Launch</h4>
								<ul className="text-sm text-gray-300 space-y-1">
									<li>• Web3 e-commerce platform</li>
									<li>• Pepe Flavor Protein release</li>
									<li>• Community building</li>
								</ul>
							</div>
						</div>

						<div className="flex items-start space-x-4">
							<div className="flex-shrink-0 w-12 h-12 bg-neonOrange rounded-full flex items-center justify-center text-black font-bold">Q2</div>
							<div>
								<h4 className="font-semibold text-white mb-2">Product Expansion</h4>
								<ul className="text-sm text-gray-300 space-y-1">
									<li>• Additional protein flavors</li>
									<li>• Pre-workout supplements</li>
									<li>• Mobile app development</li>
								</ul>
							</div>
						</div>

						<div className="flex items-start space-x-4">
							<div className="flex-shrink-0 w-12 h-12 bg-neonGreen rounded-full flex items-center justify-center text-black font-bold">Q3</div>
							<div>
								<h4 className="font-semibold text-white mb-2">Token Launch</h4>
								<ul className="text-sm text-gray-300 space-y-1">
									<li>• Governance token distribution</li>
									<li>• DAO implementation</li>
									<li>• Staking rewards program</li>
								</ul>
							</div>
						</div>

						<div className="flex items-start space-x-4">
							<div className="flex-shrink-0 w-12 h-12 bg-neonOrange rounded-full flex items-center justify-center text-black font-bold">Q4</div>
							<div>
								<h4 className="font-semibold text-white mb-2">Global Expansion</h4>
								<ul className="text-sm text-gray-300 space-y-1">
									<li>• International shipping</li>
									<li>• Multi-chain support</li>
									<li>• Partnership integrations</li>
								</ul>
							</div>
						</div>
					</div>
				</div>
			)
		}
	];

	const activeContent = sections.find(section => section.id === activeSection);

	return (
		<div className="space-y-8">
			{/* Header */}
			<div className="text-center">
				<h2 className="text-3xl font-heading font-bold text-white mb-2">
					Whitepaper
				</h2>
				<p className="text-gray-400">
					Technical documentation and project overview
				</p>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
				{/* Navigation Sidebar */}
				<div className="lg:col-span-1">
					<CyberCard title="Contents" showEffects={false}>
						<nav className="space-y-2">
							{sections.map((section) => (
								<button
									key={section.id}
									onClick={() => setActiveSection(section.id)}
									className={`
                    w-full flex items-center space-x-3 px-3 py-2 rounded-sm text-left transition-colors
                    ${activeSection === section.id
											? 'bg-neonGreen/10 text-neonGreen border border-neonGreen/30'
											: 'text-gray-300 hover:bg-dark-200 hover:text-white'
										}
                  `}
								>
									{section.icon}
									<span className="text-sm font-medium">{section.title}</span>
								</button>
							))}
						</nav>

						<div className="mt-6 pt-4 border-t border-dark-300">
							<CyberButton variant="outline" size="sm" className="w-full flex items-center justify-center space-x-2">
								<Download className="w-4 h-4" />
								<span>Download PDF</span>
							</CyberButton>
						</div>
					</CyberCard>
				</div>

				{/* Main Content */}
				<div className="lg:col-span-3">
					<CyberCard
						title={activeContent?.title}
						showEffects={false}
						className="min-h-[600px]"
					>
						{activeContent?.content}
					</CyberCard>
				</div>
			</div>
		</div>
	);
};

export default WhitepaperSection;
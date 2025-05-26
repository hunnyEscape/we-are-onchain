// src/app/dashboard/components/sections/HowToBuySection.tsx
'use client';

import React, { useState } from 'react';
import CyberCard from '../../../components/common/CyberCard';
import CyberButton from '../../../components/common/CyberButton';
import {
	ShoppingCart,
	Wallet,
	MapPin,
	AlertTriangle,
	Zap,
	Star,
	Monitor,
	Smartphone
} from 'lucide-react';

interface PaymentChain {
	id: string;
	name: string;
	symbol: string;
	status: 'active' | 'coming-soon';
	recommended?: boolean;
	description: string;
}

interface WalletOption {
	name: string;
	description: string;
	icon: React.ReactNode;
	chains: string[];
	type: 'browser' | 'mobile' | 'both';
	popular?: boolean;
}

const HowToBuySection: React.FC = () => {
	const [activeStep, setActiveStep] = useState(1);
	const [selectedChainType, setSelectedChainType] = useState<'evm' | 'solana' | 'all'>('all');

	const paymentChains: PaymentChain[] = [
		{
			id: 'solana',
			name: 'Solana',
			symbol: '$SOL',
			status: 'active',
			description: 'Ultra-fast with minimal fees'
		},
		{
			id: 'avalanche',
			name: 'Avalanche c-chain',
			symbol: '$AVAX',
			status: 'active',
			recommended: true,
			description: 'Fast and low-cost transactions'
		},
		{
			id: 'ethereum',
			name: 'Ethereum mainnet',
			symbol: '$ETH',
			status: 'active',
			description: 'Most widely supported blockchain'
		},
		{
			id: 'lightning',
			name: 'Lightning',
			symbol: '$BTC',
			status: 'coming-soon',
			description: 'Instant Bitcoin payments'
		},
		{
			id: 'sui',
			name: 'Sui',
			symbol: '$SUI',
			status: 'coming-soon',
			description: 'Next-generation blockchain'
		}
	];

	const walletOptions: WalletOption[] = [
		{
			name: 'MetaMask',
			description: 'Most popular wallet',
			icon: <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center text-white text-xs font-bold">MM</div>,
			chains: ['ethereum', 'avalanche'],
			type: 'both',
			popular: true
		},
		{
			name: 'WalletConnect',
			description: 'Connect mobile wallets',
			icon: <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center text-white text-xs font-bold">WC</div>,
			chains: ['ethereum', 'avalanche'],
			type: 'mobile'
		},
		{
			name: 'Coinbase Wallet',
			description: 'Official Coinbase wallet',
			icon: <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white text-xs font-bold">CB</div>,
			chains: ['ethereum', 'avalanche'],
			type: 'both'
		},
		{
			name: 'Phantom',
			description: 'Leading Solana wallet',
			icon: <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center text-white text-xs font-bold">👻</div>,
			chains: ['solana'],
			type: 'both',
			popular: true
		},
		{
			name: 'Solflare',
			description: 'Solana wallet',
			icon: <div className="w-8 h-8 bg-yellow-500 rounded-lg flex items-center justify-center text-white text-xs font-bold">SF</div>,
			chains: ['solana'],
			type: 'both'
		}
	];

	const getFilteredWallets = () => {
		if (selectedChainType === 'all') return walletOptions;
		if (selectedChainType === 'evm') {
			return walletOptions.filter(wallet =>
				wallet.chains.some(chain => ['ethereum', 'avalanche'].includes(chain))
			);
		}
		if (selectedChainType === 'solana') {
			return walletOptions.filter(wallet => wallet.chains.includes('solana'));
		}
		return walletOptions;
	};

	const activeChains = paymentChains.filter(chain => chain.status === 'active');
	const comingSoonChains = paymentChains.filter(chain => chain.status === 'coming-soon');

	return (
		<div className="space-y-8 w-full">
			{/* Header */}
			<div className="text-center space-y-4">
				<h2 className="text-3xl font-heading font-bold text-white mb-2">
					How to Buy
				</h2>
				<p className="text-gray-400 max-w-xl mx-auto text-lg leading-relaxed">
					<span className="text-purple-400 font-semibold">Solana</span>,
					<span className="text-red-400 font-semibold"> Avalanche c-chain</span> and
					<span className="text-blue-400 font-semibold"> Ethereum mainnet</span> are accepted.
					<span className="text-orange-400 font-semibold"> Lightning</span> and
					<span className="text-sky-300 font-semibold"> Sui</span> are coming soon.
				</p>
			</div>

			{/* Step-by-Step Guide */}
			<CyberCard title="Purchase Process" showEffects={false}>

				<div className="space-y-6">
					<div>
						<h3 className="text-xl font-bold text-white mb-2">
							Step 1 : Add to Cart & Checkout
						</h3>
						<p className="text-gray-300 leading-relaxed">
							No wallet connection or login required at this step
						</p>
					</div>
					<div>
						<h3 className="text-xl font-bold text-white mb-2">
							Step 2 : Connect Wallet, Shipping Address & Pay
						</h3>
						<p className="text-gray-300 leading-relaxed">
							Connect your crypto wallet, enter your shipping address, and complete the payment in one seamless process.
						</p>
					</div>
					<div className="space-y-6">
						<div>
							<h4 className="text-lg font-semibold text-white mb-4">Choose Payment Method</h4>
							<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
								{activeChains.map((chain) => (
									<div key={chain.id} className={`
															p-4 border rounded-lg transition-all duration-200 hover:border-neonGreen/50
														`}>
										<div className="flex items-center space-x-3 mb-3">
											<Wallet className="w-5 h-5 text-gray-400" />
											<div>
												<div className="text-white font-medium">{chain.name}</div>
												<div className="text-sm text-gray-400">{chain.symbol}</div>
											</div>
										</div>
									</div>
								))}
							</div>
						</div>

						{/* Supported Wallets */}
						<div>
							<div className="flex items-center justify-between mb-4">
								<h4 className="text-lg font-semibold text-white">Supported Wallets</h4>
								<div className="flex space-x-2">
									<button
										onClick={() => setSelectedChainType('all')}
										className={`px-3 py-1 rounded text-xs transition-colors ${selectedChainType === 'all'
											? 'bg-neonGreen/20 text-neonGreen border border-neonGreen/50'
											: 'bg-dark-300 text-gray-400 hover:text-white'
											}`}
									>
										All
									</button>
									<button
										onClick={() => setSelectedChainType('evm')}
										className={`px-3 py-1 rounded text-xs transition-colors ${selectedChainType === 'evm'
											? 'bg-neonGreen/20 text-neonGreen border border-neonGreen/50'
											: 'bg-dark-300 text-gray-400 hover:text-white'
											}`}
									>
										EVM
									</button>
									<button
										onClick={() => setSelectedChainType('solana')}
										className={`px-3 py-1 rounded text-xs transition-colors ${selectedChainType === 'solana'
											? 'bg-neonGreen/20 text-neonGreen border border-neonGreen/50'
											: 'bg-dark-300 text-gray-400 hover:text-white'
											}`}
									>
										Solana
									</button>
								</div>
							</div>

							<div className="grid grid-cols-2 md:grid-cols-3 gap-4">
								{getFilteredWallets().map((wallet, index) => (
									<div key={index} className="p-3 border border-dark-300 rounded-lg hover:border-gray-500 transition-colors">
										<div className="flex items-center space-x-3 mb-2">
											{wallet.icon}
											<div className="flex-1 min-w-0">
												<div className="text-white font-medium text-sm flex items-center">
													{wallet.name}
													{wallet.popular && <Star className="w-3 h-3 text-yellow-400 ml-1" />}
												</div>
											</div>
										</div>
										<div className="text-xs text-gray-400 mb-2">{wallet.description}</div>
										<div className="flex items-center space-x-2">
											{wallet.type === 'both' ? (
												<>
													<Monitor className="w-3 h-3 text-gray-500" />
													<Smartphone className="w-3 h-3 text-gray-500" />
												</>
											) : wallet.type === 'mobile' ? (
												<Smartphone className="w-3 h-3 text-gray-500" />
											) : (
												<Monitor className="w-3 h-3 text-gray-500" />
											)}
										</div>
									</div>
								))}
							</div>
						</div>

						{/* Shipping Address Info */}
						<div className="p-4 border border-blue-600/30 rounded-lg bg-blue-600/5">
							<div className="flex items-start space-x-3">
								<MapPin className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
								<div>
									<div className="text-blue-400 font-medium mb-1">Shipping Address</div>
									<div className="text-sm text-gray-300">
										Your wallet address and shipping information will be saved for future purchases. Worldwide delivery available.
									</div>
								</div>
							</div>
						</div>
					</div>

				</div>


			</CyberCard >
		</div >
	);
};

export default HowToBuySection;
// src/app/dashboard/components/sections/HowToBuySection.tsx
'use client';

import React, { useState } from 'react';
import CyberCard from '../../../components/common/CyberCard';
import CyberButton from '../../../components/common/CyberButton';
import {
	User,
	ShoppingCart,
	CreditCard,
	Package,
	Shield,
	CheckCircle,
	AlertTriangle,
	ExternalLink,
	Copy,
	Clock,
	Zap,
	DollarSign,
	Globe,
	Mail,
	Github,
	Twitter,
	MessageCircle,
	QrCode,
	Wallet,
	TrendingUp
} from 'lucide-react';

interface PaymentMethod {
	id: string;
	name: string;
	symbol: string;
	chain: string;
	type: 'stablecoin' | 'native';
	icon: React.ReactNode;
	fees: string;
	speed: string;
	description: string;
}

interface LoginOption {
	name: string;
	description: string;
	icon: React.ReactNode;
	available: boolean;
}

interface WalletOption {
	name: string;
	description: string;
	icon: React.ReactNode;
	supported: boolean;
}

const HowToBuySection: React.FC = () => {
	const [activeStep, setActiveStep] = useState(1);

	const loginOptions: LoginOption[] = [
		{
			name: 'Google',
			description: 'Sign in with your Google account',
			icon: <Globe className="w-6 h-6 text-red-500" />,
			available: true
		},
		{
			name: 'Twitter/X',
			description: 'Sign in with your X account',
			icon: <Twitter className="w-6 h-6 text-blue-400" />,
			available: true
		},
		{
			name: 'Discord',
			description: 'Sign in with your Discord account',
			icon: <MessageCircle className="w-6 h-6 text-indigo-500" />,
			available: true
		},
		{
			name: 'GitHub',
			description: 'Sign in with your GitHub account',
			icon: <Github className="w-6 h-6 text-gray-300" />,
			available: true
		},
		{
			name: 'Email',
			description: 'Traditional email + password',
			icon: <Mail className="w-6 h-6 text-green-500" />,
			available: true
		}
	];

	const paymentMethods: PaymentMethod[] = [
		{
			id: 'eth-mainnet',
			name: 'Ethereum',
			symbol: 'ETH',
			chain: 'Ethereum',
			type: 'native',
			icon: <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">ETH</div>,
			fees: '$5-25',
			speed: '2-5 min',
			description: 'Most popular native token with wide acceptance'
		},
		{
			id: 'usdc-mainnet',
			name: 'USD Coin',
			symbol: 'USDC',
			chain: 'Ethereum',
			type: 'stablecoin',
			icon: <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold">USDC</div>,
			fees: '$5-25',
			speed: '2-5 min',
			description: 'Stable value pegged to USD'
		},
		{
			id: 'usdt-mainnet',
			name: 'Tether',
			symbol: 'USDT',
			chain: 'Ethereum',
			type: 'stablecoin',
			icon: <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-xs font-bold">USDT</div>,
			fees: '$5-25',
			speed: '2-5 min',
			description: 'Popular stablecoin option'
		},
		{
			id: 'matic-polygon',
			name: 'Polygon',
			symbol: 'MATIC',
			chain: 'Polygon',
			type: 'native',
			icon: <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center text-white text-xs font-bold">MATIC</div>,
			fees: '$0.01-0.1',
			speed: '5-30 sec',
			description: 'Low-cost Layer 2 solution'
		},
		{
			id: 'usdc-polygon',
			name: 'USD Coin',
			symbol: 'USDC',
			chain: 'Polygon',
			type: 'stablecoin',
			icon: <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold">USDC</div>,
			fees: '$0.01-0.1',
			speed: '5-30 sec',
			description: 'USDC on Polygon network'
		}
	];

	const walletOptions: WalletOption[] = [
		{
			name: 'MetaMask',
			description: 'Most popular browser wallet',
			icon: <div className="w-8 h-8 bg-orange-500 rounded-sm flex items-center justify-center text-white text-xs font-bold">MM</div>,
			supported: true
		},
		{
			name: 'Trust Wallet',
			description: 'Mobile-first crypto wallet',
			icon: <div className="w-8 h-8 bg-blue-400 rounded-sm flex items-center justify-center text-white text-xs font-bold">TW</div>,
			supported: true
		},
		{
			name: 'Coinbase Wallet',
			description: 'Official Coinbase wallet',
			icon: <div className="w-8 h-8 bg-blue-600 rounded-sm flex items-center justify-center text-white text-xs font-bold">CB</div>,
			supported: true
		},
		{
			name: 'WalletConnect',
			description: 'Connect various mobile wallets',
			icon: <div className="w-8 h-8 bg-blue-500 rounded-sm flex items-center justify-center text-white text-xs font-bold">WC</div>,
			supported: true
		}
	];

	const steps = [
		{
			id: 1,
			title: 'Web2 Account Login',
			description: 'Simple login like traditional websites',
			details: 'Create an account using familiar social login methods. No crypto wallet required for this step. Your account will manage order history and shipping addresses.'
		},
		{
			id: 2,
			title: 'Cart & Checkout',
			description: 'Add products and set preferences',
			details: 'Select products, set shipping address, and choose your preferred cryptocurrency and blockchain network for payment.'
		},
		{
			id: 3,
			title: 'Invoice Payment',
			description: 'Pay using generated invoice URL',
			details: 'Receive an invoice with QR code and payment address. Use any compatible wallet to send the exact amount to complete your purchase.'
		},
		{
			id: 4,
			title: 'Order Completion',
			description: 'Automatic processing and shipping',
			details: 'Transaction reflects in our system within seconds. Shipping process begins immediately after payment confirmation.'
		}
	];

	const handleCopyAddress = (address: string) => {
		navigator.clipboard.writeText(address);
	};

	return (
		<div className="space-y-8">
			{/* Header & Concept */}
			<div className="text-center space-y-4">
				<h2 className="text-3xl font-heading font-bold text-white mb-2">
					How to Buy
				</h2>
				<p className="text-gray-400">
					Your complete guide to purchasing with cryptocurrency
				</p>

				{/* Concept Highlights */}
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
					<div className="p-4 border border-neonGreen/30 rounded-sm bg-neonGreen/5">
						<div className="flex items-center space-x-3 mb-2">
							<TrendingUp className="w-6 h-6 text-neonGreen" />
							<h3 className="text-neonGreen font-semibold">Web2.0 + Web3.0 Hybrid</h3>
						</div>
						<p className="text-sm text-gray-300">
							Combining traditional e-commerce usability with cryptocurrency payments
						</p>
					</div>

					<div className="p-4 border border-neonOrange/30 rounded-sm bg-neonOrange/5">
						<div className="flex items-center space-x-3 mb-2">
							<QrCode className="w-6 h-6 text-neonOrange" />
							<h3 className="text-neonOrange font-semibold">Invoice Method</h3>
						</div>
						<p className="text-sm text-gray-300">
							No wallet connection required, simple payment via QR codes and URLs
						</p>
					</div>
				</div>
			</div>

			{/* Step-by-Step Guide */}
			<CyberCard title="Step-by-Step Purchase Guide" showEffects={false}>
				<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
					{/* Step Navigation */}
					<div className="lg:col-span-1">
						<div className="space-y-2">
							{steps.map((step) => (
								<button
									key={step.id}
									onClick={() => setActiveStep(step.id)}
									className={`
                    w-full text-left p-4 rounded-sm border transition-all duration-200
                    ${activeStep === step.id
											? 'bg-neonGreen/10 border-neonGreen text-neonGreen'
											: 'border-dark-300 text-gray-300 hover:border-gray-500 hover:text-white'
										}
                  `}
								>
									<div className="flex items-center space-x-3">
										<div className={`
                      w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm
                      ${activeStep === step.id ? 'bg-neonGreen text-black' : 'bg-dark-300 text-gray-400'}
                    `}>
											{step.id}
										</div>
										<div>
											<div className="font-medium">{step.title}</div>
											<div className="text-xs opacity-70">{step.description}</div>
										</div>
									</div>
								</button>
							))}
						</div>
					</div>

					{/* Step Content */}
					<div className="lg:col-span-2">
						{steps.map((step) => (
							activeStep === step.id && (
								<div key={step.id} className="space-y-6">
									<div>
										<h3 className="text-xl font-bold text-white mb-2">
											Step {step.id}: {step.title}
										</h3>
										<p className="text-gray-300 leading-relaxed">
											{step.details}
										</p>
									</div>

									{/* Step 1: Login Options */}
									{step.id === 1 && (
										<div className="space-y-4">
											<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
												{loginOptions.map((login, index) => (
													<div key={index} className="p-4 border border-dark-300 rounded-sm flex items-center space-x-3">
														{login.icon}
														<div>
															<div className="text-white font-medium">{login.name}</div>
															<div className="text-xs text-gray-400">{login.description}</div>
														</div>
														{login.available && (
															<CheckCircle className="w-5 h-5 text-neonGreen ml-auto" />
														)}
													</div>
												))}
											</div>

											{/* Placeholder for Login Demo */}
											<div className="p-4 border border-dark-300 rounded-sm bg-dark-200/30">
												<div className="text-center text-gray-400 text-sm">
													📱 Login Screen Demo Area
													<br />
													<span className="text-xs">(Interactive login mockup will be displayed here)</span>
												</div>
											</div>
										</div>
									)}

									{/* Step 2: Checkout Process */}
									{step.id === 2 && (
										<div className="space-y-6">
											{/* Shipping Address */}
											<div>
												<h4 className="text-lg font-semibold text-white mb-3">Shipping Address</h4>
												<div className="p-4 border border-dark-300 rounded-sm bg-dark-200/30">
													<div className="text-sm text-gray-300">
														• Multiple address support<br />
														• Save addresses for future orders<br />
														• International shipping available
													</div>
												</div>
											</div>

											{/* Payment Currency Selection */}
											<div>
												<h4 className="text-lg font-semibold text-white mb-3">Payment Currency Selection</h4>
												<div className="space-y-3">
													{paymentMethods.map((method) => (
														<div key={method.id} className="p-3 border border-dark-300 rounded-sm">
															<div className="flex items-center justify-between">
																<div className="flex items-center space-x-3">
																	{method.icon}
																	<div>
																		<div className="text-white font-medium">
																			{method.name} ({method.symbol})
																			<span className="ml-2 text-xs bg-gray-600 px-2 py-1 rounded">
																				{method.chain}
																			</span>
																		</div>
																		<div className="text-xs text-gray-400">{method.description}</div>
																	</div>
																</div>
																<div className="text-right">
																	<div className="text-sm text-gray-300">Fees: {method.fees}</div>
																	<div className="text-xs text-gray-400">Speed: {method.speed}</div>
																</div>
															</div>
														</div>
													))}
												</div>
											</div>

											{/* Important Notice */}
											<div className="p-4 border border-yellow-600/30 rounded-sm bg-yellow-600/5">
												<div className="flex items-start space-x-3">
													<AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
													<div>
														<div className="text-yellow-400 font-medium mb-1">⚠️ No shipping processing until payment completion</div>
														<div className="text-sm text-gray-300">
															Even after checkout, orders can be cancelled until payment is completed via Invoice URL.
														</div>
													</div>
												</div>
											</div>

											{/* Checkout Demo Area */}
											<div className="p-4 border border-dark-300 rounded-sm bg-dark-200/30">
												<div className="text-center text-gray-400 text-sm">
													🛒 Checkout Process Demo Area
													<br />
													<span className="text-xs">(Interactive checkout flow will be displayed here)</span>
												</div>
											</div>
										</div>
									)}

									{/* Step 3: Invoice Payment */}
									{step.id === 3 && (
										<div className="space-y-6">
											{/* Payment Process */}
											<div>
												<h4 className="text-lg font-semibold text-white mb-3">Payment Verification Steps</h4>
												<div className="space-y-3">
													<div className="flex items-center space-x-3 p-3 border border-dark-300 rounded-sm">
														<div className="w-6 h-6 bg-neonGreen rounded-full flex items-center justify-center text-black font-bold text-sm">1</div>
														<div className="text-gray-300">Amount Verification - Double-check the exact amount</div>
													</div>
													<div className="flex items-center space-x-3 p-3 border border-dark-300 rounded-sm">
														<div className="w-6 h-6 bg-neonGreen rounded-full flex items-center justify-center text-black font-bold text-sm">2</div>
														<div className="text-gray-300">Address Verification - Confirm the recipient address</div>
													</div>
													<div className="flex items-center space-x-3 p-3 border border-dark-300 rounded-sm">
														<div className="w-6 h-6 bg-neonGreen rounded-full flex items-center justify-center text-black font-bold text-sm">3</div>
														<div className="text-gray-300">Chain Verification - Ensure correct network for transaction</div>
													</div>
													<div className="flex items-center space-x-3 p-3 border border-dark-300 rounded-sm">
														<div className="w-6 h-6 bg-neonGreen rounded-full flex items-center justify-center text-black font-bold text-sm">4</div>
														<div className="text-gray-300">Gas Fee Confirmation - Review transaction fees</div>
													</div>
												</div>
											</div>

											{/* Supported Wallets */}
											<div>
												<h4 className="text-lg font-semibold text-white mb-3">Supported Wallets</h4>
												<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
													{walletOptions.map((wallet, index) => (
														<div key={index} className="p-3 border border-dark-300 rounded-sm text-center">
															{wallet.icon}
															<div className="text-white font-medium text-sm mt-2">{wallet.name}</div>
															<div className="text-xs text-gray-400">{wallet.description}</div>
														</div>
													))}
												</div>
											</div>

											{/* QR Code Demo Area */}
											<div className="p-4 border border-dark-300 rounded-sm bg-dark-200/30">
												<div className="text-center text-gray-400 text-sm">
													📱 QR Code & Payment Demo Area
													<br />
													<span className="text-xs">(Interactive payment interface will be displayed here)</span>
												</div>
											</div>
										</div>
									)}

									{/* Step 4: Order Completion */}
									{step.id === 4 && (
										<div className="space-y-6">
											<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
												<div className="p-4 border border-dark-300 rounded-sm">
													<Zap className="w-6 h-6 text-neonOrange mb-2" />
													<div className="text-white font-medium mb-1">System Reflection</div>
													<div className="text-sm text-gray-400">Transaction reflects in our system within seconds to minutes</div>
												</div>
												<div className="p-4 border border-dark-300 rounded-sm">
													<Package className="w-6 h-6 text-neonGreen mb-2" />
													<div className="text-white font-medium mb-1">Immediate Shipping</div>
													<div className="text-sm text-gray-400">Shipping process begins immediately after payment confirmation</div>
												</div>
												<div className="p-4 border border-dark-300 rounded-sm">
													<Clock className="w-6 h-6 text-neonOrange mb-2" />
													<div className="text-white font-medium mb-1">Delivery Time</div>
													<div className="text-sm text-gray-400">3-7 business days worldwide shipping</div>
												</div>
												<div className="p-4 border border-dark-300 rounded-sm">
													<Shield className="w-6 h-6 text-neonGreen mb-2" />
													<div className="text-white font-medium mb-1">Blockchain Tracking</div>
													<div className="text-sm text-gray-400">Blockchain-verified delivery tracking</div>
												</div>
											</div>

											{/* Order Completion Demo Area */}
											<div className="p-4 border border-dark-300 rounded-sm bg-dark-200/30">
												<div className="text-center text-gray-400 text-sm">
													📦 Order Confirmation Demo Area
													<br />
													<span className="text-xs">(Order status and tracking interface will be displayed here)</span>
												</div>
											</div>
										</div>
									)}
								</div>
							)
						))}
					</div>
				</div>
			</CyberCard>

			{/* FAQ Section */}
			<CyberCard title="Frequently Asked Questions" showEffects={false}>
				<div className="space-y-4">
					<div className="border-b border-dark-300 pb-4">
						<h4 className="text-white font-medium mb-2">Do I need a crypto wallet to create an account?</h4>
						<p className="text-sm text-gray-400">
							No! You can create an account using traditional social logins (Google, Twitter, etc.). A crypto wallet is only needed for the final payment step.
						</p>
					</div>

					<div className="border-b border-dark-300 pb-4">
						<h4 className="text-white font-medium mb-2">Can I cancel my order after checkout?</h4>
						<p className="text-sm text-gray-400">
							Yes! Orders can be cancelled until payment is completed via the Invoice URL. No shipping processing occurs until payment confirmation.
						</p>
					</div>

					<div className="border-b border-dark-300 pb-4">
						<h4 className="text-white font-medium mb-2">What happens if I send the wrong amount?</h4>
						<p className="text-sm text-gray-400">
							Our system monitors for exact amounts. Partial payments are held until completion, and overpayments can be refunded to the sender address.
						</p>
					</div>

					<div className="border-b border-dark-300 pb-4">
						<h4 className="text-white font-medium mb-2">Which blockchain should I choose?</h4>
						<p className="text-sm text-gray-400">
							Polygon offers the lowest fees ($0.01-$0.1) and fastest transactions. Ethereum is more expensive but widely supported. Choose based on your wallet and preference.
						</p>
					</div>

					<div>
						<h4 className="text-white font-medium mb-2">What if my transaction fails?</h4>
						<p className="text-sm text-gray-400">
							Failed transactions are automatically detected. You may pay gas fees, but no product charges apply. Simply retry with sufficient balance and gas fees.
						</p>
					</div>
				</div>
			</CyberCard>

			{/* CTA */}
			<div className="text-center">
				<CyberButton variant="primary" className="px-8 py-4 text-lg">
					Start Shopping Now
				</CyberButton>
			</div>
		</div>
	);
};

export default HowToBuySection;
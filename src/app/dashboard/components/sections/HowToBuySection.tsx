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
	TrendingUp,
	ChevronDown,
	ChevronUp
} from 'lucide-react';

interface PaymentMethod {
	id: string;
	symbol: string;
	chain: string;
}

interface WalletOption {
	name: string;
	description: string;
	icon: React.ReactNode;
	supported: boolean;
}

const HowToBuySection: React.FC = () => {
	const [activeStep, setActiveStep] = useState(1);
	const [isPaymentTableOpen, setIsPaymentTableOpen] = useState(false);

	const paymentMethods: PaymentMethod[] = [
		{
			id: 'solana',
			symbol: '$SOL, $USDT',
			chain: 'Solana'
		},
		{
			id: 'lightning',
			symbol: '$BTC',
			chain: 'Lightning'
		},
		{
			id: 'avalanche',
			symbol: '$AVAX, $USDC, $USDT',
			chain: 'Avalanche'
		},
		{
			id: 'sui',
			symbol: '$SUI',
			chain: 'SUI'
		},
		{
			id: 'eth',
			symbol: '$ETH, $USDC, $USDT',
			chain: 'ETH'
		},
		{
			id: 'arbitrum',
			symbol: '$ETH, $USDT',
			chain: 'Arbitrum'
		},
		{
			id: 'optimism',
			symbol: '$ETH, $USDT',
			chain: 'Optimism'
		},
		{
			id: 'bnb',
			symbol: '$BNB',
			chain: 'BNB'
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
			title: 'Cart & Checkout',
			description: 'Add products and set preferences',
			details:`When you checkout. (1) Selact your payment currency. (2) Set shipping address. International shipping available.`
		},
		{
			id: 2,
			title: 'Invoice Payment',
			description: 'Pay using generated invoice URL',
			details: 'Receive an invoice with QR code and payment address. Use any compatible wallet to send the exact amount to complete your purchase.'
		},
		{
			id: 3,
			title: 'Order Completion',
			description: 'Automatic processing and shipping',
			details: 'Transaction reflects in our system within seconds. Shipping process begins immediately after payment confirmation.'
		}
	];

	const handleCopyAddress = (address: string) => {
		navigator.clipboard.writeText(address);
	};

	const availableMethods = paymentMethods;

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
							Combining web2.0 usability with cryptocurrency payments
						</p>
					</div>

					<div className="p-4 border border-neonOrange/30 rounded-sm bg-neonOrange/5">
						<div className="flex items-center space-x-3 mb-2">
							<QrCode className="w-6 h-6 text-neonOrange" />
							<h3 className="text-neonOrange font-semibold">Invoice Method</h3>
						</div>
						<p className="text-sm text-gray-300">
							No wallet connection required, simple payment via QR codes and URLs with your wallet
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

									{/* Step 1: Checkout Process */}
									{step.id === 1 && (
										<div className="space-y-6">
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

											{/* Payment Currency Selection - Collapsible Table */}
											<div className="border border-dark-300 rounded-sm">
												<button
													onClick={() => setIsPaymentTableOpen(!isPaymentTableOpen)}
													className="w-full p-4 flex items-center justify-between bg-dark-200/30 hover:bg-dark-200/50 transition-colors"
												>
													<h4 className="text-lg font-semibold text-white">Payment Currency Selection</h4>
													{isPaymentTableOpen ? (
														<ChevronUp className="w-5 h-5 text-gray-400" />
													) : (
														<ChevronDown className="w-5 h-5 text-gray-400" />
													)}
												</button>

												{isPaymentTableOpen && (
													<div className="p-4 border-t border-dark-300">
														<div className="overflow-x-auto">
															<table className="w-full">
																<thead>
																	<tr className="border-b border-dark-300">
																		<th className="text-left p-3 text-gray-300 font-medium">Method</th>
																		<th className="text-left p-3 text-gray-300 font-medium">Currency</th>
																	</tr>
																</thead>
																<tbody>
																	{paymentMethods.map((method) => (
																		<tr key={method.id} className="border-b border-dark-300/50 hover:bg-dark-200/20">
																			<td className="p-3">
																				<span className="text-sm bg-gray-600 px-2 py-1 rounded text-gray-200">
																					{method.chain}
																				</span>
																			</td>
																			<td className="p-3 text-white font-medium">
																				{method.symbol}
																			</td>
																		</tr>
																	))}
																</tbody>
															</table>
														</div>
													</div>
												)}
											</div>
										</div>
									)}

									{/* Step 2: Invoice Payment */}
									{step.id === 2 && (
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

									{/* Step 3: Order Completion */}
									{step.id === 3 && (
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
		</div>
	);
};

export default HowToBuySection;
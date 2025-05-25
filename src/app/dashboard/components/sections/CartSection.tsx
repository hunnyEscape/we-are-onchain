// src/app/dashboard/components/sections/CartSection.tsx
'use client';

import React, { useState } from 'react';
import CyberCard from '../../../components/common/CyberCard';
import CyberButton from '../../../components/common/CyberButton';
import { useCart, usePanel } from '../../context/DashboardContext';
import { useAuth } from '@/contexts/AuthContext';
import { usePriceConverter } from '@/hooks/usePriceConverter';
import { PAYMENT_METHODS, PaymentMethodKey } from '../../../../../types/dashboard';
import {
	ShoppingCart,
	Trash2,
	Plus,
	Minus,
	Zap,
	AlertCircle,
	Clock,
	Package,
	RefreshCw,
	TrendingUp,
	TrendingDown
} from 'lucide-react';

const Info = ({ className = "w-4 h-4" }: { className?: string }) => (
	<svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
		<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
	</svg>
);

const CartSection: React.FC = () => {
	const {
		cartItems,
		removeFromCart,
		updateQuantity,
		clearCart,
		getCartTotal,
		getCartItemCount,
		getCartItemsWithDetails
	} = useCart();

	const { openPanel } = usePanel();
	const { user } = useAuth();

	// 暗号通貨価格変換フック
	const {
		convertUSDTo,
		formatCryptoPrice,
		formatUSDPrice,
		isLoading: pricesLoading,
		error: pricesError,
		lastUpdated,
		exchangeRates
	} = usePriceConverter();

	const [promoCode, setPromoCode] = useState('');
	const [appliedPromo, setAppliedPromo] = useState<string | null>(null);
	const [gasFeeEstimate] = useState(0.003); // ETH equivalent in USD
	const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethodKey | null>(null);
	const [showPromoError, setShowPromoError] = useState(false);

	// カートアイテムの詳細情報を取得
	const cartItemsWithDetails = getCartItemsWithDetails();

	const updateItemQuantity = (id: string, newQuantity: number) => {
		if (newQuantity <= 0) {
			removeFromCart(id);
			return;
		}

		// ローカルでの基本的な数量制限（1-10個）
		const validQuantity = Math.max(1, Math.min(newQuantity, 10));
		updateQuantity(id, validQuantity);
	};

	const handleRemoveItem = (id: string) => {
		removeFromCart(id);
	};

	const applyPromoCode = () => {
		const validPromoCodes = ['pepe10', 'blockchain15', 'web3save'];

		if (validPromoCodes.includes(promoCode.toLowerCase())) {
			setAppliedPromo(promoCode.toUpperCase());
			setPromoCode('');
			setShowPromoError(false);
		} else {
			setShowPromoError(true);
			setTimeout(() => setShowPromoError(false), 3000);
		}
	};

	const removePromoCode = () => {
		setAppliedPromo(null);
	};

	const calculateSubtotal = () => {
		return getCartTotal();
	};

	const calculateDiscount = () => {
		const subtotal = calculateSubtotal();
		switch (appliedPromo) {
			case 'PEPE10':
				return subtotal * 0.1; // 10% discount
			case 'BLOCKCHAIN15':
				return subtotal * 0.15; // 15% discount
			case 'WEB3SAVE':
				return Math.min(subtotal * 0.05, 5); // 5% discount, max $5
			default:
				return 0;
		}
	};

	const calculateTotal = () => {
		return calculateSubtotal() - calculateDiscount() + gasFeeEstimate;
	};

	const handleCheckout = () => {
		try {
			if (!user) {
				// ログインが必要
				window.dispatchEvent(new CustomEvent('openAuthModal'));
				return;
			}

			// TODO: チェックアウト処理を実装
			console.log('Checkout initiated', {
				cartItems,
				total: calculateTotal(),
				paymentMethod: selectedPaymentMethod,
				appliedPromo,
				user: user.uid
			});

			// 仮の処理完了メッセージ
			const totalUSD = calculateTotal();
			const totalCrypto = convertUSDTo(totalUSD, selectedPaymentMethod);
			const formattedCrypto = formatCryptoPrice(totalCrypto, selectedPaymentMethod);

			alert(`Checkout initiated for ${formatUSDPrice(totalUSD)} (${formattedCrypto})`);
		} catch (error) {
			console.error('Checkout error:', error);
		}
	};

	const handleContinueShopping = () => {
		openPanel('shop');
	};

	const handleClearCart = () => {
		clearCart();
	};

	const getDiscountText = (promoCode: string) => {
		switch (promoCode) {
			case 'PEPE10':
				return '10% off';
			case 'BLOCKCHAIN15':
				return '15% off';
			case 'WEB3SAVE':
				return '5% off (max $5)';
			default:
				return '';
		}
	};

	// 価格表示コンポーネント
	const PriceDisplay = ({
		usdAmount,
		showCrypto = true,
		size = 'md'
	}: {
		usdAmount: number;
		showCrypto?: boolean;
		size?: 'sm' | 'md' | 'lg'
	}) => {
		const cryptoAmount = convertUSDTo(usdAmount, selectedPaymentMethod);
		const isLoading = pricesLoading;
		const hasError = pricesError !== null;

		const sizeClasses = {
			sm: 'text-sm',
			md: 'text-base',
			lg: 'text-lg font-bold'
		};

		return (
			<div className={`${sizeClasses[size]}`}>
				<div className="text-white font-semibold">
					{formatUSDPrice(usdAmount)}
				</div>
				{showCrypto && (
					<div className={`text-xs ${hasError ? 'text-red-400' : 'text-gray-400'} flex items-center space-x-1`}>
						{isLoading ? (
							<>
								<RefreshCw className="w-3 h-3 animate-spin" />
								<span>Loading...</span>
							</>
						) : hasError ? (
							<span>Price unavailable</span>
						) : (
							<span>≈ {formatCryptoPrice(cryptoAmount, selectedPaymentMethod)}</span>
						)}
					</div>
				)}
			</div>
		);
	};

	// 24時間変動表示コンポーネント
	const PriceChangeIndicator = ({ currency }: { currency: string }) => {
		const rate = exchangeRates[currency];
		if (!rate) return null;

		// ここでは仮の変動率を表示（実際のデータは価格フックから取得可能）
		const change = 2.34; // 実際の実装では価格データから取得
		const isPositive = change >= 0;

		return (
			<div className={`flex items-center space-x-1 text-xs ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
				{isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
				<span>{isPositive ? '+' : ''}{change.toFixed(2)}%</span>
			</div>
		);
	};

	if (cartItems.length === 0) {
		return (
			<div className="space-y-8">
				<div className="text-center">
					<h2 className="text-3xl font-heading font-bold text-white mb-2">Shopping Cart</h2>
					<p className="text-gray-400">Your cart is currently empty</p>
				</div>

				<CyberCard showEffects={false} className="text-center py-12">
					<ShoppingCart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
					<h3 className="text-xl font-semibold text-white mb-2">Your cart is empty</h3>
					<p className="text-gray-400 mb-6">Add some premium protein to get started</p>
					<CyberButton variant="primary" onClick={handleContinueShopping}>
						Start Shopping
					</CyberButton>
				</CyberCard>
			</div>
		);
	}

	return (
		<div className="space-y-8">
			{/* Header */}
			<div className="text-center">
				<h2 className="text-3xl font-heading font-bold text-white mb-2">
					Shopping Cart
				</h2>
				<p className="text-gray-400">
					Review your items and proceed to checkout
				</p>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
				{/* Cart Items */}
				<div className="lg:col-span-2 space-y-4">
					<CyberCard title={`Cart Items (${getCartItemCount()})`} showEffects={false}>
						<div className="space-y-4">
							{cartItemsWithDetails.map((item) => (
								<div key={item.id} className="flex items-center space-x-4 p-4 border border-dark-300 rounded-sm">
									{/* Product Image */}
									<div className="w-16 h-16 bg-gradient-to-br from-neonGreen to-neonOrange rounded-sm flex items-center justify-center">
										<Package className="w-8 h-8 text-black" />
									</div>

									{/* Product Info */}
									<div className="flex-1">
										<h3 className="text-white font-semibold">{item.name}</h3>
										<p className="text-sm text-gray-400">Premium whey protein blend</p>
										<PriceDisplay usdAmount={item.price} showCrypto={true} size="sm" />

										{/* Item Info */}
										<div className="flex items-center space-x-2 mt-1">
											{item.timeLeft && (
												<div className="flex items-center space-x-1">
													<Clock className="w-3 h-3 text-yellow-400" />
													<span className="text-xs text-yellow-400">{item.timeLeft}</span>
												</div>
											)}
										</div>
									</div>

									{/* Quantity Controls */}
									<div className="flex items-center space-x-2">
										<button
											onClick={() => updateItemQuantity(item.id, item.quantity - 1)}
											className="w-8 h-8 border border-dark-300 rounded-sm flex items-center justify-center text-white hover:bg-dark-200 transition-colors"
										>
											<Minus className="w-4 h-4" />
										</button>
										<span className="w-12 text-center text-white font-medium">{item.quantity}</span>
										<button
											onClick={() => updateItemQuantity(item.id, item.quantity + 1)}
											className="w-8 h-8 border border-dark-300 rounded-sm flex items-center justify-center text-white hover:bg-dark-200 transition-colors"
										>
											<Plus className="w-4 h-4" />
										</button>
									</div>

									{/* Item Total */}
									<div className="text-right">
										<PriceDisplay usdAmount={item.price * item.quantity} showCrypto={true} size="md" />
										<div className="text-xs text-gray-400">
											{item.quantity} × {formatUSDPrice(item.price)}
										</div>
									</div>

									{/* Remove Button */}
									<button
										onClick={() => handleRemoveItem(item.id)}
										className="p-2 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-sm transition-colors"
										title="Remove from cart"
									>
										<Trash2 className="w-4 h-4" />
									</button>
								</div>
							))}
						</div>
					</CyberCard>
				</div>

				{/* Order Summary */}
				<div className="lg:col-span-1">
					<CyberCard title="Order Summary" showEffects={false}>
						<div className="space-y-4">
							{/* 価格データの状態表示 */}
							{pricesError && (
								<div className="p-3 border border-red-600/30 rounded-sm bg-red-600/5">
									<div className="flex items-center space-x-2">
										<AlertCircle className="w-4 h-4 text-red-400" />
										<span className="text-xs text-red-400">Price data unavailable</span>
									</div>
								</div>
							)}

							{/* Authentication Notice */}
							{!user && (
								<div className="p-3 border border-yellow-600/30 rounded-sm bg-yellow-600/5">
									<div className="flex items-center space-x-2">
										<AlertCircle className="w-4 h-4 text-yellow-400" />
										<span className="text-xs text-yellow-400">Login required for checkout</span>
									</div>
								</div>
							)}

							<div>
								<label className="block text-sm font-medium text-white mb-2">Payment Method</label>
								<div className="space-y-2">
									{(Object.keys(PAYMENT_METHODS) as PaymentMethodKey[]).map((methodKey) => {
										const method = PAYMENT_METHODS[methodKey];
										return (
											<label key={methodKey} className="flex items-center justify-between p-2 border border-dark-300 rounded-sm hover:bg-dark-200/50 cursor-pointer transition-colors">
												<div className="flex items-center space-x-2">
													<input
														type="radio"
														name="paymentMethod"
														value={methodKey}
														checked={selectedPaymentMethod === methodKey}
														onChange={(e) => setSelectedPaymentMethod(e.target.value as PaymentMethodKey)}
														className="text-neonGreen focus:ring-neonGreen"
													/>
													<span className="text-white">{method.name}</span>
												</div>
											</label>
										);
									})}
								</div>
								{lastUpdated && (
									<div className="text-xs text-gray-400 mt-2 flex items-center space-x-1">
										<RefreshCw className="w-3 h-3" />
										<span>Updated {new Date(lastUpdated).toLocaleTimeString()}</span>
									</div>
								)}
							</div>

							{/* Price Breakdown */}
							<div className="space-y-3 pt-4">
								{appliedPromo && (
									<div className="flex justify-between">
										<span className="text-gray-400">Discount ({appliedPromo})</span>
										<PriceDisplay usdAmount={-calculateDiscount()} showCrypto={true} size="sm" />
									</div>
								)}


								<div className="flex justify-between pt-3 border-t border-dark-300">
									<span className="text-white font-semibold">Total</span>
									<PriceDisplay usdAmount={calculateTotal()} showCrypto={true} size="lg" />
								</div>
							</div>

							{/* Action Buttons */}
							<div className="space-y-3 pt-4">
								<CyberButton
									variant="primary"
									className="w-full flex items-center justify-center space-x-2"
									onClick={handleCheckout}
									disabled={pricesLoading && !pricesError || !selectedPaymentMethod}
								>
									<span>
										{!selectedPaymentMethod ? 'Select payment method...' : 'Proceed to checkout'}
									</span>
								</CyberButton>
							</div>
						</div>
					</CyberCard>
				</div>
			</div>
		</div>
	);
};

export default CartSection;
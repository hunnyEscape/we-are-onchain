// src/app/dashboard/components/sections/CartSection.tsx
'use client';

import React, { useState } from 'react';
import CyberCard from '../../../components/common/CyberCard';
import CyberButton from '../../../components/common/CyberButton';
import { CartItem } from '../../../../../types/dashboard';
import {
	ShoppingCart,
	Trash2,
	Plus,
	Minus,
	Zap,
	CreditCard,
	AlertCircle,
	Gift,
	Percent,
	Fuel,
	Info
} from 'lucide-react';

const CartSection: React.FC = () => {
	const [cartItems, setCartItems] = useState<CartItem[]>([
		{
			id: 'pepe-protein-1',
			name: 'Pepe Flavor Protein',
			price: 0.025,
			quantity: 2,
			currency: 'ETH',
			image: '/images/pepe-protein.webp'
		}
	]);

	const [promoCode, setPromoCode] = useState('');
	const [appliedPromo, setAppliedPromo] = useState<string | null>(null);
	const [gasFeeEstimate] = useState(0.003); // ETH
	const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'ETH' | 'USDC' | 'USDT'>('ETH');

	const updateQuantity = (id: string, newQuantity: number) => {
		if (newQuantity <= 0) {
			removeItem(id);
			return;
		}
		setCartItems(prev =>
			prev.map(item =>
				item.id === id ? { ...item, quantity: Math.min(newQuantity, 10) } : item
			)
		);
	};

	const removeItem = (id: string) => {
		setCartItems(prev => prev.filter(item => item.id !== id));
	};

	const applyPromoCode = () => {
		if (promoCode.toLowerCase() === 'pepe10') {
			setAppliedPromo('PEPE10');
			setPromoCode('');
		} else {
			// Handle invalid promo code
			console.log('Invalid promo code');
		}
	};

	const removePromoCode = () => {
		setAppliedPromo(null);
	};

	const calculateSubtotal = () => {
		return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
	};

	const calculateDiscount = () => {
		if (appliedPromo === 'PEPE10') {
			return calculateSubtotal() * 0.1; // 10% discount
		}
		return 0;
	};

	const calculateTotal = () => {
		return calculateSubtotal() - calculateDiscount() + gasFeeEstimate;
	};

	const formatPrice = (price: number, currency: string = 'ETH') => {
		if (currency === 'ETH') {
			return `Ξ ${price.toFixed(4)}`;
		}
		return `${price.toFixed(2)} ${currency}`;
	};

	const convertToUSD = (ethAmount: number) => {
		const ethToUSD = 3359.50; // Mock exchange rate
		return (ethAmount * ethToUSD).toFixed(2);
	};

	const handleCheckout = () => {
		// Checkout logic (Phase 4で実装)
		console.log('Checkout initiated', { cartItems, total: calculateTotal(), paymentMethod: selectedPaymentMethod });
	};

	const handleContinueShopping = () => {
		// Navigate back to shop (Phase 4で実装)
		console.log('Continue shopping');
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
					<CyberCard title={`Cart Items (${cartItems.length})`} showEffects={false}>
						<div className="space-y-4">
							{cartItems.map((item) => (
								<div key={item.id} className="flex items-center space-x-4 p-4 border border-dark-300 rounded-sm">
									{/* Product Image */}
									<div className="w-16 h-16 bg-gradient-to-br from-neonGreen to-neonOrange rounded-sm flex items-center justify-center">
										<ShoppingCart className="w-8 h-8 text-black" />
									</div>

									{/* Product Info */}
									<div className="flex-1">
										<h3 className="text-white font-semibold">{item.name}</h3>
										<p className="text-sm text-gray-400">Premium whey protein blend</p>
										<div className="text-neonGreen font-bold">
											{formatPrice(item.price, item.currency)}
											<span className="text-xs text-gray-400 ml-2">
												(≈ ${convertToUSD(item.price)})
											</span>
										</div>
									</div>

									{/* Quantity Controls */}
									<div className="flex items-center space-x-2">
										<button
											onClick={() => updateQuantity(item.id, item.quantity - 1)}
											className="w-8 h-8 border border-dark-300 rounded-sm flex items-center justify-center text-white hover:bg-dark-200 transition-colors"
										>
											<Minus className="w-4 h-4" />
										</button>
										<span className="w-12 text-center text-white font-medium">{item.quantity}</span>
										<button
											onClick={() => updateQuantity(item.id, item.quantity + 1)}
											className="w-8 h-8 border border-dark-300 rounded-sm flex items-center justify-center text-white hover:bg-dark-200 transition-colors"
										>
											<Plus className="w-4 h-4" />
										</button>
									</div>

									{/* Item Total */}
									<div className="text-right">
										<div className="text-white font-bold">
											{formatPrice(item.price * item.quantity, item.currency)}
										</div>
										<div className="text-xs text-gray-400">
											≈ ${convertToUSD(item.price * item.quantity)}
										</div>
									</div>

									{/* Remove Button */}
									<button
										onClick={() => removeItem(item.id)}
										className="p-2 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-sm transition-colors"
									>
										<Trash2 className="w-4 h-4" />
									</button>
								</div>
							))}
						</div>
					</CyberCard>

					{/* Promo Code */}
					<CyberCard title="Promo Code" showEffects={false}>
						<div className="space-y-4">
							{appliedPromo ? (
								<div className="flex items-center justify-between p-3 border border-neonGreen/30 rounded-sm bg-neonGreen/5">
									<div className="flex items-center space-x-2">
										<Gift className="w-5 h-5 text-neonGreen" />
										<span className="text-white font-medium">{appliedPromo} Applied</span>
										<span className="text-sm text-neonGreen">10% off</span>
									</div>
									<button
										onClick={removePromoCode}
										className="text-red-400 hover:text-red-300 transition-colors"
									>
										<Trash2 className="w-4 h-4" />
									</button>
								</div>
							) : (
								<div className="flex space-x-2">
									<input
										type="text"
										value={promoCode}
										onChange={(e) => setPromoCode(e.target.value)}
										placeholder="Enter promo code"
										className="flex-1 px-3 py-2 bg-dark-200 border border-dark-300 rounded-sm text-white placeholder-gray-400 focus:border-neonGreen focus:outline-none"
									/>
									<CyberButton variant="outline" onClick={applyPromoCode}>
										Apply
									</CyberButton>
								</div>
							)}
						</div>
					</CyberCard>
				</div>

				{/* Order Summary */}
				<div className="lg:col-span-1">
					<CyberCard title="Order Summary" showEffects={false}>
						<div className="space-y-4">
							{/* Payment Method Selection */}
							<div>
								<label className="block text-sm font-medium text-white mb-2">Payment Method</label>
								<div className="space-y-2">
									{(['ETH', 'USDC', 'USDT'] as const).map((method) => (
										<label key={method} className="flex items-center space-x-2 cursor-pointer">
											<input
												type="radio"
												name="paymentMethod"
												value={method}
												checked={selectedPaymentMethod === method}
												onChange={(e) => setSelectedPaymentMethod(e.target.value as any)}
												className="text-neonGreen"
											/>
											<span className="text-white">{method}</span>
										</label>
									))}
								</div>
							</div>

							{/* Price Breakdown */}
							<div className="space-y-3 pt-4 border-t border-dark-300">
								<div className="flex justify-between">
									<span className="text-gray-400">Subtotal</span>
									<span className="text-white">{formatPrice(calculateSubtotal())}</span>
								</div>

								{appliedPromo && (
									<div className="flex justify-between">
										<span className="text-gray-400">Discount ({appliedPromo})</span>
										<span className="text-neonGreen">-{formatPrice(calculateDiscount())}</span>
									</div>
								)}

								<div className="flex justify-between">
									<div className="flex items-center space-x-1">
										<span className="text-gray-400">Gas Fee</span>
										<Info className="w-3 h-3 text-gray-400" />
									</div>
									<span className="text-gray-400">{formatPrice(gasFeeEstimate)}</span>
								</div>

								<div className="flex justify-between pt-3 border-t border-dark-300">
									<span className="text-white font-semibold">Total</span>
									<div className="text-right">
										<div className="text-neonGreen font-bold text-lg">
											{formatPrice(calculateTotal())}
										</div>
										<div className="text-xs text-gray-400">
											≈ ${convertToUSD(calculateTotal())}
										</div>
									</div>
								</div>
							</div>

							{/* Action Buttons */}
							<div className="space-y-3 pt-4">
								<CyberButton
									variant="primary"
									className="w-full flex items-center justify-center space-x-2"
									onClick={handleCheckout}
								>
									<Zap className="w-4 h-4" />
									<span>Checkout with {selectedPaymentMethod}</span>
								</CyberButton>

								<CyberButton
									variant="outline"
									className="w-full"
									onClick={handleContinueShopping}
								>
									Continue Shopping
								</CyberButton>
							</div>

							{/* Security Notice */}
							<div className="flex items-start space-x-2 p-3 border border-yellow-600/30 rounded-sm bg-yellow-600/5">
								<AlertCircle className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
								<div className="text-xs text-gray-300">
									All transactions are secured by smart contracts. Always verify the recipient address before confirming.
								</div>
							</div>
						</div>
					</CyberCard>
				</div>
			</div>
		</div>
	);
};

export default CartSection;
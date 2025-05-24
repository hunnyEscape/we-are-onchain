// src/app/dashboard/components/sections/CartSection.tsx
'use client';

import React, { useState, useEffect } from 'react';
import CyberCard from '../../../components/common/CyberCard';
import CyberButton from '../../../components/common/CyberButton';
import { useCart, usePanel } from '../../context/DashboardContext';
import { useAuth } from '@/contexts/AuthContext';
import {
	ShoppingCart,
	Trash2,
	Plus,
	Minus,
	Zap,
	AlertCircle,
	Gift,
	Clock,
	Package,
	Loader2,
	Shield
} from 'lucide-react';
import {
	checkStockAvailability,
	cancelReservation,
	confirmReservations
} from '@/lib/firestore/inventory';

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
		getItemTimeLeft,
		getCartItemsWithReservations,
		getSessionId,
		isFirestoreSynced
	} = useCart();

	const { openPanel } = usePanel();
	const { user } = useAuth();

	const [promoCode, setPromoCode] = useState('');
	const [appliedPromo, setAppliedPromo] = useState<string | null>(null);
	const [gasFeeEstimate] = useState(0.003); // ETH
	const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'ETH' | 'USDC' | 'USDT'>('ETH');
	const [showPromoError, setShowPromoError] = useState(false);
	const [isUpdating, setIsUpdating] = useState<{ [itemId: string]: boolean }>({});
	const [stockWarnings, setStockWarnings] = useState<{ [itemId: string]: string }>({});

	// カートアイテムの詳細情報を取得
	const cartItemsWithDetails = getCartItemsWithReservations();

	const updateItemQuantity = async (id: string, newQuantity: number) => {
		setIsUpdating(prev => ({ ...prev, [id]: true }));

		try {
			if (newQuantity <= 0) {
				await handleRemoveItem(id);
				return;
			}

			// Firestore在庫チェック
			const stockCheck = await checkStockAvailability(
				id,
				newQuantity,
				user?.uid,
				getSessionId()
			);

			if (!stockCheck.canReserve) {
				let warningMessage = 'Cannot update quantity';
				if (stockCheck.limitReasons.exceedsStock) {
					warningMessage = `Only ${stockCheck.maxCanReserve} items available`;
				} else if (stockCheck.limitReasons.exceedsOrderLimit) {
					warningMessage = 'Exceeds order limit';
				}

				setStockWarnings(prev => ({ ...prev, [id]: warningMessage }));
				setTimeout(() => {
					setStockWarnings(prev => ({ ...prev, [id]: '' }));
				}, 3000);
				return;
			}

			// ローカル更新
			updateQuantity(id, newQuantity, stockCheck.availableStock);

		} catch (error) {
			console.error('Error updating quantity:', error);
			setStockWarnings(prev => ({ ...prev, [id]: 'Update failed' }));
			setTimeout(() => {
				setStockWarnings(prev => ({ ...prev, [id]: '' }));
			}, 3000);
		} finally {
			setIsUpdating(prev => ({ ...prev, [id]: false }));
		}
	};

	const handleRemoveItem = async (id: string) => {
		setIsUpdating(prev => ({ ...prev, [id]: true }));

		try {
			// Firestore予約をキャンセル
			await cancelReservation(id, user?.uid, getSessionId());

			// ローカルカートから削除
			removeFromCart(id);

		} catch (error) {
			console.error('Error removing item:', error);
		} finally {
			setIsUpdating(prev => ({ ...prev, [id]: false }));
		}
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

	const formatPrice = (price: number, currency: string = 'USD') => {
		if (currency === 'ETH') {
			return `Ξ ${price.toFixed(4)}`;
		}
		return `$${price.toFixed(2)} ${currency}`;
	};

	const convertToUSD = (amount: number) => {
		const ethToUSD = 3359.50; // Mock exchange rate
		return (amount * ethToUSD).toFixed(2);
	};

	const handleCheckout = async () => {
		try {
			if (!user) {
				// ログインが必要
				window.dispatchEvent(new CustomEvent('openAuthModal'));
				return;
			}

			// 予約を確定
			const reservationIds = cartItemsWithDetails
				.map(item => item.reservationId)
				.filter(Boolean) as string[];

			if (reservationIds.length > 0) {
				const confirmResult = await confirmReservations(reservationIds);

				if (!confirmResult.success || confirmResult.errors.length > 0) {
					console.error('Some reservations could not be confirmed:', confirmResult.errors);
				}
			}

			console.log('Checkout initiated', {
				cartItems,
				total: calculateTotal(),
				paymentMethod: selectedPaymentMethod,
				appliedPromo,
				confirmedReservations: reservationIds
			});
		} catch (error) {
			console.error('Checkout error:', error);
		}
	};

	const handleContinueShopping = () => {
		openPanel('shop');
	};

	const handleClearCart = async () => {
		try {
			// 全ての予約をキャンセル
			for (const item of cartItemsWithDetails) {
				if (item.reservationId) {
					await cancelReservation(item.id, user?.uid, getSessionId());
				}
			}

			clearCart();
		} catch (error) {
			console.error('Error clearing cart:', error);
		}
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

	// Firestore同期待ち
	if (!isFirestoreSynced()) {
		return (
			<div className="space-y-8">
				<div className="text-center">
					<h2 className="text-3xl font-heading font-bold text-white mb-2">Shopping Cart</h2>
					<p className="text-gray-400">Syncing with server...</p>
				</div>

				<div className="flex justify-center items-center h-64">
					<Loader2 className="w-8 h-8 text-neonGreen animate-spin" />
				</div>
			</div>
		);
	}

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
				{!isFirestoreSynced() && (
					<p className="text-yellow-400 text-sm mt-1">
						<Loader2 className="w-3 h-3 animate-spin inline mr-1" />
						Syncing with server...
					</p>
				)}
			</div>

			{/* Promo Error */}
			{showPromoError && (
				<div className="fixed top-24 right-4 z-50 p-4 bg-red-600/10 border border-red-600 rounded-sm backdrop-blur-sm animate-pulse">
					<div className="flex items-center space-x-2">
						<AlertCircle className="w-5 h-5 text-red-400" />
						<span className="text-red-400 font-medium">Invalid promo code</span>
					</div>
				</div>
			)}

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
				{/* Cart Items */}
				<div className="lg:col-span-2 space-y-4">
					<CyberCard title={`Cart Items (${getCartItemCount()})`} showEffects={false}>
						<div className="space-y-4">
							{cartItemsWithDetails.map((item) => {
								const isItemUpdating = isUpdating[item.id];
								const stockWarning = stockWarnings[item.id];

								return (
									<div key={item.id} className="flex items-center space-x-4 p-4 border border-dark-300 rounded-sm relative">
										{/* Loading Overlay */}
										{isItemUpdating && (
											<div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-sm z-10">
												<Loader2 className="w-5 h-5 text-neonGreen animate-spin" />
											</div>
										)}

										{/* Product Image */}
										<div className="w-16 h-16 bg-gradient-to-br from-neonGreen to-neonOrange rounded-sm flex items-center justify-center">
											<Package className="w-8 h-8 text-black" />
										</div>

										{/* Product Info */}
										<div className="flex-1">
											<h3 className="text-white font-semibold">{item.name}</h3>
											<p className="text-sm text-gray-400">Premium whey protein blend</p>
											<div className="text-neonGreen font-bold">
												{formatPrice(item.price)}
												<span className="text-xs text-gray-400 ml-2">per item</span>
											</div>

											{/* Reservation Info */}
											<div className="flex items-center space-x-2 mt-1">
												{item.reservationId && (
													<div className="flex items-center space-x-1">
														<Shield className="w-3 h-3 text-neonGreen" />
														<span className="text-xs text-neonGreen">Reserved</span>
													</div>
												)}
												{item.timeLeft && (
													<div className="flex items-center space-x-1">
														<Clock className="w-3 h-3 text-yellow-400" />
														<span className="text-xs text-yellow-400">{item.timeLeft}</span>
													</div>
												)}
											</div>

											{/* Stock Warning */}
											{stockWarning && (
												<div className="text-xs text-red-400 mt-1">
													{stockWarning}
												</div>
											)}
										</div>

										{/* Quantity Controls */}
										<div className="flex items-center space-x-2">
											<button
												onClick={() => updateItemQuantity(item.id, item.quantity - 1)}
												className="w-8 h-8 border border-dark-300 rounded-sm flex items-center justify-center text-white hover:bg-dark-200 transition-colors disabled:opacity-50"
												disabled={isItemUpdating}
											>
												<Minus className="w-4 h-4" />
											</button>
											<span className="w-12 text-center text-white font-medium">{item.quantity}</span>
											<button
												onClick={() => updateItemQuantity(item.id, item.quantity + 1)}
												className="w-8 h-8 border border-dark-300 rounded-sm flex items-center justify-center text-white hover:bg-dark-200 transition-colors disabled:opacity-50"
												disabled={isItemUpdating}
											>
												<Plus className="w-4 h-4" />
											</button>
										</div>

										{/* Item Total */}
										<div className="text-right">
											<div className="text-white font-bold">
												{formatPrice(item.price * item.quantity)}
											</div>
											<div className="text-xs text-gray-400">
												{item.quantity} × {formatPrice(item.price)}
											</div>
										</div>

										{/* Remove Button */}
										<button
											onClick={() => handleRemoveItem(item.id)}
											className="p-2 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-sm transition-colors disabled:opacity-50"
											title="Remove from cart"
											disabled={isItemUpdating}
										>
											<Trash2 className="w-4 h-4" />
										</button>
									</div>
								);
							})}
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
										<span className="text-sm text-neonGreen">{getDiscountText(appliedPromo)}</span>
									</div>
									<button
										onClick={removePromoCode}
										className="text-red-400 hover:text-red-300 transition-colors"
										title="Remove promo code"
									>
										<Trash2 className="w-4 h-4" />
									</button>
								</div>
							) : (
								<div className="space-y-2">
									<div className="flex space-x-2">
										<input
											type="text"
											value={promoCode}
											onChange={(e) => setPromoCode(e.target.value)}
											placeholder="Enter promo code (e.g., PEPE10)"
											className="flex-1 px-3 py-2 bg-dark-200 border border-dark-300 rounded-sm text-white placeholder-gray-400 focus:border-neonGreen focus:outline-none"
											onKeyPress={(e) => e.key === 'Enter' && applyPromoCode()}
										/>
										<CyberButton
											variant="outline"
											onClick={applyPromoCode}
											disabled={!promoCode.trim()}
										>
											Apply
										</CyberButton>
									</div>
									<div className="text-xs text-gray-400">
										Try: PEPE10, BLOCKCHAIN15, WEB3SAVE
									</div>
								</div>
							)}
						</div>
					</CyberCard>

					{/* Cart Actions */}
					<CyberCard showEffects={false}>
						<div className="flex items-center justify-between">
							<div className="text-sm text-gray-400">
								Cart reservations expire in 15 minutes • Items expire in 30 days
							</div>
							<button
								onClick={handleClearCart}
								className="text-red-400 hover:text-red-300 text-sm transition-colors"
							>
								Clear Cart
							</button>
						</div>
					</CyberCard>
				</div>

				{/* Order Summary */}
				<div className="lg:col-span-1">
					<CyberCard title="Order Summary" showEffects={false}>
						<div className="space-y-4">
							{/* Authentication Notice */}
							{!user && (
								<div className="p-3 border border-yellow-600/30 rounded-sm bg-yellow-600/5">
									<div className="flex items-center space-x-2">
										<AlertCircle className="w-4 h-4 text-yellow-400" />
										<span className="text-xs text-yellow-400">Login required for checkout</span>
									</div>
								</div>
							)}

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
												className="text-neonGreen focus:ring-neonGreen"
											/>
											<span className="text-white">{method}</span>
											{method === 'ETH' && <span className="text-xs text-gray-400">(Recommended)</span>}
										</label>
									))}
								</div>
							</div>

							{/* Price Breakdown */}
							<div className="space-y-3 pt-4 border-t border-dark-300">
								<div className="flex justify-between">
									<span className="text-gray-400">Subtotal ({getCartItemCount()} items)</span>
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
										<span className="text-gray-400">Network Fee</span>
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
											≈ ${convertToUSD(calculateTotal())} USD
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
									Secure checkout with blockchain verification. Items are reserved during checkout process.
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
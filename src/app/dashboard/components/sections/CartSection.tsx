// src/app/dashboard/components/sections/CartSection.tsx
'use client';

import React from 'react';
import CyberCard from '../../../components/common/CyberCard';
import CyberButton from '../../../components/common/CyberButton';
import { useCart, usePanel } from '@/contexts/DashboardContext';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';
import {
	ShoppingCart,
	Trash2,
	Plus,
	Minus,
	Clock,
	Package
} from 'lucide-react';

const CartSection: React.FC = () => {
	const {
		cartItems,
		removeFromCart,
		updateQuantity,
		getCartItemCount,
		getCartItemsWithDetails
	} = useCart();

	const { openPanel } = usePanel();
	const { isAuthenticated, isLoading, walletAddress, displayName } = useUnifiedAuth();

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

	const handleCheckout = () => {
		try {
			if (!walletAddress) {
				// ログインが必要
				window.dispatchEvent(new CustomEvent('openAuthModal'));
				return;
			}

			// TODO: チェックアウト処理を実装
			console.log('Checkout initiated', {
				cartItems,
				user: walletAddress
			});

			alert('Checkout initiated!');
		} catch (error) {
			console.error('Checkout error:', error);
		}
	};

	const handleContinueShopping = () => {
		openPanel('shop');
	};

	const formatUSDPrice = (amount: number) => {
		return `$${amount.toFixed(2)}`;
	};

	if (cartItems.length === 0) {
		return (
			<div className="space-y-8">
				<div className="text-center">
					<h2 className="text-3xl font-heading font-bold text-white mb-2">Shopping Cart</h2>
					<p className="text-gray-400">Your cart is currently empty</p>
				</div>

				<div className="max-w-2xl mx-auto">
					<CyberCard showEffects={false} className="text-center py-12">
						<ShoppingCart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
						<h3 className="text-xl font-semibold text-white mb-2">Your cart is empty</h3>
						<p className="text-gray-400 mb-6">Add some premium protein to get started</p>
						<CyberButton variant="primary" onClick={handleContinueShopping}>
							Start Shopping
						</CyberButton>
					</CyberCard>
				</div>
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

			{/* Cart Items - 中央配置 */}
			<div className="max-w-4xl mx-auto">
				<CyberCard title={`Cart Items (${getCartItemCount()})`} showEffects={false}>
					<div className="space-y-4">
						{cartItemsWithDetails.map((item) => (
							<div key={item.id} className="flex items-center space-x-4 p-4 border border-dark-300 rounded-sm">
								{/* Product Image */}
								<div className="w-16 h-16 bg-gradient-to-br from-neonGreen to-neonOrange rounded-sm flex items-center justify-center flex-shrink-0">
									<Package className="w-8 h-8 text-black" />
								</div>

								{/* Product Info */}
								<div className="flex-1 min-w-0">
									<h3 className="text-white font-semibold">{item.name}</h3>
									<p className="text-sm text-gray-400">Premium whey protein blend</p>
									<div className="text-white font-semibold">{formatUSDPrice(item.price)}</div>

									{/* Item Info */}
									{item.timeLeft && (
										<div className="flex items-center space-x-1 mt-1">
											<Clock className="w-3 h-3 text-yellow-400" />
											<span className="text-xs text-yellow-400">{item.timeLeft}</span>
										</div>
									)}
								</div>

								{/* Quantity Controls */}
								<div className="flex items-center space-x-2 flex-shrink-0">
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
								<div className="text-right flex-shrink-0">
									<div className="text-white font-semibold">{formatUSDPrice(item.price * item.quantity)}</div>
									<div className="text-xs text-gray-400">
										{item.quantity} × {formatUSDPrice(item.price)}
									</div>
								</div>

								{/* Remove Button */}
								<button
									onClick={() => handleRemoveItem(item.id)}
									className="p-2 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-sm transition-colors flex-shrink-0"
									title="Remove from cart"
								>
									<Trash2 className="w-4 h-4" />
								</button>
							</div>
						))}
					</div>
				</CyberCard>
				<div className="mt-6">
					<CyberButton
						variant="primary"
						className="w-full flex items-center justify-center space-x-2"
						onClick={handleCheckout}
					>
						<span>Proceed to checkout</span>
					</CyberButton>
				</div>
			</div>
		</div>
	);
};

export default CartSection;
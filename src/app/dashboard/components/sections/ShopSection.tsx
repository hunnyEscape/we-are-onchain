// src/app/dashboard/components/sections/ShopSection.tsx (簡易版)
'use client';

import React, { useState, useEffect } from 'react';
import CyberCard from '../../../components/common/CyberCard';
import CyberButton from '../../../components/common/CyberButton';
import ProteinModel from '../../../components/home/glowing-3d-text/ProteinModel';
import { useCart } from '../../context/DashboardContext';
import { ShoppingCart, Star, Shield, Zap, Check, AlertTriangle, Clock, Loader2 } from 'lucide-react';
import { ProductDetails } from '../../../../../types/product';
import { getProductDetails, subscribeToProduct } from '@/lib/firestore/products';

const ShopSection: React.FC = () => {
	const [quantity, setQuantity] = useState(1);
	const [selectedCurrency, setSelectedCurrency] = useState<'ETH' | 'USDC' | 'USDT'>('ETH');
	const [showSuccessMessage, setShowSuccessMessage] = useState(false);
	const [showStockWarning, setShowStockWarning] = useState(false);
	const [stockWarningMessage, setStockWarningMessage] = useState('');
	const [loading, setLoading] = useState(true);
	const [product, setProduct] = useState<ProductDetails | null>(null);
	const [isAddingToCart, setIsAddingToCart] = useState(false);

	const { addToCart, cartItems } = useCart();

	// 固定の商品ID
	const PRODUCT_ID = 'pepe-protein-1';

	// 商品データをリアルタイムで取得
	useEffect(() => {
		let unsubscribe: (() => void) | null = null;

		const loadProduct = async () => {
			try {
				setLoading(true);
				
				// 初回データ取得
				const productData = await getProductDetails(PRODUCT_ID);
				if (productData) {
					setProduct(productData);
				}
				
				// リアルタイム監視を開始
				unsubscribe = subscribeToProduct(PRODUCT_ID, (firestoreProduct) => {
					if (firestoreProduct) {
						// FirestoreProductをProductDetailsに変換
						const getStockLevel = (available: number, total: number): 'high' | 'medium' | 'low' | 'out' => {
							if (available === 0) return 'out';
							const ratio = available / total;
							if (ratio > 0.5) return 'high';
							if (ratio > 0.2) return 'medium';
							return 'low';
						};

						const productDetails: ProductDetails = {
							id: firestoreProduct.id,
							name: firestoreProduct.name,
							description: firestoreProduct.description,
							price: {
								usd: firestoreProduct.price.usd,
								formatted: `$${firestoreProduct.price.usd.toFixed(2)}`
							},
							inventory: {
								inStock: firestoreProduct.inventory.availableStock,
								isAvailable: firestoreProduct.inventory.availableStock > 0,
								stockLevel: getStockLevel(firestoreProduct.inventory.availableStock, firestoreProduct.inventory.totalStock)
							},
							metadata: firestoreProduct.metadata,
							settings: firestoreProduct.settings,
							timestamps: {
								createdAt: firestoreProduct.timestamps.createdAt.toDate(),
								updatedAt: firestoreProduct.timestamps.updatedAt.toDate()
							}
						};
						
						setProduct(productDetails);
					} else {
						setProduct(null);
					}
				});
				
			} catch (error) {
				console.error('Error loading product:', error);
				setProduct(null);
			} finally {
				setLoading(false);
			}
		};

		loadProduct();

		return () => {
			if (unsubscribe) {
				unsubscribe();
			}
		};
	}, [PRODUCT_ID]);

	// カート内の商品数量を取得
	const getCartQuantity = () => {
		const cartItem = cartItems.find(item => item.id === PRODUCT_ID);
		return cartItem ? cartItem.quantity : 0;
	};

	// 簡易在庫チェック（Firestoreトランザクションなし）
	const checkSimpleStock = (requestedQuantity: number) => {
		if (!product) return { canAdd: false, message: 'Product not found' };
		
		const currentCartQuantity = getCartQuantity();
		const totalRequested = currentCartQuantity + requestedQuantity;
		
		// 在庫チェック
		if (totalRequested > product.inventory.inStock) {
			return { 
				canAdd: false, 
				message: `Only ${product.inventory.inStock - currentCartQuantity} items available` 
			};
		}
		
		// 注文制限チェック
		if (totalRequested > product.settings.maxOrderQuantity) {
			return { 
				canAdd: false, 
				message: `Maximum ${product.settings.maxOrderQuantity} items per order` 
			};
		}
		
		// 商品アクティブチェック
		if (!product.settings.isActive) {
			return { 
				canAdd: false, 
				message: 'Product is currently unavailable' 
			};
		}
		
		return { canAdd: true, message: '' };
	};

	// 数量変更時のバリデーション
	const handleQuantityChange = (newQuantity: number) => {
		if (!product) return;

		if (newQuantity < 1) {
			setQuantity(1);
			return;
		}

		const stockCheck = checkSimpleStock(newQuantity - quantity);
		
		if (!stockCheck.canAdd && newQuantity > quantity) {
			setStockWarningMessage(stockCheck.message);
			setShowStockWarning(true);
			setTimeout(() => setShowStockWarning(false), 3000);
			return;
		}

		const maxAllowed = Math.min(
			product.inventory.inStock - getCartQuantity(),
			product.settings.maxOrderQuantity - getCartQuantity(),
			product.settings.maxOrderQuantity
		);

		setQuantity(Math.min(newQuantity, Math.max(1, maxAllowed)));
	};

	const handleAddToCart = async () => {
		if (!product || isAddingToCart) return;

		try {
			setIsAddingToCart(true);

			// 簡易在庫チェック
			const stockCheck = checkSimpleStock(quantity);
			
			if (!stockCheck.canAdd) {
				setStockWarningMessage(stockCheck.message);
				setShowStockWarning(true);
				setTimeout(() => setShowStockWarning(false), 3000);
				return;
			}

			// ローカルカートに追加（Firestore予約なし）
			const cartItem = {
				id: product.id,
				name: product.name,
				price: product.price.usd,
				quantity: quantity,
				currency: selectedCurrency,
			};

			addToCart(cartItem, product.inventory.inStock);
			setShowSuccessMessage(true);

			setTimeout(() => {
				setShowSuccessMessage(false);
			}, 3000);

			// 追加後は数量を1にリセット
			setQuantity(1);

		} catch (error) {
			console.error('Error adding to cart:', error);
			setStockWarningMessage('An error occurred. Please try again.');
			setShowStockWarning(true);
			setTimeout(() => setShowStockWarning(false), 3000);
		} finally {
			setIsAddingToCart(false);
		}
	};

	// ローディング状態
	if (loading) {
		return (
			<div className="space-y-8">
				<div className="text-center">
					<h2 className="text-3xl font-heading font-bold text-white mb-2">
						Premium Protein Store
					</h2>
					<p className="text-gray-400">
						Loading product information...
					</p>
				</div>
				
				<div className="flex justify-center items-center h-64">
					<Loader2 className="w-8 h-8 text-neonGreen animate-spin" />
				</div>
			</div>
		);
	}

	// 商品が見つからない場合
	if (!product) {
		return (
			<div className="space-y-8">
				<div className="text-center">
					<h2 className="text-3xl font-heading font-bold text-white mb-2">
						Premium Protein Store
					</h2>
					<p className="text-gray-400">
						Product not found or currently unavailable
					</p>
				</div>
				
				<CyberCard showEffects={false} className="text-center py-12">
					<AlertTriangle className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
					<h3 className="text-xl font-semibold text-white mb-2">Product Unavailable</h3>
					<p className="text-gray-400 mb-6">This product is currently not available</p>
				</CyberCard>
			</div>
		);
	}

	const currentCartQuantity = getCartQuantity();
	const isOutOfStock = !product.inventory.isAvailable;
	const isAtOrderLimit = currentCartQuantity >= product.settings.maxOrderQuantity;
	const availableToAdd = Math.min(
		product.inventory.inStock - currentCartQuantity,
		product.settings.maxOrderQuantity - currentCartQuantity
	);

	return (
		<div className="space-y-8">
			{/* Header */}
			<div className="text-center">
				<h2 className="text-3xl font-heading font-bold text-white mb-2">
					Premium Protein Store
				</h2>
				<p className="text-gray-400">
					Pay with cryptocurrency - No wallet connection required
				</p>
			</div>

			{/* Success Message */}
			{showSuccessMessage && (
				<div className="fixed top-24 right-4 z-50 p-4 bg-neonGreen/10 border border-neonGreen rounded-sm backdrop-blur-sm animate-pulse">
					<div className="flex items-center space-x-2">
						<Check className="w-5 h-5 text-neonGreen" />
						<span className="text-neonGreen font-medium">Added to cart!</span>
					</div>
				</div>
			)}

			{/* Stock Warning */}
			{showStockWarning && (
				<div className="fixed top-24 right-4 z-50 p-4 bg-yellow-600/10 border border-yellow-600 rounded-sm backdrop-blur-sm animate-pulse">
					<div className="flex items-center space-x-2">
						<AlertTriangle className="w-5 h-5 text-yellow-400" />
						<span className="text-yellow-400 font-medium">{stockWarningMessage}</span>
					</div>
				</div>
			)}

			{/* Product Display */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
				{/* 3D Model */}
				<CyberCard
					variant="default"
					showEffects={false}
					className="h-[500px] w-full"
				>
					<div className="h-full w-full flex flex-col">
						<div className="w-full h-[400px] pointer-events-auto">
							<ProteinModel
								scale={1}
								autoRotate={true}
							/>
						</div>
						<div className="w-full flex justify-center pt-4 pb-2">
							<div className="inline-flex items-center space-x-2 px-4 py-2 bg-neonGreen/10 border border-neonGreen/30 rounded-sm">
								<Shield className="w-5 h-5 text-neonGreen" />
								<span className="text-sm text-neonGreen font-medium">Blockchain Verified</span>
							</div>
						</div>
					</div>
				</CyberCard>

				{/* Product Info */}
				<div className="space-y-6">
					{/* Product Header */}
					<div>
						<h3 className="text-2xl font-heading font-bold text-white mb-2">
							{product.name}
						</h3>
						<div className="flex items-center space-x-4 mb-4">
							<div className="flex items-center space-x-1">
								{[...Array(5)].map((_, i) => (
									<Star
										key={i}
										className={`w-4 h-4 ${i < Math.floor(product.metadata.rating) ? 'text-neonOrange fill-current' : 'text-gray-400'}`}
									/>
								))}
								<span className="text-sm text-gray-400 ml-2">({product.metadata.rating})</span>
								{product.metadata.reviewCount > 0 && (
									<span className="text-sm text-gray-400">• {product.metadata.reviewCount} reviews</span>
								)}
							</div>
							<span className={`text-sm ${
								product.inventory.stockLevel === 'high' ? 'text-neonGreen' : 
								product.inventory.stockLevel === 'medium' ? 'text-yellow-400' : 
								product.inventory.stockLevel === 'low' ? 'text-orange-400' : 'text-red-400'
							}`}>
								{product.inventory.isAvailable ? 
									`${product.inventory.inStock} in stock` : 
									'Out of stock'
								}
							</span>
						</div>
						<p className="text-gray-400 leading-relaxed">
							{product.description}
						</p>
					</div>

					{/* Price */}
					<div className="border border-dark-300 rounded-sm p-4 bg-dark-200/30">
						<div className="flex items-center justify-between">
							<div>
								<div className="text-sm text-gray-400">
									{product.price.formatted}
								</div>
							</div>
							<div className="text-right">
								<div className="text-xs text-gray-500">per 50g serving</div>
								<div className="text-xs text-gray-500">Invoice-based payment</div>
							</div>
						</div>
					</div>

					{/* Cart Status */}
					{currentCartQuantity > 0 && (
						<div className="flex items-center space-x-2 p-3 border border-neonGreen/30 rounded-sm bg-neonGreen/5">
							<ShoppingCart className="w-4 h-4 text-neonGreen" />
							<span className="text-sm text-neonGreen">
								{currentCartQuantity} item{currentCartQuantity > 1 ? 's' : ''} in cart
							</span>
						</div>
					)}

					{/* Stock Level Indicator */}
					{product.inventory.isAvailable && (
						<div className={`flex items-center space-x-2 p-2 rounded-sm ${
							product.inventory.stockLevel === 'high' ? 'bg-neonGreen/5 border border-neonGreen/20' :
							product.inventory.stockLevel === 'medium' ? 'bg-yellow-400/5 border border-yellow-400/20' :
							'bg-orange-400/5 border border-orange-400/20'
						}`}>
							<div className={`w-2 h-2 rounded-full ${
								product.inventory.stockLevel === 'high' ? 'bg-neonGreen' :
								product.inventory.stockLevel === 'medium' ? 'bg-yellow-400' :
								'bg-orange-400'
							}`}></div>
							<span className={`text-xs ${
								product.inventory.stockLevel === 'high' ? 'text-neonGreen' :
								product.inventory.stockLevel === 'medium' ? 'text-yellow-400' :
								'text-orange-400'
							}`}>
								{product.inventory.stockLevel === 'high' ? 'In Stock' :
								 product.inventory.stockLevel === 'medium' ? 'Limited Stock' :
								 'Low Stock'}
							</span>
						</div>
					)}

					{/* Quantity Selector */}
					<div className="flex items-center space-x-4">
						<label className="text-sm font-medium text-white">Quantity:</label>
						<div className="flex items-center border border-dark-300 rounded-sm">
							<button
								onClick={() => handleQuantityChange(quantity - 1)}
								className="px-3 py-2 text-white hover:bg-dark-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
								disabled={quantity <= 1 || isAddingToCart}
							>
								-
							</button>
							<span className="px-4 py-2 bg-dark-200 text-white min-w-[60px] text-center">
								{quantity}
							</span>
							<button
								onClick={() => handleQuantityChange(quantity + 1)}
								className="px-3 py-2 text-white hover:bg-dark-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
								disabled={availableToAdd <= 0 || isOutOfStock || isAtOrderLimit || isAddingToCart}
							>
								+
							</button>
						</div>
						<div className="text-xs text-gray-400">
							{isOutOfStock ? 'Out of stock' : 
							 isAtOrderLimit ? 'Max limit reached' :
							 `Max ${product.settings.maxOrderQuantity}`}
						</div>
					</div>

					{/* Stock/Order Warnings */}
					{(isOutOfStock || isAtOrderLimit) && (
						<div className="flex items-start space-x-2 p-3 border border-yellow-600/30 rounded-sm bg-yellow-600/5">
							<AlertTriangle className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
							<div className="text-xs text-gray-300">
								{isOutOfStock ? 'This item is currently out of stock.' :
								 `Maximum order limit (${product.settings.maxOrderQuantity} items) reached for this product.`}
							</div>
						</div>
					)}

					<div className="space-y-3">
						<CyberButton
							variant="outline"
							className="w-full flex items-center justify-center space-x-2"
							onClick={handleAddToCart}
							disabled={isOutOfStock || isAtOrderLimit || isAddingToCart || availableToAdd <= 0}
						>
							{isAddingToCart ? (
								<Loader2 className="w-4 h-4 animate-spin" />
							) : (
								<ShoppingCart className="w-4 h-4" />
							)}
							<span>{isAddingToCart ? 'Adding...' : 'Add to Cart'}</span>
						</CyberButton>
					</div>

					{/* Features */}
					<div className="space-y-3">
						<h4 className="text-lg font-semibold text-white">Key Features</h4>
						<div className="grid grid-cols-1 gap-2">
							{product.metadata.features.map((feature, index) => (
								<div key={index} className="flex items-center space-x-2">
									<div className="w-2 h-2 bg-neonGreen rounded-full"></div>
									<span className="text-sm text-gray-300">{feature}</span>
								</div>
							))}
						</div>
					</div>

					{/* Tags */}
					{product.metadata.tags.length > 0 && (
						<div className="space-y-3">
							<h4 className="text-lg font-semibold text-white">Tags</h4>
							<div className="flex flex-wrap gap-2">
								{product.metadata.tags.map((tag, index) => (
									<span 
										key={index}
										className="px-2 py-1 text-xs bg-dark-200 text-neonGreen border border-neonGreen/30 rounded-sm"
									>
										{tag}
									</span>
								))}
							</div>
						</div>
					)}
				</div>
			</div>

			{/* Nutrition Facts */}
			<CyberCard
				title="Nutrition Facts"
				description="Per 50g serving"
				showEffects={false}
			>
				<div className="grid grid-cols-2 md:grid-cols-5 gap-4">
					{Object.entries(product.metadata.nutritionFacts).map(([key, value]) => (
						<div key={key} className="text-center">
							<div className="text-lg font-bold text-neonGreen">{value}</div>
							<div className="text-xs text-gray-400 capitalize">{key}</div>
						</div>
					))}
				</div>
			</CyberCard>

			{/* Product Info */}
			<div className="grid grid-cols-1 md:grid-cols-2 gap-8">
				<CyberCard
					title="Product Information"
					showEffects={false}
				>
					<div className="space-y-4">
						<div className="flex justify-between">
							<span className="text-gray-400">SKU:</span>
							<span className="text-white">{product.id}</span>
						</div>
						<div className="flex justify-between">
							<span className="text-gray-400">Category:</span>
							<span className="text-white capitalize">{product.settings.category || 'Protein'}</span>
						</div>
						<div className="flex justify-between">
							<span className="text-gray-400">Min Order:</span>
							<span className="text-white">{product.settings.minOrderQuantity}</span>
						</div>
						<div className="flex justify-between">
							<span className="text-gray-400">Max Order:</span>
							<span className="text-white">{product.settings.maxOrderQuantity}</span>
						</div>
						<div className="flex justify-between">
							<span className="text-gray-400">Updated:</span>
							<span className="text-white">{product.timestamps.updatedAt.toLocaleDateString()}</span>
						</div>
					</div>
				</CyberCard>

				<CyberCard
					title="Shipping & Returns"
					showEffects={false}
				>
					<div className="space-y-4 text-sm text-gray-300">
						<div className="flex items-center space-x-2">
							<Zap className="w-4 h-4 text-neonGreen" />
							<span>Fast shipping worldwide</span>
						</div>
						<div className="flex items-center space-x-2">
							<Shield className="w-4 h-4 text-neonGreen" />
							<span>30-day return guarantee</span>
						</div>
						<div className="flex items-center space-x-2">
							<Check className="w-4 h-4 text-neonGreen" />
							<span>Quality assured</span>
						</div>
						<p className="text-xs text-gray-400 mt-4">
							All products are verified on the blockchain for authenticity and quality assurance.
						</p>
					</div>
				</CyberCard>
			</div>
		</div>
	);
};

export default ShopSection;
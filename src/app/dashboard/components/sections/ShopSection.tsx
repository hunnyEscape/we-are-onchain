// src/app/dashboard/components/sections/ShopSection.tsx
'use client';

import React, { useState } from 'react';
import CyberCard from '../../../components/common/CyberCard';
import CyberButton from '../../../components/common/CyberButton';
import ProteinModel from '../../../components/home/glowing-3d-text/ProteinModel';
import { ShoppingCart, Star, Shield, Zap } from 'lucide-react';

interface Product {
	id: string;
	name: string;
	description: string;
	price: {
		eth: number;
		usd: number;
	};
	inStock: number;
	rating: number;
	features: string[];
	nutritionFacts: {
		protein: string;
		fat: string;
		carbs: string;
		minerals: string;
		allergen: string;
	};
}

const ShopSection: React.FC = () => {
	const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
	const [quantity, setQuantity] = useState(1);

	// モック商品データ
	const product: Product = {
		id: 'pepe-protein-1',
		name: 'Pepe Flavor Protein',
		description: 'Premium whey protein with the legendary Pepe flavor. Built for the blockchain generation.',
		price: {
			eth: 0.025,
			usd: 89.99
		},
		inStock: 247,
		rating: 4.9,
		features: [
			'Blockchain Verified Quality',
			'Community Approved Formula',
			'Meme-Powered Gains',
			'Web3 Native Nutrition'
		],
		nutritionFacts: {
			protein: '25g',
			fat: '1.5g',
			carbs: '2g',
			minerals: '1g',
			allergen: 'Milk'
		}
	};

	const handleAddToCart = () => {
		// カート機能の実装（Phase 4で詳細実装）
		console.log(`Added ${quantity}x ${product.name} to cart`);
	};

	const handleBuyNow = () => {
		// 即購入機能の実装（Phase 4で詳細実装）
		console.log(`Buy now: ${quantity}x ${product.name}`);
	};

	return (
		<div className="space-y-8">
			{/* Header */}
			<div className="text-center">
				<h2 className="text-3xl font-heading font-bold text-white mb-2">
					Premium Protein Store
				</h2>
				<p className="text-gray-400">
					Blockchain-verified supplements for the crypto community
				</p>
			</div>

			{/* Product Display */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
				{/* 3D Model Display */}
				<CyberCard
					variant="default"
					showEffects={false}
					className="h-[500px]"
				>
					<div className="h-full flex flex-col">
						<div className="flex-1">
							<ProteinModel scale={1.2} autoRotate={true} />
						</div>
						<div className="text-center pt-4">
							<div className="inline-flex items-center space-x-2 px-3 py-1 bg-neonGreen/10 border border-neonGreen/30 rounded-sm">
								<Shield className="w-4 h-4 text-neonGreen" />
								<span className="text-xs text-neonGreen">Blockchain Verified</span>
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
										className={`w-4 h-4 ${i < Math.floor(product.rating) ? 'text-neonOrange fill-current' : 'text-gray-400'}`}
									/>
								))}
								<span className="text-sm text-gray-400 ml-2">({product.rating})</span>
							</div>
							<span className="text-sm text-neonGreen">{product.inStock} in stock</span>
						</div>
						<p className="text-gray-400 leading-relaxed">
							{product.description}
						</p>
					</div>

					{/* Price */}
					<div className="border border-dark-300 rounded-sm p-4 bg-dark-200/30">
						<div className="flex items-center justify-between">
							<div>
								<div className="text-2xl font-bold text-neonGreen">
									Ξ {product.price.eth}
								</div>
								<div className="text-sm text-gray-400">
									≈ ${product.price.usd} USD
								</div>
							</div>
							<div className="text-right">
								<div className="text-xs text-gray-500">per 50g serving</div>
								<div className="text-xs text-gray-500">+ Gas fees</div>
							</div>
						</div>
					</div>

					{/* Quantity Selector */}
					<div className="flex items-center space-x-4">
						<label className="text-sm font-medium text-white">Quantity:</label>
						<div className="flex items-center border border-dark-300 rounded-sm">
							<button
								onClick={() => setQuantity(Math.max(1, quantity - 1))}
								className="px-3 py-2 text-white hover:bg-dark-200 transition-colors"
							>
								-
							</button>
							<span className="px-4 py-2 bg-dark-200 text-white min-w-[60px] text-center">
								{quantity}
							</span>
							<button
								onClick={() => setQuantity(Math.min(10, quantity + 1))}
								className="px-3 py-2 text-white hover:bg-dark-200 transition-colors"
							>
								+
							</button>
						</div>
					</div>

					{/* Action Buttons */}
					<div className="space-y-3">
						<CyberButton
							variant="primary"
							className="w-full flex items-center justify-center space-x-2"
							onClick={handleBuyNow}
						>
							<Zap className="w-4 h-4" />
							<span>Buy Now</span>
						</CyberButton>

						<CyberButton
							variant="outline"
							className="w-full flex items-center justify-center space-x-2"
							onClick={handleAddToCart}
						>
							<ShoppingCart className="w-4 h-4" />
							<span>Add to Cart</span>
						</CyberButton>
					</div>

					{/* Features */}
					<div className="space-y-3">
						<h4 className="text-lg font-semibold text-white">Key Features</h4>
						<div className="grid grid-cols-1 gap-2">
							{product.features.map((feature, index) => (
								<div key={index} className="flex items-center space-x-2">
									<div className="w-2 h-2 bg-neonGreen rounded-full"></div>
									<span className="text-sm text-gray-300">{feature}</span>
								</div>
							))}
						</div>
					</div>
				</div>
			</div>

			{/* Nutrition Facts */}
			<CyberCard
				title="Nutrition Facts"
				description="Per 50g serving"
				showEffects={false}
			>
				<div className="grid grid-cols-2 md:grid-cols-5 gap-4">
					{Object.entries(product.nutritionFacts).map(([key, value]) => (
						<div key={key} className="text-center">
							<div className="text-lg font-bold text-neonGreen">{value}</div>
							<div className="text-xs text-gray-400 capitalize">{key}</div>
						</div>
					))}
				</div>
			</CyberCard>
		</div>
	);
};

export default ShopSection;
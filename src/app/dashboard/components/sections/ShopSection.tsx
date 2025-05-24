// src/app/dashboard/components/sections/ShopSection.tsx
'use client';

import React, { useState } from 'react';
import CyberCard from '../../../components/common/CyberCard';
import CyberButton from '../../../components/common/CyberButton';
import ProteinModel from '../../../components/home/glowing-3d-text/ProteinModel';
import { useCart } from '../../context/DashboardContext';
import { ShoppingCart, Star, Shield, Zap, Check } from 'lucide-react';

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
  const [quantity, setQuantity] = useState(1);
  const [selectedCurrency, setSelectedCurrency] = useState<'ETH' | 'USDC' | 'USDT'>('ETH');
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  
  const { addToCart, cartItems } = useCart();

  // 商品データ
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

  // カート内の商品数量を取得
  const getCartQuantity = () => {
    const cartItem = cartItems.find(item => item.id === product.id);
    return cartItem ? cartItem.quantity : 0;
  };

  // 価格を通貨別に取得
  const getPrice = () => {
    if (selectedCurrency === 'ETH') {
      return { value: product.price.eth, symbol: 'Ξ' };
    } else {
      return { value: product.price.usd, symbol: '$' };
    }
  };

  const handleAddToCart = () => {
    const cartItem = {
      id: product.id,
      name: product.name,
      price: selectedCurrency === 'ETH' ? product.price.eth : product.price.usd,
      quantity: quantity,
      currency: selectedCurrency,
    };

    addToCart(cartItem);
    setShowSuccessMessage(true);
    
    setTimeout(() => {
      setShowSuccessMessage(false);
    }, 3000);
  };

  const handleBuyNow = () => {
    handleAddToCart();
    console.log(`Generate invoice for: ${quantity}x ${product.name}`);
  };

  const currentCartQuantity = getCartQuantity();
  const price = getPrice();

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

      {/* Product Display */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 3D Model */}
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

          {/* Currency Selection */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">Payment Currency</label>
            <div className="flex space-x-2">
              {(['ETH', 'USDC', 'USDT'] as const).map((currency) => (
                <button
                  key={currency}
                  onClick={() => setSelectedCurrency(currency)}
                  className={`px-4 py-2 rounded-sm border transition-colors ${
                    selectedCurrency === currency
                      ? 'bg-neonGreen/10 border-neonGreen text-neonGreen'
                      : 'border-dark-300 text-gray-300 hover:border-gray-500'
                  }`}
                >
                  {currency}
                </button>
              ))}
            </div>
          </div>

          {/* Price */}
          <div className="border border-dark-300 rounded-sm p-4 bg-dark-200/30">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-neonGreen">
                  {price.symbol} {price.value}
                </div>
                {selectedCurrency === 'ETH' && (
                  <div className="text-sm text-gray-400">
                    ≈ ${product.price.usd} USD
                  </div>
                )}
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-500">per 50g serving</div>
                <div className="text-xs text-gray-500">Invoice-based payment</div>
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
            {currentCartQuantity > 0 && (
              <span className="text-sm text-neonGreen">
                {currentCartQuantity} in cart
              </span>
            )}
          </div>

          {/* Invoice Payment Info */}
          <div className="p-3 border border-neonGreen/30 rounded-sm bg-neonGreen/5">
            <div className="text-neonGreen text-sm font-medium mb-1">
              💡 Simple Crypto Payment
            </div>
            <div className="text-xs text-gray-300">
              No wallet connection needed! We'll generate a payment invoice with QR code for easy crypto payment.
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
              <span>Buy Now - Generate Invoice</span>
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

      {/* Payment Process */}
      <CyberCard 
        title="How Payment Works" 
        description="Simple 3-step process"
        showEffects={false}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4">
            <div className="w-12 h-12 bg-neonGreen/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-neonGreen font-bold">1</span>
            </div>
            <h4 className="text-white font-medium mb-2">Choose & Order</h4>
            <p className="text-xs text-gray-400">Select your products and quantities</p>
          </div>
          <div className="text-center p-4">
            <div className="w-12 h-12 bg-neonOrange/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-neonOrange font-bold">2</span>
            </div>
            <h4 className="text-white font-medium mb-2">Get Invoice</h4>
            <p className="text-xs text-gray-400">Receive payment address & QR code</p>
          </div>
          <div className="text-center p-4">
            <div className="w-12 h-12 bg-neonGreen/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-neonGreen font-bold">3</span>
            </div>
            <h4 className="text-white font-medium mb-2">Pay & Ship</h4>
            <p className="text-xs text-gray-400">Send crypto and get instant shipping</p>
          </div>
        </div>
      </CyberCard>

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
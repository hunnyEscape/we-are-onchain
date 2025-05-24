// src/app/dashboard/components/sections/HowToBuySection.tsx
'use client';

import React, { useState } from 'react';
import CyberCard from '../../../components/common/CyberCard';
import CyberButton from '../../../components/common/CyberButton';
import { 
  Wallet, 
  CreditCard, 
  Shield, 
  CheckCircle,
  AlertTriangle,
  ExternalLink,
  Copy,
  Clock,
  Zap,
  DollarSign
} from 'lucide-react';

interface PaymentMethod {
  id: string;
  name: string;
  symbol: string;
  icon: React.ReactNode;
  fees: string;
  speed: string;
  description: string;
}

interface WalletOption {
  name: string;
  description: string;
  icon: React.ReactNode;
  supported: boolean;
}

const HowToBuySection: React.FC = () => {
  const [activeStep, setActiveStep] = useState(1);
  
  const paymentMethods: PaymentMethod[] = [
    {
      id: 'eth',
      name: 'Ethereum',
      symbol: 'ETH',
      icon: <div className="w-6 h-6 bg-blue-500 rounded-full" />,
      fees: '~$5-15',
      speed: '2-5 min',
      description: 'Most popular option with wide acceptance'
    },
    {
      id: 'usdc',
      name: 'USD Coin',
      symbol: 'USDC',
      icon: <div className="w-6 h-6 bg-blue-600 rounded-full" />,
      fees: '~$3-8',
      speed: '1-3 min',
      description: 'Stable value pegged to USD'
    },
    {
      id: 'usdt',
      name: 'Tether',
      symbol: 'USDT',
      icon: <div className="w-6 h-6 bg-green-500 rounded-full" />,
      fees: '~$3-8',
      speed: '1-3 min',
      description: 'Popular stablecoin option'
    }
  ];

  const walletOptions: WalletOption[] = [
    {
      name: 'MetaMask',
      description: 'Most popular browser wallet',
      icon: <div className="w-8 h-8 bg-orange-500 rounded-sm" />,
      supported: true
    },
    {
      name: 'WalletConnect',
      description: 'Connect various mobile wallets',
      icon: <div className="w-8 h-8 bg-blue-500 rounded-sm" />,
      supported: true
    },
    {
      name: 'Coinbase Wallet',
      description: 'Official Coinbase wallet',
      icon: <div className="w-8 h-8 bg-blue-600 rounded-sm" />,
      supported: true
    },
    {
      name: 'Trust Wallet',
      description: 'Mobile-first crypto wallet',
      icon: <div className="w-8 h-8 bg-blue-400 rounded-sm" />,
      supported: true
    }
  ];

  const steps = [
    {
      id: 1,
      title: 'Connect Your Wallet',
      description: 'Link your Web3 wallet to our platform',
      details: 'Choose from supported wallets and authorize the connection. This creates your secure account on our platform.'
    },
    {
      id: 2,
      title: 'Select Payment Method',
      description: 'Choose your preferred cryptocurrency',
      details: 'Pick from ETH, USDC, or USDT. Each has different fees and transaction speeds.'
    },
    {
      id: 3,
      title: 'Add to Cart & Checkout',
      description: 'Review your order and confirm',
      details: 'Select quantity, apply any promo codes, and review the total including gas fees.'
    },
    {
      id: 4,
      title: 'Confirm Transaction',
      description: 'Approve the smart contract transaction',
      details: 'Your wallet will show the transaction details. Confirm to complete your purchase.'
    },
    {
      id: 5,
      title: 'Receive Your Order',
      description: 'Fast shipping with blockchain tracking',
      details: 'Get email confirmation and track your shipment. Your purchase will appear in your profile.'
    }
  ];

  const handleCopyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-heading font-bold text-white mb-2">
          How to Buy
        </h2>
        <p className="text-gray-400">
          Your complete guide to purchasing with cryptocurrency
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <CyberCard showEffects={false} className="text-center">
          <Zap className="w-8 h-8 text-neonGreen mx-auto mb-2" />
          <div className="text-xl font-bold text-white">1-5 min</div>
          <div className="text-xs text-gray-400">Average Transaction Time</div>
        </CyberCard>

        <CyberCard showEffects={false} className="text-center">
          <Shield className="w-8 h-8 text-neonOrange mx-auto mb-2" />
          <div className="text-xl font-bold text-white">100%</div>
          <div className="text-xs text-gray-400">Secure Smart Contracts</div>
        </CyberCard>

        <CyberCard showEffects={false} className="text-center">
          <DollarSign className="w-8 h-8 text-neonGreen mx-auto mb-2" />
          <div className="text-xl font-bold text-white">$3-15</div>
          <div className="text-xs text-gray-400">Typical Gas Fees</div>
        </CyberCard>
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

                  {/* Step-specific content */}
                  {step.id === 1 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {walletOptions.map((wallet, index) => (
                        <div key={index} className="p-4 border border-dark-300 rounded-sm flex items-center space-x-3">
                          {wallet.icon}
                          <div>
                            <div className="text-white font-medium">{wallet.name}</div>
                            <div className="text-xs text-gray-400">{wallet.description}</div>
                          </div>
                          {wallet.supported && (
                            <CheckCircle className="w-5 h-5 text-neonGreen ml-auto" />
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {step.id === 2 && (
                    <div className="space-y-4">
                      {paymentMethods.map((method) => (
                        <div key={method.id} className="p-4 border border-dark-300 rounded-sm">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              {method.icon}
                              <div>
                                <div className="text-white font-medium">{method.name} ({method.symbol})</div>
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
                  )}

                  {step.id === 3 && (
                    <div className="space-y-4">
                      <div className="p-4 border border-yellow-600/30 rounded-sm bg-yellow-600/5">
                        <div className="flex items-start space-x-3">
                          <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                          <div>
                            <div className="text-yellow-400 font-medium mb-1">Gas Fee Estimation</div>
                            <div className="text-sm text-gray-300">
                              Gas fees vary based on network congestion. We provide real-time estimates before you confirm.
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {step.id === 4 && (
                    <div className="space-y-4">
                      <div className="p-4 border border-neonGreen/30 rounded-sm bg-neonGreen/5">
                        <div className="flex items-start space-x-3">
                          <Shield className="w-5 h-5 text-neonGreen flex-shrink-0 mt-0.5" />
                          <div>
                            <div className="text-neonGreen font-medium mb-1">Smart Contract Security</div>
                            <div className="text-sm text-gray-300 mb-2">
                              All transactions are processed through audited smart contracts for maximum security.
                            </div>
                            <div className="text-xs text-gray-400 font-mono">
                              Contract: 0x742d35CC6634C0532925a3b8D404e22d65be3b32
                              <button 
                                onClick={() => handleCopyAddress('0x742d35CC6634C0532925a3b8D404e22d65be3b32')}
                                className="ml-2 text-neonGreen hover:text-neonGreen/80"
                              >
                                <Copy className="w-3 h-3 inline" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {step.id === 5 && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 border border-dark-300 rounded-sm">
                          <Clock className="w-6 h-6 text-neonOrange mb-2" />
                          <div className="text-white font-medium mb-1">Shipping Time</div>
                          <div className="text-sm text-gray-400">3-7 business days worldwide</div>
                        </div>
                        <div className="p-4 border border-dark-300 rounded-sm">
                          <Shield className="w-6 h-6 text-neonGreen mb-2" />
                          <div className="text-white font-medium mb-1">Tracking</div>
                          <div className="text-sm text-gray-400">Blockchain-verified delivery</div>
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
            <h4 className="text-white font-medium mb-2">What if I don't have a crypto wallet?</h4>
            <p className="text-sm text-gray-400">
              You can easily create one with MetaMask or Coinbase Wallet. Both offer simple setup processes and are free to use.
            </p>
          </div>

          <div className="border-b border-dark-300 pb-4">
            <h4 className="text-white font-medium mb-2">Are gas fees included in the price?</h4>
            <p className="text-sm text-gray-400">
              No, gas fees are separate and depend on network congestion. We show real-time estimates before you confirm.
            </p>
          </div>

          <div className="border-b border-dark-300 pb-4">
            <h4 className="text-white font-medium mb-2">Can I cancel my order?</h4>
            <p className="text-sm text-gray-400">
              Once confirmed on the blockchain, transactions are irreversible. Please review your order carefully before confirming.
            </p>
          </div>

          <div>
            <h4 className="text-white font-medium mb-2">What happens if my transaction fails?</h4>
            <p className="text-sm text-gray-400">
              Failed transactions will refund automatically. You may still pay gas fees, but no product charges will apply.
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
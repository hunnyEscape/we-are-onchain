// src/app/dashboard/components/sections/ProfileSection.tsx
'use client';

import React, { useState } from 'react';
import CyberCard from '../../../components/common/CyberCard';
import CyberButton from '../../../components/common/CyberButton';
import { UserProfile } from '../../../../../types/dashboard';
import { 
  User, 
  Wallet, 
  Trophy, 
  Calendar, 
  ShoppingBag,
  TrendingUp,
  Award,
  ExternalLink,
  Copy,
  Check
} from 'lucide-react';

const ProfileSection: React.FC = () => {
  const [copiedAddress, setCopiedAddress] = useState(false);

  // モックユーザーデータ
  const userProfile: UserProfile = {
    walletAddress: '0x1234567890123456789012345678901234567890',
    displayName: 'CryptoLifter42',
    totalSpent: 0.125,
    totalOrders: 3,
    rank: 42,
    badges: ['New Member', 'Early Adopter', 'Community Supporter'],
    joinDate: new Date('2024-03-15')
  };

  const orderHistory = [
    {
      id: 'order-001',
      date: new Date('2024-05-15'),
      product: 'Pepe Flavor Protein',
      quantity: 1,
      amount: 0.025,
      amountUSD: 89.99,
      status: 'Delivered',
      txHash: '0x789xyz...def456'
    },
    {
      id: 'order-002', 
      date: new Date('2024-04-28'),
      product: 'Pepe Flavor Protein',
      quantity: 2,
      amount: 0.05,
      amountUSD: 179.98,
      status: 'Delivered',
      txHash: '0xabc123...789def'
    },
    {
      id: 'order-003',
      date: new Date('2024-04-10'),
      product: 'Pepe Flavor Protein',
      quantity: 1,
      amount: 0.05,
      amountUSD: 189.99,
      status: 'Delivered',
      txHash: '0x456def...123abc'
    }
  ];

  const achievements = [
    { name: 'First Purchase', description: 'Made your first crypto purchase', earned: true },
    { name: 'Loyal Customer', description: 'Made 5+ purchases', earned: false, progress: 3 },
    { name: 'Community Champion', description: 'Active in Discord for 30 days', earned: true },
    { name: 'Whale Status', description: 'Spent over 1 ETH total', earned: false, progress: 0.125 }
  ];

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(userProfile.walletAddress);
    setCopiedAddress(true);
    setTimeout(() => setCopiedAddress(false), 2000);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      year: 'numeric',
      month: 'short', 
      day: 'numeric' 
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Delivered': return 'text-neonGreen';
      case 'Shipped': return 'text-neonOrange';
      case 'Processing': return 'text-yellow-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-heading font-bold text-white mb-2">
          Profile
        </h2>
        <p className="text-gray-400">
          Your Web3 protein journey and achievements
        </p>
      </div>

      {/* Profile Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Profile Card */}
        <CyberCard showEffects={false} className="lg:col-span-2">
          <div className="flex items-start space-x-6">
            {/* Avatar */}
            <div className="flex-shrink-0">
              <div className="w-20 h-20 bg-gradient-to-br from-neonGreen to-neonOrange rounded-full flex items-center justify-center">
                <User className="w-10 h-10 text-black" />
              </div>
            </div>

            {/* Profile Info */}
            <div className="flex-1">
              <h3 className="text-xl font-bold text-white mb-2">{userProfile.displayName}</h3>
              
              <div className="flex items-center space-x-2 mb-4">
                <Wallet className="w-4 h-4 text-gray-400" />
                <span className="font-mono text-sm text-gray-300">
                  {userProfile.walletAddress.slice(0, 6)}...{userProfile.walletAddress.slice(-4)}
                </span>
                <button
                  onClick={handleCopyAddress}
                  className="text-gray-400 hover:text-neonGreen transition-colors"
                >
                  {copiedAddress ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-400">Member Since</div>
                  <div className="text-white font-semibold">{formatDate(userProfile.joinDate)}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-400">Community Rank</div>
                  <div className="text-neonGreen font-semibold">#{userProfile.rank}</div>
                </div>
              </div>
            </div>
          </div>
        </CyberCard>

        {/* Stats Card */}
        <CyberCard title="Stats" showEffects={false}>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Total Spent</span>
              <div className="text-right">
                <div className="text-neonGreen font-bold">Ξ {userProfile.totalSpent}</div>
                <div className="text-xs text-gray-500">$420.25</div>
              </div>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Total Orders</span>
              <span className="text-white font-semibold">{userProfile.totalOrders}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Badges Earned</span>
              <span className="text-neonOrange font-semibold">{userProfile.badges.length}</span>
            </div>
          </div>
        </CyberCard>
      </div>

      {/* Badges */}
      <CyberCard title="Badges & Achievements" showEffects={false}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {userProfile.badges.map((badge, index) => (
            <div key={index} className="flex items-center space-x-3 p-3 border border-neonOrange/30 rounded-sm bg-neonOrange/5">
              <Award className="w-5 h-5 text-neonOrange" />
              <span className="text-white font-medium">{badge}</span>
            </div>
          ))}
        </div>
      </CyberCard>

      {/* Achievement Progress */}
      <CyberCard title="Achievement Progress" showEffects={false}>
        <div className="space-y-4">
          {achievements.map((achievement, index) => (
            <div key={index} className="flex items-center justify-between p-4 border border-dark-300 rounded-sm">
              <div className="flex items-center space-x-3">
                <Trophy className={`w-5 h-5 ${achievement.earned ? 'text-neonGreen' : 'text-gray-400'}`} />
                <div>
                  <div className="text-white font-medium">{achievement.name}</div>
                  <div className="text-sm text-gray-400">{achievement.description}</div>
                </div>
              </div>
              
              <div className="text-right">
                {achievement.earned ? (
                  <span className="text-neonGreen font-semibold">Earned</span>
                ) : (
                  <div>
                    <div className="text-sm text-gray-400">
                      Progress: {achievement.progress}/{achievement.name === 'Loyal Customer' ? '5' : '1'}
                    </div>
                    <div className="w-24 h-2 bg-dark-300 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-neonOrange transition-all duration-300"
                        style={{ 
                          width: `${achievement.name === 'Loyal Customer' 
                            ? (achievement.progress! / 5) * 100 
                            : (achievement.progress! / 1) * 100}%` 
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </CyberCard>

      {/* Order History */}
      <CyberCard title="Recent Orders" showEffects={false}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-dark-300">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Date</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Product</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Amount</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Status</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {orderHistory.map((order) => (
                <tr key={order.id} className="border-b border-dark-300/50 hover:bg-dark-200/30 transition-colors">
                  <td className="py-4 px-4 text-sm text-gray-300">{formatDate(order.date)}</td>
                  <td className="py-4 px-4">
                    <div>
                      <div className="text-white font-medium">{order.product}</div>
                      <div className="text-xs text-gray-400">Qty: {order.quantity}</div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div>
                      <div className="text-neonGreen font-bold">Ξ {order.amount}</div>
                      <div className="text-xs text-gray-400">${order.amountUSD}</div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <span className={`font-medium ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <CyberButton variant="outline" size="sm" className="flex items-center space-x-1">
                      <ExternalLink className="w-3 h-3" />
                      <span>View</span>
                    </CyberButton>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CyberCard>
    </div>
  );
};

export default ProfileSection;
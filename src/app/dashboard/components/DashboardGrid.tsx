// src/app/dashboard/components/DashboardGrid.tsx
'use client';

import React from 'react';
import DashboardCard from './DashboardCard';
import { SectionType } from '@/types/dashboard';
import { useCart } from '@/contexts/DashboardContext';
import { 
  ShoppingBag, 
  FileText, 
  CreditCard
} from 'lucide-react';

interface DashboardGridProps {
  onCardClick: (section: SectionType) => void;
}

const DashboardGrid: React.FC<DashboardGridProps> = ({ onCardClick }) => {
  const { getCartItemCount } = useCart();
  const cartItemCount = getCartItemCount();

  const dashboardCards = [
    {
      id: 'shop' as SectionType,
      title: 'Shop',
      description: 'Browse and purchase premium protein',
      icon: <ShoppingBag className="w-8 h-8 text-neonGreen" />,
      stats: '1 Product Available',
      badge: 'New'
    },
    {
      id: 'how-to-buy' as SectionType,
      title: 'How to Buy',
      description: 'Complete guide for crypto purchases',
      icon: <CreditCard className="w-8 h-8 text-neonOrange" />,
      stats: '5 Simple Steps'
    },
    {
      id: 'whitepaper' as SectionType,
      title: 'Whitepaper',
      description: 'Technical documentation and guides',
      icon: <FileText className="w-8 h-8 text-neonOrange" />,
      stats: '6 Sections'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {dashboardCards.map((card) => (
        <DashboardCard
          key={card.id}
          {...card}
          onClick={() => onCardClick(card.id)}
        />
      ))}
    </div>
  );
};

export default DashboardGrid;
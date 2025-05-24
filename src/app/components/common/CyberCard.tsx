// src/app/components/common/CyberCard.tsx
'use client';

import React from 'react';
import GridPattern from './GridPattern';

export interface CyberCardProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  stats?: string;
  badge?: string;
  onClick?: () => void;
  className?: string;
  variant?: 'default' | 'dashboard' | 'interactive';
  showEffects?: boolean;
  glowIntensity?: 'low' | 'medium' | 'high';
}

const CyberCard: React.FC<CyberCardProps> = ({
  children,
  title,
  description,
  stats,
  badge,
  onClick,
  className = '',
  variant = 'default',
  showEffects = true,
  glowIntensity = 'medium'
}) => {
  const baseClasses = `
    relative bg-gradient-to-t from-dark-100 to-black 
    border border-dark-300 rounded-sm overflow-hidden
    transition-all duration-300 ease-out
  `;

  const variantClasses = {
    default: 'p-6',
    dashboard: 'p-6 cursor-pointer hover:border-neonGreen hover:scale-[1.02]',
    interactive: 'p-4 cursor-pointer hover:border-neonGreen hover:shadow-lg hover:shadow-neonGreen/20'
  };

  const glowClasses = {
    low: 'hover:shadow-md hover:shadow-neonGreen/10',
    medium: 'hover:shadow-lg hover:shadow-neonGreen/20',
    high: 'hover:shadow-xl hover:shadow-neonGreen/30'
  };

  const handleClick = () => {
    if (onClick) {
      onClick();
    }
  };

  return (
    <div
      className={`
        ${baseClasses}
        ${variantClasses[variant]}
        ${glowClasses[glowIntensity]}
        ${className}
      `}
      onClick={handleClick}
    >
      {/* Background Effects */}
      {showEffects && (
        <>
          <GridPattern />
        </>
      )}

      {/* Content Container */}
      <div className="relative z-10">
        {/* Header */}
        {(title || badge) && (
          <div className="flex items-center justify-between mb-4">
            {title && (
              <h3 className="text-white font-heading font-semibold text-lg cyber-text-glitch">
                {title}
              </h3>
            )}
            {badge && (
              <span className="inline-block px-2 py-1 text-xs rounded-sm bg-neonGreen/10 text-neonGreen border border-neonGreen/30">
                {badge}
              </span>
            )}
          </div>
        )}

        {/* Description */}
        {description && (
          <p className="text-gray-400 text-sm mb-4 leading-relaxed">
            {description}
          </p>
        )}

        {/* Main Content */}
        <div className="mb-4">
          {children}
        </div>

        {/* Stats */}
        {stats && (
          <div className="text-xs text-gray-500 border-t border-dark-300 pt-3">
            {stats}
          </div>
        )}
      </div>

      {/* Hover Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-neonGreen/5 to-neonOrange/5 opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
    </div>
  );
};

export default CyberCard;
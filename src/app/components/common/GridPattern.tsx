// src/app/components/common/GridPattern.tsx
'use client';

import React from 'react';

export interface GridPatternProps {
  size?: number;
  opacity?: number;
  color?: string;
  className?: string;
  animated?: boolean;
}

const GridPattern: React.FC<GridPatternProps> = ({
  size = 50,
  opacity = 0.05,
  color = 'rgba(0, 255, 127, 0.1)',
  className = '',
  animated = false
}) => {
  const gridStyle: React.CSSProperties = {
    backgroundImage: `
      linear-gradient(${color} 1px, transparent 1px),
      linear-gradient(90deg, ${color} 1px, transparent 1px)
    `,
    backgroundSize: `${size}px ${size}px`,
    opacity,
  };

  const animatedStyle = animated
    ? {
        ...gridStyle,
        animation: 'gridPulse 4s ease-in-out infinite',
      }
    : gridStyle;

  return (
    <>
      <div
        className={`absolute inset-0 pointer-events-none ${className}`}
        style={animatedStyle}
      />
      
      {/* CSS アニメーション定義 */}
      {animated && (
        <style jsx>{`
          @keyframes gridPulse {
            0%, 100% {
              opacity: ${opacity};
            }
            50% {
              opacity: ${opacity * 2};
            }
          }
        `}</style>
      )}
    </>
  );
};

export default GridPattern;
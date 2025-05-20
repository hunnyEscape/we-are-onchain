'use client';
import React, { useEffect, useState } from 'react';
import styles from './SphereStyles.module.css';

interface ScrollProgressProps {
  scrollY: number;
  totalHeight: number;
  color?: string;
  showPercentage?: boolean;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

const ScrollProgress: React.FC<ScrollProgressProps> = ({
  scrollY,
  totalHeight,
  color = '#00ff9f',
  showPercentage = true,
  position = 'bottom'
}) => {
  const [progress, setProgress] = useState(0);
  
  useEffect(() => {
    // スクロール進行度の計算（0～100%）
    const calculatedProgress = Math.min((scrollY / totalHeight) * 100, 100);
    setProgress(calculatedProgress);
  }, [scrollY, totalHeight]);
  
  // 位置に基づいてスタイルを設定
  const getPositionStyle = () => {
    switch (position) {
      case 'top':
        return {
          top: 0,
          left: 0,
          width: `${progress}%`,
          height: '3px'
        };
      case 'bottom':
        return {
          bottom: 0,
          left: 0,
          width: `${progress}%`,
          height: '3px'
        };
      case 'left':
        return {
          top: 0,
          left: 0,
          width: '3px',
          height: `${progress}%`
        };
      case 'right':
        return {
          top: 0,
          right: 0,
          width: '3px',
          height: `${progress}%`
        };
      default:
        return {
          bottom: 0,
          left: 0,
          width: `${progress}%`,
          height: '3px'
        };
    }
  };
  
  const positionStyle = getPositionStyle();
  
  // パーセンテージテキストの位置調整
  const getPercentageStyle = () => {
    switch (position) {
      case 'top':
      case 'bottom':
        return {
          left: `${progress}%`,
          transform: 'translateX(-50%)',
          top: position === 'top' ? '10px' : 'auto',
          bottom: position === 'bottom' ? '10px' : 'auto'
        };
      case 'left':
      case 'right':
        return {
          top: `${progress}%`,
          transform: 'translateY(-50%)',
          left: position === 'left' ? '10px' : 'auto',
          right: position === 'right' ? '10px' : 'auto'
        };
      default:
        return {
          left: `${progress}%`,
          transform: 'translateX(-50%)',
          bottom: '10px'
        };
    }
  };
  
  return (
    <div className={styles.progressContainer}>
      <div 
        className={styles.progressBar}
        style={{
          ...positionStyle,
          backgroundColor: color,
          boxShadow: `0 0 10px ${color}`,
          position: 'fixed',
          zIndex: 1000
        }}
      />
      
      {showPercentage && (
        <div 
          className={styles.progressPercentage}
          style={{
            ...getPercentageStyle(),
            color,
            position: 'fixed',
            fontSize: '12px',
            fontWeight: 'bold',
            zIndex: 1000,
            textShadow: `0 0 5px ${color}`
          }}
        >
          {Math.round(progress)}%
        </div>
      )}
    </div>
  );
};

export default ScrollProgress;
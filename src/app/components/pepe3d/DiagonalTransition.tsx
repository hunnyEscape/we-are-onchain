// src/app/components/pepe3d/DiagonalTransition.tsx
import React, { useEffect, useRef, useState } from 'react';
import { useInView } from 'react-intersection-observer';
import StoryMessages from './StoryMessages';

interface DiagonalTransitionProps {
  scrollTriggerRef: React.RefObject<HTMLDivElement>;
  scrollHeight?: number;
  onTransitionComplete?: () => void;
}

const DiagonalTransition: React.FC<DiagonalTransitionProps> = ({ 
  scrollTriggerRef, 
  scrollHeight = 300,
  onTransitionComplete
}) => {
  // スクロール位置を追跡するための状態
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [startPosition, setStartPosition] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  
  // スクロールトリガーが表示されているかを検出
  const { ref: inViewRef, inView } = useInView({
    threshold: 0.1,
    triggerOnce: true
  });
  
  // スクロールハンドラー
  useEffect(() => {
    const handleScroll = () => {
      if (!isActive) return;
      
      const currentScroll = window.scrollY;
      const scrollRange = scrollHeight;
      
      // スクロール進行度を計算（0-1）
      let progress = (currentScroll - startPosition) / scrollRange;
      progress = Math.max(0, Math.min(1, progress));
      
      setScrollProgress(progress);
      
      // トランジションが完了したらコールバックを呼び出す
      if (progress >= 0.98 && !isCompleted) {
        setIsCompleted(true);
        if (onTransitionComplete) {
          onTransitionComplete();
        }
      }
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isActive, startPosition, scrollHeight, isCompleted, onTransitionComplete]);
  
  // トリガー要素が表示されたらトランジションをアクティブにする
  useEffect(() => {
    if (inView && !isActive) {
      console.log('Transition activated at scroll position:', window.scrollY);
      setIsActive(true);
      setStartPosition(window.scrollY);
    }
  }, [inView, isActive]);
  
  // デバッグ用スタイル
  const debugStyle = {
    position: 'fixed',
    top: '20px',
    right: '20px',
    background: 'rgba(0, 0, 0, 0.7)',
    color: 'white',
    padding: '10px',
    zIndex: 9999,
    fontSize: '12px'
  } as React.CSSProperties;
  
  return (
    <>
      {/* インビュー検出用の要素 */}
      <div ref={inViewRef} className="h-1 w-full" />
      
      {/* トランジションコンテナ */}
      <div 
        className="fixed top-0 left-0 w-full h-screen z-50 pointer-events-none"
        style={{ 
          visibility: isActive ? 'visible' : 'hidden'
        }}
      >
        {/* フル画面オーバーレイ */}
        <div 
          className="absolute top-0 left-0 w-full h-screen bg-black"
          style={{ 
            opacity: scrollProgress,
            transition: 'opacity 0.1s ease-out'
          }}
        />
      </div>
      
    </>
  );
};

export default DiagonalTransition;
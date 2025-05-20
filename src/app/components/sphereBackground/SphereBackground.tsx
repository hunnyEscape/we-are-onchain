'use client';
import React, { useRef, useState, useEffect } from 'react';
import styles from './SphereStyles.module.css';
import RotatingSphere from './RotatingSphere';
import StoryOverlay from './StoryOverlay';
import ScrollProgress from './ScrollProgress';

interface SphereBackgroundProps {
  backgroundImage?: string;
  sphereTexture?: string;
  wireframe?: boolean;
  color?: string;
  sphereSize?: number;
  showProgress?: boolean;
  progressColor?: string;
  progressPosition?: 'top' | 'bottom' | 'left' | 'right';
  customStoryData?: any[]; // StorySection[] 型は StoryOverlay から取得
}

const SphereBackground: React.FC<SphereBackgroundProps> = ({
  backgroundImage,
  sphereTexture,
  wireframe = false,
  color = '#00ff9f',
  sphereSize = 1.5,
  showProgress = true,
  progressColor = '#00ff9f',
  progressPosition = 'bottom',
  customStoryData
}) => {
  // スクロール関連の状態
  const [scrollY, setScrollY] = useState(0);
  const [rotationValue, setRotationValue] = useState(0);
  const [visibilityRatio, setVisibilityRatio] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [totalHeight, setTotalHeight] = useState(0);
  
  // 要素への参照
  const containerRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLDivElement>(null);
  
  // 初期化時に高さを設定
  useEffect(() => {
    if (sectionRef.current) {
      setTotalHeight(sectionRef.current.scrollHeight);
    }
  }, []);
  
  // スクロール位置に基づく計算
  const calculateValues = () => {
    if (!sectionRef.current) return;
    
    const sectionRect = sectionRef.current.getBoundingClientRect();
    const sectionTop = sectionRect.top;
    const sectionHeight = sectionRect.height;
    const viewportHeight = window.innerHeight;
    
    // セクションの総高さを更新
    setTotalHeight(sectionHeight);
    
    // 表示開始位置（画面下から徐々に表示）
    const appearThreshold = viewportHeight; 
    
    // 完全に表示される位置
    const fullyVisibleThreshold = viewportHeight / 2;
    
    // 消失開始位置（セクション終了の少し前から）
    const disappearStart = -(sectionHeight - viewportHeight * 2);
    
    // 表示比率の計算
    let ratio = 0;
    
    if (sectionTop <= appearThreshold && sectionTop >= fullyVisibleThreshold) {
      // 徐々に表示
      ratio = (appearThreshold - sectionTop) / (appearThreshold - fullyVisibleThreshold);
    } else if (sectionTop < fullyVisibleThreshold && sectionTop > disappearStart) {
      // 完全表示
      ratio = 1;
    } else if (sectionTop <= disappearStart) {
      // 徐々に消失
      const disappearProgress = Math.min(-(sectionTop - disappearStart) / viewportHeight, 1);
      ratio = 1 - disappearProgress;
    }
    
    // 値の設定
    setVisibilityRatio(Math.max(0, Math.min(1, ratio)));
    setIsVisible(ratio > 0);
    
    // 回転値の計算 - スクロール位置に基づいて回転
    // スクロール位置をラジアンに変換（複数回転するように乗数を調整）
    const scrollPosition = window.scrollY;
    const rotationSpeed = 0.001; // 回転速度調整
    setRotationValue(scrollPosition * rotationSpeed);
    setScrollY(scrollPosition);
  };
  
  // スクロールイベントの監視
  useEffect(() => {
    const handleScroll = () => {
      // スクロール位置が変わるたびに値を計算
      calculateValues();
    };
    
    // 初期計算
    calculateValues();
    
    // イベントリスナーの登録
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', calculateValues);
    
    return () => {
      // クリーンアップ
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', calculateValues);
    };
  }, []);
  
  return (
    <div ref={sectionRef} className={styles.storySection}>
      {/* スクロールプログレス表示 (オプション) */}
      {showProgress && (
        <ScrollProgress 
          scrollY={scrollY}
          totalHeight={totalHeight}
          color={progressColor}
          position={progressPosition}
        />
      )}
      
      {/* Sticky コンテナ - スクロールしても画面に固定される */}
      <div 
        ref={containerRef}
        className={styles.stickyContainer}
        style={{ 
          opacity: visibilityRatio,
          // visibility比率に応じてスケールを調整
          transform: `scale(${0.8 + visibilityRatio * 0.2})` 
        }}
      >
        {/* サイバーパンク風装飾ライン */}
        <div className={`${styles.decorLine} ${styles.decorLineTop}`}></div>
        <div className={`${styles.decorLine} ${styles.decorLineBottom}`}></div>
        
        {/* 球体表示エリア */}
        <div className={styles.sphereWrapper}>
          {isVisible && (
            <RotatingSphere
              rotationValue={rotationValue}
              backgroundImage={backgroundImage}
              sphereTexture={sphereTexture}
              wireframe={wireframe}
              color={color}
              size={sphereSize}
            />
          )}
        </div>
        
        {/* コンテンツオーバーレイ - ストーリーテキスト */}
        <div className={styles.overlayContent}>
          <StoryOverlay 
            scrollY={scrollY} 
            totalHeight={totalHeight}
            storyData={customStoryData}
          />
        </div>
      </div>
    </div>
  );
};

export default SphereBackground;
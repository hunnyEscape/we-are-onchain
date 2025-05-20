'use client';
import React, { useRef, useEffect, useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import styles from './ScrollingText.module.css';
import GlitchText from '../ui/GlitchText';
import { useGlitchEffect } from './GlitchEffects';

interface ScrollingTextProps {
  className?: string;
}

const ScrollingText: React.FC<ScrollingTextProps> = ({ className }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { glitchState, getGlitchStyle } = useGlitchEffect();
  
  // 画面のアスペクト比に基づいてスクロール速度を調整
  const [screenAspect, setScreenAspect] = useState(1);
  
  useEffect(() => {
    // 初期設定と画面サイズ変更時にアスペクト比を計算
    const updateAspectRatio = () => {
      setScreenAspect(window.innerWidth / window.innerHeight);
    };
    
    updateAspectRatio();
    window.addEventListener('resize', updateAspectRatio);
    
    return () => {
      window.removeEventListener('resize', updateAspectRatio);
    };
  }, []);
  
  // スクロール位置に基づくアニメーション用のスクロールトラッキング
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'end start']
  });
  
  // アスペクト比に基づいて移動距離を調整
  // 横長の画面なら長い距離を移動させる
  const endX = `-${180 + (screenAspect > 1 ? (screenAspect - 1) * 50 : 0)}%`;
  
  // 右から左へのアニメーション - スクロールに応じてX位置を変更
  const xPos = useTransform(scrollYProgress, [0, 1], ['120vw', endX]);
  
  // スクロールによるテキストの不透明度変化
  const opacity = useTransform(
    scrollYProgress, 
    [0, 0.2, 0.8, 1], 
    [0.2, 1, 1, 0.2]
  );
  
  // スケール変化 - スクロール中央部で少し拡大
  const scale = useTransform(
    scrollYProgress,
    [0, 0.5, 1],
    [0.95, 1.05, 0.95]
  );
  
  return (
    <div 
      ref={containerRef}
      className={`${styles.scrollContainer} ${className}`}
    >
      {/* 追加エフェクトレイヤー */}
      <div className={styles.textGlow} />
      <div className={styles.glitchBlocks} />
      <div className={styles.scanlines} />
      <div className={styles.noiseOverlay} />
      
      <motion.div
        style={{ 
          x: xPos, 
          opacity,
          scale,
          ...(glitchState.active ? getGlitchStyle() : {}) 
        }}
        className={`${styles.textContainer} text-4xl md:text-5xl lg:text-8xl font-bold py-8 px-4 z-10`}
      >
        <span className={`${styles.cyberText} text-neonGreen font-mono`}>
          <GlitchText 
            text='"ペペ味"スペシャルフレーバ' 
            glitchIntensity="medium"
            color="text-neonGreen"
          />
        </span>
        
        <span className="text-white mx-4">
          は、ただのプロテインではない。それは、ぺぺが紡ぐ
        </span>
        
        <span className={`${styles.rgbText} text-neonOrange`}>
          「勇気」
        </span>
        
        <span className="text-white mx-2">
          と
        </span>
        
        <span className={`${styles.rgbText} text-neonOrange`}>
          「ユーモア」
        </span>
        
        <span className="text-white ml-4">
          の物語。
        </span>
      </motion.div>
    </div>
  );
};

export default ScrollingText;

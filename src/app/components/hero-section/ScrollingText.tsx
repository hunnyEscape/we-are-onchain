'use client';
import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

interface ScrollingTextProps {
  className?: string;
}

const ScrollingText: React.FC<ScrollingTextProps> = ({ className }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // スクロール位置に基づくアニメーション用のスクロールトラッキング
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'end start']
  });
  
  // 右から左へのアニメーション - スクロールに応じてX位置を変更
  // 画面幅の100%から-100%へ移動（右から左へ完全に移動）
  const xPos = useTransform(scrollYProgress, [0, 1], ['100vw', '-100%']);
  
  return (
    <div 
      ref={containerRef}
      className={`h-screen flex items-center overflow-hidden bg-black ${className}`}
    >
      <motion.div
        style={{ x: xPos }}
        className="whitespace-nowrap text-4xl md:text-5xl lg:text-6xl font-bold py-4"
      >
        <span className="text-neonGreen font-mono">
          "ペペ味"スペシャルフレーバ
        </span>
        <span className="text-white mx-2">
          は、ただのプロテインではない。それは、ぺぺが紡ぐ
        </span>
        <span className="text-neonOrange">
          「勇気」
        </span>
        <span className="text-white mx-2">
          と
        </span>
        <span className="text-neonOrange">
          「ユーモア」
        </span>
        <span className="text-white ml-2">
          の物語。
        </span>
      </motion.div>
    </div>
  );
};

export default ScrollingText;
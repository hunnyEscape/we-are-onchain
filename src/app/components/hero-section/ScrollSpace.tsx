'use client';
import React from 'react';
import { motion } from 'framer-motion';

// スクロールスペースを作るだけのコンポーネント
const ScrollSpace: React.FC = () => {
  return (
    <div className="h-[200vh] bg-gradient-to-b from-black to-gray-900 relative">
      {/* スクロールガイド - ユーザーに下にスクロールするよう促す */}
      <motion.div 
        className="absolute top-10 left-1/2 transform -translate-x-1/2 text-neonGreen text-center"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.8, repeat: Infinity, repeatType: "reverse" }}
      >
        <div className="text-xl mb-2">↓</div>
        <div className="text-sm font-mono">SCROLL DOWN</div>
      </motion.div>
      
      {/* 途中にちょっとした装飾要素を追加 */}
      <div className="absolute bottom-1/4 left-1/2 transform -translate-x-1/2 w-full text-center">
        <div className="inline-block border border-neonGreen px-8 py-3 text-white font-mono">
          We Are <span className="text-neonOrange">On-Chain</span>
        </div>
      </div>
    </div>
  );
};

export default ScrollSpace;
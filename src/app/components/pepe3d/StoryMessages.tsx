// src/app/components/pepe3d/StoryMessages.tsx
import React from 'react';
import { motion } from 'framer-motion';

interface StoryMessagesProps {
  progress: number; // スクロール進行度 (0-1)
}

const StoryMessages: React.FC<StoryMessagesProps> = ({ progress }) => {
  // Pepeの冒険ストーリーメッセージ
  const storyLines = [
    "PEPE embarks on a cybernetic journey beyond the digital realm...",
    "The neon grid fades as he ventures into the unknown void...",
    "Seeking the legendary Protein Powder of the Ancients...",
    "His green silhouette dissolves into the fabric of cyberspace...",
    "Transcending dimensions, PEPE's consciousness expands...",
    "The mission continues in an alternate reality...",
    "Follow PEPE as he explores the cosmic sphere of existence..."
  ];
  
  // 各メッセージの表示タイミングを計算
  const calculateVisibility = (index: number) => {
    // 進行度に基づいて表示タイミングを調整（より早めに表示開始）
    const startPoint = 0.05 + (index * 0.06); 
    const endPoint = startPoint + 0.2;
    
    // 可視性の計算（0-1）
    if (progress < startPoint) return 0;
    if (progress > endPoint) return 1;
    return (progress - startPoint) / (endPoint - startPoint);
  };
  
  // X位置の計算
  const calculateX = (index: number) => {
    const visibility = calculateVisibility(index);
    // 右から左へのアニメーション（100% -> -100%）
    // より早くメッセージが見えるように調整
    return 80 - (visibility * 160);
  };
  
  return (
    <div className="absolute top-[10%] left-[5%] w-[80%] h-[80%] text-[#00ff00] font-mono z-50 flex flex-col justify-start items-start overflow-hidden pointer-events-none">
      {storyLines.map((line, index) => (
        <motion.div
          key={index}
          className="mb-6 cyber-text-glow text-lg md:text-xl whitespace-nowrap"
          style={{
            opacity: calculateVisibility(index),
            transform: `translateX(${calculateX(index)}%)`,
          }}
          animate={{
            opacity: calculateVisibility(index),
            x: `${calculateX(index)}%`,
          }}
          transition={{
            duration: 0.2,
          }}
        >
          {line}
        </motion.div>
      ))}
    </div>
  );
};

export default StoryMessages;
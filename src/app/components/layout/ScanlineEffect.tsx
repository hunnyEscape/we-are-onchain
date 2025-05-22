// src/app/components/ui/ScanlineEffect.tsx
import React from 'react';

export const ScanlineEffect: React.FC = () => {
  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 z-10 h-full w-full bg-transparent opacity-10">
        {/* スキャンライン効果 */}
        <div className="absolute left-0 top-0 h-[1px] w-full animate-scanline bg-neonGreen opacity-50 shadow-[0_0_5px_#00FF7F]"></div>
        
        {/* ノイズオーバーレイ */}
        <div 
          className="absolute inset-0 bg-repeat opacity-5"
          style={{ 
            backgroundImage: "url('/images/noisy.webp')",
            mixBlendMode: "overlay"
          }}
        ></div>
      </div>
    </div>
  );
};

export default ScanlineEffect;
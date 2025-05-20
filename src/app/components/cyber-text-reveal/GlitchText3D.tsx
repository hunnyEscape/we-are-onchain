import { useEffect, useRef } from 'react';
import { MotionValue } from 'framer-motion';
import styles from './CyberTextReveal.module.css';

interface TextPart {
  text: string;
  color: string;
  isHighlight: boolean;
}

interface GlitchText3DProps {
  textParts: TextPart[];
  progress: MotionValue<number>;
  noiseIntensity: MotionValue<number>;
  isMobile: boolean;
}

const GlitchText3D: React.FC<GlitchText3DProps> = ({
  textParts,
  progress,
  noiseIntensity,
  isMobile
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // スクロール進行状況の変化をログに記録
  useEffect(() => {
    const unsubscribe = progress.onChange((value) => {
      console.log('テキスト進行状況変化:', value);
      // 進行に伴い強制的に再レンダリング
      if (containerRef.current) {
        containerRef.current.style.opacity = String(Math.max(0.1, value));
      }
    });
    
    return () => unsubscribe();
  }, [progress]);
  
  // マウス動きに対する反応
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const mouseX = e.clientX;
    const mouseY = e.clientY;
    
    // マウス位置からの相対的な移動量を計算
    const moveX = (mouseX - centerX) / 50;
    const moveY = (mouseY - centerY) / 50;
    
    if (containerRef.current) {
      containerRef.current.style.transform = `
        rotateY(${moveX}deg) 
        rotateX(${-moveY}deg)
        translateZ(0)
      `;
    }
  };
  
  // マウス移動終了時の挙動
  const handleMouseLeave = () => {
    if (!containerRef.current) return;
    
    if (containerRef.current) {
      containerRef.current.style.transform = 'rotateY(0deg) rotateX(0deg) translateZ(0)';
    }
  };
  
  // 現在のプログレス値を取得
  const currentProgress = progress.get();
  const currentNoiseIntensity = noiseIntensity.get();
  
  // デバッグ用の表示を追加
  console.log('描画時のテキスト進行状況:', currentProgress);
  console.log('描画時のノイズ強度:', currentNoiseIntensity);
  
  return (
    <div
      ref={containerRef}
      className={styles.glitchTextContainer}
      style={{
        transform: `perspective(1000px) rotateX(${25 - currentProgress * 25}deg) translateZ(${-200 + currentProgress * 200}px)`,
        opacity: Math.max(0.1, currentProgress),
        transition: 'transform 0.3s ease-out',
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <div className={styles.textWrapper}>
        {textParts.map((part, index) => {
          // パーツごとの遅延を計算
          const delay = index * 0.1;
          // 進行状況を考慮したパーツの表示タイミング
          const partProgress = Math.max(0, (currentProgress - delay) * 1.2);
          
          // パーツのスタイルを計算
          const partOpacity = Math.min(1, partProgress * 2);
          const partScale = 0.5 + partProgress * 0.5;
          
          // テキスト要素のクラスを決定
          const textClass = `
            ${styles.textElement} 
            ${part.isHighlight ? styles.textHighlight : ''}
            ${currentNoiseIntensity > 0.3 ? styles.rgbSplit : ''}
          `;
          
          return (
            <div
              key={index}
              className={textClass}
              style={{
                color: part.color,
                opacity: partOpacity,
                transform: `scale(${partScale})`,
                display: 'inline-block',
                fontSize: part.isHighlight 
                  ? (isMobile ? '1.5rem' : '2.5rem') 
                  : (isMobile ? '1.2rem' : '2rem'),
                marginRight: '0.5rem',
                textShadow: part.isHighlight 
                  ? (part.color === '#5CFF5C' ? 'var(--text-shadow-glow)' : 'var(--text-glow-orange)')
                  : 'none',
              }}
              data-text={part.text}
            >
              {/* テキストが確実に表示されるようにする */}
              <span style={{ position: 'relative', zIndex: 10 }}>{part.text}</span>
            </div>
          );
        })}
      </div>
      
      {/* デバッグ用のインジケーター */}
      <div style={{ position: 'absolute', top: 0, left: 0, background: 'rgba(255,255,255,0.1)', padding: '5px', fontSize: '10px', color: 'white', zIndex: 100 }}>
        Progress: {currentProgress.toFixed(2)}, Noise: {currentNoiseIntensity.toFixed(2)}
      </div>
    </div>
  );
};

export default GlitchText3D;
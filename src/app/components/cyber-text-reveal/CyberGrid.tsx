import { useRef, useEffect } from 'react';
import { MotionValue } from 'framer-motion';
import styles from './CyberTextReveal.module.css';

interface CyberGridProps {
  progress: MotionValue<number>;
}

const CyberGrid: React.FC<CyberGridProps> = ({ progress }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  
  // キャンバスのリサイズ
  const resizeCanvas = () => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    // リサイズ後にグリッドを再描画
    drawGrid();
  };
  
  // グリッドの描画
  const drawGrid = () => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // キャンバスをクリア
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 現在のスクロール進行状況を取得
    const currentProgress = progress.get();
    
    // 進行状況に応じたグリッドのZ軸オフセットを計算
    const zOffset = (1 - currentProgress) * 500;
    
    // グリッド線の濃さをスクロール進行状況に基づいて調整
    const gridOpacity = 0.05 + (currentProgress * 0.1);
    
    // 3Dグリッドの描画
    ctx.strokeStyle = `rgba(92, 255, 92, ${gridOpacity})`;
    ctx.lineWidth = 1;
    
    // 水平グリッド線
    const horizonY = canvas.height / 2;
    const gridSize = 50; // グリッドのセルサイズ
    const gridCount = 20; // グリッド線の数
    
    // パースペクティブ効果のための消失点
    const vanishPointX = canvas.width / 2;
    const vanishPointY = horizonY;
    
    // 水平グリッド線
    for (let i = -gridCount; i <= gridCount; i++) {
      const y = horizonY + i * gridSize;
      
      // スクロール進行に応じてグリッド線をZ軸方向に移動
      const scaleFactor = 1 - Math.min(1, Math.abs(y - horizonY) / (canvas.height / 2));
      const zScaleFactor = Math.max(0.1, scaleFactor - (zOffset / 1000));
      
      // Z軸に応じた透明度の調整
      ctx.globalAlpha = Math.max(0.1, zScaleFactor) * gridOpacity * 2;
      
      ctx.beginPath();
      
      // 左端の点
      const leftX = 0;
      const leftY = horizonY + (y - horizonY) * zScaleFactor;
      
      // 右端の点
      const rightX = canvas.width;
      const rightY = leftY;
      
      ctx.moveTo(leftX, leftY);
      ctx.lineTo(rightX, rightY);
      ctx.stroke();
    }
    
    // 垂直グリッド線
    for (let i = -gridCount; i <= gridCount; i++) {
      const x = vanishPointX + i * gridSize;
      
      // スクロール進行に応じてグリッド線をZ軸方向に移動
      const scaleFactor = 1 - Math.min(1, Math.abs(x - vanishPointX) / (canvas.width / 2));
      const zScaleFactor = Math.max(0.1, scaleFactor - (zOffset / 1000));
      
      // Z軸に応じた透明度の調整
      ctx.globalAlpha = Math.max(0.1, zScaleFactor) * gridOpacity * 2;
      
      ctx.beginPath();
      
      // 上端の点
      const topX = vanishPointX + (x - vanishPointX) * zScaleFactor;
      const topY = 0;
      
      // 下端の点
      const bottomX = topX;
      const bottomY = canvas.height;
      
      ctx.moveTo(topX, topY);
      ctx.lineTo(bottomX, bottomY);
      ctx.stroke();
    }
    
    // 特殊効果: 消失点からのライン
    if (currentProgress > 0.4) {
      const glowIntensity = (currentProgress - 0.4) * 2;
      
      ctx.globalAlpha = glowIntensity * 0.3;
      ctx.strokeStyle = `rgba(92, 255, 92, ${glowIntensity * 0.5})`;
      ctx.lineWidth = 2;
      
      // 放射状のライン
      const rayCount = 12;
      for (let i = 0; i < rayCount; i++) {
        const angle = (i / rayCount) * Math.PI * 2;
        const rayLength = canvas.width * 0.8 * glowIntensity;
        
        const endX = vanishPointX + Math.cos(angle) * rayLength;
        const endY = vanishPointY + Math.sin(angle) * rayLength;
        
        ctx.beginPath();
        ctx.moveTo(vanishPointX, vanishPointY);
        ctx.lineTo(endX, endY);
        ctx.stroke();
      }
    }
    
    // 進行状況に応じたアニメーション更新
    animationRef.current = requestAnimationFrame(drawGrid);
  };
  
  useEffect(() => {
    // キャンバスの初期化とリサイズイベントの設定
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // アニメーションの開始
    drawGrid();
    
    return () => {
      // クリーンアップ
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationRef.current);
    };
  }, []);
  
  return (
    <canvas
      ref={canvasRef}
      className={styles.cyberGrid}
    />
  );
};

export default CyberGrid;
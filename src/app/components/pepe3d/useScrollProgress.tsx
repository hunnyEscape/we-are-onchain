// src/app/components/pepe3d/useScrollProgress.tsx
import { useState, useEffect } from 'react';

interface ScrollProgressOptions {
  start?: number; // スクロール開始位置（px）
  end?: number;   // スクロール終了位置（px）
  threshold?: number; // 境界値（0-1）
}

/**
 * スクロール進行状況を追跡するカスタムフック
 * @param options スクロール進行のオプション
 * @returns 0から1の間の進行度
 */
const useScrollProgress = (options: ScrollProgressOptions = {}) => {
  const { start = 0, end, threshold = 0 } = options;
  const [progress, setProgress] = useState(0);
  
  useEffect(() => {
    // スクロールハンドラー
    const handleScroll = () => {
      // 現在のスクロール位置
      const scrollY = window.scrollY;
      // ドキュメントの高さ
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      
      // 終了位置がセットされていれば使用、そうでなければドキュメントの高さを使用
      const scrollEnd = end !== undefined ? end : docHeight;
      
      // スクロール進行度の計算（0-1の範囲）
      let calculatedProgress = (scrollY - start) / (scrollEnd - start);
      
      // 最小値と最大値を制限
      calculatedProgress = Math.max(0, Math.min(1, calculatedProgress));
      
      // しきい値を超えたらのみ進行
      if (calculatedProgress >= threshold) {
        setProgress(calculatedProgress);
      } else {
        setProgress(0);
      }
    };
    
    // スクロールイベントリスナーの登録
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    // 初期読み込み時にもハンドラを実行
    handleScroll();
    
    // クリーンアップ関数
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [start, end, threshold]);
  
  return progress;
};

export default useScrollProgress;
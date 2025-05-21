'use client';

import { Suspense, useState, useEffect, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { ScrollControls, Preload, Environment, useScroll } from '@react-three/drei';
import { imageFiles, SCROLL_SETTINGS } from './utils/constants';
import { preloadImages } from './utils/imageLoader';
import ScrollableImages from './ScrollableImages';
import GalleryTypography from './GalleryTypography';

interface PepeGalleryProps {
  className?: string;
}

// スクロール進行状況を表示するコンポーネント
const ScrollProgressBar: React.FC<{ progress: number }> = ({ progress }) => (
  <div 
    className="fixed top-0 left-0 h-1 bg-gradient-to-r from-gray-200 to-gray-500 z-50 transition-all duration-300 ease-out"
    style={{ width: `${progress * 100}%` }}
  />
);

const PepeGallery: React.FC<PepeGalleryProps> = ({ className = '' }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [scrollProgress, setScrollProgress] = useState(0);

  // コンポーネントマウント時に画像を事前読み込み
  useEffect(() => {
    const loadImages = async () => {
      try {
        await preloadImages(imageFiles);
        setIsLoading(false);
      } catch (error) {
        console.error('Failed to preload images:', error);
        setIsLoading(false);
      }
    };

    loadImages();
  }, []);

  // スクロール進行状況を更新するコールバック
  const handleScroll = useCallback((progress: number) => {
    setScrollProgress(progress);
  }, []);

  // スクロール進行状況を監視するコンポーネント
  const ScrollObserver = () => {
    const scroll = useScroll();
    
    useEffect(() => {
      // スクロールオフセットの変更を監視する関数
      const onScroll = () => {
        handleScroll(scroll.offset);
      };
      
      // スクロールイベントのリスナーを追加
      const scrollElement = scroll.el;
      if (scrollElement) {
        scrollElement.addEventListener('scroll', onScroll);
      }
      
      // クリーンアップ関数
      return () => {
        if (scrollElement) {
          scrollElement.removeEventListener('scroll', onScroll);
        }
      };
    }, [scroll]);
    
    return null;
  };

  return (
    <div className={`w-full h-screen relative overflow-hidden ${className}`}>
      {/* ローディング状態の表示 */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-80 z-50">
          <div className="text-white text-2xl">Loading Gallery...</div>
        </div>
      )}
      
      {/* スクロール進行状況バー */}
      <ScrollProgressBar progress={scrollProgress} />
      
      <Canvas
        camera={{ position: [0, 0, 15], fov: 15 }}
        className="w-full h-full"
        gl={{ antialias: true, alpha: true }}
        dpr={[1, 2]} // 解像度の設定（標準〜高解像度デバイス）
      >
        <color attach="background" args={['#d8d7d7']} />
        
        <Suspense fallback={null}>
          <Environment preset="city" />
          
          <ScrollControls
            damping={SCROLL_SETTINGS.damping}
            pages={SCROLL_SETTINGS.pages}
            distance={SCROLL_SETTINGS.distance}
          >
            {/* スクロール可能なコンテンツ */}
            <ScrollableImages />
            <GalleryTypography />
            <ScrollObserver />
            
            {/* 画像の事前読み込み対策 */}
            <Preload all />
          </ScrollControls>
        </Suspense>
      </Canvas>
      
      {/* オーバーレイ情報 */}
      <div className="absolute bottom-4 left-4 text-black text-sm opacity-70 pointer-events-none">
        Pepe Gallery Collection
      </div>
      <div className="absolute bottom-4 right-4 text-black text-sm opacity-70 pointer-events-none">
        Scroll to explore
      </div>
    </div>
  );
};

export default PepeGallery;
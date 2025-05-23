// src/app/components/floating-images-fix/FloatingImagesFixSection.tsx

'use client';

import React from 'react';
import { useVisibilityControl } from '../../hooks/useVisibilityControl';
import { useCanvasControl } from '../../hooks/useCanvasControl';
import FloatingImagesFixCanvas from './FloatingImagesFixCanvas';
import CyberScrollMessages from './cyber-scroll-messages';

/**
 * 可視性制御が統合されたFloatingImagesFixSection
 * 35枚の画像による最も重い3D処理を最適化
 */
const FloatingImagesFixSection: React.FC = () => {
  // 可視性制御を一時的に無効化してデバッグ
  const elementRef = React.useRef<HTMLDivElement>(null);
  
  // 簡単なステート管理に変更
  const [debugInfo, setDebugInfo] = React.useState({
    state: 'visible',
    ratio: 1.0,
    frameloop: 'always'
  });

  // 可視性制御フックを一時的にコメントアウト
  // const {
  //   visibilityInfo,
  //   canvasState,
  //   elementRef,
  //   controls
  // } = useVisibilityControl('floating-images-section', 'floating-images', {
  //   // FloatingImages専用の最適化設定
  //   rootMargin: '400px', // 最も早い事前準備
  //   threshold: [0, 0.1, 0.25, 0.5, 0.75, 1.0],
  //   debounceMs: 25, // 細かい制御
  //   memoryReleaseDelay: 3 * 60 * 1000, // 3分でメモリ解放
  // });

  // Canvas制御フックも一時的にコメントアウト
  // const {
  //   canvasState: canvasControlState,
  //   setFrameloop,
  //   startAnimation,
  //   stopAnimation,
  //   performanceStats
  // } = useCanvasControl('floating-images-canvas', {
  //   initialFrameloop: 'never',
  //   enableFPSLimit: true,
  //   targetFPS: 60,
  //   enableMemoryMonitoring: true,
  // });

  // 状態に応じたレンダリング最適化 - デバッグのため一時的に常時表示
  const shouldRenderCanvas = true;
  const shouldRenderMessages = true; // メッセージを再有効化

  return (
    <>
      <div className='w-full relative h-[50vh] bg-black' />
      
      <section
        ref={elementRef}
        className="w-screen h-[800vh] relative overflow-hidden bg-black floating-images-fix-section"
        id="floating-images-fix-section"
        data-visibility-state={debugInfo.state}
        data-canvas-priority="5"
      >
        <div className="w-screen h-full sticky top-0 left-0 pointer-events-none z-10">
          {/* グラデーションオーバーレイ - 常時表示 */}
          <div className="absolute top-0 left-0 w-full h-[100vh] z-20
                  bg-gradient-to-b from-black via-black/40 to-black/0
                  pointer-events-none"
          />
          
          {/* モバイル用背景画像 - 常時表示 */}
          <div
            className="absolute inset-0 z-10 block sm:hidden bg-center bg-cover"
            style={{
              backgroundImage: `url(${process.env.NEXT_PUBLIC_CLOUDFRONT_URL}/pepe/garally_small2.webp)`
            }}
          />

          {/* 3D Canvas - Suspense で包む */}
          {shouldRenderCanvas && (
            <React.Suspense fallback={
              <div className="absolute inset-0 flex items-center justify-center text-white">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neonGreen mx-auto mb-4"></div>
                  <div>Loading 3D Gallery...</div>
                </div>
              </div>
            }>
              <FloatingImagesFixCanvas
                visibilityState="visible"
                intersectionRatio={1.0}
                canvasFrameloop="always"
                isAnimating={true}
                priority={5}
              />
            </React.Suspense>
          )}

          {/* サイバーメッセージ - 再有効化 */}
          {shouldRenderMessages && <CyberScrollMessages />}
          
          {/* 下部グラデーション - 常時表示 */}
          <div className="absolute bottom-0 left-0 w-full h-[100vh] z-20
                  bg-gradient-to-b from-black/0 via-black/40 to-black
                  pointer-events-none"
          />
        </div>

        {/* デバッグ情報表示（開発環境のみ） - 一時的に簡略化 */}
        {process.env.NODE_ENV === 'development' && (
          <div className="fixed top-4 right-4 bg-black/80 text-green-400 p-4 rounded-lg font-mono text-xs z-50 max-w-xs">
            <div className="text-white font-bold mb-2">FloatingImages Debug (Simplified)</div>
            <div>State: <span className="text-yellow-400">{debugInfo.state}</span></div>
            <div>Ratio: <span className="text-blue-400">{debugInfo.ratio}</span></div>
            <div>Frameloop: <span className="text-green-400">{debugInfo.frameloop}</span></div>
            <div className="mt-2 text-xs text-gray-400">
              Canvas: {shouldRenderCanvas ? 'Active' : 'Hidden'}<br/>
              Messages: {shouldRenderMessages ? 'Active' : 'Hidden'}
            </div>
          </div>
        )}
      </section>
      
      <div className='w-full relative h-[150vh] bg-black' />
    </>
  );
};

export default FloatingImagesFixSection;
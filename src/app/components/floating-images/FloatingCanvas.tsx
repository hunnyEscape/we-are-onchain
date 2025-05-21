'use client';

import { useRef, useEffect, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { FloatingImage } from './FloatingImage';
import { imageFiles } from './constants';
import { FloatingCanvasProps, ScrollState } from './types';

export const FloatingCanvas = ({ scrollY = 0 }: FloatingCanvasProps) => {
  const scrollRef = useRef<ScrollState>({
    current: 0,
    target: 0,
    ease: 0.05,
  });
  const { viewport } = useThree();
  const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 });
  
  // ビューポートサイズの更新
  useEffect(() => {
    setViewportSize({
      width: viewport.width,
      height: viewport.height,
    });
  }, [viewport.width, viewport.height]);

  // スクロール位置の更新とアニメーション
  useFrame(() => {
    // 代わりにwindowのスクロール位置を使用
    if (typeof window !== 'undefined') {
      const scrollY = window.scrollY / window.innerHeight; // 正規化されたスクロール位置
      scrollRef.current.target = scrollY;
      scrollRef.current.current += (scrollRef.current.target - scrollRef.current.current) * scrollRef.current.ease;
    }
  });

  // ランダムな位置を生成する関数 - より良い分布のために調整
  const getRandomPosition = (index: number) => {
    // 画面幅を均等に分割し、より広範囲に配置
    const columns = 10; // 横の分割数を増やす
    const columnIndex = index % columns;
    const columnWidth = viewport.width / columns;
    
    // 各列の中央を基準に、ランダムなオフセットを追加
    const baseX = columnIndex * columnWidth - viewport.width / 2 + columnWidth / 2;
    const randomX = baseX + (Math.random() - 0.5) * columnWidth * 0.8;
    
    // スタート位置を画面外のさらに下に
    const startY = -viewport.height - 5 - Math.random() * 20;
    
    return [randomX, startY];
  };

  return (
    <>
      {/* 背景のグラデーション効果 */}
      <mesh position={[0, 0, -10]}>
        <planeGeometry args={[100, 100]} />
        <meshBasicMaterial color="black" transparent opacity={1.0} />
      </mesh>

      {/* 画像要素の生成 - より多くの画像を表示 */}
      {imageFiles.map((image, index) => {
        const [randomX, startY] = getRandomPosition(index);
        // 初期遅延をランダム化して、一斉に表示されないようにする
        const delay = Math.random() * 5000; // 0〜5秒のランダム遅延
        
        return (
          <FloatingImage
            key={`${image.id}-${index}`}
            imageUrl={image.path}
            size={image.size}
            index={index}
            initialDelay={delay}
          />
        );
      })}
      
      {/* 環境光 - 明るさを上げる */}
      <ambientLight intensity={0.8} />
      
      {/* スポットライト効果 - 強度を上げる */}
      <spotLight
        position={[0, 10, 10]}
        angle={0.5}
        penumbra={1}
        intensity={1.0}
        castShadow
      />
    </>
  );
};
'use client';

import { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useScroll, Image, Scroll } from '@react-three/drei';
import { imageFiles } from './constants';

// サイズに基づいたスケール調整
const getScaleFromSize = (size) => {
  switch (size) {
    case 'S': return [1.2, 1.2, 1];
    case 'M': return [1.8, 1.8, 1];
    case 'L': return [2.4, 2.4, 1];
    default: return [1.5, 1.5, 1];
  }
};

// 画像の深度を決定
const getZPosition = (index, size) => {
  const baseZ = {
    'S': 0,
    'M': 3,
    'L': 6
  }[size] || 0;
  
  // インデックスによる微調整で重なりを防止
  return baseZ + (index % 3) * 1.5;
};

const FloatingImages = () => {
  const group = useRef();
  const scroll = useScroll();
  const { viewport, size } = useThree();
  const { width, height } = viewport;
  
  // 画像の初期配置を計算
  const getPosition = (index, total) => {
    // 画面を格子状に分割して配置位置を計算
    const cols = 6;
    const rows = Math.ceil(total / cols);
    
    const col = index % cols;
    const row = Math.floor(index / cols);
    
    // スクリーン全体に均等に分布
    const x = (col / cols) * width * 1.5 - width * 0.75;
    const y = (row / rows) * height * 1.2 - height * 0.6;
    
    // ランダム性を追加
    const randomX = (Math.random() - 0.5) * width * 0.2;
    const randomY = (Math.random() - 0.5) * height * 0.2;
    
    return [x + randomX, y + randomY];
  };
  
  // スクロールに基づいたアニメーション
  useFrame(() => {
    if (!group.current) return;
    
    const scrollOffset = scroll.offset;
    
    // 各画像要素にスクロールベースのアニメーションを適用
    group.current.children.forEach((child, index) => {
      // 位置の更新
      const moveSpeed = 0.5 + (index % 3) * 0.1; // 画像ごとに微妙に速度を変える
      child.position.y += scrollOffset * moveSpeed;
      
      // 一定の高さを超えたら下に戻す（無限スクロールエフェクト）
      if (child.position.y > height * 1.5) {
        child.position.y = -height * 1.5;
        child.position.x = getPosition(index, imageFiles.length)[0];
      }
      
      // 回転の更新
      child.rotation.z += 0.001 * (index % 2 === 0 ? 1 : -1);
      
      // 拡大率の微調整
      const scale = getScaleFromSize(imageFiles[index % imageFiles.length].size);
      const pulseScale = 1 + Math.sin(Date.now() * 0.001 + index) * 0.02;
      child.scale.x = scale[0] * pulseScale;
      child.scale.y = scale[1] * pulseScale;
    });
  });
  
  // CDN_URLを取得
  const CDN_URL = process.env.NEXT_PUBLIC_CLOUDFRONT_URL || '';
  
  return (
    <Scroll>
      <group ref={group}>
        {imageFiles.map((image, index) => {
          const [x, y] = getPosition(index, imageFiles.length);
          const z = getZPosition(index, image.size);
          const scale = getScaleFromSize(image.size);
          
          // CDN URLから画像パスを構築
          const imagePath = `${CDN_URL}/pepe/${image.filename}`;
          
          return (
            <Image 
              key={image.id}
              url={imagePath}
              position={[x, y, z]}
              scale={scale}
              transparent
              opacity={0.9}
              rotation={[0, 0, (Math.random() - 0.5) * 0.2]}
            />
          );
        })}
      </group>
    </Scroll>
  );
};

export default FloatingImages;
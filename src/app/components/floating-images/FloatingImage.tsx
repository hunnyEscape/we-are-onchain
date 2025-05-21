'use client';

import { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import { FloatingImageProps, FloatingObject } from './types';
import { animationConfig } from './constants';

export const FloatingImage = ({ 
  imageUrl, 
  size, 
  index,
  initialDelay = 0 
}: FloatingImageProps) => {
  const meshRef = useRef<FloatingObject>();
  const texture = useTexture(imageUrl);
  const [aspectRatio, setAspectRatio] = useState(1);
  const [started, setStarted] = useState(false);
  
  // テクスチャがロードされたらアスペクト比を設定
  useEffect(() => {
    if (texture && texture.image) {
      const ratio = texture.image.width / texture.image.height;
      setAspectRatio(ratio);
    }
  }, [texture]);
  
  // サイズ設定に基づくスケールファクター
  const scaleFactor = {
    S: 2.0,   // 小さいサイズを大きく
    M: 3.0,   // 中サイズをさらに大きく
    L: 4.0    // 大サイズを特に大きく
  }[size];
  
  // アニメーション速度 - サイズに応じて調整
  const speedFactor = {
    S: 0.05,   // 小さい画像は速く
    M: 0.03,   // 中サイズは中程度
    L: 0.02    // 大サイズはゆっくり
  }[size];
  
  // アニメーション開始タイマー
  useEffect(() => {
    const timer = setTimeout(() => {
      setStarted(true);
    }, initialDelay);
    
    return () => clearTimeout(timer);
  }, [initialDelay]);
  
  // 初期位置 - 画面外から
  const startY = -20 - Math.random() * 10;
  const randomX = (Math.random() - 0.5) * 30; // 広い範囲に分散
  
  // アニメーション状態
  const animState = useRef({
    y: startY,
    x: randomX,
    rotZ: Math.random() * Math.PI * 2, // ランダムな初期回転
    speed: speedFactor * (0.8 + Math.random() * 0.4) // 速度にランダム性を追加
  });
  
  // メッシュ更新
  useFrame((_, delta) => {
    if (!meshRef.current || !started) return;
    
    // 位置の更新（下から上へ）
    animState.current.y += animState.current.speed;
    
    // 左右の揺れ
    const swayAmount = Math.sin(animState.current.y * 0.2) * 0.5;
    
    // 回転の更新
    animState.current.rotZ += delta * 0.1 * (Math.random() * 0.5 + 0.5);
    
    // メッシュの更新
    meshRef.current.position.set(
      animState.current.x + swayAmount, 
      animState.current.y, 
      size === 'S' ? -2 : size === 'M' ? 0 : 2 // 奥行きの設定
    );
    
    meshRef.current.rotation.z = animState.current.rotZ;
    
    // スケールの設定 - アスペクト比を考慮
    meshRef.current.scale.set(
      scaleFactor * aspectRatio, 
      scaleFactor, 
      1
    );
    
    // 透明度 - 画面の端でフェードアウト
    if (meshRef.current.material) {
      if (animState.current.y > 25) {
        // 画面上部に達したらフェードアウト
        meshRef.current.material.opacity = Math.max(0, 1 - (animState.current.y - 25) / 5);
      } else if (animState.current.y < -15) {
        // 画面下部でフェードイン
        meshRef.current.material.opacity = Math.min(1, (animState.current.y + 20) / 5);
      } else {
        // 通常時は完全に表示
        meshRef.current.material.opacity = 1;
      }
    }
    
    // 画面外に出たら再配置（無限ループ）
    if (animState.current.y > 30) {
      animState.current.y = startY;
      animState.current.x = (Math.random() - 0.5) * 30;
    }
  });

  return (
    <mesh
      ref={meshRef}
      position={[randomX, startY, 0]} 
      scale={[0.001, 0.001, 0.001]} // 初期サイズ（ほぼ非表示）
    >
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial 
        map={texture} 
        transparent 
        opacity={0}
        toneMapped={false}
      />
    </mesh>
  );
};
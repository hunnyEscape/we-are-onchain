'use client';

import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Vector3 } from 'three';
import { SizeType } from '../floating-images/constants';

interface CircularMotionProps {
  size: SizeType;
  index: number;
  totalItems: number;
  radius?: number;
  speed?: number;
  height?: number;
}

interface CircularMotionState {
  position: Vector3;
  rotation: [number, number, number];
  scale: number;
  opacity: number;
}

/**
 * 奥から手前に向かってくる3D動きを制御するカスタムフック
 */
export const useCircularMotion = ({
  size,
  index,
  totalItems,
  radius = 20, // より広い円運動
  speed = 0.04, // 適切な速度
  height = 3  // 高さの分布を制限
}: CircularMotionProps): CircularMotionState => {
  // 初期状態の設定
  const [state, setState] = useState<CircularMotionState>({
    position: new Vector3(0, 0, -radius),
    rotation: [0, 0, 0],
    scale: 0.001,
    opacity: 0
  });

  // アニメーションパラメータ
  const motionRef = useRef({
    // サイズに基づいた設定
    baseScale: size === 'S' ? 1.0 : size === 'M' ? 1.6 : 2.2,
    baseSpeed: size === 'S' ? speed * 1.3 : size === 'M' ? speed : speed * 0.7,
    
    // アイテムの初期位置を均等に分散
    offset: (Math.PI * 2 / totalItems) * index,
    
    // 最小限のランダム要素（より鮮明に）
    randomOffset: Math.random() * 0.1 - 0.05,
    yOffset: (Math.random() * 2 - 1) * (height / 2),
    
    // アニメーション状態
    angle: (Math.PI * 2 / totalItems) * index,
    time: 0
  });

  // フレームごとのアニメーション更新
  useFrame((_, delta) => {
    // 時間の更新
    motionRef.current.time += delta;
    
    // 角度の更新（円運動）
    motionRef.current.angle += motionRef.current.baseSpeed * delta;
    
    // 3D位置の計算（円形パス）- Z軸を強調して奥から手前に動きを強調
    const x = Math.sin(motionRef.current.angle) * radius * 0.8; // X範囲を少し狭く
    const z = Math.cos(motionRef.current.angle) * radius; // Z範囲はそのまま
    
    // 奥行きの計算 - 手前に来る時に大きく見せる効果を強調
    const depthFactor = (Math.cos(motionRef.current.angle) + 1) / 2;
    // より明確なスケール変化（奥から手前へ）
    const currentScale = motionRef.current.baseScale * (0.5 + depthFactor * 0.8);
    
    // 透明度は手前で完全に不透明に
    const currentOpacity = 0.6 + depthFactor * 0.4;
    
    // 最小限の回転（鮮明さを保つため）
    const rotZ = motionRef.current.time * 0.05 + motionRef.current.randomOffset;
    
    // 状態の更新
    setState({
      position: new Vector3(
        x, 
        motionRef.current.yOffset, 
        z
      ),
      rotation: [0, 0, rotZ], // X軸とY軸の回転を最小限に
      scale: currentScale,
      opacity: currentOpacity
    });
  });

  return state;
};

export default useCircularMotion;
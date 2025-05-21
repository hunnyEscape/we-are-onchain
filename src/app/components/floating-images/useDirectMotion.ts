'use client';

import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Vector3 } from 'three';
import { SizeType } from '../floating-images/constants';

interface DirectMotionProps {
  size: SizeType;
  index: number;
  totalItems: number;
  depth?: number;
  speed?: number;
}

interface DirectMotionState {
  position: Vector3;
  scale: number;
  opacity: number;
}

/**
 * 奥から手前にまっすぐ向かってくるアニメーション用のカスタムフック
 */
export const useDirectMotion = ({
  size,
  index,
  totalItems,
  depth = 50, // 奥行きの長さ
  speed = 0.05 // 速度
}: DirectMotionProps): DirectMotionState => {
  // 初期状態の設定
  const [state, setState] = useState<DirectMotionState>({
    position: new Vector3(0, 0, -depth),
    scale: 0.001,
    opacity: 0
  });

  // アニメーションパラメータ
  const motionRef = useRef({
    // サイズに基づいた設定
    baseScale: size === 'S' ? 1.0 : size === 'M' ? 1.8 : 2.5,
    baseSpeed: size === 'S' ? speed * 1.3 : size === 'M' ? speed : speed * 0.7,
    
    // 初期位置の設定 - グリッド状に分散配置
    startPosition: calculateStartPosition(index, totalItems),
    
    // Z位置（奥行き）- 開始位置をずらす
    zPosition: -depth + (index % 3) * (depth / 3),
    
    // アニメーション状態
    time: 0
  });

  // 初期位置を計算する関数 - グリッド状に分散
  function calculateStartPosition(index: number, total: number) {
    // グリッドの列数（画面を均等に分割）
    const columns = Math.ceil(Math.sqrt(total));
    
    // グリッド内の位置
    const col = index % columns;
    const row = Math.floor(index / columns);
    
    // グリッド内のセル位置を計算（-7.5〜7.5の範囲）
    const cellSize = 15 / columns;
    const x = col * cellSize - 7.5 + cellSize / 2;
    const y = row * cellSize - 7.5 + cellSize / 2;
    
    // ランダム性を少し追加（セル内で少しだけランダムに）
    const randomX = (Math.random() - 0.5) * cellSize * 0.5;
    const randomY = (Math.random() - 0.5) * cellSize * 0.5;
    
    return { x: x + randomX, y: y + randomY };
  }

  // フレームごとのアニメーション更新
  useFrame((_, delta) => {
    // 時間の更新
    motionRef.current.time += delta;
    
    // Z位置の更新（奥から手前へ直線的に移動）
    motionRef.current.zPosition += motionRef.current.baseSpeed * delta * 20;
    
    // 一定の位置に達したら奥に戻す（ループ）
    if (motionRef.current.zPosition > 15) {
      motionRef.current.zPosition = -depth;
    }
    
    // 現在のZ位置に基づくスケールと透明度
    // 手前に来るほど大きく、奥ほど小さく
    const zRange = depth + 15; // 奥から手前までの全範囲
    const normalizedZ = (motionRef.current.zPosition + depth) / zRange;
    
    // スケールを計算（Z位置に基づいて段階的に大きく）
    const currentScale = motionRef.current.baseScale * Math.max(0.1, normalizedZ);
    
    // 透明度を計算（奥と手前でフェードイン・アウト）
    let currentOpacity = 1.0;
    if (normalizedZ < 0.1) {
      // 奥でフェードイン
      currentOpacity = normalizedZ / 0.1;
    } else if (normalizedZ > 0.9) {
      // 手前でフェードアウト
      currentOpacity = 1 - (normalizedZ - 0.9) / 0.1;
    }
    
    // 状態の更新
    setState({
      position: new Vector3(
        motionRef.current.startPosition.x,
        motionRef.current.startPosition.y,
        motionRef.current.zPosition
      ),
      scale: currentScale,
      opacity: currentOpacity
    });
  });

  return state;
};

export default useDirectMotion;
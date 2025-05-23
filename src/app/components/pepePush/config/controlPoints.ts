// config/controlPoints.ts
import { ControlPoint } from '../types';

export const controlPoints: ControlPoint[] = [
  {
    scrollProgress: 0,
    position: [0, -1, 0],
    rotation: [Math.PI / 4, -Math.PI / 12, 0],
    scale: [1, 1, 1]
  },
  {
    scrollProgress: 0.25,
    position: [0, 0, 0],
    rotation: [0, 0, 0],
    scale: [1.2, 1.2, 1.2]
  },
  {
    scrollProgress: 0.5,
    position: [2, 1, -1],
    rotation: [0, Math.PI / 3, 0],
    scale: [1, 1, 1]
  },
  {
    scrollProgress: 0.75,
    position: [0, -1, 2],
    rotation: [0, Math.PI, 0],
    scale: [0.8, 0.8, 0.8]
  },
  {
    scrollProgress: 1,
    position: [0,-1,0],
    rotation: [0, -Math.PI / 2, 0],
    scale: [1, 1, 1]
  }
];

// 設定値の調整用ヘルパー
export const CONFIG = {
  // セッションの高さ（vh）
  SECTION_HEIGHT_VH: 600,
  
  // アニメーション補間の滑らかさ
  LERP_FACTOR: 0.1,
  
  // デバッグモード（開発時にスクロール位置を表示）
  DEBUG_MODE: false
} as const;
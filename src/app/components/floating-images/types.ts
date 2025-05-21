import { Object3D } from 'three';
import { SizeType } from './constants';

// FloatingImageコンポーネントのProps
export interface FloatingImageProps {
  imageUrl: string;
  size: SizeType;
  index: number;
  initialDelay?: number;
}

// FloatingCanvasコンポーネントのProps
export interface FloatingCanvasProps {
  scrollY?: number;
}

// アニメーション状態
export interface AnimationState {
  position: [number, number, number];
  rotation: [number, number, number];
  scale: number;
  opacity: number;
}

// イメージアイテムの設定
export interface ImageConfig {
  size: SizeType;
  speed: number;
  rotationSpeed: number;
  scale: number;
  zPosition: number;
  opacity: number;
  initialX: number;
  initialY: number;
  initialRotation: number;
  delay: number;
}

// Three.jsオブジェクト用の型拡張
export interface FloatingObject extends Object3D {
  material?: {
    opacity?: number;
    transparent?: boolean;
  };
}

// スクロール関連の状態
export interface ScrollState {
  current: number;
  target: number;
  ease: number;
}
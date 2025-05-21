import { Vector3 } from 'three';
import { SizeType } from './constants';

// 円形モーションのProps
export interface CircularImageProps {
  imageUrl: string;
  size: SizeType;
  index: number;
  totalItems: number;
  radius?: number;
  speed?: number;
  height?: number;
}

// 円形モーションの状態
export interface CircularMotionState {
  position: Vector3;
  rotation: [number, number, number];
  scale: number;
  opacity: number;
}

// FloatingImagesFixのProps
export interface FloatingImagesFixProps {
  radius?: number;
  speed?: number;
  height?: number;
}

// FloatingImagesFixSectionのProps
export interface FloatingImagesFixSectionProps {
  className?: string;
}
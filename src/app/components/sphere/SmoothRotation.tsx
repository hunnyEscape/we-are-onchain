'use client';

import { useRef, useEffect } from 'react';
import * as THREE from 'three';

interface SmoothRotationProps {
  targetRef: React.RefObject<HTMLElement>;
  rotationRef: React.MutableRefObject<number>;  // ★ 変更
  sensitivity?: number;
  decay?: number;
}

/**
 * 物理ベース慣性スクロール → 回転変換
 */
const SmoothRotation: React.FC<SmoothRotationProps> = ({
  targetRef,
  rotationRef,
  sensitivity = 0.002,
  decay = 0.95,
}) => {
  const velocity = useRef(0);
  const isAnimating = useRef(false);
  const lastScrollY = useRef(0);

  const animate = () => {
    if (Math.abs(velocity.current) > 1e-5) {
      rotationRef.current += velocity.current;
      rotationRef.current %= Math.PI * 2;          // 正規化
      velocity.current *= decay;
      requestAnimationFrame(animate);
    } else {
      isAnimating.current = false;
    }
  };

  const onScroll = () => {
    const delta = window.scrollY - lastScrollY.current;
    lastScrollY.current = window.scrollY;

    velocity.current += delta * sensitivity;
    velocity.current = THREE.MathUtils.clamp(velocity.current, -0.1, 0.1);

    if (!isAnimating.current) {
      isAnimating.current = true;
      requestAnimationFrame(animate);
    }
  };

  useEffect(() => {
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return null;
};

export default SmoothRotation;

// src/app/components/floating-images-fix/FloatingImageFix.tsx

'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import type { ImageFile, ImageSize } from './constants';

interface FloatingImageFixProps {
  image: ImageFile;
  position: [number, number, number];
  scale: number;
  rotationSpeed?: number; // 画像ごとに差をつけたい場合
}

const FloatingImageFix: React.FC<FloatingImageFixProps> = ({
  image,
  position,
  scale,
  rotationSpeed = 0.12,
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const texture = useTexture(image.path);

  useFrame((_, delta) => {
    if (meshRef.current) {
      // Z軸回転のみ
      meshRef.current.rotation.z += rotationSpeed * delta;
    }
  });

  return (
    <mesh
      ref={meshRef}
      position={position}
      scale={[scale, scale, 1]}
      castShadow={false}
      receiveShadow={false}
    >
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial
        map={texture}
        transparent
        opacity={0.95}
        toneMapped={false}
      />
    </mesh>
  );
};

export default FloatingImageFix;

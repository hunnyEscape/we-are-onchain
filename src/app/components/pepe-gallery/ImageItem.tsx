'use client';

import { useRef, useState, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Image as DreiImage } from '@react-three/drei';
import { ImageFile, SIZE_SCALES } from './utils/constants';
import styles from './styles/GalleryEffects.module.css';
import { useImageLoader } from './utils/imageLoader';
import { easing } from 'maath';

interface ImageItemProps {
  image: ImageFile;
  position: [number, number, number];
  scrollProgress: number;
  isVisible?: boolean;
  index: number;
}

const ImageItem: React.FC<ImageItemProps> = ({
  image,
  position,
  scrollProgress,
  isVisible = true,
  index
}) => {
  const ref = useRef<any>(null);
  const { size } = image;
  const scale = SIZE_SCALES[size];
  
  // スケールのサイズに基づく調整
  const scaleFactor = typeof scale === 'number' ? scale : 
                     Array.isArray(scale) ? [scale[0], scale[1], 1] : [scale, scale, 1];
  
  // ビューポートの幅と高さを取得
  const { width, height } = useThree((state) => state.viewport);
  
  // 画像の読み込み状態を取得
  const { loading, error } = useImageLoader(image.path);
  
  // スクロール位置に基づく動的なズーム効果
  const scrollBasedZoom = 1 + (scrollProgress * 0.2);
  
  // グレースケール効果の状態
  const [grayscale, setGrayscale] = useState(1);
  
  // スクロール位置に基づいてグレースケール効果を更新
  useEffect(() => {
    // インデックスに基づいて異なるスクロール範囲でグレースケール効果を適用
    const startPoint = (index % 5) * 0.1 + 0.2;
    const endPoint = startPoint + 0.3;
    
    // スクロール範囲内に入ったらカラーに変化
    if (scrollProgress > startPoint && scrollProgress < endPoint) {
      setGrayscale(0); // カラー
    } else {
      setGrayscale(1); // グレースケール
    }
  }, [scrollProgress, index]);
  
  // 各フレームで適用するアニメーション
  useFrame((state, delta) => {
    if (ref.current) {
      // 滑らかなホバリングエフェクト（浮遊感）
      const time = state.clock.getElapsedTime();
      const hoverEffect = Math.sin(time * 0.3 + index) * 0.1;
      
      // スクロールに応じた移動とスケール変更
      easing.damp3(
        ref.current.position,
        [
          position[0] + Math.sin(time * 0.1 + index) * 0.3,
          position[1] + hoverEffect,
          position[2]
        ],
        0.2,
        delta
      );
      
      // スクロールに応じたサイズ変化
      easing.damp3(
        ref.current.scale,
        [
          scaleFactor[0] * scrollBasedZoom,
          scaleFactor[1] * scrollBasedZoom,
          1
        ],
        0.3,
        delta
      );
      
      // スクロールに応じた回転効果
      easing.dampE(
        ref.current.rotation,
        [0, 0, Math.sin(time * 0.2 + index) * 0.05],
        0.3,
        delta
      );
      
      // グレースケール効果の滑らかな遷移
      easing.damp(
        ref.current.material,
        'grayscale',
        grayscale,
        0.3,
        delta
      );
    }
  });
  
  if (!isVisible || loading || error) {
    return null;
  }
  
  return (
    <DreiImage
      ref={ref}
      url={image.path}
      position={position}
      scale={scaleFactor}
      transparent
      opacity={1}
      toneMapped={false}
      className={`${styles.imageGlow} ${styles.parallaxLayer}`}
    />
  );
};

export default ImageItem;
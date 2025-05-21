'use client';

import { Suspense, useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { Image, useTexture } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { imageFiles } from '../floating-images/constants';
import { useRadialMotion } from './useRadialMotion';

// 個々の放射状に動く画像コンポーネント
const RadialImage = ({ imageUrl, size, index, totalItems, maxDistance = 30, speed = 0.07 }) => {
  const texture = useTexture(imageUrl);
  
  // 放射状運動のカスタムフック
  const { position, scale, opacity } = useRadialMotion({
    size,
    index,
    totalItems,
    maxDistance,
    speed
  });

  // 放射状の動きに合わせて画像が動くように回転を調整
  const lookAtCamera = [0, 0, Math.atan2(position.y, position.x)];

  return (
    <Image
      url={imageUrl}
      position={[position.x, position.y, position.z]}
      rotation={lookAtCamera}
      scale={[scale, scale, 1]}
      transparent
      opacity={opacity}
      toneMapped={false}
    />
  );
};

// 画像群コンポーネント - 画像数を増やして密度を高める
const FloatingImagesFix = ({ maxDistance = 30, speed = 0.07 }) => {
  // CDN_URLを取得
  const CDN_URL = process.env.NEXT_PUBLIC_CLOUDFRONT_URL || '';
  
  // 画像を2倍に増やす（密度向上）
  const duplicatedImages = [
    ...imageFiles,
    ...imageFiles.map(img => ({...img, id: img.id + 1000})) // IDを変えて重複を避ける
  ];
  
  return (
    <>
      {/* 背景の設定 */}
      <color attach="background" args={['#000000']} />
      
      {/* 画像の配置 - 密度を2倍に */}
      {duplicatedImages.map((image, index) => {
        const imagePath = `${CDN_URL}/pepe/${image.filename}`;
        
        return (
          <RadialImage
            key={`${image.id}-${index}`}
            imageUrl={imagePath}
            size={image.size}
            index={index}
            totalItems={duplicatedImages.length}
            maxDistance={maxDistance}
            speed={speed}
          />
        );
      })}
      
      {/* 環境光の設定 */}
      <ambientLight intensity={0.8} />
      
      {/* 中央の小さな光源（出発点を強調） */}
      <pointLight
        position={[0, 0, 0]}
        intensity={5}
        distance={5}
        color="#ffffff"
      />
      
      {/* 全体を照らすスポットライト */}
      <spotLight
        position={[0, 0, 10]}
        angle={Math.PI / 2}
        penumbra={0.5}
        intensity={1.0}
        castShadow={false}
      />
    </>
  );
};

// メインセクションコンポーネント
const FloatingImagesFixSection = ({ className = '' }) => {
  // ローディング状態
  const [isLoading, setIsLoading] = useState(true);
  
  // コンポーネントマウント時にローディング
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 800);
    
    return () => clearTimeout(timer);
  }, []);

  return (
    <section className={`relative w-full h-screen bg-black overflow-hidden ${className}`}>
      {/* キャンバス - 視点を調整 */}
      <Canvas
        camera={{ position: [0, 0, 5], fov: 75 }} // 広い視野角で中央からの放射を強調
        gl={{ antialias: true, alpha: false }}
        dpr={[1, 2]}
      >
        <Suspense fallback={null}>
          <FloatingImagesFix maxDistance={30} speed={0.07} />
        </Suspense>
        
        {/* ポストプロセッシングエフェクト */}
        <EffectComposer>
          {/* ブルームエフェクト - 中央の光源を強調 */}
          <Bloom
            intensity={0.4}
            luminanceThreshold={0.1}
            luminanceSmoothing={0.9}
          />
        </EffectComposer>
      </Canvas>
      
      {/* ローディング表示 */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black text-white text-opacity-70 z-20">
          <p className="animate-pulse">Loading...</p>
        </div>
      )}
      
      {/* 中央の起点を示す小さな輝き（オプション） */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-1 h-1 bg-white rounded-full opacity-70 z-10 animate-pulse"></div>
    </section>
  );
};

export default FloatingImagesFixSection;
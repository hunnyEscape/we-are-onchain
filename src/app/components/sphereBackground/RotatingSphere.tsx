'use client';
import React, { useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, PerspectiveCamera, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import styles from './SphereStyles.module.css';

// ErrorBoundary コンポーネント
interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

// 背景球体コンポーネント
const BackgroundSphere = ({ texture }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const [textureMap, setTextureMap] = React.useState<THREE.Texture | null>(null);

  useEffect(() => {
    if (texture) {
      console.log("Loading background texture:", texture);
      const loader = new THREE.TextureLoader();
      loader.load(
        texture,
        (loadedTexture) => {
          console.log("Background texture loaded successfully");
          loadedTexture.mapping = THREE.EquirectangularReflectionMapping;
          setTextureMap(loadedTexture);
        },
        undefined,
        (error) => console.error("Background texture loading failed:", error)
      );
    }
  }, [texture]);

  if (!textureMap) return null;

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[30, 64, 64]} />
      <meshBasicMaterial map={textureMap} side={THREE.BackSide} />
    </mesh>
  );
};

// 球体コンポーネント
interface SphereProps {
  rotation: number;
  rotationAxis?: [number, number, number];
  texture?: string;
  wireframe?: boolean;
  color?: string;
  size?: number;
}

const Sphere: React.FC<SphereProps> = ({
  rotation,
  rotationAxis = [0, 1, 0], // Y軸周り（垂直軸）のみの回転
  texture,
  wireframe = false,
  color = '#00ff9f',
  size = 2.5
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const [textureMap, setTextureMap] = React.useState<THREE.Texture | null>(null);

  // テクスチャの読み込み
  useEffect(() => {
    if (texture) {
      console.log("Loading sphere texture:", texture);
      const loader = new THREE.TextureLoader();
      loader.load(
        texture,
        (loadedTexture) => {
          console.log("Sphere texture loaded successfully");
          setTextureMap(loadedTexture);
        },
        undefined,
        (error) => console.error("Sphere texture loading failed:", error)
      );
    }
  }, [texture]);

  // 回転の更新 - Y軸周りのみに制限
  useFrame(() => {
    if (meshRef.current) {
      // Y軸（垂直軸）周りの回転のみを適用
      meshRef.current.rotation.y = rotation;
    }
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[size, 64, 64]} />
      {textureMap ? (
        <meshStandardMaterial 
          map={textureMap}
          wireframe={wireframe}
          metalness={0.2}
          roughness={0.6}
        />
      ) : (
        <meshStandardMaterial 
          color={color}
          wireframe={wireframe}
          metalness={0.2}
          roughness={0.6}
        />
      )}
    </mesh>
  );
};

// メインのエクスポートコンポーネント
interface RotatingSphereProps {
  rotationValue: number;
  backgroundImage?: string;
  sphereTexture?: string;
  wireframe?: boolean;
  color?: string;
  size?: number;
  enableControls?: boolean;
}

const RotatingSphere: React.FC<RotatingSphereProps> = ({
  rotationValue,
  backgroundImage,
  sphereTexture,
  wireframe = false,
  color = '#00ff9f',
  size = 2.5,
  enableControls = false
}) => {
  const [isClient, setIsClient] = React.useState(false);
  const [isHdrBackground, setIsHdrBackground] = React.useState(false);

  // デバッグ用
  useEffect(() => {
    console.log("RotatingSphere mounted with sphereTexture:", sphereTexture);
    console.log("backgroundImage:", backgroundImage);
    console.log("wireframe setting:", wireframe);
  }, [sphereTexture, backgroundImage, wireframe]);

  // SSR対応
  useEffect(() => {
    setIsClient(true);
    if (backgroundImage && backgroundImage.toLowerCase().endsWith('.hdr')) {
      setIsHdrBackground(true);
    }
  }, [backgroundImage]);

  if (!isClient) {
    return (
      <div className={styles.loadingIndicator}>
        <div className={styles.loadingSpinner}></div>
        <span>Loading...</span>
      </div>
    );
  }

  return (
    <div className={styles.canvasWrapper}>
      <Canvas shadows>
        <ErrorBoundary
          fallback={
            <div className={styles.errorMessage}>
              エラー: 3Dレンダリングに失敗しました
            </div>
          }
        >
          {/* ライティング設定 */}
          <ambientLight intensity={0.8} />
          <directionalLight position={[5, 5, 5]} intensity={1.0} castShadow />
          <spotLight position={[-5, 8, -5]} angle={0.15} penumbra={1} intensity={1.5} castShadow />
          <hemisphereLight intensity={0.4} color="#88eeff" groundColor="#553333" />

          {/* 背景設定 - PepeModel3Dと同様の背景処理 */}
          {backgroundImage ? (
            isHdrBackground ? (
              <Environment files={backgroundImage} background />
            ) : (
              <BackgroundSphere texture={backgroundImage} />
            )
          ) : (
            <Environment preset="night" background blur={0.7} />
          )}

          {/* メインの球体 - テクスチャを適用し、Y軸周りの回転のみ */}
          <Sphere 
            rotation={rotationValue} 
            rotationAxis={[0, 1, 0]} // Y軸周りのみの回転
            texture={sphereTexture}
            wireframe={wireframe}
            color={color}
            size={size}
          />

          {/* カメラ設定 */}
          <PerspectiveCamera makeDefault position={[0, 0, 6]} fov={45} />
          
          {/* オプショナルなコントロール */}
          {enableControls && (
            <OrbitControls 
              enableZoom={false}
              enablePan={false}
              minPolarAngle={Math.PI / 2} // Y軸周りの回転のみに制限
              maxPolarAngle={Math.PI / 2}
            />
          )}
        </ErrorBoundary>
      </Canvas>
    </div>
  );
};

export default RotatingSphere;
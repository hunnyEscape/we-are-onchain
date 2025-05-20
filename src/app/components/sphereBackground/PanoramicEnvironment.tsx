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

// パノラマ環境コンポーネント - 小さな半径で内側を表示
const PanoramicEnvironment = ({ texture }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const [textureMap, setTextureMap] = React.useState<THREE.Texture | null>(null);

  useEffect(() => {
    if (texture) {
      console.log("Loading environment texture:", texture);
      const loader = new THREE.TextureLoader();
      loader.load(
        texture,
        (loadedTexture) => {
          console.log("Environment texture loaded successfully");
          // テクスチャをパノラマとして設定
          loadedTexture.mapping = THREE.EquirectangularReflectionMapping;
          setTextureMap(loadedTexture);
        },
        undefined,
        (error) => console.error("Environment texture loading failed:", error)
      );
    }
  }, [texture]);

  if (!textureMap) return null;

  // 重要なポイント：半径を小さめ（4〜8）に設定して、内側から見えるようにする
  return (
    <mesh ref={meshRef}>
      {/* 半径の値を小さく設定（これがキーポイント） */}
      <sphereGeometry args={[6, 64, 64]} />
      <meshBasicMaterial map={textureMap} side={THREE.BackSide} />
    </mesh>
  );
};

// 中央に表示するテキストオーバーレイ（オプション）
const TextOverlay = ({ visible = true }) => {
  if (!visible) return null;
  
  return (
    <group position={[0, 0, -2]}>
      <mesh>
        <planeGeometry args={[3, 1.2]} />
        <meshBasicMaterial color="black" opacity={0.7} transparent />
      </mesh>
      {/* Three.jsでテキストを表示するには3Dテキストかスプライトを使用 */}
      {/* ここでは省略 - CSSオーバーレイを使う方がより良い */}
    </group>
  );
};

// メインのエクスポートコンポーネント
interface DigitalEnvironmentProps {
  rotationValue: number;
  environmentTexture: string;
  enableControls?: boolean;
  showTextOverlay?: boolean;
}

const DigitalEnvironment: React.FC<DigitalEnvironmentProps> = ({
  rotationValue,
  environmentTexture,
  enableControls = false,
  showTextOverlay = true
}) => {
  const [isClient, setIsClient] = React.useState(false);
  const [isHdrBackground, setIsHdrBackground] = React.useState(false);
  const sceneRef = useRef<THREE.Group>(null);

  // デバッグ用
  useEffect(() => {
    console.log("DigitalEnvironment mounted with texture:", environmentTexture);
  }, [environmentTexture]);

  // SSR対応
  useEffect(() => {
    setIsClient(true);
    if (environmentTexture && environmentTexture.toLowerCase().endsWith('.hdr')) {
      setIsHdrBackground(true);
    }
  }, [environmentTexture]);

  // シーン全体の回転を制御
  useFrame(() => {
    if (sceneRef.current) {
      // Y軸周りの回転のみを適用
      sceneRef.current.rotation.y = rotationValue;
    }
  });

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
          {/* ライティング設定 - 環境内に光を当てる */}
          <ambientLight intensity={0.8} />
          <directionalLight position={[0, 1, 0]} intensity={0.5} />
          <hemisphereLight intensity={0.3} color="#88eeff" groundColor="#553333" />

          {/* 回転する全体のシーン */}
          <group ref={sceneRef}>
            {/* 環境テクスチャを使用したパノラマ背景 */}
            {environmentTexture ? (
              isHdrBackground ? (
                <Environment files={environmentTexture} background />
              ) : (
                <PanoramicEnvironment texture={environmentTexture} />
              )
            ) : (
              <Environment preset="night" background blur={0.7} />
            )}
            
            {/* オプションのテキストオーバーレイ */}
            <TextOverlay visible={showTextOverlay} />
          </group>

          {/* カメラ設定 */}
          <PerspectiveCamera makeDefault position={[0, 0, 0.1]} fov={75} />
          
          {/* オプショナルなコントロール */}
          {enableControls && (
            <OrbitControls 
              enableZoom={false}
              enablePan={false}
              minPolarAngle={Math.PI / 2}
              maxPolarAngle={Math.PI / 2}
            />
          )}
        </ErrorBoundary>
      </Canvas>
    </div>
  );
};

export default DigitalEnvironment;
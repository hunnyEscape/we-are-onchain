'use client';
import React, { useRef, useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, PerspectiveCamera, OrbitControls, Text } from '@react-three/drei';
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

// Canvas 外部でエラーメッセージコンポーネントを定義
const ErrorMessage = () => (
  <div className={styles.errorMessage}>
    エラー: 3Dレンダリングに失敗しました
  </div>
);

// パノラマ環境とシーン制御コンポーネント - Canvas内部で使用
const DigitalScene = ({ texture, rotationValue, showTextOverlay }) => {
  const sceneRef = useRef<THREE.Group>(null);
  const [textureMap, setTextureMap] = useState<THREE.Texture | null>(null);
  const [isHdrBackground, setIsHdrBackground] = useState(false);

  // テクスチャの読み込み
  useEffect(() => {
    if (texture) {
      console.log("Loading environment texture:", texture);
      if (texture.toLowerCase().endsWith('.hdr')) {
        setIsHdrBackground(true);
        return;
      }

      const loader = new THREE.TextureLoader();
      loader.load(
        texture,
        (loadedTexture) => {
          console.log("Environment texture loaded successfully");
          // テクスチャをパノラマとして設定
          loadedTexture.mapping = THREE.EquirectangularReflectionMapping;
          // テクスチャの明るさ調整
          loadedTexture.colorSpace = THREE.SRGBColorSpace;
          setTextureMap(loadedTexture);
        },
        undefined,
        (error) => console.error("Environment texture loading failed:", error)
      );
    }
  }, [texture]);

  // シーン全体の回転を制御 - Canvas内でのみ使用可能
  useFrame(() => {
    if (sceneRef.current) {
      // Y軸周りの回転のみを適用
      sceneRef.current.rotation.y = rotationValue;
    }
  });

  return (
    <group ref={sceneRef}>
      {/* 背景環境 - 球体の半径を6に設定し、カメラが明確に内側にいるようにする */}
      {isHdrBackground ? (
        <Environment files={texture} background />
      ) : textureMap ? (
        <mesh>
          {/* 半径を大きく設定（6-8が適切）- カメラ位置より十分大きくする */}
          <sphereGeometry args={[7, 64, 64]} />
          <meshBasicMaterial 
            map={textureMap} 
            side={THREE.BackSide} 
            transparent={false}
            opacity={1}
          />
        </mesh>
      ) : (
        <Environment preset="night" background blur={0.7} />
      )}
      
      {/* オプションのテキストオーバーレイ - R3Fでのテキスト表示 */}
      {showTextOverlay && (
        <group position={[0, 0, -4]}>
          <mesh>
            <planeGeometry args={[3, 1.2]} />
            <meshBasicMaterial color="black" opacity={0.7} transparent />
          </mesh>
          {/* テキストはdreiのTextコンポーネントを使用 */}
          <Text
            position={[0, 0, 0.01]}
            fontSize={0.2}
            color="#00ff9f"
            anchorX="center"
            anchorY="middle"
          >
            ONLY FOR SELF-CUSTODY CHAMPIONS
          </Text>
        </group>
      )}
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
  const [isClient, setIsClient] = useState(false);

  // デバッグ用
  useEffect(() => {
    console.log("DigitalEnvironment mounted with texture:", environmentTexture);
  }, [environmentTexture]);

  // SSR対応
  useEffect(() => {
    setIsClient(true);
  }, []);

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
        <ErrorBoundary fallback={<ErrorMessage />}>
          {/* ライティング設定 - 環境内に光を当てる */}
          <ambientLight intensity={0.8} />
          <directionalLight position={[0, 1, 0]} intensity={0.5} />
          <hemisphereLight intensity={0.3} color="#88eeff" groundColor="#553333" />

          {/* Canvas内でシーンコンポーネントを使用 */}
          <DigitalScene 
            texture={environmentTexture}
            rotationValue={rotationValue}
            showTextOverlay={showTextOverlay}
          />

          {/* カメラ設定 - カメラの位置を調整して、明確に球体の内側にいるようにする */}
          <PerspectiveCamera makeDefault position={[0, 0, 0]} fov={70} />
          
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
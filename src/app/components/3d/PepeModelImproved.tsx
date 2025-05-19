'use client';
import React, { useRef, useEffect, useState } from 'react';
import { useGLTF, Environment, OrbitControls, PerspectiveCamera, useHelper } from '@react-three/drei';
import { useFrame, Canvas } from '@react-three/fiber';
import * as THREE from 'three';

// Pepeモデルの改良版コンテナ
const PepeEnhancedContainer = () => {
  const groupRef = useRef<THREE.Group>(null);
  const [modelScale, setModelScale] = useState(0.5); // スケールの初期値を小さく設定
  const [modelPosition, setModelPosition] = useState([0, -2, 0]); // 位置の初期値を下方向に
  
  // ライトのためのレフ
  const directionalLightRef = useRef<THREE.DirectionalLight>(null);
  
  // ライトヘルパーを表示（オプション）
  useHelper(directionalLightRef, THREE.DirectionalLightHelper, 1, 'red');
  
  // GLTFモデルの読み込み
  const { scene, animations } = useGLTF('/models/pepe.glb');
  
  // モデル情報をログに出力
  useEffect(() => {
    if (scene) {
      console.log('Enhanced: Scene loaded successfully');
      
      // バウンディングボックスを計算して自動的に位置調整
      const box = new THREE.Box3().setFromObject(scene);
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());
      
      console.log('Model size:', size);
      console.log('Model center:', center);
      
      // モデルのスケールと位置を自動調整
      // モデルが大きすぎる場合はスケールを小さく
      if (size.length() > 10) {
        setModelScale(5 / size.length());
      }
      
      // 中心位置をオフセット
      setModelPosition([-center.x, -center.y, -center.z]);
    }
  }, [scene]);
  
  // 自動回転
  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.3;
    }
  });
  
  // GLTFモデル全体を表示
  return (
    <>
      {/* カメラとコントロールを追加 */}
      <PerspectiveCamera makeDefault position={[0, 0, 5]} fov={50} />
      <OrbitControls enableZoom={true} enablePan={true} />
      
      {/* 照明を強化 */}
      <ambientLight intensity={1.0} />
      <directionalLight 
        ref={directionalLightRef}
        position={[5, 5, 5]} 
        intensity={1.5} 
        castShadow 
        shadow-mapSize-width={1024} 
        shadow-mapSize-height={1024}
      />
      <hemisphereLight intensity={0.5} color="#eeffee" groundColor="#334433" />
      
      {/* 床とグリッドを追加 */}
      <gridHelper args={[10, 10, 0x00ff00, 0xffffff]} position={[0, -2.5, 0]} />
      
      {/* モデルコンテナ */}
      <group 
        ref={groupRef} 
        scale={[modelScale, modelScale, modelScale]}
        position={modelPosition}
      >
        <primitive object={scene.clone()} />
      </group>
    </>
  );
};

// エラーバウンダリーコンポーネント
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

// メインのエクスポートコンポーネント
interface PepeModelImprovedProps {
  className?: string;
}

const PepeModelImproved: React.FC<PepeModelImprovedProps> = ({ 
  className = ''
}) => {
  return (
    <div className={`w-full h-full ${className}`}>
      <Canvas shadows>
        <ErrorBoundary fallback={
          <group>
            <mesh>
              <boxGeometry args={[1, 1, 1]} />
              <meshStandardMaterial color="red" />
            </mesh>
            <ambientLight intensity={0.5} />
            <gridHelper />
          </group>
        }>
          <PepeEnhancedContainer />
          <Environment preset="sunset" background />
        </ErrorBoundary>
      </Canvas>
    </div>
  );
};

export default PepeModelImproved;

// グローバルにモデルをプリロード
useGLTF.preload('/models/pepe.glb');
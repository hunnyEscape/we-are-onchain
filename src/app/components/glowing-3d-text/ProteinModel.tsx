// src/app/components/3d/ProteinModel.tsx
'use client';
import React, { useRef, useState, useEffect } from 'react';
import { useGLTF, Environment, OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { useFrame, Canvas } from '@react-three/fiber';
import * as THREE from 'three';

// エラーバウンダリーコンポーネント
interface ErrorBoundaryProps {
	children: React.ReactNode;
	fallback: React.ReactNode;
}

interface ErrorBoundaryState {
	hasError: boolean;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
	constructor(props: ErrorBoundaryProps) {
		super(props);
		this.state = { hasError: false };
	}

	static getDerivedStateFromError(error: any) {
		return { hasError: true };
	}

	render() {
		if (this.state.hasError) {
			return this.props.fallback;
		}
		return this.props.children;
	}
}

// プロテインモデルコンテナ
interface ProteinContainerProps {
	autoRotate?: boolean;
	mouseControl?: boolean;
	scale?: number;
}

const ProteinContainer: React.FC<ProteinContainerProps> = ({
	autoRotate = true,
	mouseControl = false,
	scale = 1
}) => {
	const groupRef = useRef<THREE.Group>(null);

	// GLTFモデルの読み込み
	const { scene } = useGLTF(`${process.env.NEXT_PUBLIC_CLOUDFRONT_URL}/pepe/protein_powder.glb`);

	// コンソールにモデル情報を表示（デバッグ用）
	useEffect(() => {
		console.log('Model scene:', scene);
	}, [scene]);

	// マウス位置に基づいた回転
	const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

	// コンポーネントがマウントされたらマウス位置のリスナーを追加
	useEffect(() => {
		const handleMouseMove = (e: MouseEvent) => {
			setMousePosition({
				x: (e.clientX / window.innerWidth) * 2 - 1,
				y: -(e.clientY / window.innerHeight) * 2 + 1
			});
		};

		window.addEventListener('mousemove', handleMouseMove);
		return () => window.removeEventListener('mousemove', handleMouseMove);
	}, []);

	// フレームごとの処理（回転アニメーション）
	useFrame((state, delta) => {
		if (!groupRef.current) return;

		// 自動回転
		if (autoRotate) {
			groupRef.current.rotation.y += delta * 0.5; // 回転速度
		}

		// マウス位置に基づく追加の回転（マウスコントロールが有効な場合）
		if (mouseControl) {
			groupRef.current.rotation.x = mousePosition.y * 0.3;
			groupRef.current.rotation.y += (mousePosition.x * 0.5 - groupRef.current.rotation.y) * 0.1;
		}
	});

	// モデルが読み込まれていない場合、プレースホルダーを表示
	if (!scene) {
		return (
			//@ts-expect-error React Three Fiber JSX elements
			<mesh>
				{/* @ts-expect-error React Three Fiber JSX elements */}
				<boxGeometry args={[1, 1, 1]} />
				{/* @ts-expect-error React Three Fiber JSX elements */}
				<meshStandardMaterial color="hotpink"/>
				{/* @ts-expect-error React Three Fiber JSX elements */}
			</mesh>
		);
	}

	// GLTFモデル全体を表示する簡易アプローチ
	return (
		//@ts-expect-error React Three Fiber JSX elements
		<group
			ref={groupRef}
			scale={[scale, scale, scale]}
			position={[0, -0.5, 0]} // Y軸方向に少し下げて中央に表示
			rotation={[0, Math.PI * 0.25, 0]} // 少し回転させて良い角度に
		>
			{/* @ts-expect-error React Three Fiber JSX elements */}
			<primitive object={scene.clone()} />
			{/* @ts-expect-error React Three Fiber JSX elements */}
		</group>
	);
};

// エラー処理をするためのFallback
const ProteinModelWithErrorBoundary: React.FC<ProteinContainerProps> = (props) => {
	return (
		<ErrorBoundary fallback={<div>エラー: 3Dモデルの読み込みに失敗しました</div>}>
			<ProteinContainer {...props} />
		</ErrorBoundary>
	);
};

// メインのエクスポートコンポーネント
interface ProteinModelProps extends ProteinContainerProps {
	className?: string;
}
const ProteinModel: React.FC<ProteinModelProps> = ({ 
  className = '', 
  autoRotate = true, 
  mouseControl = true, 
  scale = 1 
}) => {
  return (
    <div className={`w-full h-full ${className}`}>
      <Canvas shadows>

        
        <ProteinModelWithErrorBoundary 
          autoRotate={autoRotate} 
          mouseControl={mouseControl} 
          scale={scale} 
        />
        
        <Environment preset="city" />
        {mouseControl && <OrbitControls enableZoom={false} enablePan={false} />}
        <PerspectiveCamera makeDefault position={[0, 0, 3]} fov={40} /> {/* カメラを近づけてfovを狭く */}
      </Canvas>
    </div>
  );
};

export default ProteinModel;

// グローバルにモデルをプリロード
useGLTF.preload('/models/protein_powder.glb');
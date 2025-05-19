'use client';
import React, { useRef } from 'react';
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

// Pepeモデルコンテナ
interface PepeContainerProps {
	autoRotate?: boolean;
	scale?: number;
}

const PepeContainer: React.FC<PepeContainerProps> = ({
	autoRotate = true,
	scale = 1
}) => {
	const groupRef = useRef<THREE.Group>(null);

	// GLTFモデルの読み込み
	const { scene } = useGLTF('/models/pepe.glb');

	// フレームごとの処理（回転アニメーション）
	useFrame((state, delta) => {
		if (!groupRef.current) return;

		// 自動回転
		if (autoRotate) {
			groupRef.current.rotation.y += delta * 0.5; // 回転速度
		}
	});

	// モデルが読み込まれていない場合、プレースホルダーを表示
	if (!scene) {
		return (
			<mesh>
				<boxGeometry args={[1, 1, 1]} />
				<meshStandardMaterial color="lime" />
			</mesh>
		);
	}

	// GLTFモデル全体を表示する簡易アプローチ
	return (
		<group
			ref={groupRef}
			scale={[scale, scale, scale]}
			position={[0, -0.5, 0]} // Y軸方向に少し下げて中央に表示
			rotation={[0, Math.PI * 0.25, 0]} // 少し回転させて良い角度に
		>
			<primitive object={scene.clone()} />
		</group>
	);
};

// エラー処理をするためのFallback
const PepeModelWithErrorBoundary: React.FC<PepeContainerProps> = (props) => {
	return (
		<ErrorBoundary fallback={<div>エラー: Pepe 3Dモデルの読み込みに失敗しました</div>}>
			<PepeContainer {...props} />
		</ErrorBoundary>
	);
};

// メインのエクスポートコンポーネント
interface PepeModelProps extends PepeContainerProps {
	className?: string;
}

const PepeModel: React.FC<PepeModelProps> = ({
	className = '',
	autoRotate = true,
	scale = 1
}) => {
	return (
		<div className={`w-full h-full ${className}`}>
			<Canvas shadows>
				<ambientLight intensity={0.7} />
				<directionalLight position={[10, 10, 10]} intensity={1.2} castShadow />
				<spotLight position={[-10, 10, 10]} angle={0.15} penumbra={1} intensity={1.5} castShadow />

				<PepeModelWithErrorBoundary
					autoRotate={autoRotate}
					scale={scale}
				/>

				<Environment preset="city" />
				<OrbitControls enableZoom={false} enablePan={false} />
				<PerspectiveCamera makeDefault position={[0, 0, 3]} fov={40} />
			</Canvas>
		</div>
	);
};

export default PepeModel;

// グローバルにモデルをプリロード
useGLTF.preload('/models/pepe.glb');
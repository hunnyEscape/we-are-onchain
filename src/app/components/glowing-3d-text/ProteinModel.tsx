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
	scale?: number;
	rotationSpeed?: number; // 回転速度を調整可能に
}

const ProteinContainer: React.FC<ProteinContainerProps> = ({
	autoRotate = true,
	scale = 1,
	rotationSpeed = 0.5
}) => {
	const groupRef = useRef<THREE.Group>(null);

	// 画面サイズの状態管理
	const [isMobile, setIsMobile] = useState(false);

	// 画面サイズの監視
	useEffect(() => {
		const checkMobile = () => {
			setIsMobile(window.innerWidth <= 768); // 768px以下をモバイルと判定
		};

		// 初期チェック
		checkMobile();

		// リサイズイベントリスナーを追加
		window.addEventListener('resize', checkMobile);

		// クリーンアップ
		return () => window.removeEventListener('resize', checkMobile);
	}, []);

	// GLTFモデルの読み込み
	const { scene } = useGLTF(`${process.env.NEXT_PUBLIC_CLOUDFRONT_URL}/pepe/protein_powder.glb`);

	// コンソールにモデル情報を表示（デバッグ用）
	useEffect(() => {
		console.log('Model scene:', scene);
	}, [scene]);

	// フレームごとの処理（自動回転のみ）
	useFrame((state, delta) => {
		if (!groupRef.current) return;

		// モバイルの場合は自動回転を無効化
		//if (autoRotate && !isMobile) {
		groupRef.current.rotation.y += delta * rotationSpeed;
		//}
	});

	// モデルが読み込まれていない場合、プレースホルダーを表示
	if (!scene) {
		return (
			//@ts-expect-error React Three Fiber JSX elements
			<mesh>
				{/* @ts-expect-error React Three Fiber JSX elements */}
				<boxGeometry args={[1, 1, 1]} />
				{/* @ts-expect-error React Three Fiber JSX elements */}
				<meshStandardMaterial color="hotpink" />
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
	scale = 1,
	rotationSpeed = 0.5
}) => {
	return (
		<div className={`w-full h-full ${className}`}>
			<Canvas
				gl={{ antialias: false }}              
				dpr={1}          
				shadows={false}                  
				frameloop="always"              
				style={{ touchAction: 'none' }}        
			>
				<ProteinModelWithErrorBoundary
					autoRotate={autoRotate}
					scale={scale}
					rotationSpeed={rotationSpeed}
				/>

				<Environment preset="city" />
				{/* OrbitControlsを削除してユーザー操作を無効化 */}
				<PerspectiveCamera makeDefault position={[0, 0, 3]} fov={40} />
			</Canvas>
		</div>
	);
};

export default ProteinModel;

// グローバルにモデルをプリロード（正しいURLを使用）
if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_CLOUDFRONT_URL) {
	useGLTF.preload(`${process.env.NEXT_PUBLIC_CLOUDFRONT_URL}/pepe/protein_powder.glb`);
}
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
	rotationSpeed?: number;
}
const ProteinContainer: React.FC<ProteinContainerProps> = ({ autoRotate = true, scale = 1, rotationSpeed = 0.5 }) => {
	const groupRef = useRef<THREE.Group>(null);
	const { scene } = useGLTF(`${process.env.NEXT_PUBLIC_CLOUDFRONT_URL}/pepe/protein_powder.glb`);

	useFrame((_, delta) => {
		if (autoRotate && groupRef.current) {
			groupRef.current.rotation.y += delta * rotationSpeed;
		}
	});

	if (!scene) {
		return (
			//@ts-expect-error React Three Fiber JSX elements
			<mesh>
				{/* @ts-expect-error React Three Fiber JSX elements */}
				<boxGeometry args={[1, 1, 1]} />
				{/* @ts-expect-error React Three Fiber JSX elements */}
				<meshBasicMaterial color="hotpink" />
				{/* @ts-expect-error React Three Fiber JSX elements */}
			</mesh>
		);
	}

	return (
		//@ts-expect-error React Three Fiber JSX elements
		<group
			ref={groupRef}
			scale={[scale, scale, scale]}
			position={[0, -0.5, 0]}
			rotation={[0, Math.PI * 0.25, 0]}
		>
			{/* @ts-expect-error React Three Fiber JSX elements */}
			<primitive object={scene.clone()} />
			{/* @ts-expect-error React Three Fiber JSX elements */}
		</group>
	);
};

// メインコンポーネント
interface ProteinModelProps extends ProteinContainerProps {
	className?: string;
}
const ProteinModel: React.FC<ProteinModelProps> = ({ className = '', autoRotate = true, scale = 1, rotationSpeed = 0.5 }) => {
	// モバイル判定
	const [isMobile, setIsMobile] = useState(false);
	useEffect(() => {
		const check = () => setIsMobile(window.innerWidth <= 768);
		check();
		window.addEventListener('resize', check);
		return () => window.removeEventListener('resize', check);
	}, []);

	return (
		<div className={`w-full h-full ${className}`}>
			<Canvas
				gl={{ antialias: false }}
				dpr={1}
				shadows={false}
				frameloop="always"
				style={{ touchAction: 'pan-y' }}
			>
				<ErrorBoundary fallback={<div className="text-center p-4">エラー: 3Dモデルの読み込みに失敗しました</div>}>
					<ProteinContainer autoRotate={autoRotate} scale={scale} rotationSpeed={rotationSpeed} />
				</ErrorBoundary>

				<Environment preset="city" />
				<PerspectiveCamera makeDefault position={[0, 0, 3]} fov={40} />

				{/* モバイルでは触れないよう完全シャットダウン、PC のみ水平回転許可 */}
				{!isMobile && (
					<OrbitControls
						enableZoom={false}
						enablePan={false}
						enableRotate={true}
						// Y軸水平回転全域
						minAzimuthAngle={-Infinity}
						maxAzimuthAngle={Infinity}
						// X軸固定
						minPolarAngle={Math.PI / 2.6}
						maxPolarAngle={Math.PI / 2.6}
						makeDefault
					/>
				)}
			</Canvas>
		</div>
	);
};

export default ProteinModel;

// モデルプリロード
if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_CLOUDFRONT_URL) {
	useGLTF.preload(`${process.env.NEXT_PUBLIC_CLOUDFRONT_URL}/pepe/protein_powder.glb`);
}

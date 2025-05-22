// src/app/components/3d/ProteinModel.tsx
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

// プロテインモデルコンテナ
interface ProteinContainerProps {
	autoRotate?: boolean;
	scale?: number;
}
const ProteinContainer: React.FC<ProteinContainerProps> = ({ autoRotate = true, scale = 1}) => {
	const groupRef = useRef<THREE.Group>(null);
	const { scene } = useGLTF(`${process.env.NEXT_PUBLIC_CLOUDFRONT_URL}/pepe/protein_powder.glb`);

	useFrame((_, delta) => {
		if (autoRotate && groupRef.current) {
			groupRef.current.rotation.y += delta * 0.2;
		}
	});

	if (!scene) {
		return (
			//@ts-expect-error React Three Fiber JSX elements
			<mesh>{/* @ts-expect-error React Three Fiber JSX elements */}
				<boxGeometry args={[1, 1, 1]} />
				{/* @ts-expect-error React Three Fiber JSX elements */}
				<meshBasicMaterial color="hotpink" />
				{/* @ts-expect-error React Three Fiber JSX elements */}
			</mesh>
		);
	}

	return (
		// @ts-expect-error React Three Fiber JSX elements
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
	const controlsRef = useRef<any>(null);
	return (
		<div className={`w-full h-full ${className}`}>
			<Canvas
				gl={{ antialias: false }}
				dpr={1}
				shadows={false}
				frameloop="always"
				style={{ touchAction: 'pan-y', pointerEvents: 'auto' }}
				onPointerDown={() => { if (controlsRef.current) controlsRef.current.enabled = true; }}
				onPointerUp={() => { if (controlsRef.current) controlsRef.current.enabled = false; }}
			>
				<ErrorBoundary fallback={<div className="text-center p-4">エラー: 3Dモデルの読み込みに失敗しました</div>}>
					<ProteinContainer autoRotate={autoRotate} scale={scale} />
				</ErrorBoundary>

				<Environment preset="city" />
				<PerspectiveCamera makeDefault position={[0, 0, 3]} fov={40} />
				<OrbitControls
					ref={controlsRef}
					enabled={false}
					enableZoom={false}
					enablePan={false}
					enableRotate={true}
					// 水平回転は無制限
					minAzimuthAngle={-Infinity}
					maxAzimuthAngle={Infinity}
					// 垂直回転を固定
					minPolarAngle={Math.PI / 2.5}
					maxPolarAngle={Math.PI / 2.5}
					makeDefault
				/>
			</Canvas>
		</div>
	);
};
export default ProteinModel;

// モデルプリロード
if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_CLOUDFRONT_URL) {
	useGLTF.preload(`${process.env.NEXT_PUBLIC_CLOUDFRONT_URL}/pepe/protein_powder.glb`);
}

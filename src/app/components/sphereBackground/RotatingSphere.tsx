'use client';
import React, { useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, PerspectiveCamera } from '@react-three/drei';
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
	rotationAxis = [0, 1, 0],
	texture,
	wireframe = false,
	color = '#ffffff',
	size = 1.5
}) => {
	const meshRef = useRef<THREE.Mesh>(null);
	const [textureMap, setTextureMap] = React.useState<THREE.Texture | null>(null);

	// テクスチャの読み込み
	useEffect(() => {
		if (texture) {
			const loader = new THREE.TextureLoader();
			loader.load(
				texture,
				(loadedTexture) => {
					loadedTexture.wrapS = THREE.RepeatWrapping;
					loadedTexture.wrapT = THREE.RepeatWrapping;
					setTextureMap(loadedTexture);
				},
				undefined,
				(error) => console.error('テクスチャの読み込みに失敗しました', error)
			);
		}
	}, [texture]);

	// スクロールに基づく回転の更新
	useFrame(() => {
		if (meshRef.current) {
			// 直接回転値を適用（スムーズなアニメーションは親コンポーネントで制御）
			meshRef.current.rotation.x = rotationAxis[0] * rotation;
			meshRef.current.rotation.y = rotationAxis[1] * rotation;
			meshRef.current.rotation.z = rotationAxis[2] * rotation;
		}
	});

	return (
		<mesh ref={meshRef}>
			<sphereGeometry args={[size, 64, 64]} />
			{textureMap ? (
				<meshStandardMaterial
					map={textureMap}
					wireframe={wireframe}
				/>
			) : (
				<meshStandardMaterial
					color={color}
					wireframe={wireframe}
					transparent
					opacity={0.8}
				/>
			)}
		</mesh>
	);
};

// 背景球体（オプション）
const BackgroundSphere: React.FC<{ texture: string }> = ({ texture }) => {
	const textureLoaded = useRef<THREE.Texture | null>(null);

	useEffect(() => {
		if (texture) {
			const loader = new THREE.TextureLoader();
			loader.load(
				texture,
				(loadedTexture) => {
					loadedTexture.mapping = THREE.EquirectangularReflectionMapping;
					textureLoaded.current = loadedTexture;
				}
			);
		}
	}, [texture]);

	if (!textureLoaded.current) return null;

	return (
		<mesh>
			<sphereGeometry args={[50, 64, 64]} />
			<meshBasicMaterial map={textureLoaded.current} side={THREE.BackSide} />
		</mesh>
	);
};

// メインのエクスポートコンポーネント
interface RotatingSphereProps {
	rotationValue: number; // スクロール量に基づく回転値
	backgroundImage?: string;
	sphereTexture?: string;
	wireframe?: boolean;
	color?: string;
	size?: number;
}

const RotatingSphere: React.FC<RotatingSphereProps> = ({
	rotationValue,
	backgroundImage,
	sphereTexture,
	wireframe = false,
	color = '#00ff9f',
	size = 1.5
}) => {
	const [isClient, setIsClient] = React.useState(false);
	const [isHdrBackground, setIsHdrBackground] = React.useState(false);

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
		<div className={styles.canvasContainer}>
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

					{/* 背景設定 */}
					{backgroundImage ? (
						isHdrBackground ? (
							<Environment files={backgroundImage} background />
						) : (
							<Environment preset="night" background blur={0.7} />
						)
					) : null}

					{/* メインの球体 */}
					<Sphere
						rotation={rotationValue}
						rotationAxis={[0.2, 1, 0.1]}
						texture={sphereTexture}
						wireframe={wireframe}
						color={color}
						size={size}
					/>

					{/* カメラ設定 */}
					<PerspectiveCamera makeDefault position={[0, 0, 4]} fov={45} />
				</ErrorBoundary>
			</Canvas>
		</div>
	);
};

export default RotatingSphere;
'use client';
import React, { useRef, useState, useEffect, ReactNode } from 'react';
import { Environment, PerspectiveCamera, OrbitControls } from '@react-three/drei';
import { useFrame, Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import styles from './Sphere.module.css';

// エラーバウンダリーコンポーネン (前回と同じ)
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

// 回転制御コンポーネント
type RotatingGroupProps = {
	rotationY?: number;
	rotationSpeed?: number;
	autoRotate?: boolean;
	children: ReactNode;
};

const RotatingGroup: React.FC<RotatingGroupProps> = ({
	rotationY = 0,
	rotationSpeed = 0.3,
	autoRotate = true,
	children,
}) => {
	const groupRef = useRef<THREE.Group>(null);

	useFrame((_, delta) => {
		if (!groupRef.current) return;

		// 自動回転が有効な場合
		if (autoRotate) {
			groupRef.current.rotation.y += rotationSpeed * delta;
		} else {
			// 外部から渡された回転値を適用
			groupRef.current.rotation.y = rotationY;
		}
	});

	return (
		// @ts-expect-error React Three Fiber JSX elements
		<group ref={groupRef}>
			{children}
			{/* @ts-expect-error React Three Fiber JSX elements */}
		</group>
	);
};

interface BackgroundSphereProps {
	backgroundImage?: string;
	isMobile?: boolean;
}

// 背景用の球体コンポーネント
const BackgroundSphere: React.FC<BackgroundSphereProps> = ({ backgroundImage, isMobile = false }) => {
	const [texture, setTexture] = useState<THREE.Texture | null>(null);

	useEffect(() => {
		if (backgroundImage) {
			const textureLoader = new THREE.TextureLoader();
			const loadedTexture = textureLoader.load(backgroundImage);
			loadedTexture.mapping = THREE.EquirectangularReflectionMapping;

			// Use colorSpace instead of deprecated encoding
			loadedTexture.colorSpace = THREE.SRGBColorSpace;

			setTexture(loadedTexture);
		}
	}, [backgroundImage]);

	if (!texture) return null;

	return (
		// @ts-expect-error React Three Fiber JSX elements
		<mesh>
			{/* @ts-expect-error React Three Fiber JSX elements */}
			<sphereGeometry args={[2, isMobile ? 16 : 64, isMobile ? 16 : 64]} />
			{/* @ts-expect-error React Three Fiber JSX elements */}
			<meshBasicMaterial map={texture} side={THREE.BackSide} />
			{/* @ts-expect-error React Three Fiber JSX elements */}
		</mesh>
	);
};

// メインのエクスポートコンポーネン
interface SphereProps {
	className?: string;
	autoRotate?: boolean;
	enableControls?: boolean; // マウスによる水平回転（Y軸周り）操作を許可するかどうか
	rotationSpeed?: number;
	backgroundImage?: string; // カスタム背景画像のパス
	useDefaultEnvironment?: boolean; // デフォルト環境マップを使用するかどうか
	manualRotation?: number; // 手動で指定する回転値（ラジアン）
	isMobile?: boolean; // モバイルデバイスかどうかのフラグ
}

const Sphere: React.FC<SphereProps> = ({
	className = '',
	autoRotate = true,
	enableControls = false,
	rotationSpeed = 0.3,
	backgroundImage = '',
	useDefaultEnvironment = true,
	manualRotation = 0,
	isMobile = false
}) => {
	const [isClient, setIsClient] = useState(false);
	const [isHdrBackground, setIsHdrBackground] = useState(false);

	// サーバーサイドレンダリング対策
	useEffect(() => {
		setIsClient(true);
		// HDRファイルかどうかを確認
		if (backgroundImage && backgroundImage.toLowerCase().endsWith('.hdr')) {
			setIsHdrBackground(true);
		}
	}, [backgroundImage]);

	if (!isClient) {
		return (
			<div className={`${styles.modelContainer} ${className}`}>
				<div className={styles.loadingIndicator}>
					<div className={styles.loadingSpinner}></div>
					<span>Loading Model...</span>
				</div>
			</div>
		);
	}

	// 背景画像がCSSで設定される場合はスタイルを追加
	const containerStyle = {};

	return (
		<div
			className={`${styles.modelContainer} ${className}`}
			style={containerStyle}
		>
			{/* サイバーパンク風の装飾 */}
			<div className={`${styles.decorLine} ${styles.decorLineTop}`}></div>
			<div className={`${styles.decorLine} ${styles.decorLineBottom}`}></div>

			<div className={styles.canvasWrapper}>
				<Canvas 
					shadows={!isMobile} 
					gl={{ 
						antialias: !isMobile 
					}}
				>
					<ErrorBoundary
						fallback={
							<div className={styles.errorMessage}>
								エラー: 3Dモデルの読み込みに失敗しました
							</div>
						}
					>
						{/* 回転制御コンポーネントで背景を囲む */}
						<RotatingGroup
							rotationY={manualRotation}
							rotationSpeed={rotationSpeed}
							autoRotate={!isMobile && autoRotate}
						>
							<BackgroundSphere 
								backgroundImage={backgroundImage} 
								isMobile={isMobile}
							/>
						</RotatingGroup>

						{/* カメラ設定 */}
						<PerspectiveCamera makeDefault position={[0, 0, 4]} fov={45} />

						{/* コントロール設定 */}
						{enableControls && (
							<OrbitControls
								enableZoom={false}
								enablePan={false}
								enableRotate={true}
								minPolarAngle={Math.PI / 2}
								maxPolarAngle={Math.PI / 2}
								dampingFactor={0.05}
								rotateSpeed={0.5}
							/>
						)}
					</ErrorBoundary>
				</Canvas>
			</div>

			{/* 情報オーバーレイ */}
			<div className={styles.infoOverlay}>
				MODEL: MATRIX-SPHERE v1.0
			</div>
		</div>
	);
};

export default Sphere;
'use client';
import React, { useRef, useState, useEffect } from 'react';
import { useGLTF, Environment, PerspectiveCamera, OrbitControls } from '@react-three/drei';
import { useFrame, Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import styles from './sphereBackground.module.css';

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

// Pepeモデルコンテナコンポーネント
interface PepeContainerProps {
	autoRotate?: boolean;
	rotationSpeed?: number;
}
// 背景用の球体コンポーネント
const BackgroundSphere = ({ backgroundImage }) => {
	const texture = new THREE.TextureLoader().load(backgroundImage);
	texture.mapping = THREE.EquirectangularReflectionMapping;
	texture.encoding = THREE.sRGBEncoding;

	return (
		<mesh>
			{/* この部分のサイズを小さくします。元は [50, 64, 64] */}
			<sphereGeometry args={[2, 64, 64]} />
			<meshBasicMaterial map={texture} side={THREE.BackSide} />
		</mesh>
	);
};

// メインのエクスポートコンポーネント
interface PepeModel3DProps {
	className?: string;
	autoRotate?: boolean;
	enableControls?: boolean; // マウスによる水平回転（Y軸周り）操作を許可するかどうか
	rotationSpeed?: number;
	backgroundImage?: string; // カスタム背景画像のパス
	useDefaultEnvironment?: boolean; // デフォルト環境マップを使用するかどうか
}

const SphereBackground: React.FC<PepeModel3DProps> = ({
	className = '',
	autoRotate = true,
	enableControls = false,
	rotationSpeed = 0.3,
	backgroundImage = '',
	useDefaultEnvironment = true
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
				<Canvas shadows>
					<ErrorBoundary
						fallback={
							<div className={styles.errorMessage}>
								エラー: 3Dモデルの読み込みに失敗しました
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
								<BackgroundSphere backgroundImage={backgroundImage} />
							)
						) : useDefaultEnvironment ? (
							<Environment preset="night" background blur={0.7} />
						) : null}


						{/* カメラ設定 - 少し下向きにして顔が中心に来るように */}
						<PerspectiveCamera makeDefault position={[0, 1, 4]} fov={45} />

						{/* コントロール設定 - Y軸周りの回転のみ許可（水平方向のみ回転可能） */}
						{enableControls && (
							<OrbitControls
								enableZoom={false}
								enablePan={false}
								enableRotate={true}
								minPolarAngle={Math.PI / 2} // 90度 - 常に赤道面に固定
								maxPolarAngle={Math.PI / 2} // 90度 - 常に赤道面に固定
								dampingFactor={0.05}
								rotateSpeed={0.5}
							/>
						)}
					</ErrorBoundary>
				</Canvas>
			</div>

			{/* 情報オーバーレイ（オプション） */}
			<div className={styles.infoOverlay}>
				MODEL: PEPE-3D v1.0
			</div>
		</div>
	);
};

export default SphereBackground;

// グローバルにモデルをプリロード
useGLTF.preload('/models/pepe.glb');
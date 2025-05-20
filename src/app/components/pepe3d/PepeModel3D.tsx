'use client';
import React, { useRef, useState, useEffect } from 'react';
import { useGLTF, Environment, PerspectiveCamera, OrbitControls } from '@react-three/drei';
import { useFrame, Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import styles from './PepeStyles.module.css';

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

const PepeContainer: React.FC<PepeContainerProps> = ({
	autoRotate = true,
	rotationSpeed = 0.3
}) => {
	const groupRef = useRef<THREE.Group>(null);
	const [modelScale, setModelScale] = useState(0.7); // 固定スケール
	const [modelPosition, setModelPosition] = useState([0, -2, 0]); // 初期位置
	const [isLoading, setIsLoading] = useState(true);

	// GLTFモデルの読み込み
	const { scene, animations } = useGLTF('/models/pepe.glb');

	// モデル情報をログに出力と位置調整
	useEffect(() => {
		if (scene) {
			console.log('Model loaded successfully');
			setIsLoading(false);

			// バウンディングボックスを計算して自動的に位置調整
			const box = new THREE.Box3().setFromObject(scene);
			const size = box.getSize(new THREE.Vector3());
			const center = box.getCenter(new THREE.Vector3());

			console.log('Model size:', size);
			console.log('Model center:', center);

			// モデルのスケールと位置を自動調整（固定スケール）
			if (size.length() > 10) {
				// サイズが大きい場合は適切な固定値に調整
				setModelScale(6 / size.length());
			} else if (size.length() < 2) {
				// サイズが小さすぎる場合は大きめに
				setModelScale(1.2);
			}

			// モデルを画面中央に配置（Y軸方向を調整して上に移動）
			setModelPosition([-center.x, -center.y + 1.0, -center.z]); // Y軸方向に上げる
		}
	}, [scene]);

	// 自動回転アニメーション
	useFrame((state, delta) => {
		if (groupRef.current && autoRotate) {
			// Y軸周りに回転
			groupRef.current.rotation.y += delta * rotationSpeed;

			// わずかに上下に揺れる動き（控えめな浮遊感）
			groupRef.current.position.y = modelPosition[1] + Math.sin(state.clock.elapsedTime * 0.5) * 0.05;
		}
	});

	// モデルが読み込まれていない場合のローディング表示
	if (isLoading || !scene) {
		return (
			<mesh>
				<boxGeometry args={[1, 1, 1]} />
				<meshStandardMaterial color="lime" wireframe />
			</mesh>
		);
	}

	// GLTFモデル表示
	return (
		<group
			ref={groupRef}
			scale={[modelScale, modelScale, modelScale]} // 固定スケール
			position={[modelPosition[0], modelPosition[1], modelPosition[2]]}
			rotation={[0, 0, 0]} // 正面向きの初期回転
		>
			<primitive object={scene.clone()} />
		</group>
	);
};

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

const PepeModel3D: React.FC<PepeModel3DProps> = ({
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

						{/* Pepeモデル */}
						<PepeContainer autoRotate={autoRotate} rotationSpeed={rotationSpeed} />

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

export default PepeModel3D;

// グローバルにモデルをプリロード
useGLTF.preload('/models/pepe.glb');
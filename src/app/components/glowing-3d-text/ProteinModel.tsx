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

const ProteinContainer: React.FC<ProteinContainerProps> = ({
	autoRotate = true,
	scale = 1,
	rotationSpeed = 0.2
}) => {
	const groupRef = useRef<THREE.Group>(null);

	// 画面サイズの状態管理
	const [isMobile, setIsMobile] = useState(false);

	// 画面サイズの監視
	useEffect(() => {
		const checkMobile = () => {
			setIsMobile(window.innerWidth <= 768);
		};

		checkMobile();
		window.addEventListener('resize', checkMobile);
		return () => window.removeEventListener('resize', checkMobile);
	}, []);

	// GLTFモデルの読み込み
	const { scene } = useGLTF(`${process.env.NEXT_PUBLIC_CLOUDFRONT_URL}/pepe/protein_powder.glb`);

	useEffect(() => {
		console.log('Model scene:', scene);
	}, [scene]);

	// フレームごとの処理（自動回転）
	useFrame((state, delta) => {
		if (!groupRef.current) return;
		if (autoRotate) {
			groupRef.current.rotation.y += delta * rotationSpeed;
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
				<meshStandardMaterial color="hotpink" />
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

// エラー処理をするためのFallback
const ProteinModelWithErrorBoundary: React.FC<ProteinContainerProps> = (props) => {
	return (
		<ErrorBoundary fallback={<div>エラー: 3Dモデルの読み込みに失敗しました</div>}>
			<ProteinContainer {...props} />
		</ErrorBoundary>
	);
};

// カスタムOrbitControlsコンポーネント
const CustomOrbitControls: React.FC<{ isMobile: boolean }> = ({ isMobile }) => {
	const controlsRef = useRef<any>(null);

	useEffect(() => {
		if (!controlsRef.current) return;

		const controls = controlsRef.current;
		
		if (isMobile) {
			// モバイルでの設定
			const handleTouchStart = (event: TouchEvent) => {
				// 単一タッチの場合はスクロールを許可
				if (event.touches.length === 1) {
					const touch = event.touches[0];
					const startY = touch.clientY;
					
					const handleTouchMove = (moveEvent: TouchEvent) => {
						if (moveEvent.touches.length === 1) {
							const currentY = moveEvent.touches[0].clientY;
							const deltaY = Math.abs(currentY - startY);
							
							// 垂直方向の動きが一定以上の場合、OrbitControlsを無効化
							if (deltaY > 10) {
								controls.enabled = false;
								// 少し遅れてOrbitControlsを再有効化
								setTimeout(() => {
									if (controls) controls.enabled = true;
								}, 100);
							}
						}
					};

					const handleTouchEnd = () => {
						document.removeEventListener('touchmove', handleTouchMove);
						document.removeEventListener('touchend', handleTouchEnd);
						// タッチ終了後にOrbitControlsを再有効化
						if (controls) controls.enabled = true;
					};

					document.addEventListener('touchmove', handleTouchMove, { passive: true });
					document.addEventListener('touchend', handleTouchEnd);
				}
			};

			// タッチイベントリスナーを追加
			controls.domElement.addEventListener('touchstart', handleTouchStart, { passive: true });

			return () => {
				if (controls.domElement) {
					controls.domElement.removeEventListener('touchstart', handleTouchStart);
				}
			};
		}
	}, [isMobile]);

	return (
	
		<OrbitControls
			ref={controlsRef}
			enableZoom={false}
			enablePan={false}
			enableRotate={!isMobile} // モバイルでは回転を無効化
			minAzimuthAngle={-Infinity}
			maxAzimuthAngle={Infinity}
			minPolarAngle={Math.PI / 2.3}
			maxPolarAngle={Math.PI / 2.3}
			makeDefault
			// タッチ操作の設定
			touches={{
				ONE: isMobile ? THREE.TOUCH.PAN : THREE.TOUCH.ROTATE,
				TWO: THREE.TOUCH.DOLLY_PAN
			}}
		/>
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
	const [isMobile, setIsMobile] = useState(false);
	const canvasRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const checkMobile = () => {
			setIsMobile(window.innerWidth <= 768);
		};

		checkMobile();
		window.addEventListener('resize', checkMobile);
		return () => window.removeEventListener('resize', checkMobile);
	}, []);

	// タッチイベントの処理を改善
	useEffect(() => {
		const canvasElement = canvasRef.current;
		if (!canvasElement || !isMobile) return;

		let isScrolling = false;
		let startY = 0;

		const handleTouchStart = (e: TouchEvent) => {
			if (e.touches.length === 1) {
				startY = e.touches[0].clientY;
				isScrolling = false;
			}
		};

		const handleTouchMove = (e: TouchEvent) => {
			if (e.touches.length === 1) {
				const currentY = e.touches[0].clientY;
				const deltaY = Math.abs(currentY - startY);
				
				// 垂直方向の動きが10px以上の場合、スクロールと判定
				if (deltaY > 10) {
					isScrolling = true;
				}

				// スクロール中の場合、デフォルトの動作を許可
				if (isScrolling) {
					// タッチイベントを親要素に伝播させる
					return;
				}
			}
		};

		const handleTouchEnd = () => {
			isScrolling = false;
		};

		// パッシブリスナーを使用してパフォーマンスを向上
		canvasElement.addEventListener('touchstart', handleTouchStart, { passive: true });
		canvasElement.addEventListener('touchmove', handleTouchMove, { passive: true });
		canvasElement.addEventListener('touchend', handleTouchEnd, { passive: true });

		return () => {
			canvasElement.removeEventListener('touchstart', handleTouchStart);
			canvasElement.removeEventListener('touchmove', handleTouchMove);
			canvasElement.removeEventListener('touchend', handleTouchEnd);
		};
	}, [isMobile]);

	return (
		<div 
			ref={canvasRef}
			className={`w-full h-full ${className}`}
			style={{
				// モバイルでのタッチ操作を改善
				touchAction: isMobile ? 'pan-y pinch-zoom' : 'pan-y',
				WebkitOverflowScrolling: 'touch'
			}}
		>
			<Canvas
				gl={{ 
					antialias: false,
					alpha: true,
					premultipliedAlpha: false
				}}
				dpr={Math.min(window.devicePixelRatio, 2)} // デバイスピクセル比を制限
				shadows={false}
				frameloop="always"
				style={{ 
					touchAction: isMobile ? 'none' : 'pan-y',
					pointerEvents: 'auto'
				}}
			>
				<ProteinModelWithErrorBoundary
					autoRotate={autoRotate}
					scale={scale}
					rotationSpeed={rotationSpeed}
				/>

				<Environment preset="city" />
				<PerspectiveCamera makeDefault position={[0, 0, 3]} fov={40} />
				<CustomOrbitControls isMobile={isMobile} />
			</Canvas>
		</div>
	);
};

export default ProteinModel;

// グローバルにモデルをプリロード
if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_CLOUDFRONT_URL) {
	useGLTF.preload(`${process.env.NEXT_PUBLIC_CLOUDFRONT_URL}/pepe/protein_powder.glb`);
}
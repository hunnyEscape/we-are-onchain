-e 
### FILE: ./src/app/components/layout/SmoothScroll.tsx

'use client';
import React, { useEffect, useRef } from 'react';
import Lenis from '@studio-freight/lenis';

interface SmoothScrollProps {
	children: React.ReactNode;
}

// より単純で直接的なアプローチ
const SmoothScroll: React.FC<SmoothScrollProps> = ({ children }) => {
	const lenisRef = useRef<Lenis | null>(null);

	useEffect(() => {
		// ページロード時の遅延を防ぐために、すべてのスタイルを先に設定
		document.documentElement.style.scrollBehavior = 'auto';
		document.body.style.overflowY = 'scroll';
		document.body.style.overscrollBehavior = 'none';

		// 少し遅延させてLenisを初期化（DOMの準備を確実に）
		const timer = setTimeout(() => {
			if (lenisRef.current) return;

			lenisRef.current = new Lenis({
				// ↓lerp を指定せず、duration/easing を有効にする
				duration: 0.1,              // 0.2秒だけ慣性を残す
				easing: (t: number) => t,   // リニアイージング（慣性距離をすっと切る）

				orientation: 'vertical',
				gestureOrientation: 'vertical',
				smoothWheel: true,          // Wheel 特有のスムージングは ON
				wheelMultiplier: 1,         // 必要なら 0.5〜1.0 の範囲で調整
				normalizeWheel: true,
				syncTouch: true,
			});


			// この時点でスクロール位置を正確に設定
			lenisRef.current.scrollTo(window.scrollY, { immediate: true });

			// 即時アニメーション開始
			function raf(time: number) {
				if (lenisRef.current) {
					lenisRef.current.raf(time);
				}
				requestAnimationFrame(raf);
			}

			requestAnimationFrame(raf);
		}, 50); // 少しだけ遅延

		return () => {
			clearTimeout(timer);
			if (lenisRef.current) {
				lenisRef.current.destroy();
			}
			// スタイルをリセット
			document.documentElement.style.removeProperty('scroll-behavior');
			document.body.style.removeProperty('overflow-y');
			document.body.style.removeProperty('overscroll-behavior');
		};
	}, []);

	return <>{children}</>;
};

export default SmoothScroll;-e 
### FILE: ./src/app/components/layout/Navbar.tsx

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

const Navbar = () => {
	const [isScrolled, setIsScrolled] = useState(false);
	const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

	// スクロール検知
	useEffect(() => {
		const handleScroll = () => {
			setIsScrolled(window.scrollY > 10);
		};

		window.addEventListener('scroll', handleScroll);
		return () => window.removeEventListener('scroll', handleScroll);
	}, []);

	return (
		<nav
			className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${isScrolled ? 'bg-black/80 backdrop-blur-md py-3' : 'bg-transparent py-5'
				}`}
		>
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="flex items-center justify-between h-16">
					{/* ロゴ */}
					<div className="flex-shrink-0">
						<Link href="/" className="text-neon-green font-heading text-2xl">
							WE ARE ON-CHAIN
						</Link>
					</div>

					{/* デスクトップメニュー */}
					<div className="hidden md:block">
						<div className="ml-10 flex items-center space-x-8">
							<Link
								href="#product"
								className="text-white hover:text-neon-green transition-colors"
							>
								PRODUCT
							</Link>
							<Link
								href="#how-it-works"
								className="text-white hover:text-neon-green transition-colors"
							>
								HOW IT WORKS
							</Link>
							<Link
								href="#order-scan"
								className="text-white hover:text-neon-green transition-colors"
							>
								ORDER SCAN
							</Link>
							<a href="#" className="btn-cyber">
								BUY NOW
							</a>
						</div>
					</div>

					{/* モバイルメニューボタン */}
					<div className="md:hidden">
						<button
							type="button"
							className="text-gray-400 hover:text-white focus:outline-none"
							aria-controls="mobile-menu"
							aria-expanded="false"
							onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
						>
							<span className="sr-only">Open main menu</span>
							{isMobileMenuOpen ? (
								<svg
									className="h-6 w-6"
									xmlns="http://www.w3.org/2000/svg"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
									aria-hidden="true"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M6 18L18 6M6 6l12 12"
									/>
								</svg>
							) : (
								<svg
									className="h-6 w-6"
									xmlns="http://www.w3.org/2000/svg"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
									aria-hidden="true"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M4 6h16M4 12h16M4 18h16"
									/>
								</svg>
							)}
						</button>
					</div>
				</div>
			</div>

			{/* モバイルメニュー */}
			<div
				className={`md:hidden transition-all duration-300 ease-in-out ${isMobileMenuOpen ? 'max-h-64 opacity-100' : 'max-h-0 opacity-0 overflow-hidden'
					}`}
				id="mobile-menu"
			>
				<div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-black/90 backdrop-blur-md">
					<Link
						href="#product"
						className="text-white hover:text-neon-green block px-3 py-2"
						onClick={() => setIsMobileMenuOpen(false)}
					>
						PRODUCT
					</Link>
					<Link
						href="#how-it-works"
						className="text-white hover:text-neon-green block px-3 py-2"
						onClick={() => setIsMobileMenuOpen(false)}
					>
						HOW IT WORKS
					</Link>
					<Link
						href="#order-scan"
						className="text-white hover:text-neon-green block px-3 py-2"
						onClick={() => setIsMobileMenuOpen(false)}
					>
						ORDER SCAN
					</Link>

					href="#"
					className="btn-cyber block mx-3 my-4 text-center"
					onClick={() => setIsMobileMenuOpen(false)}
          >
					BUY NOW
				</a>
			</div>
		</div>
    </nav >
  );
};

export default Navbar;-e 
### FILE: ./src/app/components/layout/PulsatingComponent.tsx

'use client';
import { useState, useEffect } from 'react';

const PulsatingComponent = () => {
	const [pulses, setPulses] = useState<{ id: number; size: number; opacity: number }[]>([]);

	// Create a new pulse every second
	useEffect(() => {
		const interval = setInterval(() => {
			setPulses(prev => [
				...prev,
				{
					id: Date.now(),   // 安全にユニークにするなら timestamp など
					size: 0,
					opacity: 0.8
				}
			]);
		}, 1000);

		return () => clearInterval(interval);
	}, []);

	// Update pulses animation
	useEffect(() => {
		const animationInterval = setInterval(() => {
			setPulses(prev =>
				prev
					.map(pulse => ({
						...pulse,
						size: pulse.size + 3,
						opacity: Math.max(0, pulse.opacity - 0.01),
					}))
					.filter(pulse => pulse.opacity > 0)
			);
		}, 50);

		return () => clearInterval(animationInterval);
	}, []);

	return (
		<div className="h-screen relative overflow-hidden bg-black">
			{/* 中心を基準にするコンテナ */}
			<div className="absolute inset-0 flex items-center justify-center pointer-events-none">
				{pulses.map(pulse => (
					<div
						key={pulse.id}
						className="absolute rounded-full border border-neonGreen"
						style={{
							width: `${pulse.size}px`,
							height: `${pulse.size}px`,
							opacity: pulse.opacity,
							left: '50%',     // ← 中心
							top: '50%',      // ← 中心
							transform: 'translate(-50%, -50%)',  // ← 真ん中合わせ
						}}
					/>
				))}

				<div className="z-10 border border-neonGreen px-8 py-3 text-white font-mono whitespace-nowrap bg-black bg-opacity-70">
					We Are <span className="text-orange-500">On-Chain</span>
				</div>
			</div>
		</div>
	);
};

export default PulsatingComponent;
-e 
### FILE: ./src/app/components/sphere/SmoothRotation.tsx

'use client';

import { useRef, useEffect } from 'react';
import * as THREE from 'three';

interface SmoothRotationProps {
  targetRef: React.RefObject<HTMLElement>;
  rotationRef: React.MutableRefObject<number>;  // ★ 変更
  sensitivity?: number;
  decay?: number;
}

/**
 * 物理ベース慣性スクロール → 回転変換
 */
const SmoothRotation: React.FC<SmoothRotationProps> = ({
  targetRef,
  rotationRef,
  sensitivity = 0.002,
  decay = 0.95,
}) => {
  const velocity = useRef(0);
  const isAnimating = useRef(false);
  const lastScrollY = useRef(0);

  const animate = () => {
    if (Math.abs(velocity.current) > 1e-5) {
      rotationRef.current += velocity.current;
      rotationRef.current %= Math.PI * 2;          // 正規化
      velocity.current *= decay;
      requestAnimationFrame(animate);
    } else {
      isAnimating.current = false;
    }
  };

  const onScroll = () => {
    const delta = window.scrollY - lastScrollY.current;
    lastScrollY.current = window.scrollY;

    velocity.current += delta * sensitivity;
    velocity.current = THREE.MathUtils.clamp(velocity.current, -0.1, 0.1);

    if (!isAnimating.current) {
      isAnimating.current = true;
      requestAnimationFrame(animate);
    }
  };

  useEffect(() => {
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return null;
};

export default SmoothRotation;
-e 
### FILE: ./src/app/components/sphere/SphereTop.tsx

'use client';
import Sphere from './Sphere';
import MessageOverlay from './MessageOverlay';

const SphereTop: React.FC = () => {
	return (

		<div className="relative h-[500vh]">
			{/* グラデーションオーバーレイ */}
			<div
				className="absolute inset-0 z-10 pointer-events-none"
				style={{
					background: `linear-gradient(to bottom,
              rgba(0,0,0,1) 0%,
              rgba(0,0,0,0.85) 10%,
              rgba(0,0,0,0.0) 30%,
              rgba(0,0,0,0.0) 70%,
              rgba(0,0,0,0.85) 90%,
              rgba(0,0,0,1) 100%)`,
				}}
			/>

			{/* 背景スフィア */}
			<div className="sticky top-0 h-screen w-full overflow-hidden">
				<Sphere
					enableControls={false}
					rotationSpeed={0.3}
					backgroundImage={`${process.env.NEXT_PUBLIC_CLOUDFRONT_URL}/cyberpunk-cityscape.webp`}
					useDefaultEnvironment={false}
				/>
			</div>

			{/* テキスト・UIオーバーレイ */}
			<div className="sticky top-0 h-screen w-full pointer-events-none">
				<MessageOverlay />
			</div>
		</div>
	);
};

export default SphereTop;
-e 
### FILE: ./src/app/components/sphere/MessageOverlay.tsx

// src/app/components/SelfCustodySection.tsx
'use client';

import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

/**
 * Self Custody Text Effect Section
 * - Tall scrollable region (300vh)
 * - Scanline overlay fixed across viewport
 * - After 200vh scroll, messages stick to top-left
 * - Typewriter intro line
 * - Scroll-triggered fade & slide key line
 * - Rainbow-tinted weak glitch effect
 * - Adjustable line breaks via whitespace-pre-line
 */
const SelfCustodySection: React.FC = () => {
  return (
    <section className="snap-start relative overflow-hidden">
      {/* Scanline Overlay */}
      <div className="pointer-events-none fixed inset-0 bg-gradient-to-b from-transparent via-black/10 to-transparent opacity-30 animate-scanline z-10" />

      {/* Sticky container: intro + key line stick after 200vh */}
      <div className="sticky top-0 pt-[200vh] z-20">
        <div className="absolute top-0 left-0 mt-8 ml-8 w-auto max-w-5xl text-left">
          {/* Typewriter Intro */}
          <motion.div
            className="overflow-hidden whitespace-nowrap border-r-2 border-neonGreen font-mono text-neonGreen text-sm mb-6"
            initial={{ width: 0 }}
            animate={{ width: '100%' }}
            transition={{ duration: 2, ease: 'easeInOut' }}
          >
            &gt; selfcustody.exe
          </motion.div>

          {/* Key highlighted line with glitch and custom line break */}
          <KeyLine
            text={`セルフカストディアンの戦士よ―魂を呼び覚ませ`}
            colorClass="text-neonGreen font-heading text-[7vw]"
            borderClass="border-l-2 border-neonGreen"
          />
        </div>
      </div>

      {/* Rainbow glitch keyframes and class */}
      <style jsx global>{`
        .glitchRainbow {
          position: relative;
          animation: glitchRainbow 3s ease-in-out infinite;
        }
        @keyframes glitchRainbow {
          0%,100% { text-shadow: none; }
          20% { text-shadow: 4px 0 #f00, -4px 0 #0ff; }
          40% { text-shadow: 4px 0 #ff0, -4px 0 #00f; }
          60% { text-shadow: 4px 0 #0f0, -4px 0 #f0f; }
          80% { text-shadow: 4px 0 #f0f, -4px 0 #ff0; }
        }
      `}</style>
    </section>
  );
};

interface KeyLineProps {
  text: string;
  colorClass: string;
  borderClass: string;
}

const KeyLine: React.FC<KeyLineProps> = ({ text, colorClass, borderClass }) => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end end'] });
  const opacity = useTransform(scrollYProgress, [0, 0.2], [0, 1]);
  const y = useTransform(scrollYProgress, [0, 0.2], [20, 0]);

  return (
    <motion.div
      ref={ref}
      style={{ opacity, y }}
      className={`relative overflow-hidden ${borderClass} pl-3`}
    >
      <span
        className={`${colorClass} glitchRainbow whitespace-pre-line leading-none`}
      >
        {text}
      </span>
    </motion.div>
  );
};

export default SelfCustodySection;
-e 
### FILE: ./src/app/components/sphere/Sphere.tsx

'use client';
import React, { useRef, useState, useEffect } from 'react';
import { Environment, PerspectiveCamera, OrbitControls } from '@react-three/drei';
import { useFrame, Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import styles from './Sphere.module.css';

// エラーバウンダリーコンポーネン
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
const RotatingGroup = ({ rotationY = 0, rotationSpeed = 0.3, autoRotate = true, children }) => {
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
		<group ref={groupRef}>
			{children}
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
			<sphereGeometry args={[2, 64, 64]} />
			<meshBasicMaterial map={texture} side={THREE.BackSide} />
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
}

const Sphere: React.FC<SphereProps> = ({
	className = '',
	autoRotate = true,
	enableControls = false,
	rotationSpeed = 0.3,
	backgroundImage = '',
	useDefaultEnvironment = true,
	manualRotation = 0
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


						{/* 回転制御コンポーネントで背景を囲む */}
						<RotatingGroup
							rotationY={manualRotation}
							rotationSpeed={rotationSpeed}
							autoRotate={autoRotate}
						>
							<BackgroundSphere backgroundImage={backgroundImage} />
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

export default Sphere;-e 
### FILE: ./src/app/components/ui/ScanlineEffect.tsx

// src/app/components/ui/ScanlineEffect.tsx
import React from 'react';

export const ScanlineEffect: React.FC = () => {
  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 z-10 h-full w-full bg-transparent opacity-10">
        {/* スキャンライン効果 */}
        <div className="absolute left-0 top-0 h-[1px] w-full animate-scanline bg-neonGreen opacity-50 shadow-[0_0_5px_#00FF7F]"></div>
        
        {/* ノイズオーバーレイ */}
        <div 
          className="absolute inset-0 bg-repeat opacity-5"
          style={{ 
            backgroundImage: "url('/images/noisy.webp')",
            mixBlendMode: "overlay"
          }}
        ></div>
      </div>
    </div>
  );
};

export default ScanlineEffect;-e 
### FILE: ./src/app/components/ui/GlitchText.tsx

// src/app/components/ui/GlitchText.tsx
'use client';
import React, { useState, useEffect } from 'react';

interface GlitchTextProps {
	text: string;
	className?: string;
	glitchIntensity?: 'low' | 'medium' | 'high';
	color?: string;
	isMainTitle?: boolean;
}

export const GlitchText: React.FC<GlitchTextProps> = ({
	text,
	className = '',
	glitchIntensity = 'medium',
	color = 'text-neonGreen',
	isMainTitle = false,
}) => {
	const [isGlitching, setIsGlitching] = useState(false);
	const [rgbShift, setRgbShift] = useState({ r: 0, g: 0, b: 0 });

	// グリッチ効果のランダム発生
	useEffect(() => {
		const triggerGlitch = () => {
			const shouldGlitch = Math.random() > (
				glitchIntensity === 'low' ? 0.9 :
					glitchIntensity === 'medium' ? 0.8 : 0.7
			);

			if (shouldGlitch) {
				setIsGlitching(true);

				// RGB分離エフェクト用の値を設定
				setRgbShift({
					r: Math.random() * 4 - 2,
					g: Math.random() * 4 - 2,
					b: Math.random() * 4 - 2
				});

				// 短い時間後にグリッチを終了
				setTimeout(() => {
					setIsGlitching(false);
					setRgbShift({ r: 0, g: 0, b: 0 });
				}, Math.random() * 200 + 50);
			}
		};

		const intervalId = setInterval(triggerGlitch, Math.random() * 3000 + 2000);
		return () => clearInterval(intervalId);
	}, [glitchIntensity]);

	const baseClasses = `relative ${color} ${className} ${isMainTitle ? 'font-heading font-bold tracking-wider' : ''}`;

	const glitchClasses = isGlitching ? 'animate-glitch' : '';

	const textShadow = isMainTitle
		? `0 0 5px currentColor, 0 0 10px currentColor, 0 0 20px currentColor`
		: `0 0 3px currentColor`;

	return (
		<div className="relative">
			{/* RGB分離効果 */}
			{isGlitching && (
				<>
					<span
						className={`absolute ${baseClasses} opacity-50 text-red-500`}
						style={{
							transform: `translate(${rgbShift.r}px, 0)`,
							textShadow: '0 0 2px currentColor',
							left: 0,
							top: 0,
							filter: 'blur(0.5px)'
						}}
						aria-hidden="true"
					>
						{text}
					</span>
					<span
						className={`absolute ${baseClasses} opacity-50 text-green-500`}
						style={{
							transform: `translate(${rgbShift.g}px, 0)`,
							textShadow: '0 0 2px currentColor',
							left: 0,
							top: 0,
							filter: 'blur(0.5px)'
						}}
						aria-hidden="true"
					>
						{text}
					</span>
					<span
						className={`absolute ${baseClasses} opacity-50 text-blue-500`}
						style={{
							transform: `translate(${rgbShift.b}px, 0)`,
							textShadow: '0 0 2px currentColor',
							left: 0,
							top: 0,
							filter: 'blur(0.5px)'
						}}
						aria-hidden="true"
					>
						{text}
					</span>
				</>
			)}

			{/* メインテキスト */}
			<span
				className={`${baseClasses} ${glitchClasses} inline-block`}
				style={{
					textShadow,
					animation: isMainTitle ? 'pulse 2s ease-in-out infinite' : undefined,
				}}
			>
				{text}
			</span>
		</div>
	);
};

export default GlitchText;-e 
### FILE: ./src/app/components/hero-section/GlitchEffects.tsx

// src/app/components/hero-section/GlitchEffects.tsx
'use client';
import { useState, useEffect } from 'react';

export interface GlitchState {
  active: boolean;
  intensity: number;
  type: 'none' | 'horizontal' | 'vertical' | 'rgb' | 'rgb-horizontal' | 'rgb-vertical' | 'rgb-shift';
}

// グリッチシーケンスの定義
const defaultGlitchSequence = [
  // 中程度のRGBシフト
  { delay: 2000, duration: 400, type: 'rgb', intensity: 2 },
  // 間隔
  { delay: 1000, duration: 0, type: 'none', intensity: 0 },
  // 水平グリッチ + RGB
  { delay: 300, duration: 250, type: 'rgb-horizontal', intensity: 3 },
  // 短い間隔
  { delay: 800, duration: 0, type: 'none', intensity: 0 },
  // 垂直グリッチ + RGB
  { delay: 250, duration: 200, type: 'rgb-vertical', intensity: 2 },
  // 中程度の間隔
  { delay: 1500, duration: 0, type: 'none', intensity: 0 },
  // 強いRGBシフト + 水平グリッチ
  { delay: 200, duration: 300, type: 'rgb-horizontal', intensity: 4 },
  // 長い間隔
  { delay: 3000, duration: 0, type: 'none', intensity: 0 },
  // 一連の短いRGBグリッチ
  { delay: 150, duration: 80, type: 'rgb-shift', intensity: 3 },
  { delay: 100, duration: 50, type: 'rgb-horizontal', intensity: 2 },
  { delay: 200, duration: 100, type: 'rgb-vertical', intensity: 3 },
  // 長い休止
  { delay: 4000, duration: 0, type: 'none', intensity: 0 },
];

export function useGlitchEffect(
  sequence = defaultGlitchSequence,
  initialDelay = 3000
) {
  const [glitchState, setGlitchState] = useState<GlitchState>({
    active: false,
    intensity: 0,
    type: 'none',
  });

  useEffect(() => {
    let currentIndex = 0;
    let timeoutId: NodeJS.Timeout;

    const runGlitchSequence = () => {
      const { delay, duration, type, intensity } = sequence[currentIndex];

      // グリッチの実行
      if (duration > 0) {
        setGlitchState({ 
          active: true, 
          type: type as GlitchState['type'], 
          intensity 
        });

        // グリッチの終了
        setTimeout(() => {
          setGlitchState({ active: false, type: 'none', intensity: 0 });
        }, duration);
      }

      // 次のグリッチへ
      currentIndex = (currentIndex + 1) % sequence.length;
      timeoutId = setTimeout(runGlitchSequence, delay);
    };

    // シーケンス開始
    timeoutId = setTimeout(runGlitchSequence, initialDelay);

    return () => clearTimeout(timeoutId);
  }, [sequence, initialDelay]);

  // グリッチスタイル計算関数
  const getGlitchStyle = (baseTransform: string = '') => {
    if (!glitchState.active) return {};

    const { type, intensity } = glitchState;
    let transform = baseTransform;
    let filter = '';

    // 強度に応じたスタイル
    const intensityFactor = intensity * 0.5;

    switch (type) {
      case 'horizontal':
        transform += ` translateX(${Math.random() * intensity * 4 - intensity * 2}px)`;
        filter = `contrast(${1 + intensityFactor * 0.1})`;
        break;
      case 'vertical':
        transform += ` translateY(${Math.random() * intensity * 2 - intensity}px)`;
        filter = `contrast(${1 + intensityFactor * 0.05})`;
        break;
      case 'rgb':
        filter = `hue-rotate(${intensityFactor * 15}deg) contrast(${1 + intensityFactor * 0.15})`;
        break;
      case 'rgb-horizontal':
        transform += ` translateX(${Math.random() * intensity * 4 - intensity * 2}px)`;
        filter = `hue-rotate(${intensityFactor * 20}deg) contrast(${1 + intensityFactor * 0.2})`;
        break;
      case 'rgb-vertical':
        transform += ` translateY(${Math.random() * intensity * 3 - intensity * 1.5}px)`;
        filter = `hue-rotate(${intensityFactor * 20}deg) contrast(${1 + intensityFactor * 0.15})`;
        break;
      case 'rgb-shift':
        // RGBずれ効果のみ (変形なし)
        filter = `hue-rotate(${intensityFactor * 30}deg) saturate(${1 + intensityFactor * 0.5})`;
        break;
      default:
        break;
    }

    return {
      transform,
      filter,
      transition: 'transform 0.05s linear, filter 0.05s linear',
    };
  };

  return { glitchState, getGlitchStyle };
}-e 
### FILE: ./src/app/components/hero-section/HeroTitle.tsx

// src/app/components/hero-section/HeroTitle.tsx
import React from 'react';
import GlitchText from '../ui/GlitchText';
import styles from './HeroSection.module.css';
interface HeroTitleProps {
	style?: React.CSSProperties;
}

export const HeroTitle: React.FC<HeroTitleProps> = ({ style }) => {
	return (
		<div className={styles.titleContainer} style={style}>
			{/* メインタイトル */}
			<div className={styles.titleGroup}>
				<GlitchText
					text="PAY"
					className="text-7xl sm:text-8xl lg:text-9xl"
					color="text-neonOrange"
					glitchIntensity="high"
					isMainTitle={true}
				/>
				<GlitchText
					text="PUMP"
					className="text-7xl sm:text-8xl lg:text-9xl"
					color="text-neonGreen"
					glitchIntensity="medium"
					isMainTitle={true}
				/>
				<GlitchText
					text="LIVE"
					className="text-7xl sm:text-8xl lg:text-9xl"
					color="text-white"
					glitchIntensity="high"
					isMainTitle={true}
				/>
			</div>
		</div>
	);
};

export default HeroTitle;-e 
### FILE: ./src/app/components/hero-section/HeroModel.tsx

// src/app/components/hero-section/HeroModel.tsx
import React from 'react';
import ProteinModel from '../3d/ProteinModel';

interface HeroModelProps {
	style?: React.CSSProperties;
	scale?: number;
}

export const HeroModel: React.FC<HeroModelProps> = ({
	style,
	scale = 1.2
}) => {
	return (
		<ProteinModel
			autoRotate={true}
			mouseControl={true}
			scale={scale}
		/>
	);
};

export default HeroModel;-e 
### FILE: ./src/app/components/hero-section/HeroBackground.tsx

// src/app/components/hero-section/HeroBackground.tsx
import React from 'react';
import styles from './HeroSection.module.css';
import { GlitchState } from './GlitchEffects';

interface HeroBackgroundProps {
  backgroundTransform: string;
  midLayerTransform: string;
  glitchState: GlitchState;
  getGlitchStyle: (baseTransform: string) => any;
}

export const HeroBackground: React.FC<HeroBackgroundProps> = ({
  backgroundTransform,
  midLayerTransform,
  glitchState,
  getGlitchStyle,
}) => {
  return (
    <>
      {/* 背景画像 - グリッチ効果に対応 */}
      <div
        className={`${styles.backgroundImage} ${glitchState.active ? styles.glitchActive : ''}`}
        style={{
          backgroundImage: `url('${process.env.NEXT_PUBLIC_CLOUDFRONT_URL}/pepe-cyberpunk.webp')`,
          ...(!glitchState.active
            ? {
              filter: 'contrast(1.1) brightness(0.9)',
              transform: backgroundTransform,
              transition: 'transform 2s ease-out',
            }
            : getGlitchStyle(backgroundTransform)
          )
        }}
      />
      <div
        className={styles.darkOverlay}
        style={{
          transform: `scale(1.02) ${midLayerTransform}`,
          transition: 'transform 1.5s ease-out',
        }}
      />

      {/* 中心部に光の効果 - マウスとは逆方向に少し動く */}
      <div
        className={styles.centerLight}
        style={{
          transform: midLayerTransform,
          transition: 'transform 1.5s ease-out',
        }}
      />

      {/* グリッチに対応するノイズレイヤー */}
      <div className={`${styles.mainNoise} ${glitchState.active ? styles.noiseIntense : ''}`} />

      {/* 格子状ノイズ - 少し動く */}
      <div
        className={styles.gridNoise}
        style={{
          backgroundImage: `url('${process.env.NEXT_PUBLIC_CLOUDFRONT_URL}/noisy_grid.webp')`,
          transform: midLayerTransform,
          transition: 'transform 1.5s ease-out',
        }}
      />

      {/* 動くノイズ */}
      <div className={styles.movingNoise} />

      {/* RGB分離効果 - グリッチ状態に対応 */}
      <div className={`${styles.rgbSplit} ${glitchState.active && glitchState.type.includes('rgb') ? styles.rgbActive : ''}`} />

      {/* グリッチブロックエフェクト */}
      {glitchState.active && glitchState.intensity > 2 && (
        <div
          className={styles.glitchBlocks}
          style={{
            backgroundImage: `url(''${process.env.NEXT_PUBLIC_CLOUDFRONT_URL}/pepe-cyberpunk.webp')`,
            opacity: 0.4 + (glitchState.intensity * 0.05),
          }}
        />
      )}

      {/* RGBスライス効果 - 強いグリッチ時のみ */}
      {glitchState.active && glitchState.type.includes('rgb') && glitchState.intensity > 2 && (
        <>
          <div
            className={styles.rgbSliceRed}
            style={{
              backgroundImage: `url('${process.env.NEXT_PUBLIC_CLOUDFRONT_URL}/pepe-cyberpunk.webp')`,
              transform: `translateX(${glitchState.intensity * 1.5}px)`,
            }}
          />
          <div
            className={styles.rgbSliceBlue}
            style={{
              backgroundImage: `url('${process.env.NEXT_PUBLIC_CLOUDFRONT_URL}/pepe-cyberpunk.webp')`,
              transform: `translateX(-${glitchState.intensity * 1.5}px)`,
            }}
          />
        </>
      )}
    </>
  );
};

export default HeroBackground;-e 
### FILE: ./src/app/components/hero-section/HeroSection.tsx

'use client';
import React, { useState, useEffect } from 'react';
import ScanlineEffect from '../ui/ScanlineEffect';
import styles from './HeroSection.module.css';
import { useGlitchEffect } from './GlitchEffects';
import HeroBackground from './HeroBackground';
import HeroTitle from './HeroTitle';
import HeroModel from './HeroModel';
import ScrollSpace from '../glowing-3d-text/ScrollSpace';

export const HeroSection: React.FC = () => {
	const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
	const { glitchState, getGlitchStyle } = useGlitchEffect();

	useEffect(() => {
		const handleMouseMove = (e: MouseEvent) => {
			setMousePosition({
				x: e.clientX / window.innerWidth,
				y: e.clientY / window.innerHeight,
			});
		};
		window.addEventListener('mousemove', handleMouseMove);
		return () => window.removeEventListener('mousemove', handleMouseMove);
	}, []);

	const backgroundTransform = `
    scale(1.05)
    translateX(${(mousePosition.x - 0.5) * 10}px)
    translateY(${(mousePosition.y - 0.5) * 10}px)
  `;
	const midLayerTransform = `
    translateX(${(mousePosition.x - 0.5) * -15}px)
    translateY(${(mousePosition.y - 0.5) * -7.5}px)
  `;
	const foregroundTransform = `
    translateX(${(mousePosition.x - 0.5) * -25}px)
    translateY(${(mousePosition.y - 0.5) * -12.5}px)
  `;

	return (
		<div className="sticky top-0 h-screen overflow-hidden">
			{/* 背景 & エフェクト */}
			<HeroBackground
				backgroundTransform={backgroundTransform}
				midLayerTransform={midLayerTransform}
				glitchState={glitchState}
				getGlitchStyle={getGlitchStyle}
			/>

			{/* 
			
						<div
				className="absolute inset-0 z-[15] pointer-events-none"
				style={{
					transform: midLayerTransform,
					transition: 'transform 1.5s ease-out',
				}}
			>
				<HeroModel />
			</div>

			*/}


			{/* タイトル（前景） */}
			<div
				className={styles.contentContainer}
				style={{
					transform: foregroundTransform,
					transition: 'transform 0.5s ease-out',
				}}
			>
				<HeroTitle />
			</div>

			{/* スキャンライン */}
			<ScanlineEffect />
		</div>

	);
};

export default HeroSection;
-e 
### FILE: ./src/app/components/pepe-gallery/ScrollableImages.tsx

'use client';

import { useRef, useState, useEffect, useMemo } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { useScroll, Scroll } from '@react-three/drei';
import { imageFiles } from './utils/constants';
import { calculateOptimalImagePositions } from './utils/imageLoader';
import ImageItem from './ImageItem';

const ScrollableImages: React.FC = () => {
	// スクロールデータを取得
	const data = useScroll();
	const groupRef = useRef<THREE.Group>(null);

	// ビューポートのサイズを取得
	const { width, height } = useThree((state) => state.viewport);

	// 画面に表示可能な画像数の制限（パフォーマンス最適化）
	const [visibleRange, setVisibleRange] = useState({ start: 0, end: 12 });

	// サイズに基づいた最適な画像配置を計算
	const imagePositions = useMemo(() => {
		return calculateOptimalImagePositions(imageFiles, width, height);
	}, [width, height]);

	// スクロール位置に基づいて表示する画像範囲を更新
	useEffect(() => {
		const updateVisibleRange = () => {
			// スクロール位置に基づいて表示範囲を計算
			const scrollOffset = Math.floor(data.offset * imageFiles.length);
			const start = Math.max(0, scrollOffset - 6);
			const end = Math.min(imageFiles.length, scrollOffset + 12);

			setVisibleRange({ start, end });
		};

		// スクロールイベントのリスナーを追加
		const scrollElement = data.el;
		if (scrollElement) {
			scrollElement.addEventListener('scroll', updateVisibleRange);
		}

		// 初期表示範囲を設定
		updateVisibleRange();

		// クリーンアップ関数
		return () => {
			if (scrollElement) {
				scrollElement.removeEventListener('scroll', updateVisibleRange);
			}
		};
	}, [data]);

	// 各フレームでのスクロールに基づくアニメーション
	useFrame(() => {
		if (groupRef.current) {
			// 各画像の状態を更新（必要に応じて）
			if (groupRef.current.children.length > 0) {
				// 例: スクロール範囲に基づく透明度や位置の調整
				const scrollRange = data.range(0, 1);

				// 必要に応じてここに追加のスクロールアニメーションを実装
			}
		}
	});

	return (
		<Scroll>
			<group ref={groupRef}>
				{imageFiles.map((image, index) => {
					// 画像の位置を取得（デフォルト位置を設定）
					const position = imagePositions[image.id] || [
						(index % 5 - 2) * 2,
						-Math.floor(index / 5) * 3,
						0
					];

					// スクロール範囲内の画像のみをレンダリング
					const isVisible = index >= visibleRange.start && index <= visibleRange.end;

					// 画像のスクロール進行状況を計算
					const scrollProgress = data.range(
						index / imageFiles.length,
						1 / imageFiles.length
					);

					return (
						<ImageItem
							key={image.id}
							image={image}
							position={position}
							scrollProgress={scrollProgress}
							isVisible={isVisible}
							index={index}
						/>
					);
				})}
			</group>
		</Scroll>
	);
};

export default ScrollableImages;-e 
### FILE: ./src/app/components/pepe-gallery/ImageItem.tsx

'use client';

import { useRef, useState, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Image as DreiImage } from '@react-three/drei';
import { ImageFile, SIZE_SCALES } from './utils/constants';
import styles from './styles/GalleryEffects.module.css';
import { useImageLoader } from './utils/imageLoader';
import { easing } from 'maath';

interface ImageItemProps {
  image: ImageFile;
  position: [number, number, number];
  scrollProgress: number;
  isVisible?: boolean;
  index: number;
}

const ImageItem: React.FC<ImageItemProps> = ({
  image,
  position,
  scrollProgress,
  isVisible = true,
  index
}) => {
  const ref = useRef<any>(null);
  const { size } = image;
  const scale = SIZE_SCALES[size];
  
  // スケールのサイズに基づく調整
  const scaleFactor = typeof scale === 'number' ? scale : 
                     Array.isArray(scale) ? [scale[0], scale[1], 1] : [scale, scale, 1];
  
  // ビューポートの幅と高さを取得
  const { width, height } = useThree((state) => state.viewport);
  
  // 画像の読み込み状態を取得
  const { loading, error } = useImageLoader(image.path);
  
  // スクロール位置に基づく動的なズーム効果
  const scrollBasedZoom = 1 + (scrollProgress * 0.2);
  
  // グレースケール効果の状態
  const [grayscale, setGrayscale] = useState(1);
  
  // スクロール位置に基づいてグレースケール効果を更新
  useEffect(() => {
    // インデックスに基づいて異なるスクロール範囲でグレースケール効果を適用
    const startPoint = (index % 5) * 0.1 + 0.2;
    const endPoint = startPoint + 0.3;
    
    // スクロール範囲内に入ったらカラーに変化
    if (scrollProgress > startPoint && scrollProgress < endPoint) {
      setGrayscale(0); // カラー
    } else {
      setGrayscale(1); // グレースケール
    }
  }, [scrollProgress, index]);
  
  // 各フレームで適用するアニメーション
  useFrame((state, delta) => {
    if (ref.current) {
      // 滑らかなホバリングエフェクト（浮遊感）
      const time = state.clock.getElapsedTime();
      const hoverEffect = Math.sin(time * 0.3 + index) * 0.1;
      
      // スクロールに応じた移動とスケール変更
      easing.damp3(
        ref.current.position,
        [
          position[0] + Math.sin(time * 0.1 + index) * 0.3,
          position[1] + hoverEffect,
          position[2]
        ],
        0.2,
        delta
      );
      
      // スクロールに応じたサイズ変化
      easing.damp3(
        ref.current.scale,
        [
          scaleFactor[0] * scrollBasedZoom,
          scaleFactor[1] * scrollBasedZoom,
          1
        ],
        0.3,
        delta
      );
      
      // スクロールに応じた回転効果
      easing.dampE(
        ref.current.rotation,
        [0, 0, Math.sin(time * 0.2 + index) * 0.05],
        0.3,
        delta
      );
      
      // グレースケール効果の滑らかな遷移
      easing.damp(
        ref.current.material,
        'grayscale',
        grayscale,
        0.3,
        delta
      );
    }
  });
  
  if (!isVisible || loading || error) {
    return null;
  }
  
  return (
    <DreiImage
      ref={ref}
      url={image.path}
      position={position}
      scale={scaleFactor}
      transparent
      opacity={1}
      toneMapped={false}
      className={`${styles.imageGlow} ${styles.parallaxLayer}`}
    />
  );
};

export default ImageItem;-e 
### FILE: ./src/app/components/pepe-gallery/GalleryTypography.tsx

'use client';

import React, { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Text, useScroll } from '@react-three/drei';
import { TYPOGRAPHY_POSITIONS } from './utils/constants';
import { applyTextFadeEffect, applyFloatingAnimation } from './utils/scrollAnimation';

// テキスト要素の型定義
interface TextElement {
  id: number;
  text: string;
  position: [number, number, number];
  anchorX?: 'left' | 'center' | 'right';
  visibleRange: [number, number]; // [表示開始位置, 表示終了位置]
}

const GalleryTypography: React.FC = () => {
  // テキスト要素の定義
  const textElements: TextElement[] = [
    {
      id: 1,
      text: "PEPE",
      position: TYPOGRAPHY_POSITIONS[0].position as [number, number, number],
      anchorX: TYPOGRAPHY_POSITIONS[0].anchorX as 'left' | 'center' | 'right',
      visibleRange: [0, 0.4] // スクロール0%〜40%の間で表示
    },
    {
      id: 2,
      text: "GALLERY",
      position: TYPOGRAPHY_POSITIONS[1].position as [number, number, number],
      anchorX: TYPOGRAPHY_POSITIONS[1].anchorX as 'left' | 'center' | 'right',
      visibleRange: [0.3, 0.7] // スクロール30%〜70%の間で表示
    },
    {
      id: 3,
      text: "COLLECTION",
      position: TYPOGRAPHY_POSITIONS[2].position as [number, number, number],
      anchorX: TYPOGRAPHY_POSITIONS[2].anchorX as 'left' | 'center' | 'right',
      visibleRange: [0.6, 1.0] // スクロール60%〜100%の間で表示
    }
  ];
  
  // スクロールデータを取得
  const data = useScroll();
  
  // テキスト要素の参照を保持する配列
  const textRefs = useRef<Array<React.RefObject<any>>>([]);
  
  // テキスト要素の参照を初期化
  if (textRefs.current.length !== textElements.length) {
    textRefs.current = Array(textElements.length)
      .fill(null)
      .map((_, i) => textRefs.current[i] || React.createRef());
  }
  
  // ビューポートのサイズを取得
  const { width, height } = useThree((state) => state.viewport);
  
  // テキストのスタイル設定
  const textStyle = {
    font: '/Inter-Regular.woff', // プロジェクトに合わせて変更
    fontSize: width * 0.08,
    letterSpacing: -0.05,
    lineHeight: 1,
    'material-toneMapped': false
  };
  
  // 各フレームでのアニメーション処理
  useFrame((state, delta) => {
    const scrollOffset = data.offset; // スクロール位置（0-1）
    const time = state.clock.getElapsedTime();
    
    // 各テキスト要素にアニメーション効果を適用
    textElements.forEach((element, index) => {
      const ref = textRefs.current[index];
      if (ref && ref.current) {
        // フェードイン/アウト効果の適用
        applyTextFadeEffect(ref, scrollOffset, element.visibleRange, delta);
        
        // 浮遊アニメーションの適用
        applyFloatingAnimation(
          ref, 
          time + index, 
          element.position,
          0.05 // 浮遊の振幅
        );
      }
    });
  });
  
  return (
    <>
      {textElements.map((element, index) => (
        <Text
          key={element.id}
          ref={textRefs.current[index]}
          position={element.position}
          anchorX={element.anchorX || 'center'}
          anchorY="middle"
          color="black"
          opacity={0} // 初期状態では非表示
          {...textStyle}
        >
          {element.text}
        </Text>
      ))}
    </>
  );
};

export default GalleryTypography;-e 
### FILE: ./src/app/components/pepe-gallery/utils/constants.ts

// 画像サイズの定義
export type ImageSize = 'S' | 'M' | 'L';

// 画像ファイルの型定義
export interface ImageFile {
  id: number;
  filename: string;
  size: ImageSize;
  path: string;
}

// CDN URL設定（必要に応じて環境変数から取得する実装に変更可能）
export const CDN_URL = process.env.NEXT_PUBLIC_CLOUDFRONT_URL || '';

// 画像サイズに応じたスケール係数の定義
export const SIZE_SCALES = {
  S: 1.5,
  M: 2.5,
  L: 4.0
};

// 画像サイズに応じたZ位置（深度）設定
export const SIZE_Z_POSITIONS = {
  S: 10,
  M: 5,
  L: 0
};

// スクロール効果の設定
export const SCROLL_SETTINGS = {
  damping: 0.2,  // スクロールの減衰係数
  pages: 5,      // スクロールページ数
  distance: 0.5  // スクロール距離係数
};

// アニメーション設定
export const ANIMATION_SETTINGS = {
  zoomFactor: 0.3,    // ズーム効果の強さ
  transitionSpeed: 0.15,  // 遷移の速さ
  rotationFactor: 0.02    // 回転効果の強さ
};

// 画像ファイルのリスト
export const imageFiles: ImageFile[] = [
  { id: 1, filename: '1L.webp', size: 'L', path: `${CDN_URL}/pepe/1L.webp` },
  { id: 2, filename: '2M.webp', size: 'M', path: `${CDN_URL}/pepe/2M.webp` },
  { id: 3, filename: '3S.webp', size: 'S', path: `${CDN_URL}/pepe/3S.webp` },
  { id: 4, filename: '4S.webp', size: 'S', path: `${CDN_URL}/pepe/4S.webp` },
  { id: 5, filename: '5M.webp', size: 'M', path: `${CDN_URL}/pepe/5M.webp` },
  { id: 6, filename: '6L.webp', size: 'L', path: `${CDN_URL}/pepe/6L.webp` },
  { id: 7, filename: '7M.webp', size: 'M', path: `${CDN_URL}/pepe/7M.webp` },
  { id: 8, filename: '8M.webp', size: 'M', path: `${CDN_URL}/pepe/8M.webp` },
  { id: 9, filename: '9L.webp', size: 'L', path: `${CDN_URL}/pepe/9L.webp` },
  { id: 10, filename: '10S.webp', size: 'S', path: `${CDN_URL}/pepe/10S.webp` },
  { id: 11, filename: '11S.webp', size: 'S', path: `${CDN_URL}/pepe/11S.webp` },
  { id: 12, filename: '12M.webp', size: 'M', path: `${CDN_URL}/pepe/12M.webp` },
  { id: 13, filename: '13L.webp', size: 'L', path: `${CDN_URL}/pepe/13L.webp` },
  { id: 14, filename: '14L.webp', size: 'L', path: `${CDN_URL}/pepe/14L.webp` },
  { id: 15, filename: '15M.webp', size: 'M', path: `${CDN_URL}/pepe/15M.webp` },
  { id: 16, filename: '16S.webp', size: 'S', path: `${CDN_URL}/pepe/16S.webp` },
  { id: 17, filename: '17S.webp', size: 'S', path: `${CDN_URL}/pepe/17S.webp` },
  { id: 18, filename: '18M.webp', size: 'M', path: `${CDN_URL}/pepe/18M.webp` },
  { id: 19, filename: '19L.webp', size: 'L', path: `${CDN_URL}/pepe/19L.webp` },
  { id: 20, filename: '20L.webp', size: 'L', path: `${CDN_URL}/pepe/20L.webp` },
  { id: 21, filename: '21S.webp', size: 'S', path: `${CDN_URL}/pepe/21S.webp` },
  { id: 22, filename: '22S.webp', size: 'S', path: `${CDN_URL}/pepe/22S.webp` },
  { id: 23, filename: '23L.webp', size: 'L', path: `${CDN_URL}/pepe/23L.webp` },
  { id: 24, filename: '24L.webp', size: 'L', path: `${CDN_URL}/pepe/24L.webp` },
  { id: 25, filename: '25S.webp', size: 'S', path: `${CDN_URL}/pepe/25S.webp` },
  { id: 26, filename: '26S.webp', size: 'S', path: `${CDN_URL}/pepe/26S.webp` },
  { id: 27, filename: '27S.webp', size: 'S', path: `${CDN_URL}/pepe/27S.webp` },
  { id: 28, filename: '28L.webp', size: 'L', path: `${CDN_URL}/pepe/28L.webp` },
  { id: 29, filename: '29S.webp', size: 'S', path: `${CDN_URL}/pepe/29S.webp` },
  { id: 30, filename: '30S.webp', size: 'S', path: `${CDN_URL}/pepe/30S.webp` },
  { id: 31, filename: '31M.webp', size: 'M', path: `${CDN_URL}/pepe/31M.webp` },
  { id: 32, filename: '32M.webp', size: 'M', path: `${CDN_URL}/pepe/32M.webp` },
  { id: 33, filename: '33M.webp', size: 'M', path: `${CDN_URL}/pepe/33M.webp` },
  { id: 34, filename: '34S.webp', size: 'S', path: `${CDN_URL}/pepe/34S.webp` },
  { id: 35, filename: '35L.webp', size: 'L', path: `${CDN_URL}/pepe/35L.webp` },
];

// テキスト要素の配置設定
export const TYPOGRAPHY_POSITIONS = [
  { text: "PEPE", position: [-2, 0, 12], anchorX: "left" },
  { text: "GALLERY", position: [2, -2, 12], anchorX: "right" },
  { text: "COLLECTION", position: [0, -4.5, 12], anchorX: "center" }
];-e 
### FILE: ./src/app/components/pepe-gallery/utils/imageLoader.ts

import { useState, useEffect, useCallback } from 'react';
import * as THREE from 'three';
import { ImageFile } from './constants';

/**
 * 画像読み込み状態の型定義
 */
interface ImageLoadingState {
  texture: THREE.Texture | null;
  loading: boolean;
  error: Error | null;
}

/**
 * 画像読み込み用カスタムフック
 * 指定されたURLから画像をテクスチャとして読み込む
 */
export const useImageLoader = (imageUrl: string): ImageLoadingState => {
  const [state, setState] = useState<ImageLoadingState>({
    texture: null,
    loading: true,
    error: null
  });

  useEffect(() => {
    // 画像を読み込むたびに状態をリセット
    setState({ texture: null, loading: true, error: null });

    const textureLoader = new THREE.TextureLoader();
    
    textureLoader.load(
      imageUrl,
      // 読み込み成功時
      (loadedTexture) => {
        loadedTexture.needsUpdate = true;
        setState({
          texture: loadedTexture,
          loading: false,
          error: null
        });
      },
      // 読み込み進捗時（必要に応じて実装）
      undefined,
      // 読み込み失敗時
      (error) => {
        console.error(`Error loading texture from ${imageUrl}:`, error);
        setState({
          texture: null,
          loading: false,
          error: new Error(`Failed to load image: ${error.message}`)
        });
      }
    );

    // クリーンアップ関数
    return () => {
      // コンポーネントのアンマウント時にテクスチャを破棄
      if (state.texture) {
        state.texture.dispose();
      }
    };
  }, [imageUrl]);

  return state;
};

/**
 * 複数画像の事前読み込み用ユーティリティ
 * 指定された画像リストを非同期で事前読み込みする
 */
export const preloadImages = async (images: ImageFile[]): Promise<void> => {
  const textureLoader = new THREE.TextureLoader();
  
  // すべての画像を非同期で読み込む
  const loadPromises = images.map(img => {
    return new Promise<void>((resolve, reject) => {
      textureLoader.load(
        img.path,
        () => resolve(),
        undefined,
        (error) => {
          console.warn(`Failed to preload image ${img.filename}:`, error);
          resolve(); // エラーでも続行するため、rejectではなくresolveを呼び出す
        }
      );
    });
  });

  // すべての読み込みが完了するまで待機
  await Promise.all(loadPromises);
};

/**
 * 画像配置を最適化するためのユーティリティ
 * サイズに基づいて画像の最適な配置を計算する
 */
export const calculateOptimalImagePositions = (
  images: ImageFile[],
  viewportWidth: number,
  viewportHeight: number
): { [key: number]: [number, number, number] } => {
  // 画像IDをキーとし、位置座標[x, y, z]を値とするオブジェクト
  const positions: { [key: number]: [number, number, number] } = {};
  
  // 特大画像(L)、中型画像(M)、小型画像(S)をグループ化
  const largeImages = images.filter(img => img.size === 'L');
  const mediumImages = images.filter(img => img.size === 'M');
  const smallImages = images.filter(img => img.size === 'S');
  
  // 視覚的な配置の多様性のために使用する係数
  const diversityFactor = 0.7;
  
  // Lサイズ画像の配置 - 主要な位置に配置
  largeImages.forEach((img, index) => {
    const xPos = (index % 3 - 1) * viewportWidth / 2.5;
    const yPos = -Math.floor(index / 3) * viewportHeight / 1.5;
    const zPos = 0; // 前面に配置
    positions[img.id] = [xPos, yPos, zPos];
  });
  
  // Mサイズ画像の配置 - Lサイズの間を埋める
  mediumImages.forEach((img, index) => {
    const xPos = ((index % 4) - 1.5) * viewportWidth / 3 * diversityFactor;
    const yPos = -Math.floor(index / 4) * viewportHeight / 2 - viewportHeight / 4;
    const zPos = 5; // Lの後ろに配置
    positions[img.id] = [xPos, yPos, zPos];
  });
  
  // Sサイズ画像の配置 - 埋め草的に散らす
  smallImages.forEach((img, index) => {
    const xPos = ((index % 5) - 2) * viewportWidth / 4 * diversityFactor;
    const yPos = -Math.floor(index / 5) * viewportHeight / 2.5 - viewportHeight / 3;
    const zPos = 10; // 最も後ろに配置
    positions[img.id] = [xPos, yPos, zPos];
  });
  
  return positions;
};-e 
### FILE: ./src/app/components/pepe-gallery/utils/scrollAnimation.ts

import { MutableRefObject } from 'react';
import { Object3D, Vector3, Euler } from 'three';
import { easing } from 'maath';

/**
 * スクロール位置に基づくアニメーション値の計算
 * @param start 効果の開始位置 (0-1)
 * @param end 効果の終了位置 (0-1)
 * @param scrollOffset 現在のスクロール位置 (0-1)
 * @param minValue 最小値
 * @param maxValue 最大値
 * @returns 計算された値
 */
export const calculateScrollValue = (
	start: number,
	end: number,
	scrollOffset: number,
	minValue: number,
	maxValue: number
): number => {
	// スクロール範囲外の場合
	if (scrollOffset < start) return minValue;
	if (scrollOffset > end) return maxValue;

	// 範囲内の場合は線形補間
	const normalizedOffset = (scrollOffset - start) / (end - start);
	return minValue + normalizedOffset * (maxValue - minValue);
};

/**
 * スクロール位置に基づく回転効果
 */
export const applyScrollRotation = (
	ref: MutableRefObject<Object3D | null>,
	scrollOffset: number,
	delta: number,
	intensity: number = 0.1
): void => {
	if (!ref.current) return;

	// スクロール位置に基づく回転角度の計算
	const targetRotation = new Euler(
		0,
		scrollOffset * Math.PI * intensity,
		0
	);

	// 滑らかな回転の適用
	easing.dampE(
		ref.current.rotation,
		[targetRotation.x, targetRotation.y, targetRotation.z],
		0.3,
		delta
	);
};

/**
 * スクロール位置に基づくズーム効果
 */
export const applyScrollZoom = (
	ref: MutableRefObject<Object3D | null>,
	scrollOffset: number,
	delta: number,
	baseScale: number | [number, number, number] = 1,
	intensity: number = 0.2
): void => {
	if (!ref.current) return;

	// ベーススケールの処理
	const baseScaleVector = typeof baseScale === 'number'
		? [baseScale, baseScale, baseScale]
		: baseScale;

	// スクロール位置に基づくスケール係数の計算
	const zoomFactor = 1 + (scrollOffset * intensity);

	// 目標スケールの計算
	const targetScale = [
		baseScaleVector[0] * zoomFactor,
		baseScaleVector[1] * zoomFactor,
		baseScaleVector[2]
	];

	// 滑らかなスケールの適用
	easing.damp3(
		ref.current.scale,
		targetScale,
		0.2,
		delta
	);
};

/**
 * スクロール位置に基づく移動効果
 */
export const applyScrollMovement = (
	ref: MutableRefObject<Object3D | null>,
	scrollOffset: number,
	delta: number,
	basePosition: [number, number, number],
	movementVector: [number, number, number] = [0, -1, 0],
	intensity: number = 1
): void => {
	if (!ref.current) return;

	// スクロール位置に基づく移動量の計算
	const targetPosition = [
		basePosition[0] + (movementVector[0] * scrollOffset * intensity),
		basePosition[1] + (movementVector[1] * scrollOffset * intensity),
		basePosition[2] + (movementVector[2] * scrollOffset * intensity)
	];

	// 滑らかな移動の適用
	easing.damp3(
		ref.current.position,
		targetPosition,
		0.15,
		delta
	);
};

/**
 * テキスト表示のフェードイン/アウト効果
 */
export const applyTextFadeEffect = (
	ref: MutableRefObject<any | null>,
	scrollOffset: number,
	visibleRange: [number, number], // [表示開始位置, 表示終了位置]
	delta: number
): void => {
	if (!ref.current || !ref.current.material) return;

	const [start, end] = visibleRange;
	const targetOpacity = calculateScrollValue(start, start + 0.1, scrollOffset, 0, 1);
	const fadeOutOpacity = calculateScrollValue(end - 0.1, end, scrollOffset, 1, 0);

	// 最終的な不透明度の計算
	const finalOpacity = Math.min(targetOpacity, fadeOutOpacity);

	// 滑らかな不透明度の適用
	easing.damp(
		ref.current.material,
		'opacity',
		finalOpacity,
		0.2,
		delta
	);
};

/**
 * 浮遊効果のアニメーション（時間ベース）
 */
export const applyFloatingAnimation = (
	ref: MutableRefObject<Object3D | null>,
	time: number,
	basePosition: [number, number, number],
	amplitude: number = 0.1
): void => {
	if (!ref.current) return;

	// 時間に基づく浮遊効果の計算
	const floatingY = Math.sin(time * 0.5) * amplitude;

	// 位置の更新
	ref.current.position.set(
		basePosition[0],
		basePosition[1] + floatingY,
		basePosition[2]
	);
};-e 
### FILE: ./src/app/components/pepe-gallery/PepeGallery.tsx

'use client';

import React, { Suspense, useState, useEffect, useRef, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Image as DreiImage, Preload } from '@react-three/drei';

// サイズ定数
const SIZE_SCALES = {
	S: 1.5,
	M: 2.5,
	L: 4.0
};

// スクロール設定
const SCROLL_SETTINGS = {
	pages: 3
};

// テスト用の画像データ
const testImages = [
	{
		id: 1,
		filename: '1L.webp',
		size: 'L',
		path: 'https://d1abhb48aypmuo.cloudfront.net/we-are-onchain/pepe/1L.webp'
	},
	{
		id: 2,
		filename: '2M.webp',
		size: 'M',
		path: 'https://d1abhb48aypmuo.cloudfront.net/we-are-onchain/pepe/2M.webp'
	},
	{
		id: 3,
		filename: '6L.webp',
		size: 'L',
		path: 'https://d1abhb48aypmuo.cloudfront.net/we-are-onchain/pepe/6L.webp'
	}
];

// スクロール位置をコンテキスト経由で共有
const ScrollContext = React.createContext(0);

// ImageItemコンポーネント
const ImageItem = ({ image, position, index }) => {
	const ref = useRef(null);
	const scrollOffset = React.useContext(ScrollContext);

	let imageUrl = '';
	let imageSize = 'L';

	if (typeof image === 'string') {
		imageUrl = image;
	} else {
		imageUrl = image.path;
		imageSize = image.size;
	}

	const scale = SIZE_SCALES[imageSize];
	const scaleFactor = typeof scale === 'number' ? scale :
		Array.isArray(scale) ? [scale[0], scale[1], 1] : [scale, scale, 1];

	// スクロールに応じた効果
	useFrame(() => {
		if (ref.current && ref.current.material) {
			// 各画像に異なるスクロール範囲でズーム効果を適用
			const startPoint = index * 0.2;
			const duration = 0.3;
			const endPoint = startPoint + duration;

			// スクロール位置が範囲内にあるか確認
			let progress = 0;
			if (scrollOffset > startPoint && scrollOffset < endPoint) {
				progress = (scrollOffset - startPoint) / duration;
			} else if (scrollOffset >= endPoint) {
				progress = 1;
			}

			// ズーム効果の適用
			const zoom = 1 + (progress / 3);
			ref.current.material.zoom = zoom;

			// 視差効果 - Y位置をスクロールに応じて調整
			const baseY = position[1];
			const parallaxStrength = index + 1;
			const yOffset = baseY - (scrollOffset * 3 * parallaxStrength);
			ref.current.position.y = yOffset;
		}
	});

	return (
		<DreiImage
			ref={ref}
			url={imageUrl}
			position={position}
			scale={scaleFactor}
			transparent
			opacity={1}
		/>
	);
};

// メインのThree.jsシーン
const ThreeScene = () => {
	return (
		<>
			<ambientLight intensity={0.5} />
			<pointLight position={[10, 10, 10]} />

			{/* テスト用のボックス */}
			<mesh position={[0, 0, 0]}>
				<boxGeometry args={[2, 2, 2]} />
				<meshStandardMaterial color="blue" />
			</mesh>

			<mesh position={[0, -3, 0]}>
				<boxGeometry args={[1, 1, 1]} />
				<meshStandardMaterial color="red" />
			</mesh>

			{/* 複数の画像を追加 */}
			{testImages.map((img, index) => (
				<ImageItem
					key={img.id}
					image={img}
					position={[
						(index % 2) * 4 - 2,
						-index * 3,
						0
					]}
					index={index}
				/>
			))}
		</>
	);
};

// メインコンポーネント
const PepeGallery = ({ className = '' }) => {
	const [isLoading, setIsLoading] = useState(true);
	const [scrollOffset, setScrollOffset] = useState(0);
	const containerRef = useRef(null);

	// スクロールハンドラー
	const handleScroll = useCallback(() => {
		if (containerRef.current) {
			// スクロール位置を0~1の範囲に正規化
			const scrollHeight = containerRef.current.scrollHeight - window.innerHeight;
			const scrollTop = containerRef.current.scrollTop;
			const normalized = Math.max(0, Math.min(1, scrollTop / scrollHeight));
			setScrollOffset(normalized);
		}
	}, []);

	// コンポーネントマウント時の処理
	useEffect(() => {
		// 初期ロード
		const timer = setTimeout(() => {
			setIsLoading(false);
		}, 1000);

		// スクロールイベントの設定
		const currentRef = containerRef.current;
		if (currentRef) {
			currentRef.addEventListener('scroll', handleScroll);
		}

		// クリーンアップ
		return () => {
			clearTimeout(timer);
			if (currentRef) {
				currentRef.removeEventListener('scroll', handleScroll);
			}
		};
	}, [handleScroll]);

	// 仮想スクロールエリアの高さ
	const scrollHeight = `${SCROLL_SETTINGS.pages * 100}vh`;

	return (
		<div
			ref={containerRef}
			className={`w-full h-screen overflow-auto ${className}`}
			style={{ scrollBehavior: 'smooth' }}
		>
			{/* ローディング表示 */}
			{isLoading && (
				<div className="fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-80 z-50">
					<div className="text-white text-2xl">Loading Gallery...</div>
				</div>
			)}

			{/* スクロール可能なコンテンツエリア */}
			<div style={{ height: scrollHeight, position: 'relative' }}>
				{/* Three.jsコンテンツ（固定位置） */}
				<div className="fixed inset-0">
					<ScrollContext.Provider value={scrollOffset}>
						<Canvas
							camera={{ position: [0, 0, 15], fov: 15 }}
							className="w-full h-full"
							gl={{
								antialias: true,
								alpha: true,
								preserveDrawingBuffer: true
							}}
							dpr={[1, 1.5]}
						>
							<color attach="background" args={['#d8d7d7']} />
							<Suspense fallback={null}>
								<ThreeScene />
								<Preload all />
							</Suspense>
						</Canvas>
					</ScrollContext.Provider>
				</div>

				{/* HTML/DOMコンテンツ（スクロール可能） */}
				<div className="relative w-full h-full" style={{ pointerEvents: 'none' }}>
					{/* 例：スクロールに連動するテキスト */}
					<div
						className="absolute top-[100vh] left-10 text-4xl font-bold"
						style={{ pointerEvents: 'auto' }}
					>
						Pepe Gallery
					</div>

					<div
						className="absolute top-[200vh] right-10 text-4xl font-bold"
						style={{ pointerEvents: 'auto' }}
					>
						Collection
					</div>
				</div>
			</div>
		</div>
	);
};

export default PepeGallery;-e 
### FILE: ./src/app/components/3d/PepeModelImproved.tsx

'use client';
import React, { useRef, useEffect, useState } from 'react';
import { useGLTF, Environment, OrbitControls, PerspectiveCamera, useHelper } from '@react-three/drei';
import { useFrame, Canvas } from '@react-three/fiber';
import * as THREE from 'three';

// Pepeモデルの改良版コンテナ
const PepeEnhancedContainer = () => {
  const groupRef = useRef<THREE.Group>(null);
  const [modelScale, setModelScale] = useState(0.5); // スケールの初期値を小さく設定
  const [modelPosition, setModelPosition] = useState([0, -2, 0]); // 位置の初期値を下方向に
  
  // ライトのためのレフ
  const directionalLightRef = useRef<THREE.DirectionalLight>(null);
  
  // ライトヘルパーを表示（オプション）
  useHelper(directionalLightRef, THREE.DirectionalLightHelper, 1, 'red');
  
  // GLTFモデルの読み込み
  const { scene, animations } = useGLTF('/models/pepe.glb');
  
  // モデル情報をログに出力
  useEffect(() => {
    if (scene) {
      console.log('Enhanced: Scene loaded successfully');
      
      // バウンディングボックスを計算して自動的に位置調整
      const box = new THREE.Box3().setFromObject(scene);
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());
      
      console.log('Model size:', size);
      console.log('Model center:', center);
      
      // モデルのスケールと位置を自動調整
      // モデルが大きすぎる場合はスケールを小さく
      if (size.length() > 10) {
        setModelScale(5 / size.length());
      }
      
      // 中心位置をオフセット
      setModelPosition([-center.x, -center.y, -center.z]);
    }
  }, [scene]);
  
  // 自動回転
  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.3;
    }
  });
  
  // GLTFモデル全体を表示
  return (
    <>
      {/* カメラとコントロールを追加 */}
      <PerspectiveCamera makeDefault position={[0, 0, 5]} fov={50} />
      <OrbitControls enableZoom={true} enablePan={true} />
      
      {/* 照明を強化 */}
      <ambientLight intensity={1.0} />
      <directionalLight 
        ref={directionalLightRef}
        position={[5, 5, 5]} 
        intensity={1.5} 
        castShadow 
        shadow-mapSize-width={1024} 
        shadow-mapSize-height={1024}
      />
      <hemisphereLight intensity={0.5} color="#eeffee" groundColor="#334433" />
      
      {/* 床とグリッドを追加 */}
      <gridHelper args={[10, 10, 0x00ff00, 0xffffff]} position={[0, -2.5, 0]} />
      
      {/* モデルコンテナ */}
      <group 
        ref={groupRef} 
        scale={[modelScale, modelScale, modelScale]}
        position={modelPosition}
      >
        <primitive object={scene.clone()} />
      </group>
    </>
  );
};

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

// メインのエクスポートコンポーネント
interface PepeModelImprovedProps {
  className?: string;
}

const PepeModelImproved: React.FC<PepeModelImprovedProps> = ({ 
  className = ''
}) => {
  return (
    <div className={`w-full h-full ${className}`}>
      <Canvas shadows>
        <ErrorBoundary fallback={
          <group>
            <mesh>
              <boxGeometry args={[1, 1, 1]} />
              <meshStandardMaterial color="red" />
            </mesh>
            <ambientLight intensity={0.5} />
            <gridHelper />
          </group>
        }>
          <PepeEnhancedContainer />
          <Environment preset="sunset" background />
        </ErrorBoundary>
      </Canvas>
    </div>
  );
};

export default PepeModelImproved;

// グローバルにモデルをプリロード
useGLTF.preload('/models/pepe.glb');-e 
### FILE: ./src/app/components/3d/PepeModel.tsx

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
useGLTF.preload('/models/pepe.glb');-e 
### FILE: ./src/app/components/3d/ProteinModel.tsx

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
	const { scene } = useGLTF('/models/protein_powder.glb');

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
			<mesh>
				<boxGeometry args={[1, 1, 1]} />
				<meshStandardMaterial color="hotpink" />
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
        <ambientLight intensity={0.7} /> {/* 明るさを上げる */}
        <directionalLight position={[10, 10, 10]} intensity={1.2} castShadow /> {/* 明るさを上げる */}
        <spotLight position={[-10, 10, 10]} angle={0.15} penumbra={1} intensity={1.5} castShadow /> {/* 明るさを上げる */}
        
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
useGLTF.preload('/models/protein_powder.glb');-e 
### FILE: ./src/app/components/pepe3d/types.d.ts

// types.d.ts
type GlitchEffectType = 'rgb' | 'slice' | 'wave' | 'pulse' | 'jitter' | 'none';

interface MessageConfig {
	id: string;
	text: string;
	top?: string;
	left?: string;
	width?: string;
	fontSize?: string;
	glitchEffect?: GlitchEffectType;
	keywords?: string[];  // 特別強調するキーワード
	delay?: number;       // 表示遅延
}

interface CyberInterfaceProps {
	scrollProgress: number; // 0から1の間の値
	activeIndex: number | null;
	totalSections: number;
}

// ハイライト用のテキスト処理関連
interface TextFragment {
	text: string;
	isKeyword: boolean;
	keywordType?: string;
}-e 
### FILE: ./src/app/components/pepe3d/CyberInterface.tsx

// CyberInterface.tsx
'use client';

import React, { useEffect, useState, useRef } from 'react';
import styles from './PepeStyles.module.css';

// バイナリデータを生成する関数
const generateBinaryData = (length: number): string => {
  const chars = '01';
  return Array.from({ length }, () => chars.charAt(Math.floor(Math.random() * chars.length))).join('');
};

// 16進数データを生成する関数
const generateHexData = (length: number): string => {
  const chars = '0123456789ABCDEF';
  return Array.from({ length }, () => chars.charAt(Math.floor(Math.random() * chars.length))).join('');
};

const CyberInterface: React.FC<CyberInterfaceProps> = ({ 
  scrollProgress, 
  activeIndex,
  totalSections 
}) => {
  const [dataStream, setDataStream] = useState<string[]>([]);
  const [systemTime, setSystemTime] = useState<string>('');
  const [randomGlitch, setRandomGlitch] = useState<boolean>(false);
  
  // データストリームを生成
  useEffect(() => {
    // 初期データストリームを生成
    const initialData: string[] = [];
    for (let i = 0; i < 50; i++) {
      if (Math.random() > 0.7) {
        initialData.push(generateHexData(16));
      } else {
        initialData.push(generateBinaryData(16));
      }
    }
    setDataStream(initialData);
    
    // 定期的にデータストリームを更新
    const interval = setInterval(() => {
      setDataStream(prev => {
        const newData = [...prev];
        // 1-3行をランダムに置き換え
        const replaceCount = Math.floor(Math.random() * 3) + 1;
        for (let i = 0; i < replaceCount; i++) {
          const index = Math.floor(Math.random() * newData.length);
          if (Math.random() > 0.7) {
            newData[index] = generateHexData(16);
          } else {
            newData[index] = generateBinaryData(16);
          }
        }
        return newData;
      });
      
      // ランダムなグリッチ効果
      if (Math.random() > 0.9) {
        setRandomGlitch(true);
        setTimeout(() => setRandomGlitch(false), 200);
      }
    }, 500);
    
    // システム時間の更新
    const timeInterval = setInterval(() => {
      const now = new Date();
      setSystemTime(`SYS://GREEN_SOURCE v2.3.7 | ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`);
    }, 1000);
    
    return () => {
      clearInterval(interval);
      clearInterval(timeInterval);
    };
  }, []);
  
  // エネルギーレベル（スクロール進行に基づく）
  const energyLevel = Math.max(5, Math.min(100, scrollProgress * 100));
  
  return (
    <>
      {/* スキャンライン */}
      <div className={styles.scanline}></div>
      
      {/* コーナーマーカー */}
      <div className={styles.cyberFrame}>
        <div className={`${styles.cornerMarker} ${styles.topLeft} ${randomGlitch ? styles.jitter : ''}`}></div>
        <div className={`${styles.cornerMarker} ${styles.topRight} ${randomGlitch ? styles.jitter : ''}`}></div>
        <div className={`${styles.cornerMarker} ${styles.bottomLeft} ${randomGlitch ? styles.jitter : ''}`}></div>
        <div className={`${styles.cornerMarker} ${styles.bottomRight} ${randomGlitch ? styles.jitter : ''}`}></div>
      </div>
      
      {/* データストリーム */}
      <div className={styles.dataStream}>
        <div className={styles.dataContent}>
          {dataStream.map((line, index) => (
            <div key={index} className={randomGlitch && index % 5 === 0 ? styles.jitter : ''}>
              {line}
            </div>
          ))}
        </div>
      </div>
      
      {/* エネルギーメーター */}
      <div className={styles.energyMeter}>
        <div 
          className={styles.energyLevel} 
          style={{ height: `${energyLevel}%` }}
        ></div>
      </div>
      
      {/* システムステータス */}
      <div className={styles.systemStatus}>
        {systemTime}
        <div>SECTION: {activeIndex !== null ? activeIndex + 1 : 0}/{totalSections}</div>
        <div>ENERGY: {Math.floor(energyLevel)}%</div>
      </div>
    </>
  );
};

export default CyberInterface;-e 
### FILE: ./src/app/components/pepe3d/ScrollMessage.tsx

// ScrollMessage.tsx
'use client';

import React, { useEffect, useRef, useState } from 'react';
import CyberInterface from './CyberInterface';
import styles from './PepeStyles.module.css';

type MessageConfig = {
  id: string;
  text: string;
  top?: string;
  left?: string;
  width?: string;
  fontSize?: string;
  glitchEffect?: 'rgb' | 'slice' | 'wave' | 'pulse' | 'jitter' | 'none';
  keywords?: string[];
  delay?: number;
};

// テキストフラグメント処理用の型
interface TextFragment {
  text: string;
  isKeyword: boolean;
  keywordType?: string;
}

const messages: MessageConfig[] = [
  {
    id: 'trigger-1',
    text: '🧪深緑の源泉 ー 古代から森にひそむ「ぺぺの泉」。',
    top: '20vh',
    left: '10vw',
    width: 'auto',
    fontSize: '2rem',
    glitchEffect: 'rgb',
    keywords: ['深緑の源泉', 'ぺぺの泉'],
  },
  {
    id: 'trigger-2',
    text: '💎そこから湧き出るグリーンミネラルが、濃厚なコクとほどよい甘みをもたらす。',
    top: '30vh',
    left: '30vw',
    width: 'max-content',
    fontSize: '2rem',
    glitchEffect: 'wave',
    keywords: ['グリーンミネラル'],
  },
  {
    id: 'trigger-3',
    text: '一口ごとに脈打つビート、疲労を吹き飛ばし、次の挑戦へと背中を押す。',
    top: '40vh',
    left: '10vw',
    width: 'max-content',
    fontSize: '2rem',
    glitchEffect: 'pulse',
    keywords: ['脈打つビート'],
  },
  {
    id: 'trigger-4',
    text: '次元を超えたグリーンパワーを、その手で感じよ。',
    top: '80vh',
    left: '30vw',
    width: '60vw',
    fontSize: '3rem',
    glitchEffect: 'slice',
    keywords: ['次元を超えた', 'グリーンパワー'],
  },
];

const ScrollTriggerMessages: React.FC = () => {
  const refs = useRef<(HTMLDivElement | null)[]>([]);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [scrollProgress, setScrollProgress] = useState<number>(0);
  const [randomTrigger, setRandomTrigger] = useState<boolean>(false);

  // キーワードに基づいてテキストを処理する関数
  const processText = (text: string, keywords: string[] = []): TextFragment[] => {
    if (!keywords || keywords.length === 0) return [{ text, isKeyword: false }];

    const fragments: TextFragment[] = [];
    let remainingText = text;

    // 各キーワードを検索して分割
    keywords.forEach((keyword) => {
      const parts = remainingText.split(new RegExp(`(${keyword})`, 'g'));
      if (parts.length === 1) return; // キーワードが見つからない場合はスキップ

      // 分割された部分を処理
      let newRemainingText = '';
      parts.forEach((part, index) => {
        if (part === keyword) {
          fragments.push({
            text: part,
            isKeyword: true,
            keywordType: keyword,
          });
        } else if (part) {
          newRemainingText += part;
        }
      });
      remainingText = newRemainingText;
    });

    // 残りのテキストがあれば追加
    if (remainingText) {
      fragments.push({ text: remainingText, isKeyword: false });
    }

    return fragments.length > 0 ? fragments : [{ text, isKeyword: false }];
  };

  // グリッチエフェクトに基づいてクラス名を取得
  const getGlitchClass = (effect?: 'rgb' | 'slice' | 'wave' | 'pulse' | 'jitter' | 'none'): string => {
    switch (effect) {
      case 'rgb': return styles.rgbSplit;
      case 'slice': return styles.sliceGlitch;
      case 'wave': return styles.waveDistort;
      case 'pulse': return styles.pulse;
      case 'jitter': return styles.jitter;
      default: return '';
    }
  };

  // レンダリングされる実際のテキスト
  const renderMessageText = (message: MessageConfig) => {
    if (!message.keywords || message.keywords.length === 0) {
      return <span className={getGlitchClass(message.glitchEffect)}>{message.text}</span>;
    }

    // キーワードを検出して強調
    return message.text.split(' ').map((word, wordIndex) => {
      const isKeyword = message.keywords?.some(keyword => keyword.includes(word) || word.includes(keyword));
      
      if (isKeyword) {
        return (
          <span 
            key={`word-${wordIndex}`}
            className={`${styles.keywordGlitch} ${getGlitchClass(message.glitchEffect)}`}
            data-text={word}
          >
            {word}{' '}
          </span>
        );
      }
      
      return (
        <span 
          key={`word-${wordIndex}`}
          className={getGlitchClass(message.glitchEffect)}
        >
          {word}{' '}
        </span>
      );
    });
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        let found = false;
        entries.forEach((entry) => {
          const idx = refs.current.findIndex((r) => r === entry.target);
          if (entry.isIntersecting) {
            setActiveIndex(idx);
            found = true;
          }
        });
        if (!found) setActiveIndex(null);
      },
      { root: null, rootMargin: '0px', threshold: 0.5 }
    );

    refs.current.forEach((r) => r && observer.observe(r));

    // スクロールイベントリスナー追加
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight;
      const winHeight = window.innerHeight;
      const scrollPercent = scrollTop / (docHeight - winHeight);
      setScrollProgress(scrollPercent);
      
      // 10%の確率でランダムなグリッチをトリガー
      if (Math.random() < 0.01) {
        setRandomTrigger(true);
        setTimeout(() => setRandomTrigger(false), 150);
      }
    };
    
    window.addEventListener('scroll', handleScroll);

    return () => {
      refs.current.forEach((r) => r && observer.unobserve(r));
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <>
      {/* トリガー用ダミーゾーン */}
      {messages.map((_, i) => (
        <div key={`zone-${i}`} ref={(el) => (refs.current[i] = el)} className="h-screen w-full" />
      ))}

      {/* サイバネティックインターフェース */}
      <CyberInterface 
        scrollProgress={scrollProgress} 
        activeIndex={activeIndex} 
        totalSections={messages.length} 
      />

      {/* フローティングメッセージ */}
      {messages.map((msg, i) => {
        const isActive = activeIndex === i;
        return (
          <div
            key={msg.id}
            className={`fixed z-50 font-pixel text-white transition-opacity duration-700 ease-in-out
                        ${isActive ? 'opacity-100' : 'opacity-0'} 
                        ${randomTrigger ? styles.jitter : ''}
                        ${msg.id === 'trigger-4' && isActive ? 'animate-pulse' : ''}
                      `}
            style={{
              top: msg.top,
              left: msg.left,
              width: msg.width,
              fontSize: msg.fontSize,
              textShadow: '0 0 8px rgba(0, 255, 102, 0.7)',
            }}
          >
            {renderMessageText(msg)}
          </div>
        );
      })}

      {/* 追加の装飾エフェクト: グリッドバックグラウンド */}
      <div 
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          backgroundImage: 'linear-gradient(rgba(0, 255, 102, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 255, 102, 0.05) 1px, transparent 1px)',
          backgroundSize: '20px 20px',
          backgroundPosition: 'center center',
        }}
      />
    </>
  );
};

export default ScrollTriggerMessages;-e 
### FILE: ./src/app/components/pepe3d/PepeTop.tsx

// src/app/components/pepe3d/PepeTop.tsx
"use client";
import React, { useRef } from 'react';
import PepeModel3D from './PepeModel3D';
import ScrollMessage from './ScrollMessage';
const PepeTop: React.FC = () => {
	// ScrollMessageへの参照を作成
	const scrollMessageRef = useRef<HTMLDivElement>(null);

	return (
		<div className="relative f-[1000vh]">
			{/* Sticky PepeModel3D */}
			<div className="sticky top-0 h-screen w-full overflow-hidden">
				<PepeModel3D />
				{/* 既存の放射状グラデーション*/}
				<div
					className="absolute inset-0 z-10 pointer-events-none"
					style={{
						background: `radial-gradient(
              ellipse 100% 50% at center,
              rgba(0, 0, 0, 0.2) 10%,
              rgba(0, 0, 0, 0.6) 60%,
              rgba(0, 0, 0, 0.9) 80%,
              rgba(0, 0, 0, 1) 100%
            )`,
					}}
				/>
			</div>

			{/* スクロールメッセージ（参照を追加） */}
			<div ref={scrollMessageRef}>
				<ScrollMessage />
			</div>
			<div
				className="absolute inset-0 z-10 pointer-events-none"
				style={{
					background: `radial-gradient(
						ellipse 100% 50% at center,
						rgba(0, 0, 0, 0.2) 10%,
						rgba(0, 0, 0, 0.6) 60%,
						rgba(0, 0, 0, 1) 70%,
						rgba(0, 0, 0, 1) 100%
           			 )`,
				}}
			/>
		</div>
	);
};

export default PepeTop;-e 
### FILE: ./src/app/components/pepe3d/PepeModel3D.tsx

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
		<div className={`h-[100vh]`}>
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
		</div>
	);
};

export default PepeModel3D;

// グローバルにモデルをプリロード
useGLTF.preload('/models/pepe.glb');-e 
### FILE: ./src/app/components/matrix-scroll/MatrixScrollContainer.tsx

// MatrixScrollContainer.tsx
'use client';
import React, { useState, useEffect, useRef } from 'react';
import { Environment, PerspectiveCamera } from '@react-three/drei';
import { useFrame, Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import styles from './MatrixScroll.module.css';

/**
 * MatrixScrollContainer - メインコンポーネント
 * スクロールアニメーションとマトリックスエフェクトを組み合わせたコンテナ
 */
interface MatrixScrollContainerProps {
  children?: React.ReactNode;
  backgroundImage?: string;
}

const MatrixScrollContainer: React.FC<MatrixScrollContainerProps> = ({
  children,
  backgroundImage = ''
}) => {
  // スクロール状態の管理
  const [scrollY, setScrollY] = useState(0);
  const [maxScroll, setMaxScroll] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // スクロール量を監視してステートを更新
  useEffect(() => {
    const handleScroll = () => {
      if (containerRef.current) {
        const currentScrollY = window.scrollY;
        setScrollY(currentScrollY);
        
        // コンテナの高さからビューポートの高さを引いた値が最大スクロール量
        const containerHeight = containerRef.current.scrollHeight;
        const maxScrollValue = containerHeight - window.innerHeight;
        setMaxScroll(maxScrollValue);
        
        // スクロール進行度を0〜1の範囲で計算
        const progress = Math.min(Math.max(currentScrollY / maxScrollValue, 0), 1);
        setScrollProgress(progress);
      }
    };

    // 初期設定
    handleScroll();
    
    // スクロールイベントリスナーの登録（パフォーマンス向上のためにpassiveオプションを設定）
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    // リサイズイベントリスナーの登録
    window.addEventListener('resize', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, [maxScroll]);

  return (
    <div className={styles.scrollContainer} ref={containerRef}>
      {/* スクロールコンテンツ（高さを確保） */}
      <div className={styles.scrollContent}>
        {/* スティッキーな球体コンテナ */}
        <div className={styles.stickyContainer}>
          {/* 3D球体 */}
          <MatrixSphereCanvas 
            scrollProgress={scrollProgress}
            backgroundImage={backgroundImage}
          />
          
          {/* マトリックスコードのレイン効果 */}
          <MatrixCodeRain 
            scrollProgress={scrollProgress}
          />
          
          {/* メッセージ表示（Matrix風テキスト） */}
          <MatrixTextOverlay 
            scrollProgress={scrollProgress} 
          />
        </div>
        
        {/* 追加コンテンツ（オプション） */}
        <div className={styles.contentSections}>
          {children}
        </div>
        
        {/* スクロールプログレスインジケーター */}
        <div className={styles.scrollIndicator} style={{ width: `${scrollProgress * 100}%` }} />
      </div>
    </div>
  );
};

// スクロールに反応する回転球体
const RotatingSphere = ({ scrollProgress }) => {
  const sphereRef = useRef<THREE.Mesh>(null);
  
  // フレームごとに回転を更新
  useFrame(() => {
    if (sphereRef.current) {
      // スクロール進行に基づいて回転
      const baseRotation = scrollProgress * Math.PI * 4; // スクロールに応じて回転（4π = 720度）
      
      // Y軸を中心に回転
      sphereRef.current.rotation.y = baseRotation;
      
      // X軸とZ軸にも少しだけ回転を加えて動きを複雑に
      sphereRef.current.rotation.x = Math.sin(baseRotation * 0.5) * 0.3;
      sphereRef.current.rotation.z = Math.sin(baseRotation * 0.3) * 0.15;
    }
  });

  // 球体テクスチャをロード
  const texture = new THREE.TextureLoader().load('/images/cyberpunk-cityscape.png');
  texture.mapping = THREE.EquirectangularReflectionMapping;

  return (
    <mesh ref={sphereRef}>
      <sphereGeometry args={[2, 64, 64]} />
      <meshBasicMaterial map={texture} side={THREE.BackSide} />
    </mesh>
  );
};

// Three.jsで3D球体を描画するキャンバス
const MatrixSphereCanvas = ({ scrollProgress, backgroundImage }) => {
  return (
    <div className={styles.sphereContainer}>
      <Canvas shadows>
        {/* ライティング設定 */}
        <ambientLight intensity={0.8} />
        <directionalLight position={[5, 5, 5]} intensity={1.0} castShadow />
        <spotLight position={[-5, 8, -5]} angle={0.15} penumbra={1} intensity={1.5} castShadow />
        <hemisphereLight intensity={0.4} color="#88eeff" groundColor="#553333" />

        {/* 回転する球体 */}
        <RotatingSphere scrollProgress={scrollProgress} />

        {/* カメラ設定 */}
        <PerspectiveCamera makeDefault position={[0, 1, 4]} fov={45} />
      </Canvas>
      
      {/* 情報オーバーレイ */}
      <div className={styles.infoOverlay}>
        <span className={styles.statusText}>LOADING MATRIX</span>
        <span className={styles.progressText}>{Math.floor(scrollProgress * 100)}%</span>
      </div>

      {/* サイバーパンク風の装飾 */}
      <div className={`${styles.decorLine} ${styles.decorLineTop}`}></div>
      <div className={`${styles.decorLine} ${styles.decorLineBottom}`}></div>
    </div>
  );
};

// マトリックスコードのレイン効果
const MatrixCodeRain = ({ scrollProgress }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(null);
  
  // マトリックスコードのレイン効果を実装
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // キャンバスのサイズをウィンドウにフィット
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    // 初期化
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // マトリックスの文字
    const matrixChars = "アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789".split("");
    
    // 縦列の数を計算（画面の幅に応じて）
    const fontSize = 16;
    const columns = Math.ceil(canvas.width / fontSize);
    
    // 各列の降下位置を保持
    const drops: number[] = [];
    for (let i = 0; i < columns; i++) {
      drops[i] = Math.random() * -100; // ランダムな初期位置
    }

    // アニメーション関数
    const draw = () => {
      // 背景を半透明の黒でクリア（残像効果を出す）
      ctx.fillStyle = "rgba(0, 0, 0, 0.05)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // スクロール進行に応じて色の彩度を変化
      const hue = 120; // 緑色のベース
      const saturation = 100; // 彩度の最大値
      const lightness = 40 + scrollProgress * 20; // スクロールに応じて明るさ変化
      
      // 文字の描画
      ctx.fillStyle = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
      ctx.font = `${fontSize}px monospace`;
      ctx.textAlign = "center";
      
      // 各列の文字を描画
      for(let i = 0; i < drops.length; i++) {
        // スクロール進行に応じて文字列を選択（進行に応じて複雑になる）
        const charIndex = Math.floor(Math.random() * (matrixChars.length * (0.5 + scrollProgress * 0.5)));
        const char = matrixChars[charIndex % matrixChars.length];
        
        // 文字の位置
        const x = i * fontSize;
        const y = drops[i] * fontSize;
        
        // 表示する文字の透明度（遠くなるほど薄く）
        const alpha = 0.5 + Math.random() * 0.5;
        ctx.fillStyle = `hsla(${hue}, ${saturation}%, ${lightness}%, ${alpha})`;
        
        // 文字を描画
        ctx.fillText(char, x, y);
        
        // 各ドロップの位置を更新
        // スクロール進行によって落下速度が加速
        const fallSpeed = 0.5 + scrollProgress * 1.5;
        drops[i] += fallSpeed;
        
        // 画面下に到達したらリセット（ランダム位置から再開）
        if(drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }
      }
      
      // 次のフレームをリクエスト
      animationRef.current = requestAnimationFrame(draw);
    };
    
    // アニメーションを開始
    draw();
    
    // クリーンアップ
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [scrollProgress]);

  return (
    <canvas 
      ref={canvasRef} 
      className={styles.matrixCanvas}
    />
  );
};

// スクロール進行に応じて表示されるマトリックス風メッセージ
const MatrixTextOverlay = ({ scrollProgress }) => {
  // メッセージ一覧
  const messages = [
    "Wake up, Neo...",
    "The Matrix has you...",
    "Follow the white rabbit.",
    "Knock, knock, Neo.",
    "The Matrix is everywhere.",
    "Welcome... to the desert of the real."
  ];
  
  // 現在表示すべきメッセージのインデックスを計算
  const messageIndex = Math.min(
    Math.floor(scrollProgress * messages.length),
    messages.length - 1
  );
  
  // スクロール進行に応じたメッセージの表示/非表示
  const isVisible = scrollProgress > 0.05;
  
  // スクロール進行に応じたメッセージの不透明度
  const opacity = Math.min(scrollProgress * 2, 1);
  
  if (!isVisible) return null;
  
  return (
    <div className={styles.matrixMessage} style={{ opacity }}>
      <div className={styles.messageBox}>
        <div className={styles.messageHeader}>
          <span className={styles.blinker}></span>
          SYSTEM MESSAGE
        </div>
        <div className={styles.messageContent}>
          {messages[messageIndex]}
        </div>
      </div>
    </div>
  );
};

export default MatrixScrollContainer;-e 
### FILE: ./src/app/components/glowing-3d-text/PepeFlavorModel.tsx

'use client';
import { useRef, useEffect } from 'react';
import { useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { MotionValue } from 'framer-motion';
import * as THREE from 'three';

interface PepeFlavorModelProps {
	scrollProgress: MotionValue<number>;
	preserveOriginalMaterials?: boolean; // Blenderのマテリアルをそのまま使用するかどうか
}

const PepeFlavorModel: React.FC<PepeFlavorModelProps> = ({ 
	scrollProgress,
	preserveOriginalMaterials = true // デフォルトでBlenderのマテリアルを保持
}) => {
	// GLBモデルをロード
	const { scene, nodes, materials } = useGLTF('/models/pepe_flavor.glb');
	const modelRef = useRef<THREE.Group>(null);

	// モデルの初期設定
	useEffect(() => {
		if (!scene) return;

		console.log("Loading Pepe Flavor model with materials:", materials);
		
		// 色管理を有効化 - これは常に有効にするとよい
		THREE.ColorManagement.enabled = true;

		// Blenderから読み込んだマテリアルを処理
		scene.traverse((object) => {
			if (object instanceof THREE.Mesh && object.material) {
				console.log(`Found mesh: ${object.name} with material:`, object.material);
				
				if (preserveOriginalMaterials) {
					// オリジナルのマテリアルを保持しつつ、設定を最適化
					if (object.material instanceof THREE.Material) {
						// 発光を強化
						if ('emissive' in object.material && object.material.emissive) {
							// Blenderの色をそのまま使用しつつ発光を強化
							object.material.emissiveIntensity = 1.2;
						}
						
						// トーンマッピングを無効化して色変換を防止
						object.material.toneMapped = false;
						
						// メタリック・反射設定を微調整（必要に応じて）
						if ('metalness' in object.material) object.material.metalness = 0.8;
						if ('roughness' in object.material) object.material.roughness = 0.2;
						
						console.log(`Enhanced original material for ${object.name}`);
					}
				} else {
					// オリジナルの色を保持
					const originalColor = object.material.color ? object.material.color.clone() : new THREE.Color("#00ff9f");
					
					// マテリアルをカスタムシェーダーマテリアルに置き換え
					const material = new THREE.MeshPhysicalMaterial({
						color: originalColor, // オリジナルの色を使用
						emissive: originalColor.clone(),
						emissiveIntensity: 1.2,
						metalness: 0.7,
						roughness: 0.2,
						clearcoat: 0.5,
						clearcoatRoughness: 0.2,
						transmission: 0.2,
						thickness: 0.5,
						toneMapped: false,
					});

					// オリジナルマテリアルから必要なプロパティをコピー
					if (object.material.map) material.map = object.material.map;
					if (object.material.normalMap) material.normalMap = object.material.normalMap;
					
					// マテリアルを置き換え
					object.material = material;
				}
			}
		});
	}, [scene, preserveOriginalMaterials]);

	const INITIAL_Y = Math.PI / 4; 
	// スクロール位置に応じたアニメーション
	useFrame((state, delta) => {
		if (!modelRef.current) return;

		// 現在のスクロール位置を取得
		const progress = scrollProgress.get();

		 //モデルの回転 - スクロールに応じて回転
		modelRef.current.rotation.y = THREE.MathUtils.lerp(
			modelRef.current.rotation.y,
			Math.sin(state.clock.elapsedTime * 0.1) * 0.1 - progress * Math.PI * 0.1,
			0.05
		);

		// わずかな浮遊アニメーション
		modelRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.05;

		// スクロールに応じたZ位置の調整
		modelRef.current.position.z = THREE.MathUtils.lerp(
			modelRef.current.position.z,
			-2 + progress * 5, // 奥から手前に移動
			0.05
		);
	});

	return (
		<primitive
			ref={modelRef}
			object={scene}
			scale={1}
			position={[1.5, 0, 0]}
			rotation={[ 0, 0, 0 ]}
		/>
	);
};

// モデルの事前ロード
useGLTF.preload('/models/pepe_flavor.glb');

export default PepeFlavorModel;-e 
### FILE: ./src/app/components/glowing-3d-text/GlowingTextScene.tsx

import { Canvas } from '@react-three/fiber';
import { Suspense } from 'react';
import { MotionValue } from 'framer-motion';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import PepeFlavorModel from './PepeFlavorModel';
import LightingSetup from './LightingSetup';

interface GlowingTextSceneProps {
	scrollProgress: MotionValue<number>;
}

const GlowingTextScene: React.FC<GlowingTextSceneProps> = ({
	scrollProgress
}) => {
	return (
		<Canvas className="w-full h-full" shadows dpr={[1, 2]}>
			<PerspectiveCamera makeDefault position={[1, 1, 5]} fov={50} />
			<Suspense fallback={null}>
				<PepeFlavorModel scrollProgress={scrollProgress} />
			</Suspense>
		</Canvas>
	);
};

export default GlowingTextScene;-e 
### FILE: ./src/app/components/glowing-3d-text/PostProcessEffects.tsx

import { EffectComposer, Bloom, ChromaticAberration, Noise, Vignette } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';

const PostProcessEffects = () => {
	return (
		<EffectComposer multisampling={8}>
			{/* HDRトーンマッピング */}
			<ToneMapping
				adaptive
				resolution={256}
				middleGrey={0.6}
				maxLuminance={16.0}
				averageLuminance={1.0}
				adaptationRate={1.0}
			/>

			{/* 多層ブルームエフェクト */}
			<Bloom
				intensity={2.0}
				luminanceThreshold={0.2}
				luminanceSmoothing={0.9}
				mipmapBlur
				radius={0.8}
			/>

			{/* 2つ目のブルームレイヤー - 広い拡散用 */}
			<Bloom
				intensity={0.5}
				luminanceThreshold={0.1}
				luminanceSmoothing={0.9}
				mipmapBlur
				radius={1.2}
			/>

			{/* 色収差 */}
			<ChromaticAberration
				offset={[0.002, 0.002]}
				radialModulation
				modulationOffset={0.5}
			/>

			{/* ビネット効果 */}
			<Vignette darkness={0.7} offset={0.3} />

			{/* 微細なノイズテクスチャ */}
			<Noise opacity={0.02} />

			{/* シャープネス調整 */}
			<SMAA />
		</EffectComposer>
	);
};

export default PostProcessEffects;-e 
### FILE: ./src/app/components/glowing-3d-text/GlowingTextSection.tsx

"use client";
import { useRef } from 'react';
import { useScroll } from 'framer-motion';
import GlowingTextScene from './GlowingTextScene';
import styles from './GlowingText.module.css';
import ScrollSpace from './ScrollSpace';
import { motion } from 'framer-motion';
import HeroModel from '../hero-section/HeroModel';
const GlowingTextSection = () => {
	const sectionRef = useRef<HTMLDivElement>(null);

	// スクロール位置の検出
	const { scrollYProgress } = useScroll({
		target: sectionRef,
		offset: ["start end", "end start"]
	});

	return (
		<section
			ref={sectionRef}
			className="relative w-full overflow-hidden bg-black flex flex-col items-center justify-center"
		>
			<motion.div
				className="mt-5 mb-40 left-1/2 transform text-neonGreen text-center"
				initial={{ opacity: 0, y: -10 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ delay: 0.5, duration: 0.8, repeat: Infinity, repeatType: "reverse" }}
			>
				<div className="text-xl mb-2">↓</div>
				<div className="text-sm font-mono">SCROLL DOWN</div>
			</motion.div>


			<div className="flex justify-center">
				<div className="relative w-full h-[120px] md:w-[800px] md:h-[150px] lg:w-[1200px] lg:h-[200px] pointer-events-auto">
					<GlowingTextScene scrollProgress={scrollYProgress} />
				</div>
			</div>
			<div className="flex justify-center">
				<div className="w-[300px] h-[400px] md:w-[400px] md:h-[500px] lg:w-[500px] lg:h-[600px] pointer-events-auto">
					<HeroModel scale={1.2} />
				</div>
			</div>
			<p className="text-center text-white">
				ただのプロテインではない。それは、ぺぺが紡ぐ「勇気」と「ユーモア」の物語。
			</p>
			<div className="text-xs mt-8 w-full max-w-sm px-4">
				<table className="w-full table-auto border-collapse border border-white text-white">
					<tbody>
						<tr>
							<td className="border border-white px-2 py-1 text-center">たんぱくしつ</td>
							<td className="border border-white px-2 py-1 text-left">25 g</td>
						</tr>
						<tr>
							<td className="border border-white px-2 py-1 text-center">ししつ</td>
							<td className="border border-white px-2 py-1 text-left">1.5 g</td>
						</tr>
						<tr>
							<td className="border border-white px-2 py-1 text-center">たんすいかぶつ</td>
							<td className="border border-white px-2 py-1 text-left">2 g</td>
						</tr>
						<tr>
							<td className="border border-white px-2 py-1 text-center">しょくもつせんい</td>
							<td className="border border-white px-2 py-1 text-left">1 g</td>
						</tr>
						<tr>
							<td className="border border-white px-2 py-1 text-center">あれるげん</td>
							<td className="border border-white px-2 py-1 text-left">乳</td>
						</tr>
					</tbody>
				</table>
			</div>


		</section>
	);
};

export default GlowingTextSection;-e 
### FILE: ./src/app/components/glowing-3d-text/LightingSetup.tsx

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const LightingSetup = () => {
  // ライトの参照を保持
  const spotLightRef = useRef<THREE.SpotLight>(null);
  const pointLightRef = useRef<THREE.PointLight>(null);
  
  // ライトのアニメーション
  useFrame(({ clock }) => {
    const time = clock.getElapsedTime();
    
    // スポットライトの位置を微妙に変化
    if (spotLightRef.current) {
      spotLightRef.current.position.x = Math.sin(time * 0.3) * 3;
      spotLightRef.current.position.z = Math.cos(time * 0.2) * 3;
    }
    
    // ポイントライトの強度を変化（パルス効果）
    if (pointLightRef.current) {
      pointLightRef.current.intensity = 1 + Math.sin(time * 2) * 0.3;
    }
  });
  
  return (
    <>
      {/* 環境光 - 暗めの基本照明 */}
      <ambientLight intensity={0.1} color="#222222" />
      
      {/* メインのスポットライト - テキストを照らす */}
    </>
  );
};

export default LightingSetup;-e 
### FILE: ./src/app/components/floating-images/useFloatingAnimation.ts

'use client';

import { useState, useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Vector3 } from 'three';
import { animationConfig } from './constants';
import { SizeType } from './types';

interface UseFloatingAnimationProps {
	size: SizeType;
	index: number;
	initialDelay: number;
	aspectRatio?: number;
}

// アニメーションのランダムな範囲から値を取得
const getRandomInRange = (min: number, max: number) => {
	return min + Math.random() * (max - min);
};

export const useFloatingAnimation = ({
	size,
	index,
	initialDelay,
	aspectRatio = 1
}: UseFloatingAnimationProps) => {
	const { viewport } = useThree();
	const sizeConfig = animationConfig.sizeConfig[size];
	const commonConfig = animationConfig.common;

	// アニメーション状態
	const [state, setState] = useState({
		position: { x: 0, y: 0, z: 0 },
		rotation: { x: 0, y: 0, z: 0 },
		scale: 0.001,
		opacity: 0
	});

	// アニメーションパラメータ
	const animParams = useRef({
		// 位置
		startX: getRandomInRange(-viewport.width / 2 + 2, viewport.width / 2 - 2),
		startY: -viewport.height - 5 - index % 3,
		targetY: viewport.height + 5,

		// 速度
		speed: getRandomInRange(sizeConfig.speed[0], sizeConfig.speed[1]),
		rotationSpeed: getRandomInRange(sizeConfig.rotationSpeed[0], sizeConfig.rotationSpeed[1]),

		// サイズと深度
		scale: getRandomInRange(sizeConfig.scale[0], sizeConfig.scale[1]),
		zPosition: getRandomInRange(sizeConfig.zPosition[0], sizeConfig.zPosition[1]),

		// 透明度
		opacity: getRandomInRange(sizeConfig.opacity[0], sizeConfig.opacity[1]),

		// アニメーション制御
		time: 0,
		duration: getRandomInRange(commonConfig.duration[0], commonConfig.duration[1]),
		delay: initialDelay,
		started: false,
		completed: false
	});

	// アニメーション初期化（ランダム化）
	useEffect(() => {
		// 視覚的な多様性のためのランダム要素
		const sway = Math.sin(index * 0.5) * 2; // 左右の揺れ
		const randomRotation = Math.random() * Math.PI * 0.1 - Math.PI * 0.05; // 少しだけランダムな回転

		animParams.current = {
			...animParams.current,
			// 画面を最大限に使うためのポジション調整
			startX: getRandomInRange(-viewport.width / 2 + 2, viewport.width / 2 - 2),
			startY: -viewport.height - 5 - (index % 3) * 2,
			// 揺れと傾き
			sway,
			rotationOffset: randomRotation
		};
	}, [viewport, index]);

	// アニメーションフレーム
	useFrame((state, delta) => {
		// 初期遅延
		if (!animParams.current.started) {
			animParams.current.delay -= delta * 1000;
			if (animParams.current.delay <= 0) {
				animParams.current.started = true;
			} else {
				return;
			}
		}

		// アニメーション終了判定
		if (animParams.current.completed) {
			return;
		}

		// 時間の更新
		animParams.current.time += delta;

		// アニメーション進行度 (0-1)
		const progress = Math.min(
			animParams.current.time / (animParams.current.duration / 1000),
			1
		);

		// イーズアウト関数
		const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
		const easedProgress = easeOut(progress);

		// Y位置の更新（下から上へ）
		const y = animParams.current.startY + (
			animParams.current.targetY - animParams.current.startY
		) * easedProgress;

		// X位置の揺れ（サイズに応じて異なる）
		const swayAmount = Math.sin(animParams.current.time * 0.5) * (4 - "SML".indexOf(size));
		const x = animParams.current.startX + swayAmount;

		// Z位置（奥行き）
		const z = animParams.current.zPosition;

		// 回転の更新
		const rotX = Math.sin(animParams.current.time * 0.2) * 0.03;
		const rotY = Math.cos(animParams.current.time * 0.3) * 0.03;
		const rotZ = animParams.current.time * animParams.current.rotationSpeed;

		// スケールの更新（アニメーション開始時に徐々に拡大）
		const currentScale = Math.min(
			animParams.current.scale,
			animParams.current.scale * Math.min(progress * 3, 1)
		);

		// 透明度の更新（フェードイン・フェードアウト）
		let currentOpacity = animParams.current.opacity;

		// 画面の始めと終わりでフェード効果
		if (progress < 0.1) {
			currentOpacity = animParams.current.opacity * (progress / 0.1);
		} else if (progress > 0.9) {
			currentOpacity = animParams.current.opacity * (1 - (progress - 0.9) / 0.1);
		}

		// アニメーション完了判定
		if (progress >= 1) {
			animParams.current.completed = true;
		}

		// 状態の更新
		setState({
			position: { x, y, z },
			rotation: { x: rotX, y: rotY, z: rotZ },
			scale: currentScale,
			opacity: currentOpacity
		});
	});

	return state;
};-e 
### FILE: ./src/app/components/floating-images/constants.ts

// 画像ファイルの情報を定義
export type SizeType = 'S' | 'M' | 'L';

export interface ImageFile {
	id: number;
	filename: string;
	size: SizeType;
	path: string;
}

// 環境変数からCDN URLを取得
const CDN_URL = process.env.NEXT_PUBLIC_CLOUDFRONT_URL || '';

// 画像ファイルのリスト
export const imageFiles: ImageFile[] = [
	{ id: 1, filename: '1L.webp', size: 'L', path: `${CDN_URL}/pepe/1L.webp` },
	{ id: 2, filename: '2M.webp', size: 'M', path: `${CDN_URL}/pepe/2M.webp` },
	{ id: 3, filename: '3S.webp', size: 'S', path: `${CDN_URL}/pepe/3S.webp` },
	{ id: 4, filename: '4S.webp', size: 'S', path: `${CDN_URL}/pepe/4S.webp` },
	{ id: 5, filename: '5M.webp', size: 'M', path: `${CDN_URL}/pepe/5M.webp` },
	{ id: 6, filename: '6L.webp', size: 'L', path: `${CDN_URL}/pepe/6L.webp` },
	{ id: 7, filename: '7M.webp', size: 'M', path: `${CDN_URL}/pepe/7M.webp` },
	{ id: 8, filename: '8M.webp', size: 'M', path: `${CDN_URL}/pepe/8M.webp` },
	{ id: 9, filename: '9L.webp', size: 'L', path: `${CDN_URL}/pepe/9L.webp` },
	{ id: 10, filename: '10S.webp', size: 'S', path: `${CDN_URL}/pepe/10S.webp` },
	{ id: 11, filename: '11S.webp', size: 'S', path: `${CDN_URL}/pepe/11S.webp` },
	{ id: 12, filename: '12M.webp', size: 'M', path: `${CDN_URL}/pepe/12M.webp` },
	{ id: 13, filename: '13L.webp', size: 'L', path: `${CDN_URL}/pepe/13L.webp` },
	{ id: 14, filename: '14L.webp', size: 'L', path: `${CDN_URL}/pepe/14L.webp` },
	{ id: 15, filename: '15M.webp', size: 'M', path: `${CDN_URL}/pepe/15M.webp` },
	{ id: 16, filename: '16S.webp', size: 'S', path: `${CDN_URL}/pepe/16S.webp` },
	{ id: 17, filename: '17S.webp', size: 'S', path: `${CDN_URL}/pepe/17S.webp` },
	{ id: 18, filename: '18M.webp', size: 'M', path: `${CDN_URL}/pepe/18M.webp` },
	{ id: 19, filename: '19L.webp', size: 'L', path: `${CDN_URL}/pepe/19L.webp` },
	{ id: 20, filename: '20L.webp', size: 'L', path: `${CDN_URL}/pepe/20L.webp` },
	{ id: 21, filename: '21S.webp', size: 'S', path: `${CDN_URL}/pepe/21S.webp` },
	{ id: 22, filename: '22S.webp', size: 'S', path: `${CDN_URL}/pepe/22S.webp` },
	{ id: 23, filename: '23L.webp', size: 'L', path: `${CDN_URL}/pepe/23L.webp` },
	{ id: 24, filename: '24L.webp', size: 'L', path: `${CDN_URL}/pepe/24L.webp` },
	{ id: 25, filename: '25S.webp', size: 'S', path: `${CDN_URL}/pepe/25S.webp` },
	{ id: 26, filename: '26S.webp', size: 'S', path: `${CDN_URL}/pepe/26S.webp` },
	{ id: 27, filename: '27S.webp', size: 'S', path: `${CDN_URL}/pepe/27S.webp` },
	{ id: 28, filename: '28L.webp', size: 'L', path: `${CDN_URL}/pepe/28L.webp` },
	{ id: 29, filename: '29S.webp', size: 'S', path: `${CDN_URL}/pepe/29S.webp` },
	{ id: 30, filename: '30S.webp', size: 'S', path: `${CDN_URL}/pepe/30S.webp` },
	{ id: 31, filename: '31M.webp', size: 'M', path: `${CDN_URL}/pepe/31M.webp` },
	{ id: 26, filename: '32M.webp', size: 'M', path: `${CDN_URL}/pepe/32M.webp` },
	{ id: 27, filename: '33M.webp', size: 'M', path: `${CDN_URL}/pepe/33M.webp` },
	{ id: 28, filename: '34S.webp', size: 'S', path: `${CDN_URL}/pepe/34S.webp` },
	{ id: 29, filename: '35L.webp', size: 'L', path: `${CDN_URL}/pepe/35L.webp` },
];

// アニメーション設定
export const animationConfig = {
	// サイズごとの設定
	sizeConfig: {
		S: {
			scale: [0.6, 0.7],      // 60-70%のスケール
			speed: [0.08, 0.12],    // 速い上昇速度
			rotationSpeed: [0.002, 0.01],
			zPosition: [-5, -2],    // 奥側に配置
			opacity: [0.7, 0.9]     // やや透明
		},
		M: {
			scale: [0.8, 0.9],      // 80-90%のスケール
			speed: [0.05, 0.08],    // 中程度の上昇速度
			rotationSpeed: [0.001, 0.005],
			zPosition: [-1, 1],     // 中間に配置
			opacity: [0.8, 1]       // ほぼ不透明
		},
		L: {
			scale: [1.0, 1.1],      // 100-110%のスケール
			speed: [0.03, 0.05],    // ゆっくりした上昇速度
			rotationSpeed: [0.0005, 0.002],
			zPosition: [2, 5],      // 手前に配置
			opacity: [0.9, 1]       // 完全に不透明
		}
	},

	// 共通設定
	common: {
		duration: [20000, 40000],   // アニメーション期間 (20-40秒)
		yRange: [-20, 30],          // Y軸の動きの範囲 (下から上へ)
		xRange: [-15, 15],          // X軸の動きの範囲（ランダム）
		delayRange: [0, 10000],     // 開始遅延のランダム範囲 (0-10秒)
	}
};-e 
### FILE: ./src/app/components/floating-images/useDirectMotion.ts

'use client';

import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Vector3 } from 'three';
import { SizeType } from '../floating-images/constants';

interface DirectMotionProps {
  size: SizeType;
  index: number;
  totalItems: number;
  depth?: number;
  speed?: number;
}

interface DirectMotionState {
  position: Vector3;
  scale: number;
  opacity: number;
}

/**
 * 奥から手前にまっすぐ向かってくるアニメーション用のカスタムフック
 */
export const useDirectMotion = ({
  size,
  index,
  totalItems,
  depth = 50, // 奥行きの長さ
  speed = 0.05 // 速度
}: DirectMotionProps): DirectMotionState => {
  // 初期状態の設定
  const [state, setState] = useState<DirectMotionState>({
    position: new Vector3(0, 0, -depth),
    scale: 0.001,
    opacity: 0
  });

  // アニメーションパラメータ
  const motionRef = useRef({
    // サイズに基づいた設定
    baseScale: size === 'S' ? 1.0 : size === 'M' ? 1.8 : 2.5,
    baseSpeed: size === 'S' ? speed * 1.3 : size === 'M' ? speed : speed * 0.7,
    
    // 初期位置の設定 - グリッド状に分散配置
    startPosition: calculateStartPosition(index, totalItems),
    
    // Z位置（奥行き）- 開始位置をずらす
    zPosition: -depth + (index % 3) * (depth / 3),
    
    // アニメーション状態
    time: 0
  });

  // 初期位置を計算する関数 - グリッド状に分散
  function calculateStartPosition(index: number, total: number) {
    // グリッドの列数（画面を均等に分割）
    const columns = Math.ceil(Math.sqrt(total));
    
    // グリッド内の位置
    const col = index % columns;
    const row = Math.floor(index / columns);
    
    // グリッド内のセル位置を計算（-7.5〜7.5の範囲）
    const cellSize = 15 / columns;
    const x = col * cellSize - 7.5 + cellSize / 2;
    const y = row * cellSize - 7.5 + cellSize / 2;
    
    // ランダム性を少し追加（セル内で少しだけランダムに）
    const randomX = (Math.random() - 0.5) * cellSize * 0.5;
    const randomY = (Math.random() - 0.5) * cellSize * 0.5;
    
    return { x: x + randomX, y: y + randomY };
  }

  // フレームごとのアニメーション更新
  useFrame((_, delta) => {
    // 時間の更新
    motionRef.current.time += delta;
    
    // Z位置の更新（奥から手前へ直線的に移動）
    motionRef.current.zPosition += motionRef.current.baseSpeed * delta * 20;
    
    // 一定の位置に達したら奥に戻す（ループ）
    if (motionRef.current.zPosition > 15) {
      motionRef.current.zPosition = -depth;
    }
    
    // 現在のZ位置に基づくスケールと透明度
    // 手前に来るほど大きく、奥ほど小さく
    const zRange = depth + 15; // 奥から手前までの全範囲
    const normalizedZ = (motionRef.current.zPosition + depth) / zRange;
    
    // スケールを計算（Z位置に基づいて段階的に大きく）
    const currentScale = motionRef.current.baseScale * Math.max(0.1, normalizedZ);
    
    // 透明度を計算（奥と手前でフェードイン・アウト）
    let currentOpacity = 1.0;
    if (normalizedZ < 0.1) {
      // 奥でフェードイン
      currentOpacity = normalizedZ / 0.1;
    } else if (normalizedZ > 0.9) {
      // 手前でフェードアウト
      currentOpacity = 1 - (normalizedZ - 0.9) / 0.1;
    }
    
    // 状態の更新
    setState({
      position: new Vector3(
        motionRef.current.startPosition.x,
        motionRef.current.startPosition.y,
        motionRef.current.zPosition
      ),
      scale: currentScale,
      opacity: currentOpacity
    });
  });

  return state;
};

export default useDirectMotion;-e 
### FILE: ./src/app/components/floating-images/FloatingImagesSection.tsx

'use client';

import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { ScrollControls } from '@react-three/drei';
import FloatingImages from './FloatingImages';
import styles from './styles.module.css';

const FloatingImagesSection = () => {
  return (
    <section className="relative w-full h-screen bg-black overflow-hidden">
      <div className={styles.scanlines}></div>
      
      <Canvas
        camera={{ position: [0, 0, 15], fov: 15 }}
        gl={{ antialias: true, alpha: false }}
        dpr={[1, 2]}
        className="bg-black"
      >
        <color attach="background" args={['#000000']} />
        
        <ScrollControls damping={0.2} pages={1.5} distance={0.5}>
          <Suspense fallback={null}>
            <FloatingImages />
          </Suspense>
        </ScrollControls>
      </Canvas>
      
      {/* オプショナルなオーバーレイ要素 */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-white text-opacity-70 text-sm z-20 pointer-events-none">
        <p className="animate-pulse">Scroll to explore</p>
      </div>
    </section>
  );
};

export default FloatingImagesSection;-e 
### FILE: ./src/app/components/floating-images/useCircularMotion.ts

'use client';

import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Vector3 } from 'three';
import { SizeType } from '../floating-images/constants';

interface CircularMotionProps {
  size: SizeType;
  index: number;
  totalItems: number;
  radius?: number;
  speed?: number;
  height?: number;
}

interface CircularMotionState {
  position: Vector3;
  rotation: [number, number, number];
  scale: number;
  opacity: number;
}

/**
 * 奥から手前に向かってくる3D動きを制御するカスタムフック
 */
export const useCircularMotion = ({
  size,
  index,
  totalItems,
  radius = 20, // より広い円運動
  speed = 0.04, // 適切な速度
  height = 3  // 高さの分布を制限
}: CircularMotionProps): CircularMotionState => {
  // 初期状態の設定
  const [state, setState] = useState<CircularMotionState>({
    position: new Vector3(0, 0, -radius),
    rotation: [0, 0, 0],
    scale: 0.001,
    opacity: 0
  });

  // アニメーションパラメータ
  const motionRef = useRef({
    // サイズに基づいた設定
    baseScale: size === 'S' ? 1.0 : size === 'M' ? 1.6 : 2.2,
    baseSpeed: size === 'S' ? speed * 1.3 : size === 'M' ? speed : speed * 0.7,
    
    // アイテムの初期位置を均等に分散
    offset: (Math.PI * 2 / totalItems) * index,
    
    // 最小限のランダム要素（より鮮明に）
    randomOffset: Math.random() * 0.1 - 0.05,
    yOffset: (Math.random() * 2 - 1) * (height / 2),
    
    // アニメーション状態
    angle: (Math.PI * 2 / totalItems) * index,
    time: 0
  });

  // フレームごとのアニメーション更新
  useFrame((_, delta) => {
    // 時間の更新
    motionRef.current.time += delta;
    
    // 角度の更新（円運動）
    motionRef.current.angle += motionRef.current.baseSpeed * delta;
    
    // 3D位置の計算（円形パス）- Z軸を強調して奥から手前に動きを強調
    const x = Math.sin(motionRef.current.angle) * radius * 0.8; // X範囲を少し狭く
    const z = Math.cos(motionRef.current.angle) * radius; // Z範囲はそのまま
    
    // 奥行きの計算 - 手前に来る時に大きく見せる効果を強調
    const depthFactor = (Math.cos(motionRef.current.angle) + 1) / 2;
    // より明確なスケール変化（奥から手前へ）
    const currentScale = motionRef.current.baseScale * (0.5 + depthFactor * 0.8);
    
    // 透明度は手前で完全に不透明に
    const currentOpacity = 0.6 + depthFactor * 0.4;
    
    // 最小限の回転（鮮明さを保つため）
    const rotZ = motionRef.current.time * 0.05 + motionRef.current.randomOffset;
    
    // 状態の更新
    setState({
      position: new Vector3(
        x, 
        motionRef.current.yOffset, 
        z
      ),
      rotation: [0, 0, rotZ], // X軸とY軸の回転を最小限に
      scale: currentScale,
      opacity: currentOpacity
    });
  });

  return state;
};

export default useCircularMotion;-e 
### FILE: ./src/app/components/floating-images/FloatingBackgroundSection.tsx

-e 
### FILE: ./src/app/components/floating-images/FloatingImagesFixSection.tsx

'use client';

import { Suspense, useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { Image, useTexture } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { imageFiles } from '../floating-images/constants';
import { useRadialMotion } from './useRadialMotion';

// 個々の放射状に動く画像コンポーネント
const RadialImage = ({ imageUrl, size, index, totalItems, maxDistance = 30, speed = 0.07 }) => {
  const texture = useTexture(imageUrl);
  
  // 放射状運動のカスタムフック
  const { position, scale, opacity } = useRadialMotion({
    size,
    index,
    totalItems,
    maxDistance,
    speed
  });

  // 放射状の動きに合わせて画像が動くように回転を調整
  const lookAtCamera = [0, 0, Math.atan2(position.y, position.x)];

  return (
    <Image
      url={imageUrl}
      position={[position.x, position.y, position.z]}
      rotation={lookAtCamera}
      scale={[scale, scale, 1]}
      transparent
      opacity={opacity}
      toneMapped={false}
    />
  );
};

// 画像群コンポーネント - 画像数を増やして密度を高める
const FloatingImagesFix = ({ maxDistance = 30, speed = 0.07 }) => {
  // CDN_URLを取得
  const CDN_URL = process.env.NEXT_PUBLIC_CLOUDFRONT_URL || '';
  
  // 画像を2倍に増やす（密度向上）
  const duplicatedImages = [
    ...imageFiles,
    ...imageFiles.map(img => ({...img, id: img.id + 1000})) // IDを変えて重複を避ける
  ];
  
  return (
    <>
      {/* 背景の設定 */}
      <color attach="background" args={['#000000']} />
      
      {/* 画像の配置 - 密度を2倍に */}
      {duplicatedImages.map((image, index) => {
        const imagePath = `${CDN_URL}/pepe/${image.filename}`;
        
        return (
          <RadialImage
            key={`${image.id}-${index}`}
            imageUrl={imagePath}
            size={image.size}
            index={index}
            totalItems={duplicatedImages.length}
            maxDistance={maxDistance}
            speed={speed}
          />
        );
      })}
      
      {/* 環境光の設定 */}
      <ambientLight intensity={0.8} />
      
      {/* 中央の小さな光源（出発点を強調） */}
      <pointLight
        position={[0, 0, 0]}
        intensity={5}
        distance={5}
        color="#ffffff"
      />
      
      {/* 全体を照らすスポットライト */}
      <spotLight
        position={[0, 0, 10]}
        angle={Math.PI / 2}
        penumbra={0.5}
        intensity={1.0}
        castShadow={false}
      />
    </>
  );
};

// メインセクションコンポーネント
const FloatingImagesFixSection = ({ className = '' }) => {
  // ローディング状態
  const [isLoading, setIsLoading] = useState(true);
  
  // コンポーネントマウント時にローディング
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 800);
    
    return () => clearTimeout(timer);
  }, []);

  return (
    <section className={`relative w-full h-screen bg-black overflow-hidden ${className}`}>
      {/* キャンバス - 視点を調整 */}
      <Canvas
        camera={{ position: [0, 0, 5], fov: 75 }} // 広い視野角で中央からの放射を強調
        gl={{ antialias: true, alpha: false }}
        dpr={[1, 2]}
      >
        <Suspense fallback={null}>
          <FloatingImagesFix maxDistance={30} speed={0.07} />
        </Suspense>
        
        {/* ポストプロセッシングエフェクト */}
        <EffectComposer>
          {/* ブルームエフェクト - 中央の光源を強調 */}
          <Bloom
            intensity={0.4}
            luminanceThreshold={0.1}
            luminanceSmoothing={0.9}
          />
        </EffectComposer>
      </Canvas>
      
      {/* ローディング表示 */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black text-white text-opacity-70 z-20">
          <p className="animate-pulse">Loading...</p>
        </div>
      )}
      
      {/* 中央の起点を示す小さな輝き（オプション） */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-1 h-1 bg-white rounded-full opacity-70 z-10 animate-pulse"></div>
    </section>
  );
};

export default FloatingImagesFixSection;-e 
### FILE: ./src/app/components/floating-images/FloatingImages.tsx

'use client';

import { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useScroll, Image, Scroll } from '@react-three/drei';
import { imageFiles } from './constants';

// サイズに基づいたスケール調整
const getScaleFromSize = (size) => {
  switch (size) {
    case 'S': return [1.2, 1.2, 1];
    case 'M': return [1.8, 1.8, 1];
    case 'L': return [2.4, 2.4, 1];
    default: return [1.5, 1.5, 1];
  }
};

// 画像の深度を決定
const getZPosition = (index, size) => {
  const baseZ = {
    'S': 0,
    'M': 3,
    'L': 6
  }[size] || 0;
  
  // インデックスによる微調整で重なりを防止
  return baseZ + (index % 3) * 1.5;
};

const FloatingImages = () => {
  const group = useRef();
  const scroll = useScroll();
  const { viewport, size } = useThree();
  const { width, height } = viewport;
  
  // 画像の初期配置を計算
  const getPosition = (index, total) => {
    // 画面を格子状に分割して配置位置を計算
    const cols = 6;
    const rows = Math.ceil(total / cols);
    
    const col = index % cols;
    const row = Math.floor(index / cols);
    
    // スクリーン全体に均等に分布
    const x = (col / cols) * width * 1.5 - width * 0.75;
    const y = (row / rows) * height * 1.2 - height * 0.6;
    
    // ランダム性を追加
    const randomX = (Math.random() - 0.5) * width * 0.2;
    const randomY = (Math.random() - 0.5) * height * 0.2;
    
    return [x + randomX, y + randomY];
  };
  
  // スクロールに基づいたアニメーション
  useFrame(() => {
    if (!group.current) return;
    
    const scrollOffset = scroll.offset;
    
    // 各画像要素にスクロールベースのアニメーションを適用
    group.current.children.forEach((child, index) => {
      // 位置の更新
      const moveSpeed = 0.5 + (index % 3) * 0.1; // 画像ごとに微妙に速度を変える
      child.position.y += scrollOffset * moveSpeed;
      
      // 一定の高さを超えたら下に戻す（無限スクロールエフェクト）
      if (child.position.y > height * 1.5) {
        child.position.y = -height * 1.5;
        child.position.x = getPosition(index, imageFiles.length)[0];
      }
      
      // 回転の更新
      child.rotation.z += 0.001 * (index % 2 === 0 ? 1 : -1);
      
      // 拡大率の微調整
      const scale = getScaleFromSize(imageFiles[index % imageFiles.length].size);
      const pulseScale = 1 + Math.sin(Date.now() * 0.001 + index) * 0.02;
      child.scale.x = scale[0] * pulseScale;
      child.scale.y = scale[1] * pulseScale;
    });
  });
  
  // CDN_URLを取得
  const CDN_URL = process.env.NEXT_PUBLIC_CLOUDFRONT_URL || '';
  
  return (
    <Scroll>
      <group ref={group}>
        {imageFiles.map((image, index) => {
          const [x, y] = getPosition(index, imageFiles.length);
          const z = getZPosition(index, image.size);
          const scale = getScaleFromSize(image.size);
          
          // CDN URLから画像パスを構築
          const imagePath = `${CDN_URL}/pepe/${image.filename}`;
          
          return (
            <Image 
              key={image.id}
              url={imagePath}
              position={[x, y, z]}
              scale={scale}
              transparent
              opacity={0.9}
              rotation={[0, 0, (Math.random() - 0.5) * 0.2]}
            />
          );
        })}
      </group>
    </Scroll>
  );
};

export default FloatingImages;-e 
### FILE: ./src/app/components/floating-images/useImageLoader.ts

'use client';

import { useState, useEffect } from 'react';
import { TextureLoader } from 'three';
import { ImageFile } from './constants';

interface UseImageLoaderProps {
	images: ImageFile[];
	onProgress?: (progress: number) => void;
	onComplete?: () => void;
}

interface ImageLoadingState {
	loaded: boolean;
	progress: number;
	errors: string[];
}

/**
 * 画像の事前読み込みを行うカスタムフック
 */
export const useImageLoader = ({
	images,
	onProgress,
	onComplete
}: UseImageLoaderProps) => {
	const [loadingState, setLoadingState] = useState<ImageLoadingState>({
		loaded: false,
		progress: 0,
		errors: []
	});

	useEffect(() => {
		if (!images || images.length === 0) {
			setLoadingState({ loaded: true, progress: 100, errors: [] });
			onComplete?.();
			return;
		}

		const textureLoader = new TextureLoader();
		let loadedCount = 0;
		const errors: string[] = [];

		const updateProgress = () => {
			loadedCount++;
			const progress = Math.round((loadedCount / images.length) * 100);

			setLoadingState(prev => ({
				...prev,
				progress,
				loaded: loadedCount === images.length,
				errors: [...errors]
			}));

			onProgress?.(progress);

			if (loadedCount === images.length) {
				onComplete?.();
			}
		};

		// 各画像の読み込み
		images.forEach(image => {
			textureLoader.load(
				image.path,
				// 成功時
				() => {
					updateProgress();
				},
				// 進捗時
				undefined,
				// エラー時
				(error) => {
					console.error(`Error loading image: ${image.path}`, error);
					errors.push(`Failed to load: ${image.filename}`);
					updateProgress();
				}
			);
		});

		// クリーンアップ
		return () => {
			// TextureLoaderのクリーンアップ処理（必要に応じて）
		};
	}, [images, onProgress, onComplete]);

	return loadingState;
};-e 
### FILE: ./src/app/components/floating-images/types.ts

import { Vector3 } from 'three';
import { SizeType } from './constants';

// 円形モーションのProps
export interface CircularImageProps {
  imageUrl: string;
  size: SizeType;
  index: number;
  totalItems: number;
  radius?: number;
  speed?: number;
  height?: number;
}

// 円形モーションの状態
export interface CircularMotionState {
  position: Vector3;
  rotation: [number, number, number];
  scale: number;
  opacity: number;
}

// FloatingImagesFixのProps
export interface FloatingImagesFixProps {
  radius?: number;
  speed?: number;
  height?: number;
}

// FloatingImagesFixSectionのProps
export interface FloatingImagesFixSectionProps {
  className?: string;
}-e 
### FILE: ./src/app/components/floating-images/FloatingImage.tsx

'use client';

import { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import { FloatingImageProps, FloatingObject } from './types';
import { animationConfig } from './constants';

export const FloatingImage = ({ 
  imageUrl, 
  size, 
  index,
  initialDelay = 0 
}: FloatingImageProps) => {
  const meshRef = useRef<FloatingObject>();
  const texture = useTexture(imageUrl);
  const [aspectRatio, setAspectRatio] = useState(1);
  const [started, setStarted] = useState(false);
  
  // テクスチャがロードされたらアスペクト比を設定
  useEffect(() => {
    if (texture && texture.image) {
      const ratio = texture.image.width / texture.image.height;
      setAspectRatio(ratio);
    }
  }, [texture]);
  
  // サイズ設定に基づくスケールファクター
  const scaleFactor = {
    S: 2.0,   // 小さいサイズを大きく
    M: 3.0,   // 中サイズをさらに大きく
    L: 4.0    // 大サイズを特に大きく
  }[size];
  
  // アニメーション速度 - サイズに応じて調整
  const speedFactor = {
    S: 0.05,   // 小さい画像は速く
    M: 0.03,   // 中サイズは中程度
    L: 0.02    // 大サイズはゆっくり
  }[size];
  
  // アニメーション開始タイマー
  useEffect(() => {
    const timer = setTimeout(() => {
      setStarted(true);
    }, initialDelay);
    
    return () => clearTimeout(timer);
  }, [initialDelay]);
  
  // 初期位置 - 画面外から
  const startY = -20 - Math.random() * 10;
  const randomX = (Math.random() - 0.5) * 30; // 広い範囲に分散
  
  // アニメーション状態
  const animState = useRef({
    y: startY,
    x: randomX,
    rotZ: Math.random() * Math.PI * 2, // ランダムな初期回転
    speed: speedFactor * (0.8 + Math.random() * 0.4) // 速度にランダム性を追加
  });
  
  // メッシュ更新
  useFrame((_, delta) => {
    if (!meshRef.current || !started) return;
    
    // 位置の更新（下から上へ）
    animState.current.y += animState.current.speed;
    
    // 左右の揺れ
    const swayAmount = Math.sin(animState.current.y * 0.2) * 0.5;
    
    // 回転の更新
    animState.current.rotZ += delta * 0.1 * (Math.random() * 0.5 + 0.5);
    
    // メッシュの更新
    meshRef.current.position.set(
      animState.current.x + swayAmount, 
      animState.current.y, 
      size === 'S' ? -2 : size === 'M' ? 0 : 2 // 奥行きの設定
    );
    
    meshRef.current.rotation.z = animState.current.rotZ;
    
    // スケールの設定 - アスペクト比を考慮
    meshRef.current.scale.set(
      scaleFactor * aspectRatio, 
      scaleFactor, 
      1
    );
    
    // 透明度 - 画面の端でフェードアウト
    if (meshRef.current.material) {
      if (animState.current.y > 25) {
        // 画面上部に達したらフェードアウト
        meshRef.current.material.opacity = Math.max(0, 1 - (animState.current.y - 25) / 5);
      } else if (animState.current.y < -15) {
        // 画面下部でフェードイン
        meshRef.current.material.opacity = Math.min(1, (animState.current.y + 20) / 5);
      } else {
        // 通常時は完全に表示
        meshRef.current.material.opacity = 1;
      }
    }
    
    // 画面外に出たら再配置（無限ループ）
    if (animState.current.y > 30) {
      animState.current.y = startY;
      animState.current.x = (Math.random() - 0.5) * 30;
    }
  });

  return (
    <mesh
      ref={meshRef}
      position={[randomX, startY, 0]} 
      scale={[0.001, 0.001, 0.001]} // 初期サイズ（ほぼ非表示）
    >
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial 
        map={texture} 
        transparent 
        opacity={0}
        toneMapped={false}
      />
    </mesh>
  );
};-e 
### FILE: ./src/app/components/floating-images/useRadialMotion.ts

'use client';

import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Vector3 } from 'three';
import { SizeType } from '../floating-images/constants';

interface RadialMotionProps {
	size: SizeType;
	index: number;
	totalItems: number;
	maxDistance?: number;
	speed?: number;
}

interface RadialMotionState {
	position: Vector3;
	scale: number;
	opacity: number;
}

/**
 * 中央から放射状に向かってくるアニメーション用のカスタムフック
 */
export const useRadialMotion = ({
	size,
	index,
	totalItems,
	maxDistance = 30, // 最大移動距離
	speed = 0.07 // 速度を上げる
}: RadialMotionProps): RadialMotionState => {
	// 初期状態の設定
	const [state, setState] = useState<RadialMotionState>({
		position: new Vector3(0, 0, -0.1), // 中央近くからスタート
		scale: 0.001,
		opacity: 0
	});

	// アニメーションパラメータ
	const motionRef = useRef({
		// サイズに基づいた設定
		baseScale: size === 'S' ? 0.9 : size === 'M' ? 1.5 : 2.2,
		baseSpeed: size === 'S' ? speed * 1.3 : size === 'M' ? speed : speed * 0.7,

		// 方向ベクトル（ランダムな方向）- より多くの方向を用意
		direction: getRandomDirection(index, totalItems),

		// 現在の距離
		distance: 0.1 + (index % 5) * 0.5, // 様々な距離からスタート（密度向上）

		// アニメーション状態
		time: 0
	});

	// ランダムな方向を取得する関数 - より複雑な分布
	function getRandomDirection(index: number, total: number) {
		// 黄金比を使用してより均等に分布させる
		const goldenRatio = 1.618033988749895;
		const goldenAngle = Math.PI * 2 * (1 - 1 / goldenRatio);

		// 基本方向
		let phi = index * goldenAngle;
		let theta = Math.acos(1 - 2 * ((index % 20) / 20));

		// 少しランダム性を加える
		phi += (Math.random() - 0.5) * 0.2;
		theta += (Math.random() - 0.5) * 0.2;

		// 球面座標から直交座標へ変換
		const x = Math.sin(theta) * Math.cos(phi);
		const y = Math.sin(theta) * Math.sin(phi);
		const z = Math.cos(theta);

		return new Vector3(x, y, Math.abs(z)); // Z軸は常に正（前方へ）
	}

	// フレームごとのアニメーション更新
	useFrame((_, delta) => {
		// 時間の更新
		motionRef.current.time += delta;

		// 距離の更新（中央から外へ）
		motionRef.current.distance += motionRef.current.baseSpeed * delta * 15;

		// 一定の距離に達したら中央付近に戻す（ループ）
		if (motionRef.current.distance > maxDistance) {
			motionRef.current.distance = 0.1 + Math.random() * 0.5;
			motionRef.current.direction = getRandomDirection(index + Math.floor(Math.random() * 100), totalItems);
		}

		// 現在の距離に基づく位置ベクトル
		const position = motionRef.current.direction.clone().multiplyScalar(motionRef.current.distance);

		// 距離に基づくスケール
		// 近いほど小さく、遠いほど大きく
		const normalizedDistance = Math.min(1, motionRef.current.distance / maxDistance);
		const currentScale = motionRef.current.baseScale * normalizedDistance;

		// 透明度（近い/遠いでフェード）
		let currentOpacity = 1.0;
		if (normalizedDistance < 0.1) {
			// 近くでフェードイン
			currentOpacity = normalizedDistance / 0.1;
		} else if (normalizedDistance > 0.85) {
			// 遠くでフェードアウト
			currentOpacity = 1 - (normalizedDistance - 0.85) / 0.15;
		}

		// 状態の更新
		setState({
			position,
			scale: currentScale,
			opacity: currentOpacity
		});
	});

	return state;
};

export default useRadialMotion;-e 
### FILE: ./src/app/components/floating-images/FloatingCanvas.tsx

'use client';

import { useRef, useEffect, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { FloatingImage } from './FloatingImage';
import { imageFiles } from './constants';
import { FloatingCanvasProps, ScrollState } from './types';

export const FloatingCanvas = ({ scrollY = 0 }: FloatingCanvasProps) => {
  const scrollRef = useRef<ScrollState>({
    current: 0,
    target: 0,
    ease: 0.05,
  });
  const { viewport } = useThree();
  const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 });
  
  // ビューポートサイズの更新
  useEffect(() => {
    setViewportSize({
      width: viewport.width,
      height: viewport.height,
    });
  }, [viewport.width, viewport.height]);

  // スクロール位置の更新とアニメーション
  useFrame(() => {
    // 代わりにwindowのスクロール位置を使用
    if (typeof window !== 'undefined') {
      const scrollY = window.scrollY / window.innerHeight; // 正規化されたスクロール位置
      scrollRef.current.target = scrollY;
      scrollRef.current.current += (scrollRef.current.target - scrollRef.current.current) * scrollRef.current.ease;
    }
  });

  // ランダムな位置を生成する関数 - より良い分布のために調整
  const getRandomPosition = (index: number) => {
    // 画面幅を均等に分割し、より広範囲に配置
    const columns = 10; // 横の分割数を増やす
    const columnIndex = index % columns;
    const columnWidth = viewport.width / columns;
    
    // 各列の中央を基準に、ランダムなオフセットを追加
    const baseX = columnIndex * columnWidth - viewport.width / 2 + columnWidth / 2;
    const randomX = baseX + (Math.random() - 0.5) * columnWidth * 0.8;
    
    // スタート位置を画面外のさらに下に
    const startY = -viewport.height - 5 - Math.random() * 20;
    
    return [randomX, startY];
  };

  return (
    <>
      {/* 背景のグラデーション効果 */}
      <mesh position={[0, 0, -10]}>
        <planeGeometry args={[100, 100]} />
        <meshBasicMaterial color="black" transparent opacity={1.0} />
      </mesh>

      {/* 画像要素の生成 - より多くの画像を表示 */}
      {imageFiles.map((image, index) => {
        const [randomX, startY] = getRandomPosition(index);
        // 初期遅延をランダム化して、一斉に表示されないようにする
        const delay = Math.random() * 5000; // 0〜5秒のランダム遅延
        
        return (
          <FloatingImage
            key={`${image.id}-${index}`}
            imageUrl={image.path}
            size={image.size}
            index={index}
            initialDelay={delay}
          />
        );
      })}
      
      {/* 環境光 - 明るさを上げる */}
      <ambientLight intensity={0.8} />
      
      {/* スポットライト効果 - 強度を上げる */}
      <spotLight
        position={[0, 10, 10]}
        angle={0.5}
        penumbra={1}
        intensity={1.0}
        castShadow
      />
    </>
  );
};-e 
### FILE: ./src/app/components/floating-images/EffectsComposer.tsx

'use client';

import { useRef } from 'react';
import { extend, useFrame, useThree } from '@react-three/fiber';
import {
	EffectComposer,
	Bloom,
	Noise,
	Vignette,
	ChromaticAberration,
	GodRays
} from '@react-three/postprocessing';
import { BlendFunction, Resizer, KernelSize } from 'postprocessing';
import { Mesh, MeshBasicMaterial } from 'three';

// ポストプロセッシングのエフェクトをエクスポート
extend({ EffectComposer, Bloom, Noise, Vignette, ChromaticAberration, GodRays });

interface EffectsComposerProps {
	bloomIntensity?: number;
	noiseOpacity?: number;
	vignetteIntensity?: number;
	aberrationOffset?: number;
}

export const EffectsProcessor = ({
	bloomIntensity = 0.8,
	noiseOpacity = 0.05,
	vignetteIntensity = 0.8,
	aberrationOffset = 0.005
}: EffectsComposerProps) => {
	const { gl, scene, camera, size } = useThree();
	const sunRef = useRef<Mesh>(null);

	// サンライト効果用のメッシュ（画面外に配置）
	useFrame(() => {
		if (sunRef.current) {
			// わずかに揺れる効果を追加
			sunRef.current.position.x = Math.sin(Date.now() * 0.001) * 0.5;
			sunRef.current.position.y = Math.cos(Date.now() * 0.0005) * 0.5 + 15;
		}
	});

	return (
		<>
			{/* サンライト効果用の隠しメッシュ */}
			<mesh
				ref={sunRef}
				position={[0, 50, -10]}
				visible={false}
			>
				<sphereGeometry args={[5, 16, 16]} />
				<meshBasicMaterial color="white" />
			</mesh>

			<EffectComposer
				multisampling={8}
				autoClear={false}
			>
				{/* ブルーム効果（光の拡散） */}
				<Bloom
					intensity={bloomIntensity}
					luminanceThreshold={0.2}
					luminanceSmoothing={0.9}
					kernelSize={KernelSize.LARGE}
				/>

				{/* ノイズ効果（フィルムグレイン） */}
				<Noise
					opacity={noiseOpacity}
					blendFunction={BlendFunction.ADD}
				/>

				{/* ビネット効果（周辺減光） */}
				<Vignette
					offset={0.5}
					darkness={vignetteIntensity}
					blendFunction={BlendFunction.NORMAL}
				/>

				{/* 色収差（カラーチャンネルのずれ） */}
				<ChromaticAberration
					offset={[aberrationOffset, aberrationOffset]}
					radialModulation={false}
					modulationOffset={0}
				/>
			</EffectComposer>
		</>
	);
};-e 
### FILE: ./src/app/components/cyber-text-reveal/CyberGrid.tsx

import { useRef, useEffect } from 'react';
import { MotionValue } from 'framer-motion';
import styles from './CyberTextReveal.module.css';

interface CyberGridProps {
  progress: MotionValue<number>;
}

const CyberGrid: React.FC<CyberGridProps> = ({ progress }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  
  // キャンバスのリサイズ
  const resizeCanvas = () => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    // リサイズ後にグリッドを再描画
    drawGrid();
  };
  
  // グリッドの描画
  const drawGrid = () => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // キャンバスをクリア
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 現在のスクロール進行状況を取得
    const currentProgress = progress.get();
    
    // 進行状況に応じたグリッドのZ軸オフセットを計算
    const zOffset = (1 - currentProgress) * 500;
    
    // グリッド線の濃さをスクロール進行状況に基づいて調整
    const gridOpacity = 0.05 + (currentProgress * 0.1);
    
    // 3Dグリッドの描画
    ctx.strokeStyle = `rgba(92, 255, 92, ${gridOpacity})`;
    ctx.lineWidth = 1;
    
    // 水平グリッド線
    const horizonY = canvas.height / 2;
    const gridSize = 50; // グリッドのセルサイズ
    const gridCount = 20; // グリッド線の数
    
    // パースペクティブ効果のための消失点
    const vanishPointX = canvas.width / 2;
    const vanishPointY = horizonY;
    
    // 水平グリッド線
    for (let i = -gridCount; i <= gridCount; i++) {
      const y = horizonY + i * gridSize;
      
      // スクロール進行に応じてグリッド線をZ軸方向に移動
      const scaleFactor = 1 - Math.min(1, Math.abs(y - horizonY) / (canvas.height / 2));
      const zScaleFactor = Math.max(0.1, scaleFactor - (zOffset / 1000));
      
      // Z軸に応じた透明度の調整
      ctx.globalAlpha = Math.max(0.1, zScaleFactor) * gridOpacity * 2;
      
      ctx.beginPath();
      
      // 左端の点
      const leftX = 0;
      const leftY = horizonY + (y - horizonY) * zScaleFactor;
      
      // 右端の点
      const rightX = canvas.width;
      const rightY = leftY;
      
      ctx.moveTo(leftX, leftY);
      ctx.lineTo(rightX, rightY);
      ctx.stroke();
    }
    
    // 垂直グリッド線
    for (let i = -gridCount; i <= gridCount; i++) {
      const x = vanishPointX + i * gridSize;
      
      // スクロール進行に応じてグリッド線をZ軸方向に移動
      const scaleFactor = 1 - Math.min(1, Math.abs(x - vanishPointX) / (canvas.width / 2));
      const zScaleFactor = Math.max(0.1, scaleFactor - (zOffset / 1000));
      
      // Z軸に応じた透明度の調整
      ctx.globalAlpha = Math.max(0.1, zScaleFactor) * gridOpacity * 2;
      
      ctx.beginPath();
      
      // 上端の点
      const topX = vanishPointX + (x - vanishPointX) * zScaleFactor;
      const topY = 0;
      
      // 下端の点
      const bottomX = topX;
      const bottomY = canvas.height;
      
      ctx.moveTo(topX, topY);
      ctx.lineTo(bottomX, bottomY);
      ctx.stroke();
    }
    
    // 特殊効果: 消失点からのライン
    if (currentProgress > 0.4) {
      const glowIntensity = (currentProgress - 0.4) * 2;
      
      ctx.globalAlpha = glowIntensity * 0.3;
      ctx.strokeStyle = `rgba(92, 255, 92, ${glowIntensity * 0.5})`;
      ctx.lineWidth = 2;
      
      // 放射状のライン
      const rayCount = 12;
      for (let i = 0; i < rayCount; i++) {
        const angle = (i / rayCount) * Math.PI * 2;
        const rayLength = canvas.width * 0.8 * glowIntensity;
        
        const endX = vanishPointX + Math.cos(angle) * rayLength;
        const endY = vanishPointY + Math.sin(angle) * rayLength;
        
        ctx.beginPath();
        ctx.moveTo(vanishPointX, vanishPointY);
        ctx.lineTo(endX, endY);
        ctx.stroke();
      }
    }
    
    // 進行状況に応じたアニメーション更新
    animationRef.current = requestAnimationFrame(drawGrid);
  };
  
  useEffect(() => {
    // キャンバスの初期化とリサイズイベントの設定
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // アニメーションの開始
    drawGrid();
    
    return () => {
      // クリーンアップ
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationRef.current);
    };
  }, []);
  
  return (
    <canvas
      ref={canvasRef}
      className={styles.cyberGrid}
    />
  );
};

export default CyberGrid;-e 
### FILE: ./src/app/components/cyber-text-reveal/GlitchText3D.tsx

import { useEffect, useRef } from 'react';
import { MotionValue } from 'framer-motion';
import styles from './CyberTextReveal.module.css';

interface TextPart {
  text: string;
  color: string;
  isHighlight: boolean;
}

interface GlitchText3DProps {
  textParts: TextPart[];
  progress: MotionValue<number>;
  noiseIntensity: MotionValue<number>;
  isMobile: boolean;
}

const GlitchText3D: React.FC<GlitchText3DProps> = ({
  textParts,
  progress,
  noiseIntensity,
  isMobile
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // スクロール進行状況の変化をログに記録
  useEffect(() => {
    const unsubscribe = progress.onChange((value) => {
      console.log('テキスト進行状況変化:', value);
      // 進行に伴い強制的に再レンダリング
      if (containerRef.current) {
        containerRef.current.style.opacity = String(Math.max(0.1, value));
      }
    });
    
    return () => unsubscribe();
  }, [progress]);
  
  // マウス動きに対する反応
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const mouseX = e.clientX;
    const mouseY = e.clientY;
    
    // マウス位置からの相対的な移動量を計算
    const moveX = (mouseX - centerX) / 50;
    const moveY = (mouseY - centerY) / 50;
    
    if (containerRef.current) {
      containerRef.current.style.transform = `
        rotateY(${moveX}deg) 
        rotateX(${-moveY}deg)
        translateZ(0)
      `;
    }
  };
  
  // マウス移動終了時の挙動
  const handleMouseLeave = () => {
    if (!containerRef.current) return;
    
    if (containerRef.current) {
      containerRef.current.style.transform = 'rotateY(0deg) rotateX(0deg) translateZ(0)';
    }
  };
  
  // 現在のプログレス値を取得
  const currentProgress = progress.get();
  const currentNoiseIntensity = noiseIntensity.get();
  
  // デバッグ用の表示を追加
  console.log('描画時のテキスト進行状況:', currentProgress);
  console.log('描画時のノイズ強度:', currentNoiseIntensity);
  
  return (
    <div
      ref={containerRef}
      className={styles.glitchTextContainer}
      style={{
        transform: `perspective(1000px) rotateX(${25 - currentProgress * 25}deg) translateZ(${-200 + currentProgress * 200}px)`,
        opacity: Math.max(0.1, currentProgress),
        transition: 'transform 0.3s ease-out',
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <div className={styles.textWrapper}>
        {textParts.map((part, index) => {
          // パーツごとの遅延を計算
          const delay = index * 0.1;
          // 進行状況を考慮したパーツの表示タイミング
          const partProgress = Math.max(0, (currentProgress - delay) * 1.2);
          
          // パーツのスタイルを計算
          const partOpacity = Math.min(1, partProgress * 2);
          const partScale = 0.5 + partProgress * 0.5;
          
          // テキスト要素のクラスを決定
          const textClass = `
            ${styles.textElement} 
            ${part.isHighlight ? styles.textHighlight : ''}
            ${currentNoiseIntensity > 0.3 ? styles.rgbSplit : ''}
          `;
          
          return (
            <div
              key={index}
              className={textClass}
              style={{
                color: part.color,
                opacity: partOpacity,
                transform: `scale(${partScale})`,
                display: 'inline-block',
                fontSize: part.isHighlight 
                  ? (isMobile ? '1.5rem' : '2.5rem') 
                  : (isMobile ? '1.2rem' : '2rem'),
                marginRight: '0.5rem',
                textShadow: part.isHighlight 
                  ? (part.color === '#5CFF5C' ? 'var(--text-shadow-glow)' : 'var(--text-glow-orange)')
                  : 'none',
              }}
              data-text={part.text}
            >
              {/* テキストが確実に表示されるようにする */}
              <span style={{ position: 'relative', zIndex: 10 }}>{part.text}</span>
            </div>
          );
        })}
      </div>
      
      {/* デバッグ用のインジケーター */}
      <div style={{ position: 'absolute', top: 0, left: 0, background: 'rgba(255,255,255,0.1)', padding: '5px', fontSize: '10px', color: 'white', zIndex: 100 }}>
        Progress: {currentProgress.toFixed(2)}, Noise: {currentNoiseIntensity.toFixed(2)}
      </div>
    </div>
  );
};

export default GlitchText3D;-e 
### FILE: ./src/app/components/cyber-text-reveal/CyberTextRevealSection.tsx

"use client";
import { useEffect, useRef, useState } from 'react';
import { useScroll, useTransform } from 'framer-motion';
import GlitchText3D from './GlitchText3D';
import CyberGrid from './CyberGrid';
import TextParticleEffect from './TextParticleEffect';
import styles from './CyberTextReveal.module.css';

const CyberTextRevealSection = () => {
	const sectionRef = useRef<HTMLDivElement>(null);
	const [isMobile, setIsMobile] = useState(false);
	const [isVisible, setIsVisible] = useState(false);

	// スクロール位置の検出
	const { scrollYProgress } = useScroll({
		target: sectionRef,
		offset: ["start end", "end start"]
	});

	// スクロール位置に基づいた変換値
	const textProgress = useTransform(scrollYProgress, [0.1, 0.6], [0, 1]);
	const noiseIntensity = useTransform(scrollYProgress, [0.1, 0.5], [1, 0.1]);

	// ビューポートサイズの検出
	useEffect(() => {
		const checkMobile = () => {
			setIsMobile(window.innerWidth < 768);
		};

		checkMobile();
		window.addEventListener('resize', checkMobile);

		return () => {
			window.removeEventListener('resize', checkMobile);
		};
	}, []);

	// スクロール監視とデバッグ
	useEffect(() => {
		const unsubscribe = scrollYProgress.onChange((value) => {
			console.log('スクロール進行状況:', value);
			if (value > 0.05) {
				setIsVisible(true);
			}
		});

		// 初期表示の強制（デバッグ用）
		setTimeout(() => {
			setIsVisible(true);
		}, 1000);

		return () => unsubscribe();
	}, [scrollYProgress]);

	// テキスト内容の定義
	const textParts = [
		{ text: '"ペペ味"スペシャルフレーバ', color: '#5CFF5C', isHighlight: true },
		{ text: 'は、ただのプロテインではない。それは、ぺぺが紡ぐ', color: '#FFFFFF', isHighlight: false },
		{ text: '「勇気」', color: '#FF9140', isHighlight: true },
		{ text: 'と', color: '#FFFFFF', isHighlight: false },
		{ text: '「ユーモア」', color: '#FF9140', isHighlight: true },
		{ text: 'の物語。', color: '#FFFFFF', isHighlight: false },
	];

	return (
		<section ref={sectionRef} className={styles.section}>
			<div className={styles.backgroundContainer}>
				{/* サイバーグリッド背景 */}
				<CyberGrid progress={textProgress} />

				{/* ノイズオーバーレイ */}
				<div
					className={styles.noiseOverlay}
					style={{ opacity: Math.min(0.8, noiseIntensity.get()) }}
				/>
			</div>

			<div className={styles.textContainer}>
				<div className={styles.textWrapper}>
					{/* パーティクルエフェクト */}
					<TextParticleEffect
						progress={textProgress}
						containerId="cyber-text-container"
					/>

					{/* 3Dテキスト - 強制的に表示 */}
					<div
						id="cyber-text-container"
						className={styles.textContentWrapper}
						style={{
							opacity: isVisible ? 1 : 0.2, // デバッグ用に少し透明度を持たせる
							zIndex: 20
						}}
					>
						<GlitchText3D
							textParts={textParts}
							progress={textProgress}
							noiseIntensity={noiseIntensity}
							isMobile={isMobile}
						/>
					</div>
				</div>
			</div>

			{/* デバッグ用のスクロールインジケーター */}
			<div style={{
				position: 'fixed',
				top: '10px',
				right: '10px',
				background: 'rgba(0,0,0,0.7)',
				color: 'white',
				padding: '5px',
				zIndex: 1000,
				fontSize: '12px'
			}}>
				Scroll: {scrollYProgress.get().toFixed(2)}
			</div>
		</section>
	);
};

export default CyberTextRevealSection;-e 
### FILE: ./src/app/components/cyber-text-reveal/TextParticleEffect.tsx

import { useEffect, useRef } from 'react';
import { MotionValue } from 'framer-motion';

interface Particle {
	x: number;
	y: number;
	size: number;
	color: string;
	vx: number;
	vy: number;
	life: number;
	maxLife: number;
	targetX?: number;
	targetY?: number;
}

interface TextParticleEffectProps {
	progress: MotionValue<number>;
	containerId: string;
	particleCount?: number;
	colors?: string[];
}

const TextParticleEffect: React.FC<TextParticleEffectProps> = ({
	progress,
	containerId,
	particleCount = 100,
	colors = ['#5CFF5C', '#00FFFF', '#FF9140']
}) => {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const particlesRef = useRef<Particle[]>([]);
	const requestRef = useRef<number>(0);

	// キャンバスのサイズ調整
	const resizeCanvas = () => {
		if (!canvasRef.current) return;

		const container = document.getElementById(containerId);
		if (!container) return;

		const { width, height } = container.getBoundingClientRect();
		canvasRef.current.width = width;
		canvasRef.current.height = height;
	};

	// パーティクルの初期化
	const initParticles = () => {
		if (!canvasRef.current) return;

		const particles: Particle[] = [];
		const { width, height } = canvasRef.current;

		for (let i = 0; i < particleCount; i++) {
			particles.push({
				x: Math.random() * width,
				y: Math.random() * height,
				size: Math.random() * 3 + 1,
				color: colors[Math.floor(Math.random() * colors.length)],
				vx: (Math.random() - 0.5) * 2,
				vy: (Math.random() - 0.5) * 2,
				life: Math.random() * 100,
				maxLife: 100 + Math.random() * 100
			});
		}

		particlesRef.current = particles;
	};

	// パーティクルの更新とレンダリング
	const updateParticles = () => {
		if (!canvasRef.current) return;

		const canvas = canvasRef.current;
		const ctx = canvas.getContext('2d');
		if (!ctx) return;

		// キャンバスのクリア
		ctx.clearRect(0, 0, canvas.width, canvas.height);

		const currentProgress = progress.get();
		const particles = particlesRef.current;

		// パーティクルの更新とレンダリング
		for (let i = 0; i < particles.length; i++) {
			const p = particles[i];

			// ライフサイクルの更新
			p.life -= 0.5;
			if (p.life <= 0) {
				// パーティクルの再生成
				p.x = Math.random() * canvas.width;
				p.y = Math.random() * canvas.height;
				p.size = Math.random() * 3 + 1;
				p.life = p.maxLife;
				p.vx = (Math.random() - 0.5) * 2;
				p.vy = (Math.random() - 0.5) * 2;

				// 進行状況が50%以上の場合、テキスト周辺に集まるようにターゲット位置を設定
				if (currentProgress > 0.5) {
					const centerX = canvas.width / 2;
					const centerY = canvas.height / 2;
					const radius = Math.min(canvas.width, canvas.height) * 0.3;
					const angle = Math.random() * Math.PI * 2;

					p.targetX = centerX + Math.cos(angle) * radius * (0.8 + Math.random() * 0.4);
					p.targetY = centerY + Math.sin(angle) * (radius * 0.5) * (0.8 + Math.random() * 0.4);
				} else {
					p.targetX = undefined;
					p.targetY = undefined;
				}
			}

			// 進行状況に応じた動き方
			if (currentProgress > 0.5 && p.targetX !== undefined && p.targetY !== undefined) {
				// テキスト周辺に集まる挙動
				const dx = p.targetX - p.x;
				const dy = p.targetY - p.y;
				const dist = Math.sqrt(dx * dx + dy * dy);

				if (dist > 5) {
					p.vx = dx * 0.02;
					p.vy = dy * 0.02;
				} else {
					// 目標位置付近ではランダムな動きに
					p.vx = (Math.random() - 0.5) * 1;
					p.vy = (Math.random() - 0.5) * 1;
				}
			}

			// 位置の更新
			p.x += p.vx;
			p.y += p.vy;

			// 画面外に出たパーティクルの処理
			if (p.x < 0) p.x = canvas.width;
			if (p.x > canvas.width) p.x = 0;
			if (p.y < 0) p.y = canvas.height;
			if (p.y > canvas.height) p.y = 0;

			// 描画
			const alpha = (p.life / p.maxLife) * 0.7;
			ctx.globalAlpha = alpha;
			ctx.fillStyle = p.color;
			ctx.beginPath();
			ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
			ctx.fill();

			// 進行状況に応じたつながり線の描画
			if (currentProgress > 0.7) {
				for (let j = i + 1; j < particles.length; j++) {
					const p2 = particles[j];
					const dx = p.x - p2.x;
					const dy = p.y - p2.y;
					const dist = Math.sqrt(dx * dx + dy * dy);

					if (dist < 50) {
						ctx.globalAlpha = (1 - dist / 50) * 0.2 * alpha;
						ctx.strokeStyle = p.color;
						ctx.lineWidth = 0.5;
						ctx.beginPath();
						ctx.moveTo(p.x, p.y);
						ctx.lineTo(p2.x, p2.y);
						ctx.stroke();
					}
				}
			}
		}

		// アニメーションフレームの更新
		requestRef.current = requestAnimationFrame(updateParticles);
	};

	// コンポーネントのライフサイクル管理
	useEffect(() => {
		// キャンバスのリサイズ
		resizeCanvas();
		window.addEventListener('resize', resizeCanvas);

		// パーティクルの初期化
		initParticles();

		// アニメーションの開始
		requestRef.current = requestAnimationFrame(updateParticles);

		// クリーンアップ関数
		return () => {
			window.removeEventListener('resize', resizeCanvas);
			cancelAnimationFrame(requestRef.current);
		};
	}, []);

	return (
		<canvas
			ref={canvasRef}
			style={{
				position: 'absolute',
				top: 0,
				left: 0,
				width: '100%',
				height: '100%',
				pointerEvents: 'none',
				zIndex: 1,
			}}
		/>
	);
};

export default TextParticleEffect;-e 
### FILE: ./src/app/components/debug/ModelDebug.tsx

'use client';

import { Suspense, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF, useFBX, Html } from '@react-three/drei';

// デバッグ用の簡易コンポーネント
function ModelDebug() {
  const [modelType, setModelType] = useState('box');
  
  return (
    <div className="w-full h-screen bg-black">
      {/* モデル選択ボタン */}
      <div className="absolute top-4 left-4 z-10 flex gap-2">
        <button 
          className={`px-3 py-1 rounded ${modelType === 'box' ? 'bg-green-500' : 'bg-gray-700'}`}
          onClick={() => setModelType('box')}
        >
          Box
        </button>
        <button 
          className={`px-3 py-1 rounded ${modelType === 'fbx' ? 'bg-green-500' : 'bg-gray-700'}`}
          onClick={() => setModelType('fbx')}
        >
          FBX
        </button>
        <button 
          className={`px-3 py-1 rounded ${modelType === 'glb' ? 'bg-green-500' : 'bg-gray-700'}`}
          onClick={() => setModelType('glb')}
        >
          GLB
        </button>
      </div>

      <Canvas camera={{ position: [0, 1, 5], fov: 60 }}>
        <ambientLight intensity={0.7} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <pointLight position={[-10, -10, -10]} color="#00FF7F" intensity={0.5} />

        <Suspense fallback={<FallbackLoading />}>
          {modelType === 'box' && <BoxModel />}
          {modelType === 'fbx' && <FBXModel />}
          {modelType === 'glb' && <GLBModel />}
        </Suspense>

        <OrbitControls />
        <gridHelper args={[10, 10]} />
        <axesHelper args={[5]} />
      </Canvas>
    </div>
  );
}

// ローディング中の表示
function FallbackLoading() {
  return (
    <Html center>
      <div className="text-white bg-black/50 p-2 rounded">
        Loading model...
      </div>
    </Html>
  );
}

// ボックス表示
function BoxModel() {
  return (
    <mesh>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#00FF7F" />
    </mesh>
  );
}

// FBXモデル表示
function FBXModel() {
  try {
    console.log('Loading FBX model...');
    const fbx = useFBX('/models/pepe.fbx');
    console.log('FBX model loaded:', fbx);
    
    return (
      <primitive 
        object={fbx} 
        scale={[0.05, 0.05, 0.05]} 
        position={[0, 0, 0]} 
      />
    );
  } catch (error) {
    console.error('FBX load error:', error);
    return (
      <Html center>
        <div className="text-red-500 bg-black/80 p-3 rounded">
          Error loading FBX: {error.message || 'Unknown error'}
        </div>
      </Html>
    );
  }
}

// GLBモデル表示
function GLBModel() {
  try {
    console.log('Loading GLB model...');
    const gltf = useGLTF('/models/pepe.glb');
    console.log('GLB model loaded:', gltf);
    
    return (
      <primitive 
        object={gltf.scene} 
        scale={[1, 1, 1]} 
        position={[0, 0, 0]} 
      />
    );
  } catch (error) {
    console.error('GLB load error:', error);
    return (
      <Html center>
        <div className="text-red-500 bg-black/80 p-3 rounded">
          Error loading GLB: {error.message || 'Unknown error'}
        </div>
      </Html>
    );
  }
}

export default ModelDebug;-e 
### FILE: ./src/app/components/floating-images-fix/constants.ts

// src/app/components/floating-images-fix/constants.ts

export type ImageSize = 'L' | 'M' | 'S';

export interface ImageFile {
  id: number;
  filename: string;
  size: ImageSize;
  path: string;
}

// CDNパス
const CDN_URL = process.env.NEXT_PUBLIC_CLOUDFRONT_URL || "";

// 画像ファイルリスト
export const imageFiles: ImageFile[] = [
  { id: 1, filename: '1L.webp', size: 'L', path: `${CDN_URL}/pepe/1L.webp` },
  { id: 2, filename: '2M.webp', size: 'M', path: `${CDN_URL}/pepe/2M.webp` },
  { id: 3, filename: '3S.webp', size: 'S', path: `${CDN_URL}/pepe/3S.webp` },
  { id: 4, filename: '4S.webp', size: 'S', path: `${CDN_URL}/pepe/4S.webp` },
  { id: 5, filename: '5M.webp', size: 'M', path: `${CDN_URL}/pepe/5M.webp` },
  { id: 6, filename: '6L.webp', size: 'L', path: `${CDN_URL}/pepe/6L.webp` },
  { id: 7, filename: '7M.webp', size: 'M', path: `${CDN_URL}/pepe/7M.webp` },
  { id: 8, filename: '8M.webp', size: 'M', path: `${CDN_URL}/pepe/8M.webp` },
  { id: 9, filename: '9L.webp', size: 'L', path: `${CDN_URL}/pepe/9L.webp` },
  { id: 10, filename: '10S.webp', size: 'S', path: `${CDN_URL}/pepe/10S.webp` },
  { id: 11, filename: '11S.webp', size: 'S', path: `${CDN_URL}/pepe/11S.webp` },
  { id: 12, filename: '12M.webp', size: 'M', path: `${CDN_URL}/pepe/12M.webp` },
  { id: 13, filename: '13L.webp', size: 'L', path: `${CDN_URL}/pepe/13L.webp` },
  { id: 14, filename: '14L.webp', size: 'L', path: `${CDN_URL}/pepe/14L.webp` },
  { id: 15, filename: '15M.webp', size: 'M', path: `${CDN_URL}/pepe/15M.webp` },
  { id: 16, filename: '16S.webp', size: 'S', path: `${CDN_URL}/pepe/16S.webp` },
  { id: 17, filename: '17S.webp', size: 'S', path: `${CDN_URL}/pepe/17S.webp` },
  { id: 18, filename: '18M.webp', size: 'M', path: `${CDN_URL}/pepe/18M.webp` },
  { id: 19, filename: '19L.webp', size: 'L', path: `${CDN_URL}/pepe/19L.webp` },
  { id: 20, filename: '20L.webp', size: 'L', path: `${CDN_URL}/pepe/20L.webp` },
  { id: 21, filename: '21S.webp', size: 'S', path: `${CDN_URL}/pepe/21S.webp` },
  { id: 22, filename: '22S.webp', size: 'S', path: `${CDN_URL}/pepe/22S.webp` },
  { id: 23, filename: '23L.webp', size: 'L', path: `${CDN_URL}/pepe/23L.webp` },
  { id: 24, filename: '24L.webp', size: 'L', path: `${CDN_URL}/pepe/24L.webp` },
  { id: 25, filename: '25S.webp', size: 'S', path: `${CDN_URL}/pepe/25S.webp` },
  { id: 26, filename: '26S.webp', size: 'S', path: `${CDN_URL}/pepe/26S.webp` },
  { id: 27, filename: '27S.webp', size: 'S', path: `${CDN_URL}/pepe/27S.webp` },
  { id: 28, filename: '28L.webp', size: 'L', path: `${CDN_URL}/pepe/28L.webp` },
  { id: 29, filename: '29S.webp', size: 'S', path: `${CDN_URL}/pepe/29S.webp` },
  { id: 30, filename: '30S.webp', size: 'S', path: `${CDN_URL}/pepe/30S.webp` },
  { id: 31, filename: '31M.webp', size: 'M', path: `${CDN_URL}/pepe/31M.webp` },
  { id: 32, filename: '32M.webp', size: 'M', path: `${CDN_URL}/pepe/32M.webp` },
  { id: 33, filename: '33M.webp', size: 'M', path: `${CDN_URL}/pepe/33M.webp` },
  { id: 34, filename: '34S.webp', size: 'S', path: `${CDN_URL}/pepe/34S.webp` },
  { id: 35, filename: '35L.webp', size: 'L', path: `${CDN_URL}/pepe/35L.webp` },
];

// サイズに応じたスケール
export const SCALE_MAP: Record<ImageSize, number> = {
  L: 4,
  M: 3,
  S: 2,
};
-e 
### FILE: ./src/app/components/floating-images-fix/FloatingImageFix.tsx

import { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import type { ImageFile } from './constants';

interface FloatingImageFixProps {
  image: ImageFile;
  position: [number, number, number];
  scale: number;
  rotationSpeed?: number;
}

const FloatingImageFix: React.FC<FloatingImageFixProps> = ({
  image,
  position,
  scale,
  rotationSpeed = 0.005,
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const texture = useTexture(image.path);

  // 最新のrotationSpeedを参照するref
  const speedRef = useRef(rotationSpeed);
  useEffect(() => {
    speedRef.current = rotationSpeed;
  }, [rotationSpeed]);

  // アスペクト比（幅/高さ）
  const [aspect, setAspect] = useState(1);
  useEffect(() => {
    if (texture?.image) {
      setAspect(texture.image.width / texture.image.height);
    }
  }, [texture]);

  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.z += (speedRef.current ?? 0.06) * delta;
    }
  });

  const width = scale;
  const height = scale / aspect;

  return (
    <mesh
      ref={meshRef}
      position={position}
      castShadow={false}
      receiveShadow={false}
    >
      <planeGeometry args={[width, height]} />
      <meshBasicMaterial
        map={texture}
        transparent
        opacity={0.5}
        toneMapped={false}
      />
    </mesh>
  );
};

export default FloatingImageFix;
-e 
### FILE: ./src/app/components/floating-images-fix/FloatingImagesFixSection.tsx

// src/app/components/floating-images-fix/FloatingImagesFixSection.tsx

'use client';

import React from 'react';
import FloatingImagesFixCanvas from './FloatingImagesFixCanvas';

const FloatingImagesFixSection: React.FC = () => {
	return (<>
		<div className='relative h-[150vh] bg-black'/>
		<section className="w-screen h-[800vh] relative overflow-hidden bg-black">
			<div className="w-screen h-full sticky top-0 left-0 pointer-events-none z-10">
				<div className="absolute top-0 left-0 w-full h-[100vh] z-20
						bg-gradient-to-b from-black via-black/40 to-black/0
						pointer-events-none"
				/>
				<FloatingImagesFixCanvas />
				<div className="absolute bottom-0 left-0 w-full h-[100vh] z-20
						bg-gradient-to-b from-black/0 via-black/40 to-black
						pointer-events-none"
				/>
			</div>
		</section>
		<div className='relative h-[150vh] bg-black' />
	</>);
};

export default FloatingImagesFixSection;
-e 
### FILE: ./src/app/components/floating-images-fix/FloatingImagesFixCanvas.tsx

'use client';

import React, { useMemo } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import FloatingImageFix from './FloatingImageFix';
import { imageFiles, SCALE_MAP, ImageSize } from './constants';

const CANVAS_DEPTH = 5; // 奥行き全体の幅
const PADDING_X = 0.5;  // 横方向パディング
const PADDING_Y = 2;  // 縦方向パディング

const getZBySize = (size: ImageSize) => {
	if (size === 'L') return CANVAS_DEPTH * 0.42 + Math.random();
	if (size === 'M') return Math.random() * 2 - 1;
	return -CANVAS_DEPTH * 0.42 + Math.random();
};

const FloatingImagesFixInner: React.FC = () => {
	const { viewport } = useThree();
	const count = imageFiles.length;
	const cols = Math.ceil(Math.sqrt(count));
	const rows = Math.ceil(count / cols);

	const positions = useMemo(() => {
		const arr: [number, number, number][] = [];
		const images = imageFiles.slice().reverse();

		for (let i = 0; i < count; i++) {
			const col = i % cols;
			const row = Math.floor(i / cols);
			const image = images[i];

			// パディングX/Yをそれぞれ使用
			const x =
				((col + 0.5) / cols) * (viewport.width - PADDING_X * 2) +
				PADDING_X -
				viewport.width / 2;
			const y =
				((row + 0.5) / rows) * (viewport.height - PADDING_Y * 2) +
				PADDING_Y -
				viewport.height / 2;

			const z = getZBySize(image.size);
			arr.push([x, y, z]);
		}
		return arr;
	}, [count, cols, rows, viewport.width, viewport.height]);

	const speeds = useMemo(
		() => imageFiles.map(() => 0.03 + Math.random() * 0.05),
		[]
	);

	const images = useMemo(() => imageFiles.slice().reverse(), []);

	return (
		<>
			{images.map((image, i) => (
				<FloatingImageFix
					key={image.id}
					image={image}
					position={positions[i]}
					scale={SCALE_MAP[image.size]}
					rotationSpeed={speeds[i]}
				/>
			))}
			<ambientLight intensity={0.8} />
		</>
	);
};

const FloatingImagesFixCanvas: React.FC = () => {
	return (
		<Canvas
			camera={{ position: [0, 0, 32], fov: 40 }}
			style={{ width: '100%', height: '100%' }}
			gl={{ antialias: true, alpha: false }}
			dpr={[1, 2]}
		>
			<color attach="background" args={['#070c12']} />
			<FloatingImagesFixInner />
		</Canvas>
	);
};

export default FloatingImagesFixCanvas;
-e 
### FILE: ./src/app/layout.tsx

import { Montserrat, Space_Grotesk, DotGothic16 } from 'next/font/google';
import './globals.css';
import type { Metadata } from 'next';
import SmoothScroll from './components/layout/SmoothScroll';
// フォントの設定
const montserrat = Montserrat({
	subsets: ['latin'],
	variable: '--font-montserrat',
	display: 'swap',
});

const spaceGrotesk = Space_Grotesk({
	subsets: ['latin'],
	variable: '--font-space-grotesk',
	display: 'swap',
});
const pixel = DotGothic16({
  weight: '400',
  subsets: ['latin', 'latin-ext'],
  variable: '--font-pixel',
  display: 'swap',
});

// メタデータ設定
export const metadata: Metadata = {
	title: 'We Are On-Chain | Pepe Protein',
	description: 'Pay, Pump, Live. The crypto-exclusive protein for the blockchain generation.',
	keywords: 'crypto, protein, blockchain, pepe, fitness, cryptocurrency',
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang="en" className={`${montserrat.variable} ${spaceGrotesk.variable} ${pixel.variable}`}>
			<body className="bg-black text-white min-h-screen font-sans antialiased">

				{children}

			</body>
		</html>
	);
}-e 
### FILE: ./src/app/page.tsx

import HeroSection from './components/hero-section/HeroSection';
import SphereTop from './components/sphere/SphereTop';
import PepeTop from './components/pepe3d/PepeTop';
import GlowingTextSection from './components/glowing-3d-text/GlowingTextSection';
import PulsatingComponent from './components/layout/PulsatingComponent';
import FloatingImagesFixSection from './components/floating-images-fix/FloatingImagesFixSection';
export default function Home() {
	return (
		<main className="relative">
			<HeroSection />
			<GlowingTextSection />
			<PulsatingComponent />
			<PepeTop />
			<SphereTop />
			<FloatingImagesFixSection />
		</main>
	);
}
-e 
### FILE: ./tailwind.config.js

/** @type {import('tailwindcss').Config} */
module.exports = {
	content: [
		'./src/pages/**/*.{js,ts,jsx,tsx,mdx}',
		'./src/components/**/*.{js,ts,jsx,tsx,mdx}',
		'./src/app/**/*.{js,ts,jsx,tsx,mdx}',
	],
	theme: {
		extend: {
			colors: {
				neonGreen: '#00FF7F',
				neonOrange: '#FF6D00',
				dark: {
					100: '#111111',
					200: '#222222',
					300: '#333333',
					400: '#444444',
					500: '#555555',
				},
			},
			fontFamily: {
				sans: ['var(--font-montserrat)', 'sans-serif'],
				heading: ['var(--font-space-grotesk)', 'sans-serif'],
				pixel: ['var(--font-pixel)', 'sans-serif'],
			},
			animation: {
				glitch: 'glitch 0.2s ease-in-out infinite',
				'glitch-slow': 'glitch 2s ease-in-out infinite',
				pulse: 'pulse 2s ease-in-out infinite',
				'pulse-fast': 'pulse 1s ease-in-out infinite',
				scanline: 'scanline 8s linear infinite',
				typewriter: 'typewriter 4s steps(40) 1s infinite',
			},
			keyframes: {
				glitch: {
					'0%, 100%': { transform: 'translate(0)' },
					'20%': { transform: 'translate(-2px, 2px)' },
					'40%': { transform: 'translate(-2px, -2px)' },
					'60%': { transform: 'translate(2px, 2px)' },
					'80%': { transform: 'translate(2px, -2px)' },
				},
				pulse: {
					'0%, 100%': {
						opacity: '1',
						filter: 'brightness(1) blur(0px)',
					},
					'50%': {
						opacity: '0.8',
						filter: 'brightness(1.2) blur(1px)',
					},
				},
				scanline: {
					'0%': {
						transform: 'translateY(-100%)',
					},
					'100%': {
						transform: 'translateY(100vh)',
					},
				},
				typewriter: {
					'0%, 100%': {
						width: '0%',
					},
					'20%, 80%': {
						width: '100%',
					},
				},
			},
			transitionProperty: {
				'transform': 'transform',
			},
			transitionTimingFunction: {
				'out-sine': 'cubic-bezier(0.39, 0.575, 0.565, 1)',
			},
			// クリップパスの追加（ClipPath プラグインを使わない場合）
			clipPath: {
				'diagonal-transition': 'polygon(100% 0, 100% 100%, 0 100%, 45% 0)',
				'diagonal-transition-mobile': 'polygon(100% 0, 100% 100%, 0 100%, 35% 0)',
			},
		},
	},
	plugins: [],
}-e 
### FILE: ./postcss.config.js

module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
-e 
### FILE: ./custom.d.ts

// custom.d.ts
import { ReactThreeFiber } from '@react-three/fiber';
import { OrbitControls } from 'three-stdlib';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      ambientLight: ReactThreeFiber.Object3DNode<THREE.AmbientLight, typeof THREE.AmbientLight>;
      directionalLight: ReactThreeFiber.Object3DNode<THREE.DirectionalLight, typeof THREE.DirectionalLight>;
      spotLight: ReactThreeFiber.Object3DNode<THREE.SpotLight, typeof THREE.SpotLight>;
      group: ReactThreeFiber.Object3DNode<THREE.Group, typeof THREE.Group>;
      mesh: ReactThreeFiber.Object3DNode<THREE.Mesh, typeof THREE.Mesh>;
    }
  }
}-e 
### FILE: ./next.config.js

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [],
    formats: ["image/avif", "image/webp"],
  },
  // WebGLキャンバスサポート
  webpack: (config) => {
    config.module.rules.push({
      test: /\.(glsl|vs|fs|vert|frag)$/,
      type: "asset/source",
    });

    return config;
  },
  // 実験的機能
  experimental: {
    optimizeCss: true,
    scrollRestoration: true,
  },
};

module.exports = nextConfig;-e 
### FILE: ./next-env.d.ts

/// <reference types="next" />
/// <reference types="next/image-types/global" />

// NOTE: This file should not be edited
// see https://nextjs.org/docs/basic-features/typescript for more information.

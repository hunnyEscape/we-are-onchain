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

// メインのエクスポートコンポーネント
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
### FILE: ./src/app/components/pepe3d/ScrollMessage.tsx

'use client';
import React, { useEffect, useRef, useState } from 'react';

type MessageConfig = {
	id: string;
	text: string;
	top?: string;
	left?: string;
	width?: string;
	fontSize?: string;
};

const messages: MessageConfig[] = [
	{
		id: 'trigger-1',
		text: '🧪深緑の源泉 ー 古代から森にひそむ「ぺぺの泉」。',
		top: '20vh',
		left: '10vw',
		width: 'auto',
		fontSize: '2rem',
	},
	{
		id: 'trigger-2',
		text: '💎そこから湧き出るグリーンミネラルが、濃厚なコクとほどよい甘みをもたらす。',
		top: '30vh',
		left: '30vw',
		width: 'max-content',
		fontSize: '2rem',
	},
	{
		id: 'trigger-3',
		text: '一口ごとに脈打つビート、疲労を吹き飛ばし、次の挑戦へと背中を押す。',
		top: '40vh',
		left: '10vw',
		width: 'max-content',
		fontSize: '2rem',
	},
	{
		id: 'trigger-4',
		text: '次元を超えたグリーンパワーを、その手で感じよ。',
		top: '80vh',
		left: '30vw',
		width: '60vw',
		fontSize: '3rem',
	},
];

const ScrollTriggerMessages: React.FC = () => {
	const refs = useRef<(HTMLDivElement | null)[]>([]);
	const [activeIndex, setActiveIndex] = useState<number | null>(null);

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
		return () => refs.current.forEach((r) => r && observer.unobserve(r));
	}, []);

	return (
		<>
			{/* トリガー用ダミーゾーン（100vh × 4つ） */}
			{messages.map((_, i) => (
				<div key={`zone-${i}`} ref={(el) => (refs.current[i] = el)} className="h-screen w-full" />
			))}

			{/* フローティングメッセージ */}
			{messages.map((msg, i) => {
				const isActive = activeIndex === i;
				return (
					<div
						key={msg.id}
						className={`fixed z-50 font-pixel text-white transition-opacity duration-700 ease-in-out
									${isActive ? 'opacity-100' : 'opacity-0'}
									${msg.id === 'trigger-4' && isActive ? 'animate-glitch-slow' : ''}
            					`}
						style={{
							top: msg.top,
							left: msg.left,
							width: msg.width,
							fontSize: msg.fontSize,
						}}
					>
						{msg.text}
					</div>
				);
			})}
		</>
	);
};

export default ScrollTriggerMessages;
-e 
### FILE: ./src/app/components/pepe3d/PepeTop.tsx

// src/app/page.tsx
import React from 'react';
import PepeModel3D from './PepeModel3D';
import ScrollMessage from './ScrollMessage';
const PepeTop: React.FC = () => {
	return (
		<div className="relative h-[700vh]">
			<div className="sticky top-0 h-screen w-full overflow-hidden">
				<PepeModel3D />
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
			<ScrollMessage/>
		</div>
	);
};

export default PepeTop;
-e 
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
export default function Home() {
	return (
		<main className="relative">
			<HeroSection/>
			<GlowingTextSection /> 
			<PulsatingComponent/>
			<PepeTop/>
			<SphereTop />
			<div
				className="h-screen w-full bg-cover bg-center"
				style={{
					backgroundImage: `url('${process.env.NEXT_PUBLIC_CLOUDFRONT_URL}/pepe-cyberpunk.webp')`,
				}}
			/>
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

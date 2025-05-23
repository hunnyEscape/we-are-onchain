-e 
### FILE: ./src/app/components/layout/constants.ts

// src/app/components/floating-images-fix/cyber-scroll-messages/constants.ts

export type GlitchEffectType = 'rgb' | 'slice' | 'wave' | 'pulse' | 'jitter' | 'none';
export type TextDirection = 'horizontal' | 'vertical';
export type TextAlignment = 'left' | 'center' | 'right';

export interface MessageConfig {
	id: string;
	text: string;
	position: {
		start: number; // vh単位での開始位置
		end: number;   // vh単位での終了位置
	};
	style: TextDirection;
	size: string;
	align?: TextAlignment;
	glitchEffect?: GlitchEffectType;
	keywords?: string[]; // 特別強調するキーワード
	delay?: number;      // 表示遅延 (ms)
	color?: string;      // オーバーライド色
}

export interface GlitchEffectConfig {
	className: string;
	intensity: number;
}

// メッセージ定義
export const cyberMessages: MessageConfig[] = [
	{
		id: 'message-1',
		text: 'Pepe Ascends.',
		position: { start: 0, end: 200 },
		style: 'horizontal',
		size: '4rem',
		align: 'left',
		glitchEffect: 'rgb',
		keywords: ['mystery', 'miracle'],
		color: '#ffffff', // 白色ベース
	},
	{
		id: 'message-2',
		text: 'Pepe Summons Us Here.',
		position: { start: 200, end: 400 },
		style: 'horizontal',
		size: '4rem',
		align: 'right',
		glitchEffect: 'slice',
		keywords: ['限られた', 'たどり着く'],
		color: '#ffffff', // 白色ベース
	},
	{
		id: 'message-3',
		text: 'The<br/>Awakening',
		position: { start: 400, end: 700 },
		style: 'horizontal',
		size: '10rem',
		align: 'left',
		glitchEffect: 'rgb',
		keywords: ['境地'],
		color: '#ffffff', // 白色ベース
	}
];

// グリッチエフェクト設定
export const glitchEffects: Record<GlitchEffectType, GlitchEffectConfig> = {
	rgb: {
		className: 'rgbSplit',
		intensity: 2
	},
	wave: {
		className: 'waveDistort',
		intensity: 1.5
	},
	slice: {
		className: 'sliceGlitch',
		intensity: 3
	},
	pulse: {
		className: 'pulseEffect',
		intensity: 2
	},
	jitter: {
		className: 'jitterEffect',
		intensity: 1
	},
	none: {
		className: '',
		intensity: 0
	}
};

// システムステータス表示用テキスト
export const systemStatusText = {
	loading: 'Loading...',
	ready: 'Activate',
	awakening: 'Start...',
	complete: 'END'
};

// 装飾用ランダムバイナリ生成
export const generateRandomBinary = (length: number): string => {
	return Array.from({ length }, () => Math.round(Math.random())).join('');
};

// 装飾用16進数生成
export const generateRandomHex = (length: number): string => {
	const hexChars = '0123456789ABCDEF';
	return Array.from(
		{ length },
		() => hexChars[Math.floor(Math.random() * hexChars.length)]
	).join('');
};-e 
### FILE: ./src/app/components/layout/CyberInterface.tsx

// src/app/components/floating-images-fix/cyber-scroll-messages/CyberInterface.tsx

'use client';

import React, { useEffect, useState } from 'react';
import styles from './styles.module.css';
import {
	generateRandomBinary,
	generateRandomHex,
	systemStatusText,
	cyberMessages
} from './constants';

interface CyberInterfaceProps {
}

const CyberInterface: React.FC<CyberInterfaceProps> = ({

}) => {
	const [dataStream, setDataStream] = useState<string[]>([]);
	const [systemTime, setSystemTime] = useState<string>('');
	const [scrollProgress, setScrollProgress] = useState<number>(0);
	const [activeIndex, setActiveIndex] = useState<number | null>(null);
	const [randomGlitch, setRandomGlitch] = useState<boolean>(false);
	const [isFlashActive, setIsFlashActive] = useState<boolean>(false);
	const [debugInfo, setDebugInfo] = useState<{ [key: string]: any }>({});

	// 強制的に全てのメッセージをアクティブにする（デバッグ用）
	const [forceAllActive, setForceAllActive] = useState<boolean>(false);

	useEffect(() => {
		const handleScroll = () => {
			// 現在のページ全体のスクロール位置
			const scrollTop = window.scrollY;
			const winHeight = window.innerHeight;
			const docHeight = document.documentElement.scrollHeight;

			// まず全体のスクロール進捗を計算
			const totalScrollProgress = scrollTop / (docHeight - winHeight);

			// FloatingImagesFixSectionを特定のセレクターで検索
			const targetSection = document.querySelector('#floating-images-fix-section') as HTMLElement;

			if (!targetSection) {
				// フォールバック: クラス名でも検索
				const fallbackSection = document.querySelector('.floating-images-fix-section') as HTMLElement;

				if (!fallbackSection) {
					// セクションが見つからない場合、ページの相対位置で推定
					console.log('Target section not found, estimating position');

					// ページの相対位置から推定（調整された値）
					const estimatedStart = docHeight * 0.5;  // 0.66から0.5に調整
					const estimatedHeight = docHeight * 0.25;

					// 相対スクロール位置を計算
					const relativeScroll = Math.max(0, Math.min(1,
						(scrollTop - estimatedStart) / estimatedHeight
					));

					setScrollProgress(relativeScroll);
					setDebugInfo({
						scrollTop,
						docHeight,
						estimatedStart,
						estimatedHeight,
						relativeScroll,
						mode: 'estimated'
					});

					// メッセージ表示の判定
					updateActiveMessage(relativeScroll * 800);
				} else {
					// フォールバックセクションを使用
					processSectionScroll(fallbackSection, scrollTop);
				}
			} else {
				// メインのIDセレクターで見つかった場合
				processSectionScroll(targetSection, scrollTop);
			}

			// ランダムグリッチの発生
			triggerRandomGlitch();
		};

		// セクションスクロール処理を共通化
		const processSectionScroll = (section: HTMLElement, scrollTop: number) => {
			const rect = section.getBoundingClientRect();
			const sectionTop = rect.top + scrollTop;
			const sectionHeight = rect.height;

			// セクション内相対位置を計算
			let relativeScroll = 0;
			if (scrollTop < sectionTop) {
				relativeScroll = 0;
			} else if (scrollTop > sectionTop + sectionHeight) {
				relativeScroll = 1;
			} else {
				relativeScroll = (scrollTop - sectionTop) / sectionHeight;
			}

			setScrollProgress(relativeScroll);
			setDebugInfo({
				scrollTop,
				sectionTop,
				sectionHeight,
				relativeScroll,
				viewportOffset: rect.top,
				mode: 'section-based',
				sectionFound: section.id || section.className
			});

			// メッセージ表示の判定
			updateActiveMessage(relativeScroll * 800);
		};

		// メッセージのアクティブ状態を更新
		const updateActiveMessage = (currentVhPosition: number) => {
			if (forceAllActive) {
				setActiveIndex(0);
				return;
			}

			// セクション検出が正常に動作している場合は、オフセット調整を少なくする
			const adjustedPosition = currentVhPosition - 50; // 150から50に調整

			let foundActive = false;
			let activeIdx = null;


			setActiveIndex(foundActive ? activeIdx : null);
		};

		// フラッシュエフェクトをトリガー
		const triggerFlashEffect = () => {
			setIsFlashActive(true);
			setTimeout(() => setIsFlashActive(false), 300);
		};

		// ランダムなグリッチエフェクトをトリガー
		const triggerRandomGlitch = () => {
			if (Math.random() > 0.95) {
				setRandomGlitch(true);
				setTimeout(() => setRandomGlitch(false), 150);
			}
		};

		window.addEventListener('scroll', handleScroll);
		handleScroll(); // 初期化時に一度実行

		// キーボードショートカット：Dキーでデバッグモード切替
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === 'd' || e.key === 'D') {
				setForceAllActive(prev => !prev);
				console.log('Debug mode:', !forceAllActive);
			}
		};

		window.addEventListener('keydown', handleKeyDown);

		return () => {
			window.removeEventListener('scroll', handleScroll);
			window.removeEventListener('keydown', handleKeyDown);
		};
	}, [forceAllActive, isFlashActive]);


	// システムステータステキスト
	const getStatusText = () => {
		if (activeIndex === null) return systemStatusText.loading;
		if (activeIndex === 0) return systemStatusText.ready;
		if (activeIndex === 1) return systemStatusText.awakening;
		if (activeIndex === 2) return systemStatusText.complete;
		return systemStatusText.loading;
	};

	// データストリームを生成
	useEffect(() => {
		// 初期データストリームを生成
		const initialData: string[] = [];
		for (let i = 0; i < 50; i++) {
			if (Math.random() > 0.7) {
				initialData.push(generateRandomHex(16));
			} else {
				initialData.push(generateRandomBinary(16));
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
						newData[index] = generateRandomHex(16);
					} else {
						newData[index] = generateRandomBinary(16);
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
			setSystemTime(`SYS://AWAKENING_SEQUENCE v2.4.7 | ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`);
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


			{/* フラッシュエフェクト */}
			<div className={`${styles.flashEffect} ${isFlashActive ? styles.flashActive : ''}`}></div>

			{/* コーナーマーカー */}
			<div className={styles.cyberFrame}>
				<div className={`${styles.cornerMarker} ${styles.topLeft} ${randomGlitch ? styles.jitterEffect : ''}`}></div>
				<div className={`${styles.cornerMarker} ${styles.topRight} ${randomGlitch ? styles.jitterEffect : ''}`}></div>
				<div className={`${styles.cornerMarker} ${styles.bottomLeft} ${randomGlitch ? styles.jitterEffect : ''}`}></div>
				<div className={`${styles.cornerMarker} ${styles.bottomRight} ${randomGlitch ? styles.jitterEffect : ''}`}></div>
			</div>

			<div className={`${styles.thickScanline}`} />
			<div className={`${styles.scanline}`}></div>
			{/* データストリーム */}
			<div className={`${styles.dataStream} `}>
				<div className={styles.dataContent}>
					{dataStream.map((line, index) => (
						<div key={index} className={randomGlitch && index % 5 === 0 ? styles.jitterEffect : ''}>
							{line}
						</div>
					))}
				</div>
			</div>

			{/* エネルギーメーター */}
			<div className={`${styles.energyMeter} hidden sm:block`}>
				<div
					className={styles.energyLevel}
					style={{ height: `${energyLevel}%` }}
				></div>
			</div>

			{/* システムステータス */}
			<div className={`${styles.systemStatus} hidden sm:block`}>
				<div>{systemTime}</div>
				<div>SECTION: {activeIndex !== null ? activeIndex + 1 : 0}/{cyberMessages.length}</div>
				<div>ENERGY: {Math.floor(energyLevel)}%</div>
				<div>{getStatusText()}</div>
			</div>

		</>
	);
};

export default CyberInterface;-e 
### FILE: ./src/app/components/layout/ScanlineEffect.tsx

// src/app/components/ui/ScanlineEffect.tsx
import React from 'react';

export const ScanlineEffect: React.FC = () => {
  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden hidden sm:block">
      <div className="absolute inset-0 z-10 h-full w-full bg-transparent opacity-10">
        {/* スキャンライン効果 */}
        <div className="absolute left-0 top-0 h-[1px] w-full animate-scanline bg-neonGreen opacity-50 shadow-[0_0_5px_#00FF7F] hidden sm:block"></div>
    
      </div>
    </div>
  );
};

export default ScanlineEffect;-e 
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
		<div className="w-full h-[80vh] relative overflow-hidden bg-black">
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
import { useMediaQuery } from 'react-responsive'; // 推奨：メディアクエリのためのフック

const SphereTop: React.FC = () => {
	const isMobile = useMediaQuery({ maxWidth: 767 }); // Tailwindのmdブレイクポイントに合わせる

	const backgroundImage = {
		desktop: `${process.env.NEXT_PUBLIC_CLOUDFRONT_URL}/pepe/cyberpunk-cityscape.webp`,
		mobile: `${process.env.NEXT_PUBLIC_CLOUDFRONT_URL}/pepe/cyberpunk-cityscape.webp`
	};

	return (
		<div className="w-full relative h-[300vh] md:h-[500vh] hidden sm:block">
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
					backgroundImage={isMobile ? backgroundImage.mobile : backgroundImage.desktop}
					useDefaultEnvironment={false}
					isMobile={isMobile}
				/>
			</div>

			{/* テキスト・UIオーバーレイ */}
			<div className="sticky top-0 h-screen w-full pointer-events-none">
				<MessageOverlay />
			</div>
		</div>
	);
};

export default SphereTop;-e 
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
				<div className="absolute top-0 left-0 mt-8 ml-8 w-full text-left">
					{/* Typewriter Intro */}
					<motion.div
						initial={{ width: 0 }}
						animate={{ width: '100%' }}
						transition={{ duration: 2, ease: 'easeInOut' }}
					>
						<div className="overflow-hidden whitespace-nowrap border-r-2 border-neonGreen font-mono text-neonGreen text-sm mb-6">
						  &gt; selfcustody.exe
						</div>
					</motion.div>
					<KeyLine
						text={`Awaken\nYour soul.`}
						colorClass="text-neonGreen font-heading text-[14vw] font-extrabold"
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
	const { scrollYProgress } = useScroll({ target: ref as React.RefObject<HTMLElement>, offset: ['start end', 'end end'] });
	const opacity = useTransform(scrollYProgress, [0, 0.2], [0, 1]);
	const y = useTransform(scrollYProgress, [0, 0.2], [20, 0]);

	return (
		<motion.div
			ref={ref}
			style={{ opacity, y }}
		>
			<span className={`${colorClass} glitchRainbow whitespace-pre-line leading-none`}>
				{text}
			</span>
		</motion.div>
	);
};

export default SelfCustodySection;
-e 
### FILE: ./src/app/components/sphere/Sphere.tsx

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
			groupRef.current.rotation.y += 0.2 * delta;
		} else {
			// 外部から渡された回転値を適用
			groupRef.current.rotation.y += 0.2 * delta;
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
			<sphereGeometry args={[isMobile ? 1.6 : 2, isMobile ? 32 : 64, isMobile ? 32 : 64]} />
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
					className="w-full h-full"
					gl={{ antialias: false }}
					dpr={1}
					shadows={false}
					frameloop="always"
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

export default Sphere;-e 
### FILE: ./src/app/components/ui/Footer.tsx

'use client';

import Link from 'next/link';

const Footer = () => {
	const currentYear = new Date().getFullYear();

	const productLinks = [
		{ href: '/products/whey-protein', label: 'Whey Protein' },
		{ href: '/products/bcaa', label: 'BCAA' },
		{ href: '/products/pre-workout', label: 'Pre-Workout' },
		{ href: '/products/creatine', label: 'Creatine' },
	];

	const companyLinks = [
		{ href: '/about', label: 'About Us' },
		{ href: '/how-to-buy', label: 'How to Buy' },
		{ href: '/whitepaper', label: 'White Paper' },
		{ href: '/roadmap', label: 'Roadmap' },
	];

	const communityLinks = [
		{ href: '/discord', label: 'Discord' },
		{ href: '/telegram', label: 'Telegram' },
		{ href: '/twitter', label: 'Twitter' },
		{ href: '/medium', label: 'Medium' },
	];

	const legalLinks = [
		{ href: '/privacy', label: 'Privacy Policy' },
		{ href: '/terms', label: 'Terms of Service' },
		{ href: '/cookies', label: 'Cookie Policy' },
	];

	return (
		<footer className="w-full relative bg-black border-t border-dark-300 overflow-hidden z-20">
			{/* Background Effects */}
			<div className="absolute inset-0 bg-gradient-to-t from-dark-100 to-black"></div>

			{/* Animated scanline */}
			<div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-neonGreen to-transparent animate-pulse opacity-50"></div>

			{/* Grid pattern overlay */}
			<div className="absolute inset-0 opacity-5">
				<div className="w-full h-full" style={{
					backgroundImage: `
            linear-gradient(rgba(0, 255, 127, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 255, 127, 0.1) 1px, transparent 1px)
          `,
					backgroundSize: '50px 50px'
				}}></div>
			</div>

			<div className="relative px-4 sm:px-6 lg:px-8 py-12">
				<div className="max-w-7xl mx-auto">
					{/* Main Footer Content */}
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
						{/* Brand Section */}
						<div className="lg:col-span-1">
							<div className="flex items-center space-x-2 mb-6">
								<div className="relative">
									<div className="w-10 h-10 bg-gradient-to-br from-neonGreen to-neonOrange rounded-sm animate-pulse-fast"></div>
									<div className="absolute inset-0 w-10 h-10 bg-gradient-to-br from-neonGreen to-neonOrange rounded-sm blur-md opacity-50"></div>
								</div>
								<span className="text-2xl font-heading font-bold text-white md:animate-glitch-slow">
									We are on-chain
								</span>
							</div>

							<p className="text-gray-400 text-sm leading-relaxed mb-6">
								The first Web3-native protein brand. Premium supplements powered by blockchain technology and community governance.
							</p>


							{/* Connect Wallet */}
							<button className="w-full px-6 py-3 bg-gradient-to-r from-neonGreen to-neonOrange text-black font-semibold rounded-sm transition-all duration-200 hover:shadow-lg hover:shadow-neonGreen/25 group">
								<span className="relative z-10 text-sm">Login</span>
							</button>
						</div>

						{/* Products */}
						<div>
							<h3 className="text-white font-heading font-semibold mb-4 relative">
								Products
								<div className="absolute bottom-0 left-0 w-8 h-px bg-gradient-to-r from-neonGreen to-transparent"></div>
							</h3>
							<ul className="space-y-3">
								{productLinks.map((link, index) => (
									<li key={link.href}>
										<Link
											href={link.href}
											className="text-gray-400 hover:text-neonGreen transition-colors duration-200 text-sm block relative group"
											style={{ animationDelay: `${index * 50}ms` }}
										>
											<span className="relative z-10">{link.label}</span>
											<div className="absolute left-0 bottom-0 w-0 h-px bg-neonGreen group-hover:w-full transition-all duration-200"></div>
										</Link>
									</li>
								))}
							</ul>
						</div>
						
						<div>
							<h3 className="text-white font-heading font-semibold mb-4 relative">
								Company
								<div className="absolute bottom-0 left-0 w-8 h-px bg-gradient-to-r from-neonOrange to-transparent"></div>
							</h3>
							<ul className="space-y-3">
								{companyLinks.map((link, index) => (
									<li key={link.href}>
										<Link
											href={link.href}
											className="text-gray-400 hover:text-neonGreen transition-colors duration-200 text-sm block relative group"
											style={{ animationDelay: `${index * 50}ms` }}
										>
											<span className="relative z-10">{link.label}</span>
											<div className="absolute left-0 bottom-0 w-0 h-px bg-neonGreen group-hover:w-full transition-all duration-200"></div>
										</Link>
									</li>
								))}
							</ul>
						</div>

						{/* Community */}
						<div>
							<h3 className="text-white font-heading font-semibold mb-4 relative">
								Community
								<div className="absolute bottom-0 left-0 w-8 h-px bg-gradient-to-r from-neonGreen to-neonOrange"></div>
							</h3>
							<ul className="space-y-3">
								{communityLinks.map((link, index) => (
									<li key={link.href}>
										<Link
											href={link.href}
											className="text-gray-400 hover:text-neonGreen transition-colors duration-200 text-sm block relative group"
											style={{ animationDelay: `${index * 50}ms` }}
										>
											<span className="relative z-10">{link.label}</span>
											<div className="absolute left-0 bottom-0 w-0 h-px bg-neonGreen group-hover:w-full transition-all duration-200"></div>
										</Link>
									</li>
								))}
							</ul>
						</div>
					</div>

					{/* Divider */}
					<div className="relative mb-8">
						<div className="absolute inset-0 flex items-center">
							<div className="w-full border-t border-dark-300"></div>
						</div>
						<div className="relative flex justify-center">
							<div className="bg-black px-4">
								<div className="w-2 h-2 bg-neonGreen rounded-full animate-pulse"></div>
							</div>
						</div>
					</div>

			
					<div className="flex flex-col lg:flex-row justify-between items-center space-y-4 lg:space-y-0">
						{/* Legal Links */}
						<div className="flex flex-wrap items-center space-x-6">
							{legalLinks.map((link, index) => (
								<Link
									key={link.href}
									href={link.href}
									className="text-gray-500 hover:text-gray-300 transition-colors duration-200 text-xs"
									style={{ animationDelay: `${index * 25}ms` }}
								>
									{link.label}
								</Link>
							))}
						</div>

						{/* Copyright */}
						<div className="text-center lg:text-right">
							<p className="text-gray-500 text-xs">
								© {currentYear} We are on-chain. All rights reserved.
							</p>
							<p className="text-gray-600 text-xs mt-1">
								Powered by Web3 • Built on Blockchain
							</p>
						</div>
					</div>

					{/* Glitch Effect */}
					<div className="absolute bottom-4 right-4 opacity-20">
						<div className="text-neonGreen font-pixel text-xs md:animate-glitch">
							[BLOCKCHAIN_ENABLED]
						</div>
					</div>
				</div>
			</div>
		</footer>
	);
};

export default Footer;-e 
### FILE: ./src/app/components/ui/Header.tsx

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

const Header = () => {
	const [isVisible, setIsVisible] = useState(true);
	const [lastScrollY, setLastScrollY] = useState(0);
	const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

	useEffect(() => {
		const handleScroll = () => {
			const currentScrollY = window.scrollY;

			if (currentScrollY < lastScrollY || currentScrollY < 100) {
				setIsVisible(true);
			} else if (currentScrollY > lastScrollY && currentScrollY > 100) {
				setIsVisible(false);
			}

			setLastScrollY(currentScrollY);
		};

		window.addEventListener('scroll', handleScroll, { passive: true });
		return () => window.removeEventListener('scroll', handleScroll);
	}, [lastScrollY]);

	const navLinks = [
		{ href: '/shop', label: 'Shop', isHome: true },
		{ href: '/how-to-buy', label: 'How to Buy' },
		{ href: '/whitepaper', label: 'White Paper' },
	];

	return (
		<header
			className={`fixed top-0 left-0 right-0 z-50 transition-transform duration-300 ease-out ${isVisible ? 'translate-y-0' : '-translate-y-full'
				}`}
		>
			{/* Background with blur effect */}
			<div className="absolute inset-0 bg-black/90 backdrop-blur-md border-b border-dark-300"></div>

			{/* Scanline effect */}
			<div className="absolute inset-0 overflow-hidden pointer-events-none">
				<div className="absolute w-full h-px bg-gradient-to-r from-transparent via-neonGreen to-transparent animate-scanline opacity-30"></div>
			</div>

			<nav className="relative px-4 sm:px-6 lg:px-8">
				<div className="flex items-center justify-between h-16 max-w-7xl mx-auto">
					{/* Logo/Brand */}
					<Link href="/" className="flex items-center space-x-2 group">
						<div className="relative">
							<div className="w-8 h-8 bg-gradient-to-br from-neonGreen to-neonOrange rounded-sm animate-pulse-fast"></div>
							<div className="absolute inset-0 w-8 h-8 bg-gradient-to-br from-neonGreen to-neonOrange rounded-sm blur-sm opacity-50"></div>
						</div>
						<span className="text-xl font-heading font-bold text-white group-hover:text-neonGreen transition-colors duration-200 md:animate-glitch-slow">
							We are on-chain
						</span>
					</Link>

					{/* Desktop Navigation */}
					<div className="hidden md:flex items-center space-x-8">
						{navLinks.map((link, index) => (
							<Link
								key={link.href}
								href={link.href}
								className={`relative px-4 py-2 text-sm font-medium transition-all duration-200 group ${link.isHome
										? 'text-neonGreen'
										: 'text-gray-300 hover:text-white'
									}`}
								style={{ animationDelay: `${index * 100}ms` }}
							>
								<span className="relative z-10">{link.label}</span>

								{/* Hover effect */}
								<div className="absolute inset-0 bg-gradient-to-r from-neonGreen/20 to-neonOrange/20 rounded-sm transform scale-0 group-hover:scale-100 transition-transform duration-200"></div>

								{/* Border animation */}
								<div className="absolute bottom-0 left-0 w-0 h-px bg-gradient-to-r from-neonGreen to-neonOrange group-hover:w-full transition-all duration-300"></div>

								{/* Glitch effect for active link */}
								{link.isHome && (
									<div className="absolute inset-0 bg-neonGreen/10 rounded-sm animate-glitch opacity-30"></div>
								)}
							</Link>
						))}

						{/* Connect Wallet Button */}
						<button className="relative px-6 py-2 bg-gradient-to-r from-neonGreen to-neonOrange text-black font-semibold rounded-sm overflow-hidden group transition-all duration-200 hover:shadow-lg hover:shadow-neonGreen/25">
							<span className="relative z-10 text-sm">Login</span>
							<div className="absolute inset-0 bg-gradient-to-r from-neonOrange to-neonGreen transform scale-x-0 group-hover:scale-x-100 transition-transform duration-200 origin-left"></div>
							<div className="absolute inset-0 animate-pulse bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
						</button>
					</div>

					{/* Mobile menu button */}
					<button
						onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
						className="md:hidden relative w-10 h-10 flex flex-col items-center justify-center space-y-1 group"
						aria-label="Toggle mobile menu"
					>
						<span className={`w-6 h-0.5 bg-white transition-all duration-200 ${isMobileMenuOpen ? 'rotate-45 translate-y-1.5' : ''}`}></span>
						<span className={`w-6 h-0.5 bg-white transition-all duration-200 ${isMobileMenuOpen ? 'opacity-0' : ''}`}></span>
						<span className={`w-6 h-0.5 bg-white transition-all duration-200 ${isMobileMenuOpen ? '-rotate-45 -translate-y-1.5' : ''}`}></span>
					</button>
				</div>

				{/* Mobile Navigation */}
				<div className={`md:hidden transition-all duration-300 ease-out overflow-hidden ${isMobileMenuOpen ? 'max-h-64 opacity-100' : 'max-h-0 opacity-0'
					}`}>
					<div className="px-4 py-4 space-y-3 border-t border-dark-300 bg-black/50">
						{navLinks.map((link, index) => (
							<Link
								key={link.href}
								href={link.href}
								className={`block px-4 py-3 text-base font-medium transition-all duration-200 rounded-sm ${link.isHome
										? 'text-neonGreen bg-neonGreen/10 border border-neonGreen/20'
										: 'text-gray-300 hover:text-white hover:bg-dark-200'
									}`}
								onClick={() => setIsMobileMenuOpen(false)}
								style={{ animationDelay: `${index * 50}ms` }}
							>
								{link.label}
							</Link>
						))}

						<button
							className="w-full mt-4 px-6 py-3 bg-gradient-to-r from-neonGreen to-neonOrange text-black font-semibold rounded-sm transition-all duration-200 hover:shadow-lg hover:shadow-neonGreen/25"
							onClick={() => setIsMobileMenuOpen(false)}
						>
							Login
						</button>
					</div>
				</div>
			</nav>
		</header>
	);
};

export default Header;-e 
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
					text="NO BANKS"
					className="text-6xl md:text-7xl lg:text-9xl"
					color="text-neonOrange"
					glitchIntensity="high"
					isMainTitle={true}
				/>
				<GlitchText
					text="PEER-TO-PEER"
					className="text-6xl md:text-7xl lg:text-9xl"
					color="text-neonGreen"
					glitchIntensity="medium"
					isMainTitle={true}
				/>
				<GlitchText
					text="JUST PROTEIN"
					className="text-6xl md:text-7xl lg:text-9xl"
					color="text-white"
					glitchIntensity="high"
					isMainTitle={true}
				/>
			</div>
			<p className="mt-6 text-sm md:text-lg text-white">
				Only non-custodial wallets accepted.<br />
				Built for the chain. Priced for the degens.
			</p>
		</div>
	);
};

export default HeroTitle;-e 
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
					backgroundImage: `url('${process.env.NEXT_PUBLIC_CLOUDFRONT_URL}/pepe/pepe-cyberpunk.webp')`,
					...(!glitchState.active
						? {
							filter: 'contrast(1.1) brightness(0.9)',
							transform: backgroundTransform,
							transition: 'transform 2s ease-out',
						}
						: getGlitchStyle(backgroundTransform))
				}}
			/>

			{/* ライトとオーバーレイは常時レンダリング */}
			<div
				className={`${styles.darkOverlay} w-full`}
				style={{
					transform: `scale(1.02) ${midLayerTransform}`,
					transition: 'transform 1.5s ease-out',
				}}
			/>

			{/* 重いエフェクト: モバイルでは非表示 */}
			<div className="hidden sm:block">
				<div
					className={styles.centerLight}
					style={{
						transform: midLayerTransform,
						transition: 'transform 1.5s ease-out',
					}}
				/>
				{/* メインノイズ */}
				<div className={`${styles.mainNoise} ${glitchState.active ? styles.noiseIntense : ''
					}`} />

				{/* 格子状ノイズ */}
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

				{/* RGB分離効果 */}
				<div className={`${styles.rgbSplit} ${glitchState.active && glitchState.type.includes('rgb') ? styles.rgbActive : ''
					}`} />

				{/* グリッチブロックエフェクト */}
				{glitchState.active && glitchState.intensity > 2 && (
					<div
						className={styles.glitchBlocks}
						style={{
							backgroundImage: `url('${process.env.NEXT_PUBLIC_CLOUDFRONT_URL}/pepe/pepe-cyberpunk.webp')`,
							opacity: 0.4 + glitchState.intensity * 0.05,
						}}
					/>
				)}

				{/* RGBスライス効果 */}
				{glitchState.active && glitchState.type.includes('rgb') && glitchState.intensity > 2 && (
					<>
						<div
							className={styles.rgbSliceRed}
							style={{
								backgroundImage: `url('${process.env.NEXT_PUBLIC_CLOUDFRONT_URL}/pepe/pepe-cyberpunk.webp')`,
								transform: `translateX(${glitchState.intensity * 1.5}px)`,
							}}
						/>
						<div
							className={styles.rgbSliceBlue}
							style={{
								backgroundImage: `url('${process.env.NEXT_PUBLIC_CLOUDFRONT_URL}/pepe/pepe-cyberpunk.webp')`,
								transform: `translateX(-${glitchState.intensity * 1.5}px)`,
							}}
						/>
					</>
				)}
			</div>
		</>
	);
};

export default HeroBackground;
-e 
### FILE: ./src/app/components/hero-section/HeroSection.tsx

'use client';
import React, { useState, useEffect } from 'react';
import styles from './HeroSection.module.css';
import { useGlitchEffect } from './GlitchEffects';
import HeroBackground from './HeroBackground';
import HeroTitle from './HeroTitle';

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
		<div className="sticky w-full top-0 h-[80vh] md:h-[90vh] overflow-hidden">
			<HeroBackground
				backgroundTransform={backgroundTransform}
				midLayerTransform={midLayerTransform}
				glitchState={glitchState}
				getGlitchStyle={getGlitchStyle}
			/>
			<div
				className={`${styles.contentContainer} mt-10 max-w-screen-xl mx-auto flex justify-center items-center`}
				style={{
					transform: foregroundTransform,
					transition: 'transform 0.5s ease-out',
				}}
			>
				<HeroTitle />
			</div>
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
import * as THREE from 'three'

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
			{/* @ts-expect-error React Three Fiber JSX elements */}
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
				{/* @ts-expect-error React Three Fiber JSX elements */}
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
      transparent
      opacity={1}
      toneMapped={false}
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
  L: 3
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
### FILE: ./src/app/components/pepePush/types/index.ts

// types/index.ts
export interface ControlPoint {
  scrollProgress: number; // 0-1の範囲
  position: [number, number, number]; // x, y, z座標
  rotation?: [number, number, number]; // オプショナルな回転
  scale?: [number, number, number]; // オプショナルなスケール
}

export interface ScrollState {
  scrollProgress: number; // 0-1の範囲でのスクロール進行度
  isInSection: boolean; // セッション内にいるかどうか
}

export interface ModelTransform {
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
}

export interface PepePushProps {
  className?: string;
}

export interface StickyCanvasProps {
  children: React.ReactNode;
  className?: string;
}-e 
### FILE: ./src/app/components/pepePush/config/controlPoints.ts

// config/controlPoints.ts
import { ControlPoint } from '../types';

// スマホ判定のヘルパー関数
const isMobile = () => {
	if (typeof window === 'undefined') return false;
	return window.innerWidth <= 768;
};

export const controlPoints: ControlPoint[] = [
	{
		scrollProgress: 0,
		position: [0, -1, 0],
		rotation: [Math.PI / 4, -Math.PI / 12, 0],
		scale: [1, 1, 1]
	},
	{
		scrollProgress: 0.25,
		position: [0, 0, 0],
		rotation: [0, 0, 0],
		scale: [1.2, 1.2, 1.2]
	},
	{
		scrollProgress: 0.5,
		position: [2, 1, -1],
		rotation: [0, Math.PI / 3, 0],
		scale: [1, 1, 1]
	},
	{
		scrollProgress: 0.75,
		position: [0, -1, 2],
		rotation: [0, Math.PI, 0],
		scale: [0.8, 0.8, 0.8]
	},
	{
		scrollProgress: 1,
		position: [0, -2, 0],
		rotation: [0, -Math.PI / 2, 0],
		scale: isMobile() ? [0.6, 0.6, 0.6] : [1, 1, 1] // スマホでは小さく
	}
];

// レスポンシブ対応の制御点を取得する関数
export const getResponsiveControlPoints = (): ControlPoint[] => {
	const mobile = isMobile();

	return [
		{
			scrollProgress: 0,
			position: [0, -1, 0],
			rotation: [Math.PI / 4, -Math.PI / 12, 0],
			scale: [1, 1, 1]
		},
		{
			scrollProgress: 0.25,
			position: [0, 0, 0],
			rotation: [0, 0, 0],
			scale: [1.2, 1.2, 1.2]
		},
		{
			scrollProgress: 0.5,
			position: [2, 1, -1],
			rotation: [0, Math.PI / 3, 0],
			scale: [1, 1, 1]
		},
		{
			scrollProgress: 0.75,
			position: [0, -1, 2],
			rotation: [0, Math.PI, 0],
			scale: [0.8, 0.8, 0.8]
		},
		{
			scrollProgress: 1,
			position: [0, -2, 0],
			rotation: [0, -Math.PI / 2, 0],
			scale: mobile ? [0.6, 0.6, 0.6] : [1, 1, 1] // スマホでは60%のサイズ
		}
	];
};

// 設定値の調整用ヘルパー
export const CONFIG = {
	// セッションの高さ（vh）
	SECTION_HEIGHT_VH: 600,

	// アニメーション補間の滑らかさ
	LERP_FACTOR: 0.1,

	// デバッグモード（開発時にスクロール位置を表示）
	DEBUG_MODE: false,

	// レスポンシブ設定
	MOBILE_BREAKPOINT: 768,
	MOBILE_SCALE_FACTOR: 0.6 // スマホでの最終スケール
} as const;-e 
### FILE: ./src/app/components/pepePush/config/animations.ts

// config/animations.ts

export const ANIMATION_CONFIG = {
	// 基本アニメーション設定
	PRIMARY_ANIMATION: 'PushUp',
	ARMATURE_FADE_IN_DURATION: 0.3,

	// アニメーション速度調整
	ANIMATION_SPEED: {
		PUSH_UP: 1.0,
		IDLE: 0.8,
		TRANSITION: 1.2
	},

	// ループ設定
	LOOP_SETTINGS: {
		PUSH_UP: {
			enabled: true,
			count: Infinity // 無限ループ
		}
	},

	// スクロール位置に応じたアニメーション変更（将来の拡張用）
	SCROLL_BASED_ANIMATIONS: {
		0: { animation: 'PushUp', speed: 0.5 },
		0.25: { animation: 'PushUp', speed: 1.0 },
		0.5: { animation: 'PushUp', speed: 1.5 },
		0.75: { animation: 'PushUp', speed: 1.2 },
		1: { animation: 'PushUp', speed: 0.8 }
	},

	// パフォーマンス設定
	PERFORMANCE: {
		// フレームレート制限（必要に応じて）
		MAX_FPS: 60,

		// LOD設定（距離に応じた詳細度）
		LOD_DISTANCES: [10, 50, 100],

		// アニメーション品質
		ANIMATION_QUALITY: {
			HIGH: { timeScale: 1.0, precision: 'high' },
			MEDIUM: { timeScale: 0.8, precision: 'medium' },
			LOW: { timeScale: 0.5, precision: 'low' }
		}
	}
} as const;

// アニメーション状態の型定義
export type AnimationState = {
	currentAnimation: string;
	speed: number;
	isPlaying: boolean;
	loopCount: number;
};

// アニメーション制御のヘルパー関数
export const getAnimationForScrollProgress = (progress: number) => {
	const scrollAnimations = ANIMATION_CONFIG.SCROLL_BASED_ANIMATIONS;
	const keys = Object.keys(scrollAnimations).map(Number).sort((a, b) => a - b);

	let targetKey = keys[0];
	for (const key of keys) {
		if (progress >= key) {
			targetKey = key;
		} else {
			break;
		}
	}

	return scrollAnimations[targetKey as keyof typeof scrollAnimations];
};-e 
### FILE: ./src/app/components/pepePush/StickyCanvas.tsx

// StickyCanvas.tsx
'use client';

import React from 'react';
import { Canvas } from '@react-three/fiber';
import { StickyCanvasProps } from './types';

export default function StickyCanvas({ children, className = '' }: StickyCanvasProps) {
	return (
		<div className={`sticky top-0 w-full h-screen z-10 ${className}`}>
			<Canvas
				className="w-full h-full"
				gl={{ antialias: false }}
				shadows={false}
				frameloop="always"
				camera={{
					position: [0, 0, 5],
					fov: 75,
					near: 0.1,
					far: 1000
				}}
				dpr={1}
			>
				{/* @ts-expect-error React Three Fiber JSX elements */}
				<ambientLight intensity={0.3} />
				{/* @ts-expect-error React Three Fiber JSX elements */}
				<directionalLight
					position={[5, 10, 7]}
					intensity={1}
					castShadow={false}
				/>

				{/* 子コンポーネント（3Dモデルなど）を描画 */}
				{children}
			</Canvas>
		</div>
	);
}-e 
### FILE: ./src/app/components/pepePush/hooks/useScrollProgress.ts

// hooks/useScrollProgress.ts
'use client';

import React,{ useState, useEffect, useRef, useCallback } from 'react';
import { ScrollState } from '../types';
import { CONFIG } from '../config/controlPoints';

export function useScrollProgress() {
  const [scrollState, setScrollState] = useState<ScrollState>({
    scrollProgress: 0,
    isInSection: false
  });
  
  const sectionRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<number>(null);

  const updateScrollProgress = useCallback(() => {
    if (!sectionRef.current) return;

    const rect = sectionRef.current.getBoundingClientRect();
    const windowHeight = window.innerHeight;
    const sectionHeight = rect.height;
    
    // セクションが画面に入っているかチェック
    const isInView = rect.top < windowHeight && rect.bottom > 0;
    
    if (!isInView) {
      setScrollState(prev => ({ ...prev, isInSection: false }));
      return;
    }

    // スクロール進行度を計算（0-1の範囲）
    const scrollTop = -rect.top;
    const maxScroll = sectionHeight - windowHeight;
    const progress = Math.max(0, Math.min(1, scrollTop / maxScroll));

    setScrollState({
      scrollProgress: progress,
      isInSection: true
    });

    if (CONFIG.DEBUG_MODE) {
      console.log('Scroll Progress:', progress.toFixed(3));
    }
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
      
      frameRef.current = requestAnimationFrame(updateScrollProgress);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // 初期化

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [updateScrollProgress]);

  return { scrollState, sectionRef };
}-e 
### FILE: ./src/app/components/pepePush/hooks/useModelPosition.ts

// hooks/useModelPosition.ts
'use client';

import { useMemo } from 'react';
import { ModelTransform } from '../types';
import { getResponsiveControlPoints } from '../config/controlPoints';

export function useModelPosition(scrollProgress: number): ModelTransform {
	return useMemo(() => {
		// レスポンシブ対応の制御点を取得
		const controlPoints = getResponsiveControlPoints();

		// スクロール進行度が0-1の範囲外の場合の処理
		if (scrollProgress <= 0) {
			const firstPoint = controlPoints[0];
			return {
				position: firstPoint.position,
				rotation: firstPoint.rotation || [0, 0, 0],
				scale: firstPoint.scale || [1, 1, 1]
			};
		}

		if (scrollProgress >= 1) {
			const lastPoint = controlPoints[controlPoints.length - 1];
			return {
				position: lastPoint.position,
				rotation: lastPoint.rotation || [0, 0, 0],
				scale: lastPoint.scale || [1, 1, 1]
			};
		}

		// 現在のスクロール位置に対応する制御点のペアを見つける
		let fromIndex = 0;
		let toIndex = 1;

		for (let i = 0; i < controlPoints.length - 1; i++) {
			if (scrollProgress >= controlPoints[i].scrollProgress &&
				scrollProgress <= controlPoints[i + 1].scrollProgress) {
				fromIndex = i;
				toIndex = i + 1;
				break;
			}
		}

		const fromPoint = controlPoints[fromIndex];
		const toPoint = controlPoints[toIndex];

		// 2つの制御点間での進行度を計算
		const segmentProgress = (scrollProgress - fromPoint.scrollProgress) /
			(toPoint.scrollProgress - fromPoint.scrollProgress);

		// 線形補間
		const lerp = (start: number, end: number, factor: number) =>
			start + (end - start) * factor;

		const lerpArray = (start: number[], end: number[], factor: number): [number, number, number] => [
			lerp(start[0], end[0], factor),
			lerp(start[1], end[1], factor),
			lerp(start[2], end[2], factor)
		];

		return {
			position: lerpArray(
				fromPoint.position,
				toPoint.position,
				segmentProgress
			),
			rotation: lerpArray(
				fromPoint.rotation || [0, 0, 0],
				toPoint.rotation || [0, 0, 0],
				segmentProgress
			),
			scale: lerpArray(
				fromPoint.scale || [1, 1, 1],
				toPoint.scale || [1, 1, 1],
				segmentProgress
			)
		};
	}, [scrollProgress]);
}-e 
### FILE: ./src/app/components/pepePush/PepeModel3D.tsx

// PepeModel3D.tsx
'use client';

import React, { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF, useAnimations } from '@react-three/drei';
import * as THREE from 'three';
import { ModelTransform } from './types';
import { CONFIG } from './config/controlPoints';

interface PepeModel3DProps {
	transform: ModelTransform;
	url?: string;
}

export default function PepeModel3D({
	transform,
	url = '/models/push-up-pepe.glb'
}: PepeModel3DProps) {
	const { scene, animations } = useGLTF(url);
	const { actions, mixer } = useAnimations(animations, scene);
	const groupRef = useRef<THREE.Group>(null);

	// 現在の変換値を保持（スムーズな補間のため）
	const currentTransform = useRef<ModelTransform>({
		position: [0, 0, 0],
		rotation: [0, 0, 0],
		scale: [1, 1, 1]
	});

	// マテリアルとアニメーション初期化
	useEffect(() => {
		// 色管理を有効化
		THREE.ColorManagement.enabled = true;

		// 重ねられた2つのテキストオブジェクトの発光マテリアル設定
		scene.traverse((child) => {
			if (child instanceof THREE.Mesh && child.material) {
				const materials = Array.isArray(child.material) ? child.material : [child.material];

				materials.forEach((material) => {
					if (material instanceof THREE.MeshStandardMaterial) {
						// Text.001 (緑色発光)
						if (child.name === 'Text.001') {
							material.emissive = new THREE.Color(0x00ff00); // 緑色
							material.emissiveIntensity = 3.0;
							material.toneMapped = false; // 重要：色変換を防止
							// 少し前に配置
							child.position.z += 0.01;
							console.log('Applied green emissive to Text.001');
						}

						// Text.004 (オレンジ色発光)
						else if (child.name === 'Text.004') {
							material.emissive = new THREE.Color(0xff4500); // オレンジ色
							material.emissiveIntensity = 3.0;
							material.toneMapped = false; // 重要：色変換を防止
							// 少し後ろに配置
							child.position.z -= 0.01;
							console.log('Applied orange emissive to Text.004');
						}

						// その他のオブジェクトは既存のマテリアル設定を保持
						else if (material.emissive && !material.emissive.equals(new THREE.Color(0x000000))) {
							material.toneMapped = false; // 他の発光オブジェクトも色変換を防止
							if (material.emissiveIntensity === undefined || material.emissiveIntensity === 0) {
								material.emissiveIntensity = 1;
							}
						}
					}
				});
			}
		});

		// 既存のアニメーションを停止
		Object.values(actions).forEach((action) => action?.stop());

		// PushUpアニメーションを再生
		if (actions['PushUp']) {
			actions['PushUp'].reset().play();
		}

		// Armatureアニメーションがあれば再生
		const bodyKey = Object.keys(actions).find((key) =>
			key.includes('Armature')
		);
		if (bodyKey && actions[bodyKey]) {
			actions[bodyKey].reset().fadeIn(0.3).play();
		}
	}, [actions, scene]);

	// フレームごとの更新
	useFrame((_, delta) => {
		// アニメーションミキサーを更新
		mixer.update(delta);

		// スムーズな位置変更（線形補間）
		if (groupRef.current) {
			const group = groupRef.current;
			const lerpFactor = CONFIG.LERP_FACTOR;

			// 位置の補間
			const targetPos = new THREE.Vector3(...transform.position);
			group.position.lerp(targetPos, lerpFactor);

			// 回転の補間
			const targetRot = new THREE.Euler(...transform.rotation);
			group.rotation.x += (targetRot.x - group.rotation.x) * lerpFactor;
			group.rotation.y += (targetRot.y - group.rotation.y) * lerpFactor;
			group.rotation.z += (targetRot.z - group.rotation.z) * lerpFactor;

			// スケールの補間
			const targetScale = new THREE.Vector3(...transform.scale);
			group.scale.lerp(targetScale, lerpFactor);

			// デバッグ情報
			if (CONFIG.DEBUG_MODE) {
				currentTransform.current = {
					position: [group.position.x, group.position.y, group.position.z],
					rotation: [group.rotation.x, group.rotation.y, group.rotation.z],
					scale: [group.scale.x, group.scale.y, group.scale.z]
				};
			}
		}
	});

	// glTFファイルのマテリアルをそのまま適用
	return (
		// @ts-expect-error React Three Fiber JSX elements
		<group ref={groupRef}>
			{/* @ts-expect-error React Three Fiber JSX elements */}
			<primitive object={scene} />
			{/* @ts-expect-error React Three Fiber JSX elements */}
		</group>
	);
}

// モデルのプリロード
useGLTF.preload('/models/push-up-pepe.glb');-e 
### FILE: ./src/app/components/pepePush/PepePush.tsx

// components/PepePush.tsx
// PepePush.tsx
'use client';

import React from 'react';
import ScrollController from './ScrollController';
import { PepePushProps } from './types';

export default function PepePush({ className = '' }: PepePushProps) {
	return (
		<section className={`relative w-full ${className}`}>
			<ScrollController className="bg-black" />
		</section>
	);
}
/*
'use client';

import React, { useEffect, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, useAnimations, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

export default function PepePush() {
	return (
		<Canvas
			className="w-full h-full"
			gl={{ antialias: false }}
			dpr={1}
			shadows={false}
			frameloop="always"
		>
			<ambientLight intensity={0.3} />
			<directionalLight position={[5, 10, 7]} intensity={1} />
			<Suspense fallback={null}>
				<PepeModel url="/models/push-up-pepe.glb" />
			</Suspense>
			<OrbitControls />
		</Canvas>
	);
}

function PepeModel({ url }: { url: string }) {
	const { scene, animations } = useGLTF(url);
	const { actions, mixer } = useAnimations(animations, scene);

	// アニメーション再生
	useEffect(() => {
		Object.values(actions).forEach((a) => a.stop());
		actions['PushUp']?.reset().play();
		const bodyKey = Object.keys(actions).find((k) => k.includes('Armature'));
		if (bodyKey) {
			actions[bodyKey]?.reset().fadeIn(0.3).play();
		}
	}, [actions]);

	// 毎フレーム、ミキサーを更新
	useFrame((_, dt) => {
		mixer.update(dt);
	});

	// glTF に含まれるマテリアルを一切触らずそのまま適用
	return <primitive object={scene} />;
}

// モデルのプリロード
useGLTF.preload('/models/push-up-pepe.glb');
*/
-e 
### FILE: ./src/app/components/pepePush/ScrollController.tsx

// ScrollController.tsx
'use client';

import React, { Suspense } from 'react';
import StickyCanvas from './StickyCanvas';
import PepeModel3D from './PepeModel3D';
import { useScrollProgress } from './hooks/useScrollProgress';
import { useModelPosition } from './hooks/useModelPosition';
import { CONFIG } from './config/controlPoints';

interface ScrollControllerProps {
	className?: string;
}

export default function ScrollController({ className = '' }: ScrollControllerProps) {
	const { scrollState, sectionRef } = useScrollProgress();
	const modelTransform = useModelPosition(scrollState.scrollProgress);

	return (
		<div
			ref={sectionRef}
			className={`relative w-full ${className}`}
			style={{ height: `${CONFIG.SECTION_HEIGHT_VH}vh` }}
		>
			{/* Sticky Canvas */}
			<StickyCanvas>
				<Suspense fallback={null}>
					<PepeModel3D transform={modelTransform} />
				</Suspense>
			</StickyCanvas>

			{/* デバッグ情報表示（開発時のみ） */}
			{CONFIG.DEBUG_MODE && scrollState.isInSection && (
				<div className="fixed top-4 right-4 bg-black/80 text-white p-4 rounded-lg font-mono text-sm z-50">
					<div>Progress: {scrollState.scrollProgress.toFixed(3)}</div>
					<div>Position: [{modelTransform.position.map(v => v.toFixed(2)).join(', ')}]</div>
					<div>Rotation: [{modelTransform.rotation.map(v => v.toFixed(2)).join(', ')}]</div>
					<div>Scale: [{modelTransform.scale.map(v => v.toFixed(2)).join(', ')}]</div>
				</div>
			)}

			{/* スクロール進行を示すインジケーター（オプション） */}
			{scrollState.isInSection && (
				<div className="fixed top-8 left-1/2 transform -translate-x-1/2 z-40">
					<div className="w-64 h-2 bg-white/20 rounded-full overflow-hidden">
						<div
							className="h-full bg-white/80 rounded-full transition-all duration-100"
							style={{ width: `${scrollState.scrollProgress * 100}%` }}
						/>
					</div>
					<div className="text-center text-white/60 text-xs mt-2">
						Training Progress
					</div>
				</div>
			)}
		</div>
	);
}-e 
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
### FILE: ./src/app/components/pepe3d/ScrollMessage.tsx

// ScrollMessage.tsx
'use client';
import React, { useEffect, useRef, useState } from 'react';
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
		text: 'The Deep Green Source — a spring hidden within an ancient forest.',
		top: '20vh',
		left: '10vw',
		width: 'auto',
		fontSize: '2rem',
		glitchEffect: 'rgb',
		keywords: ['Deep Green Source', 'legendary spring'],
	},
	{
		id: 'trigger-2',
		text: 'The Green Source — rich, deep and sweet.',
		top: '30vh',
		left: '30vw',
		width: 'auto',
		fontSize: '2rem',
		glitchEffect: 'rgb',
		keywords: ['green source'],
	},
	{
		id: 'trigger-3',
		text: 'It fuels your drive for what’s next.',
		top: '40vh',
		left: '10vw',
		width: 'auto',
		fontSize: '2rem',
		glitchEffect: 'rgb',
		keywords: ['pulse', 'blasting away fatigue'],
	},
	{
		id: 'trigger-4',
		text: 'Feel the green power — right in your hands.',
		top: '60vh',
		left: '30vw',
		width: 'auto',
		fontSize: '2rem',
		glitchEffect: 'slice',
		keywords: ['green power', 'transcends dimensions'],
	},
];

const ScrollTriggerMessages: React.FC = () => {
	const refs = useRef<(HTMLDivElement | null)[]>([]);
	const [activeIndex, setActiveIndex] = useState<number | null>(null);
	const [scrollProgress, setScrollProgress] = useState<number>(0);
	const [randomTrigger, setRandomTrigger] = useState<boolean>(false);
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
		// IntersectionObserverのオプションを調整
		const observer = new IntersectionObserver(
			(entries) => {
				let found = false;
				entries.forEach((entry) => {
					const idx = refs.current.findIndex((r) => r === entry.target);
					// 閾値を下げて、要素が少しでも見えたら検出するように
					if (entry.isIntersecting) {
						setActiveIndex(idx);
						found = true;
					}
				});
				if (!found) setActiveIndex(null);
			},
			{
				root: null,
				// rootMarginを調整してセクション開始時（上部が見えるとき）から検出
				rootMargin: '100px 0px',
				// thresholdを下げて少しでも見えたら反応するように
				threshold: 0.01
			}
		);

		refs.current.forEach((r) => r && observer.observe(r));

		// スクロールイベントリスナー追加
		const handleScroll = () => {
			const scrollTop = window.scrollY;
			const docHeight = document.documentElement.scrollHeight;
			const winHeight = window.innerHeight;

			// FloatingImagesFixSection の位置を取得
			const section = document.querySelector('.floating-images-fix-section');
			if (section) {
				const rect = section.getBoundingClientRect();
				const sectionTop = rect.top + scrollTop;
				const sectionHeight = rect.height;

				// セクション内のスクロール位置（0-1）を計算
				let progress = 0;

				// セクションが画面に入ったらカウント開始（オフセット調整）
				if (scrollTop < sectionTop - winHeight) {
					// セクションがまだ画面下方向に見えていない
					progress = 0;
				} else if (scrollTop > sectionTop + sectionHeight) {
					// セクションを通り過ぎた
					progress = 1;
				} else {
					// セクション内または接近中
					// 開始位置を少し手前（viewport height分）にオフセット
					progress = (scrollTop - (sectionTop - winHeight)) / (sectionHeight + winHeight);
				}

				setScrollProgress(progress);
			} else {
				// セクションが見つからない場合は通常通り計算
				const scrollPercent = scrollTop / (docHeight - winHeight);
				setScrollProgress(scrollPercent);
			}

			// ランダムなグリッチをトリガー
			if (Math.random() < 0.01) {
				setRandomTrigger(true);
				setTimeout(() => setRandomTrigger(false), 150);
			}
		};

		window.addEventListener('scroll', handleScroll);
		// 初期化時に一度実行
		handleScroll();

		return () => {
			refs.current.forEach((r) => r && observer.unobserve(r));
			window.removeEventListener('scroll', handleScroll);
		};
	}, []);

	return (
		<>
			{/* トリガー用ダミーゾーン */}
			{messages.map((_, i) => (
				<div
					key={`zone-${i}`}
					ref={(el) => {
						if (el) {
							refs.current[i] = el;
						}
					}}
					className="h-[100vh] w-full"
				/>
			))}


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
							whitespace-pre-wrap
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
		<div className="w-full relative h-full">
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
	const { scene, animations } = useGLTF(`${process.env.NEXT_PUBLIC_CLOUDFRONT_URL}/pepe/pepe.glb`);

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
			//@ts-expect-error React Three Fiber JSX elements
			<mesh>
				{/* @ts-expect-error React Three Fiber JSX elements */}
				<boxGeometry args={[1, 1, 1]} />
				{/* @ts-expect-error React Three Fiber JSX elements */}
				<meshStandardMaterial color="lime" wireframe />
				{/* @ts-expect-error React Three Fiber JSX elements */}
			</mesh>
		);
	}

	// GLTFモデル表示
	return (
		//@ts-expect-error React Three Fiber JSX elements
		<group
			ref={groupRef}
			scale={[modelScale, modelScale, modelScale]} // 固定スケール
			position={[modelPosition[0], modelPosition[1], modelPosition[2]]}
			rotation={[0, 0, 0]} // 正面向きの初期回転
		>
			{/* @ts-expect-error React Three Fiber JSX elements */}
			<primitive object={scene.clone()} />
			{/* @ts-expect-error React Three Fiber JSX elements */}
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
					<Canvas
						className="w-full h-full"
						gl={{ antialias: false }}
						dpr={1}
						shadows={false}
						frameloop="demand"
					>

						{/* @ts-expect-error React Three Fiber JSX elements */}
						<ambientLight intensity={0.8} />
						{/* @ts-expect-error React Three Fiber JSX elements */}
						<directionalLight position={[5, 5, 5]} intensity={1.0} castShadow />
						{/* @ts-expect-error React Three Fiber JSX elements */}
						<spotLight position={[-5, 8, -5]} angle={0.15} penumbra={1} intensity={1.5} castShadow />
						{/* @ts-expect-error React Three Fiber JSX elements */}
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
useGLTF.preload(`${process.env.NEXT_PUBLIC_CLOUDFRONT_URL}/pepe/pepe.glb`);-e 
### FILE: ./src/app/components/glowing-3d-text/PepeFlavorModel.tsx

'use client';
import { useRef, useEffect, useState } from 'react';
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
	const { scene, nodes, materials } = useGLTF(`${process.env.NEXT_PUBLIC_CLOUDFRONT_URL}/pepe/pepe_flavor.glb`);
	const modelRef = useRef<THREE.Group>(null);

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
		// @ts-expect-error React Three Fiber JSX elements
		<primitive
			ref={modelRef}
			object={scene}
			scale={0.9}
			position={[0, 0, 0]}
			rotation={[0, 0, 0]}
		/>
	);
};

// モデルの事前ロード
useGLTF.preload(`${process.env.NEXT_PUBLIC_CLOUDFRONT_URL}/pepe/pepe_flavor.glb`);

export default PepeFlavorModel;-e 
### FILE: ./src/app/components/glowing-3d-text/GlowingTextScene.tsx

import { Canvas } from '@react-three/fiber';
import { Suspense } from 'react';
import { MotionValue } from 'framer-motion';
import { PerspectiveCamera } from '@react-three/drei';
import PepeFlavorModel from './PepeFlavorModel';

interface GlowingTextSceneProps {
	scrollProgress: MotionValue<number>;
}

const GlowingTextScene: React.FC<GlowingTextSceneProps> = ({
	scrollProgress
}) => {
	return (
		<Canvas
			className="w-full h-full"
			gl={{ antialias: false }}
			dpr={1}
			shadows={false}
			frameloop="always"
		>
			<PerspectiveCamera makeDefault position={[0, 0, 5]} fov={20} />
			<Suspense fallback={null}>
				<PepeFlavorModel scrollProgress={scrollProgress} />
			</Suspense>
		</Canvas>
	);
};

export default GlowingTextScene;-e 
### FILE: ./src/app/components/glowing-3d-text/HeroModel.tsx

// src/app/components/hero-section/HeroModel.tsx
import React from 'react';
import ProteinModel from './ProteinModel';

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
			scale={scale}
		/>
	);
};

export default HeroModel;-e 
### FILE: ./src/app/components/glowing-3d-text/ProteinModel.tsx

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
-e 
### FILE: ./src/app/components/glowing-3d-text/GlowingTextSection.tsx

"use client";
import { useRef } from 'react';
import { useScroll } from 'framer-motion';
import GlowingTextScene from './GlowingTextScene';
import { motion } from 'framer-motion';
import HeroModel from './HeroModel';
const GlowingTextSection = () => {
	const sectionRef = useRef<HTMLDivElement>(null);

	// スクロール位置の検出
	const { scrollYProgress } = useScroll({
		target: sectionRef as React.RefObject<HTMLElement>,
		offset: ["start end", "end start"]
	});

	return (
		<section
			ref={sectionRef}
			className="relative w-full overflow-hidden bg-black flex flex-col items-center justify-center"
		>
			<motion.div
				initial={{ opacity: 0, y: -10 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ delay: 0.5, duration: 0.8, repeat: Infinity, repeatType: "reverse" }}
			>
				<div className="text-xl text-center mb-2 mt-5">↓</div>
				<div className="text-sm font-mono">SCROLL DOWN</div>
			</motion.div>


			<div className="flex w-full justify-center mt-40">
				<div className="relative w-full h-[110px] md:w-[800px] md:h-[150px] lg:w-[1200px] lg:h-[200px] pointer-events-auto">
					<GlowingTextScene scrollProgress={scrollYProgress} />
				</div>
			</div>
			<div className="flex w-full justify-center">
				<div className="w-[300px] h-[400px] md:w-[400px] md:h-[500px] lg:w-[500px] lg:h-[600px] pointer-events-auto">
					<HeroModel scale={1.2} />
				</div>
			</div>
			<p className="text-center w-full text-white">
				Not just protein. It’s a story of courage and humor - encrypted in every scoop.
			</p>
			<div className="text-xs mt-8 w-full max-w-sm px-4">
				<table className="w-full table-auto border-collapse border border-white text-white">
					<tbody>
						<tr>
							<td className="border border-white px-2 py-1 text-center">Nutritional Profile</td>
							<td className="border border-white px-2 py-1 text-left"> per 50g</td>
						</tr>
						<tr>
							<td className="border border-white px-2 py-1 text-center">Protein</td>
							<td className="border border-white px-2 py-1 text-left">25 g</td>
						</tr>
						<tr>
							<td className="border border-white px-2 py-1 text-center">Fat</td>
							<td className="border border-white px-2 py-1 text-left">1.5 g</td>
						</tr>
						<tr>
							<td className="border border-white px-2 py-1 text-center">Carbs</td>
							<td className="border border-white px-2 py-1 text-left">2 g</td>
						</tr>
						<tr>
							<td className="border border-white px-2 py-1 text-center">Minerals</td>
							<td className="border border-white px-2 py-1 text-left">1 g</td>
						</tr>
						<tr>
							<td className="border border-white px-2 py-1 text-center">allergen</td>
							<td className="border border-white px-2 py-1 text-left">Milk</td>
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

      
      {/* メインのスポットライト - テキストを照らす */}
    </>
  );
};

export default LightingSetup;-e 
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

// 画面サイズ判定（768px以下をモバイルとする）
const isMobile = () => {
  if (typeof window === 'undefined') return false;
  return window.innerWidth <= 768;
};

// 画像パスを生成する関数
const generateImagePath = (filename: string): string => {
  const folder = isMobile() ? 'gallery-small' : 'pepe';
  return `${CDN_URL}/${folder}/${filename}`;
};

// 画像ファイルリスト
export const imageFiles: ImageFile[] = [
  { id: 1, filename: '1L.webp', size: 'L', path: generateImagePath('1L.webp') },
  { id: 2, filename: '2M.webp', size: 'M', path: generateImagePath('2M.webp') },
  { id: 3, filename: '3S.webp', size: 'S', path: generateImagePath('3S.webp') },
  { id: 4, filename: '4S.webp', size: 'S', path: generateImagePath('4S.webp') },
  { id: 5, filename: '5M.webp', size: 'M', path: generateImagePath('5M.webp') },
  { id: 6, filename: '6L.webp', size: 'L', path: generateImagePath('6L.webp') },
  { id: 7, filename: '7M.webp', size: 'M', path: generateImagePath('7M.webp') },
  { id: 8, filename: '8M.webp', size: 'M', path: generateImagePath('8M.webp') },
  { id: 9, filename: '9L.webp', size: 'L', path: generateImagePath('9L.webp') },
  { id: 10, filename: '10S.webp', size: 'S', path: generateImagePath('10S.webp') },
  { id: 11, filename: '11S.webp', size: 'S', path: generateImagePath('11S.webp') },
  { id: 12, filename: '12M.webp', size: 'M', path: generateImagePath('12M.webp') },
  { id: 13, filename: '13L.webp', size: 'L', path: generateImagePath('13L.webp') },
  { id: 14, filename: '14L.webp', size: 'L', path: generateImagePath('14L.webp') },
  { id: 15, filename: '15M.webp', size: 'M', path: generateImagePath('15M.webp') },
  { id: 16, filename: '16S.webp', size: 'S', path: generateImagePath('16S.webp') },
  { id: 17, filename: '17S.webp', size: 'S', path: generateImagePath('17S.webp') },
  { id: 18, filename: '18M.webp', size: 'M', path: generateImagePath('18M.webp') },
  { id: 19, filename: '19L.webp', size: 'L', path: generateImagePath('19L.webp') },
  { id: 20, filename: '20L.webp', size: 'L', path: generateImagePath('20L.webp') },
  { id: 21, filename: '21S.webp', size: 'S', path: generateImagePath('21S.webp') },
  { id: 22, filename: '22S.webp', size: 'S', path: generateImagePath('22S.webp') },
  { id: 23, filename: '23L.webp', size: 'L', path: generateImagePath('23L.webp') },
  { id: 24, filename: '24L.webp', size: 'L', path: generateImagePath('24L.webp') },
  { id: 25, filename: '25S.webp', size: 'S', path: generateImagePath('25S.webp') },
  { id: 26, filename: '26S.webp', size: 'S', path: generateImagePath('26S.webp') },
  { id: 27, filename: '27S.webp', size: 'S', path: generateImagePath('27S.webp') },
  { id: 28, filename: '28L.webp', size: 'L', path: generateImagePath('28L.webp') },
  { id: 29, filename: '29S.webp', size: 'S', path: generateImagePath('29S.webp') },
  { id: 30, filename: '30S.webp', size: 'S', path: generateImagePath('30S.webp') },
  { id: 31, filename: '31M.webp', size: 'M', path: generateImagePath('31M.webp') },
  { id: 32, filename: '32M.webp', size: 'M', path: generateImagePath('32M.webp') },
  { id: 33, filename: '33M.webp', size: 'M', path: generateImagePath('33M.webp') },
  { id: 34, filename: '34S.webp', size: 'S', path: generateImagePath('34S.webp') },
  { id: 35, filename: '35L.webp', size: 'L', path: generateImagePath('35L.webp') },
];

// サイズに応じたスケール（デスクトップ用）
const DESKTOP_SCALE_MAP: Record<ImageSize, number> = {
  L: 4,
  M: 3,
  S: 2,
};

// サイズに応じたスケール（モバイル用）
const MOBILE_SCALE_MAP: Record<ImageSize, number> = {
  L: 2.5,
  M: 2,
  S: 1.5,
};

// 現在の画面サイズに応じたスケールマップを取得
export const getScaleMap = (): Record<ImageSize, number> => {
  return isMobile() ? MOBILE_SCALE_MAP : DESKTOP_SCALE_MAP;
};

// 後方互換性のため
export const SCALE_MAP = DESKTOP_SCALE_MAP;-e 
### FILE: ./src/app/components/floating-images-fix/cyber-scroll-messages/constants.ts

// src/app/components/floating-images-fix/cyber-scroll-messages/constants.ts

export type GlitchEffectType = 'rgb' | 'slice' | 'wave' | 'pulse' | 'jitter' | 'none';
export type TextDirection = 'horizontal' | 'vertical';
export type TextAlignment = 'left' | 'center' | 'right';

export interface MessageConfig {
	id: string;
	text: string;
	position: {
		start: number; // vh単位での開始位置
		end: number;   // vh単位での終了位置
	};
	style: TextDirection;
	size: string;
	align?: TextAlignment;
	glitchEffect?: GlitchEffectType;
	keywords?: string[]; // 特別強調するキーワード
	delay?: number;      // 表示遅延 (ms)
	color?: string;      // オーバーライド色
}

export interface GlitchEffectConfig {
	className: string;
	intensity: number;
}

// メッセージ定義
export const cyberMessages: MessageConfig[] = [
	{
		id: 'message-1',
		text: 'Pepe ascends.',
		position: { start: 0, end: 200 },
		style: 'horizontal',
		size: '4rem',
		align: 'left',
		glitchEffect: 'rgb',
		keywords: ['Pepe', 'Ascends'],
		color: '#ffffff', // 白色ベース
	},
	{
		id: 'message-2',
		text: 'Pepe summons us here.',
		position: { start: 200, end: 400 },
		style: 'horizontal',
		size: '4rem',
		align: 'right',
		glitchEffect: 'slice',
		keywords: ['Pepe', 'Summons'],
		color: '#ffffff', // 白色ベース
	},
	{
		id: 'message-3',
		text: `Pepe <br/>Makes us <br/>Free.`,
		position: { start: 400, end: 700 },
		style: 'horizontal',
		size: '10rem',
		align: 'left',
		glitchEffect: 'rgb',
		keywords: ['境地'],
		color: '#ffffff', // 白色ベース
	}
];

// グリッチエフェクト設定
export const glitchEffects: Record<GlitchEffectType, GlitchEffectConfig> = {
	rgb: {
		className: 'rgbSplit',
		intensity: 2
	},
	wave: {
		className: 'waveDistort',
		intensity: 1.5
	},
	slice: {
		className: 'sliceGlitch',
		intensity: 3
	},
	pulse: {
		className: 'pulseEffect',
		intensity: 2
	},
	jitter: {
		className: 'jitterEffect',
		intensity: 1
	},
	none: {
		className: '',
		intensity: 0
	}
};

// システムステータス表示用テキスト
export const systemStatusText = {
	loading: 'Loading...',
	ready: 'Activate',
	awakening: 'Start...',
	complete: 'END'
};

// 装飾用ランダムバイナリ生成
export const generateRandomBinary = (length: number): string => {
	return Array.from({ length }, () => Math.round(Math.random())).join('');
};

// 装飾用16進数生成
export const generateRandomHex = (length: number): string => {
	const hexChars = '0123456789ABCDEF';
	return Array.from(
		{ length },
		() => hexChars[Math.floor(Math.random() * hexChars.length)]
	).join('');
};-e 
### FILE: ./src/app/components/floating-images-fix/cyber-scroll-messages/MessageDisplay.tsx

// src/app/components/floating-images-fix/cyber-scroll-messages/MessageDisplay.tsx

'use client';

import React, { useEffect, useState, useRef } from 'react';
import styles from './styles.module.css';
import { MessageConfig, GlitchEffectType } from './constants';

interface MessageDisplayProps {
	message: MessageConfig;
	isActive: boolean;
	scrollProgress: number;
	randomGlitch: boolean;
}

const MessageDisplay: React.FC<MessageDisplayProps> = ({
	message,
	isActive,
	scrollProgress,
	randomGlitch
}) => {
	const messageRef = useRef<HTMLDivElement>(null);
	// ① モバイル判定用ステート
	const [isMobile, setIsMobile] = useState(false);

	useEffect(() => {
		const mql = window.matchMedia('(max-width: 640px)');
		const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
		setIsMobile(mql.matches);
		mql.addEventListener('change', handler);
		return () => mql.removeEventListener('change', handler);
	}, []);

	// グリッチエフェクトに対応するクラス名を取得
	const getGlitchClass = (effect?: GlitchEffectType): string => {
		switch (effect) {
			case 'rgb': return styles.rgbSplit;
			case 'slice': return styles.sliceGlitch;
			case 'wave': return styles.waveDistort;
			case 'pulse': return styles.pulseEffect;
			case 'jitter': return styles.jitterEffect;
			default: return '';
		}
	};

	// 単語がキーワードかどうかチェック
	const isKeyword = (word: string): boolean => {
		if (!message.keywords) return false;
		return message.keywords.some(keyword =>
			word.includes(keyword) || keyword.includes(word)
		);
	};

	// 単語ごとに分割してキーワードを強調
	const renderWords = () => {
		const parts = message.text.split(/(<br\s*\/?>)/i); // 改行タグも含めて分割

		return parts.map((part, index) => {
			if (part.match(/<br\s*\/?>/i)) {
				return <br key={`br-${index}`} />;
			}

			const isKeywordWord = isKeyword(part.trim());

			return (
				<span
					key={`word-${index}`}
					className={`${isKeywordWord ? styles.keywordGlitch : ''} ${getGlitchClass(message.glitchEffect)}`}
					data-text={part}
				>
					{part}
				</span>
			);
		});
	};

	// スタイルの計算
	const getStyleProps = () => {
		// 基本スタイル
		let styleProps: React.CSSProperties = {
			color: message.color || '#ffffff', // 白色をデフォルトに
			fontSize: message.size || '3rem',
			fontWeight: 'bold',
			textShadow: '0 0 10px rgba(255, 255, 255, 0.7), 0 0 20px rgba(255, 255, 255, 0.5)', // 白いグロー
			opacity: isActive ? 1 : 0,
			transition: 'opacity 0.7s ease-in-out',
			zIndex: 25,
			lineHeight: 0.9,
		};

		// 縦書き/横書きの設定
		if (message.style === 'vertical') {
			styleProps.writingMode = 'vertical-rl';
			styleProps.textOrientation = 'upright';
		}

		// 配置の設定
		if (message.align === 'right') {
			styleProps.right = message.style === 'vertical' ? '20vw' : '10vw';
			styleProps.textAlign = 'right';
		} else if (message.align === 'center') {
			styleProps.left = '50%';
			styleProps.transform = 'translateX(-50%)';
			styleProps.textAlign = 'center';
		} else {
			styleProps.left = message.style === 'vertical' ? '20vw' : '10vw';
			styleProps.textAlign = 'left';
		}

		// メッセージごとに固定位置を指定
		if (message.id === 'message-1') {
			// 「受け継がれし、神秘の奇跡」- 横書き、上部
			styleProps.position = 'fixed';
			styleProps.top = '20vh';
		} else if (message.id === 'message-2') {
			// 「限られた者がたどり着く」- 横書き、中央右寄り
			styleProps.position = 'fixed';
			styleProps.top = '40vh';
			styleProps.transform = styleProps.transform
				? `${styleProps.transform} translateY(-50%)`
				: 'translateY(-50%)';
		} else if (message.id === 'message-3') {
			// 「境地」- 縦書き、中央左寄り
			styleProps.position = 'fixed';
			styleProps.top = '60vh';
			styleProps.transform = styleProps.transform
				? `${styleProps.transform} translateY(-50%)`
				: 'translateY(-50%)';
		}
		if (isMobile) {
			styleProps.left = '10vw';
			styleProps.right = undefined;
			styleProps.textAlign = 'left';
			styleProps.fontSize = '4rem';
			// 縦方向の translate は必要なければ外して OK
			if (styleProps.transform) {
				styleProps.transform = styleProps.transform.replace(/translateY\(-50%\)/, '');
			}
		}

		return styleProps;
	};

	return (
		<div
			ref={messageRef}
			className={`
        ${randomGlitch ? styles.jitterEffect : ''}
      `}
			style={getStyleProps()}
			data-message-id={message.id}
			data-active={isActive}
		>
			{renderWords()}
		</div>
	);
};

export default MessageDisplay;-e 
### FILE: ./src/app/components/floating-images-fix/cyber-scroll-messages/index.tsx

// src/app/components/floating-images-fix/cyber-scroll-messages/index.tsx

'use client';

import CyberScrollMessages from './CyberScrollMessages';

// 明示的にデフォルトエクスポート
export default CyberScrollMessages;
-e 
### FILE: ./src/app/components/floating-images-fix/cyber-scroll-messages/CyberScrollMessages.tsx

// src/app/components/floating-images-fix/cyber-scroll-messages/CyberScrollMessages.tsx

'use client';

import React, { useEffect, useState, useRef } from 'react';
import { cyberMessages } from './constants';
import MessageDisplay from './MessageDisplay';

const CyberScrollMessages: React.FC = () => {
	const [scrollProgress, setScrollProgress] = useState<number>(0);
	const [activeIndex, setActiveIndex] = useState<number | null>(null);
	const [randomGlitch, setRandomGlitch] = useState<boolean>(false);
	const [isFlashActive, setIsFlashActive] = useState<boolean>(false);
	const [debugInfo, setDebugInfo] = useState<{ [key: string]: any }>({});

	// 強制的に全てのメッセージをアクティブにする（デバッグ用）
	const [forceAllActive, setForceAllActive] = useState<boolean>(false);

	useEffect(() => {
		const handleScroll = () => {
			// 現在のページ全体のスクロール位置
			const scrollTop = window.scrollY;
			const winHeight = window.innerHeight;
			const docHeight = document.documentElement.scrollHeight;

			// まず全体のスクロール進捗を計算
			const totalScrollProgress = scrollTop / (docHeight - winHeight);

			// FloatingImagesFixSectionを特定のセレクターで検索
			const targetSection = document.querySelector('#floating-images-fix-section') as HTMLElement;

			if (!targetSection) {
				// フォールバック: クラス名でも検索
				const fallbackSection = document.querySelector('.floating-images-fix-section') as HTMLElement;

				if (!fallbackSection) {
					// セクションが見つからない場合、ページの相対位置で推定
					console.log('Target section not found, estimating position');

					// ページの相対位置から推定（調整された値）
					const estimatedStart = docHeight * 0.5;  // 0.66から0.5に調整
					const estimatedHeight = docHeight * 0.25;

					// 相対スクロール位置を計算
					const relativeScroll = Math.max(0, Math.min(1,
						(scrollTop - estimatedStart) / estimatedHeight
					));

					setScrollProgress(relativeScroll);
					setDebugInfo({
						scrollTop,
						docHeight,
						estimatedStart,
						estimatedHeight,
						relativeScroll,
						mode: 'estimated'
					});

					// メッセージ表示の判定
					updateActiveMessage(relativeScroll * 800);
				} else {
					// フォールバックセクションを使用
					processSectionScroll(fallbackSection, scrollTop);
				}
			} else {
				// メインのIDセレクターで見つかった場合
				processSectionScroll(targetSection, scrollTop);
			}

			// ランダムグリッチの発生
			triggerRandomGlitch();
		};

		// セクションスクロール処理を共通化
		const processSectionScroll = (section: HTMLElement, scrollTop: number) => {
			const rect = section.getBoundingClientRect();
			const sectionTop = rect.top + scrollTop;
			const sectionHeight = rect.height;

			// セクション内相対位置を計算
			let relativeScroll = 0;
			if (scrollTop < sectionTop) {
				relativeScroll = 0;
			} else if (scrollTop > sectionTop + sectionHeight) {
				relativeScroll = 1;
			} else {
				relativeScroll = (scrollTop - sectionTop) / sectionHeight;
			}

			setScrollProgress(relativeScroll);
			setDebugInfo({
				scrollTop,
				sectionTop,
				sectionHeight,
				relativeScroll,
				viewportOffset: rect.top,
				mode: 'section-based',
				sectionFound: section.id || section.className
			});

			// メッセージ表示の判定
			updateActiveMessage(relativeScroll * 800);
		};

		// メッセージのアクティブ状態を更新
		const updateActiveMessage = (currentVhPosition: number) => {
			if (forceAllActive) {
				setActiveIndex(0);
				return;
			}

			// セクション検出が正常に動作している場合は、オフセット調整を少なくする
			const adjustedPosition = currentVhPosition - 50; // 150から50に調整

			let foundActive = false;
			let activeIdx = null;

			cyberMessages.forEach((msg, idx) => {
				// 調整した位置で判定
				if (adjustedPosition >= msg.position.start && adjustedPosition <= msg.position.end) {
					activeIdx = idx;
					foundActive = true;

					if (idx === 2 && !isFlashActive &&
						adjustedPosition >= msg.position.start &&
						adjustedPosition <= msg.position.start + 20) {
						triggerFlashEffect();
					}
				}
			});

			setActiveIndex(foundActive ? activeIdx : null);
		};

		// フラッシュエフェクトをトリガー
		const triggerFlashEffect = () => {
			setIsFlashActive(true);
			setTimeout(() => setIsFlashActive(false), 300);
		};

		// ランダムなグリッチエフェクトをトリガー
		const triggerRandomGlitch = () => {
			if (Math.random() > 0.95) {
				setRandomGlitch(true);
				setTimeout(() => setRandomGlitch(false), 150);
			}
		};

		window.addEventListener('scroll', handleScroll);
		handleScroll(); // 初期化時に一度実行

		// キーボードショートカット：Dキーでデバッグモード切替
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === 'd' || e.key === 'D') {
				setForceAllActive(prev => !prev);
				console.log('Debug mode:', !forceAllActive);
			}
		};

		window.addEventListener('keydown', handleKeyDown);

		return () => {
			window.removeEventListener('scroll', handleScroll);
			window.removeEventListener('keydown', handleKeyDown);
		};
	}, [forceAllActive, isFlashActive]);

	return (
		<div className="absolute inset-0 pointer-events-none z-15 h-[800vh]">
			{cyberMessages.map((message, index) => (
				<MessageDisplay
					key={message.id}
					message={message}
					isActive={forceAllActive || activeIndex === index}
					scrollProgress={scrollProgress}
					randomGlitch={randomGlitch}
				/>
			))}
		</div>
	);
};

export default CyberScrollMessages;-e 
### FILE: ./src/app/components/floating-images-fix/FloatingImageFix.tsx

import { useRef, useState, useEffect } from 'react';
import { useFrame,extend } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import type { ImageFile } from './constants';
import * as THREE from 'three'; 

extend({ 
    Mesh: THREE.Mesh, 
    PlaneGeometry: THREE.PlaneGeometry, 
    MeshBasicMaterial: THREE.MeshBasicMaterial 
});

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
		// @ts-expect-error React Three Fiber JSX elements
		<mesh
			ref={meshRef}
			position={position}
			castShadow={false}
			receiveShadow={false}
		>
			{/* @ts-expect-error React Three Fiber JSX elements */}
			<planeGeometry args={[width, height]} />
			{/* @ts-expect-error React Three Fiber JSX elements */}
			<meshBasicMaterial
				map={texture}
				transparent
				opacity={0.6}
				toneMapped={false}
			/>
			{/* @ts-expect-error React Three Fiber JSX elements */}
		</mesh>
	);
};

export default FloatingImageFix;
-e 
### FILE: ./src/app/components/floating-images-fix/useResponsiveImages.ts

// src/app/components/floating-images-fix/useResponsiveImages.ts

import { useState, useEffect, useMemo } from 'react';
import { ImageFile, ImageSize } from './constants';

const CDN_URL = process.env.NEXT_PUBLIC_CLOUDFRONT_URL || "";

// 画面サイズ判定（768px以下をモバイルとする）
const isMobile = () => {
	if (typeof window === 'undefined') return false;
	return window.innerWidth <= 768;
};

// 画像データの基本定義
const baseImageData = [
	{ id: 1, filename: '1L.webp', size: 'L' as ImageSize },
	{ id: 2, filename: '2M.webp', size: 'M' as ImageSize },
	{ id: 3, filename: '3S.webp', size: 'S' as ImageSize },
	{ id: 4, filename: '4S.webp', size: 'S' as ImageSize },
	{ id: 5, filename: '5M.webp', size: 'M' as ImageSize },
	{ id: 6, filename: '6L.webp', size: 'L' as ImageSize },
	{ id: 7, filename: '7M.webp', size: 'M' as ImageSize },
	{ id: 8, filename: '8M.webp', size: 'M' as ImageSize },
	{ id: 9, filename: '9L.webp', size: 'L' as ImageSize },
	{ id: 10, filename: '10S.webp', size: 'S' as ImageSize },
	{ id: 11, filename: '11S.webp', size: 'S' as ImageSize },
	{ id: 12, filename: '12M.webp', size: 'M' as ImageSize },
	{ id: 13, filename: '13L.webp', size: 'L' as ImageSize },
	{ id: 14, filename: '14L.webp', size: 'L' as ImageSize },
	{ id: 15, filename: '15M.webp', size: 'M' as ImageSize },
	{ id: 16, filename: '16S.webp', size: 'S' as ImageSize },
	{ id: 17, filename: '17S.webp', size: 'S' as ImageSize },
	{ id: 18, filename: '18M.webp', size: 'M' as ImageSize },
	{ id: 19, filename: '19L.webp', size: 'L' as ImageSize },
	{ id: 20, filename: '20L.webp', size: 'L' as ImageSize },
	{ id: 21, filename: '21S.webp', size: 'S' as ImageSize },
	{ id: 22, filename: '22S.webp', size: 'S' as ImageSize },
	{ id: 23, filename: '23L.webp', size: 'L' as ImageSize },
	{ id: 24, filename: '24L.webp', size: 'L' as ImageSize },
	{ id: 25, filename: '25S.webp', size: 'S' as ImageSize },
	{ id: 26, filename: '26S.webp', size: 'S' as ImageSize },
	{ id: 27, filename: '27S.webp', size: 'S' as ImageSize },
	{ id: 28, filename: '28L.webp', size: 'L' as ImageSize },
	{ id: 29, filename: '29S.webp', size: 'S' as ImageSize },
	{ id: 30, filename: '30S.webp', size: 'S' as ImageSize },
	{ id: 31, filename: '31M.webp', size: 'M' as ImageSize },
	{ id: 32, filename: '32M.webp', size: 'M' as ImageSize },
	{ id: 33, filename: '33M.webp', size: 'M' as ImageSize },
	{ id: 34, filename: '34S.webp', size: 'S' as ImageSize },
	{ id: 35, filename: '35L.webp', size: 'L' as ImageSize },
];

// サイズに応じたスケール
const DESKTOP_SCALE_MAP: Record<ImageSize, number> = {
	L: 0.9,
	M: 0.9,
	S: 0.9,
};

const MOBILE_SCALE_MAP: Record<ImageSize, number> = {
	L: 0.5,
	M: 0.5,
	S: 0.5,
};

export const useResponsiveImages = () => {
	const [isMobileView, setIsMobileView] = useState(false);

	// 初期化とリサイズイベントの監視
	useEffect(() => {
		const checkScreenSize = () => {
			setIsMobileView(isMobile());
		};

		// 初期チェック
		checkScreenSize();

		// リサイズイベントを監視
		window.addEventListener('resize', checkScreenSize);
		return () => window.removeEventListener('resize', checkScreenSize);
	}, []);

	// 画像データを生成（画面サイズに応じてパスを切り替え）
	const imageFiles: ImageFile[] = useMemo(() => {
		const folder = isMobileView ? 'pepe/gallery-small2' : 'pepe';

		return baseImageData.map(item => ({
			...item,
			path: `${CDN_URL}/${folder}/${item.filename}`
		}));
	}, [isMobileView]);

	// スケールマップを取得
	const scaleMap = useMemo(() => {
		return isMobileView ? MOBILE_SCALE_MAP : DESKTOP_SCALE_MAP;
	}, [isMobileView]);

	return {
		imageFiles,
		scaleMap,
		isMobileView
	};
};-e 
### FILE: ./src/app/components/floating-images-fix/FloatingImagesFixSection.tsx

// src/app/components/floating-images-fix/FloatingImagesFixSection.tsx

'use client';

import React from 'react';
import FloatingImagesFixCanvas from './FloatingImagesFixCanvas';
import CyberScrollMessages from './cyber-scroll-messages';

// コンポーネント定義
const FloatingImagesFixSection: React.FC = () => {
	return (<>
		<div className='w-full relative h-[50vh] bg-black' />
		<section
			className="w-screen h-[800vh] relative overflow-hidden bg-black floating-images-fix-section"
			id="floating-images-fix-section"
		>
			<div className="w-screen h-full sticky top-0 left-0 pointer-events-none z-10">
				<div className="absolute top-0 left-0 w-full h-[100vh] z-20
						bg-gradient-to-b from-black via-black/40 to-black/0
						pointer-events-none"
				/>
				<div
					className="absolute inset-0 z-10 block sm:hidden bg-center bg-cover"
					style={{
						backgroundImage: `url(${process.env.NEXT_PUBLIC_CLOUDFRONT_URL}/pepe/garally_small2.webp)`
					}}
				/>

				<FloatingImagesFixCanvas />

				<CyberScrollMessages />
				<div className="absolute bottom-0 left-0 w-full h-[100vh] z-20
						bg-gradient-to-b from-black/0 via-black/40 to-black
						pointer-events-none"
				/>
			</div>
		</section>
		<div className='w-full relative h-[150vh] bg-black' />
	</>);
};

// 明示的にdefaultエクスポート
export default FloatingImagesFixSection;-e 
### FILE: ./src/app/components/floating-images-fix/FloatingImagesFixCanvas.tsx

'use client';

import React, { useMemo } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import FloatingImageFix from './FloatingImageFix';
import { ImageSize,ImageFile } from './constants';
import { useResponsiveImages } from './useResponsiveImages';

const CANVAS_DEPTH = 3; // 奥行き全体の幅
const PADDING_X = 0.2;  // 横方向パディング
const PADDING_Y = 1.5;    // 縦方向パディング

const getZBySize = (size: ImageSize) => {
	if (size === 'L') return CANVAS_DEPTH * 0.42 + Math.random();
	if (size === 'M') return Math.random() * 2 - 1;
	return -CANVAS_DEPTH * 0.42 + Math.random();
};

const FloatingImagesFixInner: React.FC<{
	imageFiles: ImageFile[];  // any[] から ImageFile[] に変更
	scaleMap: Record<ImageSize, number>;
}> = ({ imageFiles, scaleMap }) => {
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
					scale={scaleMap[image.size]}
					rotationSpeed={speeds[i]}
				/>
			))}
		</>
	);
};

const FloatingImagesFixCanvas: React.FC = () => {
	const { imageFiles, scaleMap } = useResponsiveImages();

	return (
		<Canvas
			className="w-full h-full hidden sm:block"
			gl={{ antialias: false }}
			dpr={1}
			shadows={false}
			frameloop="always"
		>
			<FloatingImagesFixInner imageFiles={imageFiles} scaleMap={scaleMap} />
		</Canvas>
	);
};

export default FloatingImagesFixCanvas;-e 
### FILE: ./src/app/components/floating-images-fix/TestThree.tsx

import { Canvas } from '@react-three/fiber'

export default function TestThree() {
	return (
		<div style={{ width: '100px', height: '100px' }}>
			<Canvas>
				{/* @ts-expect-error React Three Fiber JSX elements */}
				<mesh>
					{/* @ts-expect-error React Three Fiber JSX elements */}
					<boxGeometry args={[1, 1, 1]} />
					{/* @ts-expect-error React Three Fiber JSX elements */}
					<meshBasicMaterial color="red" />
					{/* @ts-expect-error React Three Fiber JSX elements */}
				</mesh>
			</Canvas>
		</div>
	)
}-e 
### FILE: ./src/app/layout.tsx

import { Montserrat, Space_Grotesk } from 'next/font/google';
import './globals.css';
import type { Metadata } from 'next';
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
		<html lang="en" className={`${montserrat.variable} ${spaceGrotesk.variable}`}>
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
import Header from './components/ui/Header';
import Footer from './components/ui/Footer';
import CyberInterface from './components/layout/CyberInterface';
import PepePush from './components/pepePush/PepePush';

export default function Home() {
	return (
		<main className="relative flex flex-col items-center">
			<Header />
			<HeroSection />
			<CyberInterface />
			<GlowingTextSection />
			<PulsatingComponent />
			<PepeTop />
			<FloatingImagesFixSection />
			<SphereTop />
			<PepePush />
			<Footer />
		</main>
	);
}
/*

*/-e 
### FILE: ./types/react-three-fiber.d.ts

// types/react-three-fiber.d.ts
import { ReactThreeFiber } from '@react-three/fiber'
import * as THREE from 'three'

declare global {
  namespace JSX {
    interface IntrinsicElements {
      mesh: ReactThreeFiber.Object3DNode<THREE.Mesh, typeof THREE.Mesh>
      group: ReactThreeFiber.Object3DNode<THREE.Group, typeof THREE.Group>
      planeGeometry: ReactThreeFiber.Node<THREE.PlaneGeometry, typeof THREE.PlaneGeometry>
      boxGeometry: ReactThreeFiber.Node<THREE.BoxGeometry, typeof THREE.BoxGeometry>
      sphereGeometry: ReactThreeFiber.Node<THREE.SphereGeometry, typeof THREE.SphereGeometry>
      meshBasicMaterial: ReactThreeFiber.Node<THREE.MeshBasicMaterial, typeof THREE.MeshBasicMaterial>
      meshStandardMaterial: ReactThreeFiber.Node<THREE.MeshStandardMaterial, typeof THREE.MeshStandardMaterial>
      ambientLight: ReactThreeFiber.Object3DNode<THREE.AmbientLight, typeof THREE.AmbientLight>
      directionalLight: ReactThreeFiber.Object3DNode<THREE.DirectionalLight, typeof THREE.DirectionalLight>
      spotLight: ReactThreeFiber.Object3DNode<THREE.SpotLight, typeof THREE.SpotLight>
      pointLight: ReactThreeFiber.Object3DNode<THREE.PointLight, typeof THREE.PointLight>
    }
  }
}

export {}-e 
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
### FILE: ./next.config.js

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['three', '@react-three/fiber', '@react-three/drei'], // この行を追加
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
    esmExternals: 'loose', // この行も追加
  },
};

module.exports = nextConfig;-e 
### FILE: ./next-env.d.ts

/// <reference types="next" />
/// <reference types="next/image-types/global" />

// NOTE: This file should not be edited
// see https://nextjs.org/docs/basic-features/typescript for more information.

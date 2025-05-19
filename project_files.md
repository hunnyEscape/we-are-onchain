-e 
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
### FILE: ./src/app/components/ui/CyberBox.tsx

// src/app/components/ui/CyberBox.tsx
import React, { ReactNode } from 'react';

interface CyberBoxProps {
	children: ReactNode;
	className?: string;
	borderColor?: string;
	glowColor?: string;
}

export const CyberBox: React.FC<CyberBoxProps> = ({
	children,
	className = '',
	borderColor = 'border-neonGreen',
	glowColor = 'shadow-[0_0_10px_rgba(0,255,127,0.5)]',
}) => {
	return (
		<div
			className={`
        relative 
        border-2 
        ${borderColor} 
        ${glowColor} 
        bg-dark-100/80 
        backdrop-blur-sm 
        p-4 
        ${className}
      `}
		>
			{/* 角の装飾 */}
			<div className={`absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 ${borderColor}`}></div>
			<div className={`absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 ${borderColor}`}></div>
			<div className={`absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 ${borderColor}`}></div>
			<div className={`absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 ${borderColor}`}></div>

			{children}
		</div>
	);
};

export default CyberBox;-e 
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
import CyberBox from '../ui/CyberBox';
import styles from './HeroSection.module.css';
import ProteinStory from './ProteinStory';
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

			{/* サブタイトル */}
			<CyberBox className="inline-block mt-8 px-8 py-3">
				<div className="overflow-hidden">
					<div className="whitespace-nowrap overflow-hidden border-r-4 border-neonGreen">
						<span className="text-3xl sm:text-4xl text-white mr-2">WeAre</span>
						<span className="text-3xl sm:text-4xl text-neonGreen">on-chain</span>
					</div>
				</div>
			</CyberBox>
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
		<div
			className="absolute right-[10%] bottom-[5%] w-[300px] h-[400px] md:w-[400px] md:h-[500px] lg:w-[500px] lg:h-[600px] pointer-events-auto"
			style={style}
		>
			<ProteinModel
				autoRotate={true}
				mouseControl={true}
				scale={scale}
			/>
		</div>
	);
};

export default HeroModel;-e 
### FILE: ./src/app/components/hero-section/ProteinStory.tsx

// src/app/components/hero-section/ProteinStory.tsx
'use client';
import React, { useRef } from 'react';
import { motion, useScroll, useTransform, MotionProps } from 'framer-motion';

interface StoryBlockProps {
	children: React.ReactNode;
	delay?: number;
}

const StoryBlock: React.FC<StoryBlockProps> = ({ children, delay = 0 }) => {
	const ref = useRef<HTMLDivElement>(null);

	const { scrollYProgress } = useScroll({
		target: ref as React.RefObject<HTMLElement>,
		offset: ["start end", "end end"]
	});

	const opacity = useTransform(scrollYProgress, [0, 0.3], [0, 1]);
	const y = useTransform(scrollYProgress, [0, 0.3], [50, 0]);

	return (
		<motion.div
			ref={ref}
			style={{ opacity, y }}
			className="mb-8 p-4 bg-black/80 border-l-2 border-neonGreen relative overflow-hidden"
		>
			<div className="h-4 w-4 bg-neonGreen absolute -left-[9px] top-4"></div>
			{children}
		</motion.div>
	);
};

const ProteinStory: React.FC = () => {
	return (
		<div className="max-w-prose mx-auto px-4 py-16">
			<StoryBlock>
				<div className="text-neonGreen mb-2 font-mono text-sm">&gt; product_info.exe</div>
				<h3 className="text-neonOrange font-bold text-xl mb-2">
					"味わうたび、世界を揺らす"
				</h3>
				<p className="text-white mb-4">
					暗闇の向こうでそっと灯るは、ぺぺのグリーン―― 一口ごとに脈打つビートが、未知の力を呼び覚ます。
				</p>
				<div className="text-neonGreen font-bold mb-2">
					**"ペペ味"スペシャルフレーバ** は、ただのプロテインではない。 それは、ぺぺが紡ぐ「勇気」と「ユーモア」の物語。
				</div>
			</StoryBlock>

			<StoryBlock>
				<div className="text-neonGreen mb-2 font-mono text-sm">&gt; story.exe</div>
				<ol className="list-decimal list-inside text-white mb-4 space-y-4 pl-4">
					<li>
						<span className="text-neonGreen font-bold">深緑の源泉</span><br />
						古代から森にひそむ「ぺぺの泉」。そこから湧き出るグリーンミネラルが、濃厚なコクとほどよい甘みをもたらす。
					</li>
					<li>
						<span className="text-neonGreen font-bold">クリスプな刻印</span><br />
						ほんのりビターな後味に、キラリと光るライムの爽快感。トレーニング後の疲労を吹き飛ばし、次の挑戦へと背中を押す。
					</li>
					<li>
						<span className="text-neonGreen font-bold">奇跡のブレンド</span><br />
						完全植物由来のホエイ＆ピープロテインを黄金比でミックス。ぺぺの冒険譚を詰め込んだ、贅沢な一杯。
					</li>
				</ol>
			</StoryBlock>

			<StoryBlock>
				<div className="border-l-2 border-neonOrange pl-4 italic text-white my-6 text-lg">
					"飲めば、君もぺぺとともに駆ける。"
				</div>
				<p className="text-white mb-6">
					次元を超えたグリーンパワーを、その手で感じよ。 <span className="text-neonOrange font-bold">PAY. PUMP. LIVE.</span>
				</p>
				<div className="mt-6 text-center">
					<div className="border border-neonGreen inline-block px-6 py-2 text-lg">
						<span className="text-white">We Are</span> <span className="text-neonGreen">On-Chain</span> – 今、この一杯が、ぺぺ世界の扉を開く。
					</div>
				</div>
			</StoryBlock>

			{/* 次のセクションへのインディケーター */}
			<motion.div
				className="text-center mt-16 text-neonGreen"
				initial={{ opacity: 0 }}
				whileInView={{ opacity: 1 }}
				transition={{ delay: 0.5 }}
			>
				<div className="animate-bounce mb-2">↓</div>
				<div className="text-sm">次のセクションへ</div>
			</motion.div>
		</div>
	);
};

export default ProteinStory;-e 
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
          backgroundImage: `url('/images/pepe-cyberpunk.png')`,
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

      {/* 暗いオーバーレイ - 少し動く */}
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
          backgroundImage: "url('/images/noisy_grid.webp')",
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
            backgroundImage: `url('/images/pepe-cyberpunk.png')`,
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
              backgroundImage: `url('/images/pepe-cyberpunk.png')`,
              transform: `translateX(${glitchState.intensity * 1.5}px)`,
            }}
          />
          <div
            className={styles.rgbSliceBlue}
            style={{
              backgroundImage: `url('/images/pepe-cyberpunk.png')`,
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

// src/app/components/hero-section/HeroSection.tsx
'use client';
import React, { useState, useEffect } from 'react';
import ScanlineEffect from '../ui/ScanlineEffect';
import styles from './HeroSection.module.css';
import { useGlitchEffect } from './GlitchEffects';
import HeroBackground from './HeroBackground';
import HeroTitle from './HeroTitle';
import HeroModel from './HeroModel';
import ProteinStory from './ProteinStory';

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
		/**
		 * ┌──────────────────────── wrapper ────────────────────────┐
		 * │ sticky(100vh) = ヒーロー                                   │
		 * │ ↓                                                       │
		 * │ normal flow            = プロテインストーリー             │
		 * └──────────────────────────────────────────────────────────┘
		 */
		<div className="relative">
			{/* ────── ビューポートに貼り付ける部分 ────── */}
			<div className="sticky top-0 h-screen overflow-hidden">
				{/* 背景 & エフェクト */}
				<HeroBackground
					backgroundTransform={backgroundTransform}
					midLayerTransform={midLayerTransform}
					glitchState={glitchState}
					getGlitchStyle={getGlitchStyle}
				/>

				{/* 3Dモデル（中間レイヤー） */}
				<div
					className="absolute inset-0 z-[15] pointer-events-none"
					style={{
						transform: midLayerTransform,
						transition: 'transform 1.5s ease-out',
					}}
				>
					<HeroModel />
				</div>

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

			{/* ────── 以下は通常スクロールで流れる部分 ────── */}
			<section className="bg-gradient-to-b from-transparent to-black">
				<ProteinStory />
			</section>
		</div>
	);
};

export default HeroSection;
-e 
### FILE: ./src/app/components/3d/PepeModel.tsx

// PepeModel.tsx
'use client';

import { useRef, useEffect } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader';
import * as THREE from 'three';

const PepeModel = () => {
	const modelRef = useRef<THREE.Group>(null);

	// MTLファイルを読み込む
	const materials = useLoader(MTLLoader, '/models/pepe.mtl');

	useEffect(() => {
		if (materials) {
			console.log('Materials loaded:', materials);
			materials.preload();
		}
	}, [materials]);

	// OBJファイルを読み込む
	const obj = useLoader(OBJLoader, '/models/pepe.obj', (loader) => {
		if (materials) {
			loader.setMaterials(materials);
		}
	});

	useEffect(() => {
		if (obj) {
			console.log('Model loaded:', obj);

			// マテリアルがないメッシュに緑色を適用
			obj.traverse((child) => {
				if (child instanceof THREE.Mesh) {
					if (!child.material || (Array.isArray(child.material) && child.material.length === 0)) {
						child.material = new THREE.MeshStandardMaterial({
							color: '#00FF7F',
							roughness: 0.5,
							metalness: 0.2,
						});
					}
					child.castShadow = true;
					child.receiveShadow = true;
				}
			});
		}
	}, [obj]);

	// モデルの回転アニメーション
	useFrame((state) => {
		if (modelRef.current) {
			modelRef.current.rotation.y = state.clock.elapsedTime * 0.2;
		}
	});

	return (
		<primitive
			ref={modelRef}
			object={obj}
			scale={[0.5, 0.5, 0.5]}
			position={[0, 0, 0]}
		/>
	);
};

export default PepeModel;-e 
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

// src/app/page.tsx
import HeroSection from './components/hero-section/HeroSection';
import ModelDebug from './components/debug/ModelDebug';
export default function Home() {
  return (
    <main className="min-h-screen">
      <HeroSection />
    </main>
  );
}-e 
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

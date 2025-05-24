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
			<div className={`${styles.dataStream} hidden sm:block`}>
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
				style={{transition: 'transform 1.5s ease-out',}}
			/>
			<div className='hidden sm:block'>

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
				<div
					className={styles.centerLight}
					style={{
						transform: midLayerTransform,
						transition: 'transform 1.5s ease-out',
					}}
				/>
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
			position: [-3, -0.5, 0],
			rotation: [0, Math.PI / 8, 0],
			scale: [1.2, 1.2, 1.2]
		},
		{
			scrollProgress: 0.5,
			position: [-3, 3, -1],
			rotation: [0, Math.PI / 3, Math.PI / 3],
			scale: [1.1, 1.1, 1.1]
		},
		{
			scrollProgress: 0.75,
			position: [1.5, 0, 0.8],
			rotation: [0, Math.PI, Math.PI / 10],
			scale: [1.1, 1.1, 1.1]
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
	SECTION_HEIGHT_VH: 400,

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
### FILE: ./src/app/components/pepePush/messages/MessageTest.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { ScrollMessages } from './';

/**
 * メッセージ表示機能のテスト用コンポーネント
 * スライダーでスクロール進行度を手動調整可能
 */
const MessageTest: React.FC = () => {
	const [scrollProgress, setScrollProgress] = useState(0);
	const [autoScroll, setAutoScroll] = useState(false);

	// 自動スクロールのシミュレーション
	useEffect(() => {
		if (!autoScroll) return;

		const interval = setInterval(() => {
			setScrollProgress(prev => {
				// 0から1までループ
				const next = prev + 0.005;
				return next > 1 ? 0 : next;
			});
		}, 50);

		return () => clearInterval(interval);
	}, [autoScroll]);

	return (
		<div className="min-h-screen bg-black text-white p-4">
			<div className="fixed top-4 left-4 z-50 bg-black/70 p-4 rounded-lg w-80 backdrop-blur-sm">
				<h2 className="text-xl font-bold mb-4">メッセージテスト</h2>

				<div className="mb-4">
					<label className="block mb-2">スクロール進行度: {scrollProgress.toFixed(3)}</label>
					<input
						type="range"
						min="0"
						max="1"
						step="0.01"
						value={scrollProgress}
						onChange={e => setScrollProgress(parseFloat(e.target.value))}
						className="w-full"
					/>
				</div>

				<div className="flex items-center mb-4">
					<label className="flex items-center cursor-pointer">
						<input
							type="checkbox"
							checked={autoScroll}
							onChange={() => setAutoScroll(!autoScroll)}
							className="mr-2"
						/>
						<span>自動スクロール</span>
					</label>
				</div>

				<div className="grid grid-cols-5 gap-2 mt-4">
					{[0, 0.2, 0.4, 0.6, 0.8].map(value => (
						<button
							key={value}
							onClick={() => setScrollProgress(value)}
							className="px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm"
						>
							{value}
						</button>
					))}
				</div>
			</div>

			{/* メッセージ表示 */}
			<ScrollMessages scrollProgress={scrollProgress} />

			{/* サイバーパンク風グリッドバックグラウンド */}
			<div
				className="fixed inset-0 pointer-events-none z-0 opacity-30"
				style={{
					backgroundImage: `
            linear-gradient(rgba(0, 255, 102, 0.05) 1px, transparent 1px), 
            linear-gradient(90deg, rgba(0, 255, 102, 0.05) 1px, transparent 1px)
          `,
					backgroundSize: '20px 20px',
					backgroundPosition: 'center center',
				}}
			/>
		</div>
	);
};

export default MessageTest;-e 
### FILE: ./src/app/components/pepePush/messages/constants.ts

// src/app/components/pepePush/messages/constants.ts
import { MessageConfig, ScrollMessageConfig, GlitchEffectType } from './types';

// スマホ判定のヘルパー関数
export const isMobile = () => {
  if (typeof window === 'undefined') return false;
  return window.innerWidth <= 768;
};

// スクロールメッセージ設定
export const SCROLL_CONFIG: ScrollMessageConfig = {
  SECTION_HEIGHT_VH: 600,    // pepePushセクションと合わせる
  SCROLL_SENSITIVITY: 1.0,   // スクロール感度
  DEBUG_MODE: false,         // デバッグモード
  FADE_DURATION: 500,        // フェードイン/アウト時間 (ms)
  VISIBILITY_THRESHOLD: 0.1  // メッセージ表示閾値
};

// エフェクト適用のヘルパー関数
export const getEffectClass = (effect?: GlitchEffectType): string => {
  if (!effect || effect === 'none') return '';
  
  // 命名規則: effect{エフェクト名} (最初の文字を大文字に)
  return `effect${effect.charAt(0).toUpperCase() + effect.slice(1)}`;
};

// メッセージ定義
export const cyberMessages: MessageConfig[] = [
  {
    id: 'message-1',
    text: 'Pepe knows \nwhat a real man is.',
    scrollProgress: 0.2,
    style: 'horizontal',
    size: isMobile() ? '3rem' : '8rem',
    align: 'left',
    glitchEffect: 'none',
    keywords: ['Pepe','real','man'],
  },
  {
    id: 'message-2',
    text: 'Pepe pursues \nthe goals others \ndon’t dare to approach.',
    scrollProgress: 0.35,
    style: 'horizontal',
    size: isMobile() ? '2rem' : '7rem',
    align: 'right',
    glitchEffect: 'none',
    keywords: ['Pepe','others','dare'],
  },
  {
    id: 'message-3',
    text: 'Pepe always outworks himself. \nEvery. \nSingle. \nDay.',
    scrollProgress: 0.55,
    style: 'horizontal',
    size: isMobile() ? '2rem' : '7rem',
    align: 'left',
    glitchEffect: 'none',
    keywords: ['Pepe','outworks'],
  },
  {
    id: 'message-4',
    text: 'Pepe never stops; \nstopping is death.',
    scrollProgress: 0.7,
    style: 'horizontal',
    size: isMobile() ? '2rem' : '5rem',
    align: 'right',
    glitchEffect: 'none',
    keywords: ['Pepe'],
  },
  {
    id: 'message-5',
    text: 'Pepe bets bold, never loses. \nSmart. \nDiligent. \nUnstoppable.',
    scrollProgress: 0.8,
    style: 'horizontal',
    size: isMobile() ? '3rem' : '7rem',
    align: 'left',
    glitchEffect: 'none',
    keywords: ['Pepe', 'ascends'],
  },
];

// メッセージ表示範囲の計算
export const calculateMessageVisibility = (
  messageScrollProgress: number,
  currentScrollProgress: number
): { isVisible: boolean; opacity: number; isActive: boolean } => {
  // メッセージの表示範囲を広げる
  const showStart = messageScrollProgress - 0.2; // 表示開始位置を早める
  const showPeak = messageScrollProgress;       // 最大表示
  const showEnd = messageScrollProgress + 0.2;  // 表示終了位置を延長

  // デフォルト値
  let isVisible = false;
  let opacity = 0;
  let isActive = false;

  // 表示範囲内の場合
  if (currentScrollProgress >= showStart && currentScrollProgress <= showEnd) {
    isVisible = true;
    
    // フェードイン（より滑らかに）
    if (currentScrollProgress <= showPeak) {
      opacity = (currentScrollProgress - showStart) / (showPeak - showStart);
      // イージング関数で滑らかに
      opacity = Math.sin(opacity * Math.PI / 2);
    } 
    // フェードアウト
    else {
      opacity = 1 - (currentScrollProgress - showPeak) / (showEnd - showPeak);
      // イージング関数で滑らかに
      opacity = Math.sin(opacity * Math.PI / 2);
    }
    
    // 0-1の範囲に制限
    opacity = Math.max(0, Math.min(1, opacity));
    
    // ピーク付近でアクティブ状態の範囲を広げる
    isActive = Math.abs(currentScrollProgress - showPeak) < 0.08;
  }

  return { isVisible, opacity, isActive };
};-e 
### FILE: ./src/app/components/pepePush/messages/MessageText.tsx

'use client';

import React, { useMemo } from 'react';
import { MessageConfig, GlitchEffectType } from './types';
import styles from './effects.module.css';
import { getEffectClass } from './constants';

interface MessageTextProps {
	message: MessageConfig;
	isActive: boolean;
	opacity: number;
}

const MessageText: React.FC<MessageTextProps> = ({
	message,
	isActive,
	opacity
}) => {
	// スタイルの動的生成
	const messageStyle = useMemo(() => {
		// 位置とサイズの基本スタイル
		const style: React.CSSProperties = {
			opacity,
			fontSize: message.size,
			transition: 'opacity 500ms ease-in-out, transform 500ms ease-in-out',
			transform: `translateY(${(1 - opacity) * 20}px)`,
		};

		// テキスト配置
		switch (message.align) {
			case 'right':
				style.right = '5vw';
				style.textAlign = 'right';
				break;
			case 'center':
				style.left = '50%';
				style.transform = `translateX(-50%) translateY(${(1 - opacity) * 20}px)`;
				style.textAlign = 'center';
				break;
			case 'left':
			default:
				style.left = '5vw';
				style.textAlign = 'left';
		}

		// スクロール位置に基づく垂直位置の設定
		switch (message.id) {
			case 'message-1':
				style.top = '8vh';
				break;
			case 'message-2':
				style.top = '60vh';
				break;
			case 'message-3':
				style.top = '40vh';
				break;
			case 'message-4':
				style.top = '80vh';
				break;
			case 'message-5':
				style.top = '10vh';
				break;
			default:
				style.top = '50vh';
		}

		return style;
	}, [message, opacity]);

	// キーワードをハイライト処理するヘルパー関数
	const renderText = () => {
		// 改行を処理
		const parts = message.text.split(/(\n)/g);

		return (
			<>
				{parts.map((part, index) => {
					if (part === '\n') return <br key={`br-${index}`} />;

					// 単語を分割して処理
					const words = part.split(' ');

					return (
						<span key={`part-${index}`}>
							{words.map((word, wordIndex) => {
								// キーワードかどうか確認
								const isKeyword = message.keywords?.some(
									keyword => word.toLowerCase().includes(keyword.toLowerCase())
								);

								// エフェクトクラスを取得
								const effectClass = getKeywordEffectClass(
									message.glitchEffect,
									isKeyword
								);

								return (
									<React.Fragment key={`word-${wordIndex}`}>
										<span
											className={effectClass}
											data-text={word}
											style={{
												display: 'inline-block',
												whiteSpace: 'nowrap'
											}}
										>
											{word}
										</span>
										{wordIndex < words.length - 1 ? ' ' : ''}
									</React.Fragment>
								);
							})}
						</span>
					);
				})}
			</>
		);
	};

	// キーワードに対する特別なエフェクトクラスを取得
	const getKeywordEffectClass = (effect?: GlitchEffectType, isKeyword = false) => {
		if (!effect || effect === 'none') {
			return isKeyword ? styles.keywordEffect : '';
		}

		const effectCapitalized = effect.charAt(0).toUpperCase() + effect.slice(1);

		// キーワードの場合は強調エフェクト
		if (isKeyword) {
			// キーワード特化クラス (keywordRgb, keywordRainbow など)
			const keywordClass = `keyword${effectCapitalized}`;
			return styles[keywordClass] || styles.keywordEffect;
		}

		// 通常のエフェクト (effectRgb, effectRainbow など)
		const effectClass = `effect${effectCapitalized}`;
		return styles[effectClass] || '';
	};

	return (
		<div
			className={`${styles.messageContainer} ${isActive ? 'z-50' : 'z-40'}`}
			style={{
				...messageStyle,
				fontFamily: 'var(--font-roboto-condensed), Arial, sans-serif',
				letterSpacing: '0px',
				lineHeight: 1.1,
				textShadow: '0 1px 2px rgba(0, 0, 0, 0.5)',
			}}
		>
			{renderText()}
		</div>
	);
};

export default MessageText;-e 
### FILE: ./src/app/components/pepePush/messages/ScrollMessages.tsx

'use client';

import React, { useEffect, useState } from 'react';
import MessageText from './MessageText';
import { cyberMessages, calculateMessageVisibility, SCROLL_CONFIG } from './constants';
import { ActiveMessageState, DebugInfo } from './types';

interface ScrollMessagesProps {
	scrollProgress: number;
	className?: string;
}

const ScrollMessages: React.FC<ScrollMessagesProps> = ({
	scrollProgress,
	className = '',
}) => {
	// アクティブメッセージの状態管理
	const [activeMessages, setActiveMessages] = useState<ActiveMessageState[]>([]);
	// スクロール位置に基づいてメッセージ表示を更新
	useEffect(() => {
		// アクティブなメッセージを計算
		const newActiveMessages = cyberMessages.map(message => {
			const { isVisible, opacity, isActive } = calculateMessageVisibility(
				message.scrollProgress,
				scrollProgress
			);

			return {
				message,
				opacity: isVisible ? opacity : 0,
				isActive
			};
		}).filter(item => item.opacity > 0);

		setActiveMessages(newActiveMessages);

	}, [scrollProgress]);

	return (
		<>
			{activeMessages.map(({ message, opacity, isActive }) => (
				<MessageText
					key={message.id}
					message={message}
					isActive={isActive}
					opacity={opacity}
				/>
			))}
		</>
	);
};

export default ScrollMessages;-e 
### FILE: ./src/app/components/pepePush/messages/types.ts

// src/app/components/pepePush/messages/types.ts

// グリッチエフェクトタイプの定義
export type GlitchEffectType = 
  | 'rgb'      // RGB分離効果
  | 'slice'    // スライスグリッチ
  | 'wave'     // 波形歪み
  | 'pulse'    // パルス効果
  | 'jitter'   // 震え効果
  | 'rainbow'  // 虹色エフェクト
  | 'neon'     // ネオン発光
  | 'none';    // エフェクトなし

// テキスト配置タイプ
export type TextAlignment = 'left' | 'center' | 'right';

// メッセージ設定インターフェース
export interface MessageConfig {
  id: string;
  text: string;
  scrollProgress: number;    // 0-1の範囲のスクロール位置
  style: 'horizontal';       // 現在は横書きのみサポート
  size: string;              // フォントサイズ (例: '2rem')
  align: TextAlignment;      // テキスト配置
  glitchEffect?: GlitchEffectType;  // 適用するグリッチエフェクト
  keywords?: string[];       // 強調するキーワード
  delay?: number;            // 表示遅延 (ms)
}

// スクロールメッセージの設定
export interface ScrollMessageConfig {
  SECTION_HEIGHT_VH: number;  // セクションの高さ (vh単位)
  SCROLL_SENSITIVITY: number; // スクロール感度
  DEBUG_MODE: boolean;        // デバッグモード
  FADE_DURATION: number;      // フェードイン/アウト時間 (ms)
  VISIBILITY_THRESHOLD: number; // メッセージ表示閾値
}

// アクティブメッセージの状態
export interface ActiveMessageState {
  message: MessageConfig;
  opacity: number;
  isActive: boolean;
}

// デバッグ情報
export interface DebugInfo {
  scrollProgress: number;
  activeMessageCount: number;
  viewportHeight: number;
  scrollY: number;
}-e 
### FILE: ./src/app/components/pepePush/messages/index.ts

// src/app/components/pepePush/messages/index.ts

// メインコンポーネントをエクスポート
export { default as ScrollMessages } from './ScrollMessages';

// 型定義をエクスポート
export type { 
  GlitchEffectType,
  TextAlignment,
  MessageConfig,
  ScrollMessageConfig,
  ActiveMessageState,
  DebugInfo
} from './types';

// 定数と設定をエクスポート
export {
  cyberMessages,
  calculateMessageVisibility,
  SCROLL_CONFIG,
  getEffectClass,
  isMobile
} from './constants';-e 
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
### FILE: ./src/app/components/pepePush/hooks/useScrollMessages.ts

'use client';

import { useState, useEffect } from 'react';
import { ActiveMessageState, DebugInfo } from '../messages/types';
import { cyberMessages, calculateMessageVisibility, SCROLL_CONFIG } from '../messages/constants';

/**
 * スクロールに応じたメッセージ表示状態を管理するカスタムフック
 * useScrollProgressから提供されるスクロール進行度を使用
 */
export function useScrollMessages(scrollProgress: number) {
  // アクティブメッセージの状態
  const [activeMessages, setActiveMessages] = useState<ActiveMessageState[]>([]);
  
  // ランダムグリッチエフェクト
  const [randomGlitchTriggered, setRandomGlitchTriggered] = useState(false);
  
  // デバッグ情報
  const [debugInfo, setDebugInfo] = useState<DebugInfo>({
    scrollProgress: 0,
    activeMessageCount: 0,
    viewportHeight: 0,
    scrollY: 0
  });

  // ランダムグリッチエフェクト処理
  useEffect(() => {
    const triggerRandomGlitch = () => {
      // 10%の確率でグリッチをトリガー
      if (Math.random() < 0.1) {
        setRandomGlitchTriggered(true);
        // 100-300msでグリッチ解除
        setTimeout(() => {
          setRandomGlitchTriggered(false);
        }, 100 + Math.random() * 200);
      }
    };

    // 200ms毎にグリッチチェック
    const glitchInterval = setInterval(triggerRandomGlitch, 200);
    
    return () => {
      clearInterval(glitchInterval);
    };
  }, []);

  // スクロール位置に基づいてメッセージ表示を更新
  useEffect(() => {
    // アクティブなメッセージを計算
    const newActiveMessages = cyberMessages.map(message => {
      const { isVisible, opacity, isActive } = calculateMessageVisibility(
        message.scrollProgress,
        scrollProgress
      );

      return {
        message,
        opacity: isVisible ? opacity : 0,
        isActive
      };
    }).filter(item => item.opacity > 0);

    setActiveMessages(newActiveMessages);

    // デバッグ情報を更新
    if (SCROLL_CONFIG.DEBUG_MODE) {
      setDebugInfo({
        scrollProgress,
        activeMessageCount: newActiveMessages.length,
        viewportHeight: window.innerHeight,
        scrollY: window.scrollY
      });
    }
  }, [scrollProgress]);

  return {
    activeMessages,
    randomGlitchTriggered,
    debugInfo
  };
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
	url = `${process.env.NEXT_PUBLIC_CLOUDFRONT_URL}/pepe/push-up-pepe.glb`
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
useGLTF.preload(`${process.env.NEXT_PUBLIC_CLOUDFRONT_URL}/pepe/push-up-pepe.glb`);-e 
### FILE: ./src/app/components/pepePush/PepePush.tsx

// ScrollController.tsx (Modified)
'use client';
import React, { Suspense } from 'react';
import StickyCanvas from './StickyCanvas';
import PepeModel3D from './PepeModel3D';
import { useScrollProgress } from './hooks/useScrollProgress';
import { useModelPosition } from './hooks/useModelPosition';
import { ScrollMessages } from './messages';

interface ScrollControllerProps {
	className?: string;
	showMessages?: boolean; // メッセージ表示の切り替えオプション
}

export default function PepePush({}: ScrollControllerProps) {
	const { scrollState, sectionRef } = useScrollProgress();
	const modelTransform = useModelPosition(scrollState.scrollProgress);
	return (
		<div ref={sectionRef} className={`relative w-full h-[400vh] bg-black`}>
			<StickyCanvas>
				<Suspense fallback={null}>
					<PepeModel3D transform={modelTransform} />
				</Suspense>
			</StickyCanvas>
			<ScrollMessages scrollProgress={scrollState.scrollProgress}/>
			{scrollState.isInSection && (
				<div className="fixed top-5 md:top-20 left-1/2 transform -translate-x-1/2 z-40">
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
			dpr={0.4}
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
import GlowingTextSection from './components/glowing-3d-text/GlowingTextSection';
import Header from './components/ui/Header';
import Footer from './components/ui/Footer';
import CyberInterface from './components/layout/CyberInterface';
import PepePush from './components/pepePush/PepePush';
export default function Home() {
	return (
		<main className="relative flex flex-col items-center w-full">
			<Header/>
			<CyberInterface />
			<HeroSection />
			<GlowingTextSection />
			<PepePush />
			<Footer />
		</main>
	);
}-e 
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

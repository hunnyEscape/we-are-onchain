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

export default CyberTextRevealSection;
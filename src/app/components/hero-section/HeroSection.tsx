'use client';
import React, { useState, useEffect } from 'react';
import ScanlineEffect from '../ui/ScanlineEffect';
import styles from './HeroSection.module.css';
import { useGlitchEffect } from './GlitchEffects';
import HeroBackground from './HeroBackground';
import HeroTitle from './HeroTitle';
import HeroModel from './HeroModel';
import ScrollSpace from './ScrollSpace';

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

	);
};

export default HeroSection;

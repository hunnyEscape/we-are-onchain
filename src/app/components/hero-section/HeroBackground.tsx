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

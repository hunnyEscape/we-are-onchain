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
					// transformを削除し、オーバーレイは固定に
					transition: 'transform 1.5s ease-out',
				}}
			/>
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

			{/* 重いエフェクト: モバイルでは非表示 */}
			<div className="hidden sm:hidden ">
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

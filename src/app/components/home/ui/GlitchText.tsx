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

export default GlitchText;
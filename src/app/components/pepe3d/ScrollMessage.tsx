// pepe3d/ScrollMessage.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useMessageVisibility } from './hooks/useMessageVisibility';
import { getGlitchClass, ANIMATION_CONFIG } from './config/animationConfig';
import { MessageConfig } from './types/messageTypes';
import { CONFIG } from './config/messageControlPoints';
import styles from './PepeStyles.module.css';

const ScrollMessage: React.FC = () => {
	const { activeMessages, scrollProgress, debugInfo, sectionRef } = useMessageVisibility() as any;
	const [randomGlitch, setRandomGlitch] = useState<boolean>(false);

	// ランダムグリッチエフェクト
	useEffect(() => {
		const interval = setInterval(() => {
			if (Math.random() < ANIMATION_CONFIG.RANDOM_GLITCH.PROBABILITY) {
				setRandomGlitch(true);
				setTimeout(() => setRandomGlitch(false), ANIMATION_CONFIG.RANDOM_GLITCH.DURATION);
			}
		}, 100);

		return () => clearInterval(interval);
	}, []);

	// キーワードを含むテキストをレンダリング
	const renderMessageText = (message: MessageConfig, isActive: boolean) => {
		if (!message.keywords || message.keywords.length === 0) {
			return (
				<span className={getGlitchClass(message.glitchEffect)}>
					{message.text}
				</span>
			);
		}

		// キーワードを検出してハイライト
		const words = message.text.split(' ');
		return words.map((word, wordIndex) => {
			const isKeyword = message.keywords?.some(keyword =>
				keyword.toLowerCase().includes(word.toLowerCase()) ||
				word.toLowerCase().includes(keyword.toLowerCase())
			);

			if (isKeyword) {
				return (
					<span
						key={`word-${wordIndex}`}
						className={`${styles.keywordGlitch} ${getGlitchClass(message.glitchEffect)}`}
						data-text={word}
						style={{
							textShadow: isActive
								? '0 0 12px rgba(0, 255, 102, 0.9)'
								: '0 0 8px rgba(0, 255, 102, 0.7)'
						}}
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

	return (
		<>
			{/* セクションの高さを設定するコンテナ */}
			<div
				ref={sectionRef}
				className="relative w-full"
				style={{ height: `${CONFIG.SECTION_HEIGHT_VH}vh` }}
			>
				{/* アクティブなメッセージを表示 */}
				{activeMessages.map((messageData: any, index: number) => {
					const { config, opacity, isActive } = messageData;
					const message = config.message;

					return (
						<div
							key={message.id}
							className={`fixed z-50 font-pixel text-white pointer-events-none
                ${randomGlitch ? styles.jitter : ''}
                ${isActive ? 'animate-pulse' : ''}
                whitespace-pre-wrap
              `}
							style={{
								top: message.top,
								left: message.left,
								width: message.width,
								fontSize: message.fontSize,
								opacity: opacity,
								textShadow: isActive
									? '0 0 12px rgba(0, 255, 102, 0.9)'
									: '0 0 8px rgba(0, 255, 102, 0.7)',
								transition: ANIMATION_CONFIG.TRANSITIONS.ALL,
								transform: `translateY(${(1 - opacity) * 20}px)`, // 滑らかな出現
							}}
						>
							{renderMessageText(message, isActive)}
						</div>
					);
				})}

				{/* デバッグ情報表示 */}
				{CONFIG.DEBUG_MODE && debugInfo && (
					<div className="fixed top-4 left-4 bg-black/80 text-green-400 p-4 rounded-lg font-mono text-sm z-50">
						<div>Scroll Progress: {debugInfo.scrollProgress.toFixed(3)}</div>
						<div>Current Point: {debugInfo.currentPointIndex}</div>
						<div>Next Point: {debugInfo.nextPointIndex}</div>
						<div>Active Messages: {debugInfo.activeMessages}</div>
						<div>Total Points: {debugInfo.totalPoints}</div>
					</div>
				)}

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
		</>
	);
};

export default ScrollMessage;
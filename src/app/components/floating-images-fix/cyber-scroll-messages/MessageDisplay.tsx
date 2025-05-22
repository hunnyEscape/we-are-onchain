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

export default MessageDisplay;
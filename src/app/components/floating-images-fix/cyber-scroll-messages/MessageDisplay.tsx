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
		return message.text.split(' ').map((word, index) => {
			const isKeywordWord = isKeyword(word);

			return (
				<span
					key={`word-${index}`}
					className={`${isKeywordWord ? styles.keywordGlitch : ''} ${getGlitchClass(message.glitchEffect)}`}
					data-text={word}
				>
					{word}
					{index < message.text.split(' ').length - 1 ? ' ' : ''}
				</span>
			);
		});
	};

	// スタイルの計算を簡略化し、デバッグを追加
	const getStyleProps = () => {
		// 基本スタイル
		let styleProps: React.CSSProperties = {
			color: message.color || '#00ff66',
			fontSize: message.size || '3rem',
			fontWeight: 'bold',
			textShadow: '0 0 10px rgba(0, 255, 102, 0.7)',
			opacity: isActive ? 1 : 0,
			transition: 'opacity 0.7s ease-in-out',
			zIndex: 25,
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
			// 「期は熟し」- 縦書き、中央右寄り
			styleProps.position = 'fixed';
			styleProps.top = '50vh';
			styleProps.transform = styleProps.transform
				? `${styleProps.transform} translateY(-50%)`
				: 'translateY(-50%)';
		} else if (message.id === 'message-3') {
			// 「覚醒する」- 縦書き、中央左寄り
			styleProps.position = 'fixed';
			styleProps.top = '50vh';
			styleProps.transform = styleProps.transform
				? `${styleProps.transform} translateY(-50%)`
				: 'translateY(-50%)';
		}

		// デバッグボーダー（確認用）
		styleProps.border = isActive ? '1px solid rgba(0, 255, 102, 0.3)' : 'none';

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

			{/* デバッグ情報（開発時のみ表示） */}
			{false && (
				<div className="absolute top-full left-0 bg-black/80 text-white text-xs p-1 z-50 whitespace-nowrap">
					ID: {message.id}, Active: {isActive ? 'YES' : 'NO'}
				</div>
			)}
		</div>
	);
};

export default MessageDisplay;
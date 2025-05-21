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
	const [charOpacity, setCharOpacity] = useState<number[]>([]);
	const messageRef = useRef<HTMLDivElement>(null);

	// 文字ごとの表示アニメーション用の初期不透明度を設定
	useEffect(() => {
		if (isActive) {
			const textLength = message.text.length;
			const opacities = Array(textLength).fill(0);

			const interval = setInterval(() => {
				setCharOpacity(prev => {
					const next = [...prev];
					const nextIndex = next.findIndex(o => o === 0);
					if (nextIndex !== -1) {
						next[nextIndex] = 1;
						return next;
					}
					return prev;
				});
			}, message.delay || 100);

			return () => clearInterval(interval);
		} else {
			setCharOpacity(Array(message.text.length).fill(0));
		}
	}, [isActive, message.text.length, message.delay]);

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

	// 縦書き用のスタイル
	const getTextDirectionStyle = () => {
		if (message.style === 'vertical') {
			return styles.verticalText;
		}
		return '';
	};

	// 配置スタイル
	const getAlignmentStyle = (): React.CSSProperties => {
		const style: React.CSSProperties = {};

		// スクロール位置に応じて固定位置ではなく、画面内での相対位置に変更
		if (message.style === 'vertical') {
			// 縦書きの場合
			if (message.align === 'right') {
				style.right = '20vw';
			} else if (message.align === 'center') {
				style.left = '50%';
				style.transform = 'translateX(-50%)';
			} else {
				style.left = '20vw';
			}

			// 中央に配置（固定ではなく、画面内の中央）
			style.top = '50vh';
			style.transform = style.transform
				? `${style.transform} translateY(-50%)`
				: 'translateY(-50%)';
		} else {
			// 横書きの場合
			if (message.align === 'right') {
				style.right = '10vw';
				style.textAlign = 'right';
			} else if (message.align === 'center') {
				style.left = '50%';
				style.transform = 'translateX(-50%)';
				style.textAlign = 'center';
			} else {
				style.left = '10vw';
				style.textAlign = 'left';
			}

			// 上から40%の位置に配置
			style.top = '40vh';
		}

		return style;
	};

	// 文字ごとに分割して表示
	const renderCharacters = () => {
		return message.text.split('').map((char, index) => (
			<span
				key={`char-${index}`}
				style={{
					opacity: charOpacity[index] || 0,
					transition: 'opacity 0.3s ease',
					display: 'inline-block',
				}}
			>
				{char}
			</span>
		));
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

	// src/app/components/floating-images-fix/cyber-scroll-messages/MessageDisplay.tsx の修正部分

	// ベースとなるスタイル
	// src/app/components/floating-images-fix/cyber-scroll-messages/MessageDisplay.tsx

	// ベースとなるスタイル部分を修正
	const baseStyle: React.CSSProperties = {
		position: 'absolute',
		zIndex: 15,
		color: message.color || '#00ff66',
		fontSize: message.size || '3rem',
		fontWeight: 'bold',
		textShadow: '0 0 10px rgba(0, 255, 102, 0.7)',
	};

	// 縦書き/横書きと位置設定
	if (message.style === 'vertical') {
		// 縦書きの場合
		baseStyle.writingMode = 'vertical-rl';
		baseStyle.top = `${message.position.start}vh`; // 開始位置

		if (message.align === 'right') {
			baseStyle.right = '20vw';
		} else if (message.align === 'center') {
			baseStyle.left = '50%';
			baseStyle.transform = 'translateX(-50%)';
		} else {
			baseStyle.left = '20vw';
		}
	} else {
		// 横書きの場合
		baseStyle.top = `${message.position.start}vh`; // 開始位置

		if (message.align === 'right') {
			baseStyle.right = '10vw';
			baseStyle.textAlign = 'right';
		} else if (message.align === 'center') {
			baseStyle.left = '50%';
			baseStyle.transform = 'translateX(-50%)';
			baseStyle.textAlign = 'center';
		} else {
			baseStyle.left = '10vw';
			baseStyle.textAlign = 'left';
		}
	}

	// スタイルに位置を追加
	if (message.style === 'vertical') {
		// 縦書きの場合
		if (message.align === 'right') {
			baseStyle.right = '20vw';
		} else if (message.align === 'center') {
			baseStyle.left = '50%';
			baseStyle.transform = 'translateX(-50%)';
		} else {
			baseStyle.left = '20vw';
		}

		// トップ位置を開始位置に設定
		baseStyle.top = `${message.position.start}vh`;
	} else {
		// 横書きの場合
		if (message.align === 'right') {
			baseStyle.right = '10vw';
			baseStyle.textAlign = 'right';
		} else if (message.align === 'center') {
			baseStyle.left = '50%';
			baseStyle.transform = 'translateX(-50%)';
			baseStyle.textAlign = 'center';
		} else {
			baseStyle.left = '10vw';
			baseStyle.textAlign = 'left';
		}

		// トップ位置を開始位置に設定
		baseStyle.top = `${message.position.start}vh`;
	}

	if (message.style === 'vertical') {
		baseStyle.top = '50%';
		baseStyle.transform = 'translateY(-50%)';
	} else {
		// 横書きの場合はmessage.topを使用
		baseStyle.top = '40vh';
	}

	return (
		<div
			ref={messageRef}
			className={`
        transition-opacity duration-700 ease-in-out
        ${isActive ? 'opacity-100' : 'opacity-0'}
        ${getTextDirectionStyle()}
        ${randomGlitch ? styles.jitterEffect : ''}
      `}
			style={baseStyle}
			data-message-id={message.id}
		>
			{renderWords()}
		</div>
	);
};

export default MessageDisplay;
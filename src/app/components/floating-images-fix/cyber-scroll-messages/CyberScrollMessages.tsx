// src/app/components/floating-images-fix/cyber-scroll-messages/CyberScrollMessages.tsx

'use client';

import React, { useEffect, useState, useRef } from 'react';
import { cyberMessages } from './constants';
import CyberInterface from './CyberInterface';
import MessageDisplay from './MessageDisplay';

const CyberScrollMessages: React.FC = () => {
	const [scrollProgress, setScrollProgress] = useState<number>(0);
	const [activeIndex, setActiveIndex] = useState<number | null>(null);
	const [randomGlitch, setRandomGlitch] = useState<boolean>(false);
	const [isFlashActive, setIsFlashActive] = useState<boolean>(false);

	// スクロール位置に基づいて現在のアクティブメッセージを計算
	const calculateActiveMessage = (scrollTop: number, docHeight: number, winHeight: number) => {
		// スクロール進行度（0～1）
		const scrollPercent = scrollTop / (docHeight - winHeight);
		setScrollProgress(scrollPercent);

		// 800vhを基準にした現在のスクロール位置（vh単位）
		const currentVh = scrollPercent * 800;

		// 各メッセージの範囲内にいるかチェック
		let foundActive = false;
		let activeIdx = null;

		cyberMessages.forEach((msg, idx) => {
			if (currentVh >= msg.position.start && currentVh <= msg.position.end) {
				activeIdx = idx;
				foundActive = true;

				// 特殊なメッセージ表示効果
				if (idx === 2 && !isFlashActive && currentVh >= msg.position.start && currentVh <= msg.position.start + 20) {
					triggerFlashEffect();
				}
			}
		});

		if (foundActive) {
			setActiveIndex(activeIdx);
		} else {
			setActiveIndex(null);
		}
	};

	// フラッシュエフェクトをトリガー
	const triggerFlashEffect = () => {
		setIsFlashActive(true);
		setTimeout(() => {
			setIsFlashActive(false);
		}, 300);
	};

	// ランダムなグリッチエフェクトをトリガー
	const triggerRandomGlitch = () => {
		if (Math.random() > 0.95) {
			setRandomGlitch(true);
			setTimeout(() => {
				setRandomGlitch(false);
			}, 150);
		}
	};

	useEffect(() => {
		const handleScroll = () => {
			const scrollTop = window.scrollY;
			const docHeight = document.documentElement.scrollHeight;
			const winHeight = window.innerHeight;

			calculateActiveMessage(scrollTop, docHeight, winHeight);
			triggerRandomGlitch();
		};

		window.addEventListener('scroll', handleScroll);

		// 初期化時にも一度計算
		handleScroll();

		return () => {
			window.removeEventListener('scroll', handleScroll);
		};
	}, []);

	return (
		<div className="fixed inset-0 pointer-events-none z-15">

			{/* メッセージ表示 */}
			{cyberMessages.map((message, index) => (
				<MessageDisplay
					key={message.id}
					message={message}
					isActive={activeIndex === index}
					scrollProgress={scrollProgress}
					randomGlitch={randomGlitch}
				/>
			))}
		</div>
	);
};

export default CyberScrollMessages;
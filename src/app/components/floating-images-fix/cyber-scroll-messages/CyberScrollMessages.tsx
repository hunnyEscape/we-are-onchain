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
	const [debugInfo, setDebugInfo] = useState<{ [key: string]: any }>({});

	// 強制的に全てのメッセージをアクティブにする（デバッグ用）
	const [forceAllActive, setForceAllActive] = useState<boolean>(false);

	useEffect(() => {
		const handleScroll = () => {
			// 現在のページ全体のスクロール位置
			const scrollTop = window.scrollY;
			const winHeight = window.innerHeight;
			const docHeight = document.documentElement.scrollHeight;

			// まず全体のスクロール進捗を計算
			const totalScrollProgress = scrollTop / (docHeight - winHeight);

			// FloatingImagesFixSectionを特定のセレクターで検索
			const targetSection = document.querySelector('#floating-images-fix-section') as HTMLElement;

			if (!targetSection) {
				// フォールバック: クラス名でも検索
				const fallbackSection = document.querySelector('.floating-images-fix-section') as HTMLElement;

				if (!fallbackSection) {
					// セクションが見つからない場合、ページの相対位置で推定
					console.log('Target section not found, estimating position');

					// ページの相対位置から推定（調整された値）
					const estimatedStart = docHeight * 0.5;  // 0.66から0.5に調整
					const estimatedHeight = docHeight * 0.25;

					// 相対スクロール位置を計算
					const relativeScroll = Math.max(0, Math.min(1,
						(scrollTop - estimatedStart) / estimatedHeight
					));

					setScrollProgress(relativeScroll);
					setDebugInfo({
						scrollTop,
						docHeight,
						estimatedStart,
						estimatedHeight,
						relativeScroll,
						mode: 'estimated'
					});

					// メッセージ表示の判定
					updateActiveMessage(relativeScroll * 800);
				} else {
					// フォールバックセクションを使用
					processSectionScroll(fallbackSection, scrollTop);
				}
			} else {
				// メインのIDセレクターで見つかった場合
				processSectionScroll(targetSection, scrollTop);
			}

			// ランダムグリッチの発生
			triggerRandomGlitch();
		};

		// セクションスクロール処理を共通化
		const processSectionScroll = (section: HTMLElement, scrollTop: number) => {
			const rect = section.getBoundingClientRect();
			const sectionTop = rect.top + scrollTop;
			const sectionHeight = rect.height;

			// セクション内相対位置を計算
			let relativeScroll = 0;
			if (scrollTop < sectionTop) {
				relativeScroll = 0;
			} else if (scrollTop > sectionTop + sectionHeight) {
				relativeScroll = 1;
			} else {
				relativeScroll = (scrollTop - sectionTop) / sectionHeight;
			}

			setScrollProgress(relativeScroll);
			setDebugInfo({
				scrollTop,
				sectionTop,
				sectionHeight,
				relativeScroll,
				viewportOffset: rect.top,
				mode: 'section-based',
				sectionFound: section.id || section.className
			});

			// メッセージ表示の判定
			updateActiveMessage(relativeScroll * 800);
		};

		// メッセージのアクティブ状態を更新
		const updateActiveMessage = (currentVhPosition: number) => {
			if (forceAllActive) {
				setActiveIndex(0);
				return;
			}

			// セクション検出が正常に動作している場合は、オフセット調整を少なくする
			const adjustedPosition = currentVhPosition - 50; // 150から50に調整

			let foundActive = false;
			let activeIdx = null;

			cyberMessages.forEach((msg, idx) => {
				// 調整した位置で判定
				if (adjustedPosition >= msg.position.start && adjustedPosition <= msg.position.end) {
					activeIdx = idx;
					foundActive = true;

					if (idx === 2 && !isFlashActive &&
						adjustedPosition >= msg.position.start &&
						adjustedPosition <= msg.position.start + 20) {
						triggerFlashEffect();
					}
				}
			});

			setActiveIndex(foundActive ? activeIdx : null);
		};

		// フラッシュエフェクトをトリガー
		const triggerFlashEffect = () => {
			setIsFlashActive(true);
			setTimeout(() => setIsFlashActive(false), 300);
		};

		// ランダムなグリッチエフェクトをトリガー
		const triggerRandomGlitch = () => {
			if (Math.random() > 0.95) {
				setRandomGlitch(true);
				setTimeout(() => setRandomGlitch(false), 150);
			}
		};

		window.addEventListener('scroll', handleScroll);
		handleScroll(); // 初期化時に一度実行

		// キーボードショートカット：Dキーでデバッグモード切替
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === 'd' || e.key === 'D') {
				setForceAllActive(prev => !prev);
				console.log('Debug mode:', !forceAllActive);
			}
		};

		window.addEventListener('keydown', handleKeyDown);

		return () => {
			window.removeEventListener('scroll', handleScroll);
			window.removeEventListener('keydown', handleKeyDown);
		};
	}, [forceAllActive, isFlashActive]);

	return (
		<div className="absolute inset-0 pointer-events-none z-15 h-[800vh]">
			{/* デバッグ情報 */}
			<div className="fixed top-0 left-0 bg-black/80 text-white p-2 z-50 text-xs max-w-xs">
				<div>Mode: {debugInfo.mode}</div>
				<div>Section: {debugInfo.sectionFound || 'not found'}</div>
				<div>Scroll: {Math.round(scrollProgress * 100)}%</div>
				<div>Active: {activeIndex !== null ? cyberMessages[activeIndex].text : 'none'}</div>
				<div>Force All: {forceAllActive ? 'ON (Press D to toggle)' : 'OFF (Press D to toggle)'}</div>
				<pre className="text-[8px] mt-1 max-h-20 overflow-auto">
					{JSON.stringify(debugInfo, null, 2)}
				</pre>
			</div>

			{/* サイバーインターフェース */}
			<CyberInterface
				scrollProgress={scrollProgress}
				activeIndex={activeIndex}
				isFlashActive={isFlashActive}
			/>

			{/* メッセージ表示 */}
			{cyberMessages.map((message, index) => (
				<MessageDisplay
					key={message.id}
					message={message}
					isActive={forceAllActive || activeIndex === index}
					scrollProgress={scrollProgress}
					randomGlitch={randomGlitch}
				/>
			))}
		</div>
	);
};

export default CyberScrollMessages;
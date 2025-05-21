// src/app/components/pepe3d/DiagonalTransition.tsx
import React, { useEffect, useRef, useState } from 'react';
import { useInView } from 'react-intersection-observer';
import StoryMessages from './StoryMessages';

interface DiagonalTransitionProps {
	scrollTriggerRef: React.RefObject<HTMLDivElement>;
	scrollHeight?: number;
}

const DiagonalTransition: React.FC<DiagonalTransitionProps> = ({
	scrollTriggerRef,
	scrollHeight = 300 // デフォルトの高さ
}) => {
	// スクロール位置を追跡するための状態
	const [scrollProgress, setScrollProgress] = useState(0);
	const [isActive, setIsActive] = useState(false);
	const [startPosition, setStartPosition] = useState(0);

	// スクロールトリガーが表示されているかを検出
	const { ref: inViewRef, inView } = useInView({
		threshold: 0.1,
		triggerOnce: true
	});

	// スクロールハンドラー
	useEffect(() => {
		const handleScroll = () => {
			if (!isActive) return;

			const currentScroll = window.scrollY;
			const scrollRange = scrollHeight;

			// スクロール進行度を計算（0-1）
			let progress = (currentScroll - startPosition) / scrollRange;
			progress = Math.max(0, Math.min(1, progress));

			setScrollProgress(progress);

			// デバッグ用
			console.log('Scroll Progress:', progress);
		};

		window.addEventListener('scroll', handleScroll, { passive: true });
		return () => window.removeEventListener('scroll', handleScroll);
	}, [isActive, startPosition, scrollHeight]);

	// トリガー要素が表示されたらトランジションをアクティブにする
	useEffect(() => {
		if (inView && !isActive) {
			console.log('Transition activated at scroll position:', window.scrollY);
			setIsActive(true);
			setStartPosition(window.scrollY);
		}
	}, [inView, isActive]);

	// デバッグ用スタイル
	const debugStyle = {
		position: 'fixed',
		top: '20px',
		right: '20px',
		background: 'rgba(0, 0, 0, 0.7)',
		color: 'white',
		padding: '10px',
		zIndex: 9999,
		fontSize: '12px'
	} as React.CSSProperties;

	return (
		<>
			{/* インビュー検出用の要素 */}
			<div ref={inViewRef} className="h-1 w-full bg-red-500" /> {/* デバッグのため色付け */}

			{/* トランジションコンテナ */}
			<div
				className="fixed top-0 left-0 w-full h-screen z-50 pointer-events-none"
			>
				{/* 斜めオーバーレイ */}
				<div
					className="absolute top-0 right-0 w-full h-screen bg-black diagonal-clip origin-top-right"
					style={{
						transform: `translateX(${isActive ? 100 - (scrollProgress * 100) : 100}%)`,
						transition: 'transform 0.05s linear',
					}}
				/>

				{/* ストーリーメッセージ */}
				{isActive && <StoryMessages progress={scrollProgress} />}
			</div>

			{/* デバッグ情報 */}
			<div style={debugStyle}>
				<div>InView: {inView ? 'Yes' : 'No'}</div>
				<div>Active: {isActive ? 'Yes' : 'No'}</div>
				<div>Progress: {scrollProgress.toFixed(2)}</div>
				<div>Start: {startPosition}</div>
				<div>Current: {window.scrollY}</div>
			</div>
		</>
	);
};

export default DiagonalTransition;
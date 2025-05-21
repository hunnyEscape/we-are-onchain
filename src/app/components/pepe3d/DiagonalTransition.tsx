// src/app/components/pepe3d/DiagonalTransition.tsx
"use client";
import React, { useEffect, useState } from 'react';
import { useInView } from 'react-intersection-observer';

interface DiagonalTransitionProps {
	scrollTriggerRef: React.RefObject<HTMLDivElement>;
	scrollHeight?: number;
	onTransitionComplete?: () => void;
}

const DiagonalTransition: React.FC<DiagonalTransitionProps> = ({
	scrollTriggerRef,
	scrollHeight = 300,
	onTransitionComplete
}) => {
	// スクロール位置を追跡するための状態
	const [scrollProgress, setScrollProgress] = useState(0);
	const [isActive, setIsActive] = useState(false);
	const [startPosition, setStartPosition] = useState(0);
	const [isCompleted, setIsCompleted] = useState(false);

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

			// トランジションが完了したらコールバックを呼び出す
			if (progress >= 0.98 && !isCompleted) {
				setIsCompleted(true);
				if (onTransitionComplete) {
					onTransitionComplete();
				}
			}
		};

		window.addEventListener('scroll', handleScroll, { passive: true });
		return () => window.removeEventListener('scroll', handleScroll);
	}, [isActive, startPosition, scrollHeight, isCompleted, onTransitionComplete]);

	// トリガー要素が表示されたらトランジションをアクティブにする
	useEffect(() => {
		if (inView && !isActive) {
			console.log('Transition activated at scroll position:', window.scrollY);
			setIsActive(true);
			setStartPosition(window.scrollY);
		}
	}, [inView, isActive]);

	// デバッグ用スタイル（開発完了後に削除可能）
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
			<div ref={inViewRef} className="h-1 w-full" />

			{/* トランジションコンテナ - absoluteで配置 */}
			<div
				className="absolute top-0 left-0 w-full h-screen z-30 pointer-events-none"
				style={{
					visibility: isActive ? 'visible' : 'hidden',
					position: 'sticky', // stickyとabsoluteを組み合わせる
					top: 0, // 画面の上部に固定
				}}
			>
				{/* フル画面オーバーレイ */}
				<div
					className="absolute top-0 left-0 w-full h-screen bg-black"
					style={{
						opacity: scrollProgress,
						transition: 'opacity 0.1s ease-out'
					}}
				/>
			</div>

			{/* デバッグ情報（開発用） */}
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
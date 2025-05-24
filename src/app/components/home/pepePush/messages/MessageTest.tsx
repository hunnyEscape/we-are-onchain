'use client';

import React, { useState, useEffect } from 'react';
import { ScrollMessages } from '.';

/**
 * メッセージ表示機能のテスト用コンポーネント
 * スライダーでスクロール進行度を手動調整可能
 */
const MessageTest: React.FC = () => {
	const [scrollProgress, setScrollProgress] = useState(0);
	const [autoScroll, setAutoScroll] = useState(false);

	// 自動スクロールのシミュレーション
	useEffect(() => {
		if (!autoScroll) return;

		const interval = setInterval(() => {
			setScrollProgress(prev => {
				// 0から1までループ
				const next = prev + 0.005;
				return next > 1 ? 0 : next;
			});
		}, 50);

		return () => clearInterval(interval);
	}, [autoScroll]);

	return (
		<div className="min-h-screen bg-black text-white p-4">
			<div className="fixed top-4 left-4 z-50 bg-black/70 p-4 rounded-lg w-80 backdrop-blur-sm">
				<h2 className="text-xl font-bold mb-4">メッセージテスト</h2>

				<div className="mb-4">
					<label className="block mb-2">スクロール進行度: {scrollProgress.toFixed(3)}</label>
					<input
						type="range"
						min="0"
						max="1"
						step="0.01"
						value={scrollProgress}
						onChange={e => setScrollProgress(parseFloat(e.target.value))}
						className="w-full"
					/>
				</div>

				<div className="flex items-center mb-4">
					<label className="flex items-center cursor-pointer">
						<input
							type="checkbox"
							checked={autoScroll}
							onChange={() => setAutoScroll(!autoScroll)}
							className="mr-2"
						/>
						<span>自動スクロール</span>
					</label>
				</div>

				<div className="grid grid-cols-5 gap-2 mt-4">
					{[0, 0.2, 0.4, 0.6, 0.8].map(value => (
						<button
							key={value}
							onClick={() => setScrollProgress(value)}
							className="px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm"
						>
							{value}
						</button>
					))}
				</div>
			</div>

			{/* メッセージ表示 */}
			<ScrollMessages scrollProgress={scrollProgress} />

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
	);
};

export default MessageTest;
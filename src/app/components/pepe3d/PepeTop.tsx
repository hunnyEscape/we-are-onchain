// src/app/components/pepe3d/PepeTop.tsx
"use client";
import React, { useRef } from 'react';
import PepeModel3D from './PepeModel3D';
import ScrollMessage from './ScrollMessage';
import DiagonalTransition from './DiagonalTransition';

const PepeTop: React.FC = () => {
	// ScrollMessageへの参照を作成
	const scrollMessageRef = useRef<HTMLDivElement>(null);

	return (
		<div className="relative f-[900vh]">
			{/* Sticky PepeModel3D */}
			<div className="sticky top-0 h-screen w-full overflow-hidden">
				<PepeModel3D />
				{/* 既存の放射状グラデーション */}
				<div
					className="absolute inset-0 z-10 pointer-events-none"
					style={{
						background: `radial-gradient(
              ellipse 100% 50% at center,
              rgba(0, 0, 0, 0.2) 10%,
              rgba(0, 0, 0, 0.6) 60%,
              rgba(0, 0, 0, 0.9) 80%,
              rgba(0, 0, 0, 1) 100%
            )`,
					}}
				/>
			</div>

			{/* スクロールメッセージ（参照を追加） */}
			<div ref={scrollMessageRef}>
				<ScrollMessage />
			</div>
			<div
				className="absolute inset-0 z-10 pointer-events-none"
				style={{
					background: `radial-gradient(
						ellipse 100% 50% at center,
						rgba(0, 0, 0, 0.2) 10%,
						rgba(0, 0, 0, 0.6) 60%,
						rgba(0, 0, 0, 1) 70%,
						rgba(0, 0, 0, 1) 100%
           			 )`,
				}}
			/>
		</div>
	);
};

export default PepeTop;
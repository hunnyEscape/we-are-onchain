// pepe3d/PepeTop.tsx
'use client';

import React from 'react';
import PepeModel3D from './PepeModel3D';
import ScrollMessage from './ScrollMessage';

const PepeTop: React.FC = () => {
	return (
		<div className="w-full relative">
			{/* Sticky PepeModel3D - 3Dモデルを背景として固定表示 */}
			<div className="sticky top-0 h-screen w-full overflow-hidden z-10">
				<PepeModel3D
					autoRotate={true}
					enableControls={false}
					rotationSpeed={0.3}
					useDefaultEnvironment={true}
				/>

				{/* 放射状グラデーションオーバーレイ - モデルの上に重ねる */}
				<div
					className="absolute inset-0 z-20 pointer-events-none"
					style={{
						background: `radial-gradient(
              ellipse 100% 50% at center,
              rgba(0, 0, 0, 0.1) 10%,
              rgba(0, 0, 0, 0.4) 50%,
              rgba(0, 0, 0, 0.7) 70%,
              rgba(0, 0, 0, 0.9) 85%,
              rgba(0, 0, 0, 1) 100%
            )`,
					}}
				/>
			</div>

			{/* スクロールメッセージセクション - 改良されたトリガー管理 */}
			<ScrollMessage />

			{/* 最終的なグラデーションオーバーレイ - セクション全体の下部をフェードアウト */}
			<div
				className="absolute bottom-0 left-0 w-full h-32 z-30 pointer-events-none"
				style={{
					background: `linear-gradient(
            to bottom,
            rgba(0, 0, 0, 0) 0%,
            rgba(0, 0, 0, 0.8) 70%,
            rgba(0, 0, 0, 1) 100%
          )`,
				}}
			/>

			{/* サイバーパンク風装飾要素 */}
			<div className="absolute inset-0 z-25 pointer-events-none">
				{/* コーナーマーカー */}
				<div className="absolute top-4 left-4 w-8 h-8 border-l-2 border-t-2 border-green-400 opacity-60" />
				<div className="absolute top-4 right-4 w-8 h-8 border-r-2 border-t-2 border-green-400 opacity-60" />
				<div className="absolute bottom-4 left-4 w-8 h-8 border-l-2 border-b-2 border-green-400 opacity-60" />
				<div className="absolute bottom-4 right-4 w-8 h-8 border-r-2 border-b-2 border-green-400 opacity-60" />

				{/* システムステータス */}
				<div className="absolute bottom-4 left-12 text-green-400 text-xs font-mono opacity-70">
					SYSTEM: PEPE_NEURAL_NETWORK v2.1 | STATUS: ACTIVE
				</div>
			</div>
		</div>
	);
};

export default PepeTop;
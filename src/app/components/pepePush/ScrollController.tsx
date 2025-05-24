// ScrollController.tsx (Modified)
'use client';

import React, { Suspense } from 'react';
import StickyCanvas from './StickyCanvas';
import PepeModel3D from './PepeModel3D';
import { useScrollProgress } from './hooks/useScrollProgress';
import { useModelPosition } from './hooks/useModelPosition';
import { CONFIG } from './config/controlPoints';
import { ScrollMessages } from './messages'; // 新しいメッセージコンポーネントをインポート

interface ScrollControllerProps {
	className?: string;
	showMessages?: boolean; // メッセージ表示の切り替えオプション
}

export default function ScrollController({ 
	className = '',
	showMessages = true // デフォルトでメッセージを表示
}: ScrollControllerProps) {
	const { scrollState, sectionRef } = useScrollProgress();
	const modelTransform = useModelPosition(scrollState.scrollProgress);

	return (
		<div
			ref={sectionRef}
			className={`relative w-full ${className}`}
			style={{ height: `${CONFIG.SECTION_HEIGHT_VH}vh` }}
		>
			{/* Sticky Canvas */}
			<StickyCanvas>
				<Suspense fallback={null}>
					<PepeModel3D transform={modelTransform} />
				</Suspense>
			</StickyCanvas>

			{/* スクロールメッセージ表示 - 切り替え可能 */}
			{showMessages && scrollState.isInSection && (
				<ScrollMessages
					scrollProgress={scrollState.scrollProgress}
					className="z-40"
				/>
			)}

			{/* スクロール進行を示すインジケーター */}
			{scrollState.isInSection && (
				<div className="fixed top-8 left-1/2 transform -translate-x-1/2 z-40">
					<div className="w-64 h-2 bg-white/20 rounded-full overflow-hidden">
						<div
							className="h-full bg-white/80 rounded-full transition-all duration-100"
							style={{ width: `${scrollState.scrollProgress * 100}%` }}
						/>
					</div>
					<div className="text-center text-white/60 text-xs mt-2">
						Training Progress
					</div>
				</div>
			)}

			{/* サイバーパンク風グリッドバックグラウンド */}
			{showMessages && (
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
			)}
		</div>
	);
}
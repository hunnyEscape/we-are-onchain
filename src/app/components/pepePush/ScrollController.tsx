// ScrollController.tsx
'use client';

import React, { Suspense } from 'react';
import StickyCanvas from './StickyCanvas';
import PepeModel3D from './PepeModel3D';
import { useScrollProgress } from './hooks/useScrollProgress';
import { useModelPosition } from './hooks/useModelPosition';
import { CONFIG } from './config/controlPoints';

interface ScrollControllerProps {
	className?: string;
}

export default function ScrollController({ className = '' }: ScrollControllerProps) {
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

			{/* デバッグ情報表示（開発時のみ） */}
			{CONFIG.DEBUG_MODE && scrollState.isInSection && (
				<div className="fixed top-4 right-4 bg-black/80 text-white p-4 rounded-lg font-mono text-sm z-50">
					<div>Progress: {scrollState.scrollProgress.toFixed(3)}</div>
					<div>Position: [{modelTransform.position.map(v => v.toFixed(2)).join(', ')}]</div>
					<div>Rotation: [{modelTransform.rotation.map(v => v.toFixed(2)).join(', ')}]</div>
					<div>Scale: [{modelTransform.scale.map(v => v.toFixed(2)).join(', ')}]</div>
				</div>
			)}

			{/* スクロール進行を示すインジケーター（オプション） */}
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
		</div>
	);
}
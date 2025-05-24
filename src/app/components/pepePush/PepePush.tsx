// ScrollController.tsx (Modified)
'use client';
import React, { Suspense } from 'react';
import StickyCanvas from './StickyCanvas';
import PepeModel3D from './PepeModel3D';
import { useScrollProgress } from './hooks/useScrollProgress';
import { useModelPosition } from './hooks/useModelPosition';
import { ScrollMessages } from './messages';

interface ScrollControllerProps {
	className?: string;
	showMessages?: boolean; // メッセージ表示の切り替えオプション
}

export default function PepePush({}: ScrollControllerProps) {
	const { scrollState, sectionRef } = useScrollProgress();
	const modelTransform = useModelPosition(scrollState.scrollProgress);
	return (
		<div ref={sectionRef} className={`relative w-full h-[400vh] bg-black`}>
			<StickyCanvas>
				<Suspense fallback={null}>
					<PepeModel3D transform={modelTransform} />
				</Suspense>
			</StickyCanvas>
			<ScrollMessages scrollProgress={scrollState.scrollProgress}/>
			{scrollState.isInSection && (
				<div className="fixed top-5 md:top-20 left-1/2 transform -translate-x-1/2 z-40">
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
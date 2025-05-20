'use client';
import React, { useEffect, useRef } from 'react';
import Lenis from '@studio-freight/lenis';

interface SmoothScrollProps {
	children: React.ReactNode;
}

// より単純で直接的なアプローチ
const SmoothScroll: React.FC<SmoothScrollProps> = ({ children }) => {
	const lenisRef = useRef<Lenis | null>(null);

	useEffect(() => {
		// ページロード時の遅延を防ぐために、すべてのスタイルを先に設定
		document.documentElement.style.scrollBehavior = 'auto';
		document.body.style.overflowY = 'scroll';
		document.body.style.overscrollBehavior = 'none';

		// 少し遅延させてLenisを初期化（DOMの準備を確実に）
		const timer = setTimeout(() => {
			if (lenisRef.current) return;

			lenisRef.current = new Lenis({
				// ↓lerp を指定せず、duration/easing を有効にする
				duration: 0.1,              // 0.2秒だけ慣性を残す
				easing: (t: number) => t,   // リニアイージング（慣性距離をすっと切る）

				orientation: 'vertical',
				gestureOrientation: 'vertical',
				smoothWheel: true,          // Wheel 特有のスムージングは ON
				wheelMultiplier: 1,         // 必要なら 0.5〜1.0 の範囲で調整
				normalizeWheel: true,
				syncTouch: true,
			});


			// この時点でスクロール位置を正確に設定
			lenisRef.current.scrollTo(window.scrollY, { immediate: true });

			// 即時アニメーション開始
			function raf(time: number) {
				if (lenisRef.current) {
					lenisRef.current.raf(time);
				}
				requestAnimationFrame(raf);
			}

			requestAnimationFrame(raf);
		}, 50); // 少しだけ遅延

		return () => {
			clearTimeout(timer);
			if (lenisRef.current) {
				lenisRef.current.destroy();
			}
			// スタイルをリセット
			document.documentElement.style.removeProperty('scroll-behavior');
			document.body.style.removeProperty('overflow-y');
			document.body.style.removeProperty('overscroll-behavior');
		};
	}, []);

	return <>{children}</>;
};

export default SmoothScroll;
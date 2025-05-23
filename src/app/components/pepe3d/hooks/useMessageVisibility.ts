// pepe3d/hooks/useMessageVisibility.ts
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { MessageVisibilityHookResult } from '../types/messageTypes';
import { getActiveMessages, getDebugInfo, CONFIG } from '../config/messageControlPoints';

export function useMessageVisibility(): MessageVisibilityHookResult {
	const [scrollProgress, setScrollProgress] = useState<number>(0);
	const [isInSection, setIsInSection] = useState<boolean>(false);
	const sectionRef = useRef<HTMLDivElement>(null);
	const frameRef = useRef<number>(null);

	const updateScrollProgress = useCallback(() => {
		if (!sectionRef.current) return;

		const rect = sectionRef.current.getBoundingClientRect();
		const windowHeight = window.innerHeight;
		const sectionHeight = rect.height;

		// セクションが画面に入っているかチェック
		const isInView = rect.top < windowHeight && rect.bottom > 0;
		setIsInSection(isInView);

		if (!isInView) return;

		// スクロール進行度を計算（0-1の範囲）
		const scrollTop = -rect.top;
		const maxScroll = sectionHeight - windowHeight;
		const progress = Math.max(0, Math.min(1, scrollTop / maxScroll));

		setScrollProgress(progress);

		if (CONFIG.DEBUG_MODE) {
			console.log('PepeTop Scroll Progress:', progress.toFixed(3));
		}
	}, []);

	useEffect(() => {
		const handleScroll = () => {
			if (frameRef.current) {
				cancelAnimationFrame(frameRef.current);
			}

			frameRef.current = requestAnimationFrame(updateScrollProgress);
		};

		window.addEventListener('scroll', handleScroll, { passive: true });
		handleScroll(); // 初期化

		return () => {
			window.removeEventListener('scroll', handleScroll);
			if (frameRef.current) {
				cancelAnimationFrame(frameRef.current);
			}
		};
	}, [updateScrollProgress]);

	// アクティブなメッセージを計算
	const activeMessages = getActiveMessages(scrollProgress);

	// デバッグ情報
	const debugInfo = CONFIG.DEBUG_MODE ? getDebugInfo(scrollProgress) : undefined;

	return {
		activeMessages,
		scrollProgress,
		debugInfo,
		// sectionRefを外部から使用できるように公開
		sectionRef
	} as MessageVisibilityHookResult & { sectionRef: React.RefObject<HTMLDivElement> };
}
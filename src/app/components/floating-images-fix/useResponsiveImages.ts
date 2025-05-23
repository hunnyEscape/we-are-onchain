// src/app/components/floating-images-fix/useResponsiveImages.ts

import { useState, useEffect, useMemo } from 'react';
import { ImageFile, ImageSize } from './constants';

const CDN_URL = process.env.NEXT_PUBLIC_CLOUDFRONT_URL || "";

// 画面サイズ判定（768px以下をモバイルとする）
const isMobile = () => {
	if (typeof window === 'undefined') return false;
	return window.innerWidth <= 768;
};

// 画像データの基本定義
const baseImageData = [
	{ id: 1, filename: '1L.webp', size: 'L' as ImageSize },
	{ id: 2, filename: '2M.webp', size: 'M' as ImageSize },
	{ id: 3, filename: '3S.webp', size: 'S' as ImageSize },
	{ id: 4, filename: '4S.webp', size: 'S' as ImageSize },
	{ id: 5, filename: '5M.webp', size: 'M' as ImageSize },
	{ id: 6, filename: '6L.webp', size: 'L' as ImageSize },
	{ id: 7, filename: '7M.webp', size: 'M' as ImageSize },
	{ id: 8, filename: '8M.webp', size: 'M' as ImageSize },
	{ id: 9, filename: '9L.webp', size: 'L' as ImageSize },
	{ id: 10, filename: '10S.webp', size: 'S' as ImageSize },
	{ id: 11, filename: '11S.webp', size: 'S' as ImageSize },
	{ id: 12, filename: '12M.webp', size: 'M' as ImageSize },
	{ id: 13, filename: '13L.webp', size: 'L' as ImageSize },
	{ id: 14, filename: '14L.webp', size: 'L' as ImageSize },
	{ id: 15, filename: '15M.webp', size: 'M' as ImageSize },
	{ id: 16, filename: '16S.webp', size: 'S' as ImageSize },
	{ id: 17, filename: '17S.webp', size: 'S' as ImageSize },
	{ id: 18, filename: '18M.webp', size: 'M' as ImageSize },
	{ id: 19, filename: '19L.webp', size: 'L' as ImageSize },
	{ id: 20, filename: '20L.webp', size: 'L' as ImageSize },
	{ id: 21, filename: '21S.webp', size: 'S' as ImageSize },
	{ id: 22, filename: '22S.webp', size: 'S' as ImageSize },
	{ id: 23, filename: '23L.webp', size: 'L' as ImageSize },
	{ id: 24, filename: '24L.webp', size: 'L' as ImageSize },
	{ id: 25, filename: '25S.webp', size: 'S' as ImageSize },
	{ id: 26, filename: '26S.webp', size: 'S' as ImageSize },
	{ id: 27, filename: '27S.webp', size: 'S' as ImageSize },
	{ id: 28, filename: '28L.webp', size: 'L' as ImageSize },
	{ id: 29, filename: '29S.webp', size: 'S' as ImageSize },
	{ id: 30, filename: '30S.webp', size: 'S' as ImageSize },
	{ id: 31, filename: '31M.webp', size: 'M' as ImageSize },
	{ id: 32, filename: '32M.webp', size: 'M' as ImageSize },
	{ id: 33, filename: '33M.webp', size: 'M' as ImageSize },
	{ id: 34, filename: '34S.webp', size: 'S' as ImageSize },
	{ id: 35, filename: '35L.webp', size: 'L' as ImageSize },
];

// サイズに応じたスケール
const DESKTOP_SCALE_MAP: Record<ImageSize, number> = {
	L: 1,
	M: 1,
	S: 1,
};

const MOBILE_SCALE_MAP: Record<ImageSize, number> = {
	L: 0.4,
	M: 0.4,
	S: 0.4,
};

export const useResponsiveImages = () => {
	const [isMobileView, setIsMobileView] = useState(false);

	// 初期化とリサイズイベントの監視
	useEffect(() => {
		const checkScreenSize = () => {
			setIsMobileView(isMobile());
		};

		// 初期チェック
		checkScreenSize();

		// リサイズイベントを監視
		window.addEventListener('resize', checkScreenSize);
		return () => window.removeEventListener('resize', checkScreenSize);
	}, []);

	// 画像データを生成（画面サイズに応じてパスを切り替え）
	const imageFiles: ImageFile[] = useMemo(() => {
		const folder = isMobileView ? 'pepe/gallery-small' : 'pepe';

		return baseImageData.map(item => ({
			...item,
			path: `${CDN_URL}/${folder}/${item.filename}`
		}));
	}, [isMobileView]);

	// スケールマップを取得
	const scaleMap = useMemo(() => {
		return isMobileView ? MOBILE_SCALE_MAP : DESKTOP_SCALE_MAP;
	}, [isMobileView]);

	return {
		imageFiles,
		scaleMap,
		isMobileView
	};
};
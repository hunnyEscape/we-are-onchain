// src/app/components/floating-images-fix/useResponsiveImages.ts

import { useState, useEffect, useMemo, useCallback } from 'react';
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

// サイズに応じたスケール（最適化済み）
const DESKTOP_SCALE_MAP: Record<ImageSize, number> = {
	L: 0.8, // 0.9 → 0.8に削減
	M: 0.7, // 0.9 → 0.7に削減
	S: 0.6, // 0.9 → 0.6に削減
};

const MOBILE_SCALE_MAP: Record<ImageSize, number> = {
	L: 0.4, // 0.5 → 0.4に削減
	M: 0.35, // 0.5 → 0.35に削減
	S: 0.3, // 0.5 → 0.3に削減
};

/**
 * パフォーマンス最適化された画像管理フック
 */
export const useResponsiveImages = () => {
	const [isMobileView, setIsMobileView] = useState(false);
	const [imageLoadingState, setImageLoadingState] = useState<'loading' | 'ready' | 'error'>('loading');
	const [loadedImageCount, setLoadedImageCount] = useState(0);

	// 画面サイズの監視（デバウンス付き）
	const checkScreenSize = useCallback(() => {
		setIsMobileView(isMobile());
	}, []);

	useEffect(() => {
		// 初期チェック
		checkScreenSize();

		// デバウンスされたリサイズハンドラー
		let timeoutId: NodeJS.Timeout;
		const debouncedResize = () => {
			clearTimeout(timeoutId);
			timeoutId = setTimeout(checkScreenSize, 250);
		};

		window.addEventListener('resize', debouncedResize);
		return () => {
			window.removeEventListener('resize', debouncedResize);
			clearTimeout(timeoutId);
		};
	}, [checkScreenSize]);

	// 画像データを生成（画面サイズに応じてパスを切り替え）
	const imageFiles: ImageFile[] = useMemo(() => {
		const folder = isMobileView ? 'pepe/gallery-small2' : 'pepe';

		return baseImageData.map(item => ({
			...item,
			path: `${CDN_URL}/${folder}/${item.filename}`
		}));
	}, [isMobileView]);

	// スケールマップを取得（最適化済み）
	const scaleMap = useMemo(() => {
		return isMobileView ? MOBILE_SCALE_MAP : DESKTOP_SCALE_MAP;
	}, [isMobileView]);

	// 画像の事前読み込み状態管理
	useEffect(() => {
		let loadCount = 0;
		const totalImages = imageFiles.length;

		setImageLoadingState('loading');
		setLoadedImageCount(0);

		// 画像の事前読み込み（パフォーマンス最適化のため段階的に実行）
		const preloadImages = async () => {
			const promises = imageFiles.map((imageFile, index) => {
				return new Promise<void>((resolve) => {
					const img = new Image();

					img.onload = () => {
						loadCount++;
						setLoadedImageCount(loadCount);

						if (process.env.NODE_ENV === 'development') {
							console.debug(`[useResponsiveImages] Image loaded: ${imageFile.filename} (${loadCount}/${totalImages})`);
						}

						resolve();
					};

					img.onerror = () => {
						console.warn(`[useResponsiveImages] Failed to load image: ${imageFile.filename}`);
						loadCount++;
						setLoadedImageCount(loadCount);
						resolve();
					};

					// 段階的読み込み（最初の10枚を優先）
					setTimeout(() => {
						img.src = imageFile.path;
					}, index < 10 ? 0 : index * 50);
				});
			});

			try {
				await Promise.all(promises);
				setImageLoadingState('ready');

				if (process.env.NODE_ENV === 'development') {
					console.info('[useResponsiveImages] All images preloaded successfully');
				}
			} catch (error) {
				console.error('[useResponsiveImages] Image preloading failed:', error);
				setImageLoadingState('error');
			}
		};

		preloadImages();
	}, [imageFiles]);

	// 優先度付き画像リスト（重要な画像を先頭に配置）
	const prioritizedImageFiles = useMemo(() => {
		const sorted = [...imageFiles];

		// Lサイズを優先、次にM、最後にS
		sorted.sort((a, b) => {
			const sizeOrder = { L: 3, M: 2, S: 1 };
			return sizeOrder[b.size] - sizeOrder[a.size];
		});

		return sorted;
	}, [imageFiles]);

	// パフォーマンス統計
	const performanceStats = useMemo(() => ({
		totalImages: imageFiles.length,
		loadedImages: loadedImageCount,
		loadingProgress: (loadedImageCount / imageFiles.length) * 100,
		isReady: imageLoadingState === 'ready',
		isMobile: isMobileView,
		averageScale: Object.values(scaleMap).reduce((a, b) => a + b, 0) / Object.values(scaleMap).length,
	}), [imageFiles.length, loadedImageCount, imageLoadingState, isMobileView, scaleMap]);

	// メモリ使用量の推定
	const estimatedMemoryUsage = useMemo(() => {
		const averageImageSize = isMobileView ? 0.5 : 1.2; // MB per image (推定)
		return loadedImageCount * averageImageSize;
	}, [loadedImageCount, isMobileView]);

	// デバッグ情報の出力
	useEffect(() => {
		if (process.env.NODE_ENV === 'development' && imageLoadingState === 'ready') {
			console.info('[useResponsiveImages] Performance stats:', {
				...performanceStats,
				estimatedMemoryUsage: `${estimatedMemoryUsage.toFixed(1)}MB`,
				scaleReduction: `${((1 - performanceStats.averageScale) * 100).toFixed(1)}%`,
			});
		}
	}, [performanceStats, estimatedMemoryUsage, imageLoadingState]);

	return {
		imageFiles: prioritizedImageFiles,
		scaleMap,
		isMobileView,
		imageLoadingState,
		loadedImageCount,
		performanceStats,
		estimatedMemoryUsage,
	};
};
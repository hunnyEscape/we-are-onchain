'use client';

import { useState, useEffect } from 'react';
import { TextureLoader } from 'three';
import { ImageFile } from './constants';

interface UseImageLoaderProps {
	images: ImageFile[];
	onProgress?: (progress: number) => void;
	onComplete?: () => void;
}

interface ImageLoadingState {
	loaded: boolean;
	progress: number;
	errors: string[];
}

/**
 * 画像の事前読み込みを行うカスタムフック
 */
export const useImageLoader = ({
	images,
	onProgress,
	onComplete
}: UseImageLoaderProps) => {
	const [loadingState, setLoadingState] = useState<ImageLoadingState>({
		loaded: false,
		progress: 0,
		errors: []
	});

	useEffect(() => {
		if (!images || images.length === 0) {
			setLoadingState({ loaded: true, progress: 100, errors: [] });
			onComplete?.();
			return;
		}

		const textureLoader = new TextureLoader();
		let loadedCount = 0;
		const errors: string[] = [];

		const updateProgress = () => {
			loadedCount++;
			const progress = Math.round((loadedCount / images.length) * 100);

			setLoadingState(prev => ({
				...prev,
				progress,
				loaded: loadedCount === images.length,
				errors: [...errors]
			}));

			onProgress?.(progress);

			if (loadedCount === images.length) {
				onComplete?.();
			}
		};

		// 各画像の読み込み
		images.forEach(image => {
			textureLoader.load(
				image.path,
				// 成功時
				() => {
					updateProgress();
				},
				// 進捗時
				undefined,
				// エラー時
				(error) => {
					console.error(`Error loading image: ${image.path}`, error);
					errors.push(`Failed to load: ${image.filename}`);
					updateProgress();
				}
			);
		});

		// クリーンアップ
		return () => {
			// TextureLoaderのクリーンアップ処理（必要に応じて）
		};
	}, [images, onProgress, onComplete]);

	return loadingState;
};
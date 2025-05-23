// src/app/components/floating-images-fix/FloatingImagesFixCanvas.tsx

'use client';

import React, { useMemo, useRef, useEffect } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import FloatingImageFix from './FloatingImageFix';
import { ImageSize, ImageFile } from './constants';
import { useResponsiveImages } from './useResponsiveImages';
import { VisibilityState } from '../../types/visibility';

const CANVAS_DEPTH = 3;
const PADDING_X = 0.2;
const PADDING_Y = 1.5;

// Z位置計算（サイズ別）
const getZBySize = (size: ImageSize) => {
	if (size === 'L') return CANVAS_DEPTH * 0.42 + Math.random();
	if (size === 'M') return Math.random() * 2 - 1;
	return -CANVAS_DEPTH * 0.42 + Math.random();
};

interface FloatingImagesFixCanvasProps {
	visibilityState: VisibilityState;
	intersectionRatio: number;
	canvasFrameloop: 'always' | 'never' | 'demand';
	isAnimating: boolean;
	priority: number;
}

/**
 * 可視性制御が統合された内部Canvas制御コンポーネント
 */
const FloatingImagesFixInner: React.FC<{
	imageFiles: ImageFile[];
	scaleMap: Record<ImageSize, number>;
	visibilityState: VisibilityState;
	intersectionRatio: number;
	isAnimating: boolean;
}> = ({ imageFiles, scaleMap, visibilityState, intersectionRatio, isAnimating }) => {
	const { viewport } = useThree();
	const count = imageFiles.length;
	const cols = Math.ceil(Math.sqrt(count));
	const rows = Math.ceil(count / cols);

	// 画像位置の計算（メモ化）
	const positions = useMemo(() => {
		const arr: [number, number, number][] = [];
		const images = imageFiles.slice().reverse();

		for (let i = 0; i < count; i++) {
			const col = i % cols;
			const row = Math.floor(i / cols);
			const image = images[i];

			const x =
				((col + 0.5) / cols) * (viewport.width - PADDING_X * 2) +
				PADDING_X -
				viewport.width / 2;
			const y =
				((row + 0.5) / rows) * (viewport.height - PADDING_Y * 2) +
				PADDING_Y -
				viewport.height / 2;

			const z = getZBySize(image.size);
			arr.push([x, y, z]);
		}
		return arr;
	}, [count, cols, rows, viewport.width, viewport.height, imageFiles]);

	// 回転速度（メモ化） - 可視性状態に応じて調整
	const speeds = useMemo(() => {
		const baseSpeed = 0.03;
		let speedMultiplier = 1;

		switch (visibilityState) {
			case 'hidden':
				speedMultiplier = 0;
				break;
			case 'approaching':
				speedMultiplier = 0.3;
				break;
			case 'partial':
				speedMultiplier = 0.7;
				break;
			case 'visible':
				speedMultiplier = 1.0;
				break;
		}

		return imageFiles.map(() =>
			(baseSpeed + Math.random() * 0.05) * speedMultiplier
		);
	}, [imageFiles.length, visibilityState]);

	// 画像リスト（メモ化）
	const images = useMemo(() => imageFiles.slice().reverse(), [imageFiles]);

	// 可視範囲の計算（パフォーマンス最適化） - デバッグのため全画像表示
	const visibleIndices = useMemo(() => {
		// デバッグ用に全画像を表示
		return Array.from({ length: images.length }, (_, i) => i);

		// 本来の可視性制御（コメントアウト）
		// switch (visibilityState) {
		//   case 'hidden':
		//     return [];
		//   case 'approaching':
		//     return Array.from({ length: Math.min(10, images.length) }, (_, i) => i);
		//   case 'partial':
		//     return Array.from({ length: Math.min(20, images.length) }, (_, i) => i);
		//   case 'visible':
		//     return Array.from({ length: images.length }, (_, i) => i);
		//   default:
		//     return [];
		// }
	}, [images.length]); // visibilityStateの依存関係を一時的に削除

	// 開発環境でのパフォーマンス監視
	useEffect(() => {
		if (process.env.NODE_ENV === 'development') {
			console.debug('[FloatingImagesFixInner] Render optimization:', {
				totalImages: images.length,
				visibleImages: visibleIndices.length,
				visibilityState,
				intersectionRatio: intersectionRatio.toFixed(3),
				isAnimating,
			});
		}
	}, [images.length, visibleIndices.length, visibilityState, intersectionRatio, isAnimating]);

	return (
		<>
			{visibleIndices.map((i) => {
				const image = images[i];
				if (!image) return null;

				return (
					<FloatingImageFix
						key={image.id}
						image={image}
						position={positions[i]}
						scale={scaleMap[image.size]}
						rotationSpeed={speeds[i]}
						isVisible={true} // デバッグ用に強制的にtrue
						visibilityState={visibilityState}
						globalIntersectionRatio={intersectionRatio}
					/>
				);
			})}
		</>
	);
};

/**
 * 可視性制御対応のFloatingImagesFixCanvas
 */
const FloatingImagesFixCanvas: React.FC<FloatingImagesFixCanvasProps> = ({
	visibilityState,
	intersectionRatio,
	canvasFrameloop,
	isAnimating,
	priority
}) => {
	const { imageFiles, scaleMap } = useResponsiveImages();
	const canvasRef = useRef<HTMLCanvasElement>(null);

	// Canvas要素への参照設定とパフォーマンス監視
	useEffect(() => {
		if (canvasRef.current && process.env.NODE_ENV === 'development') {
			const canvas = canvasRef.current;
			console.debug('[FloatingImagesFixCanvas] Canvas initialized:', {
				width: canvas.width,
				height: canvas.height,
				frameloop: canvasFrameloop,
				visibilityState,
				priority,
			});
		}
	}, [canvasFrameloop, visibilityState, priority]);

	// WebGLコンテキストの監視
	useEffect(() => {
		if (!canvasRef.current) return;

		const canvas = canvasRef.current;

		const handleContextLost = (event: Event) => {
			event.preventDefault();
			console.warn('[FloatingImagesFixCanvas] WebGL context lost');
		};

		const handleContextRestored = () => {
			console.info('[FloatingImagesFixCanvas] WebGL context restored');
		};

		canvas.addEventListener('webglcontextlost', handleContextLost);
		canvas.addEventListener('webglcontextrestored', handleContextRestored);

		return () => {
			canvas.removeEventListener('webglcontextlost', handleContextLost);
			canvas.removeEventListener('webglcontextrestored', handleContextRestored);
		};
	}, []);

	// パフォーマンス最適化: 非表示時は完全に非レンダリング
	if (visibilityState === 'hidden') {
		return null;
	}

	return (
		<Canvas
			ref={canvasRef}
			className="w-full h-full hidden sm:block"
			gl={{
				antialias: false,
				powerPreference: 'high-performance', // パフォーマンス優先
				alpha: true,
				premultipliedAlpha: true,
				preserveDrawingBuffer: false, // メモリ節約
			}}
			dpr={Math.min(window.devicePixelRatio, 2)} // DPR制限でパフォーマンス向上
			shadows={false}
			frameloop={canvasFrameloop}
			performance={{
				min: 0.5, // 最小パフォーマンス閾値
				max: 1.0,
				debounce: 200, // デバウンス時間
			}}
			onCreated={(state) => {
				// Canvas作成時の最適化設定
				const { gl } = state;
				gl.setClearColor(0x000000, 0); // 透明背景

				if (process.env.NODE_ENV === 'development') {
					console.info('[FloatingImagesFixCanvas] Canvas created with optimization:', {
						renderer: gl.info.render,
						memory: gl.info.memory,
						maxTextures: gl.capabilities.maxTextures,
					});
				}
			}}
		>
			<FloatingImagesFixInner
				imageFiles={imageFiles}
				scaleMap={scaleMap}
				visibilityState={visibilityState}
				intersectionRatio={intersectionRatio}
				isAnimating={isAnimating}
			/>
		</Canvas>
	);
};

export default FloatingImagesFixCanvas;
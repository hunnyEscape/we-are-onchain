'use client';

import React, { useMemo } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import FloatingImageFix from './FloatingImageFix';
import { ImageSize,ImageFile } from './constants';
import { useResponsiveImages } from './useResponsiveImages';

const CANVAS_DEPTH = 3; // 奥行き全体の幅
const PADDING_X = 0.2;  // 横方向パディング
const PADDING_Y = 1.5;    // 縦方向パディング

const getZBySize = (size: ImageSize) => {
	if (size === 'L') return CANVAS_DEPTH * 0.42 + Math.random();
	if (size === 'M') return Math.random() * 2 - 1;
	return -CANVAS_DEPTH * 0.42 + Math.random();
};

const FloatingImagesFixInner: React.FC<{
	imageFiles: ImageFile[];  // any[] から ImageFile[] に変更
	scaleMap: Record<ImageSize, number>;
}> = ({ imageFiles, scaleMap }) => {
	const { viewport } = useThree();
	const count = imageFiles.length;
	const cols = Math.ceil(Math.sqrt(count));
	const rows = Math.ceil(count / cols);

	const positions = useMemo(() => {
		const arr: [number, number, number][] = [];
		const images = imageFiles.slice().reverse();

		for (let i = 0; i < count; i++) {
			const col = i % cols;
			const row = Math.floor(i / cols);
			const image = images[i];

			// パディングX/Yをそれぞれ使用
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
	}, [count, cols, rows, viewport.width, viewport.height]);

	const speeds = useMemo(
		() => imageFiles.map(() => 0.03 + Math.random() * 0.05),
		[]
	);

	const images = useMemo(() => imageFiles.slice().reverse(), []);

	return (
		<>
			{images.map((image, i) => (
				<FloatingImageFix
					key={image.id}
					image={image}
					position={positions[i]}
					scale={scaleMap[image.size]}
					rotationSpeed={speeds[i]}
				/>
			))}
		</>
	);
};

const FloatingImagesFixCanvas: React.FC = () => {
	const { imageFiles, scaleMap } = useResponsiveImages();

	return (
		<Canvas
			className="w-full h-full hidden sm:block"
			gl={{ antialias: false }}
			dpr={1}
			shadows={false}
			frameloop="always"
		>
			<FloatingImagesFixInner imageFiles={imageFiles} scaleMap={scaleMap} />
		</Canvas>
	);
};

export default FloatingImagesFixCanvas;
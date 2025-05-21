'use client';

import React, { useMemo } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import FloatingImageFix from './FloatingImageFix';
import { imageFiles, SCALE_MAP, ImageSize } from './constants';

const CANVAS_DEPTH = 5; // 奥行き全体の幅
const PADDING = 0.3;    // viewportパディング（Three.js空間単位）

// 画像サイズごとにzの層を指定
const getZBySize = (size: ImageSize) => {
	if (size === 'L') return CANVAS_DEPTH * 0.42 + Math.random();      // 一番前
	if (size === 'M') return Math.random() * 2 - 1;                    // 中央付近
	return -CANVAS_DEPTH * 0.42 + Math.random();                       // 一番奥
};

// Canvas内でviewportを使い配置
const FloatingImagesFixInner: React.FC = () => {
	const { viewport } = useThree();
	const count = imageFiles.length;
	const cols = Math.ceil(Math.sqrt(count));
	const rows = Math.ceil(count / cols);

	// 配置計算
	const positions = useMemo(() => {
		const arr: [number, number, number][] = [];
		// 逆順描画（最新画像ほど最前面に来るように）
		const images = imageFiles.slice().reverse();

		for (let i = 0; i < count; i++) {
			const col = i % cols;
			const row = Math.floor(i / cols);
			const image = images[i];

			// XY: 画面内に等間隔で配置（paddingつき）
			const x =
				((col + 0.5) / cols) * (viewport.width - PADDING * 2) +
				PADDING -
				viewport.width / 2;
			const y =
				((row + 0.5) / rows) * (viewport.height - PADDING * 2) +
				PADDING -
				viewport.height / 2;

			// Z: L/M/Sごとに層を分ける
			const z = getZBySize(image.size);

			arr.push([x, y, z]);
		}
		return arr;
	}, [count, cols, rows, viewport.width, viewport.height]);

	const speeds = useMemo(
		() => imageFiles.map(() => 0.03 + Math.random() * 0.05), // 0.004〜0.008
		[]
	);

	// 配置順を逆転
	const images = useMemo(() => imageFiles.slice().reverse(), []);

	return (
		<>
			{images.map((image, i) => (
				<FloatingImageFix
					key={image.id}
					image={image}
					position={positions[i]}
					scale={SCALE_MAP[image.size]}
					rotationSpeed={speeds[i]}
				/>
			))}
			<ambientLight intensity={0.8} />
		</>
	);
};

const FloatingImagesFixCanvas: React.FC = () => {
	return (
		<Canvas
			camera={{ position: [0, 0, 32], fov: 40 }}
			style={{ width: '100%', height: '100%' }}
			gl={{ antialias: true, alpha: false }}
			dpr={[1, 2]}
		>
			<color attach="background" args={['#070c12']} />
			<FloatingImagesFixInner />
		</Canvas>
	);
};

export default FloatingImagesFixCanvas;

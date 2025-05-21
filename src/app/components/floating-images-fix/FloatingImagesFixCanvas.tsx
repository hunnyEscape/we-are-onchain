// src/app/components/floating-images-fix/FloatingImagesFixCanvas.tsx

'use client';

import React, { useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import FloatingImageFix from './FloatingImageFix';
import { imageFiles, SCALE_MAP } from './constants';

const CANVAS_DEPTH = 8; // 奥行きを少しばらけさせる用

// 画像の配置を決定するロジック
const generatePositions = (count: number): [number, number, number][] => {
	const positions: [number, number, number][] = [];
	const cols = Math.ceil(Math.sqrt(count));
	const rows = Math.ceil(count / cols);
	const spacingX = 5;
	const spacingY = 5;

	for (let i = 0; i < count; i++) {
		const col = i % cols;
		const row = Math.floor(i / cols);

		// 格子状＋ランダムオフセット
		const x = (col - cols / 2) * spacingX + (Math.random() - 0.5) * 1.8;
		const y = (row - rows / 2) * spacingY + (Math.random() - 0.5) * 1.8;
		const z = (Math.random() - 0.5) * CANVAS_DEPTH;
		positions.push([x, y, z]);
	}
	return positions;
};

const FloatingImagesFixCanvas: React.FC = () => {
	// 配置・回転パラメータは初期化時に固定
	const positions = useMemo(() => generatePositions(imageFiles.length), []);
	const speeds = useMemo(
		() => imageFiles.map(() => 0.08 + Math.random() * 0.12), // 0.08～0.2くらい
		[]
	);

	return (
		<Canvas
			camera={{ position: [0, 0, 32], fov: 40 }}
			style={{ width: '100%', height: '100%' }}
			gl={{ antialias: true, alpha: false }}
			dpr={[1, 2]}
		>
			{/* 背景色 */}
			<color attach="background" args={['#070c12']} />

			{/* 全画像を配置 */}
			{imageFiles.map((image, i) => (
				<FloatingImageFix
					key={image.id}
					image={image}
					position={positions[i]}
					scale={SCALE_MAP[image.size]}
					rotationSpeed={speeds[i]}
				/>
			))}

			{/* 環境光など最低限でOK（エフェクトは後述で追加可） */}
			<ambientLight intensity={0.8} />
		</Canvas>
	);
};

export default FloatingImagesFixCanvas;

'use client';

import React, { Suspense, useState, useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { ScrollControls, Preload, Scroll, Image as DreiImage } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useScroll } from '@react-three/drei';
// 不足している型定義とサイズ定数を追加
interface ImageItemProps {
	image: any;  // 一時的に any 型に
	position: [number, number, number];
	scrollProgress: number;
	isVisible?: boolean;
	index: number;
}

// 定数の追加
const SIZE_SCALES = {
	S: 1.5,
	M: 2.5,
	L: 4.0
};

// スクロール設定
const SCROLL_SETTINGS = {
	damping: 0.2,
	pages: 3,
	distance: 1.0
};

interface PepeGalleryProps {
	className?: string;
}

const PepeGallery: React.FC<PepeGalleryProps> = ({ className = '' }) => {
	const [isLoading, setIsLoading] = useState(true);

	// 簡略化のため、画像プリロードを省略
	useEffect(() => {
		// ちょっとだけ待ってからローディング状態を解除
		const timer = setTimeout(() => {
			setIsLoading(false);
			console.log('Loading complete');
		}, 1000);

		return () => clearTimeout(timer);
	}, []);

	// テスト用の画像データ
	const testImage = {
		id: 1,
		filename: '1L.webp',
		size: 'L',
		path: 'https://d1abhb48aypmuo.cloudfront.net/we-are-onchain/pepe/1L.webp'
	};

	// ImageItemコンポーネント
	const ImageItem: React.FC<ImageItemProps> = ({
		image,
		position,
		scrollProgress,
		isVisible = true,
		index
	}) => {
		const ref = useRef<any>(null);

		// 単純化: 画像が文字列の場合の対応
		let imageUrl = '';
		let imageSize = 'L';

		if (typeof image === 'string') {
			imageUrl = image;
		} else {
			imageUrl = image.path;
			imageSize = image.size;
		}

		const scale = SIZE_SCALES[imageSize as keyof typeof SIZE_SCALES];

		// スケールのサイズに基づく調整（単純化）
		const scaleFactor = typeof scale === 'number' ? scale :
			Array.isArray(scale) ? [scale[0], scale[1], 1] : [scale, scale, 1];

		if (!isVisible) {
			return null;
		}

		// 単純なDreiImageの表示
		return (
			<DreiImage
				ref={ref}
				url={imageUrl}
				position={position}
				scale={scaleFactor}
				transparent
				opacity={1}
			/>
		);
	};
	const testImages = [
		{
			id: 1,
			filename: '1L.webp',
			size: 'L',
			path: 'https://d1abhb48aypmuo.cloudfront.net/we-are-onchain/pepe/1L.webp'
		},
		{
			id: 2,
			filename: '2M.webp',
			size: 'M',
			path: 'https://d1abhb48aypmuo.cloudfront.net/we-are-onchain/pepe/2M.webp'
		},
		{
			id: 3,
			filename: '6L.webp',
			size: 'L',
			path: 'https://d1abhb48aypmuo.cloudfront.net/we-are-onchain/pepe/6L.webp'
		}
	];

	return (
		<div className={`w-full h-screen relative overflow-hidden ${className}`}>
			{/* ローディング状態の表示 */}
			{isLoading && (
				<div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-80 z-50">
					<div className="text-white text-2xl">Loading Gallery...</div>
				</div>
			)}

			<Canvas
				camera={{ position: [0, 0, 15], fov: 15 }}
				className="w-full h-full"
				gl={{
					antialias: true,
					alpha: true,
					preserveDrawingBuffer: true
				}}
				dpr={[1, 1.5]}
			>
				<color attach="background" args={['#d8d7d7']} />

				<ambientLight intensity={0.5} />
				<pointLight position={[10, 10, 10]} />

				<Suspense fallback={null}>
					<ScrollControls
						damping={SCROLL_SETTINGS.damping}
						pages={SCROLL_SETTINGS.pages}
						distance={SCROLL_SETTINGS.distance}
					>
						<Scroll>
							{/* テスト用のボックスは残しておくか、必要なければ削除 */}
							<mesh position={[0, 0, 0]}>
								<boxGeometry args={[2, 2, 2]} />
								<meshStandardMaterial color="blue" />
							</mesh>

							{/* 複数の画像を追加 */}
							{testImages.map((img, index) => (
								<ImageItem
									key={img.id}
									image={img}
									position={[
										(index % 2) * 4 - 2, // X座標: 左右に配置
										-index * 3,          // Y座標: 下に配置
										0                    // Z座標
									]}
									scrollProgress={0}
									isVisible={true}
									index={index}
								/>
							))}
						</Scroll>
					</ScrollControls>

					<Preload all />
				</Suspense>
			</Canvas>
		</div>
	);
};

export default PepeGallery;
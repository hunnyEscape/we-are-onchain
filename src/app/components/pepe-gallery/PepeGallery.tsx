'use client';

import React, { Suspense, useState, useEffect, useRef, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Image as DreiImage, Preload } from '@react-three/drei';

// サイズ定数
const SIZE_SCALES = {
	S: 1.5,
	M: 2.5,
	L: 4.0
};

// スクロール設定
const SCROLL_SETTINGS = {
	pages: 3
};

// テスト用の画像データ
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

// スクロール位置をコンテキスト経由で共有
const ScrollContext = React.createContext(0);

// ImageItemコンポーネント
const ImageItem = ({ image, position, index }) => {
	const ref = useRef(null);
	const scrollOffset = React.useContext(ScrollContext);

	let imageUrl = '';
	let imageSize = 'L';

	if (typeof image === 'string') {
		imageUrl = image;
	} else {
		imageUrl = image.path;
		imageSize = image.size;
	}

	const scale = SIZE_SCALES[imageSize];
	const scaleFactor = typeof scale === 'number' ? scale :
		Array.isArray(scale) ? [scale[0], scale[1], 1] : [scale, scale, 1];

	// スクロールに応じた効果
	useFrame(() => {
		if (ref.current && ref.current.material) {
			// 各画像に異なるスクロール範囲でズーム効果を適用
			const startPoint = index * 0.2;
			const duration = 0.3;
			const endPoint = startPoint + duration;

			// スクロール位置が範囲内にあるか確認
			let progress = 0;
			if (scrollOffset > startPoint && scrollOffset < endPoint) {
				progress = (scrollOffset - startPoint) / duration;
			} else if (scrollOffset >= endPoint) {
				progress = 1;
			}

			// ズーム効果の適用
			const zoom = 1 + (progress / 3);
			ref.current.material.zoom = zoom;

			// 視差効果 - Y位置をスクロールに応じて調整
			const baseY = position[1];
			const parallaxStrength = index + 1;
			const yOffset = baseY - (scrollOffset * 3 * parallaxStrength);
			ref.current.position.y = yOffset;
		}
	});

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

// メインのThree.jsシーン
const ThreeScene = () => {
	return (
		<>






			{/* 複数の画像を追加 */}
			{testImages.map((img, index) => (
				<ImageItem
					key={img.id}
					image={img}
					position={[
						(index % 2) * 4 - 2,
						-index * 3,
						0
					]}
					index={index}
				/>
			))}
		</>
	);
};

// メインコンポーネント
const PepeGallery = ({ className = '' }) => {
	const [isLoading, setIsLoading] = useState(true);
	const [scrollOffset, setScrollOffset] = useState(0);
	const containerRef = useRef(null);

	// スクロールハンドラー
	const handleScroll = useCallback(() => {
		if (containerRef.current) {
			// スクロール位置を0~1の範囲に正規化
			const scrollHeight = containerRef.current.scrollHeight - window.innerHeight;
			const scrollTop = containerRef.current.scrollTop;
			const normalized = Math.max(0, Math.min(1, scrollTop / scrollHeight));
			setScrollOffset(normalized);
		}
	}, []);

	// コンポーネントマウント時の処理
	useEffect(() => {
		// 初期ロード
		const timer = setTimeout(() => {
			setIsLoading(false);
		}, 1000);

		// スクロールイベントの設定
		const currentRef = containerRef.current;
		if (currentRef) {
			currentRef.addEventListener('scroll', handleScroll);
		}

		// クリーンアップ
		return () => {
			clearTimeout(timer);
			if (currentRef) {
				currentRef.removeEventListener('scroll', handleScroll);
			}
		};
	}, [handleScroll]);

	// 仮想スクロールエリアの高さ
	const scrollHeight = `${SCROLL_SETTINGS.pages * 100}vh`;

	return (
		<div
			ref={containerRef}
			className={`w-full h-screen overflow-auto ${className}`}
			style={{ scrollBehavior: 'smooth' }}
		>
			{/* ローディング表示 */}
			{isLoading && (
				<div className="fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-80 z-50">
					<div className="text-white text-2xl">Loading Gallery...</div>
				</div>
			)}

			{/* スクロール可能なコンテンツエリア */}
			<div style={{ height: scrollHeight, position: 'relative' }}>
				{/* Three.jsコンテンツ（固定位置） */}
				<div className="fixed inset-0">
					<ScrollContext.Provider value={scrollOffset}>
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
							<Suspense fallback={null}>
								<ThreeScene />
								<Preload all />
							</Suspense>
						</Canvas>
					</ScrollContext.Provider>
				</div>

				{/* HTML/DOMコンテンツ（スクロール可能） */}
				<div className="relative w-full h-full" style={{ pointerEvents: 'none' }}>
					{/* 例：スクロールに連動するテキスト */}
					<div
						className="absolute top-[100vh] left-10 text-4xl font-bold"
						style={{ pointerEvents: 'auto' }}
					>
						Pepe Gallery
					</div>

					<div
						className="absolute top-[200vh] right-10 text-4xl font-bold"
						style={{ pointerEvents: 'auto' }}
					>
						Collection
					</div>
				</div>
			</div>
		</div>
	);
};

export default PepeGallery;
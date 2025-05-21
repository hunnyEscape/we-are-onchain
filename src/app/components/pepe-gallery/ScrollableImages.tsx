'use client';

import { useRef, useState, useEffect, useMemo } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { useScroll, Scroll } from '@react-three/drei';
import { imageFiles } from './utils/constants';
import { calculateOptimalImagePositions } from './utils/imageLoader';
import ImageItem from './ImageItem';

const ScrollableImages: React.FC = () => {
	// スクロールデータを取得
	const data = useScroll();
	const groupRef = useRef<THREE.Group>(null);

	// ビューポートのサイズを取得
	const { width, height } = useThree((state) => state.viewport);

	// 画面に表示可能な画像数の制限（パフォーマンス最適化）
	const [visibleRange, setVisibleRange] = useState({ start: 0, end: 12 });

	// サイズに基づいた最適な画像配置を計算
	const imagePositions = useMemo(() => {
		return calculateOptimalImagePositions(imageFiles, width, height);
	}, [width, height]);

	// スクロール位置に基づいて表示する画像範囲を更新
	useEffect(() => {
		const updateVisibleRange = () => {
			// スクロール位置に基づいて表示範囲を計算
			const scrollOffset = Math.floor(data.offset * imageFiles.length);
			const start = Math.max(0, scrollOffset - 6);
			const end = Math.min(imageFiles.length, scrollOffset + 12);

			setVisibleRange({ start, end });
		};

		// スクロールイベントのリスナーを追加
		const scrollElement = data.el;
		if (scrollElement) {
			scrollElement.addEventListener('scroll', updateVisibleRange);
		}

		// 初期表示範囲を設定
		updateVisibleRange();

		// クリーンアップ関数
		return () => {
			if (scrollElement) {
				scrollElement.removeEventListener('scroll', updateVisibleRange);
			}
		};
	}, [data]);

	// 各フレームでのスクロールに基づくアニメーション
	useFrame(() => {
		if (groupRef.current) {
			// 各画像の状態を更新（必要に応じて）
			if (groupRef.current.children.length > 0) {
				// 例: スクロール範囲に基づく透明度や位置の調整
				const scrollRange = data.range(0, 1);

				// 必要に応じてここに追加のスクロールアニメーションを実装
			}
		}
	});

	return (
		<Scroll>
			<group ref={groupRef}>
				{imageFiles.map((image, index) => {
					// 画像の位置を取得（デフォルト位置を設定）
					const position = imagePositions[image.id] || [
						(index % 5 - 2) * 2,
						-Math.floor(index / 5) * 3,
						0
					];

					// スクロール範囲内の画像のみをレンダリング
					const isVisible = index >= visibleRange.start && index <= visibleRange.end;

					// 画像のスクロール進行状況を計算
					const scrollProgress = data.range(
						index / imageFiles.length,
						1 / imageFiles.length
					);

					return (
						<ImageItem
							key={image.id}
							image={image}
							position={position}
							scrollProgress={scrollProgress}
							isVisible={isVisible}
							index={index}
						/>
					);
				})}
			</group>
		</Scroll>
	);
};

export default ScrollableImages;
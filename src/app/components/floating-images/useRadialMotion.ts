'use client';

import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Vector3 } from 'three';
import { SizeType } from '../floating-images/constants';

interface RadialMotionProps {
	size: SizeType;
	index: number;
	totalItems: number;
	maxDistance?: number;
	speed?: number;
}

interface RadialMotionState {
	position: Vector3;
	scale: number;
	opacity: number;
}

/**
 * 中央から放射状に向かってくるアニメーション用のカスタムフック
 */
export const useRadialMotion = ({
	size,
	index,
	totalItems,
	maxDistance = 30, // 最大移動距離
	speed = 0.07 // 速度を上げる
}: RadialMotionProps): RadialMotionState => {
	// 初期状態の設定
	const [state, setState] = useState<RadialMotionState>({
		position: new Vector3(0, 0, -0.1), // 中央近くからスタート
		scale: 0.001,
		opacity: 0
	});

	// アニメーションパラメータ
	const motionRef = useRef({
		// サイズに基づいた設定
		baseScale: size === 'S' ? 0.9 : size === 'M' ? 1.5 : 2.2,
		baseSpeed: size === 'S' ? speed * 1.3 : size === 'M' ? speed : speed * 0.7,

		// 方向ベクトル（ランダムな方向）- より多くの方向を用意
		direction: getRandomDirection(index, totalItems),

		// 現在の距離
		distance: 0.1 + (index % 5) * 0.5, // 様々な距離からスタート（密度向上）

		// アニメーション状態
		time: 0
	});

	// ランダムな方向を取得する関数 - より複雑な分布
	function getRandomDirection(index: number, total: number) {
		// 黄金比を使用してより均等に分布させる
		const goldenRatio = 1.618033988749895;
		const goldenAngle = Math.PI * 2 * (1 - 1 / goldenRatio);

		// 基本方向
		let phi = index * goldenAngle;
		let theta = Math.acos(1 - 2 * ((index % 20) / 20));

		// 少しランダム性を加える
		phi += (Math.random() - 0.5) * 0.2;
		theta += (Math.random() - 0.5) * 0.2;

		// 球面座標から直交座標へ変換
		const x = Math.sin(theta) * Math.cos(phi);
		const y = Math.sin(theta) * Math.sin(phi);
		const z = Math.cos(theta);

		return new Vector3(x, y, Math.abs(z)); // Z軸は常に正（前方へ）
	}

	// フレームごとのアニメーション更新
	useFrame((_, delta) => {
		// 時間の更新
		motionRef.current.time += delta;

		// 距離の更新（中央から外へ）
		motionRef.current.distance += motionRef.current.baseSpeed * delta * 15;

		// 一定の距離に達したら中央付近に戻す（ループ）
		if (motionRef.current.distance > maxDistance) {
			motionRef.current.distance = 0.1 + Math.random() * 0.5;
			motionRef.current.direction = getRandomDirection(index + Math.floor(Math.random() * 100), totalItems);
		}

		// 現在の距離に基づく位置ベクトル
		const position = motionRef.current.direction.clone().multiplyScalar(motionRef.current.distance);

		// 距離に基づくスケール
		// 近いほど小さく、遠いほど大きく
		const normalizedDistance = Math.min(1, motionRef.current.distance / maxDistance);
		const currentScale = motionRef.current.baseScale * normalizedDistance;

		// 透明度（近い/遠いでフェード）
		let currentOpacity = 1.0;
		if (normalizedDistance < 0.1) {
			// 近くでフェードイン
			currentOpacity = normalizedDistance / 0.1;
		} else if (normalizedDistance > 0.85) {
			// 遠くでフェードアウト
			currentOpacity = 1 - (normalizedDistance - 0.85) / 0.15;
		}

		// 状態の更新
		setState({
			position,
			scale: currentScale,
			opacity: currentOpacity
		});
	});

	return state;
};

export default useRadialMotion;
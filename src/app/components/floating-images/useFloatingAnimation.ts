'use client';

import { useState, useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Vector3 } from 'three';
import { animationConfig } from './constants';
import { SizeType } from './types';

interface UseFloatingAnimationProps {
	size: SizeType;
	index: number;
	initialDelay: number;
	aspectRatio?: number;
}

// アニメーションのランダムな範囲から値を取得
const getRandomInRange = (min: number, max: number) => {
	return min + Math.random() * (max - min);
};

export const useFloatingAnimation = ({
	size,
	index,
	initialDelay,
	aspectRatio = 1
}: UseFloatingAnimationProps) => {
	const { viewport } = useThree();
	const sizeConfig = animationConfig.sizeConfig[size];
	const commonConfig = animationConfig.common;

	// アニメーション状態
	const [state, setState] = useState({
		position: { x: 0, y: 0, z: 0 },
		rotation: { x: 0, y: 0, z: 0 },
		scale: 0.001,
		opacity: 0
	});

	// アニメーションパラメータ
	const animParams = useRef({
		// 位置
		startX: getRandomInRange(-viewport.width / 2 + 2, viewport.width / 2 - 2),
		startY: -viewport.height - 5 - index % 3,
		targetY: viewport.height + 5,

		// 速度
		speed: getRandomInRange(sizeConfig.speed[0], sizeConfig.speed[1]),
		rotationSpeed: getRandomInRange(sizeConfig.rotationSpeed[0], sizeConfig.rotationSpeed[1]),

		// サイズと深度
		scale: getRandomInRange(sizeConfig.scale[0], sizeConfig.scale[1]),
		zPosition: getRandomInRange(sizeConfig.zPosition[0], sizeConfig.zPosition[1]),

		// 透明度
		opacity: getRandomInRange(sizeConfig.opacity[0], sizeConfig.opacity[1]),

		// アニメーション制御
		time: 0,
		duration: getRandomInRange(commonConfig.duration[0], commonConfig.duration[1]),
		delay: initialDelay,
		started: false,
		completed: false
	});

	// アニメーション初期化（ランダム化）
	useEffect(() => {
		// 視覚的な多様性のためのランダム要素
		const sway = Math.sin(index * 0.5) * 2; // 左右の揺れ
		const randomRotation = Math.random() * Math.PI * 0.1 - Math.PI * 0.05; // 少しだけランダムな回転

		animParams.current = {
			...animParams.current,
			// 画面を最大限に使うためのポジション調整
			startX: getRandomInRange(-viewport.width / 2 + 2, viewport.width / 2 - 2),
			startY: -viewport.height - 5 - (index % 3) * 2,
			// 揺れと傾き
			sway,
			rotationOffset: randomRotation
		};
	}, [viewport, index]);

	// アニメーションフレーム
	useFrame((state, delta) => {
		// 初期遅延
		if (!animParams.current.started) {
			animParams.current.delay -= delta * 1000;
			if (animParams.current.delay <= 0) {
				animParams.current.started = true;
			} else {
				return;
			}
		}

		// アニメーション終了判定
		if (animParams.current.completed) {
			return;
		}

		// 時間の更新
		animParams.current.time += delta;

		// アニメーション進行度 (0-1)
		const progress = Math.min(
			animParams.current.time / (animParams.current.duration / 1000),
			1
		);

		// イーズアウト関数
		const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
		const easedProgress = easeOut(progress);

		// Y位置の更新（下から上へ）
		const y = animParams.current.startY + (
			animParams.current.targetY - animParams.current.startY
		) * easedProgress;

		// X位置の揺れ（サイズに応じて異なる）
		const swayAmount = Math.sin(animParams.current.time * 0.5) * (4 - "SML".indexOf(size));
		const x = animParams.current.startX + swayAmount;

		// Z位置（奥行き）
		const z = animParams.current.zPosition;

		// 回転の更新
		const rotX = Math.sin(animParams.current.time * 0.2) * 0.03;
		const rotY = Math.cos(animParams.current.time * 0.3) * 0.03;
		const rotZ = animParams.current.time * animParams.current.rotationSpeed;

		// スケールの更新（アニメーション開始時に徐々に拡大）
		const currentScale = Math.min(
			animParams.current.scale,
			animParams.current.scale * Math.min(progress * 3, 1)
		);

		// 透明度の更新（フェードイン・フェードアウト）
		let currentOpacity = animParams.current.opacity;

		// 画面の始めと終わりでフェード効果
		if (progress < 0.1) {
			currentOpacity = animParams.current.opacity * (progress / 0.1);
		} else if (progress > 0.9) {
			currentOpacity = animParams.current.opacity * (1 - (progress - 0.9) / 0.1);
		}

		// アニメーション完了判定
		if (progress >= 1) {
			animParams.current.completed = true;
		}

		// 状態の更新
		setState({
			position: { x, y, z },
			rotation: { x: rotX, y: rotY, z: rotZ },
			scale: currentScale,
			opacity: currentOpacity
		});
	});

	return state;
};
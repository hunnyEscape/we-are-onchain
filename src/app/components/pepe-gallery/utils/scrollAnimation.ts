import { MutableRefObject } from 'react';
import { Object3D, Vector3, Euler } from 'three';
import { easing } from 'maath';

/**
 * スクロール位置に基づくアニメーション値の計算
 * @param start 効果の開始位置 (0-1)
 * @param end 効果の終了位置 (0-1)
 * @param scrollOffset 現在のスクロール位置 (0-1)
 * @param minValue 最小値
 * @param maxValue 最大値
 * @returns 計算された値
 */
export const calculateScrollValue = (
	start: number,
	end: number,
	scrollOffset: number,
	minValue: number,
	maxValue: number
): number => {
	// スクロール範囲外の場合
	if (scrollOffset < start) return minValue;
	if (scrollOffset > end) return maxValue;

	// 範囲内の場合は線形補間
	const normalizedOffset = (scrollOffset - start) / (end - start);
	return minValue + normalizedOffset * (maxValue - minValue);
};

/**
 * スクロール位置に基づく回転効果
 */
export const applyScrollRotation = (
	ref: MutableRefObject<Object3D | null>,
	scrollOffset: number,
	delta: number,
	intensity: number = 0.1
): void => {
	if (!ref.current) return;

	// スクロール位置に基づく回転角度の計算
	const targetRotation = new Euler(
		0,
		scrollOffset * Math.PI * intensity,
		0
	);

	// 滑らかな回転の適用
	easing.dampE(
		ref.current.rotation,
		[targetRotation.x, targetRotation.y, targetRotation.z],
		0.3,
		delta
	);
};

/**
 * スクロール位置に基づくズーム効果
 */
export const applyScrollZoom = (
	ref: MutableRefObject<Object3D | null>,
	scrollOffset: number,
	delta: number,
	baseScale: number | [number, number, number] = 1,
	intensity: number = 0.2
): void => {
	if (!ref.current) return;

	// ベーススケールの処理
	const baseScaleVector = typeof baseScale === 'number'
		? [baseScale, baseScale, baseScale]
		: baseScale;

	// スクロール位置に基づくスケール係数の計算
	const zoomFactor = 1 + (scrollOffset * intensity);

	// 目標スケールの計算
	const targetScale = [
		baseScaleVector[0] * zoomFactor,
		baseScaleVector[1] * zoomFactor,
		baseScaleVector[2]
	];

	// 滑らかなスケールの適用
	easing.damp3(
		ref.current.scale,
		targetScale,
		0.2,
		delta
	);
};

/**
 * スクロール位置に基づく移動効果
 */
export const applyScrollMovement = (
	ref: MutableRefObject<Object3D | null>,
	scrollOffset: number,
	delta: number,
	basePosition: [number, number, number],
	movementVector: [number, number, number] = [0, -1, 0],
	intensity: number = 1
): void => {
	if (!ref.current) return;

	// スクロール位置に基づく移動量の計算
	const targetPosition = [
		basePosition[0] + (movementVector[0] * scrollOffset * intensity),
		basePosition[1] + (movementVector[1] * scrollOffset * intensity),
		basePosition[2] + (movementVector[2] * scrollOffset * intensity)
	];

	// 滑らかな移動の適用
	easing.damp3(
		ref.current.position,
		targetPosition,
		0.15,
		delta
	);
};

/**
 * テキスト表示のフェードイン/アウト効果
 */
export const applyTextFadeEffect = (
	ref: MutableRefObject<any | null>,
	scrollOffset: number,
	visibleRange: [number, number], // [表示開始位置, 表示終了位置]
	delta: number
): void => {
	if (!ref.current || !ref.current.material) return;

	const [start, end] = visibleRange;
	const targetOpacity = calculateScrollValue(start, start + 0.1, scrollOffset, 0, 1);
	const fadeOutOpacity = calculateScrollValue(end - 0.1, end, scrollOffset, 1, 0);

	// 最終的な不透明度の計算
	const finalOpacity = Math.min(targetOpacity, fadeOutOpacity);

	// 滑らかな不透明度の適用
	easing.damp(
		ref.current.material,
		'opacity',
		finalOpacity,
		0.2,
		delta
	);
};

/**
 * 浮遊効果のアニメーション（時間ベース）
 */
export const applyFloatingAnimation = (
	ref: MutableRefObject<Object3D | null>,
	time: number,
	basePosition: [number, number, number],
	amplitude: number = 0.1
): void => {
	if (!ref.current) return;

	// 時間に基づく浮遊効果の計算
	const floatingY = Math.sin(time * 0.5) * amplitude;

	// 位置の更新
	ref.current.position.set(
		basePosition[0],
		basePosition[1] + floatingY,
		basePosition[2]
	);
};
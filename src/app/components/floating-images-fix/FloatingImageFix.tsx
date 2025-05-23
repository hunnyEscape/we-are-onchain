// src/app/components/floating-images-fix/FloatingImageFix.tsx

import { useRef, useState, useEffect } from 'react';
import { useFrame, extend } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import type { ImageFile } from './constants';
import { VisibilityState } from '../../types/visibility';
import * as THREE from 'three';

extend({
	Mesh: THREE.Mesh,
	PlaneGeometry: THREE.PlaneGeometry,
	MeshBasicMaterial: THREE.MeshBasicMaterial
});

interface FloatingImageFixProps {
	image: ImageFile;
	position: [number, number, number];
	scale: number;
	rotationSpeed?: number;
	isVisible: boolean;
	visibilityState: VisibilityState;
	globalIntersectionRatio: number;
}

/**
 * 個別画像の可視性制御対応版
 * 画面内の画像のみアニメーション実行
 */
const FloatingImageFix: React.FC<FloatingImageFixProps> = ({
	image,
	position,
	scale,
	rotationSpeed = 0.005,
	isVisible,
	visibilityState,
	globalIntersectionRatio,
}) => {
	const meshRef = useRef<THREE.Mesh>(null);
	const texture = useTexture(image.path);

	// 個別画像の可視性状態
	const [isInViewport, setIsInViewport] = useState(false);
	const [shouldAnimate, setShouldAnimate] = useState(false);
	const [opacity, setOpacity] = useState(1);

	// 最新のrotationSpeedを参照するref
	const speedRef = useRef(rotationSpeed);
	const lastFrameTimeRef = useRef(0);

	useEffect(() => {
		speedRef.current = rotationSpeed;
	}, [rotationSpeed]);

	// アスペクト比の計算
	const [aspect, setAspect] = useState(1);
	useEffect(() => {
		if (texture?.image) {
			setAspect(texture.image.width / texture.image.height);
		}
	}, [texture]);

	// 画面内判定の計算
	useEffect(() => {
		if (!meshRef.current) return;

		const mesh = meshRef.current;
		const meshPosition = mesh.position;

		// 簡易的な画面内判定（カメラ視野に基づく）
		const frustumCheck = () => {
			const camera = mesh.parent?.userData?.camera;
			if (!camera) {
				// フォールバック: Z位置に基づく簡易判定
				const isInFrustum = Math.abs(meshPosition.x) < 10 &&
					Math.abs(meshPosition.y) < 6 &&
					meshPosition.z > -5 && meshPosition.z < 5;
				return isInFrustum;
			}

			// より正確な視錐台判定（パフォーマンスを考慮して簡略化）
			const distance = meshPosition.distanceTo(camera.position);
			return distance < 15; // 15単位以内なら可視と判定
		};

		const inViewport = frustumCheck();
		setIsInViewport(inViewport);
	}, [position, globalIntersectionRatio]);

	// アニメーション状態の決定
	useEffect(() => {
		let shouldStart = false;

		switch (visibilityState) {
			case 'hidden':
				shouldStart = false;
				setOpacity(0);
				break;

			case 'approaching':
				shouldStart = isInViewport && globalIntersectionRatio > 0.05;
				setOpacity(0.3);
				break;

			case 'partial':
				shouldStart = isInViewport;
				setOpacity(0.6 + (globalIntersectionRatio * 0.4));
				break;

			case 'visible':
				shouldStart = true; // visible時は全画像をアニメーション
				setOpacity(1);
				break;
		}

		setShouldAnimate(shouldStart && isVisible);
	}, [visibilityState, isInViewport, globalIntersectionRatio, isVisible]);

	// パフォーマンス最適化されたuseFrame
	useFrame((state, delta) => {
		if (!meshRef.current || !shouldAnimate) return;

		const now = state.clock.elapsedTime;

		// フレームレート制限（60FPS以下に制限）
		if (now - lastFrameTimeRef.current < 1 / 60) return;

		lastFrameTimeRef.current = now;

		// 回転アニメーション
		meshRef.current.rotation.z += (speedRef.current ?? 0.06) * delta;

		// 可視性状態に応じた追加エフェクト
		if (visibilityState === 'visible' && globalIntersectionRatio > 0.8) {
			// 完全可視時の微細な浮遊効果
			const floatEffect = Math.sin(now * 0.5 + position[0]) * 0.02;
			meshRef.current.position.y = position[1] + floatEffect;
		}
	});

	// テクスチャの最適化
	useEffect(() => {
		if (texture) {
			// テクスチャ設定の最適化
			texture.generateMipmaps = false; // ミップマップ無効化でメモリ節約
			texture.minFilter = THREE.LinearFilter;
			texture.magFilter = THREE.LinearFilter;
			texture.flipY = false; // 不要な反転処理を無効化

			// 非可視時はテクスチャを一時的に解放
			if (visibilityState === 'hidden') {
				texture.needsUpdate = false;
			} else {
				texture.needsUpdate = true;
			}
		}
	}, [texture, visibilityState]);

	// メモリ管理: 長時間非表示の場合にテクスチャを解放
	useEffect(() => {
		if (visibilityState === 'hidden') {
			const timeout = setTimeout(() => {
				if (texture && meshRef.current) {
					// テクスチャの一時的な解放
					texture.dispose();
				}
			}, 5000); // 5秒後に解放

			return () => clearTimeout(timeout);
		}
	}, [visibilityState, texture]);

	// デバッグ情報（開発環境のみ）
	useEffect(() => {
		if (process.env.NODE_ENV === 'development' && image.id === 1) { // 最初の画像のみログ出力
			console.debug('[FloatingImageFix] State update:', {
				imageId: image.id,
				visibilityState,
				isInViewport,
				shouldAnimate,
				opacity,
				globalIntersectionRatio: globalIntersectionRatio.toFixed(3),
			});
		}
	}, [image.id, visibilityState, isInViewport, shouldAnimate, opacity, globalIntersectionRatio]);

	const width = scale;
	const height = scale / aspect;

	// 非表示時は何もレンダリングしない - デバッグのため一時的に無効化
	// if (visibilityState === 'hidden' || opacity === 0) {
	//   return null;
	// }

	return (
		// @ts-expect-error React Three Fiber JSX elements
		<mesh
			ref={meshRef}
			position={position}
			castShadow={false}
			receiveShadow={false}
			userData={{
				imageId: image.id,
				visibilityState,
				shouldAnimate,
				isInViewport
			}}
		>
			{/* @ts-expect-error React Three Fiber JSX elements */}
			<planeGeometry args={[width, height]} />
			{/* @ts-expect-error React Three Fiber JSX elements */}
			<meshBasicMaterial
				map={texture}
				transparent
				opacity={0.6} // 半透明に設定（60%の透明度）
				toneMapped={false}
				alphaTest={0.01} // 完全透明部分の描画スキップ
				depthWrite={false} // 半透明なのでデプス書き込み無効
			/>
			{/* @ts-expect-error React Three Fiber JSX elements */}
		</mesh>
	);
};

export default FloatingImageFix;
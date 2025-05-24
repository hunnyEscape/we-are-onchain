// PepeModel3D.tsx
'use client';

import React, { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF, useAnimations } from '@react-three/drei';
import * as THREE from 'three';
import { ModelTransform } from './types';
import { CONFIG } from './config/controlPoints';

interface PepeModel3DProps {
	transform: ModelTransform;
	url?: string;
}

export default function PepeModel3D({
	transform,
	url = `${process.env.NEXT_PUBLIC_CLOUDFRONT_URL}/pepe/push-up-pepe.glb`
}: PepeModel3DProps) {
	const { scene, animations } = useGLTF(url);
	const { actions, mixer } = useAnimations(animations, scene);
	const groupRef = useRef<THREE.Group>(null);

	// 現在の変換値を保持（スムーズな補間のため）
	const currentTransform = useRef<ModelTransform>({
		position: [0, 0, 0],
		rotation: [0, 0, 0],
		scale: [1, 1, 1]
	});

	// マテリアルとアニメーション初期化
	useEffect(() => {
		// 色管理を有効化
		THREE.ColorManagement.enabled = true;

		// 重ねられた2つのテキストオブジェクトの発光マテリアル設定
		scene.traverse((child) => {
			if (child instanceof THREE.Mesh && child.material) {
				const materials = Array.isArray(child.material) ? child.material : [child.material];

				materials.forEach((material) => {
					if (material instanceof THREE.MeshStandardMaterial) {
						// Text.001 (緑色発光)
						if (child.name === 'Text.001') {
							material.emissive = new THREE.Color(0x00ff00); // 緑色
							material.emissiveIntensity = 3.0;
							material.toneMapped = false; // 重要：色変換を防止
							// 少し前に配置
							child.position.z += 0.01;
							console.log('Applied green emissive to Text.001');
						}

						// Text.004 (オレンジ色発光)
						else if (child.name === 'Text.004') {
							material.emissive = new THREE.Color(0xff4500); // オレンジ色
							material.emissiveIntensity = 3.0;
							material.toneMapped = false; // 重要：色変換を防止
							// 少し後ろに配置
							child.position.z -= 0.01;
							console.log('Applied orange emissive to Text.004');
						}

						// その他のオブジェクトは既存のマテリアル設定を保持
						else if (material.emissive && !material.emissive.equals(new THREE.Color(0x000000))) {
							material.toneMapped = false; // 他の発光オブジェクトも色変換を防止
							if (material.emissiveIntensity === undefined || material.emissiveIntensity === 0) {
								material.emissiveIntensity = 1;
							}
						}
					}
				});
			}
		});

		// 既存のアニメーションを停止
		Object.values(actions).forEach((action) => action?.stop());

		// PushUpアニメーションを再生
		if (actions['PushUp']) {
			actions['PushUp'].reset().play();
		}

		// Armatureアニメーションがあれば再生
		const bodyKey = Object.keys(actions).find((key) =>
			key.includes('Armature')
		);
		if (bodyKey && actions[bodyKey]) {
			actions[bodyKey].reset().fadeIn(0.3).play();
		}
	}, [actions, scene]);

	// フレームごとの更新
	useFrame((_, delta) => {
		// アニメーションミキサーを更新
		mixer.update(delta);

		// スムーズな位置変更（線形補間）
		if (groupRef.current) {
			const group = groupRef.current;
			const lerpFactor = CONFIG.LERP_FACTOR;

			// 位置の補間
			const targetPos = new THREE.Vector3(...transform.position);
			group.position.lerp(targetPos, lerpFactor);

			// 回転の補間
			const targetRot = new THREE.Euler(...transform.rotation);
			group.rotation.x += (targetRot.x - group.rotation.x) * lerpFactor;
			group.rotation.y += (targetRot.y - group.rotation.y) * lerpFactor;
			group.rotation.z += (targetRot.z - group.rotation.z) * lerpFactor;

			// スケールの補間
			const targetScale = new THREE.Vector3(...transform.scale);
			group.scale.lerp(targetScale, lerpFactor);

			// デバッグ情報
			if (CONFIG.DEBUG_MODE) {
				currentTransform.current = {
					position: [group.position.x, group.position.y, group.position.z],
					rotation: [group.rotation.x, group.rotation.y, group.rotation.z],
					scale: [group.scale.x, group.scale.y, group.scale.z]
				};
			}
		}
	});

	// glTFファイルのマテリアルをそのまま適用
	return (
		// @ts-expect-error React Three Fiber JSX elements
		<group ref={groupRef}>
			{/* @ts-expect-error React Three Fiber JSX elements */}
			<primitive object={scene} />
			{/* @ts-expect-error React Three Fiber JSX elements */}
		</group>
	);
}

// モデルのプリロード
useGLTF.preload(`${process.env.NEXT_PUBLIC_CLOUDFRONT_URL}/pepe/push-up-pepe.glb`);
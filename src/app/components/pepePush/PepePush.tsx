'use client';

import React, { useEffect, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, useAnimations, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

function PepeWalker() {
	return (
		<Canvas
			camera={{ position: [0, 1.5, 3] }}
			onCreated={({ gl }) => {
				// 発光をよりはっきり見せる
				gl.toneMappingExposure = 1.2;
			}}
		>
			<ambientLight intensity={0.3} />
			<directionalLight position={[5, 10, 7]} intensity={1} />
			<Suspense fallback={null}>
				<PepeModel url="/models/push-up-pepe.glb" />
			</Suspense>
			<OrbitControls />
		</Canvas>
	);
}

function PepeModel({ url }: { url: string }) {
	const { scene, animations, materials } = useGLTF(url);
	const { actions, mixer } = useAnimations(animations, scene);

	// --- マテリアルの調整 ---
	useEffect(() => {
		THREE.ColorManagement.enabled = true;

		scene.traverse((obj) => {
			if (!(obj instanceof THREE.Mesh) || !obj.material) return;

			// テキストは複数マテリアル（[前面, 背面]）になっている想定
			if (obj.name.includes('Text')) {
				const mats = Array.isArray(obj.material)
					? obj.material
					: [obj.material];

				mats.forEach((mat, idx) => {
					// トーンマッピングをオフにして色を忠実に
					mat.toneMapped = false;

					if (idx === 0) {
						// 前面：緑のエミッションのみ
						mat.emissive = new THREE.Color(0x00ff00);
						mat.emissiveIntensity = 2;
					} else {
						// 背面：オレンジのディフューズのみ
						mat.color = new THREE.Color(0xff6600);
						mat.emissiveIntensity = 0;
					}
				});
			}
			// それ以外のメッシュは Blender 設定を尊重しつつ微調整
			else if (obj.material instanceof THREE.MeshStandardMaterial) {
				obj.material.toneMapped = false;
				obj.material.metalness = 0.5;
				obj.material.roughness = 0.5;
			}
		});
	}, [scene]);

	// --- アニメーションの再生 ---
	useEffect(() => {
		Object.values(actions).forEach((a) => a.stop());
		actions['PushUp']?.reset().play();
		const bodyKey = Object.keys(actions).find((k) => k.includes('Armature'));
		if (bodyKey) {
			actions[bodyKey]?.reset().fadeIn(0.3).play();
		}
	}, [actions]);

	useFrame((_, dt) => mixer.update(dt));

	return <primitive object={scene} />;
}

export default PepeWalker;

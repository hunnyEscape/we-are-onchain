// components/PepePush.tsx
// PepePush.tsx
'use client';

import React from 'react';
import ScrollController from './ScrollController';
import { PepePushProps } from './types';

export default function PepePush({ className = '' }: PepePushProps) {
	return (
		<section className={`relative w-full ${className}`}>
			<ScrollController className="bg-black" />
		</section>
	);
}
/*
'use client';

import React, { useEffect, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, useAnimations, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

export default function PepePush() {
	return (
		<Canvas
			className="w-full h-full"
			gl={{ antialias: false }}
			dpr={1}
			shadows={false}
			frameloop="always"
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
	const { scene, animations } = useGLTF(url);
	const { actions, mixer } = useAnimations(animations, scene);

	// アニメーション再生
	useEffect(() => {
		Object.values(actions).forEach((a) => a.stop());
		actions['PushUp']?.reset().play();
		const bodyKey = Object.keys(actions).find((k) => k.includes('Armature'));
		if (bodyKey) {
			actions[bodyKey]?.reset().fadeIn(0.3).play();
		}
	}, [actions]);

	// 毎フレーム、ミキサーを更新
	useFrame((_, dt) => {
		mixer.update(dt);
	});

	// glTF に含まれるマテリアルを一切触らずそのまま適用
	return <primitive object={scene} />;
}

// モデルのプリロード
useGLTF.preload('/models/push-up-pepe.glb');
*/

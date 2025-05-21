'use client';

import { useRef } from 'react';
import { extend, useFrame, useThree } from '@react-three/fiber';
import {
	EffectComposer,
	Bloom,
	Noise,
	Vignette,
	ChromaticAberration,
	GodRays
} from '@react-three/postprocessing';
import { BlendFunction, Resizer, KernelSize } from 'postprocessing';
import { Mesh, MeshBasicMaterial } from 'three';

// ポストプロセッシングのエフェクトをエクスポート
extend({ EffectComposer, Bloom, Noise, Vignette, ChromaticAberration, GodRays });

interface EffectsComposerProps {
	bloomIntensity?: number;
	noiseOpacity?: number;
	vignetteIntensity?: number;
	aberrationOffset?: number;
}

export const EffectsProcessor = ({
	bloomIntensity = 0.8,
	noiseOpacity = 0.05,
	vignetteIntensity = 0.8,
	aberrationOffset = 0.005
}: EffectsComposerProps) => {
	const { gl, scene, camera, size } = useThree();
	const sunRef = useRef<Mesh>(null);

	// サンライト効果用のメッシュ（画面外に配置）
	useFrame(() => {
		if (sunRef.current) {
			// わずかに揺れる効果を追加
			sunRef.current.position.x = Math.sin(Date.now() * 0.001) * 0.5;
			sunRef.current.position.y = Math.cos(Date.now() * 0.0005) * 0.5 + 15;
		}
	});

	return (
		<>
			{/* サンライト効果用の隠しメッシュ */}
			<mesh
				ref={sunRef}
				position={[0, 50, -10]}
				visible={false}
			>
				<sphereGeometry args={[5, 16, 16]} />
				<meshBasicMaterial color="white" />
			</mesh>

			<EffectComposer
				multisampling={8}
				autoClear={false}
			>
				{/* ブルーム効果（光の拡散） */}
				<Bloom
					intensity={bloomIntensity}
					luminanceThreshold={0.2}
					luminanceSmoothing={0.9}
					kernelSize={KernelSize.LARGE}
				/>

				{/* ノイズ効果（フィルムグレイン） */}
				<Noise
					opacity={noiseOpacity}
					blendFunction={BlendFunction.ADD}
				/>

				{/* ビネット効果（周辺減光） */}
				<Vignette
					offset={0.5}
					darkness={vignetteIntensity}
					blendFunction={BlendFunction.NORMAL}
				/>

				{/* 色収差（カラーチャンネルのずれ） */}
				<ChromaticAberration
					offset={[aberrationOffset, aberrationOffset]}
					radialModulation={false}
					modulationOffset={0}
				/>
			</EffectComposer>
		</>
	);
};
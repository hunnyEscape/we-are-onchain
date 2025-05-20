import { EffectComposer, Bloom, ChromaticAberration, Noise, Vignette } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';

const PostProcessEffects = () => {
	return (
		<EffectComposer multisampling={8}>
			{/* HDRトーンマッピング */}
			<ToneMapping
				adaptive
				resolution={256}
				middleGrey={0.6}
				maxLuminance={16.0}
				averageLuminance={1.0}
				adaptationRate={1.0}
			/>

			{/* 多層ブルームエフェクト */}
			<Bloom
				intensity={2.0}
				luminanceThreshold={0.2}
				luminanceSmoothing={0.9}
				mipmapBlur
				radius={0.8}
			/>

			{/* 2つ目のブルームレイヤー - 広い拡散用 */}
			<Bloom
				intensity={0.5}
				luminanceThreshold={0.1}
				luminanceSmoothing={0.9}
				mipmapBlur
				radius={1.2}
			/>

			{/* 色収差 */}
			<ChromaticAberration
				offset={[0.002, 0.002]}
				radialModulation
				modulationOffset={0.5}
			/>

			{/* ビネット効果 */}
			<Vignette darkness={0.7} offset={0.3} />

			{/* 微細なノイズテクスチャ */}
			<Noise opacity={0.02} />

			{/* シャープネス調整 */}
			<SMAA />
		</EffectComposer>
	);
};

export default PostProcessEffects;
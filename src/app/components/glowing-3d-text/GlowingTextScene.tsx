import { Canvas } from '@react-three/fiber';
import { Suspense } from 'react';
import { MotionValue } from 'framer-motion';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import PepeFlavorModel from './PepeFlavorModel';
import LightingSetup from './LightingSetup';

interface GlowingTextSceneProps {
	scrollProgress: MotionValue<number>;
}

const GlowingTextScene: React.FC<GlowingTextSceneProps> = ({
	scrollProgress
}) => {
	return (
		<Canvas className="w-full h-full" shadows dpr={[1, 2]}>
			<PerspectiveCamera makeDefault position={[1, 1, 5]} fov={50} />
			<Suspense fallback={null}>
				<PepeFlavorModel scrollProgress={scrollProgress} />
			</Suspense>
		</Canvas>
	);
};

export default GlowingTextScene;
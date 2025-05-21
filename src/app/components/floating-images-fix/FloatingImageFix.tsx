import { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import type { ImageFile } from './constants';

interface FloatingImageFixProps {
	image: ImageFile;
	position: [number, number, number];
	scale: number;
	rotationSpeed?: number;
}

const FloatingImageFix: React.FC<FloatingImageFixProps> = ({
	image,
	position,
	scale,
	rotationSpeed = 0.12,
}) => {
	const meshRef = useRef<THREE.Mesh>(null);
	const texture = useTexture(image.path);

	// アスペクト比（幅/高さ）。初期値は1:1でOK
	const [aspect, setAspect] = useState(1);

	// 画像がロードできたらアスペクト比をセット
	useEffect(() => {
		if (texture?.image) {
			setAspect(texture.image.width / texture.image.height);
		}
	}, [texture]);

	useFrame((_, delta) => {
		if (meshRef.current) {
			meshRef.current.rotation.z += rotationSpeed * delta;
		}
	});

	// 縦長画像の場合は、幅をscale、 高さをscale/aspect にすると歪まず正しく表示される
	const width = scale;
	const height = scale / aspect;

	return (
		<mesh
			ref={meshRef}
			position={position}
			castShadow={false}
			receiveShadow={false}
		>
			<planeGeometry args={[width, height]} />
			<meshBasicMaterial
				map={texture}
				transparent
				opacity={0.95}
				toneMapped={false}
			/>
		</mesh>
	);
};

export default FloatingImageFix;

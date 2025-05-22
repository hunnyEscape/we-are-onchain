import { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import type { ImageFile } from './constants';
import * as THREE from 'three'; 
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
	rotationSpeed = 0.005,
}) => {
	const meshRef = useRef<THREE.Mesh>(null);
	const texture = useTexture(image.path);

	// 最新のrotationSpeedを参照するref
	const speedRef = useRef(rotationSpeed);
	useEffect(() => {
		speedRef.current = rotationSpeed;
	}, [rotationSpeed]);

	// アスペクト比（幅/高さ）
	const [aspect, setAspect] = useState(1);
	useEffect(() => {
		if (texture?.image) {
			setAspect(texture.image.width / texture.image.height);
		}
	}, [texture]);

	useFrame((_, delta) => {
		if (meshRef.current) {
			meshRef.current.rotation.z += (speedRef.current ?? 0.06) * delta;
		}
	});

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
				opacity={0.5}
				toneMapped={false}
			/>
		</mesh>
	);
};

export default FloatingImageFix;

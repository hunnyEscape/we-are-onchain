import { useRef, useState, useEffect } from 'react';
import { useFrame,extend } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import type { ImageFile } from './constants';
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
		// @ts-expect-error React Three Fiber JSX elements
		<mesh
			ref={meshRef}
			position={position}
			castShadow={false}
			receiveShadow={false}
		>
			{/* @ts-expect-error React Three Fiber JSX elements */}
			<planeGeometry args={[width, height]} />
			{/* @ts-expect-error React Three Fiber JSX elements */}
			<meshBasicMaterial
				map={texture}
				transparent
				opacity={0.6}
				toneMapped={false}
			/>
			{/* @ts-expect-error React Three Fiber JSX elements */}
		</mesh>
	);
};

export default FloatingImageFix;

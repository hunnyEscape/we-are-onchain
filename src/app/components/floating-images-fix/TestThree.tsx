import { Canvas } from '@react-three/fiber'

export default function TestThree() {
	return (
		<div style={{ width: '100px', height: '100px' }}>
			<Canvas>
				{/* @ts-expect-error React Three Fiber JSX elements */}
				<mesh>
					{/* @ts-expect-error React Three Fiber JSX elements */}
					<boxGeometry args={[1, 1, 1]} />
					{/* @ts-expect-error React Three Fiber JSX elements */}
					<meshBasicMaterial color="red" />
					{/* @ts-expect-error React Three Fiber JSX elements */}
				</mesh>
			</Canvas>
		</div>
	)
}
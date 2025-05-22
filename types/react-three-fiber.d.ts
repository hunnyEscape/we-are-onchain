// types/react-three-fiber.d.ts
import { ReactThreeFiber } from '@react-three/fiber'
import * as THREE from 'three'

declare global {
  namespace JSX {
    interface IntrinsicElements {
      mesh: ReactThreeFiber.Object3DNode<THREE.Mesh, typeof THREE.Mesh>
      group: ReactThreeFiber.Object3DNode<THREE.Group, typeof THREE.Group>
      planeGeometry: ReactThreeFiber.Node<THREE.PlaneGeometry, typeof THREE.PlaneGeometry>
      boxGeometry: ReactThreeFiber.Node<THREE.BoxGeometry, typeof THREE.BoxGeometry>
      sphereGeometry: ReactThreeFiber.Node<THREE.SphereGeometry, typeof THREE.SphereGeometry>
      meshBasicMaterial: ReactThreeFiber.Node<THREE.MeshBasicMaterial, typeof THREE.MeshBasicMaterial>
      meshStandardMaterial: ReactThreeFiber.Node<THREE.MeshStandardMaterial, typeof THREE.MeshStandardMaterial>
      ambientLight: ReactThreeFiber.Object3DNode<THREE.AmbientLight, typeof THREE.AmbientLight>
      directionalLight: ReactThreeFiber.Object3DNode<THREE.DirectionalLight, typeof THREE.DirectionalLight>
      spotLight: ReactThreeFiber.Object3DNode<THREE.SpotLight, typeof THREE.SpotLight>
      pointLight: ReactThreeFiber.Object3DNode<THREE.PointLight, typeof THREE.PointLight>
    }
  }
}

export {}
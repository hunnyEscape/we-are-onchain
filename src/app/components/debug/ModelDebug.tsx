'use client';

import { Suspense, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF, useFBX, Html } from '@react-three/drei';

// デバッグ用の簡易コンポーネント
function ModelDebug() {
  const [modelType, setModelType] = useState('box');
  
  return (
    <div className="w-full h-screen bg-black">
      {/* モデル選択ボタン */}
      <div className="absolute top-4 left-4 z-10 flex gap-2">
        <button 
          className={`px-3 py-1 rounded ${modelType === 'box' ? 'bg-green-500' : 'bg-gray-700'}`}
          onClick={() => setModelType('box')}
        >
          Box
        </button>
        <button 
          className={`px-3 py-1 rounded ${modelType === 'fbx' ? 'bg-green-500' : 'bg-gray-700'}`}
          onClick={() => setModelType('fbx')}
        >
          FBX
        </button>
        <button 
          className={`px-3 py-1 rounded ${modelType === 'glb' ? 'bg-green-500' : 'bg-gray-700'}`}
          onClick={() => setModelType('glb')}
        >
          GLB
        </button>
      </div>

      <Canvas camera={{ position: [0, 1, 5], fov: 60 }}>
        <ambientLight intensity={0.7} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <pointLight position={[-10, -10, -10]} color="#00FF7F" intensity={0.5} />

        <Suspense fallback={<FallbackLoading />}>
          {modelType === 'box' && <BoxModel />}
          {modelType === 'fbx' && <FBXModel />}
          {modelType === 'glb' && <GLBModel />}
        </Suspense>

        <OrbitControls />
        <gridHelper args={[10, 10]} />
        <axesHelper args={[5]} />
      </Canvas>
    </div>
  );
}

// ローディング中の表示
function FallbackLoading() {
  return (
    <Html center>
      <div className="text-white bg-black/50 p-2 rounded">
        Loading model...
      </div>
    </Html>
  );
}

// ボックス表示
function BoxModel() {
  return (
    <mesh>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#00FF7F" />
    </mesh>
  );
}

// FBXモデル表示
function FBXModel() {
  try {
    console.log('Loading FBX model...');
    const fbx = useFBX('/models/pepe.fbx');
    console.log('FBX model loaded:', fbx);
    
    return (
      <primitive 
        object={fbx} 
        scale={[0.05, 0.05, 0.05]} 
        position={[0, 0, 0]} 
      />
    );
  } catch (error) {
    console.error('FBX load error:', error);
    return (
      <Html center>
        <div className="text-red-500 bg-black/80 p-3 rounded">
          Error loading FBX: {error.message || 'Unknown error'}
        </div>
      </Html>
    );
  }
}

// GLBモデル表示
function GLBModel() {
  try {
    console.log('Loading GLB model...');
    const gltf = useGLTF('/models/pepe.glb');
    console.log('GLB model loaded:', gltf);
    
    return (
      <primitive 
        object={gltf.scene} 
        scale={[1, 1, 1]} 
        position={[0, 0, 0]} 
      />
    );
  } catch (error) {
    console.error('GLB load error:', error);
    return (
      <Html center>
        <div className="text-red-500 bg-black/80 p-3 rounded">
          Error loading GLB: {error.message || 'Unknown error'}
        </div>
      </Html>
    );
  }
}

export default ModelDebug;
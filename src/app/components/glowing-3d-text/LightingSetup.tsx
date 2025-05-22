import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const LightingSetup = () => {
  // ライトの参照を保持
  const spotLightRef = useRef<THREE.SpotLight>(null);
  const pointLightRef = useRef<THREE.PointLight>(null);
  
  // ライトのアニメーション
  useFrame(({ clock }) => {
    const time = clock.getElapsedTime();
    
    // スポットライトの位置を微妙に変化
    if (spotLightRef.current) {
      spotLightRef.current.position.x = Math.sin(time * 0.3) * 3;
      spotLightRef.current.position.z = Math.cos(time * 0.2) * 3;
    }
    
    // ポイントライトの強度を変化（パルス効果）
    if (pointLightRef.current) {
      pointLightRef.current.intensity = 1 + Math.sin(time * 2) * 0.3;
    }
  });
  
  return (
    <>
      {/* 環境光 - 暗めの基本照明 */}

      
      {/* メインのスポットライト - テキストを照らす */}
    </>
  );
};

export default LightingSetup;
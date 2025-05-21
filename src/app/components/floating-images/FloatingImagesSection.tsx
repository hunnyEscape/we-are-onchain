'use client';

import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { ScrollControls } from '@react-three/drei';
import FloatingImages from './FloatingImages';
import styles from './styles.module.css';

const FloatingImagesSection = () => {
  return (
    <section className="relative w-full h-screen bg-black overflow-hidden">
      <div className={styles.scanlines}></div>
      
      <Canvas
        camera={{ position: [0, 0, 15], fov: 15 }}
        gl={{ antialias: true, alpha: false }}
        dpr={[1, 2]}
        className="bg-black"
      >
        <color attach="background" args={['#000000']} />
        
        <ScrollControls damping={0.2} pages={1.5} distance={0.5}>
          <Suspense fallback={null}>
            <FloatingImages />
          </Suspense>
        </ScrollControls>
      </Canvas>
      
      {/* オプショナルなオーバーレイ要素 */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-white text-opacity-70 text-sm z-20 pointer-events-none">
        <p className="animate-pulse">Scroll to explore</p>
      </div>
    </section>
  );
};

export default FloatingImagesSection;
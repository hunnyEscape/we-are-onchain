// CyberInterface.tsx
'use client';

import React, { useEffect, useState, useRef } from 'react';
import styles from './PepeStyles.module.css';

// バイナリデータを生成する関数
const generateBinaryData = (length: number): string => {
  const chars = '01';
  return Array.from({ length }, () => chars.charAt(Math.floor(Math.random() * chars.length))).join('');
};

// 16進数データを生成する関数
const generateHexData = (length: number): string => {
  const chars = '0123456789ABCDEF';
  return Array.from({ length }, () => chars.charAt(Math.floor(Math.random() * chars.length))).join('');
};

const CyberInterface: React.FC<CyberInterfaceProps> = ({ 
  scrollProgress, 
  activeIndex,
  totalSections 
}) => {
  const [dataStream, setDataStream] = useState<string[]>([]);
  const [systemTime, setSystemTime] = useState<string>('');
  const [randomGlitch, setRandomGlitch] = useState<boolean>(false);
  
  // データストリームを生成
  useEffect(() => {
    // 初期データストリームを生成
    const initialData: string[] = [];
    for (let i = 0; i < 50; i++) {
      if (Math.random() > 0.7) {
        initialData.push(generateHexData(16));
      } else {
        initialData.push(generateBinaryData(16));
      }
    }
    setDataStream(initialData);
    
    // 定期的にデータストリームを更新
    const interval = setInterval(() => {
      setDataStream(prev => {
        const newData = [...prev];
        // 1-3行をランダムに置き換え
        const replaceCount = Math.floor(Math.random() * 3) + 1;
        for (let i = 0; i < replaceCount; i++) {
          const index = Math.floor(Math.random() * newData.length);
          if (Math.random() > 0.7) {
            newData[index] = generateHexData(16);
          } else {
            newData[index] = generateBinaryData(16);
          }
        }
        return newData;
      });
      
      // ランダムなグリッチ効果
      if (Math.random() > 0.9) {
        setRandomGlitch(true);
        setTimeout(() => setRandomGlitch(false), 200);
      }
    }, 500);
    
    // システム時間の更新
    const timeInterval = setInterval(() => {
      const now = new Date();
      setSystemTime(`SYS://GREEN_SOURCE v2.3.7 | ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`);
    }, 1000);
    
    return () => {
      clearInterval(interval);
      clearInterval(timeInterval);
    };
  }, []);
  
  // エネルギーレベル（スクロール進行に基づく）
  const energyLevel = Math.max(5, Math.min(100, scrollProgress * 100));
  
  return (
    <>
      {/* スキャンライン */}
      <div className={styles.scanline}></div>
      
      {/* コーナーマーカー */}
      <div className={styles.cyberFrame}>
        <div className={`${styles.cornerMarker} ${styles.topLeft} ${randomGlitch ? styles.jitter : ''}`}></div>
        <div className={`${styles.cornerMarker} ${styles.topRight} ${randomGlitch ? styles.jitter : ''}`}></div>
        <div className={`${styles.cornerMarker} ${styles.bottomLeft} ${randomGlitch ? styles.jitter : ''}`}></div>
        <div className={`${styles.cornerMarker} ${styles.bottomRight} ${randomGlitch ? styles.jitter : ''}`}></div>
      </div>
      
      {/* データストリーム */}
      <div className={styles.dataStream}>
        <div className={styles.dataContent}>
          {dataStream.map((line, index) => (
            <div key={index} className={randomGlitch && index % 5 === 0 ? styles.jitter : ''}>
              {line}
            </div>
          ))}
        </div>
      </div>
      
      {/* エネルギーメーター */}
      <div className={styles.energyMeter}>
        <div 
          className={styles.energyLevel} 
          style={{ height: `${energyLevel}%` }}
        ></div>
      </div>
      
      {/* システムステータス */}
      <div className={styles.systemStatus}>
        {systemTime}
        <div>SECTION: {activeIndex !== null ? activeIndex + 1 : 0}/{totalSections}</div>
        <div>ENERGY: {Math.floor(energyLevel)}%</div>
      </div>
    </>
  );
};

export default CyberInterface;
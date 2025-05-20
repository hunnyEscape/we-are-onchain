// MatrixScrollContainer.tsx
'use client';
import React, { useState, useEffect, useRef } from 'react';
import { Environment, PerspectiveCamera } from '@react-three/drei';
import { useFrame, Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import styles from './MatrixScroll.module.css';

/**
 * MatrixScrollContainer - メインコンポーネント
 * スクロールアニメーションとマトリックスエフェクトを組み合わせたコンテナ
 */
interface MatrixScrollContainerProps {
  children?: React.ReactNode;
  backgroundImage?: string;
}

const MatrixScrollContainer: React.FC<MatrixScrollContainerProps> = ({
  children,
  backgroundImage = ''
}) => {
  // スクロール状態の管理
  const [scrollY, setScrollY] = useState(0);
  const [maxScroll, setMaxScroll] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // スクロール量を監視してステートを更新
  useEffect(() => {
    const handleScroll = () => {
      if (containerRef.current) {
        const currentScrollY = window.scrollY;
        setScrollY(currentScrollY);
        
        // コンテナの高さからビューポートの高さを引いた値が最大スクロール量
        const containerHeight = containerRef.current.scrollHeight;
        const maxScrollValue = containerHeight - window.innerHeight;
        setMaxScroll(maxScrollValue);
        
        // スクロール進行度を0〜1の範囲で計算
        const progress = Math.min(Math.max(currentScrollY / maxScrollValue, 0), 1);
        setScrollProgress(progress);
      }
    };

    // 初期設定
    handleScroll();
    
    // スクロールイベントリスナーの登録（パフォーマンス向上のためにpassiveオプションを設定）
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    // リサイズイベントリスナーの登録
    window.addEventListener('resize', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, [maxScroll]);

  return (
    <div className={styles.scrollContainer} ref={containerRef}>
      {/* スクロールコンテンツ（高さを確保） */}
      <div className={styles.scrollContent}>
        {/* スティッキーな球体コンテナ */}
        <div className={styles.stickyContainer}>
          {/* 3D球体 */}
          <MatrixSphereCanvas 
            scrollProgress={scrollProgress}
            backgroundImage={backgroundImage}
          />
          
          {/* マトリックスコードのレイン効果 */}
          <MatrixCodeRain 
            scrollProgress={scrollProgress}
          />
          
          {/* メッセージ表示（Matrix風テキスト） */}
          <MatrixTextOverlay 
            scrollProgress={scrollProgress} 
          />
        </div>
        
        {/* 追加コンテンツ（オプション） */}
        <div className={styles.contentSections}>
          {children}
        </div>
        
        {/* スクロールプログレスインジケーター */}
        <div className={styles.scrollIndicator} style={{ width: `${scrollProgress * 100}%` }} />
      </div>
    </div>
  );
};

// スクロールに反応する回転球体
const RotatingSphere = ({ scrollProgress }) => {
  const sphereRef = useRef<THREE.Mesh>(null);
  
  // フレームごとに回転を更新
  useFrame(() => {
    if (sphereRef.current) {
      // スクロール進行に基づいて回転
      const baseRotation = scrollProgress * Math.PI * 4; // スクロールに応じて回転（4π = 720度）
      
      // Y軸を中心に回転
      sphereRef.current.rotation.y = baseRotation;
      
      // X軸とZ軸にも少しだけ回転を加えて動きを複雑に
      sphereRef.current.rotation.x = Math.sin(baseRotation * 0.5) * 0.3;
      sphereRef.current.rotation.z = Math.sin(baseRotation * 0.3) * 0.15;
    }
  });

  // 球体テクスチャをロード
  const texture = new THREE.TextureLoader().load('/images/cyberpunk-cityscape.png');
  texture.mapping = THREE.EquirectangularReflectionMapping;

  return (
    <mesh ref={sphereRef}>
      <sphereGeometry args={[2, 64, 64]} />
      <meshBasicMaterial map={texture} side={THREE.BackSide} />
    </mesh>
  );
};

// Three.jsで3D球体を描画するキャンバス
const MatrixSphereCanvas = ({ scrollProgress, backgroundImage }) => {
  return (
    <div className={styles.sphereContainer}>
      <Canvas shadows>
        {/* ライティング設定 */}
        <ambientLight intensity={0.8} />
        <directionalLight position={[5, 5, 5]} intensity={1.0} castShadow />
        <spotLight position={[-5, 8, -5]} angle={0.15} penumbra={1} intensity={1.5} castShadow />
        <hemisphereLight intensity={0.4} color="#88eeff" groundColor="#553333" />

        {/* 回転する球体 */}
        <RotatingSphere scrollProgress={scrollProgress} />

        {/* カメラ設定 */}
        <PerspectiveCamera makeDefault position={[0, 1, 4]} fov={45} />
      </Canvas>
      
      {/* 情報オーバーレイ */}
      <div className={styles.infoOverlay}>
        <span className={styles.statusText}>LOADING MATRIX</span>
        <span className={styles.progressText}>{Math.floor(scrollProgress * 100)}%</span>
      </div>

      {/* サイバーパンク風の装飾 */}
      <div className={`${styles.decorLine} ${styles.decorLineTop}`}></div>
      <div className={`${styles.decorLine} ${styles.decorLineBottom}`}></div>
    </div>
  );
};

// マトリックスコードのレイン効果
const MatrixCodeRain = ({ scrollProgress }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(null);
  
  // マトリックスコードのレイン効果を実装
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // キャンバスのサイズをウィンドウにフィット
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    // 初期化
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // マトリックスの文字
    const matrixChars = "アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789".split("");
    
    // 縦列の数を計算（画面の幅に応じて）
    const fontSize = 16;
    const columns = Math.ceil(canvas.width / fontSize);
    
    // 各列の降下位置を保持
    const drops: number[] = [];
    for (let i = 0; i < columns; i++) {
      drops[i] = Math.random() * -100; // ランダムな初期位置
    }

    // アニメーション関数
    const draw = () => {
      // 背景を半透明の黒でクリア（残像効果を出す）
      ctx.fillStyle = "rgba(0, 0, 0, 0.05)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // スクロール進行に応じて色の彩度を変化
      const hue = 120; // 緑色のベース
      const saturation = 100; // 彩度の最大値
      const lightness = 40 + scrollProgress * 20; // スクロールに応じて明るさ変化
      
      // 文字の描画
      ctx.fillStyle = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
      ctx.font = `${fontSize}px monospace`;
      ctx.textAlign = "center";
      
      // 各列の文字を描画
      for(let i = 0; i < drops.length; i++) {
        // スクロール進行に応じて文字列を選択（進行に応じて複雑になる）
        const charIndex = Math.floor(Math.random() * (matrixChars.length * (0.5 + scrollProgress * 0.5)));
        const char = matrixChars[charIndex % matrixChars.length];
        
        // 文字の位置
        const x = i * fontSize;
        const y = drops[i] * fontSize;
        
        // 表示する文字の透明度（遠くなるほど薄く）
        const alpha = 0.5 + Math.random() * 0.5;
        ctx.fillStyle = `hsla(${hue}, ${saturation}%, ${lightness}%, ${alpha})`;
        
        // 文字を描画
        ctx.fillText(char, x, y);
        
        // 各ドロップの位置を更新
        // スクロール進行によって落下速度が加速
        const fallSpeed = 0.5 + scrollProgress * 1.5;
        drops[i] += fallSpeed;
        
        // 画面下に到達したらリセット（ランダム位置から再開）
        if(drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }
      }
      
      // 次のフレームをリクエスト
      animationRef.current = requestAnimationFrame(draw);
    };
    
    // アニメーションを開始
    draw();
    
    // クリーンアップ
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [scrollProgress]);

  return (
    <canvas 
      ref={canvasRef} 
      className={styles.matrixCanvas}
    />
  );
};

// スクロール進行に応じて表示されるマトリックス風メッセージ
const MatrixTextOverlay = ({ scrollProgress }) => {
  // メッセージ一覧
  const messages = [
    "Wake up, Neo...",
    "The Matrix has you...",
    "Follow the white rabbit.",
    "Knock, knock, Neo.",
    "The Matrix is everywhere.",
    "Welcome... to the desert of the real."
  ];
  
  // 現在表示すべきメッセージのインデックスを計算
  const messageIndex = Math.min(
    Math.floor(scrollProgress * messages.length),
    messages.length - 1
  );
  
  // スクロール進行に応じたメッセージの表示/非表示
  const isVisible = scrollProgress > 0.05;
  
  // スクロール進行に応じたメッセージの不透明度
  const opacity = Math.min(scrollProgress * 2, 1);
  
  if (!isVisible) return null;
  
  return (
    <div className={styles.matrixMessage} style={{ opacity }}>
      <div className={styles.messageBox}>
        <div className={styles.messageHeader}>
          <span className={styles.blinker}></span>
          SYSTEM MESSAGE
        </div>
        <div className={styles.messageContent}>
          {messages[messageIndex]}
        </div>
      </div>
    </div>
  );
};

export default MatrixScrollContainer;
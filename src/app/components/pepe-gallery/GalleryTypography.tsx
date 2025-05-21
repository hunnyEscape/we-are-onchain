'use client';

import React, { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Text, useScroll } from '@react-three/drei';
import { TYPOGRAPHY_POSITIONS } from './utils/constants';
import { applyTextFadeEffect, applyFloatingAnimation } from './utils/scrollAnimation';

// テキスト要素の型定義
interface TextElement {
  id: number;
  text: string;
  position: [number, number, number];
  anchorX?: 'left' | 'center' | 'right';
  visibleRange: [number, number]; // [表示開始位置, 表示終了位置]
}

const GalleryTypography: React.FC = () => {
  // テキスト要素の定義
  const textElements: TextElement[] = [
    {
      id: 1,
      text: "PEPE",
      position: TYPOGRAPHY_POSITIONS[0].position as [number, number, number],
      anchorX: TYPOGRAPHY_POSITIONS[0].anchorX as 'left' | 'center' | 'right',
      visibleRange: [0, 0.4] // スクロール0%〜40%の間で表示
    },
    {
      id: 2,
      text: "GALLERY",
      position: TYPOGRAPHY_POSITIONS[1].position as [number, number, number],
      anchorX: TYPOGRAPHY_POSITIONS[1].anchorX as 'left' | 'center' | 'right',
      visibleRange: [0.3, 0.7] // スクロール30%〜70%の間で表示
    },
    {
      id: 3,
      text: "COLLECTION",
      position: TYPOGRAPHY_POSITIONS[2].position as [number, number, number],
      anchorX: TYPOGRAPHY_POSITIONS[2].anchorX as 'left' | 'center' | 'right',
      visibleRange: [0.6, 1.0] // スクロール60%〜100%の間で表示
    }
  ];
  
  // スクロールデータを取得
  const data = useScroll();
  
  // テキスト要素の参照を保持する配列
  const textRefs = useRef<Array<React.RefObject<any>>>([]);
  
  // テキスト要素の参照を初期化
  if (textRefs.current.length !== textElements.length) {
    textRefs.current = Array(textElements.length)
      .fill(null)
      .map((_, i) => textRefs.current[i] || React.createRef());
  }
  
  // ビューポートのサイズを取得
  const { width, height } = useThree((state) => state.viewport);
  
  // テキストのスタイル設定
  const textStyle = {
    font: '/Inter-Regular.woff', // プロジェクトに合わせて変更
    fontSize: width * 0.08,
    letterSpacing: -0.05,
    lineHeight: 1,
    'material-toneMapped': false
  };
  
  // 各フレームでのアニメーション処理
  useFrame((state, delta) => {
    const scrollOffset = data.offset; // スクロール位置（0-1）
    const time = state.clock.getElapsedTime();
    
    // 各テキスト要素にアニメーション効果を適用
    textElements.forEach((element, index) => {
      const ref = textRefs.current[index];
      if (ref && ref.current) {
        // フェードイン/アウト効果の適用
        applyTextFadeEffect(ref, scrollOffset, element.visibleRange, delta);
        
        // 浮遊アニメーションの適用
        applyFloatingAnimation(
          ref, 
          time + index, 
          element.position,
          0.05 // 浮遊の振幅
        );
      }
    });
  });
  
  return (
    <>
      {textElements.map((element, index) => (
        <Text
          key={element.id}
          ref={textRefs.current[index]}
          position={element.position}
          anchorX={element.anchorX || 'center'}
          anchorY="middle"
          color="black"
          opacity={0} // 初期状態では非表示
          {...textStyle}
        >
          {element.text}
        </Text>
      ))}
    </>
  );
};

export default GalleryTypography;
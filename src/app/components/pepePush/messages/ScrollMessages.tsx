'use client';

import React, { useEffect, useState, useRef } from 'react';
import MessageText from './MessageText';
import { cyberMessages, calculateMessageVisibility, SCROLL_CONFIG } from './constants';
import { ActiveMessageState, DebugInfo } from './types';

interface ScrollMessagesProps {
  scrollProgress: number;
  className?: string;
}

const ScrollMessages: React.FC<ScrollMessagesProps> = ({
  scrollProgress,
  className = '',
}) => {
  // アクティブメッセージの状態管理
  const [activeMessages, setActiveMessages] = useState<ActiveMessageState[]>([]);
  // ランダムなグリッチエフェクトのための状態
  const [randomGlitchTriggered, setRandomGlitchTriggered] = useState(false);
  // デバッグ情報
  const [debugInfo, setDebugInfo] = useState<DebugInfo>({
    scrollProgress: 0,
    activeMessageCount: 0,
    viewportHeight: 0,
    scrollY: 0
  });

  // ランダムグリッチエフェクト
  useEffect(() => {
    const triggerRandomGlitch = () => {
      // 10%の確率でグリッチをトリガー
      if (Math.random() < 0.1) {
        setRandomGlitchTriggered(true);
        // 100-300msでグリッチ解除
        setTimeout(() => {
          setRandomGlitchTriggered(false);
        }, 100 + Math.random() * 200);
      }
    };

    // 200ms毎にグリッチチェック
    const glitchInterval = setInterval(triggerRandomGlitch, 200);
    
    return () => {
      clearInterval(glitchInterval);
    };
  }, []);

  // スクロール位置に基づいてメッセージ表示を更新
  useEffect(() => {
    // アクティブなメッセージを計算
    const newActiveMessages = cyberMessages.map(message => {
      const { isVisible, opacity, isActive } = calculateMessageVisibility(
        message.scrollProgress,
        scrollProgress
      );

      return {
        message,
        opacity: isVisible ? opacity : 0,
        isActive
      };
    }).filter(item => item.opacity > 0);

    setActiveMessages(newActiveMessages);

    // デバッグ情報を更新
    if (SCROLL_CONFIG.DEBUG_MODE) {
      setDebugInfo({
        scrollProgress,
        activeMessageCount: newActiveMessages.length,
        viewportHeight: window.innerHeight,
        scrollY: window.scrollY
      });
    }
  }, [scrollProgress]);

  return (
    <div className={`relative ${className}`}>
      {/* アクティブなメッセージをレンダリング */}
      {activeMessages.map(({ message, opacity, isActive }) => (
        <MessageText
          key={message.id}
          message={message}
          isActive={isActive}
          opacity={opacity}
        />
      ))}

      {/* ランダムグリッチエフェクト用のオーバーレイ */}
      {randomGlitchTriggered && (
        <div 
          className="fixed inset-0 bg-white/5 z-30 pointer-events-none" 
          style={{ 
            backdropFilter: 'blur(1px)', 
            mixBlendMode: 'overlay' 
          }}
        />
      )}

      {/* デバッグ情報 */}
      {SCROLL_CONFIG.DEBUG_MODE && (
        <div className="fixed bottom-4 left-4 bg-black/70 text-green-400 p-3 rounded text-xs font-mono z-50">
          <div>Scroll: {debugInfo.scrollProgress.toFixed(3)}</div>
          <div>Active: {debugInfo.activeMessageCount}</div>
          <div>Viewport: {debugInfo.viewportHeight}px</div>
          <div>ScrollY: {debugInfo.scrollY}px</div>
        </div>
      )}
    </div>
  );
};

export default ScrollMessages;
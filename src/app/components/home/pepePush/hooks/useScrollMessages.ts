'use client';

import { useState, useEffect } from 'react';
import { ActiveMessageState, DebugInfo } from '../messages/types';
import { cyberMessages, calculateMessageVisibility, SCROLL_CONFIG } from '../messages/constants';

/**
 * スクロールに応じたメッセージ表示状態を管理するカスタムフック
 * useScrollProgressから提供されるスクロール進行度を使用
 */
export function useScrollMessages(scrollProgress: number) {
  // アクティブメッセージの状態
  const [activeMessages, setActiveMessages] = useState<ActiveMessageState[]>([]);
  
  // ランダムグリッチエフェクト
  const [randomGlitchTriggered, setRandomGlitchTriggered] = useState(false);
  
  // デバッグ情報
  const [debugInfo, setDebugInfo] = useState<DebugInfo>({
    scrollProgress: 0,
    activeMessageCount: 0,
    viewportHeight: 0,
    scrollY: 0
  });

  // ランダムグリッチエフェクト処理
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

  return {
    activeMessages,
    randomGlitchTriggered,
    debugInfo
  };
}
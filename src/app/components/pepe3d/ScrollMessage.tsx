// ScrollMessage.tsx
'use client';

import React, { useEffect, useRef, useState } from 'react';
import CyberInterface from './CyberInterface';
import styles from './PepeStyles.module.css';

type MessageConfig = {
  id: string;
  text: string;
  top?: string;
  left?: string;
  width?: string;
  fontSize?: string;
  glitchEffect?: 'rgb' | 'slice' | 'wave' | 'pulse' | 'jitter' | 'none';
  keywords?: string[];
  delay?: number;
};

// テキストフラグメント処理用の型
interface TextFragment {
  text: string;
  isKeyword: boolean;
  keywordType?: string;
}

const messages: MessageConfig[] = [
  {
    id: 'trigger-1',
    text: '🧪深緑の源泉 ー 古代から森にひそむ「ぺぺの泉」。',
    top: '20vh',
    left: '10vw',
    width: 'auto',
    fontSize: '2rem',
    glitchEffect: 'rgb',
    keywords: ['深緑の源泉', 'ぺぺの泉'],
  },
  {
    id: 'trigger-2',
    text: '💎そこから湧き出るグリーンミネラルが、濃厚なコクとほどよい甘みをもたらす。',
    top: '30vh',
    left: '30vw',
    width: 'max-content',
    fontSize: '2rem',
    glitchEffect: 'wave',
    keywords: ['グリーンミネラル'],
  },
  {
    id: 'trigger-3',
    text: '一口ごとに脈打つビート、疲労を吹き飛ばし、次の挑戦へと背中を押す。',
    top: '40vh',
    left: '10vw',
    width: 'max-content',
    fontSize: '2rem',
    glitchEffect: 'pulse',
    keywords: ['脈打つビート'],
  },
  {
    id: 'trigger-4',
    text: '次元を超えたグリーンパワーを、その手で感じよ。',
    top: '80vh',
    left: '30vw',
    width: '60vw',
    fontSize: '3rem',
    glitchEffect: 'slice',
    keywords: ['次元を超えた', 'グリーンパワー'],
  },
];

const ScrollTriggerMessages: React.FC = () => {
  const refs = useRef<(HTMLDivElement | null)[]>([]);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [scrollProgress, setScrollProgress] = useState<number>(0);
  const [randomTrigger, setRandomTrigger] = useState<boolean>(false);

  // キーワードに基づいてテキストを処理する関数
  const processText = (text: string, keywords: string[] = []): TextFragment[] => {
    if (!keywords || keywords.length === 0) return [{ text, isKeyword: false }];

    const fragments: TextFragment[] = [];
    let remainingText = text;

    // 各キーワードを検索して分割
    keywords.forEach((keyword) => {
      const parts = remainingText.split(new RegExp(`(${keyword})`, 'g'));
      if (parts.length === 1) return; // キーワードが見つからない場合はスキップ

      // 分割された部分を処理
      let newRemainingText = '';
      parts.forEach((part, index) => {
        if (part === keyword) {
          fragments.push({
            text: part,
            isKeyword: true,
            keywordType: keyword,
          });
        } else if (part) {
          newRemainingText += part;
        }
      });
      remainingText = newRemainingText;
    });

    // 残りのテキストがあれば追加
    if (remainingText) {
      fragments.push({ text: remainingText, isKeyword: false });
    }

    return fragments.length > 0 ? fragments : [{ text, isKeyword: false }];
  };

  // グリッチエフェクトに基づいてクラス名を取得
  const getGlitchClass = (effect?: 'rgb' | 'slice' | 'wave' | 'pulse' | 'jitter' | 'none'): string => {
    switch (effect) {
      case 'rgb': return styles.rgbSplit;
      case 'slice': return styles.sliceGlitch;
      case 'wave': return styles.waveDistort;
      case 'pulse': return styles.pulse;
      case 'jitter': return styles.jitter;
      default: return '';
    }
  };

  // レンダリングされる実際のテキスト
  const renderMessageText = (message: MessageConfig) => {
    if (!message.keywords || message.keywords.length === 0) {
      return <span className={getGlitchClass(message.glitchEffect)}>{message.text}</span>;
    }

    // キーワードを検出して強調
    return message.text.split(' ').map((word, wordIndex) => {
      const isKeyword = message.keywords?.some(keyword => keyword.includes(word) || word.includes(keyword));
      
      if (isKeyword) {
        return (
          <span 
            key={`word-${wordIndex}`}
            className={`${styles.keywordGlitch} ${getGlitchClass(message.glitchEffect)}`}
            data-text={word}
          >
            {word}{' '}
          </span>
        );
      }
      
      return (
        <span 
          key={`word-${wordIndex}`}
          className={getGlitchClass(message.glitchEffect)}
        >
          {word}{' '}
        </span>
      );
    });
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        let found = false;
        entries.forEach((entry) => {
          const idx = refs.current.findIndex((r) => r === entry.target);
          if (entry.isIntersecting) {
            setActiveIndex(idx);
            found = true;
          }
        });
        if (!found) setActiveIndex(null);
      },
      { root: null, rootMargin: '0px', threshold: 0.5 }
    );

    refs.current.forEach((r) => r && observer.observe(r));

    // スクロールイベントリスナー追加
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight;
      const winHeight = window.innerHeight;
      const scrollPercent = scrollTop / (docHeight - winHeight);
      setScrollProgress(scrollPercent);
      
      // 10%の確率でランダムなグリッチをトリガー
      if (Math.random() < 0.01) {
        setRandomTrigger(true);
        setTimeout(() => setRandomTrigger(false), 150);
      }
    };
    
    window.addEventListener('scroll', handleScroll);

    return () => {
      refs.current.forEach((r) => r && observer.unobserve(r));
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <>
      {/* トリガー用ダミーゾーン */}
      {messages.map((_, i) => (
        <div key={`zone-${i}`} ref={(el) => (refs.current[i] = el)} className="h-screen w-full" />
      ))}

      {/* サイバネティックインターフェース */}
      <CyberInterface 
        scrollProgress={scrollProgress} 
        activeIndex={activeIndex} 
        totalSections={messages.length} 
      />

      {/* フローティングメッセージ */}
      {messages.map((msg, i) => {
        const isActive = activeIndex === i;
        return (
          <div
            key={msg.id}
            className={`fixed z-50 font-pixel text-white transition-opacity duration-700 ease-in-out
                        ${isActive ? 'opacity-100' : 'opacity-0'} 
                        ${randomTrigger ? styles.jitter : ''}
                        ${msg.id === 'trigger-4' && isActive ? 'animate-pulse' : ''}
                      `}
            style={{
              top: msg.top,
              left: msg.left,
              width: msg.width,
              fontSize: msg.fontSize,
              textShadow: '0 0 8px rgba(0, 255, 102, 0.7)',
            }}
          >
            {renderMessageText(msg)}
          </div>
        );
      })}

      {/* 追加の装飾エフェクト: グリッドバックグラウンド */}
      <div 
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          backgroundImage: 'linear-gradient(rgba(0, 255, 102, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 255, 102, 0.05) 1px, transparent 1px)',
          backgroundSize: '20px 20px',
          backgroundPosition: 'center center',
        }}
      />
    </>
  );
};

export default ScrollTriggerMessages;
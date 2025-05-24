'use client';

import React, { useMemo } from 'react';
import { MessageConfig, GlitchEffectType } from './types';
import styles from './effects.module.css';
import { getEffectClass } from './constants';

interface MessageTextProps {
  message: MessageConfig;
  isActive: boolean;
  opacity: number;
}

const MessageText: React.FC<MessageTextProps> = ({ 
  message, 
  isActive, 
  opacity 
}) => {
  // スタイルの動的生成
  const messageStyle = useMemo(() => {
    // 位置とサイズの基本スタイル
    const style: React.CSSProperties = {
      opacity,
      fontSize: message.size,
      transition: 'opacity 500ms ease-in-out, transform 500ms ease-in-out',
      transform: `translateY(${(1 - opacity) * 20}px)`,
    };

    // テキスト配置
    switch (message.align) {
      case 'right':
        style.right = '10vw';
        style.textAlign = 'right';
        break;
      case 'center':
        style.left = '50%';
        style.transform = `translateX(-50%) translateY(${(1 - opacity) * 20}px)`;
        style.textAlign = 'center';
        break;
      case 'left':
      default:
        style.left = '10vw';
        style.textAlign = 'left';
    }

    // スクロール位置に基づく垂直位置の設定
    switch (message.id) {
      case 'message-1':
        style.top = '20vh';
        break;
      case 'message-2':
        style.top = '35vh';
        break;
      case 'message-3':
        style.top = '50vh';
        break;
      case 'message-4':
        style.top = '65vh';
        break;
      case 'message-5':
        style.top = '40vh';
        break;
      case 'message-6':
        style.top = '60vh';
        break;
      case 'message-7':
        style.top = '50vh';
        break;
      default:
        style.top = '50vh';
    }

    return style;
  }, [message, opacity]);

  // キーワードをハイライト処理するヘルパー関数
  const renderText = () => {
    // 改行を処理
    const parts = message.text.split(/(\n)/g);
    
    return (
      <>
        {parts.map((part, index) => {
          if (part === '\n') return <br key={`br-${index}`} />;
          
          // 単語を分割して処理
          const words = part.split(' ');
          
          return (
            <span key={`part-${index}`}>
              {words.map((word, wordIndex) => {
                // キーワードかどうか確認
                const isKeyword = message.keywords?.some(
                  keyword => word.toLowerCase().includes(keyword.toLowerCase())
                );

                // エフェクトクラスを取得
                const effectClass = getKeywordEffectClass(
                  message.glitchEffect,
                  isKeyword
                );

                return (
                  <React.Fragment key={`word-${wordIndex}`}>
                    <span
                      className={effectClass}
                      data-text={word}
                    >
                      {word}
                    </span>
                    {wordIndex < words.length - 1 ? ' ' : ''}
                  </React.Fragment>
                );
              })}
            </span>
          );
        })}
      </>
    );
  };

  // キーワードに対する特別なエフェクトクラスを取得
  const getKeywordEffectClass = (effect?: GlitchEffectType, isKeyword = false) => {
    if (!effect || effect === 'none') {
      return isKeyword ? styles.keywordEffect : '';
    }

    // キーワードの場合は強調エフェクト
    if (isKeyword) {
      switch (effect) {
        case 'rgb':
          return styles.keywordRgb;
        case 'rainbow':
          return styles.keywordRainbow;
        case 'pulse':
          return styles.keywordPulse;
        case 'slice':
          return styles.keywordSlice;
        case 'neon':
          return styles.keywordNeon;
        default:
          return `${styles.keywordEffect} ${styles[`effect${effect.charAt(0).toUpperCase() + effect.slice(1)}`]}`;
      }
    }

    // 通常のエフェクト
    return styles[`effect${effect.charAt(0).toUpperCase() + effect.slice(1)}`];
  };

  return (
    <div 
      className={`${styles.messageContainer} font-bold ${isActive ? 'z-50' : 'z-40'}`} 
      style={messageStyle}
    >
      {renderText()}
    </div>
  );
};

export default MessageText;
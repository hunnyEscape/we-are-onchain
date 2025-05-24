// src/app/components/pepePush/messages/constants.ts
import { MessageConfig, ScrollMessageConfig, GlitchEffectType } from './types';

// スマホ判定のヘルパー関数
export const isMobile = () => {
  if (typeof window === 'undefined') return false;
  return window.innerWidth <= 768;
};

// スクロールメッセージ設定
export const SCROLL_CONFIG: ScrollMessageConfig = {
  SECTION_HEIGHT_VH: 600,    // pepePushセクションと合わせる
  SCROLL_SENSITIVITY: 1.0,   // スクロール感度
  DEBUG_MODE: false,         // デバッグモード
  FADE_DURATION: 500,        // フェードイン/アウト時間 (ms)
  VISIBILITY_THRESHOLD: 0.1  // メッセージ表示閾値
};

// エフェクト適用のヘルパー関数
export const getEffectClass = (effect?: GlitchEffectType): string => {
  if (!effect || effect === 'none') return '';
  
  // 命名規則: effect{エフェクト名} (最初の文字を大文字に)
  return `effect${effect.charAt(0).toUpperCase() + effect.slice(1)}`;
};

// メッセージ定義
export const cyberMessages: MessageConfig[] = [
  {
    id: 'message-1',
    text: 'Pepe knows \nwhat a real man is.',
    scrollProgress: 0.2,
    style: 'horizontal',
    size: isMobile() ? '1.5rem' : '8rem',
    align: 'left',
    glitchEffect: 'none',
    keywords: ['Pepe','real','man'],
  },
  {
    id: 'message-2',
    text: 'Pepe pursues \nthe goals others \ndon’t dare to approach.',
    scrollProgress: 0.35,
    style: 'horizontal',
    size: isMobile() ? '1.5rem' : '7rem',
    align: 'right',
    glitchEffect: 'none',
    keywords: ['Pepe','others','dare'],
  },
  {
    id: 'message-3',
    text: 'Pepe always outworks himself. \nEvery. \nSingle. \nDay.',
    scrollProgress: 0.55,
    style: 'horizontal',
    size: isMobile() ? '1.5rem' : '7rem',
    align: 'left',
    glitchEffect: 'none',
    keywords: ['Pepe','outworks'],
  },
  {
    id: 'message-4',
    text: 'Pepe never stops; \nstopping is death.',
    scrollProgress: 0.7,
    style: 'horizontal',
    size: isMobile() ? '2rem' : '7rem',
    align: 'right',
    glitchEffect: 'none',
    keywords: ['Pepe'],
  },
  {
    id: 'message-5',
    text: 'Pepe bets bold, never loses. \nSmart. \nDiligent. \nUnstoppable.',
    scrollProgress: 0.8,
    style: 'horizontal',
    size: isMobile() ? '2.5rem' : '7rem',
    align: 'left',
    glitchEffect: 'none',
    keywords: ['Pepe', 'ascends'],
  },
];

// メッセージ表示範囲の計算
export const calculateMessageVisibility = (
  messageScrollProgress: number,
  currentScrollProgress: number
): { isVisible: boolean; opacity: number; isActive: boolean } => {
  // メッセージの表示範囲を広げる
  const showStart = messageScrollProgress - 0.2; // 表示開始位置を早める
  const showPeak = messageScrollProgress;       // 最大表示
  const showEnd = messageScrollProgress + 0.2;  // 表示終了位置を延長

  // デフォルト値
  let isVisible = false;
  let opacity = 0;
  let isActive = false;

  // 表示範囲内の場合
  if (currentScrollProgress >= showStart && currentScrollProgress <= showEnd) {
    isVisible = true;
    
    // フェードイン（より滑らかに）
    if (currentScrollProgress <= showPeak) {
      opacity = (currentScrollProgress - showStart) / (showPeak - showStart);
      // イージング関数で滑らかに
      opacity = Math.sin(opacity * Math.PI / 2);
    } 
    // フェードアウト
    else {
      opacity = 1 - (currentScrollProgress - showPeak) / (showEnd - showPeak);
      // イージング関数で滑らかに
      opacity = Math.sin(opacity * Math.PI / 2);
    }
    
    // 0-1の範囲に制限
    opacity = Math.max(0, Math.min(1, opacity));
    
    // ピーク付近でアクティブ状態の範囲を広げる
    isActive = Math.abs(currentScrollProgress - showPeak) < 0.08;
  }

  return { isVisible, opacity, isActive };
};
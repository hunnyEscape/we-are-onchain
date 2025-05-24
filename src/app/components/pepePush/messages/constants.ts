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
  
  // 命名規則: effect-{エフェクト名}
  return `effect-${effect}`;
};

// メッセージ定義
export const cyberMessages: MessageConfig[] = [
  {
    id: 'message-1',
    text: 'The Deep Green Source — a spring hidden within an ancient forest.',
    scrollProgress: 0.15,
    style: 'horizontal',
    size: isMobile() ? '1.5rem' : '2rem',
    align: 'left',
    glitchEffect: 'rgb',
    keywords: ['Deep Green Source', 'ancient forest'],
  },
  {
    id: 'message-2',
    text: 'The Green Source — rich, deep and sweet.',
    scrollProgress: 0.35,
    style: 'horizontal',
    size: isMobile() ? '1.5rem' : '2rem',
    align: 'right',
    glitchEffect: 'wave',
    keywords: ['Green Source'],
  },
  {
    id: 'message-3',
    text: 'It fuels your drive for what\'s next.',
    scrollProgress: 0.55,
    style: 'horizontal',
    size: isMobile() ? '1.5rem' : '2rem',
    align: 'left',
    glitchEffect: 'pulse',
    keywords: ['fuels your drive'],
  },
  {
    id: 'message-4',
    text: 'Feel the green power — right in your hands.',
    scrollProgress: 0.7,
    style: 'horizontal',
    size: isMobile() ? '2rem' : '3rem',
    align: 'center',
    glitchEffect: 'slice',
    keywords: ['green power'],
  },
  {
    id: 'message-5',
    text: 'Pepe ascends.',
    scrollProgress: 0.8,
    style: 'horizontal',
    size: isMobile() ? '2.5rem' : '4rem',
    align: 'center',
    glitchEffect: 'rgb',
    keywords: ['Pepe', 'ascends'],
  },
  {
    id: 'message-6',
    text: 'Pepe summons us here.',
    scrollProgress: 0.9,
    style: 'horizontal',
    size: isMobile() ? '2rem' : '3rem',
    align: 'right',
    glitchEffect: 'jitter',
    keywords: ['Pepe', 'summons'],
  },
  {
    id: 'message-7',
    text: 'Pepe\nMakes us\nFree.',
    scrollProgress: 1.0,
    style: 'horizontal',
    size: isMobile() ? '3rem' : '5rem',
    align: 'center',
    glitchEffect: 'rainbow',
    keywords: ['Pepe', 'Free'],
  }
];

// メッセージ表示範囲の計算
export const calculateMessageVisibility = (
  messageScrollProgress: number,
  currentScrollProgress: number
): { isVisible: boolean; opacity: number; isActive: boolean } => {
  // メッセージの表示範囲
  const showStart = messageScrollProgress - 0.15; // 表示開始
  const showPeak = messageScrollProgress;        // 最大表示
  const showEnd = messageScrollProgress + 0.15;  // 表示終了

  // デフォルト値
  let isVisible = false;
  let opacity = 0;
  let isActive = false;

  // 表示範囲内の場合
  if (currentScrollProgress >= showStart && currentScrollProgress <= showEnd) {
    isVisible = true;
    
    // フェードイン
    if (currentScrollProgress <= showPeak) {
      opacity = (currentScrollProgress - showStart) / (showPeak - showStart);
    } 
    // フェードアウト
    else {
      opacity = 1 - (currentScrollProgress - showPeak) / (showEnd - showPeak);
    }
    
    // 0-1の範囲に制限
    opacity = Math.max(0, Math.min(1, opacity));
    
    // ピーク付近でアクティブ状態
    isActive = Math.abs(currentScrollProgress - showPeak) < 0.05;
  }

  return { isVisible, opacity, isActive };
};
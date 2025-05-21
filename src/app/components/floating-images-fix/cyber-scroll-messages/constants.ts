// src/app/components/floating-images-fix/cyber-scroll-messages/constants.ts

export type GlitchEffectType = 'rgb' | 'slice' | 'wave' | 'pulse' | 'jitter' | 'none';
export type TextDirection = 'horizontal' | 'vertical';
export type TextAlignment = 'left' | 'center' | 'right';

export interface MessageConfig {
  id: string;
  text: string;
  position: {
    start: number; // vh単位での開始位置
    end: number;   // vh単位での終了位置
  };
  style: TextDirection;
  size: string;
  align?: TextAlignment;
  glitchEffect?: GlitchEffectType;
  keywords?: string[]; // 特別強調するキーワード
  delay?: number;      // 表示遅延 (ms)
  color?: string;      // オーバーライド色
}

export interface GlitchEffectConfig {
  className: string;
  intensity: number;
}

// メッセージ定義
export const cyberMessages: MessageConfig[] = [
  {
    id: 'message-1',
    text: '受け継がれし、神秘の奇跡',
    position: { start: 100, end: 300 },
    style: 'horizontal',
    size: '4rem',
    align: 'left',
    glitchEffect: 'rgb',
    keywords: ['神秘', '奇跡'],
  },
  {
    id: 'message-2',
    text: '期は熟し',
    position: { start: 400, end: 600 },
    style: 'vertical',
    size: '8rem',
    align: 'right',
    glitchEffect: 'wave',
    keywords: ['期', '熟'],
  },
  {
    id: 'message-3',
    text: '覚醒する',
    position: { start: 800, end: 1000 },
    style: 'vertical',
    size: '12rem',
    align: 'left',
    glitchEffect: 'slice',
    keywords: ['覚醒'],
  }
];

// グリッチエフェクト設定
export const glitchEffects: Record<GlitchEffectType, GlitchEffectConfig> = {
  rgb: {
    className: 'rgb-split',
    intensity: 2
  },
  wave: {
    className: 'wave-distort',
    intensity: 1.5
  },
  slice: {
    className: 'slice-glitch',
    intensity: 3
  },
  pulse: {
    className: 'pulse-effect',
    intensity: 2
  },
  jitter: {
    className: 'jitter-effect',
    intensity: 1
  },
  none: {
    className: '',
    intensity: 0
  }
};

// システムステータス表示用テキスト
export const systemStatusText = {
  loading: 'システム読み込み中...',
  ready: '神秘モード：アクティブ',
  awakening: '覚醒シーケンス開始...',
  complete: '覚醒完了：無限の可能性が解放されました'
};

// 装飾用ランダムバイナリ生成
export const generateRandomBinary = (length: number): string => {
  return Array.from({ length }, () => Math.round(Math.random())).join('');
};

// 装飾用16進数生成
export const generateRandomHex = (length: number): string => {
  const hexChars = '0123456789ABCDEF';
  return Array.from(
    { length }, 
    () => hexChars[Math.floor(Math.random() * hexChars.length)]
  ).join('');
};
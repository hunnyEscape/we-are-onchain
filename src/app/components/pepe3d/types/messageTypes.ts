// pepe3d/types/messageTypes.ts

export type GlitchEffectType = 'rgb' | 'slice' | 'wave' | 'pulse' | 'jitter' | 'none';

export interface MessageConfig {
  id: string;
  text: string;
  top?: string;
  left?: string;
  width?: string;
  fontSize?: string;
  glitchEffect?: GlitchEffectType;
  keywords?: string[];
  delay?: number;
}

export interface MessageControlPoint {
  scrollProgress: number; // 0-1の範囲
  message: MessageConfig;
  visibility: number; // 0-1の透明度
  animations?: GlitchEffectType[]; // 適用するアニメーション
  fadeInDuration?: number; // フェードイン時間（ms）
  fadeOutDuration?: number; // フェードアウト時間（ms）
}

export interface ScrollMessageState {
  scrollProgress: number;
  activeMessageIndex: number | null;
  visibleMessages: {
    index: number;
    opacity: number;
    isActive: boolean;
  }[];
}

// 修正：実際の実装に合わせて型を統一
export interface MessageVisibilityHookResult {
  activeMessages: {
    config: MessageControlPoint;  // MessageConfigではなくMessageControlPoint
    opacity: number;
    isActive: boolean;
  }[];
  scrollProgress: number;
  debugInfo?: {
    scrollProgress: number;
    currentPointIndex: number;
    nextPointIndex: number;
    totalPoints: number;
    activeMessages: number;
  };
  sectionRef: React.RefObject<HTMLDivElement>;  // オプショナルから必須に変更
}

// レスポンシブ設定
export interface ResponsiveMessageConfig {
  desktop: Partial<MessageConfig>;
  mobile: Partial<MessageConfig>;
}

export interface PepeScrollConfig {
  // セクションの高さ設定
  SECTION_HEIGHT_VH: number;
  
  // スクロール感度
  SCROLL_SENSITIVITY: number;
  
  // デバッグモード
  DEBUG_MODE: boolean;
  
  // レスポンシブ設定
  MOBILE_BREAKPOINT: number;
  
  // アニメーション設定
  DEFAULT_FADE_DURATION: number;
  SMOOTH_FACTOR: number;
}
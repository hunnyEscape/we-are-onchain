// src/app/components/pepePush/messages/types.ts

// グリッチエフェクトタイプの定義
export type GlitchEffectType = 
  | 'rgb'      // RGB分離効果
  | 'slice'    // スライスグリッチ
  | 'wave'     // 波形歪み
  | 'pulse'    // パルス効果
  | 'jitter'   // 震え効果
  | 'rainbow'  // 虹色エフェクト
  | 'neon'     // ネオン発光
  | 'none';    // エフェクトなし

// テキスト配置タイプ
export type TextAlignment = 'left' | 'center' | 'right';

// メッセージ設定インターフェース
export interface MessageConfig {
  id: string;
  text: string;
  scrollProgress: number;    // 0-1の範囲のスクロール位置
  style: 'horizontal';       // 現在は横書きのみサポート
  size: string;              // フォントサイズ (例: '2rem')
  align: TextAlignment;      // テキスト配置
  glitchEffect?: GlitchEffectType;  // 適用するグリッチエフェクト
  keywords?: string[];       // 強調するキーワード
  delay?: number;            // 表示遅延 (ms)
}

// スクロールメッセージの設定
export interface ScrollMessageConfig {
  SECTION_HEIGHT_VH: number;  // セクションの高さ (vh単位)
  SCROLL_SENSITIVITY: number; // スクロール感度
  DEBUG_MODE: boolean;        // デバッグモード
  FADE_DURATION: number;      // フェードイン/アウト時間 (ms)
  VISIBILITY_THRESHOLD: number; // メッセージ表示閾値
}

// アクティブメッセージの状態
export interface ActiveMessageState {
  message: MessageConfig;
  opacity: number;
  isActive: boolean;
}

// デバッグ情報
export interface DebugInfo {
  scrollProgress: number;
  activeMessageCount: number;
  viewportHeight: number;
  scrollY: number;
}
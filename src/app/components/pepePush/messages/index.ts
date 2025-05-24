// src/app/components/pepePush/messages/index.ts

// メインコンポーネントをエクスポート
export { default as ScrollMessages } from './ScrollMessages';

// 型定義をエクスポート
export type { 
  GlitchEffectType,
  TextAlignment,
  MessageConfig,
  ScrollMessageConfig,
  ActiveMessageState,
  DebugInfo
} from './types';

// 定数と設定をエクスポート
export {
  cyberMessages,
  calculateMessageVisibility,
  SCROLL_CONFIG,
  getEffectClass,
  isMobile
} from './constants';
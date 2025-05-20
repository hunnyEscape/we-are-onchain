// digitalBackground/index.ts
// エクスポートファイル - インポートを簡略化するため

import DigitalBackground from './DigitalBackground';
import DigitalEnvironment from './DigitalEnvironment';

export {
  DigitalBackground,
  DigitalEnvironment
};

// StorySection型をStoryOverlayから再エクスポート（必要に応じて）
export type { StorySection } from '../sphereBackground/StoryOverlay';
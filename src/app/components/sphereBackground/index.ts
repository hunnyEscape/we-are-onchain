// sphereBackground/index.ts
// エクスポートファイル - インポートを簡略化するため

import SphereBackground from './SphereBackground';
import RotatingSphere from './RotatingSphere';
import StoryOverlay from './StoryOverlay';
import ScrollProgress from './ScrollProgress';

export { 
  SphereBackground,
  RotatingSphere,
  StoryOverlay,
  ScrollProgress
};

// 型定義も必要に応じてエクスポート
export type { StorySection } from './StoryOverlay';

// StorySection型を正しくエクスポート
interface StorySection {
  id: number;
  title: string;
  content: string;
  triggerPoint: number;
}

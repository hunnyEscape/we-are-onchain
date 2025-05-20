'use client';
import React, { useEffect, useState } from 'react';
import styles from './SphereStyles.module.css';

interface StorySection {
  id: number;
  title: string;
  content: string;
  triggerPoint: number; // スクロール位置のパーセント値 (0-100)
}

interface StoryOverlayProps {
  scrollY: number;
  totalHeight?: number; // コンテナの総高さ (px)
  storyData?: StorySection[]; // カスタムストーリーデータ
}

// デフォルトのストーリーセクション
const DEFAULT_STORY_SECTIONS: StorySection[] = [
  {
    id: 1,
    title: "セルフカストディアンの戦士たちへ",
    content: "真の勇者にしか手に入らない、オンチェーンの秘薬。暗号空間を駆け抜け、鍵は「自らの手」にのみ宿る。",
    triggerPoint: 10
  },
  {
    id: 2,
    title: "鍵は君の手に",
    content: "開け、未来への扉を。デジタル資産の真の守護者となれ。自分自身の銀行となるとき、真の自由が訪れる。",
    triggerPoint: 30
  },
  {
    id: 3,
    title: "セルフカストディアンの勇者よ",
    content: "鎧を纏いし魂を呼び覚ませ。中央集権の束縛から解き放たれ、暗号の海原を自由に航海せよ。",
    triggerPoint: 50
  },
  {
    id: 4,
    title: "自律と主権の証",
    content: "ブロックチェーンの守護者よ、自らの資産を守り抜く強さを。信頼せよ、ただし検証せよ。その手にある鍵こそが真実。",
    triggerPoint: 70
  },
  {
    id: 5,
    title: "ONLY FOR SELF-CUSTODY CHAMPIONS",
    content: "真の戦士たちへ贈る究極の力。あなたの魂は準備ができているか？セルフカストディアンの道を歩む者だけが手にする栄光。",
    triggerPoint: 90
  }
];

const StoryOverlay: React.FC<StoryOverlayProps> = ({ 
  scrollY = 0,
  totalHeight = 3000, // デフォルト値
  storyData = DEFAULT_STORY_SECTIONS
}) => {
  const [activeSection, setActiveSection] = useState<StorySection | null>(null);
  const [textOpacity, setTextOpacity] = useState(0);
  const [textTransform, setTextTransform] = useState('translateY(20px)');

  useEffect(() => {
    // スクロール位置をパーセンテージに変換
    const scrollPercent = Math.min((scrollY / totalHeight) * 100, 100);
    
    // アクティブなセクションを特定
    const currentSection = [...storyData]
      .sort((a, b) => b.triggerPoint - a.triggerPoint)
      .find(section => scrollPercent >= section.triggerPoint);
    
    if (currentSection && (!activeSection || currentSection.id !== activeSection.id)) {
      // 新しいセクションがアクティブになる場合、アニメーション用に設定
      setTextOpacity(0);
      setTextTransform('translateY(20px)');
      
      // 少し遅延を入れてからフェードイン
      setTimeout(() => {
        setActiveSection(currentSection);
        setTextOpacity(1);
        setTextTransform('translateY(0)');
      }, 100);
    } else if (!currentSection && activeSection) {
      // すべてのセクションが非アクティブになる場合
      setTextOpacity(0);
      setTextTransform('translateY(-20px)');
      setTimeout(() => setActiveSection(null), 500);
    }
  }, [scrollY, totalHeight, storyData, activeSection]);

  if (!activeSection) return null;

  return (
    <div className={styles.storyOverlay}>
      <div 
        className={styles.storyContent}
        style={{
          opacity: textOpacity,
          transform: textTransform,
          transition: 'opacity 0.5s ease, transform 0.5s ease'
        }}
      >
        <h2 className={styles.storyTitle}>{activeSection.title}</h2>
        <p className={styles.storyText}>{activeSection.content}</p>
      </div>
    </div>
  );
};

export default StoryOverlay;
// types.d.ts
type GlitchEffectType = 'rgb' | 'slice' | 'wave' | 'pulse' | 'jitter' | 'none';

interface MessageConfig {
	id: string;
	text: string;
	top?: string;
	left?: string;
	width?: string;
	fontSize?: string;
	glitchEffect?: GlitchEffectType;
	keywords?: string[];  // 特別強調するキーワード
	delay?: number;       // 表示遅延
}

interface CyberInterfaceProps {
	scrollProgress: number; // 0から1の間の値
	activeIndex: number | null;
	totalSections: number;
}

// ハイライト用のテキスト処理関連
interface TextFragment {
	text: string;
	isKeyword: boolean;
	keywordType?: string;
}
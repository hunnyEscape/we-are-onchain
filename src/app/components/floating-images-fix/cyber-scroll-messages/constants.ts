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
		text: '受け継がれた神秘の奇跡',
		position: { start: 0, end: 200 },
		style: 'horizontal',
		size: '4rem',
		align: 'left',
		glitchEffect: 'rgb',
		keywords: ['神秘', '奇跡'],
		color: '#ffffff', // 白色ベース
	},
	{
		id: 'message-2',
		text: '限られた者がたどり着く',
		position: { start: 200, end: 400 },
		style: 'horizontal',
		size: '4rem',
		align: 'right',
		glitchEffect: 'wave',
		keywords: ['限られた', 'たどり着く'],
		color: '#ffffff', // 白色ベース
	},
	{
		id: 'message-3',
		text: '境地',
		position: { start: 400, end: 700 },
		style: 'vertical',
		size: '12rem',
		align: 'left',
		glitchEffect: 'slice',
		keywords: ['境地'],
		color: '#ffffff', // 白色ベース
	}
];

// グリッチエフェクト設定
export const glitchEffects: Record<GlitchEffectType, GlitchEffectConfig> = {
	rgb: {
		className: 'rgbSplit',
		intensity: 2
	},
	wave: {
		className: 'waveDistort',
		intensity: 1.5
	},
	slice: {
		className: 'sliceGlitch',
		intensity: 3
	},
	pulse: {
		className: 'pulseEffect',
		intensity: 2
	},
	jitter: {
		className: 'jitterEffect',
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
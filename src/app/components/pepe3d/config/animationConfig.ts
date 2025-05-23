// pepe3d/config/animationConfig.ts
import { GlitchEffectType } from '../types/messageTypes';

export const ANIMATION_CONFIG = {
	// 基本的なトランジション設定
	TRANSITIONS: {
		OPACITY: 'opacity 0.7s ease-in-out',
		TRANSFORM: 'transform 0.3s ease-out',
		ALL: 'all 0.5s ease-in-out'
	},

	// グリッチエフェクトの設定
	GLITCH_EFFECTS: {
		rgb: {
			duration: '0.4s',
			intensity: 'normal',
			textShadow: '-2px 0 #ff0000, 2px 0 #00ffff'
		},
		slice: {
			duration: '3s',
			intensity: 'high',
			clipPath: true
		},
		wave: {
			duration: '2s',
			intensity: 'low',
			transform: 'translateY'
		},
		pulse: {
			duration: '1.5s',
			intensity: 'medium',
			scale: 1.05
		},
		jitter: {
			duration: '0.1s',
			intensity: 'high',
			infinite: true
		}
	},

	// ランダムグリッチの設定
	RANDOM_GLITCH: {
		PROBABILITY: 0.01, // 1%の確率
		DURATION: 150, // ms
		EFFECTS: ['jitter', 'rgb'] as GlitchEffectType[]
	},

	// メッセージ固有のアニメーション
	MESSAGE_ANIMATIONS: {
		FADE_IN: {
			from: { opacity: 0, transform: 'translateY(20px)' },
			to: { opacity: 1, transform: 'translateY(0)' },
			duration: 700
		},
		FADE_OUT: {
			from: { opacity: 1, transform: 'translateY(0)' },
			to: { opacity: 0, transform: 'translateY(-10px)' },
			duration: 500
		},
		GLOW_PULSE: {
			textShadow: [
				'0 0 8px rgba(0, 255, 102, 0.7)',
				'0 0 16px rgba(0, 255, 102, 0.9)',
				'0 0 8px rgba(0, 255, 102, 0.7)'
			],
			duration: 2000
		}
	}
} as const;

// グリッチエフェクトのCSSクラスマッピング
export const getGlitchClass = (effect?: GlitchEffectType): string => {
	const classMap = {
		rgb: 'rgbSplit',
		slice: 'sliceGlitch',
		wave: 'waveDistort',
		pulse: 'pulse',
		jitter: 'jitter',
		none: ''
	};

	return effect ? classMap[effect] || '' : '';
};

// キーワードハイライト用のクラス
export const KEYWORD_CLASSES = {
	GLITCH: 'keywordGlitch',
	HIGHLIGHT: 'highlight',
	GLOW: 'glow-effect'
} as const;

// レスポンシブアニメーション設定
export const getResponsiveAnimationConfig = () => {
	const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;

	return {
		SCALE_FACTOR: isMobile ? 0.8 : 1.0,
		ANIMATION_SPEED: isMobile ? 0.8 : 1.0,
		REDUCED_MOTION: isMobile,
		GLITCH_INTENSITY: isMobile ? 'low' : 'normal'
	};
};
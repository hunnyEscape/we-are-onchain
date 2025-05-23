// pepe3d/config/messageControlPoints.ts
import { MessageControlPoint, PepeScrollConfig } from '../types/messageTypes';

// スマホ判定のヘルパー関数
const isMobile = () => {
	if (typeof window === 'undefined') return false;
	return window.innerWidth <= 768;
};

// 基本設定
export const CONFIG: PepeScrollConfig = {
	SECTION_HEIGHT_VH: 400, // PepeTopセクションの高さ
	SCROLL_SENSITIVITY: 1.0,
	DEBUG_MODE: false,
	MOBILE_BREAKPOINT: 768,
	DEFAULT_FADE_DURATION: 700,
	SMOOTH_FACTOR: 0.1
};

// レスポンシブ対応のメッセージ制御点
export const getMessageControlPoints = (): MessageControlPoint[] => {
	const mobile = isMobile();

	return [
		{
			scrollProgress: 0.15,
			visibility: 1,
			fadeInDuration: 700,
			fadeOutDuration: 500,
			message: {
				id: 'deep-green-source',
				text: 'The Deep Green Source — a spring hidden within an ancient forest.',
				top: mobile ? '15vh' : '20vh',
				left: mobile ? '5vw' : '10vw',
				width: 'auto',
				fontSize: mobile ? '1.5rem' : '2rem',
				glitchEffect: 'rgb',
				keywords: ['Deep Green Source', 'ancient forest'],
			}
		},
		{
			scrollProgress: 0.35,
			visibility: 1,
			fadeInDuration: 700,
			fadeOutDuration: 500,
			message: {
				id: 'green-source-rich',
				text: 'The Green Source — rich, deep and sweet.',
				top: mobile ? '35vh' : '30vh',
				left: mobile ? '10vw' : '30vw',
				width: 'auto',
				fontSize: mobile ? '1.5rem' : '2rem',
				glitchEffect: 'rgb',
				keywords: ['Green Source'],
			}
		},
		{
			scrollProgress: 0.55,
			visibility: 1,
			fadeInDuration: 700,
			fadeOutDuration: 500,
			message: {
				id: 'fuels-drive',
				text: 'It fuels your drive for what\'s next.',
				top: mobile ? '50vh' : '40vh',
				left: mobile ? '5vw' : '10vw',
				width: 'auto',
				fontSize: mobile ? '1.5rem' : '2rem',
				glitchEffect: 'wave',
				keywords: ['fuels your drive'],
			}
		},
		{
			scrollProgress: 0.8,
			visibility: 1,
			fadeInDuration: 700,
			fadeOutDuration: 500,
			animations: ['pulse'],
			message: {
				id: 'green-power',
				text: 'Feel the green power — right in your hands.',
				top: mobile ? '65vh' : '60vh',
				left: mobile ? '10vw' : '30vw',
				width: 'auto',
				fontSize: mobile ? '1.5rem' : '3rem',
				glitchEffect: 'slice',
				keywords: ['green power'],
			}
		}
	];
};

// スクロール進行度に基づいてアクティブなメッセージを取得
export const getActiveMessages = (scrollProgress: number) => {
	const controlPoints = getMessageControlPoints();
	const activeMessages: Array<{
		config: MessageControlPoint;
		opacity: number;
		isActive: boolean;
	}> = [];

	controlPoints.forEach((point, index) => {
		// 最後のメッセージかどうかを判定
		const isLastMessage = index === controlPoints.length - 1;

		// メッセージの表示範囲を計算
		const showStart = point.scrollProgress - 0.15; // 表示開始（早める）
		const showPeak = point.scrollProgress; // 完全表示

		// 最後のメッセージは早めに終了、他は延長
		const showEnd = isLastMessage
			? point.scrollProgress + 0.15  // 最後のメッセージは通常の長さ
			: point.scrollProgress + 0.25; // 他のメッセージは延長

		let opacity = 0;
		let isActive = false;

		if (scrollProgress >= showStart && scrollProgress <= showEnd) {
			if (scrollProgress <= showPeak) {
				// フェードイン（より滑らかに）
				const fadeInProgress = (scrollProgress - showStart) / (showPeak - showStart);
				opacity = Math.max(0, Math.min(1, fadeInProgress));
			} else {
				// フェードアウト
				const fadeOutProgress = (scrollProgress - showPeak) / (showEnd - showPeak);
				opacity = Math.max(0, Math.min(1, 1 - fadeOutProgress));
			}

			// ピーク付近でアクティブ状態（範囲を拡大）
			isActive = Math.abs(scrollProgress - showPeak) < 0.08;

			if (opacity > 0) {
				activeMessages.push({
					config: point,
					opacity,
					isActive
				});
			}
		}
	});

	return activeMessages;
};

// デバッグ情報を取得
export const getDebugInfo = (scrollProgress: number) => {
	const controlPoints = getMessageControlPoints();
	let currentPointIndex = -1;
	let nextPointIndex = -1;

	for (let i = 0; i < controlPoints.length; i++) {
		if (scrollProgress >= controlPoints[i].scrollProgress) {
			currentPointIndex = i;
		} else {
			nextPointIndex = i;
			break;
		}
	}

	return {
		scrollProgress,
		currentPointIndex,
		nextPointIndex,
		totalPoints: controlPoints.length,
		activeMessages: getActiveMessages(scrollProgress).length
	};
};
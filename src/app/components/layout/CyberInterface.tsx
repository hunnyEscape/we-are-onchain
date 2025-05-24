// src/app/components/floating-images-fix/cyber-scroll-messages/CyberInterface.tsx

'use client';

import React, { useEffect, useState } from 'react';
import styles from './styles.module.css';
import {
	generateRandomBinary,
	generateRandomHex,
	systemStatusText,
	cyberMessages
} from './constants';

interface CyberInterfaceProps {
}

const CyberInterface: React.FC<CyberInterfaceProps> = ({

}) => {
	const [dataStream, setDataStream] = useState<string[]>([]);
	const [systemTime, setSystemTime] = useState<string>('');
	const [scrollProgress, setScrollProgress] = useState<number>(0);
	const [activeIndex, setActiveIndex] = useState<number | null>(null);
	const [randomGlitch, setRandomGlitch] = useState<boolean>(false);
	const [isFlashActive, setIsFlashActive] = useState<boolean>(false);
	const [debugInfo, setDebugInfo] = useState<{ [key: string]: any }>({});

	// 強制的に全てのメッセージをアクティブにする（デバッグ用）
	const [forceAllActive, setForceAllActive] = useState<boolean>(false);

	useEffect(() => {
		const handleScroll = () => {
			// 現在のページ全体のスクロール位置
			const scrollTop = window.scrollY;
			const winHeight = window.innerHeight;
			const docHeight = document.documentElement.scrollHeight;

			// まず全体のスクロール進捗を計算
			const totalScrollProgress = scrollTop / (docHeight - winHeight);

			// FloatingImagesFixSectionを特定のセレクターで検索
			const targetSection = document.querySelector('#floating-images-fix-section') as HTMLElement;

			if (!targetSection) {
				// フォールバック: クラス名でも検索
				const fallbackSection = document.querySelector('.floating-images-fix-section') as HTMLElement;

				if (!fallbackSection) {
					// セクションが見つからない場合、ページの相対位置で推定
					console.log('Target section not found, estimating position');

					// ページの相対位置から推定（調整された値）
					const estimatedStart = docHeight * 0.5;  // 0.66から0.5に調整
					const estimatedHeight = docHeight * 0.25;

					// 相対スクロール位置を計算
					const relativeScroll = Math.max(0, Math.min(1,
						(scrollTop - estimatedStart) / estimatedHeight
					));

					setScrollProgress(relativeScroll);
					setDebugInfo({
						scrollTop,
						docHeight,
						estimatedStart,
						estimatedHeight,
						relativeScroll,
						mode: 'estimated'
					});

					// メッセージ表示の判定
					updateActiveMessage(relativeScroll * 800);
				} else {
					// フォールバックセクションを使用
					processSectionScroll(fallbackSection, scrollTop);
				}
			} else {
				// メインのIDセレクターで見つかった場合
				processSectionScroll(targetSection, scrollTop);
			}

			// ランダムグリッチの発生
			triggerRandomGlitch();
		};

		// セクションスクロール処理を共通化
		const processSectionScroll = (section: HTMLElement, scrollTop: number) => {
			const rect = section.getBoundingClientRect();
			const sectionTop = rect.top + scrollTop;
			const sectionHeight = rect.height;

			// セクション内相対位置を計算
			let relativeScroll = 0;
			if (scrollTop < sectionTop) {
				relativeScroll = 0;
			} else if (scrollTop > sectionTop + sectionHeight) {
				relativeScroll = 1;
			} else {
				relativeScroll = (scrollTop - sectionTop) / sectionHeight;
			}

			setScrollProgress(relativeScroll);
			setDebugInfo({
				scrollTop,
				sectionTop,
				sectionHeight,
				relativeScroll,
				viewportOffset: rect.top,
				mode: 'section-based',
				sectionFound: section.id || section.className
			});

			// メッセージ表示の判定
			updateActiveMessage(relativeScroll * 800);
		};

		// メッセージのアクティブ状態を更新
		const updateActiveMessage = (currentVhPosition: number) => {
			if (forceAllActive) {
				setActiveIndex(0);
				return;
			}

			// セクション検出が正常に動作している場合は、オフセット調整を少なくする
			const adjustedPosition = currentVhPosition - 50; // 150から50に調整

			let foundActive = false;
			let activeIdx = null;


			setActiveIndex(foundActive ? activeIdx : null);
		};

		// フラッシュエフェクトをトリガー
		const triggerFlashEffect = () => {
			setIsFlashActive(true);
			setTimeout(() => setIsFlashActive(false), 300);
		};

		// ランダムなグリッチエフェクトをトリガー
		const triggerRandomGlitch = () => {
			if (Math.random() > 0.95) {
				setRandomGlitch(true);
				setTimeout(() => setRandomGlitch(false), 150);
			}
		};

		window.addEventListener('scroll', handleScroll);
		handleScroll(); // 初期化時に一度実行

		// キーボードショートカット：Dキーでデバッグモード切替
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === 'd' || e.key === 'D') {
				setForceAllActive(prev => !prev);
				console.log('Debug mode:', !forceAllActive);
			}
		};

		window.addEventListener('keydown', handleKeyDown);

		return () => {
			window.removeEventListener('scroll', handleScroll);
			window.removeEventListener('keydown', handleKeyDown);
		};
	}, [forceAllActive, isFlashActive]);


	// システムステータステキスト
	const getStatusText = () => {
		if (activeIndex === null) return systemStatusText.loading;
		if (activeIndex === 0) return systemStatusText.ready;
		if (activeIndex === 1) return systemStatusText.awakening;
		if (activeIndex === 2) return systemStatusText.complete;
		return systemStatusText.loading;
	};

	// データストリームを生成
	useEffect(() => {
		// 初期データストリームを生成
		const initialData: string[] = [];
		for (let i = 0; i < 50; i++) {
			if (Math.random() > 0.7) {
				initialData.push(generateRandomHex(16));
			} else {
				initialData.push(generateRandomBinary(16));
			}
		}
		setDataStream(initialData);

		// 定期的にデータストリームを更新
		const interval = setInterval(() => {
			setDataStream(prev => {
				const newData = [...prev];
				// 1-3行をランダムに置き換え
				const replaceCount = Math.floor(Math.random() * 3) + 1;
				for (let i = 0; i < replaceCount; i++) {
					const index = Math.floor(Math.random() * newData.length);
					if (Math.random() > 0.7) {
						newData[index] = generateRandomHex(16);
					} else {
						newData[index] = generateRandomBinary(16);
					}
				}
				return newData;
			});

			// ランダムなグリッチ効果
			if (Math.random() > 0.9) {
				setRandomGlitch(true);
				setTimeout(() => setRandomGlitch(false), 200);
			}
		}, 500);

		// システム時間の更新
		const timeInterval = setInterval(() => {
			const now = new Date();
			setSystemTime(`SYS://AWAKENING_SEQUENCE v2.4.7 | ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`);
		}, 1000);

		return () => {
			clearInterval(interval);
			clearInterval(timeInterval);
		};
	}, []);

	// エネルギーレベル（スクロール進行に基づく）
	const energyLevel = Math.max(5, Math.min(100, scrollProgress * 100));

	return (
		<>


			{/* フラッシュエフェクト */}
			<div className={`${styles.flashEffect} ${isFlashActive ? styles.flashActive : ''}`}></div>

			{/* コーナーマーカー */}
			<div className={styles.cyberFrame}>
				<div className={`${styles.cornerMarker} ${styles.topLeft} ${randomGlitch ? styles.jitterEffect : ''}`}></div>
				<div className={`${styles.cornerMarker} ${styles.topRight} ${randomGlitch ? styles.jitterEffect : ''}`}></div>
				<div className={`${styles.cornerMarker} ${styles.bottomLeft} ${randomGlitch ? styles.jitterEffect : ''}`}></div>
				<div className={`${styles.cornerMarker} ${styles.bottomRight} ${randomGlitch ? styles.jitterEffect : ''}`}></div>
			</div>

			<div className={`${styles.thickScanline}`} />
			<div className={`${styles.scanline}`}></div>
			{/* データストリーム */}
			<div className={`${styles.dataStream} hidden sm:block`}>
				<div className={styles.dataContent}>
					{dataStream.map((line, index) => (
						<div key={index} className={randomGlitch && index % 5 === 0 ? styles.jitterEffect : ''}>
							{line}
						</div>
					))}
				</div>
			</div>

			{/* エネルギーメーター */}
			<div className={`${styles.energyMeter} hidden sm:block`}>
				<div
					className={styles.energyLevel}
					style={{ height: `${energyLevel}%` }}
				></div>
			</div>

			{/* システムステータス */}
			<div className={`${styles.systemStatus} hidden sm:block`}>
				<div>{systemTime}</div>
				<div>SECTION: {activeIndex !== null ? activeIndex + 1 : 0}/{cyberMessages.length}</div>
				<div>ENERGY: {Math.floor(energyLevel)}%</div>
				<div>{getStatusText()}</div>
			</div>

		</>
	);
};

export default CyberInterface;
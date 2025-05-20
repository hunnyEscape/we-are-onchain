'use client';
import React, { useEffect, useRef, useState } from 'react';
import styles from './PepeStyles.module.css';
type MessageConfig = {
	id: string;
	text: string;
	top?: string;
	left?: string;
	width?: string;
	fontSize?: string;
};

const messages: MessageConfig[] = [
	{
		id: 'trigger-1',
		text: '🧪深緑の源泉 ー 古代から森にひそむ「ぺぺの泉」。',
		top: '20vh',
		left: '10vw',
		width: 'auto',
		fontSize: '2rem',
	},
	{
		id: 'trigger-2',
		text: '💎そこから湧き出るグリーンミネラルが、濃厚なコクとほどよい甘みをもたらす。',
		top: '30vh',
		left: '50vw',
		width: 'max-content',
		fontSize: '2rem',
	},
	{
		id: 'trigger-3',
		text: '一口ごとに脈打つビート、疲労を吹き飛ばし、次の挑戦へと背中を押す。',
		top: '40vh',
		left: '10vw',
		width: 'max-content',
		fontSize: '2rem',
	},
	{
		id: 'trigger-4',
		text: '次元を超えたグリーンパワーを、その手で感じよ。',
		top: '50vh',
		left: '30vw',
		width: '60vw',
		fontSize: '3rem', // 特に大きく
	},
];

const ScrollTriggerMessages: React.FC = () => {
	const refs = useRef<(HTMLDivElement | null)[]>([]);
	const [activeIndex, setActiveIndex] = useState<number | null>(null);

	useEffect(() => {
		const observer = new IntersectionObserver(
			(entries) => {
				let found = false;

				entries.forEach((entry) => {
					const index = refs.current.findIndex((ref) => ref === entry.target);
					if (entry.isIntersecting) {
						setActiveIndex(index);
						found = true;
					}
				});

				if (!found) {
					setActiveIndex(null);
				}
			},
			{
				root: null,
				rootMargin: '0px',
				threshold: 0.5,
			}
		);

		refs.current.forEach((ref) => {
			if (ref) observer.observe(ref);
		});

		return () => {
			refs.current.forEach((ref) => {
				if (ref) observer.unobserve(ref);
			});
		};
	}, []);

	return (
		<>
			{/* スクロールトリガーゾーン */}
			{messages.map((_, i) => (
				<div
					key={`trigger-${i}`}
					ref={(el) => (refs.current[i] = el)}
					className="h-[100vh] w-full"
				/>
			))}

			{/* 表示するメッセージ */}
			{messages.map((msg, i) => (
				<div
					className={`
						${styles.message}
						${activeIndex === i ? styles.active : ''}
						${styles.scan}
						${msg.id === 'trigger-4' ? styles.glitch + ' ' + styles.highlight : ''}
					`}
					style={{ top: msg.top, left: msg.left, width: msg.width, fontSize: msg.fontSize }}
				>
					{msg.text}
				</div>
			))}
		</>
	);
};

export default ScrollTriggerMessages;

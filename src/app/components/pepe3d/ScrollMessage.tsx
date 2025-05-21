'use client';
import React, { useEffect, useRef, useState } from 'react';

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
		left: '30vw',
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
		top: '80vh',
		left: '30vw',
		width: '60vw',
		fontSize: '3rem',
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
					const idx = refs.current.findIndex((r) => r === entry.target);
					if (entry.isIntersecting) {
						setActiveIndex(idx);
						found = true;
					}
				});
				if (!found) setActiveIndex(null);
			},
			{ root: null, rootMargin: '0px', threshold: 0.5 }
		);

		refs.current.forEach((r) => r && observer.observe(r));
		return () => refs.current.forEach((r) => r && observer.unobserve(r));
	}, []);

	return (
		<>
			{/* トリガー用ダミーゾーン（100vh × 4つ） */}
			{messages.map((_, i) => (
				<div key={`zone-${i}`} ref={(el) => (refs.current[i] = el)} className="h-screen w-full" />
			))}

			{/* フローティングメッセージ */}
			{messages.map((msg, i) => {
				const isActive = activeIndex === i;
				return (
					<div
						key={msg.id}
						className={`fixed z-50 font-pixel text-white transition-opacity duration-700 ease-in-out
									${isActive ? 'opacity-100' : 'opacity-0'}
									${msg.id === 'trigger-4' && isActive ? 'animate-glitch-slow' : ''}
            					`}
						style={{
							top: msg.top,
							left: msg.left,
							width: msg.width,
							fontSize: msg.fontSize,
						}}
					>
						{msg.text}
					</div>
				);
			})}
		</>
	);
};

export default ScrollTriggerMessages;

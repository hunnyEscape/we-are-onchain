// src/app/components/hero-section/ProteinStory.tsx
'use client';
import React, { useRef } from 'react';
import { motion, useScroll, useTransform, MotionProps } from 'framer-motion';

interface StoryBlockProps {
	children: React.ReactNode;
	delay?: number;
}

const StoryBlock: React.FC<StoryBlockProps> = ({ children, delay = 0 }) => {
	const ref = useRef<HTMLDivElement>(null);

	const { scrollYProgress } = useScroll({
		target: ref as React.RefObject<HTMLElement>,
		offset: ["start end", "end end"]
	});

	const opacity = useTransform(scrollYProgress, [0, 0.3], [0, 1]);
	const y = useTransform(scrollYProgress, [0, 0.3], [50, 0]);

	return (
		<motion.div
			ref={ref}
			style={{ opacity, y }}
			className="mb-8 p-4 bg-black/80 border-l-2 border-neonGreen relative overflow-hidden"
		>
			<div className="h-4 w-4 bg-neonGreen absolute -left-[9px] top-4"></div>
			{children}
		</motion.div>
	);
};

const ProteinStory: React.FC = () => {
	return (
		<div className="max-w-prose mx-auto px-4 py-16">
			<StoryBlock>
				<div className="text-neonGreen mb-2 font-mono text-sm">&gt; product_info.exe</div>
				<h3 className="text-neonOrange font-bold text-xl mb-2">
					"味わうたび、世界を揺らす"
				</h3>
				<p className="text-white mb-4">
					暗闇の向こうでそっと灯るは、ぺぺのグリーン―― 一口ごとに脈打つビートが、未知の力を呼び覚ます。
				</p>
				<div className="text-neonGreen font-bold mb-2">
					**"ペペ味"スペシャルフレーバ** は、ただのプロテインではない。 それは、ぺぺが紡ぐ「勇気」と「ユーモア」の物語。
				</div>
			</StoryBlock>

			<StoryBlock>
				<div className="text-neonGreen mb-2 font-mono text-sm">&gt; story.exe</div>
				<ol className="list-decimal list-inside text-white mb-4 space-y-4 pl-4">
					<li>
						<span className="text-neonGreen font-bold">深緑の源泉</span><br />
						古代から森にひそむ「ぺぺの泉」。そこから湧き出るグリーンミネラルが、濃厚なコクとほどよい甘みをもたらす。
					</li>
					<li>
						<span className="text-neonGreen font-bold">クリスプな刻印</span><br />
						ほんのりビターな後味に、キラリと光るライムの爽快感。トレーニング後の疲労を吹き飛ばし、次の挑戦へと背中を押す。
					</li>
					<li>
						<span className="text-neonGreen font-bold">奇跡のブレンド</span><br />
						完全植物由来のホエイ＆ピープロテインを黄金比でミックス。ぺぺの冒険譚を詰め込んだ、贅沢な一杯。
					</li>
				</ol>
			</StoryBlock>

			<StoryBlock>
				<div className="border-l-2 border-neonOrange pl-4 italic text-white my-6 text-lg">
					"飲めば、君もぺぺとともに駆ける。"
				</div>
				<p className="text-white mb-6">
					次元を超えたグリーンパワーを、その手で感じよ。 <span className="text-neonOrange font-bold">PAY. PUMP. LIVE.</span>
				</p>
				<div className="mt-6 text-center">
					<div className="border border-neonGreen inline-block px-6 py-2 text-lg">
						<span className="text-white">We Are</span> <span className="text-neonGreen">On-Chain</span> – 今、この一杯が、ぺぺ世界の扉を開く。
					</div>
				</div>
			</StoryBlock>

			{/* 次のセクションへのインディケーター */}
			<motion.div
				className="text-center mt-16 text-neonGreen"
				initial={{ opacity: 0 }}
				whileInView={{ opacity: 1 }}
				transition={{ delay: 0.5 }}
			>
				<div className="animate-bounce mb-2">↓</div>
				<div className="text-sm">次のセクションへ</div>
			</motion.div>
		</div>
	);
};

export default ProteinStory;
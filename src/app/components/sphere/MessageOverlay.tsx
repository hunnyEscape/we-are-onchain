// src/app/components/SelfCustodySection.tsx
'use client';

import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

/**
 * Self Custody Text Effect Section
 * - Tall scrollable region (300vh)
 * - Scanline overlay fixed across viewport
 * - After 200vh scroll, messages stick to top-left
 * - Typewriter intro line
 * - Scroll-triggered fade & slide key line
 * - Rainbow-tinted weak glitch effect
 * - Adjustable line breaks via whitespace-pre-line
 */
const SelfCustodySection: React.FC = () => {
	return (
		<section className="snap-start relative overflow-hidden">
			{/* Scanline Overlay */}
			<div className="pointer-events-none fixed inset-0 bg-gradient-to-b from-transparent via-black/10 to-transparent opacity-30 animate-scanline z-10" />

			{/* Sticky container: intro + key line stick after 200vh */}
			<div className="sticky top-0 pt-[200vh] z-20">
				<div className="absolute top-0 left-0 mt-8 ml-8 w-auto max-w-6xl text-left">
					{/* Typewriter Intro */}
					<motion.div
						initial={{ width: 0 }}
						animate={{ width: '100%' }}
						transition={{ duration: 2, ease: 'easeInOut' }}
					>
						<div className="overflow-hidden whitespace-nowrap border-r-2 border-neonGreen font-mono text-neonGreen text-sm mb-6">
						  &gt; selfcustody.exe
						</div>
					</motion.div>

					{/* Key highlighted line with glitch and custom line break */}
					<KeyLine
						text={`For the Few Who Hold Their Own Keys.\nAwaken Your Soul.`}
						colorClass="text-neonGreen font-heading text-[7vw]"
						borderClass="border-l-2 border-neonGreen"
					/>
				</div>
			</div>

			{/* Rainbow glitch keyframes and class */}
			<style jsx global>{`
        .glitchRainbow {
          position: relative;
          animation: glitchRainbow 3s ease-in-out infinite;
        }
        @keyframes glitchRainbow {
          0%,100% { text-shadow: none; }
          20% { text-shadow: 4px 0 #f00, -4px 0 #0ff; }
          40% { text-shadow: 4px 0 #ff0, -4px 0 #00f; }
          60% { text-shadow: 4px 0 #0f0, -4px 0 #f0f; }
          80% { text-shadow: 4px 0 #f0f, -4px 0 #ff0; }
        }
      `}</style>
		</section>
	);
};

interface KeyLineProps {
	text: string;
	colorClass: string;
	borderClass: string;
}

const KeyLine: React.FC<KeyLineProps> = ({ text, colorClass, borderClass }) => {
	const ref = useRef<HTMLDivElement>(null);
	const { scrollYProgress } = useScroll({ target: ref as React.RefObject<HTMLElement>, offset: ['start end', 'end end'] });
	const opacity = useTransform(scrollYProgress, [0, 0.2], [0, 1]);
	const y = useTransform(scrollYProgress, [0, 0.2], [20, 0]);

	return (
		<motion.div
			ref={ref}
			style={{ opacity, y }}
		>
			<span className={`${colorClass} glitchRainbow whitespace-pre-line leading-none`}>
				{text}
			</span>
		</motion.div>
	);
};

export default SelfCustodySection;

"use client";
import { useRef } from 'react';
import { useScroll } from 'framer-motion';
import GlowingTextScene from './GlowingTextScene';
import styles from './GlowingText.module.css';
import ScrollSpace from './ScrollSpace';
import { motion } from 'framer-motion';
import HeroModel from '../hero-section/HeroModel';
const GlowingTextSection = () => {
	const sectionRef = useRef<HTMLDivElement>(null);

	// スクロール位置の検出
	const { scrollYProgress } = useScroll({
		target: sectionRef,
		offset: ["start end", "end start"]
	});

	return (
		<section ref={sectionRef} className={styles.section}>
			<motion.div
				className="absolute top-10 left-1/2 transform -translate-x-1/2 text-neonGreen text-center"
				initial={{ opacity: 0, y: -10 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ delay: 0.5, duration: 0.8, repeat: Infinity, repeatType: "reverse" }}
			>
				<div className="text-xl mb-2">↓</div>
				<div className="text-sm font-mono">SCROLL DOWN</div>
			</motion.div>
			<div className="space-y-6">
				<div className="relative w-full max-w-md h-[400px] md:h-[500px]">
					<GlowingTextScene scrollProgress={scrollYProgress} />
					<p className="text-center md:text-left text-white">
						ただのプロテインではない。それは、ぺぺが紡ぐ「勇気」と「ユーモア」の物語。
					</p>
				</div>
			</div>
			<div className="flex justify-center">
				<HeroModel scale={1.2} />
			</div>
		</section>
	);
};

export default GlowingTextSection;
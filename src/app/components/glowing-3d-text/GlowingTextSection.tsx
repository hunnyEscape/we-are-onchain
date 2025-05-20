"use client";
import { useRef } from 'react';
import { useScroll } from 'framer-motion';
import GlowingTextScene from './GlowingTextScene';
import styles from './GlowingText.module.css';
import ScrollSpace from '../hero-section/ScrollSpace';
const GlowingTextSection = () => {
	const sectionRef = useRef<HTMLDivElement>(null);

	// スクロール位置の検出
	const { scrollYProgress } = useScroll({
		target: sectionRef,
		offset: ["start end", "end start"]
	});

	return (
		<section ref={sectionRef} className={styles.section}>
			<div className={styles.canvasContainer}>
				<GlowingTextScene scrollProgress={scrollYProgress} />
			</div>
			<ScrollSpace/>
		</section>
	);
};

export default GlowingTextSection;
// src/app/components/hero-section/HeroTitle.tsx
import React from 'react';
import GlitchText from '../../ui/GlitchText';
import styles from './HeroSection.module.css';
interface HeroTitleProps {
	style?: React.CSSProperties;
}

export const HeroTitle: React.FC<HeroTitleProps> = ({ style }) => {
	return (
		<div className={styles.titleContainer} style={style}>
			{/* メインタイトル */}
			<div className={styles.titleGroup}>
				<GlitchText
					text="NO BANKS"
					className="text-6xl md:text-7xl lg:text-9xl"
					color="text-neonOrange"
					glitchIntensity="high"
					isMainTitle={true}
				/>
				<GlitchText
					text="PEER-TO-PEER"
					className="text-6xl md:text-7xl lg:text-9xl"
					color="text-neonGreen"
					glitchIntensity="medium"
					isMainTitle={true}
				/>
				<GlitchText
					text="JUST PROTEIN"
					className="text-6xl md:text-7xl lg:text-9xl"
					color="text-white"
					glitchIntensity="high"
					isMainTitle={true}
				/>
			</div>
			<p className="mt-6 text-sm md:text-lg text-white">
				Only non-custodial wallets accepted.<br />
				Built for the chain. Priced for the degens.
			</p>
		</div>
	);
};

export default HeroTitle;
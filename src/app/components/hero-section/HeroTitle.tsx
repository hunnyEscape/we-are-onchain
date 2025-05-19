// src/app/components/hero-section/HeroTitle.tsx
import React from 'react';
import GlitchText from '../ui/GlitchText';
import CyberBox from '../ui/CyberBox';
import styles from './HeroSection.module.css';
import ProteinStory from './ProteinStory';
interface HeroTitleProps {
	style?: React.CSSProperties;
}

export const HeroTitle: React.FC<HeroTitleProps> = ({ style }) => {
	return (
		<div className={styles.titleContainer} style={style}>
			{/* メインタイトル */}
			<div className={styles.titleGroup}>
				<GlitchText
					text="PAY"
					className="text-7xl sm:text-8xl lg:text-9xl"
					color="text-neonOrange"
					glitchIntensity="high"
					isMainTitle={true}
				/>
				<GlitchText
					text="PUMP"
					className="text-7xl sm:text-8xl lg:text-9xl"
					color="text-neonGreen"
					glitchIntensity="medium"
					isMainTitle={true}
				/>
				<GlitchText
					text="LIVE"
					className="text-7xl sm:text-8xl lg:text-9xl"
					color="text-white"
					glitchIntensity="high"
					isMainTitle={true}
				/>
			</div>

			{/* サブタイトル */}
			<CyberBox className="inline-block mt-8 px-8 py-3">
				<div className="overflow-hidden">
					<div className="whitespace-nowrap overflow-hidden border-r-4 border-neonGreen">
						<span className="text-3xl sm:text-4xl text-white mr-2">WeAre</span>
						<span className="text-3xl sm:text-4xl text-neonGreen">on-chain</span>
					</div>
				</div>
			</CyberBox>
		</div>
	);
};

export default HeroTitle;
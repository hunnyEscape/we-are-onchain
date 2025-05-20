// src/app/components/hero-section/HeroModel.tsx
import React from 'react';
import ProteinModel from '../3d/ProteinModel';

interface HeroModelProps {
	style?: React.CSSProperties;
	scale?: number;
}

export const HeroModel: React.FC<HeroModelProps> = ({
	style,
	scale = 1.2
}) => {
	return (
		<div
			className="w-[300px] h-[400px] md:w-[400px] md:h-[500px] lg:w-[500px] lg:h-[600px] pointer-events-auto"
			style={style}
		>
			<ProteinModel
				autoRotate={true}
				mouseControl={true}
				scale={scale}
			/>
		</div>
	);
};

export default HeroModel;
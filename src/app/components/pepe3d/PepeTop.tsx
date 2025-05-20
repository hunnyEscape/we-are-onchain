// src/app/page.tsx
import React from 'react';
import PepeModel3D from './PepeModel3D';
import ScrollMessage from './ScrollMessage';
const PepeTop: React.FC = () => {
	return (
		<div className="relative h-[700vh]">
			<div className="sticky top-0 h-screen w-full overflow-hidden">
				<PepeModel3D />
				<div
					className="absolute inset-0 z-10 pointer-events-none"
					style={{
						background: `radial-gradient(
								ellipse 100% 50% at center,
								rgba(0, 0, 0, 0.2) 10%,
								rgba(0, 0, 0, 0.6) 60%,
								rgba(0, 0, 0, 0.9) 80%,
								rgba(0, 0, 0, 1) 100%
							)`,
					}}
				/>
			</div>
			<ScrollMessage/>
		</div>
	);
};

export default PepeTop;

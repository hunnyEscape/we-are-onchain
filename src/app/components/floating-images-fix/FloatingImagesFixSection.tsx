// src/app/components/floating-images-fix/FloatingImagesFixSection.tsx

'use client';

import React from 'react';
import FloatingImagesFixCanvas from './FloatingImagesFixCanvas';

const FloatingImagesFixSection: React.FC = () => {
	return (
		<section className="w-screen h-[300vh] relative overflow-hidden bg-black">
			<div className="w-screen h-full sticky top-0 left-0 pointer-events-none z-10">
				<FloatingImagesFixCanvas />
			</div>
		</section>
	);
};

export default FloatingImagesFixSection;

// src/app/components/floating-images-fix/FloatingImagesFixSection.tsx

'use client';

import React from 'react';
import FloatingImagesFixCanvas from './FloatingImagesFixCanvas';
import CyberScrollMessages from './cyber-scroll-messages';

// コンポーネント定義
const FloatingImagesFixSection: React.FC = () => {
	return (<>
		<div className='w-full relative h-[150vh] bg-black' />
		<section
			className="w-screen h-[800vh] relative overflow-hidden bg-black floating-images-fix-section"
			id="floating-images-fix-section"
		>
			<div className="w-screen h-full sticky top-0 left-0 pointer-events-none z-10">
				<div className="absolute top-0 left-0 w-full h-[100vh] z-20
						bg-gradient-to-b from-black via-black/40 to-black/0
						pointer-events-none"
				/>
				<div
					className="absolute inset-0 z-10 block sm:hidden bg-center bg-cover"
					style={{
						backgroundImage: `url(${process.env.NEXT_PUBLIC_CLOUDFRONT_URL}/pepe/garally_small2.webp)`
					}}
				/>

				<FloatingImagesFixCanvas />

				<CyberScrollMessages />
				<div className="absolute bottom-0 left-0 w-full h-[100vh] z-20
						bg-gradient-to-b from-black/0 via-black/40 to-black
						pointer-events-none"
				/>
			</div>
		</section>
		<div className='w-full relative h-[150vh] bg-black' />
	</>);
};

// 明示的にdefaultエクスポート
export default FloatingImagesFixSection;
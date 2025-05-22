'use client';
import Sphere from './Sphere';
import MessageOverlay from './MessageOverlay';
import { useMediaQuery } from 'react-responsive'; // 推奨：メディアクエリのためのフック

const SphereTop: React.FC = () => {
	const isMobile = useMediaQuery({ maxWidth: 767 }); // Tailwindのmdブレイクポイントに合わせる

	const backgroundImage = {
		desktop: `${process.env.NEXT_PUBLIC_CLOUDFRONT_URL}/pepe/cyberpunk-cityscape.webp`,
		mobile: `${process.env.NEXT_PUBLIC_CLOUDFRONT_URL}/pepe/cyberpunk-cityscape-mobile.webp`
	};

	return (
		<div className="w-full relative h-[300vh] md:h-[500vh]">
			{/* グラデーションオーバーレイ */}
			<div
				className="absolute inset-0 z-10 pointer-events-none"
				style={{
					background: `linear-gradient(to bottom,
            rgba(0,0,0,1) 0%,
            rgba(0,0,0,0.85) 10%,
            rgba(0,0,0,0.0) 30%,
            rgba(0,0,0,0.0) 70%,
            rgba(0,0,0,0.85) 90%,
            rgba(0,0,0,1) 100%)`,
				}}
			/>

			{/* 背景スフィア */}
			<div className="sticky top-0 h-screen w-full overflow-hidden">
				<Sphere
					enableControls={false}
					rotationSpeed={0.3}
					backgroundImage={isMobile ? backgroundImage.mobile : backgroundImage.desktop}
					useDefaultEnvironment={false}
					isMobile={isMobile}
				/>
			</div>

			{/* テキスト・UIオーバーレイ */}
			<div className="sticky top-0 h-screen w-full pointer-events-none">
				<MessageOverlay />
			</div>
		</div>
	);
};

export default SphereTop;
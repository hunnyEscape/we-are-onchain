'use client';
import Sphere from './Sphere';
import MessageOverlay from './MessageOverlay';

const SphereTop: React.FC = () => {
	const backgroundImage = {
		desktop: `${process.env.NEXT_PUBLIC_CLOUDFRONT_URL}/pepe/cyberpunk-cityscape.webp`,
		mobile: `${process.env.NEXT_PUBLIC_CLOUDFRONT_URL}/pepe/cyberpunk-cityscape-mobile.webp`
	};

	return (
		<div className="w-full relative h-[500vh]">
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
					backgroundImage={backgroundImage.desktop}
					useDefaultEnvironment={false}
					className="hidden md:block" // Desktop version
				/>
				<Sphere
					enableControls={false}
					rotationSpeed={0.3}
					backgroundImage={backgroundImage.mobile}
					useDefaultEnvironment={false}
					className="block md:hidden" // Mobile version
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
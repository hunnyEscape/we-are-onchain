// src/app/page.tsx
import HeroSection from './components/hero-section/HeroSection';
import Sphere from './components/sphere/Sphere';
import MessageOverlay from './components/sphere/MessageOverlay';

export default function Home() {
	return (
		<main className="relative">
			{/* 1. ヒーローセクション */}
			<HeroSection />
			<div className="relative h-[500vh]">
				<div className="sticky top-0 h-screen w-full overflow-hidden">
					<Sphere
						enableControls={false}
						rotationSpeed={0.3}
						backgroundImage={`${process.env.NEXT_PUBLIC_CLOUDFRONT_URL}/cyberpunk-cityscape.webp`}
						useDefaultEnvironment={false}
					/>
				</div>
				<div className="sticky top-0 h-screen w-full pointer-events-none">
					<MessageOverlay />
				</div>
			</div>
		</main>
	);
}

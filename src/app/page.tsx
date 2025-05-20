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
				<div
					className="absolute inset-0 z-10 pointer-events-none"
					style={{
						background: `linear-gradient(to bottom,
									rgba(0,0,0,1) 0%,
									rgba(0,0,0,0.8) 10%,
									rgba(0,0,0,0) 30%,
									rgba(0,0,0,0) 90%,
									rgba(0,0,0,0.9) 95%,
									rgba(0,0,0,1) 100%)`,
					}}
				/>

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

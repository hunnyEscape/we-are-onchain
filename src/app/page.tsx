// src/app/page.tsx
import HeroSection from './components/hero-section/HeroSection';
import ModelDebug from './components/debug/ModelDebug';
import PepeModel from './components/3d/PepeModel';
import PepeModelImproved from './components/3d/PepeModelImproved';
import PepeModel3D from './components/pepe3d/PepeModel3D';
export default function Home() {
	return (
		<main className="min-h-screen">
			<HeroSection />
			<div className="h-[100vh] w-full border border-green-500 rounded-lg overflow-hidden bg-gradient-to-b from-gray-900 to-black">
				<PepeModel3D enableControls={true} rotationSpeed={0.5} backgroundImage={`${process.env.NEXT_PUBLIC_CLOUDFRONT_URL}/cyberpunk-cityscape.webp`} useDefaultEnvironment={false}/>
			</div>
		</main>
	);
}
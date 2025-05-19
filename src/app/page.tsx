// src/app/page.tsx
import HeroSection from './components/hero-section/HeroSection';
import ModelDebug from './components/debug/ModelDebug';
import PepeModel from './components/3d/PepeModel';
import PepeModelImproved from './components/3d/PepeModelImproved';
export default function Home() {
	return (
		<main className="min-h-screen">
			<HeroSection />
			<div className="h-[500px] w-full border border-green-500 rounded-lg overflow-hidden">
				<PepeModel scale={1.5} />
			</div>
			<div className="h-[600px] w-full border border-green-500 rounded-lg overflow-hidden">
				<PepeModelImproved />
			</div>
		</main>
	);
}
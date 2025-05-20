// src/app/page.tsx
import HeroSection from './components/hero-section/HeroSection';
import SphereTop from './components/sphere/SphereTop';

export default function Home() {
	return (
		<main className="relative">
			<HeroSection/>
			<SphereTop/>
		</main>
	);
}

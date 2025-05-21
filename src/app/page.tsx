import HeroSection from './components/hero-section/HeroSection';
import SphereTop from './components/sphere/SphereTop';
import PepeTop from './components/pepe3d/PepeTop';
import GlowingTextSection from './components/glowing-3d-text/GlowingTextSection';
import PulsatingComponent from './components/layout/PulsatingComponent';
import FloatingImagesFixSection from './components/floating-images-fix/FloatingImagesFixSection';
export default function Home() {
	return (
		<main className="relative">
			<HeroSection />
			<GlowingTextSection />
			<PulsatingComponent />
			<PepeTop />
			<FloatingImagesFixSection />
			<SphereTop />
		</main>
	);
}

import HeroSection from './components/hero-section/HeroSection';
import SphereTop from './components/sphere/SphereTop';
import PepeTop from './components/pepe3d/PepeTop';
import GlowingTextSection from './components/glowing-3d-text/GlowingTextSection';
import PulsatingComponent from './components/layout/PulsatingComponent';
import FloatingImagesFixSection from './components/floating-images-fix/FloatingImagesFixSection';
import Header from './components/ui/Header';
import Footer from './components/ui/Footer';
import CyberInterface from './components/layout/CyberInterface';
import PepePush from './components/pepePush/PepePush';
import LayeredGallerySection from './components/layered-gallery/LayeredGallerySection'
export default function Home() {
	return (
		<main className="relative flex flex-col items-center w-full">

			<LayeredGallerySection />
			<HeroSection />

		</main>
	);
}

/*
			<Header />
			<HeroSection />
			<CyberInterface />
			<GlowingTextSection />
			<PulsatingComponent />
			<PepeTop />
			<SphereTop />
			<PepePush />
			<Footer />

*/
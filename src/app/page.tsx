import HeroSection from './components/hero-section/HeroSection';
import SphereTop from './components/sphere/SphereTop';
import PepeTop from './components/pepe3d/PepeTop';
import GlowingTextSection from './components/glowing-3d-text/GlowingTextSection';
import PulsatingComponent from './components/layout/PulsatingComponent';
import FloatingImagesFixSection from './components/floating-images-fix/FloatingImagesFixSection';
import Header from './components/ui/Header';
import Footer from './components/ui/Footer';
export default function Home() {
	return (
		<main className="relative">
			<Header/>
			<HeroSection/>
			<GlowingTextSection/>
			<PulsatingComponent/>
			<PepeTop/>
			<FloatingImagesFixSection/>
			<SphereTop/>
			<div className='relative h-[100vh] bg-black z-20'/>
			<Footer/>
		</main>
	);
}

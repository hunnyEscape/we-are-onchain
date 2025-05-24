import HeroSection from './components/home/hero-section/HeroSection';
import GlowingTextSection from './components/home/glowing-3d-text/GlowingTextSection';
import Header from './components/home/ui/Header';
import Footer from './components/home/ui/Footer';
import CyberInterface from './components/home/layout/CyberInterface';
import PepePush from './components/home/pepePush/PepePush';
export default function Home() {
	return (
		<main className="relative flex flex-col items-center w-full">
			<Header/>
			<CyberInterface />
			<HeroSection />
			<GlowingTextSection />
			<PepePush />
			<Footer />
		</main>
	);
}
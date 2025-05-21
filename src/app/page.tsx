import HeroSection from './components/hero-section/HeroSection';
import SphereTop from './components/sphere/SphereTop';
import PepeTop from './components/pepe3d/PepeTop';
import GlowingTextSection from './components/glowing-3d-text/GlowingTextSection';
import PulsatingComponent from './components/layout/PulsatingComponent';
import FloatingImagesSection from './components/floating-images/FloatingImagesSection';
export default function Home() {
	return (
		<main className="relative">
			<HeroSection/>
			<GlowingTextSection /> 
			<PulsatingComponent/>
			<PepeTop/>
			<SphereTop/>
			<FloatingImagesSection />
			<div
				className="h-screen w-full bg-cover bg-center"
				style={{
					backgroundImage: `url('${process.env.NEXT_PUBLIC_CLOUDFRONT_URL}/pepe-cyberpunk.webp')`,
				}}
			/>
		</main>
	);
}//<FloatingImagesSection />

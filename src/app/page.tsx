import HeroSection from './components/hero-section/HeroSection';
import SphereTop from './components/sphere/SphereTop';
import PepeTop from './components/pepe3d/PepeTop';

export default function Home() {
	return (
		<main className="relative">
			<HeroSection />
			<PepeTop />
			<SphereTop />
			<div
				className="h-screen w-full bg-cover bg-center"
				style={{
					backgroundImage: `url('${process.env.NEXT_PUBLIC_CLOUDFRONT_URL}/pepe-cyberpunk.webp')`,
				}}
			/>
		</main>
	);
}

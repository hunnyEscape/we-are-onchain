// src/app/page.tsx
import HeroSection from './components/hero-section/HeroSection';
import ModelDebug from './components/debug/ModelDebug';
import PepeModel from './components/3d/PepeModel';
import PepeModelImproved from './components/3d/PepeModelImproved';
import PepeModel3D from './components/pepe3d/PepeModel3D';
import DigitalBackground from './components/digitalBackground/DigitalBackground';
export default function Home() {
	return (
		<main className="min-h-screen">
			<HeroSection />
			<div className="h-[100vh] w-full border border-green-500 rounded-lg overflow-hidden bg-gradient-to-b from-gray-900 to-black">
				<PepeModel3D enableControls={true} rotationSpeed={0.5} backgroundImage={`${process.env.NEXT_PUBLIC_CLOUDFRONT_URL}/cyberpunk-cityscape.webp`} useDefaultEnvironment={false} />
			</div>
			<DigitalBackground
				environmentTexture={`${process.env.NEXT_PUBLIC_CLOUDFRONT_URL}/cyberpunk-cityscape.webp`}
				showProgress={true}
				progressColor="#00ff9f"
				enableControls={false}
				className="custom-class"
				customStoryData={[
					{
						id: 1,
						title: "セルフカストディアンの戦士たちへ",
						content: "真の勇者にしか手に入らない、オンチェーンの秘薬。暗号空間を駆け抜け、鍵は「自らの手」にのみ宿る。",
						triggerPoint: 10
					},
					{
						id: 2,
						title: "ONLY FOR SELF-CUSTODY CHAMPIONS",
						content: "真の戦士たちへ贈る究極の力。あなたの魂は準備ができているか？セルフカストディアンの道を歩む者だけが手にする栄光。",
						triggerPoint: 50
					}
				]}
			/>
		</main>
	);
}
// src/app/profile/layout.tsx
'use client';

import Header from '../components/ui/Header';
import Footer from '../components/ui/Footer';
import GridPattern from '../components/common/GridPattern';

interface ProfileLayoutProps {
	children: React.ReactNode;
}

export default function ProfileLayout({ children }: ProfileLayoutProps) {
	return (
		<div className="min-h-screen bg-black text-white relative">
			{/* Header */}
			<Header />

			{/* Background Effects */}
			<div className="fixed inset-0 z-0">
				<div className="absolute inset-0 bg-gradient-to-b from-black via-dark-100 to-black opacity-80" />
				<GridPattern
					size={40}
					opacity={0.02}
					color="rgba(0, 255, 127, 0.05)"
				/>
			</div>

			{/* Main Content */}
			<main className="relative z-10 pt-16 min-h-[calc(100vh-4rem)]">
				{children}
			</main>

			{/* Footer */}
			<Footer />
		</div>
	);
}
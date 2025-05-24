// src/app/dashboard/layout.tsx
'use client';

import Header from '../components/home/ui/Header';
import Footer from '../components/home/ui/Footer';
import GridPattern from '../components/common/GridPattern';
import { DashboardProvider } from './context/DashboardContext';

interface DashboardLayoutProps {
	children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
	return (
		<DashboardProvider>
			<div className="min-h-screen bg-black text-white relative">
				{/* Header */}
				<Header />

				{/* Background Effects - 軽微なグリッドのみ */}
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
					<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
						{children}
					</div>
				</main>

				{/* Footer */}
				<Footer />
			</div>
		</DashboardProvider>
	);
}
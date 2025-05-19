'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

const Navbar = () => {
	const [isScrolled, setIsScrolled] = useState(false);
	const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

	// スクロール検知
	useEffect(() => {
		const handleScroll = () => {
			setIsScrolled(window.scrollY > 10);
		};

		window.addEventListener('scroll', handleScroll);
		return () => window.removeEventListener('scroll', handleScroll);
	}, []);

	return (
		<nav
			className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${isScrolled ? 'bg-black/80 backdrop-blur-md py-3' : 'bg-transparent py-5'
				}`}
		>
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="flex items-center justify-between h-16">
					{/* ロゴ */}
					<div className="flex-shrink-0">
						<Link href="/" className="text-neon-green font-heading text-2xl">
							WE ARE ON-CHAIN
						</Link>
					</div>

					{/* デスクトップメニュー */}
					<div className="hidden md:block">
						<div className="ml-10 flex items-center space-x-8">
							<Link
								href="#product"
								className="text-white hover:text-neon-green transition-colors"
							>
								PRODUCT
							</Link>
							<Link
								href="#how-it-works"
								className="text-white hover:text-neon-green transition-colors"
							>
								HOW IT WORKS
							</Link>
							<Link
								href="#order-scan"
								className="text-white hover:text-neon-green transition-colors"
							>
								ORDER SCAN
							</Link>
							<a href="#" className="btn-cyber">
								BUY NOW
							</a>
						</div>
					</div>

					{/* モバイルメニューボタン */}
					<div className="md:hidden">
						<button
							type="button"
							className="text-gray-400 hover:text-white focus:outline-none"
							aria-controls="mobile-menu"
							aria-expanded="false"
							onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
						>
							<span className="sr-only">Open main menu</span>
							{isMobileMenuOpen ? (
								<svg
									className="h-6 w-6"
									xmlns="http://www.w3.org/2000/svg"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
									aria-hidden="true"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M6 18L18 6M6 6l12 12"
									/>
								</svg>
							) : (
								<svg
									className="h-6 w-6"
									xmlns="http://www.w3.org/2000/svg"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
									aria-hidden="true"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M4 6h16M4 12h16M4 18h16"
									/>
								</svg>
							)}
						</button>
					</div>
				</div>
			</div>

			{/* モバイルメニュー */}
			<div
				className={`md:hidden transition-all duration-300 ease-in-out ${isMobileMenuOpen ? 'max-h-64 opacity-100' : 'max-h-0 opacity-0 overflow-hidden'
					}`}
				id="mobile-menu"
			>
				<div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-black/90 backdrop-blur-md">
					<Link
						href="#product"
						className="text-white hover:text-neon-green block px-3 py-2"
						onClick={() => setIsMobileMenuOpen(false)}
					>
						PRODUCT
					</Link>
					<Link
						href="#how-it-works"
						className="text-white hover:text-neon-green block px-3 py-2"
						onClick={() => setIsMobileMenuOpen(false)}
					>
						HOW IT WORKS
					</Link>
					<Link
						href="#order-scan"
						className="text-white hover:text-neon-green block px-3 py-2"
						onClick={() => setIsMobileMenuOpen(false)}
					>
						ORDER SCAN
					</Link>

					href="#"
					className="btn-cyber block mx-3 my-4 text-center"
					onClick={() => setIsMobileMenuOpen(false)}
          >
					BUY NOW
				</a>
			</div>
		</div>
    </nav >
  );
};

export default Navbar;
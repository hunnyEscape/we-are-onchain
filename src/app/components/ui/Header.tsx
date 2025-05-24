'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { AuthModal } from '../auth/AuthModal';

const Header = () => {
	const [isVisible, setIsVisible] = useState(true);
	const [lastScrollY, setLastScrollY] = useState(0);
	const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
	const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

	const { user, logout, loading } = useAuth();

	useEffect(() => {
		// カスタムイベントリスナーを追加してプロフィールページからログインモーダルを開く
		const handleOpenAuthModal = () => {
			setIsAuthModalOpen(true);
		};

		window.addEventListener('openAuthModal', handleOpenAuthModal);

		const handleScroll = () => {
			const currentScrollY = window.scrollY;

			if (currentScrollY < lastScrollY || currentScrollY < 100) {
				setIsVisible(true);
			} else if (currentScrollY > lastScrollY && currentScrollY > 100) {
				setIsVisible(false);
			}

			setLastScrollY(currentScrollY);
		};

		window.addEventListener('scroll', handleScroll, { passive: true });

		return () => {
			window.removeEventListener('scroll', handleScroll);
			window.removeEventListener('openAuthModal', handleOpenAuthModal);
		};
	}, [lastScrollY]);

	const handleLogout = async () => {
		try {
			await logout();
			setIsMobileMenuOpen(false);
		} catch (error) {
			console.error('ログアウトエラー:', error);
		}
	};

	const handleLoginClick = () => {
		setIsAuthModalOpen(true);
		setIsMobileMenuOpen(false);
	};

	const navLinks = [
		{ href: '/dashboard', label: 'Shop', isHome: true },
		{ href: '/dashboard', label: 'How to Buy' },
		{ href: '/dashboard', label: 'White Paper' },
	];

	return (
		<>
			<header
				className={`fixed top-0 left-0 right-0 z-50 transition-transform duration-300 ease-out ${isVisible ? 'translate-y-0' : '-translate-y-full'
					}`}
			>
				{/* Background with blur effect */}
				<div className="absolute inset-0 bg-black/90 backdrop-blur-md border-b border-dark-300"></div>

				{/* Scanline effect */}
				<div className="absolute inset-0 overflow-hidden pointer-events-none">
					<div className="absolute w-full h-px bg-gradient-to-r from-transparent via-neonGreen to-transparent animate-scanline opacity-30"></div>
				</div>

				<nav className="relative px-4 sm:px-6 lg:px-8">
					<div className="flex items-center justify-between h-16 max-w-7xl mx-auto">
						{/* Logo/Brand */}
						<Link href="/" className="flex items-center space-x-2 group">
							<div className="relative">
								<div className="w-8 h-8 bg-gradient-to-br from-neonGreen to-neonOrange rounded-sm animate-pulse-fast"></div>
								<div className="absolute inset-0 w-8 h-8 bg-gradient-to-br from-neonGreen to-neonOrange rounded-sm blur-sm opacity-50"></div>
							</div>
							<span className="text-xl font-heading font-bold text-white group-hover:text-neonGreen transition-colors duration-200 md:animate-glitch-slow">
								We are on-chain
							</span>
						</Link>

						{/* Desktop Navigation */}
						<div className="hidden md:flex items-center space-x-8">
							{navLinks.map((link, index) => (
								<Link
									key={link.href}
									href={link.href}
									className={`relative px-4 py-2 text-sm font-medium transition-all duration-200 group ${link.isHome
											? 'text-neonGreen'
											: 'text-gray-300 hover:text-white'
										}`}
									style={{ animationDelay: `${index * 100}ms` }}
								>
									<span className="relative z-10">{link.label}</span>

									{/* Hover effect */}
									<div className="absolute inset-0 bg-gradient-to-r from-neonGreen/20 to-neonOrange/20 rounded-sm transform scale-0 group-hover:scale-100 transition-transform duration-200"></div>

									{/* Border animation */}
									<div className="absolute bottom-0 left-0 w-0 h-px bg-gradient-to-r from-neonGreen to-neonOrange group-hover:w-full transition-all duration-300"></div>

									{/* Glitch effect for active link */}
									{link.isHome && (
										<div className="absolute inset-0 bg-neonGreen/10 rounded-sm animate-glitch opacity-30"></div>
									)}
								</Link>
							))}

							{/* Authentication Section */}
							{loading ? (
								<div className="px-6 py-2">
									<div className="w-6 h-6 border-2 border-neonGreen border-t-transparent rounded-full animate-spin"></div>
								</div>
							) : user ? (
								<div className="flex items-center space-x-4">
									{/* User Info */}
									<div className="hidden lg:flex flex-col text-right">
										<span className="text-xs text-gray-400">Welcome back</span>
										<span className="text-sm text-white font-medium truncate max-w-32">
											{user.displayName || user.email?.split('@')[0]}
										</span>
									</div>

									{/* User Avatar */}
									<div className="relative">
										<div className="w-8 h-8 bg-gradient-to-br from-neonGreen to-neonOrange rounded-full flex items-center justify-center">
											<span className="text-black font-bold text-sm">
												{(user.displayName || user.email || 'U')[0].toUpperCase()}
											</span>
										</div>
										<div className="absolute inset-0 w-8 h-8 bg-gradient-to-br from-neonGreen to-neonOrange rounded-full blur-sm opacity-50"></div>
									</div>

									{/* Logout Button */}
									<button
										onClick={handleLogout}
										className="relative px-4 py-2 bg-red-600/80 hover:bg-red-600 text-white text-sm font-medium rounded-sm transition-all duration-200 hover:shadow-lg hover:shadow-red-500/25 group"
									>
										<span className="relative z-10">Logout</span>
										<div className="absolute inset-0 bg-red-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-200 origin-left rounded-sm"></div>
									</button>
								</div>
							) : (
								<button
									onClick={handleLoginClick}
									className="relative px-6 py-2 bg-gradient-to-r from-neonGreen to-neonOrange text-black font-semibold rounded-sm overflow-hidden group transition-all duration-200 hover:shadow-lg hover:shadow-neonGreen/25"
								>
									<span className="relative z-10 text-sm">Login</span>
									<div className="absolute inset-0 bg-gradient-to-r from-neonOrange to-neonGreen transform scale-x-0 group-hover:scale-x-100 transition-transform duration-200 origin-left"></div>
									<div className="absolute inset-0 animate-pulse bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
								</button>
							)}
						</div>

						{/* Mobile menu button */}
						<button
							onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
							className="md:hidden relative w-10 h-10 flex flex-col items-center justify-center space-y-1 group"
							aria-label="Toggle mobile menu"
						>
							<span className={`w-6 h-0.5 bg-white transition-all duration-200 ${isMobileMenuOpen ? 'rotate-45 translate-y-1.5' : ''}`}></span>
							<span className={`w-6 h-0.5 bg-white transition-all duration-200 ${isMobileMenuOpen ? 'opacity-0' : ''}`}></span>
							<span className={`w-6 h-0.5 bg-white transition-all duration-200 ${isMobileMenuOpen ? '-rotate-45 -translate-y-1.5' : ''}`}></span>
						</button>
					</div>

					{/* Mobile Menu */}
					<div className={`md:hidden transition-all duration-300 ease-out overflow-hidden ${isMobileMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
						}`}>
						<div className="px-4 py-4 space-y-3 border-t border-dark-300 bg-black/50">
							{navLinks.map((link, index) => (
								<Link
									key={link.href}
									href={link.href}
									className={`block px-4 py-3 text-base font-medium transition-all duration-200 rounded-sm ${link.isHome
											? 'text-neonGreen bg-neonGreen/10 border border-neonGreen/20'
											: 'text-gray-300 hover:text-white hover:bg-dark-200'
										}`}
									onClick={() => setIsMobileMenuOpen(false)}
									style={{ animationDelay: `${index * 50}ms` }}
								>
									{link.label}
								</Link>
							))}

							{/* Mobile Authentication Section */}
							{loading ? (
								<div className="flex justify-center py-4">
									<div className="w-6 h-6 border-2 border-neonGreen border-t-transparent rounded-full animate-spin"></div>
								</div>
							) : user ? (
								<div className="space-y-3 pt-4 border-t border-dark-300">
									{/* User Info */}
									<div className="px-4 py-2 bg-neonGreen/5 rounded-sm border border-neonGreen/20">
										<div className="text-xs text-gray-400">Logged in as</div>
										<div className="text-sm text-white font-medium">
											{user.displayName || user.email}
										</div>
									</div>

									{/* Logout Button */}
									<button
										onClick={handleLogout}
										className="w-full px-6 py-3 bg-red-600/80 hover:bg-red-600 text-white font-semibold rounded-sm transition-all duration-200 hover:shadow-lg hover:shadow-red-500/25"
									>
										Logout
									</button>
								</div>
							) : (
								<button
									onClick={handleLoginClick}
									className="w-full mt-4 px-6 py-3 bg-gradient-to-r from-neonGreen to-neonOrange text-black font-semibold rounded-sm transition-all duration-200 hover:shadow-lg hover:shadow-neonGreen/25"
								>
									Login
								</button>
							)}
						</div>
					</div>
				</nav>
			</header>

			{/* Auth Modal */}
			<AuthModal
				isOpen={isAuthModalOpen}
				onClose={() => setIsAuthModalOpen(false)}
			/>
		</>
	);
};

export default Header;
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShoppingCart } from 'lucide-react';
import WalletConnectButton from '../common/WalletConnectButton';
import { useAuthModal } from '@/contexts/AuthModalContext';

// ダッシュボードページでのみカート機能を使用するためのhook
const useCartInDashboard = () => {
	const [cartItemCount, setCartItemCount] = useState(0);
	const [onCartClick, setOnCartClick] = useState<(() => void) | null>(null);
	const [isHydrated, setIsHydrated] = useState(false);

	useEffect(() => {
		// ハイドレーション完了を待つ
		setIsHydrated(true);

		// カスタムイベントリスナーを追加してダッシュボードからカート情報を受信
		const handleCartUpdate = (event: CustomEvent) => {
			console.log('📨 Header received cart update:', event.detail.itemCount);
			setCartItemCount(event.detail.itemCount);
		};

		const handleCartClickHandler = (event: CustomEvent) => {
			setOnCartClick(() => event.detail.clickHandler);
		};

		window.addEventListener('cartUpdated', handleCartUpdate as EventListener);
		window.addEventListener('cartClickHandlerSet', handleCartClickHandler as EventListener);

		return () => {
			window.removeEventListener('cartUpdated', handleCartUpdate as EventListener);
			window.removeEventListener('cartClickHandlerSet', handleCartClickHandler as EventListener);
		};
	}, []);

	return { cartItemCount: isHydrated ? cartItemCount : 0, onCartClick };
};

const Header = () => {
	const router = useRouter();
	const [isVisible, setIsVisible] = useState(true);
	const [lastScrollY, setLastScrollY] = useState(0);
	const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

	const { cartItemCount, onCartClick } = useCartInDashboard();

	// グローバル認証モーダル管理
	const { openAuthModal } = useAuthModal();

	useEffect(() => {
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
		};
	}, [lastScrollY]);

	const handleCartClick = () => {
		if (onCartClick) {
			onCartClick();
		}
		setIsMobileMenuOpen(false);
	};

	const handleProfileClick = () => {
		router.push('/profile');
		setIsMobileMenuOpen(false);
	};

	// グローバルモーダル経由での認証
	const handleAuthModalOpen = () => {
		openAuthModal({
			title: 'Connect Your Wallet',
			preferredChain: 'evm',
			onSuccess: (user) => {
				console.log('🎉 Header: User authenticated successfully:', user.walletAddress);
				// 必要に応じて追加の処理（例：リダイレクト）
			},
			onError: (error) => {
				console.error('❌ Header: Authentication failed:', error);
			},
			autoClose: true,
		});
		setIsMobileMenuOpen(false);
	};

	const navLinks = [
		{ href: '/dashboard', label: 'Shop', isHome: true },
		{ href: '/dashboard', label: 'How to Buy' },
		{ href: '/dashboard', label: 'White Paper' },
	];

	return (
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
						{/* Navigation Links */}
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

						{/* Cart Icon - Desktop */}
						<button
							onClick={handleCartClick}
							className="relative p-2 text-gray-300 hover:text-white transition-colors duration-200 hover:bg-dark-200/50 rounded-sm group"
							aria-label="Shopping cart"
						>
							<ShoppingCart className="w-6 h-6" />

							{/* Cart Badge */}
							{cartItemCount > 0 && (
								<div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-neonGreen to-neonOrange rounded-full flex items-center justify-center">
									<span className="text-xs font-bold text-black">
										{cartItemCount > 99 ? '99+' : cartItemCount}
									</span>
								</div>
							)}

							{/* Glow effect */}
							<div className="absolute inset-0 bg-gradient-to-r from-neonGreen/20 to-neonOrange/20 rounded-sm transform scale-0 group-hover:scale-100 transition-transform duration-200"></div>
						</button>


						<WalletConnectButton
							variant="desktop"
							showChainInfo={true}
							showDisconnectButton={true}
							showProfileLink={true}
							onProfileClick={handleProfileClick}
							onConnectClick={handleAuthModalOpen}
							size="md"
						/>
					</div>

					{/* Mobile menu button */}
					<button
						onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
						className="md:hidden relative w-10 h-10 flex flex-col items-center justify-center space-y-1 group"
						aria-label="Toggle mobile menu"
					>
						<span className={`w-6 h-0.5 bg-white transition-all duration-200 ${isMobileMenuOpen ? 'rotate-45 translate-y-1.5' : ''
							}`}></span>
						<span className={`w-6 h-0.5 bg-white transition-all duration-200 ${isMobileMenuOpen ? 'opacity-0' : ''
							}`}></span>
						<span className={`w-6 h-0.5 bg-white transition-all duration-200 ${isMobileMenuOpen ? '-rotate-45 -translate-y-1.5' : ''
							}`}></span>
					</button>
				</div>

				{/* Mobile Menu */}
				<div className={`md:hidden transition-all duration-300 ease-out overflow-hidden ${isMobileMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
					}`}>
					<div className="px-4 py-4 space-y-3 border-t border-dark-300 bg-black/50">
						{/* Navigation Links - Mobile */}
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

						{/* Cart Icon - Mobile */}
						<button
							onClick={handleCartClick}
							className="flex items-center justify-between w-full px-4 py-3 text-base font-medium text-gray-300 hover:text-white hover:bg-dark-200 transition-all duration-200 rounded-sm"
						>
							<div className="flex items-center space-x-3">
								<ShoppingCart className="w-5 h-5" />
								<span>Shopping Cart</span>
							</div>
							{cartItemCount > 0 && (
								<div className="w-6 h-6 bg-gradient-to-r from-neonGreen to-neonOrange rounded-full flex items-center justify-center">
									<span className="text-xs font-bold text-black">
										{cartItemCount > 99 ? '99+' : cartItemCount}
									</span>
								</div>
							)}
						</button>

						{/* Wallet Connect Button - Mobile */}
						<div className="pt-4 border-t border-dark-300">
							<WalletConnectButton
								variant="mobile"
								showChainInfo={true}
								showDisconnectButton={true}
								showProfileLink={true}
								onProfileClick={handleProfileClick}
								onConnectClick={handleAuthModalOpen}
								size="md"
								className="w-full"
							/>
						</div>
					</div>
				</div>
			</nav>
		</header>
	);
};

export default Header;
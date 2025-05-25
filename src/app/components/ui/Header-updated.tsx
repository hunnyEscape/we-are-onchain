// src/app/components/ui/Header-updated.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';
import { ExtendedAuthModal } from '../auth/ExtendedAuthModal';
import { ShoppingCart, Wallet, LogOut, User, Settings } from 'lucide-react';

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
	const [isVisible, setIsVisible] = useState(true);
	const [lastScrollY, setLastScrollY] = useState(0);
	const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
	const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
	const [authModalTab, setAuthModalTab] = useState<'email' | 'wallet'>('wallet');

	// 統合認証フック
	const {
		isAuthenticated,
		isLoading,
		authMethod,
		displayName,
		emailAddress,
		walletAddress,
		isFirebaseAuth,
		isWalletAuth,
		hasMultipleAuth,
		logout,
		error
	} = useUnifiedAuth();

	const { cartItemCount, onCartClick } = useCartInDashboard();

	useEffect(() => {
		// カスタムイベントリスナーを追加してプロフィールページからログインモーダルを開く
		const handleOpenAuthModal = (event?: CustomEvent) => {
			const preferredTab = event?.detail?.tab || 'wallet';
			setAuthModalTab(preferredTab);
			setIsAuthModalOpen(true);
		};

		window.addEventListener('openAuthModal', handleOpenAuthModal as EventListener);

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
			window.removeEventListener('openAuthModal', handleOpenAuthModal as EventListener);
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

	const handleLoginClick = (preferredTab: 'email' | 'wallet' = 'wallet') => {
		setAuthModalTab(preferredTab);
		setIsAuthModalOpen(true);
		setIsMobileMenuOpen(false);
	};

	const handleCartClick = () => {
		if (onCartClick) {
			onCartClick();
		}
		setIsMobileMenuOpen(false);
	};

	// 認証状態に応じた表示名を取得
	const getDisplayName = () => {
		if (displayName) return displayName;
		if (walletAddress) return `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`;
		if (emailAddress) return emailAddress.split('@')[0];
		return 'User';
	};

	// 認証方式のアイコンを取得
	const getAuthIcon = () => {
		if (hasMultipleAuth) return '🔗'; // ハイブリッド
		if (isWalletAuth) return '🦊'; // ウォレット
		if (isFirebaseAuth) return '📧'; // メール
		return '👤';
	};

	// 認証状態の説明文を取得
	const getAuthDescription = () => {
		if (hasMultipleAuth) return 'Email + Wallet';
		if (isWalletAuth) return 'Wallet Connected';
		if (isFirebaseAuth) return 'Email Account';
		return '';
	};

	const navLinks = [
		{ href: '/dashboard', label: 'Shop', isHome: true },
		{ href: '/dashboard', label: 'How to Buy' },
		{ href: '/dashboard', label: 'White Paper' },
	];

	return (
		<>
			<header
				className={`fixed top-0 left-0 right-0 z-50 transition-transform duration-300 ease-out ${
					isVisible ? 'translate-y-0' : '-translate-y-full'
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
									className={`relative px-4 py-2 text-sm font-medium transition-all duration-200 group ${
										link.isHome
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

							{/* Authentication Section */}
							{isLoading ? (
								<div className="px-6 py-2">
									<div className="w-6 h-6 border-2 border-neonGreen border-t-transparent rounded-full animate-spin"></div>
								</div>
							) : isAuthenticated ? (
								<div className="flex items-center space-x-4">
									{/* User Info - Enhanced with auth method */}
									<button
										onClick={() => window.location.href = '/profile'}
										className="hidden lg:flex flex-col text-right hover:bg-dark-200/50 px-3 py-2 rounded-sm transition-colors group"
									>
										<div className="flex items-center space-x-2">
											<span className="text-xs text-gray-400 group-hover:text-gray-300">
												{getAuthDescription()}
											</span>
											<span className="text-xs">{getAuthIcon()}</span>
										</div>
										<span className="text-sm text-white font-medium truncate max-w-32 group-hover:text-neonGreen">
											{getDisplayName()}
										</span>
										{error && (
											<span className="text-xs text-red-400">Connection Error</span>
										)}
									</button>

									{/* User Avatar - Enhanced */}
									<button
										onClick={() => window.location.href = '/profile'}
										className="relative group"
										title="View Profile"
									>
										<div className="w-10 h-10 bg-gradient-to-br from-neonGreen to-neonOrange rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-200 border-2 border-transparent group-hover:border-neonGreen/50">
											{hasMultipleAuth ? (
												<div className="flex items-center justify-center">
													<Wallet className="w-4 h-4 text-black" />
												</div>
											) : isWalletAuth ? (
												<Wallet className="w-5 h-5 text-black" />
											) : (
												<span className="text-black font-bold text-sm">
													{getDisplayName()[0].toUpperCase()}
												</span>
											)}
										</div>
										<div className="absolute inset-0 w-10 h-10 bg-gradient-to-br from-neonGreen to-neonOrange rounded-full blur-sm opacity-50 group-hover:opacity-75 transition-opacity duration-200"></div>
									</button>

									{/* Quick Actions Dropdown */}
									<div className="relative group">
										<button className="p-2 text-gray-300 hover:text-white transition-colors duration-200 hover:bg-dark-200/50 rounded-sm">
											<Settings className="w-5 h-5" />
										</button>
										
										{/* Dropdown Menu */}
										<div className="absolute right-0 top-full mt-2 w-48 bg-black/95 border border-neonGreen/30 rounded-sm shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
											<div className="p-2 space-y-1">
												<button
													onClick={() => window.location.href = '/profile'}
													className="w-full flex items-center px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-neonGreen/10 rounded-sm transition-colors"
												>
													<User className="w-4 h-4 mr-2" />
													Profile
												</button>
												
												{!hasMultipleAuth && (
													<>
														{isWalletAuth && (
															<button
																onClick={() => handleLoginClick('email')}
																className="w-full flex items-center px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-neonGreen/10 rounded-sm transition-colors"
															>
																📧 <span className="ml-2">Link Email</span>
															</button>
														)}
														
														{isFirebaseAuth && (
															<button
																onClick={() => handleLoginClick('wallet')}
																className="w-full flex items-center px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-neonGreen/10 rounded-sm transition-colors"
															>
																<Wallet className="w-4 h-4 mr-2" />
																Link Wallet
															</button>
														)}
													</>
												)}
												
												<hr className="border-dark-300 my-1" />
												
												<button
													onClick={handleLogout}
													className="w-full flex items-center px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-sm transition-colors"
												>
													<LogOut className="w-4 h-4 mr-2" />
													Logout
												</button>
											</div>
										</div>
									</div>
								</div>
							) : (
								<div className="flex items-center space-x-3">
									{/* Wallet Connect Button */}
									<button
										onClick={() => handleLoginClick('wallet')}
										className="relative px-4 py-2 bg-gradient-to-r from-neonGreen/20 to-neonOrange/20 border border-neonGreen/50 text-neonGreen font-medium rounded-sm overflow-hidden group transition-all duration-200 hover:shadow-lg hover:shadow-neonGreen/25"
									>
										<div className="flex items-center">
											<Wallet className="w-4 h-4 mr-2" />
											<span className="text-sm">Wallet</span>
										</div>
									</button>

									{/* Email Login Button */}
									<button
										onClick={() => handleLoginClick('email')}
										className="relative px-6 py-2 bg-gradient-to-r from-neonGreen to-neonOrange text-black font-semibold rounded-sm overflow-hidden group transition-all duration-200 hover:shadow-lg hover:shadow-neonGreen/25"
									>
										<span className="relative z-10 text-sm">Login</span>
										<div className="absolute inset-0 bg-gradient-to-r from-neonOrange to-neonGreen transform scale-x-0 group-hover:scale-x-100 transition-transform duration-200 origin-left"></div>
									</button>
								</div>
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

					{/* Mobile Menu - Enhanced */}
					<div className={`md:hidden transition-all duration-300 ease-out overflow-hidden ${
						isMobileMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
					}`}>
						<div className="px-4 py-4 space-y-3 border-t border-dark-300 bg-black/50">
							{navLinks.map((link, index) => (
								<Link
									key={link.href}
									href={link.href}
									className={`block px-4 py-3 text-base font-medium transition-all duration-200 rounded-sm ${
										link.isHome
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

							{/* Mobile Authentication Section */}
							{isLoading ? (
								<div className="flex justify-center py-4">
									<div className="w-6 h-6 border-2 border-neonGreen border-t-transparent rounded-full animate-spin"></div>
								</div>
							) : isAuthenticated ? (
								<div className="space-y-3 pt-4 border-t border-dark-300">
									{/* Profile Link - Mobile */}
									<button
										onClick={() => {
											window.location.href = '/profile';
											setIsMobileMenuOpen(false);
										}}
										className="flex items-center justify-between w-full px-4 py-3 text-base font-medium text-gray-300 hover:text-white hover:bg-dark-200 transition-all duration-200 rounded-sm"
									>
										<div className="flex items-center space-x-3">
											<div className="w-8 h-8 bg-gradient-to-br from-neonGreen to-neonOrange rounded-full flex items-center justify-center">
												{hasMultipleAuth ? (
													<Wallet className="w-4 h-4 text-black" />
												) : isWalletAuth ? (
													<Wallet className="w-4 h-4 text-black" />
												) : (
													<span className="text-black font-bold text-sm">
														{getDisplayName()[0].toUpperCase()}
													</span>
												)}
											</div>
											<div className="text-left">
												<div className="text-sm font-medium">{getDisplayName()}</div>
												<div className="text-xs text-gray-400">{getAuthDescription()}</div>
											</div>
										</div>
										<span className="text-lg">{getAuthIcon()}</span>
									</button>

									{/* Link Additional Auth Methods */}
									{!hasMultipleAuth && (
										<>
											{isWalletAuth && (
												<button
													onClick={() => handleLoginClick('email')}
													className="w-full px-4 py-3 text-left text-gray-300 hover:text-white hover:bg-dark-200 transition-all duration-200 rounded-sm"
												>
													📧 Link Email Account
												</button>
											)}
											
											{isFirebaseAuth && (
												<button
													onClick={() => handleLoginClick('wallet')}
													className="w-full px-4 py-3 text-left text-gray-300 hover:text-white hover:bg-dark-200 transition-all duration-200 rounded-sm"
												>
													🦊 Link Wallet
												</button>
											)}
										</>
									)}

									{/* Logout Button */}
									<button
										onClick={handleLogout}
										className="w-full px-6 py-3 bg-red-600/80 hover:bg-red-600 text-white font-semibold rounded-sm transition-all duration-200 hover:shadow-lg hover:shadow-red-500/25"
									>
										Logout
									</button>
								</div>
							) : (
								<div className="space-y-3 pt-4 border-t border-dark-300">
									<button
										onClick={() => handleLoginClick('wallet')}
										className="w-full px-6 py-3 bg-gradient-to-r from-neonGreen/20 to-neonOrange/20 border border-neonGreen/50 text-neonGreen font-semibold rounded-sm transition-all duration-200"
									>
										🦊 Connect Wallet
									</button>
									
									<button
										onClick={() => handleLoginClick('email')}
										className="w-full px-6 py-3 bg-gradient-to-r from-neonGreen to-neonOrange text-black font-semibold rounded-sm transition-all duration-200 hover:shadow-lg hover:shadow-neonGreen/25"
									>
										📧 Email Login
									</button>
								</div>
							)}
						</div>
					</div>
				</nav>
			</header>

			{/* Extended Auth Modal */}
			<ExtendedAuthModal
				isOpen={isAuthModalOpen}
				onClose={() => setIsAuthModalOpen(false)}
				defaultTab={authModalTab}
				preferredChain="evm"
			/>
		</>
	);
};

export default Header;
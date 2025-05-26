'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useChainId, useAccount } from 'wagmi';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';
import { ExtendedAuthModal } from '../auth/ExtendedAuthModal';
import { ShoppingCart } from 'lucide-react';
import { chainUtils } from '@/wallet-auth/adapters/evm/chain-config';

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

	// Wallet認証のみ使用
	const { 
		isAuthenticated, 
		isLoading, 
		displayName,
		logout 
	} = useUnifiedAuth();
	
	// Wagmi hooksを直接使用してリアルタイム情報を取得
	const chainId = useChainId();
	const { address: walletAddress, isConnected } = useAccount();
	
	const { cartItemCount, onCartClick } = useCartInDashboard();

	// ハイドレーション対応のための状態
	const [isClient, setIsClient] = useState(false);

	useEffect(() => {
		setIsClient(true);
	}, []);

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

	const handleCartClick = () => {
		if (onCartClick) {
			onCartClick();
		}
		setIsMobileMenuOpen(false);
	};

	// ユーザー表示名の取得（Wallet専用）
	const getUserDisplayName = () => {
		if (displayName) return displayName;
		if (walletAddress) return chainUtils.formatAddress(walletAddress);
		return 'User';
	};

	// ユーザーイニシャルの取得（Wallet専用）
	const getUserInitials = () => {
		if (displayName) return displayName[0].toUpperCase();
		if (walletAddress) return walletAddress[2].toUpperCase(); // 0x の次の文字
		return 'U';
	};

	// チェーン情報の取得（ハイドレーション対応）
	const getChainInfo = () => {
		if (!isClient || !chainId) {
			return { 
				name: 'Unknown', 
				icon: '⚪', 
				colors: { primary: '#6B7280', secondary: '#9CA3AF' } 
			};
		}
		
		return {
			name: chainUtils.getDisplayName(chainId),
			icon: chainUtils.getIcon(chainId),
			colors: chainUtils.getColors(chainId)
		};
	};

	const chainInfo = getChainInfo();
	
	// デバッグ用ログ（開発時のみ）
	useEffect(() => {
		if (isClient) {
			console.log('🔗 Header Wallet Info:', {
				walletAddress,
				chainId,
				isConnected,
				isAuthenticated,
				chainInfo
			});
		}
	}, [walletAddress, chainId, isConnected, isAuthenticated, isClient]);

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

							{/* Authentication Section - Enhanced Wallet Display */}
							{isLoading ? (
								<div className="px-6 py-2">
									<div className="w-6 h-6 border-2 border-neonGreen border-t-transparent rounded-full animate-spin"></div>
								</div>
							) : (isAuthenticated && isConnected && walletAddress && isClient) ? (
								<div className="flex items-center space-x-3">
									{/* Chain Info */}
									<div className="flex items-center space-x-2 px-3 py-2 bg-black/50 border border-gray-700 rounded-sm">
										<span className="text-lg" title={chainInfo.name}>
											{chainInfo.icon}
										</span>
										<span className="text-sm text-gray-300 font-medium">
											{chainInfo.name}
										</span>
									</div>

									{/* Wallet Address Display */}
									<button
										onClick={() => window.location.href = '/profile'}
										className="flex items-center space-x-2 px-3 py-2 bg-black/50 border border-gray-700 hover:border-neonGreen/50 rounded-sm transition-all duration-200 group"
										title="View Profile"
									>
										<div className="w-6 h-6 bg-gradient-to-br from-neonGreen to-neonOrange rounded-full flex items-center justify-center">
											<span className="text-black font-bold text-xs">
												{getUserInitials()}
											</span>
										</div>
										<span className="text-sm text-white font-mono group-hover:text-neonGreen transition-colors">
											{getUserDisplayName()}
										</span>
									</button>

									{/* Disconnect Button */}
									<button
										onClick={handleLogout}
										className="relative px-4 py-2 bg-red-600/80 hover:bg-red-600 text-white text-sm font-medium rounded-sm transition-all duration-200 hover:shadow-lg hover:shadow-red-500/25 group"
									>
										<span className="relative z-10">Disconnect</span>
										<div className="absolute inset-0 bg-red-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-200 origin-left rounded-sm"></div>
									</button>
								</div>
							) : (
								<button
									onClick={handleLoginClick}
									className="relative px-6 py-2 bg-gradient-to-r from-neonGreen to-neonOrange text-black font-semibold rounded-sm overflow-hidden group transition-all duration-200 hover:shadow-lg hover:shadow-neonGreen/25"
								>
									<span className="relative z-10 text-sm">Connect Wallet</span>
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

							{/* Mobile Authentication Section - Enhanced Display */}
							{isLoading ? (
								<div className="flex justify-center py-4">
									<div className="w-6 h-6 border-2 border-neonGreen border-t-transparent rounded-full animate-spin"></div>
								</div>
							) : (isAuthenticated && isConnected && walletAddress && isClient) ? (
								<div className="space-y-3 pt-4 border-t border-dark-300">
									{/* Enhanced Wallet Info Display */}
									<div className="px-4 py-3 bg-black/70 rounded-sm border border-neonGreen/20">
										<div className="text-xs text-gray-400 mb-2">Connected Wallet</div>
										
										{/* Chain Info */}
										<div className="flex items-center space-x-2 mb-2">
											<span className="text-lg">{chainInfo.icon}</span>
											<span className="text-sm text-white font-medium">{chainInfo.name}</span>
											<span className="text-xs text-gray-400">
												Chain {chainId || 'Unknown'}
											</span>
										</div>
										
										{/* Wallet Address */}
										<div className="flex items-center space-x-2">
											<div className="w-6 h-6 bg-gradient-to-br from-neonGreen to-neonOrange rounded-full flex items-center justify-center">
												<span className="text-black font-bold text-xs">
													{getUserInitials()}
												</span>
											</div>
											<div className="flex-1">
												<div className="text-sm text-white font-mono">
													{getUserDisplayName()}
												</div>
												{walletAddress && (
													<div className="text-xs text-neonGreen font-mono">
														{walletAddress.slice(0, 10)}...{walletAddress.slice(-8)}
													</div>
												)}
											</div>
										</div>
									</div>

									{/* Profile Link - Mobile */}
									<button
										onClick={() => {
											window.location.href = '/profile';
											setIsMobileMenuOpen(false);
										}}
										className="flex items-center justify-between w-full px-4 py-3 text-base font-medium text-gray-300 hover:text-white hover:bg-dark-200 transition-all duration-200 rounded-sm"
									>
										<span>View Profile</span>
									</button>

									{/* Disconnect Button */}
									<button
										onClick={handleLogout}
										className="w-full px-6 py-3 bg-red-600/80 hover:bg-red-600 text-white font-semibold rounded-sm transition-all duration-200 hover:shadow-lg hover:shadow-red-500/25"
									>
										Disconnect Wallet
									</button>
								</div>
							) : (
								<button
									onClick={handleLoginClick}
									className="w-full mt-4 px-6 py-3 bg-gradient-to-r from-neonGreen to-neonOrange text-black font-semibold rounded-sm transition-all duration-200 hover:shadow-lg hover:shadow-neonGreen/25"
								>
									Connect Wallet
								</button>
							)}
						</div>
					</div>
				</nav>
			</header>

			{/* Extended Auth Modal - Wallet Only */}
			<ExtendedAuthModal
				isOpen={isAuthModalOpen}
				onClose={() => setIsAuthModalOpen(false)}
				preferredChain="evm"
			/>
		</>
	);
};

export default Header;
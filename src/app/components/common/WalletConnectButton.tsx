// src/app/components/common/WalletConnectButton.tsx
'use client';

import { useState, useEffect } from 'react';
import { useChainId, useAccount } from 'wagmi';
import { useUnifiedAuth } from '@/auth/contexts/UnifiedAuthContext';
import { useAuthModal } from '@/contexts/AuthModalContext';
import { Wallet, Loader2, AlertCircle, User, ExternalLink } from 'lucide-react';
import { chainUtils } from '@/auth/config/chain-config';
import CyberButton from './CyberButton';

export interface WalletConnectButtonProps {
	variant?: 'desktop' | 'mobile';
	showChainInfo?: boolean;
	showDisconnectButton?: boolean;
	showProfileLink?: boolean;
	onProfileClick?: () => void;
	onConnectClick?: () => void; // 新規：カスタムコネクトハンドラー
	className?: string;
	size?: 'sm' | 'md' | 'lg';
	compact?: boolean;
}

const WalletConnectButton = ({
	variant = 'desktop',
	showChainInfo = true,
	showDisconnectButton = true,
	showProfileLink = true,
	onProfileClick,
	onConnectClick,
	className = '',
	size = 'md',
	compact = false
}: WalletConnectButtonProps) => {
	const {
		isAuthenticated,
		isLoading,
		displayName,
		walletAddress,
		authFlowState,
		logout,
		error: authError
	} = useUnifiedAuth();

	// グローバルモーダル管理
	const { openAuthModal } = useAuthModal();

	// Wagmi hooks for real-time info
	const chainId = useChainId();
	const { address: currentAddress, isConnected } = useAccount();

	// Local state
	const [localError, setLocalError] = useState('');
	const [isClient, setIsClient] = useState(false);

	// Hydration handling
	useEffect(() => {
		setIsClient(true);
	}, []);

	// Error handling
	useEffect(() => {
		if (authError && !localError) {
			setLocalError(authError);
		}
	}, [authError, localError]);

	// Clear local error when auth error clears
	useEffect(() => {
		if (!authError && localError) {
			setLocalError('');
		}
	}, [authError, localError]);

	// Helper functions
	const getUserDisplayName = () => {
		if (displayName) return displayName;
		if (walletAddress) return chainUtils.formatAddress(walletAddress);
		if (currentAddress) return chainUtils.formatAddress(currentAddress);
		return 'User';
	};

	const getUserInitials = () => {
		if (displayName) return displayName[0].toUpperCase();
		if (walletAddress) return walletAddress[2].toUpperCase();
		if (currentAddress) return currentAddress[2].toUpperCase();
		return 'U';
	};

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

	// Event handlers
	const handleConnectClick = () => {
		setLocalError('');

		// カスタムハンドラーがあれば優先使用
		if (onConnectClick) {
			onConnectClick();
			return;
		}

		// デフォルト：グローバルモーダルを開く
		openAuthModal({
			title: 'Connect Your Wallet',
			preferredChain: 'evm',
			onSuccess: (user) => {
				console.log('✅ Wallet connected successfully:', user.walletAddress);
				setLocalError('');
			},
			onError: (error) => {
				console.error('❌ Wallet connection failed:', error);
				setLocalError(error.userMessage || error.message);
			},
			autoClose: true,
		});
	};

	const handleLogout = async () => {
		try {
			setLocalError('');
			await logout();
		} catch (error) {
			console.error('Logout error:', error);
			setLocalError(error instanceof Error ? error.message : 'Logout failed');
		}
	};

	const handleProfileClick = () => {
		if (onProfileClick) {
			onProfileClick();
		} else {
			// Default behavior - navigate to profile page
			window.location.href = '/profile';
		}
	};

	// Get current status for display
	const getStatus = () => {
		if (authFlowState.currentStep === 'connecting') return 'connecting';
		if (authFlowState.currentStep === 'signing') return 'signing';
		if (authFlowState.currentStep === 'verifying') return 'verifying';
		if (authFlowState.currentStep === 'error') return 'error';
		if (isLoading) return 'loading';
		if (isAuthenticated && isConnected && currentAddress) return 'authenticated';
		if (isConnected && currentAddress) return 'connected';
		return 'disconnected';
	};

	const status = getStatus();

	// Size configurations
	const sizeConfig = {
		sm: {
			button: 'px-4 py-2 text-sm',
			avatar: 'w-5 h-5',
			text: 'text-sm',
			spacing: 'space-x-2'
		},
		md: {
			button: 'px-6 py-3 text-base',
			avatar: 'w-6 h-6',
			text: 'text-sm',
			spacing: 'space-x-3'
		},
		lg: {
			button: 'px-8 py-4 text-lg',
			avatar: 'w-8 h-8',
			text: 'text-base',
			spacing: 'space-x-4'
		}
	};

	const config = sizeConfig[size];

	// Desktop variant
	if (variant === 'desktop') {
		return (
			<div className={`flex items-center ${config.spacing} ${className}`}>
				{/* Chain Info */}
				{showChainInfo && status !== 'disconnected' && isClient && (
					<div className="flex items-center space-x-2 px-3 py-2 bg-black/50 border border-gray-700 rounded-sm">
						<span className="text-lg" title={chainInfo.name}>
							{chainInfo.icon}
						</span>
						{!compact && (
							<span className={`text-gray-300 font-medium ${config.text}`}>
								{chainInfo.name}
							</span>
						)}
					</div>
				)}

				{/* Main Button/Status */}
				{status === 'disconnected' ? (
					<CyberButton
						onClick={handleConnectClick}
						disabled={isLoading}
						size={size}
						variant="primary"
						className="inline-flex items-center gap-2 w-full !flex-row"
					>
						{isLoading ? (
							<>
								<Loader2 className="w-4 h-4 animate-spin" />
								Connecting...
							</>
						) : (
							<>
								<Wallet className="w-4 h-4" />
								Connect
							</>
						)}
					</CyberButton>

				) : status === 'connecting' || status === 'signing' || status === 'verifying' ? (
					<div className={`flex items-center ${config.button} bg-neonGreen/20 border border-neonGreen/50 rounded-sm text-neonGreen min-w-0`}>
						<Loader2 className="w-4 h-4 animate-spin mr-2 flex-shrink-0" />
						<span className={`${config.text} truncate`}>
							{status === 'connecting' && 'Connecting...'}
							{status === 'signing' && 'Sign...'}
							{status === 'verifying' && 'Verifying...'}
						</span>
						{authFlowState.progress > 0 && (
							<div className="ml-2 w-12 h-1 bg-dark-300 rounded-full overflow-hidden flex-shrink-0">
								<div
									className="h-full bg-gradient-to-r from-neonGreen to-neonOrange transition-all duration-300"
									style={{ width: `${authFlowState.progress}%` }}
								/>
							</div>
						)}
					</div>
				) : status === 'error' ? (
					<div className="flex items-center space-x-2">
						<div className={`flex items-center ${config.button} bg-red-900/30 border border-red-500/50 rounded-sm text-red-300 min-w-0`}>
							<AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
							<span className={`${config.text} truncate`}>Failed</span>
						</div>
						<CyberButton
							onClick={handleConnectClick}
							size="sm"
							variant="outline"
							className="px-3 py-1 text-xs whitespace-nowrap"
						>
							Retry
						</CyberButton>
					</div>
				) : (
					<div className="flex items-center space-x-2">
						{/* Wallet Info */}
						<button
							onClick={handleProfileClick}
							className="flex items-center space-x-2 px-3 py-2 bg-black/50 border border-gray-700 hover:border-neonGreen/50 rounded-sm transition-all duration-200 group min-w-0 max-w-48"
							title="View Profile"
							disabled={!showProfileLink}
						>
							<div className={`${config.avatar} bg-gradient-to-br from-neonGreen to-neonOrange rounded-full flex items-center justify-center flex-shrink-0`}>
								<span className="text-black font-bold text-xs">
									{getUserInitials()}
								</span>
							</div>
							{!compact && (
								<span className={`text-white font-mono group-hover:text-neonGreen transition-colors ${config.text} truncate`}>
									{getUserDisplayName()}
								</span>
							)}
							{showProfileLink && (
								<ExternalLink className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
							)}
						</button>

						{/* Disconnect Button */}
						{showDisconnectButton && (
							<CyberButton
								onClick={handleLogout}
								size="sm"
								variant="outline"
								className="bg-red-600/20 border-red-500/50 text-red-300 hover:bg-red-600/40 px-3 py-1 text-xs whitespace-nowrap"
							>
								Disconnect
							</CyberButton>
						)}
					</div>
				)}

			</div>
		);
	}

	// Mobile variant
	return (
		<div className={`w-full ${className}`}>
			{status === 'disconnected' ? (
				<CyberButton
					onClick={handleConnectClick}
					disabled={isLoading}
					size={size}
					variant="primary"
					className="w-full"
				>
					{isLoading ? (
						<>
							<Loader2 className="w-5 h-5 animate-spin mr-2" />
							Connecting...
						</>
					) : (
						<>
							<Wallet className="w-5 h-5 mr-2" />
							Connect Wallet
						</>
					)}
				</CyberButton>
			) : status === 'connecting' || status === 'signing' || status === 'verifying' ? (
				<div className="w-full bg-neonGreen/10 border border-neonGreen/30 rounded-sm p-4">
					<div className="flex items-center justify-center mb-3">
						<Loader2 className="w-6 h-6 animate-spin mr-3 text-neonGreen" />
						<span className="text-neonGreen font-medium">
							{status === 'connecting' && 'Connecting Wallet...'}
							{status === 'signing' && 'Waiting for Signature...'}
							{status === 'verifying' && 'Verifying Authentication...'}
						</span>
					</div>
					{authFlowState.progress > 0 && (
						<div className="w-full h-2 bg-dark-300 rounded-full overflow-hidden">
							<div
								className="h-full bg-gradient-to-r from-neonGreen to-neonOrange transition-all duration-300"
								style={{ width: `${authFlowState.progress}%` }}
							/>
						</div>
					)}
				</div>
			) : status === 'error' ? (
				<div className="w-full space-y-3">
					<div className="bg-red-900/30 border border-red-500/50 rounded-sm p-4">
						<div className="flex items-center mb-2">
							<AlertCircle className="w-5 h-5 text-red-400 mr-2" />
							<span className="text-red-300 font-medium">Connection Failed</span>
						</div>
						{localError && (
							<p className="text-red-300 text-sm">{localError}</p>
						)}
					</div>
					<CyberButton
						onClick={handleConnectClick}
						size={size}
						variant="primary"
						className="w-full"
					>
						Try Again
					</CyberButton>
				</div>
			) : (
				<div className="w-full bg-black/70 border border-neonGreen/20 rounded-sm p-4 space-y-4">
					{/* Header */}
					<div className="text-xs text-gray-400 mb-2">Connected Wallet</div>

					{/* Chain Info */}
					{showChainInfo && isClient && (
						<div className="flex items-center space-x-2 mb-3">
							<span className="text-lg">{chainInfo.icon}</span>
							<span className="text-sm text-white font-medium">{chainInfo.name}</span>
							<span className="text-xs text-gray-400">
								Chain {chainId || 'Unknown'}
							</span>
						</div>
					)}

					{/* Wallet Info */}
					<div className="flex items-center space-x-3 mb-4">
						<div className={`${config.avatar} bg-gradient-to-br from-neonGreen to-neonOrange rounded-full flex items-center justify-center`}>
							<span className="text-black font-bold text-xs">
								{getUserInitials()}
							</span>
						</div>
						<div className="flex-1">
							<div className="text-sm text-white font-mono">
								{getUserDisplayName()}
							</div>
							{currentAddress && (
								<div className="text-xs text-neonGreen font-mono">
									{currentAddress.slice(0, 10)}...{currentAddress.slice(-8)}
								</div>
							)}
						</div>
					</div>

					{/* Action Buttons */}
					<div className="space-y-2">
						{showProfileLink && (
							<button
								onClick={handleProfileClick}
								className="w-full flex items-center justify-between px-4 py-3 text-gray-300 hover:text-white hover:bg-dark-200 transition-all duration-200 rounded-sm"
							>
								<div className="flex items-center">
									<User className="w-4 h-4 mr-2" />
									<span>View Profile</span>
								</div>
								<ExternalLink className="w-4 h-4" />
							</button>
						)}

						{showDisconnectButton && (
							<CyberButton
								onClick={handleLogout}
								size={size}
								variant="outline"
								className="w-full bg-red-600/20 border-red-500/50 text-red-300 hover:bg-red-600/40"
							>
								Disconnect Wallet
							</CyberButton>
						)}
					</div>
				</div>
			)}

			{/* Auth Modal */}
			{/* モーダルはグローバルで管理されるため、ここでは不要 */}
		</div>
	);
};

export default WalletConnectButton;
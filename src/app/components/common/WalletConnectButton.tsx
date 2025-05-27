// src/app/components/common/WalletConnectButton.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useChainId, useAccount, useBalance } from 'wagmi';
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
	onConnectClick?: () => void;
	className?: string;
	size?: 'sm' | 'md' | 'lg';
	compact?: boolean;
}

const WalletConnectButton: React.FC<WalletConnectButtonProps> = ({
	variant = 'desktop',
	showChainInfo = true,
	showDisconnectButton = true,
	showProfileLink = true,
	onProfileClick,
	onConnectClick,
	className = '',
	size = 'md',
	compact = false
}) => {
	const {
		isAuthenticated,
		isLoading,
		displayName,
		walletAddress,
		authFlowState,
		logout,
		error: authError
	} = useUnifiedAuth();

	const { openAuthModal } = useAuthModal();

	// Wagmi hooks
	const chainId = useChainId();
	const { address: currentAddress, isConnected } = useAccount();
	const { data: balanceData, isError } = useBalance({
		address: walletAddress ?? undefined,
		chainId,
		watch: true,
	});

	// Hydration
	const [isClient, setIsClient] = useState(false);
	useEffect(() => { setIsClient(true); }, []);

	// Error handling
	const [localError, setLocalError] = useState('');
	useEffect(() => {
		if (authError && !localError) setLocalError(authError);
		if (!authError && localError) setLocalError('');
	}, [authError, localError]);

	// Helpers
	const getUserDisplayName = () => {
		if (displayName) return displayName;
		if (walletAddress) return chainUtils.formatAddress(walletAddress);
		if (currentAddress) return chainUtils.formatAddress(currentAddress);
		return 'User';
	};
	const getUserInitials = () => {
		if (displayName) return displayName[0].toUpperCase();
		const addr = walletAddress ?? currentAddress;
		return addr ? addr[2].toUpperCase() : 'U';
	};
	const getChainInfo = () => {
		if (!isClient || !chainId) return { name: 'Unknown', icon: '⚪' };
		return {
			name: chainUtils.getDisplayName(chainId),
			icon: chainUtils.getIcon(chainId),
		};
	};
	const chainInfo = getChainInfo();

	// Actions
	const handleConnectClick = () => {
		setLocalError('');
		if (onConnectClick) return onConnectClick();
		openAuthModal({
			title: 'Connect Your Wallet',
			preferredChain: 'evm',
			onSuccess: () => setLocalError(''),
			onError: err => setLocalError(err.userMessage || err.message),
			autoClose: true
		});
	};
	const handleLogout = async () => {
		try { setLocalError(''); await logout(); }
		catch (err: any) { setLocalError(err.message || 'Logout failed'); }
	};
	const handleProfileClick = () => {
		if (onProfileClick) onProfileClick(); else window.location.href = '/profile';
	};

	// Status
	const getStatus = () => {
		const step = authFlowState.currentStep;
		if (step === 'connecting') return 'connecting';
		if (step === 'signing') return 'signing';
		if (step === 'verifying') return 'verifying';
		if (step === 'error') return 'error';
		if (isLoading) return 'loading';
		if (isAuthenticated && isConnected && currentAddress) return 'authenticated';
		if (isConnected && currentAddress) return 'connected';
		return 'disconnected';
	};
	const status = getStatus();

	// Size config
	const sizeConfig = {
		sm: { btn: 'px-4 py-2 text-sm', av: 'w-5 h-5', txt: 'text-sm', gap: 'space-x-2' },
		md: { btn: 'px-6 py-3 text-base', av: 'w-6 h-6', txt: 'text-sm', gap: 'space-x-3' },
		lg: { btn: 'px-8 py-4 text-lg', av: 'w-8 h-8', txt: 'text-base', gap: 'space-x-4' }
	};
	const cfg = sizeConfig[size];

	// --- Desktop ---
	if (variant === 'desktop') {
		return (
			<div className={`flex items-center ${cfg.gap} ${className}`}>
				{showChainInfo && status !== 'disconnected' && isClient && (
					<div className="flex items-center space-x-2 px-3 py-2 bg-black/50 border border-gray-700 rounded-sm">
						<span className="text-lg" title={chainInfo.name}>{chainInfo.icon}</span>
						{!compact && <span className={`text-gray-300 font-medium ${cfg.txt}`}>{chainInfo.name}</span>}
					</div>
				)}

				{status === 'disconnected' ? (
					<CyberButton onClick={handleConnectClick} disabled={isLoading} size={size} variant="primary" className="w-full">
						{isLoading ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Connecting…</> : <><Wallet className="w-4 h-4 mr-2" />Connect</>}
					</CyberButton>
				) : ['connecting', 'signing', 'verifying'].includes(status) ? (
					<div className={`flex items-center ${cfg.btn} bg-neonGreen/20 border border-neonGreen/50 rounded-sm text-neonGreen min-w-0`}>
						<Loader2 className="w-4 h-4 animate-spin mr-2" />
						<span className={`${cfg.txt} truncate`}>{status === 'connecting' ? 'Connecting...' : status === 'signing' ? 'Sign...' : 'Verifying...'}</span>
						{authFlowState.progress > 0 && (
							<div className="ml-2 w-12 h-1 bg-dark-300 rounded-full overflow-hidden">
								<div className="h-full bg-gradient-to-r from-neonGreen to-neonOrange transition-all duration-300" style={{ width: `${authFlowState.progress}%` }} />
							</div>
						)}
					</div>
				) : status === 'error' ? (
					<div className="flex items-center space-x-2">
						<div className={`flex items-center ${cfg.btn} bg-red-900/30 border border-red-500/50 rounded-sm text-red-300 min-w-0`}>
							<AlertCircle className="w-4 h-4 mr-2" />
							<span className={`${cfg.txt} truncate`}>Failed</span>
						</div>
						<CyberButton onClick={handleConnectClick} size="sm" variant="outline" className="px-3 py-1 text-xs whitespace-nowrap">Retry</CyberButton>
					</div>
				) : (
					<div className="flex items-center space-x-2">
						<button onClick={handleProfileClick} className="flex items-center space-x-2 px-3 py-2 bg-black/50 border border-gray-700 hover:border-neonGreen/50 rounded-sm transition-all duration-200 group min-w-0 max-w-48" title="View Profile">
							<div className={`${cfg.av} bg-gradient-to-br from-neonGreen to-neonOrange rounded-full flex items-center justify-center`}>
								<span className="text-black font-bold text-xs">{getUserInitials()}</span>
							</div>
							{!compact && <>
								<span className={`text-white font-mono group-hover:text-neonGreen transition-colors ${cfg.txt} truncate`}>{getUserDisplayName()}</span>
								{balanceData && !isError && <span className="text-gray-400 text-sm truncate">{parseFloat(balanceData.formatted).toFixed(4)} {balanceData.symbol}</span>}
							</>}
							{showProfileLink && <ExternalLink className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />}
						</button>
						{showDisconnectButton && <CyberButton onClick={handleLogout} size="sm" variant="outline" className="bg-red-600/20 border-red-500/50 text-red-300 hover:bg-red-600/40 px-3 py-1 text-xs whitespace-nowrap">Disconnect</CyberButton>}
					</div>
				)}
			</div>
		);
	}

	// --- Mobile ---
	return (
		<div className={`w-full ${className}`}>
			{status === 'disconnected' ? (
				<CyberButton onClick={handleConnectClick} disabled={isLoading} size={size} variant="primary" className="w-full">
					{isLoading ? <><Loader2 className="w-5 h-5 animate-spin mr-2" />Connecting...</> : <><Wallet className="w-5 h-5 mr-2" />Connect Wallet</>}
				</CyberButton>
			) : ['connecting', 'signing', 'verifying'].includes(status) ? (
				<div className="w-full bg-neonGreen/10 border border-neonGreen/30 rounded-sm p-4">
					<div className="flex items-center justify-center mb-3">
						<Loader2 className="w-6 h-6 animate-spin mr-3 text-neonGreen" />
						<span className="text-neonGreen font-medium">{status === 'connecting' ? 'Connecting Wallet...' : status === 'signing' ? 'Waiting for Signature...' : 'Verifying Authentication...'}</span>
					</div>
					{authFlowState.progress > 0 && (
						<div className="w-full h-2 bg-dark-300 rounded-full overflow-hidden">
							<div className="h-full bg-gradient-to-r from-neonGreen to-neonOrange transition-all duration-300" style={{ width: `${authFlowState.progress}%` }} />
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
						{localError && <p className="text-red-300 text-sm">{localError}</p>}
					</div>
					<CyberButton onClick={handleConnectClick} size={size} variant="primary" className="w-full">Try Again</CyberButton>
				</div>
			) : (
				<div className="w-full bg-black/70 border border-neonGreen/20 rounded-sm p-4 space-y-4">
					<div className="text-xs text-gray-400 mb-2">Connected Wallet</div>
					{showChainInfo && isClient && (
						<div className="flex items-center space-x-2 mb-3">
							<span className="text-lg">{chainInfo.icon}</span>
							<span className="text-sm text-white font-medium">{chainInfo.name}</span>
							<span className="text-xs text-gray-400">Chain {chainId}</span>
						</div>
					)}
					<div className="flex items-center space-x-3 mb-4">
						<div className={`${cfg.av} bg-gradient-to-br from-neonGreen to-neonOrange rounded-full flex items-center justify-center`}>
							<span className="text-black font-bold text-xs">{getUserInitials()}</span>
						</div>
						<div className="flex-1">
							<div className="text-sm text-white font-mono">{getUserDisplayName()}</div>
							{currentAddress && <div className="text-xs text-neonGreen font-mono">{currentAddress.slice(0, 10)}...{currentAddress.slice(-8)}</div>}
							{balanceData && !isError && <div className="text-xs text-gray-400 mt-1">{parseFloat(balanceData.formatted).toFixed(4)} {balanceData.symbol}</div>}
						</div>
					</div>
					<div className="space-y-2">
						{showProfileLink && (
							<button onClick={handleProfileClick} className="w-full flex items-center justify-between px-4 py-3 text-gray-300 hover:text-white hover:bg-dark-200 transition-all duration-200 rounded-sm">
								<div className="flex items-center"><User className="w-4 h-4 mr-2" /><span>View Profile</span></div><ExternalLink className="w-4 h-4" />
							</button>
						)}
						{showDisconnectButton && <CyberButton onClick={handleLogout} size={size} variant="outline" className="w-full bg-red-600/20 border-red-500/50 text-red-300 hover:bg-red-600/40">Disconnect Wallet</CyberButton>}
					</div>
				</div>
			)}
		</div>
	);
};

export default WalletConnectButton;

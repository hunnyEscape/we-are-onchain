// src/app/wallet-auth-demo/page.tsx
'use client';

import React, { useState } from 'react';
import { useUnifiedAuth } from '@/auth/contexts/UnifiedAuthContext';
import { useEVMWallet } from '@/auth/providers/EVMWalletAdapterWrapper';
import { ExtendedAuthModal } from '@/auth/components/AuthModal';
import CyberCard from '../components/common/CyberCard';
import CyberButton from '../components/common/CyberButton';
import { 
	Wallet, 
	Mail, 
	Shield, 
	CheckCircle, 
	AlertTriangle, 
	Zap,
	User,
	Settings,
	ExternalLink,
	Copy,
	Check
} from 'lucide-react';

export default function WalletAuthDemo() {
	const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
	const [authModalTab, setAuthModalTab] = useState<'email' | 'wallet'>('wallet');
	const [copiedAddress, setCopiedAddress] = useState(false);

	// 統合認証
	const unifiedAuth = useUnifiedAuth();
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
		connectWallet,
		authenticateWallet,
		switchWalletChain,
		authFlowState,
		error,
		_debug
	} = unifiedAuth;

	// EVM Wallet詳細情報
	const evmWallet = useEVMWallet();

	// アドレスコピー
	const handleCopyAddress = (address: string) => {
		navigator.clipboard.writeText(address);
		setCopiedAddress(true);
		setTimeout(() => setCopiedAddress(false), 2000);
	};

	// 認証方式別のテスト
	const handleTestWalletConnect = async () => {
		try {
			await connectWallet('evm');
		} catch (error) {
			console.error('Wallet connect test failed:', error);
		}
	};

	const handleTestWalletAuth = async () => {
		try {
			await authenticateWallet('evm');
		} catch (error) {
			console.error('Wallet auth test failed:', error);
		}
	};

	const handleTestChainSwitch = async () => {
		try {
			await switchWalletChain('evm', 1); // Ethereum mainnet
		} catch (error) {
			console.error('Chain switch test failed:', error);
		}
	};

	const openAuthModal = (tab: 'email' | 'wallet') => {
		setAuthModalTab(tab);
		setIsAuthModalOpen(true);
	};

	return (
		<div className="min-h-screen bg-black text-white p-8">
			<div className="max-w-7xl mx-auto space-y-8">
				{/* Header */}
				<div className="text-center space-y-4">
					<h1 className="text-4xl font-heading font-bold text-neonGreen">
						🚀 Wallet Authentication Demo
					</h1>
					<p className="text-gray-400 max-w-2xl mx-auto">
						Test the integrated Firebase + Wallet authentication system. 
						Connect with MetaMask, WalletConnect, or traditional email/Google login.
					</p>
				</div>

				{/* Auth Status Overview */}
				<CyberCard title="Authentication Status" showEffects={false}>
					<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
						{/* Overall Status */}
						<div className="text-center">
							<div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 ${
								isAuthenticated 
									? 'bg-neonGreen/20 border-2 border-neonGreen' 
									: 'bg-gray-500/20 border-2 border-gray-500'
							}`}>
								{isAuthenticated ? (
									<CheckCircle className="w-8 h-8 text-neonGreen" />
								) : (
									<Shield className="w-8 h-8 text-gray-500" />
								)}
							</div>
							<h3 className="font-semibold text-white mb-1">
								{isAuthenticated ? 'Authenticated' : 'Not Authenticated'}
							</h3>
							<p className="text-sm text-gray-400">
								Method: {authMethod.toUpperCase()}
							</p>
							{hasMultipleAuth && (
								<div className="flex items-center justify-center mt-2 text-xs text-neonOrange">
									<Zap className="w-3 h-3 mr-1" />
									Hybrid Mode
								</div>
							)}
						</div>

						{/* Firebase Auth */}
						<div className="text-center">
							<div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 ${
								isFirebaseAuth 
									? 'bg-blue-500/20 border-2 border-blue-500' 
									: 'bg-gray-500/20 border-2 border-gray-500'
							}`}>
								<Mail className="w-8 h-8 text-blue-500" />
							</div>
							<h3 className="font-semibold text-white mb-1">Firebase Auth</h3>
							<p className="text-sm text-gray-400">
								{isFirebaseAuth ? 'Connected' : 'Disconnected'}
							</p>
							{emailAddress && (
								<p className="text-xs text-blue-400 mt-1">{emailAddress}</p>
							)}
						</div>

						{/* Wallet Auth */}
						<div className="text-center">
							<div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 ${
								isWalletAuth 
									? 'bg-neonGreen/20 border-2 border-neonGreen' 
									: 'bg-gray-500/20 border-2 border-gray-500'
							}`}>
								<Wallet className="w-8 h-8 text-neonGreen" />
							</div>
							<h3 className="font-semibold text-white mb-1">Wallet Auth</h3>
							<p className="text-sm text-gray-400">
								{isWalletAuth ? 'Connected' : 'Disconnected'}
							</p>
							{walletAddress && (
								<div className="mt-1">
									<button
										onClick={() => handleCopyAddress(walletAddress)}
										className="text-xs text-neonGreen hover:text-neonOrange transition-colors flex items-center justify-center mx-auto"
									>
										{walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
										{copiedAddress ? <Check className="w-3 h-3 ml-1" /> : <Copy className="w-3 h-3 ml-1" />}
									</button>
								</div>
							)}
						</div>
					</div>
				</CyberCard>

				{/* Error Display */}
				{error && (
					<div className="bg-red-900/30 border border-red-500/50 text-red-300 px-4 py-3 rounded-sm">
						<div className="flex items-center">
							<AlertTriangle className="w-5 h-5 mr-2" />
							<span>{error}</span>
						</div>
					</div>
				)}

				{/* Auth Flow State */}
				{authFlowState.currentStep !== 'idle' && (
					<CyberCard title="Authentication Flow" showEffects={false}>
						<div className="space-y-4">
							<div className="flex items-center justify-between">
								<span className="text-gray-400">Current Step:</span>
								<span className="text-neonGreen font-semibold capitalize">
									{authFlowState.currentStep.replace('-', ' ')}
								</span>
							</div>
							
							{authFlowState.progress > 0 && (
								<div>
									<div className="flex items-center justify-between mb-2">
										<span className="text-sm text-gray-400">Progress:</span>
										<span className="text-sm text-neonGreen">{authFlowState.progress}%</span>
									</div>
									<div className="w-full h-2 bg-dark-300 rounded-full overflow-hidden">
										<div 
											className="h-full bg-gradient-to-r from-neonGreen to-neonOrange transition-all duration-300"
											style={{ width: `${authFlowState.progress}%` }}
										/>
									</div>
								</div>
							)}

							{authFlowState.selectedChain && (
								<div className="flex items-center justify-between">
									<span className="text-gray-400">Selected Chain:</span>
									<span className="text-white">{authFlowState.selectedChain.toUpperCase()}</span>
								</div>
							)}

							{authFlowState.signatureRequired && (
								<div className="bg-neonOrange/10 border border-neonOrange/30 rounded-sm p-3">
									<div className="flex items-center text-neonOrange">
										<Settings className="w-4 h-4 mr-2" />
										<span className="text-sm">Signature required in wallet</span>
									</div>
								</div>
							)}
						</div>
					</CyberCard>
				)}

				{/* Quick Actions */}
				<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
					{/* Authentication Actions */}
					<CyberCard title="Authentication" showEffects={false}>
						<div className="space-y-4">
							{!isAuthenticated ? (
								<>
									<CyberButton
										variant="primary"
										className="w-full flex items-center justify-center"
										onClick={() => openAuthModal('wallet')}
									>
										<Wallet className="w-4 h-4 mr-2" />
										Connect Wallet
									</CyberButton>

									<CyberButton
										variant="outline"
										className="w-full flex items-center justify-center"
										onClick={() => openAuthModal('email')}
									>
										<Mail className="w-4 h-4 mr-2" />
										Email Login
									</CyberButton>
								</>
							) : (
								<>
									{!hasMultipleAuth && (
										<>
											{isWalletAuth && !isFirebaseAuth && (
												<CyberButton
													variant="outline"
													className="w-full flex items-center justify-center"
													onClick={() => openAuthModal('email')}
												>
													<Mail className="w-4 h-4 mr-2" />
													Link Email Account
												</CyberButton>
											)}

											{isFirebaseAuth && !isWalletAuth && (
												<CyberButton
													variant="outline"
													className="w-full flex items-center justify-center"
													onClick={() => openAuthModal('wallet')}
												>
													<Wallet className="w-4 h-4 mr-2" />
													Link Wallet
												</CyberButton>
											)}
										</>
									)}

									<CyberButton
										variant="outline"
										className="w-full flex items-center justify-center text-red-400 border-red-400 hover:bg-red-400/10"
										onClick={logout}
									>
										Logout
									</CyberButton>
								</>
							)}
						</div>
					</CyberCard>

					{/* Wallet Actions */}
					<CyberCard title="Wallet Testing" showEffects={false}>
						<div className="space-y-4">
							<CyberButton
								variant="outline"
								className="w-full"
								onClick={handleTestWalletConnect}
								disabled={!evmWallet || evmWallet.isConnected}
							>
								Test Wallet Connect
							</CyberButton>

							<CyberButton
								variant="outline"
								className="w-full"
								onClick={handleTestWalletAuth}
								disabled={!evmWallet || !evmWallet.isConnected || evmWallet.isAuthenticated}
							>
								Test Wallet Auth
							</CyberButton>

							<CyberButton
								variant="outline"
								className="w-full"
								onClick={handleTestChainSwitch}
								disabled={!evmWallet || !evmWallet.isConnected}
							>
								Test Chain Switch
							</CyberButton>
						</div>
					</CyberCard>
				</div>

				{/* Detailed Status */}
				<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
					{/* Unified Auth Details */}
					<CyberCard title="Unified Auth Details" showEffects={false}>
						<div className="space-y-3 text-sm">
							<div className="grid grid-cols-2 gap-4">
								<div>
									<span className="text-gray-400">Auth Method:</span>
									<div className="text-white font-mono">{authMethod}</div>
								</div>
								<div>
									<span className="text-gray-400">Loading:</span>
									<div className="text-white font-mono">{isLoading ? 'true' : 'false'}</div>
								</div>
								<div>
									<span className="text-gray-400">Display Name:</span>
									<div className="text-white font-mono">{displayName || 'null'}</div>
								</div>
								<div>
									<span className="text-gray-400">Email:</span>
									<div className="text-white font-mono">{emailAddress || 'null'}</div>
								</div>
							</div>

							{walletAddress && (
								<div>
									<span className="text-gray-400">Wallet Address:</span>
									<div className="text-neonGreen font-mono text-xs break-all">
										{walletAddress}
									</div>
								</div>
							)}
						</div>
					</CyberCard>

					{/* EVM Wallet Details */}
					<CyberCard title="EVM Wallet Details" showEffects={false}>
						<div className="space-y-3 text-sm">
							<div className="grid grid-cols-2 gap-4">
								<div>
									<span className="text-gray-400">Connected:</span>
									<div className="text-white font-mono">{evmWallet.isConnected ? 'true' : 'false'}</div>
								</div>
								<div>
									<span className="text-gray-400">Connecting:</span>
									<div className="text-white font-mono">{evmWallet.isConnecting ? 'true' : 'false'}</div>
								</div>
								<div>
									<span className="text-gray-400">Authenticated:</span>
									<div className="text-white font-mono">{evmWallet.isAuthenticated ? 'true' : 'false'}</div>
								</div>
								<div>
									<span className="text-gray-400">Chain ID:</span>
									<div className="text-white font-mono">{evmWallet.chainId || 'null'}</div>
								</div>
							</div>

							{evmWallet.chainName && (
								<div>
									<span className="text-gray-400">Chain Name:</span>
									<div className="text-white font-mono">{evmWallet.chainName}</div>
								</div>
							)}

							{evmWallet.error && (
								<div>
									<span className="text-gray-400">Error:</span>
									<div className="text-red-400 font-mono text-xs">{evmWallet.error}</div>
								</div>
							)}
						</div>
					</CyberCard>
				</div>

				{/* Debug Information */}
				<CyberCard title="Debug Information" showEffects={false}>
					<div className="space-y-4">
						<div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
							<div>
								<span className="text-gray-400">Firebase Ready:</span>
								<div className={`font-mono ${_debug.firebaseReady ? 'text-neonGreen' : 'text-red-400'}`}>
									{_debug.firebaseReady ? 'true' : 'false'}
								</div>
							</div>
							<div>
								<span className="text-gray-400">Wallet Ready:</span>
								<div className={`font-mono ${_debug.walletReady ? 'text-neonGreen' : 'text-red-400'}`}>
									{_debug.walletReady ? 'true' : 'false'}
								</div>
							</div>
							<div>
								<span className="text-gray-400">Last Error:</span>
								<div className="text-red-400 font-mono text-xs">
									{_debug.lastError || 'none'}
								</div>
							</div>
						</div>

						{/* Raw State Dump */}
						<details className="bg-dark-200/30 rounded-sm p-3">
							<summary className="text-gray-400 cursor-pointer hover:text-white">
								Raw State (Click to expand)
							</summary>
							<pre className="mt-3 text-xs text-gray-300 overflow-auto max-h-64 bg-black/50 p-3 rounded">
								{JSON.stringify({
									unifiedAuth: {
										isAuthenticated,
										authMethod,
										isLoading,
										hasMultipleAuth,
										displayName,
										emailAddress,
										walletAddress,
									},
									evmWallet: {
										isConnected: evmWallet.isConnected,
										isConnecting: evmWallet.isConnecting,
										isAuthenticated: evmWallet.isAuthenticated,
										address: evmWallet.address,
										chainId: evmWallet.chainId,
										chainName: evmWallet.chainName,
									},
									authFlowState,
								}, null, 2)}
							</pre>
						</details>
					</div>
				</CyberCard>

				{/* Links */}
				<CyberCard title="Navigation" showEffects={false}>
					<div className="flex flex-wrap gap-4">
						<CyberButton
							variant="outline"
							size="sm"
							onClick={() => window.location.href = '/dashboard'}
							className="flex items-center"
						>
							<ExternalLink className="w-4 h-4 mr-2" />
							Dashboard
						</CyberButton>

						<CyberButton
							variant="outline"
							size="sm"
							onClick={() => window.location.href = '/profile'}
							className="flex items-center"
						>
							<User className="w-4 h-4 mr-2" />
							Profile
						</CyberButton>

						<CyberButton
							variant="outline"
							size="sm"
							onClick={() => window.location.href = '/'}
							className="flex items-center"
						>
							<ExternalLink className="w-4 h-4 mr-2" />
							Home
						</CyberButton>
					</div>
				</CyberCard>
			</div>

			{/* Extended Auth Modal */}
			<ExtendedAuthModal
				isOpen={isAuthModalOpen}
				onClose={() => setIsAuthModalOpen(false)}
				preferredChain="evm"
			/>
		</div>
	);
}
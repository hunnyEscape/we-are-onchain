// src/app/components/auth/ExtendedAuthModal.tsx
'use client';

import { useState, useEffect } from 'react';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';
import { ChainType } from '../../../../types/wallet';
import { Wallet, Shield, ChevronRight, AlertCircle, CheckCircle, Loader2, Settings } from 'lucide-react';

interface ExtendedAuthModalProps {
	isOpen: boolean;
	onClose: () => void;
	preferredChain?: ChainType;
}

type AuthStep = 'wallet-connect' | 'wallet-sign' | 'success' | 'error';

export const ExtendedAuthModal = ({
	isOpen,
	onClose,
	preferredChain = 'evm'
}: ExtendedAuthModalProps) => {
	const {
		// Wallet Auth
		connectWallet,
		authenticateWallet,

		// 状態
		isLoading,
		authFlowState,
		walletAddress,
		isAuthenticated,
		error: authError,
	} = useUnifiedAuth();

	// ローカル状態
	const [currentStep, setCurrentStep] = useState<AuthStep>('wallet-connect');
	const [localError, setLocalError] = useState('');
	const [loading, setLoading] = useState(false);

	// 認証成功時の自動クローズ
	useEffect(() => {
		if (isAuthenticated && currentStep !== 'success') {
			setCurrentStep('success');
			setTimeout(() => {
				onClose();
				resetState();
			}, 2000);
		}
	}, [isAuthenticated, currentStep, onClose]);

	// エラー処理
	useEffect(() => {
		if (authError) {
			setLocalError(authError);
			setCurrentStep('error');
		}
	}, [authError]);

	// 状態リセット
	const resetState = () => {
		setCurrentStep('wallet-connect');
		setLocalError('');
		setLoading(false);
	};

	// モーダルクローズ時のリセット
	useEffect(() => {
		if (!isOpen) {
			resetState();
		}
	}, [isOpen]);

	// Wallet接続処理
	const handleWalletConnect = async () => {
		setLocalError('');
		setLoading(true);
		setCurrentStep('wallet-connect');

		try {
			await connectWallet(preferredChain);
			setCurrentStep('wallet-sign');
		} catch (error: any) {
			setLocalError(error.message || 'Wallet connection failed');
			setCurrentStep('error');
			setLoading(false);
		}
	};

	// Wallet認証処理
	const handleWalletAuth = async () => {
		setLocalError('');
		setLoading(true);

		try {
			const result = await authenticateWallet(preferredChain);
			if (result.success) {
				setCurrentStep('success');
			} else {
				setLocalError(result.error || 'Wallet authentication failed');
				setCurrentStep('error');
			}
		} catch (error: any) {
			setLocalError(error.message || 'Wallet authentication failed');
			setCurrentStep('error');
		} finally {
			setLoading(false);
		}
	};

	// 戻るボタン処理
	const handleBack = () => {
		if (currentStep === 'wallet-sign') {
			setCurrentStep('wallet-connect');
		} else if (currentStep === 'error') {
			setCurrentStep('wallet-connect');
		}
		setLocalError('');
		setLoading(false);
	};

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
			<div className="relative bg-black/95 backdrop-blur-md border border-neonGreen/30 rounded-lg shadow-2xl w-full max-w-md overflow-hidden">
				{/* Scanline effect */}
				<div className="absolute inset-0 overflow-hidden pointer-events-none">
					<div className="absolute w-full h-px bg-gradient-to-r from-transparent via-neonGreen to-transparent animate-scanline opacity-30"></div>
				</div>

				{/* Progress indicator */}
				{authFlowState.progress > 0 && authFlowState.progress < 100 && (
					<div className="absolute top-0 left-0 right-0 h-1 bg-dark-300">
						<div
							className="h-full bg-gradient-to-r from-neonGreen to-neonOrange transition-all duration-300"
							style={{ width: `${authFlowState.progress}%` }}
						/>
					</div>
				)}

				<div className="relative p-8">
					{/* Header */}
					<div className="flex justify-between items-center mb-6">
						<div>
							<h2 className="text-2xl font-heading font-bold text-white mb-1">
								{currentStep === 'success' ? 'Welcome!' :
									currentStep === 'error' ? 'Connection Failed' :
										currentStep === 'wallet-sign' ? 'Sign Message' :
											'Connect Wallet'}
							</h2>
							<p className="text-sm text-gray-400">
								{currentStep === 'success' ? 'Authentication successful' :
									currentStep === 'error' ? 'Please try again' :
										currentStep === 'wallet-sign' ? 'Confirm your identity by signing' :
											'Connect your Web3 wallet to access the platform'}
							</p>
						</div>
						<button
							onClick={onClose}
							className="text-gray-400 hover:text-neonGreen transition-colors text-2xl font-light"
						>
							×
						</button>
					</div>

					{/* Error Display */}
					{(localError || authError) && currentStep !== 'success' && (
						<div className="bg-red-900/30 border border-red-500/50 text-red-300 px-4 py-3 rounded-sm mb-4 text-sm">
							<div className="flex items-center">
								<AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
								<span>{localError || authError}</span>
							</div>
						</div>
					)}

					{/* Success State */}
					{currentStep === 'success' && (
						<div className="text-center py-8">
							<div className="w-16 h-16 bg-gradient-to-br from-neonGreen/20 to-neonOrange/20 rounded-full flex items-center justify-center mx-auto mb-4">
								<CheckCircle className="w-8 h-8 text-neonGreen" />
							</div>
							<h3 className="text-xl font-bold text-white mb-2">Authentication Complete</h3>
							<p className="text-gray-400 mb-4">You are now connected to the network</p>
							{walletAddress && (
								<div className="bg-neonGreen/10 border border-neonGreen/30 rounded-sm p-3">
									<p className="text-xs text-gray-400">Connected Wallet</p>
									<p className="text-sm text-neonGreen font-mono">{walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}</p>
								</div>
							)}
						</div>
					)}

					{/* Wallet Connect Step */}
					{currentStep === 'wallet-connect' && (
						<div className="space-y-4">
							{/* Web3 Authentication Info */}
							<div className="bg-gradient-to-r from-neonGreen/10 to-neonOrange/10 border border-neonGreen/30 rounded-sm p-4">
								<div className="flex items-center mb-2">
									<Shield className="w-5 h-5 text-neonGreen mr-2" />
									<span className="text-white font-semibold">Web3 Authentication</span>
								</div>
								<p className="text-sm text-gray-300 mb-3">
									Connect your crypto wallet for secure, decentralized authentication.
								</p>
								<ul className="text-xs text-gray-400 space-y-1">
									<li>• No passwords required</li>
									<li>• Cryptographic signature verification</li>
									<li>• Supports MetaMask, WalletConnect, and more</li>
								</ul>
							</div>

							{/* Connect Button */}
							<button
								onClick={handleWalletConnect}
								disabled={loading}
								className="w-full relative px-6 py-4 bg-gradient-to-r from-neonGreen to-neonOrange text-black font-semibold rounded-sm overflow-hidden group transition-all duration-200 hover:shadow-lg hover:shadow-neonGreen/25 disabled:opacity-50 disabled:cursor-not-allowed"
							>
								<div className="flex items-center justify-center">
									{loading ? (
										<>
											<Loader2 className="w-5 h-5 animate-spin mr-2" />
											Connecting...
										</>
									) : (
										<>
											<Wallet className="w-5 h-5 mr-2" />
											Connect Wallet
											<ChevronRight className="w-4 h-4 ml-2" />
										</>
									)}
								</div>
							</button>

							{/* Additional Info */}
							<div className="text-center">
								<p className="text-xs text-gray-500">
									New to Web3 wallets?{' '}
									<a
										href="https://ethereum.org/en/wallets/"
										target="_blank"
										rel="noopener noreferrer"
										className="text-neonGreen hover:text-neonOrange transition-colors"
									>
										Learn More
									</a>
								</p>
							</div>
						</div>
					)}

					{/* Wallet Sign Step */}
					{currentStep === 'wallet-sign' && (
						<div className="text-center space-y-6">
							<div className="w-16 h-16 bg-gradient-to-br from-neonGreen/20 to-neonOrange/20 rounded-full flex items-center justify-center mx-auto">
								<Wallet className="w-8 h-8 text-neonGreen" />
							</div>

							<div>
								<h3 className="text-xl font-bold text-white mb-2">Sign Authentication Message</h3>
								<p className="text-gray-400 mb-4">
									Please sign the message in your wallet to verify your identity.
								</p>
								{walletAddress && (
									<div className="bg-neonGreen/10 border border-neonGreen/30 rounded-sm p-3 mb-4">
										<p className="text-xs text-gray-400">Connected Wallet</p>
										<p className="text-sm text-neonGreen font-mono">{walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}</p>
									</div>
								)}
							</div>

							{/* Signature Required Indicator */}
							{authFlowState.signatureRequired && (
								<div className="bg-neonOrange/10 border border-neonOrange/30 rounded-sm p-3 mb-4">
									<div className="flex items-center justify-center text-neonOrange">
										<Settings className="w-4 h-4 mr-2" />
										<span className="text-sm">Signature required in wallet</span>
									</div>
								</div>
							)}

							<div className="space-y-3">
								<button
									onClick={handleWalletAuth}
									disabled={loading}
									className="w-full relative px-6 py-3 bg-gradient-to-r from-neonGreen to-neonOrange text-black font-semibold rounded-sm overflow-hidden group transition-all duration-200 hover:shadow-lg hover:shadow-neonGreen/25 disabled:opacity-50 disabled:cursor-not-allowed"
								>
									{loading ? (
										<div className="flex items-center justify-center">
											<Loader2 className="w-5 h-5 animate-spin mr-2" />
											Waiting for signature...
										</div>
									) : (
										'Sign Message'
									)}
								</button>

								<button
									onClick={handleBack}
									className="w-full px-6 py-3 bg-dark-200 hover:bg-dark-300 border border-gray-600 text-white font-medium rounded-sm transition-all duration-200"
								>
									Back
								</button>
							</div>
						</div>
					)}

					{/* Error State with Retry */}
					{currentStep === 'error' && (
						<div className="text-center space-y-6">
							<div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto">
								<AlertCircle className="w-8 h-8 text-red-400" />
							</div>

							<div>
								<h3 className="text-xl font-bold text-white mb-2">Connection Failed</h3>
								<p className="text-gray-400 mb-4">
									{localError || authError || 'An unexpected error occurred'}
								</p>
							</div>

							<div className="space-y-3">
								<button
									onClick={handleBack}
									className="w-full px-6 py-3 bg-gradient-to-r from-neonGreen to-neonOrange text-black font-semibold rounded-sm transition-all duration-200 hover:shadow-lg hover:shadow-neonGreen/25"
								>
									Try Again
								</button>

								<button
									onClick={onClose}
									className="w-full px-6 py-3 bg-dark-200 hover:bg-dark-300 border border-gray-600 text-white font-medium rounded-sm transition-all duration-200"
								>
									Close
								</button>
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
};
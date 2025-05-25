// src/app/components/auth/ExtendedAuthModal.tsx
'use client';

import { useState, useEffect } from 'react';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';
import { ChainType } from '../../../../types/wallet';
import { Wallet, Mail, Shield, Zap, ChevronRight, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

interface ExtendedAuthModalProps {
	isOpen: boolean;
	onClose: () => void;
	defaultTab?: 'email' | 'wallet';
	preferredChain?: ChainType;
}

type AuthTab = 'email' | 'wallet';
type AuthStep = 'method-select' | 'email-form' | 'wallet-connect' | 'wallet-sign' | 'success' | 'error';

export const ExtendedAuthModal = ({ 
	isOpen, 
	onClose, 
	defaultTab = 'wallet',
	preferredChain = 'evm' 
}: ExtendedAuthModalProps) => {
	const {
		// Firebase Auth
		signInWithEmail,
		signUpWithEmail,
		signInWithGoogle,
		
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
	const [activeTab, setActiveTab] = useState<AuthTab>(defaultTab);
	const [currentStep, setCurrentStep] = useState<AuthStep>('method-select');
	const [isSignUp, setIsSignUp] = useState(false);
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
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
		setCurrentStep('method-select');
		setActiveTab(defaultTab);
		setIsSignUp(false);
		setEmail('');
		setPassword('');
		setLocalError('');
		setLoading(false);
	};

	// モーダルクローズ時のリセット
	useEffect(() => {
		if (!isOpen) {
			resetState();
		}
	}, [isOpen, defaultTab]);

	// Email認証処理
	const handleEmailAuth = async (e: React.FormEvent) => {
		e.preventDefault();
		setLocalError('');
		setLoading(true);

		try {
			if (isSignUp) {
				await signUpWithEmail(email, password);
			} else {
				await signInWithEmail(email, password);
			}
			setCurrentStep('success');
		} catch (error: any) {
			setLocalError(error.message || 'Email authentication failed');
			setCurrentStep('error');
		} finally {
			setLoading(false);
		}
	};

	// Google認証処理
	const handleGoogleAuth = async () => {
		setLocalError('');
		setLoading(true);

		try {
			await signInWithGoogle();
			setCurrentStep('success');
		} catch (error: any) {
			setLocalError(error.message || 'Google authentication failed');
			setCurrentStep('error');
		} finally {
			setLoading(false);
		}
	};

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
		if (currentStep === 'email-form' || currentStep === 'wallet-connect') {
			setCurrentStep('method-select');
		} else if (currentStep === 'wallet-sign') {
			setCurrentStep('wallet-connect');
		} else if (currentStep === 'error') {
			setCurrentStep('method-select');
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
								 'Access Terminal'}
							</h2>
							<p className="text-sm text-gray-400">
								{currentStep === 'success' ? 'Authentication successful' :
								 currentStep === 'error' ? 'Please try again' :
								 currentStep === 'wallet-sign' ? 'Confirm your identity by signing' :
								 'Choose your preferred authentication method'}
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

					{/* Method Selection */}
					{currentStep === 'method-select' && (
						<div className="space-y-4">
							{/* Tab Selector */}
							<div className="flex bg-dark-200/50 rounded-sm p-1">
								<button
									onClick={() => setActiveTab('wallet')}
									className={`flex-1 flex items-center justify-center py-3 px-4 rounded-sm transition-all duration-200 ${
										activeTab === 'wallet'
											? 'bg-neonGreen/20 text-neonGreen border border-neonGreen/30'
											: 'text-gray-400 hover:text-white'
									}`}
								>
									<Wallet className="w-4 h-4 mr-2" />
									<span className="font-medium">Wallet</span>
									<Zap className="w-3 h-3 ml-1 text-neonOrange" />
								</button>
								<button
									onClick={() => setActiveTab('email')}
									className={`flex-1 flex items-center justify-center py-3 px-4 rounded-sm transition-all duration-200 ${
										activeTab === 'email'
											? 'bg-neonGreen/20 text-neonGreen border border-neonGreen/30'
											: 'text-gray-400 hover:text-white'
									}`}
								>
									<Mail className="w-4 h-4 mr-2" />
									<span className="font-medium">Email</span>
								</button>
							</div>

							{/* Wallet Tab */}
							{activeTab === 'wallet' && (
								<div className="space-y-4">
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
								</div>
							)}

							{/* Email Tab */}
							{activeTab === 'email' && (
								<div className="space-y-4">
									<div className="bg-dark-200/30 border border-gray-600 rounded-sm p-4">
										<div className="flex items-center mb-2">
											<Mail className="w-5 h-5 text-gray-400 mr-2" />
											<span className="text-white font-semibold">Traditional Authentication</span>
										</div>
										<p className="text-sm text-gray-300 mb-3">
											Use email and password or social login for quick access.
										</p>
									</div>

									<button
										onClick={() => setCurrentStep('email-form')}
										className="w-full px-6 py-4 bg-dark-200 hover:bg-dark-300 border border-gray-600 hover:border-gray-500 text-white font-medium rounded-sm transition-all duration-200 group"
									>
										<div className="flex items-center justify-center">
											<Mail className="w-5 h-5 mr-2" />
											Continue with Email
											<ChevronRight className="w-4 h-4 ml-2" />
										</div>
									</button>

									<button
										onClick={handleGoogleAuth}
										disabled={loading}
										className="w-full px-6 py-3 bg-white/10 hover:bg-white/20 border border-gray-600 hover:border-gray-500 text-white font-medium rounded-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group"
									>
										<div className="flex items-center justify-center">
											{loading ? (
												<Loader2 className="w-5 h-5 animate-spin mr-2" />
											) : (
												<svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
													<path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
													<path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
													<path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
													<path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
												</svg>
											)}
											Continue with Google
										</div>
									</button>
								</div>
							)}
						</div>
					)}

					{/* Email Form */}
					{currentStep === 'email-form' && (
						<div className="space-y-4">
							<button
								onClick={handleBack}
								className="text-gray-400 hover:text-neonGreen transition-colors text-sm flex items-center"
							>
								← Back to methods
							</button>

							<form onSubmit={handleEmailAuth} className="space-y-4">
								<div>
									<label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
										Email Address
									</label>
									<input
										type="email"
										id="email"
										value={email}
										onChange={(e) => setEmail(e.target.value)}
										required
										className="w-full px-4 py-3 bg-black/50 border border-gray-600 rounded-sm focus:outline-none focus:border-neonGreen focus:ring-1 focus:ring-neonGreen text-white placeholder-gray-500 transition-all duration-200"
										placeholder="user@example.com"
									/>
								</div>

								<div>
									<label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
										Password
									</label>
									<input
										type="password"
										id="password"
										value={password}
										onChange={(e) => setPassword(e.target.value)}
										required
										minLength={6}
										className="w-full px-4 py-3 bg-black/50 border border-gray-600 rounded-sm focus:outline-none focus:border-neonGreen focus:ring-1 focus:ring-neonGreen text-white placeholder-gray-500 transition-all duration-200"
										placeholder="••••••••"
									/>
									{isSignUp && (
										<p className="text-xs text-gray-500 mt-1">
											Minimum 6 characters required
										</p>
									)}
								</div>

								<button
									type="submit"
									disabled={loading}
									className="w-full relative px-6 py-3 bg-gradient-to-r from-neonGreen to-neonOrange text-black font-semibold rounded-sm overflow-hidden group transition-all duration-200 hover:shadow-lg hover:shadow-neonGreen/25 disabled:opacity-50 disabled:cursor-not-allowed"
								>
									{loading ? (
										<div className="flex items-center justify-center">
											<Loader2 className="w-5 h-5 animate-spin mr-2" />
											Processing...
										</div>
									) : (
										isSignUp ? 'Create Account' : 'Sign In'
									)}
								</button>
							</form>

							{/* Toggle Sign Up / Sign In */}
							<div className="text-center">
								<button
									onClick={() => setIsSignUp(!isSignUp)}
									className="text-neonGreen hover:text-neonOrange transition-colors text-sm"
								>
									{isSignUp
										? 'Already have an account? Sign In'
										: 'Need an account? Create One'}
								</button>
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
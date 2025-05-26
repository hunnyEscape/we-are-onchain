// src/auth/components/AuthModal.tsx
'use client';

import { useState, useEffect } from 'react';
import { useUnifiedAuth } from '@/auth/contexts/UnifiedAuthContext';
import { useAuthModal } from '@/contexts/AuthModalContext';
import { ChainType } from '@/types/wallet';
import { SelectableChain, SelectableChainId } from '@/types/chain-selection';
import { testnetUtils } from '@/auth/config/testnet-chains';
import ChainSelector from './ChainSelector';
import CyberCard from '@/app/components/common/CyberCard';
import GridPattern from '@/app/components/common/GridPattern';
import {
	Wallet,
	Shield,
	ChevronRight,
	ArrowLeft,
	AlertCircle,
	CheckCircle,
	Loader2,
	Settings,
	Zap
} from 'lucide-react';

interface ExtendedAuthModalProps {
	isOpen: boolean;
	onClose: () => void;
	preferredChain?: ChainType;
}

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
		switchWalletChain,
		isLoading,
		authFlowState: unifiedAuthFlowState,
		walletAddress,
		isAuthenticated,
		error: authError,
	} = useUnifiedAuth();

	// ★ AuthModalContextから状態とアクションを取得
	const {
		modalOptions,
		authFlowState,
		setAuthStep,
		goBackStep,
		selectChain,
		switchChain,
		getSelectedChain,
		updateProgress,
		setStepStatus,
	} = useAuthModal();

	

	// ローカル状態（最小限に削減）
	const [localError, setLocalError] = useState('');
	const [isProcessing, setIsProcessing] = useState(false);

	// authFlowStateの変更を監視してステップを自動更新
	useEffect(() => {
		console.log('🔄 AuthFlowState changed:', unifiedAuthFlowState);

		if (unifiedAuthFlowState.currentStep === 'signing') {
			setAuthStep?.('wallet-sign');
			setStepStatus?.({ signatureRequired: true });
			setIsProcessing(true);
		} else if (unifiedAuthFlowState.currentStep === 'success') {
			setAuthStep?.('success');
			setIsProcessing(false);
		} else if (unifiedAuthFlowState.currentStep === 'error') {
			setAuthStep?.('error');
			setIsProcessing(false);
		} else if (unifiedAuthFlowState.currentStep === 'idle' && isAuthenticated) {
			setAuthStep?.('success');
			setIsProcessing(false);
		}
	}, [unifiedAuthFlowState, isAuthenticated, setAuthStep, setStepStatus]);

	// 認証成功時の自動クローズ
	useEffect(() => {
		if (isAuthenticated && authFlowState?.currentStep === 'success') {
			console.log('🎉 Authentication completed, closing modal in 2 seconds...');
			updateProgress?.(100);

			if (modalOptions?.autoClose !== false) {
				setTimeout(() => {
					onClose();
					resetState();
				}, 2000);
			}
		}
	}, [isAuthenticated, authFlowState?.currentStep, modalOptions?.autoClose, onClose, updateProgress]);

	// エラー処理
	useEffect(() => {
		if (authError && !localError) {
			console.log('❌ Auth error detected:', authError);
			setLocalError(authError);
			setAuthStep?.('error');
			setIsProcessing(false);
		}
	}, [authError, localError, setAuthStep]);

	// 状態リセット
	const resetState = () => {
		const initialStep = modalOptions?.step?.skipChainSelection ? 'wallet-connect' : 'chain-select';
		setAuthStep?.(initialStep);
		setLocalError('');
		setIsProcessing(false);
		updateProgress?.(0);
		setStepStatus?.({ signatureRequired: false, verificationRequired: false });
	};

	// モーダルクローズ時のリセット
	useEffect(() => {
		if (!isOpen) {
			resetState();
		}
	}, [isOpen]);

	// チェーン選択のハンドラー
	const handleChainSelect = async (chain: SelectableChain) => {
		try {
			console.log('🔗 Chain selected:', chain.displayName);
			setLocalError('');
			updateProgress?.(25);

			// チェーン選択を記録
			const success = await selectChain?.(chain.id);

			if (success) {
				// チェーン切り替えが必要な場合
				if (modalOptions?.chainSelection?.requireChainSwitch) {
					updateProgress?.(50);
					await switchChain?.(chain.id);
				}

				// 次のステップに進む
				setTimeout(() => {
					setAuthStep?.('wallet-connect');
					updateProgress?.(75);
				}, 500);
			}
		} catch (error) {
			console.error('❌ Chain selection error:', error);
			setLocalError(error instanceof Error ? error.message : 'Chain selection failed');
		}
	};

	// ウォレット接続+認証の一括処理
	const handleWalletConnectAndAuth = async () => {
		setLocalError('');
		setIsProcessing(true);
		updateProgress?.(25);

		try {
			console.log('🔗 Starting wallet connection...');

			// 選択されたチェーンを取得
			const selectedChain = getSelectedChain?.();
			const chainType = selectedChain?.id === 'avalanche-fuji' ? 'evm' : 'evm'; // 現在は両方EVM

			// ウォレット接続
			const connection = await connectWallet(chainType);
			console.log('✅ Wallet connection result:', connection);

			console.log(`selectedChain.chainId,connection.chainId`, selectedChain?.chainId, connection.chainId);
			if (selectedChain && connection.chainId !== selectedChain.chainId) {
				try {
					console.log(`switchChain`);
					await switchWalletChain('evm', selectedChain.chainId);
				} catch (switchError) {
					console.warn('⚠️ Chain switch failed, continuing with current chain:', switchError);
					// エラーを投げずに継続（ユーザーが拒否した場合など）
				}
			}

			updateProgress?.(50);
			setAuthStep?.('wallet-sign');

			// 認証実行
			const result = await authenticateWallet(chainType, connection.address);

			if (result.success) {
				console.log('🎉 Authentication successful');
				updateProgress?.(100);
			} else {
				throw new Error(result.error || 'Authentication failed');
			}

		} catch (error: any) {
			console.error('❌ Wallet connection failed:', error);
			setLocalError(error.message || 'Wallet connection failed');
			setAuthStep?.('error');
			updateProgress?.(0);
		} finally {
			setIsProcessing(false);
		}
	};

	// 手動認証
	const handleWalletAuth = async () => {
		setLocalError('');
		setIsProcessing(true);

		try {
			console.log('🚀 Manual wallet authentication...');

			if (!walletAddress) {
				throw new Error('Wallet not connected. Please connect your wallet first.');
			}

			const selectedChain = getSelectedChain?.();
			const chainType = selectedChain?.id === 'avalanche-fuji' ? 'evm' : 'evm';

			const result = await authenticateWallet(chainType);

			if (result.success) {
				console.log('🎉 Manual authentication successful');
			} else {
				throw new Error(result.error || 'Authentication failed');
			}
		} catch (error: any) {
			console.error('💥 Manual authentication error:', error);
			setLocalError(error.message || 'Authentication failed');
			setAuthStep?.('error');
		} finally {
			setIsProcessing(false);
		}
	};

	// 戻るボタン処理
	const handleBack = () => {
		const success = goBackStep?.();
		if (!success) {
			// 最初のステップの場合
			setAuthStep?.(modalOptions?.step?.skipChainSelection ? 'wallet-connect' : 'chain-select');
		}
		setLocalError('');
		setIsProcessing(false);
		updateProgress?.(Math.max(0, (authFlowState?.progress || 0) - 25));
	};

	// ステップ別のタイトル取得
	const getStepTitle = () => {
		const stepTitles = modalOptions?.step?.stepTitles;
		switch (authFlowState?.currentStep) {
			case 'chain-select':
				return stepTitles?.chainSelect || 'Select Network';
			case 'wallet-connect':
				return stepTitles?.walletConnect || 'Connect Wallet';
			case 'wallet-sign':
				return stepTitles?.walletSign || 'Sign Message';
			case 'success':
				return stepTitles?.success || 'Welcome!';
			case 'error':
				return stepTitles?.error || 'Connection Failed';
			default:
				return modalOptions?.title || 'Connect Wallet';
		}
	};

	// ステップ別の説明取得
	const getStepDescription = () => {
		switch (authFlowState?.currentStep) {
			case 'chain-select':
				return modalOptions?.chainSelection?.customDescription || 'Choose your preferred blockchain network';
			case 'wallet-connect':
				return 'Connect your Web3 wallet to access the platform';
			case 'wallet-sign':
				return 'Confirm your identity by signing the authentication message';
			case 'success':
				return 'Authentication successful! Welcome to the platform.';
			case 'error':
				return 'Please try again or contact support if the problem persists.';
			default:
				return 'Connect your Web3 wallet to get started';
		}
	};

	// プログレスバー表示判定
	const shouldShowProgress = () => {
		return modalOptions?.step?.showStepProgress &&
			(authFlowState?.progress || 0) > 0 &&
			(authFlowState?.progress || 0) < 100 &&
			authFlowState?.currentStep !== 'success';
	};

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
			<CyberCard
				className="relative w-full max-w-2xl overflow-hidden animate-fade-in"
				showEffects={true}
			>
				{/* 背景エフェクト */}
				<GridPattern size={30} opacity={0.03} animated={true} />

				{/* プログレスバー */}
				{shouldShowProgress() && (
					<div className="absolute top-0 left-0 right-0 h-1 bg-dark-300">
						<div
							className="h-full bg-gradient-to-r from-neonGreen to-neonOrange transition-all duration-500"
							style={{ width: `${authFlowState?.progress || 0}%` }}
						/>
					</div>
				)}

				<div className="relative p-8">
					{/* ヘッダー */}
					<div className="flex justify-between items-start mb-6">
						<div className="flex items-center space-x-4">
							{/* 戻るボタン */}
							{modalOptions?.step?.allowStepBack &&
								authFlowState?.stepManagement?.canGoBack &&
								authFlowState?.currentStep !== 'success' && (
									<button
										onClick={handleBack}
										className="p-2 text-gray-400 hover:text-neonGreen transition-colors rounded-sm hover:bg-dark-200 border border-dark-300 hover:border-neonGreen/50"
										aria-label="Go back"
									>
										<ArrowLeft className="w-5 h-5" />
									</button>
								)}

							<div>
								<h2 className="text-2xl font-heading font-bold text-white mb-1">
									{getStepTitle()}
								</h2>
								<p className="text-sm text-gray-400">
									{getStepDescription()}
								</p>

								{/* デバッグ情報 */}
								{process.env.NODE_ENV === 'development' && (
									<div className="text-xs text-gray-500 mt-1">
										Debug: {authFlowState?.currentStep} | Progress: {authFlowState?.progress || 0}%
									</div>
								)}
							</div>
						</div>

						<button
							onClick={onClose}
							className="text-gray-400 hover:text-neonGreen transition-colors text-2xl font-light"
						>
							×
						</button>
					</div>

					{/* エラー表示 */}
					{(localError || authError) && authFlowState?.currentStep !== 'success' && (
						<div className="bg-gradient-to-r from-red-900/30 to-red-800/30 border border-red-500/50 text-red-300 px-4 py-3 rounded-sm mb-6 backdrop-blur-sm">
							<div className="flex items-center">
								<AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
								<div>
									<div className="text-sm font-medium">{localError || authError}</div>
									{process.env.NODE_ENV === 'development' && (
										<div className="text-xs text-red-200 mt-1">
											Wallet: {walletAddress || 'Not connected'} | Auth: {isAuthenticated ? 'Yes' : 'No'}
										</div>
									)}
								</div>
							</div>
						</div>
					)}

					{/* メインコンテンツ */}
					<div className="min-h-[400px]">
						{/* チェーン選択ステップ */}
						{authFlowState?.currentStep === 'chain-select' && (
							<ChainSelector
								onChainSelect={handleChainSelect}
								title={modalOptions?.chainSelection?.customTitle}
								description={modalOptions?.chainSelection?.customDescription}
								allowedChains={modalOptions?.chainSelection?.availableChains}
								variant={modalOptions?.chainSelection?.variant || 'default'}
								columns={modalOptions?.chainSelection?.columns || 2}
								loading={isProcessing}
								error={localError}
								className="animate-slide-in"
							/>
						)}

						{/* ウォレット接続ステップ */}
						{authFlowState?.currentStep === 'wallet-connect' && (
							<div className="space-y-6 animate-slide-in">
								{/* 選択されたチェーン表示 */}
								{getSelectedChain?.() && (
									<CyberCard className="bg-gradient-to-r from-neonGreen/10 to-neonOrange/10 border-neonGreen/30">
										<div className="flex items-center space-x-3">
											<span className="text-2xl">{getSelectedChain?.()?.icon}</span>
											<div>
												<div className="text-white font-medium">
													Selected Network: {getSelectedChain?.()?.displayName}
												</div>
												<div className="text-gray-400 text-sm">
													Chain ID: {getSelectedChain?.()?.chainId}
												</div>
											</div>
										</div>
									</CyberCard>
								)}

								{/* Web3認証情報 */}
								<CyberCard className="bg-gradient-to-r from-neonGreen/5 to-neonOrange/5">
									<div className="flex items-center mb-3">
										<Shield className="w-5 h-5 text-neonGreen mr-2" />
										<span className="text-white font-semibold">Web3 Authentication</span>
									</div>
									<p className="text-sm text-gray-300 mb-4">
										Connect your crypto wallet for secure, decentralized authentication.
									</p>
									<ul className="text-xs text-gray-400 space-y-1">
										<li>• No passwords required</li>
										<li>• Cryptographic signature verification</li>
										<li>• Supports MetaMask, WalletConnect, and more</li>
									</ul>
								</CyberCard>

								{/* 接続ボタン */}
								<button
									onClick={handleWalletConnectAndAuth}
									disabled={isProcessing}
									className="w-full relative px-6 py-4 bg-gradient-to-r from-neonGreen to-neonOrange text-black font-semibold rounded-sm overflow-hidden group transition-all duration-200 hover:shadow-lg hover:shadow-neonGreen/25 disabled:opacity-50 disabled:cursor-not-allowed"
								>
									<div className="flex items-center justify-center">
										{isProcessing ? (
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

								{/* 追加情報 */}
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

						{/* 署名ステップ */}
						{authFlowState?.currentStep === 'wallet-sign' && (
							<div className="text-center space-y-6 animate-slide-in">
								<div className="w-16 h-16 bg-gradient-to-br from-neonGreen/20 to-neonOrange/20 rounded-full flex items-center justify-center mx-auto border border-neonGreen/30">
									<Wallet className="w-8 h-8 text-neonGreen" />
								</div>

								<div>
									<h3 className="text-xl font-bold text-white mb-2">Sign Authentication Message</h3>
									<p className="text-gray-400 mb-4">
										{isProcessing && unifiedAuthFlowState.signatureRequired
											? 'Please check your wallet and sign the message to complete authentication.'
											: 'Please sign the message in your wallet to verify your identity.'
										}
									</p>
									{walletAddress && (
										<CyberCard className="bg-neonGreen/10 border-neonGreen/30 inline-block">
											<p className="text-xs text-gray-400">Connected Wallet</p>
											<p className="text-sm text-neonGreen font-mono">
												{walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
											</p>
										</CyberCard>
									)}
								</div>

								{/* 署名状態インジケーター */}
								{unifiedAuthFlowState.signatureRequired && (
									<CyberCard className="bg-neonOrange/10 border-neonOrange/30">
										<div className="flex items-center justify-center text-neonOrange">
											<Settings className="w-4 h-4 mr-2" />
											<span className="text-sm">Signature required in wallet</span>
										</div>
									</CyberCard>
								)}

								<div className="space-y-3">
									<button
										onClick={handleWalletAuth}
										disabled={isProcessing}
										className="w-full relative px-6 py-3 bg-gradient-to-r from-neonGreen to-neonOrange text-black font-semibold rounded-sm overflow-hidden group transition-all duration-200 hover:shadow-lg hover:shadow-neonGreen/25 disabled:opacity-50 disabled:cursor-not-allowed"
									>
										{isProcessing ? (
											<div className="flex items-center justify-center">
												<Loader2 className="w-5 h-5 animate-spin mr-2" />
												{unifiedAuthFlowState.signatureRequired ? 'Waiting for signature...' : 'Processing...'}
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

						{/* 成功ステップ */}
						{authFlowState?.currentStep === 'success' && (
							<div className="text-center py-8 animate-slide-in">
								<div className="w-16 h-16 bg-gradient-to-br from-neonGreen/20 to-neonOrange/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-neonGreen animate-pulse-fast">
									<CheckCircle className="w-8 h-8 text-neonGreen" />
								</div>
								<h3 className="text-xl font-bold text-white mb-2">Authentication Complete</h3>
								<p className="text-gray-400 mb-4">You are now connected to the network</p>
								{walletAddress && (
									<CyberCard className="bg-neonGreen/10 border-neonGreen/30 inline-block">
										<p className="text-xs text-gray-400">Connected Wallet</p>
										<p className="text-sm text-neonGreen font-mono">
											{walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
										</p>
									</CyberCard>
								)}
								{getSelectedChain?.() && (
									<div className="mt-3 text-xs text-gray-400">
										Network: {getSelectedChain?.()?.displayName}
									</div>
								)}
							</div>
						)}

						{/* エラーステップ */}
						{authFlowState?.currentStep === 'error' && (
							<div className="text-center space-y-6 animate-slide-in">
								<div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto border border-red-500/50">
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

				{/* アニメーション定義 */}
				<style jsx>{`
					@keyframes fade-in {
						from {
							opacity: 0;
							transform: scale(0.95);
						}
						to {
							opacity: 1;
							transform: scale(1);
						}
					}
					
					@keyframes slide-in {
						from {
							opacity: 0;
							transform: translateY(20px);
						}
						to {
							opacity: 1;
							transform: translateY(0);
						}
					}
					
					.animate-fade-in {
						animation: fade-in 0.3s ease-out;
					}
					
					.animate-slide-in {
						animation: slide-in 0.4s ease-out;
					}
					
					@media (prefers-reduced-motion: reduce) {
						.animate-fade-in,
						.animate-slide-in {
							animation: none;
						}
					}
				`}</style>
			</CyberCard>
		</div>
	);
};
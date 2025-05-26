// src/auth/components/ChainSelector.tsx
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { ChainSelectorProps, SelectableChain, SelectableChainId } from '@/types/chain-selection';
import { testnetUtils, SUPPORTED_TESTNETS } from '@/auth/config/testnet-chains';
import { ChainSelectionUtils } from '@/auth/utils/chain-utils';
import ChainCard from './ChainCard';
import CyberCard from '@/app/components/common/CyberCard';
import GridPattern from '@/app/components/common/GridPattern';
import {
	ArrowLeft,
	AlertCircle,
	Info,
	Zap,
	Shield,
	Clock,
	ChevronRight,
	RefreshCw,
	Loader2
} from 'lucide-react';

/**
 * Tailwindベースのチェーン選択メイン画面
 * 既存のサイバーパンクテーマとの完全統一
 */
export const ChainSelector: React.FC<ChainSelectorProps> = ({
	onChainSelect,
	onBack,
	title = 'Select Network',
	description = 'Choose your preferred blockchain network',
	showBackButton = false,
	allowedChains,
	disabledChains = [],
	variant = 'default',
	columns = 2,
	loading = false,
	error,
	className = '',
}) => {
	// ローカル状態
	const [selectedChain, setSelectedChain] = useState<SelectableChainId | null>(null);
	const [loadingChain, setLoadingChain] = useState<SelectableChainId | null>(null);
	const [chainErrors, setChainErrors] = useState<Record<SelectableChainId, string>>({} as Record<SelectableChainId, string>);
	const [showComparison, setShowComparison] = useState(false);

	// 利用可能なチェーンをフィルタリング
	const availableChains = useMemo(() => {
		let chains = SUPPORTED_TESTNETS;

		if (allowedChains && allowedChains.length > 0) {
			chains = chains.filter(chain => allowedChains.includes(chain.id));
		}

		return chains.filter(chain => chain.isSupported);
	}, [allowedChains]);

	// チェーン選択のハンドラー
	const handleChainSelect = async (chain: SelectableChain) => {
		if (disabledChains.includes(chain.id) || loadingChain) return;

		try {
			setLoadingChain(chain.id);
			setChainErrors(prev => ({ ...prev, [chain.id]: '' }));

			// チェーンバリデーション
			const validation = ChainSelectionUtils.validateChain(chain.id, {
				strict: true,
				checkWalletSupport: true,
				warningLevel: 'basic',
			});

			if (!validation.isValid) {
				throw new Error(validation.errors.join(', '));
			}

			setSelectedChain(chain.id);

			// 少し遅延させてから選択を完了（UX向上）
			setTimeout(() => {
				onChainSelect(chain);
			}, 300);

		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Chain selection failed';
			setChainErrors(prev => ({ ...prev, [chain.id]: errorMessage }));
			console.error('Chain selection error:', error);
		} finally {
			setLoadingChain(null);
		}
	};

	// エラークリア
	const clearChainError = (chainId: SelectableChainId) => {
		setChainErrors(prev => ({ ...prev, [chainId]: '' }));
	};

	// グリッドレイアウトのクラス
	const getGridClasses = () => {
		if (variant === 'compact') {
			return 'grid grid-cols-1 gap-4';
		}

		return `grid gap-4 ${columns === 1 ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'}`;
	};

	// 比較データの生成
	const comparisonData = useMemo(() => {
		if (availableChains.length < 2) return null;

		return testnetUtils.getComparisonStats().filter(stat =>
			availableChains.some(chain => chain.id === stat.chainId)
		);
	}, [availableChains]);

	// ヘッダー部分
	const renderHeader = () => (
		<div className="mb-8">
			{/* タイトル行 */}
			<div className="flex items-center justify-between mb-6">
				<div className="flex items-center space-x-4">
					{showBackButton && onBack && (
						<button
							onClick={onBack}
							className="p-2 text-gray-400 hover:text-neonGreen transition-colors rounded-sm hover:bg-dark-200 border border-dark-300 hover:border-neonGreen/50"
							aria-label="Go back"
						>
							<ArrowLeft className="w-5 h-5" />
						</button>
					)}
					<div>
						<h2 className="text-3xl font-heading font-bold text-white mb-2 bg-gradient-to-r from-white to-neonGreen bg-clip-text text-transparent animate-glitch-slow">
							{title}
						</h2>
						<p className="text-gray-400 text-sm leading-relaxed">
							{description}
						</p>
					</div>
				</div>

				{/* 比較表示切り替え */}
				{availableChains.length > 1 && variant !== 'compact' && (
					<button
						onClick={() => setShowComparison(!showComparison)}
						className="flex items-center space-x-2 px-4 py-2 bg-dark-200 hover:bg-dark-300 border border-gray-600 hover:border-neonGreen/50 rounded-sm text-sm text-gray-300 hover:text-white transition-all duration-200"
					>
						<Info className="w-4 h-4" />
						<span>{showComparison ? 'Hide Comparison' : 'Compare Networks'}</span>
					</button>
				)}
			</div>

			{/* エラー表示 */}
			{error && (
				<div className="mb-6 p-4 bg-gradient-to-r from-red-900/30 to-red-800/30 border border-red-500/50 text-red-300 rounded-sm backdrop-blur-sm">
					<div className="flex items-center space-x-3">
						<AlertCircle className="w-5 h-5 flex-shrink-0" />
						<div>
							<div className="font-medium text-sm">Connection Error</div>
							<div className="text-xs text-red-200 mt-1">{error}</div>
						</div>
					</div>
				</div>
			)}

			{/* 比較テーブル */}
			{showComparison && comparisonData && renderComparisonTable()}
		</div>
	);

	// 比較テーブル
	const renderComparisonTable = () => {
		if (!comparisonData) return null;

		return (
			<CyberCard
				title="Network Comparison"
				className="mb-6 animate-fade-in"
				showEffects={true}
			>
				<div className="overflow-x-auto">
					<table className="w-full text-sm">
						<thead>
							<tr className="border-b border-dark-300">
								<th className="text-left py-3 text-gray-300 font-heading">Network</th>
								<th className="text-left py-3 text-gray-300 font-heading">Block Time</th>
								<th className="text-left py-3 text-gray-300 font-heading">Confirmations</th>
								<th className="text-left py-3 text-gray-300 font-heading">Features</th>
							</tr>
						</thead>
						<tbody>
							{comparisonData.map((stat, index) => {
								const chain = testnetUtils.getChainById(stat.chainId);
								return (
									<tr
										key={stat.chainId}
										className={`
                      border-b border-dark-300/50 hover:bg-neonGreen/5 transition-colors duration-200
                      ${index % 2 === 0 ? 'bg-dark-100/30' : 'bg-transparent'}
                    `}
									>
										<td className="py-3">
											<div className="flex items-center space-x-3">
												<span className="text-xl">{chain?.icon}</span>
												<span className="text-white font-medium">{stat.name}</span>
											</div>
										</td>
										<td className="py-3">
											<div className="flex items-center space-x-1 text-gray-300">
												<Clock className="w-3 h-3" />
												<span>~{stat.blockTime}s</span>
											</div>
										</td>
										<td className="py-3">
											<div className="flex items-center space-x-1 text-gray-300">
												<Shield className="w-3 h-3" />
												<span>{stat.confirmations}</span>
											</div>
										</td>
										<td className="py-3">
											<span className="text-neonGreen font-mono">{stat.features}</span>
										</td>
									</tr>
								);
							})}
						</tbody>
					</table>
				</div>
			</CyberCard>
		);
	};

	// チェーンリスト
	const renderChainList = () => {
		if (loading) {
			return (
				<div className="flex items-center justify-center py-16">
					<div className="flex flex-col items-center space-y-4">
						<div className="relative">
							<Loader2 className="w-8 h-8 text-neonGreen animate-spin" />
							<div className="absolute inset-0 w-8 h-8 border-2 border-neonGreen/20 rounded-full animate-pulse" />
						</div>
						<div className="text-center">
							<div className="text-white font-medium">Loading Networks</div>
							<div className="text-gray-400 text-sm">Scanning available chains...</div>
						</div>
					</div>
				</div>
			);
		}

		if (availableChains.length === 0) {
			return (
				<CyberCard className="text-center py-12">
					<AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
					<h3 className="text-xl font-heading font-semibold text-white mb-2">No Networks Available</h3>
					<p className="text-gray-400 text-sm max-w-md mx-auto leading-relaxed">
						No supported networks found for your current configuration.
						Please check your settings or try again later.
					</p>
				</CyberCard>
			);
		}

		return (
			<div className={`${getGridClasses()} animate-fade-in`}>
				{availableChains.map((chain, index) => {
					const isDisabled = disabledChains.includes(chain.id);
					const isLoading = loadingChain === chain.id;
					const isSelected = selectedChain === chain.id;
					const hasError = chainErrors[chain.id];

					return (
						<div
							key={chain.id}
							className="relative"
							style={{ animationDelay: `${index * 100}ms` }}
						>
							<ChainCard
								chain={chain}
								isSelected={isSelected}
								isDisabled={isDisabled}
								isLoading={isLoading}
								onClick={handleChainSelect}
								variant={variant}
								showDescription={variant !== 'compact'}
								showMetadata={variant === 'detailed'}
							/>

							{/* チェーン固有のエラー表示 */}
							{hasError && (
								<div className="absolute inset-x-0 -bottom-2 mx-2 animate-slide-up">
									<div className="bg-red-900/90 border border-red-500/50 text-red-300 text-xs p-3 rounded-sm backdrop-blur-sm">
										<div className="flex items-center justify-between">
											<div className="flex items-center space-x-2">
											
												<span>{hasError}</span>
											</div>
											<button
												onClick={() => clearChainError(chain.id)}
												className="text-red-400 hover:text-red-300 ml-2 transition-colors"
											>
												×
											</button>
										</div>
									</div>
								</div>
							)}
						</div>
					);
				})}
			</div>
		);
	};

	// 推奨情報
	const renderRecommendations = () => {
		if (variant === 'compact' || availableChains.length <= 1) return null;

		const isDevelopment = process.env.NODE_ENV === 'development';
		const recommendedChain = isDevelopment ? 'avalanche-fuji' : 'sepolia';
		const recommended = availableChains.find(chain => chain.id === recommendedChain);

		if (!recommended) return null;

		return (
			<CyberCard
				className="mt-8 bg-gradient-to-r from-neonGreen/10 to-neonOrange/10 border-neonGreen/30 animate-glow"
				showEffects={false}
			>
				<div className="flex items-start space-x-4">
					<div className="w-10 h-10 bg-gradient-to-br from-neonGreen/20 to-neonOrange/20 rounded-full flex items-center justify-center flex-shrink-0 border border-neonGreen/30">
						<Zap className="w-5 h-5 text-neonGreen" />
					</div>
					<div className="flex-1">
						<h4 className="text-white font-heading font-semibold mb-2">
							Recommended for {isDevelopment ? 'Development' : 'Testing'}
						</h4>
						<p className="text-gray-300 text-sm leading-relaxed">
							<span className="text-neonGreen font-medium">{recommended.displayName}</span>
							{' '}is recommended for {isDevelopment ? 'fast development with low fees' : 'stable testing environment'}.
							{' '}Features {recommended.metadata.averageBlockTime < 5 && 'quick block times and '}
							{recommended.metadata.gasTokenSymbol} for gas fees.
						</p>
					</div>
				</div>
			</CyberCard>
		);
	};

	// フッター情報
	const renderFooter = () => {
		if (variant === 'compact') return null;

		return (
			<div className="mt-8 pt-6 border-t border-dark-300">
				<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
					<div className="flex items-center space-x-3 text-sm text-gray-400 hover:text-gray-300 transition-colors">
						<div className="w-8 h-8 bg-neonGreen/10 rounded-full flex items-center justify-center border border-neonGreen/30">
							<Shield className="w-4 h-4 text-neonGreen" />
						</div>
						<span>All networks are testnets</span>
					</div>
					<div className="flex items-center space-x-3 text-sm text-gray-400 hover:text-gray-300 transition-colors">
						<div className="w-8 h-8 bg-blue-500/10 rounded-full flex items-center justify-center border border-blue-500/30">
							<Clock className="w-4 h-4 text-blue-400" />
						</div>
						<span>No real funds required</span>
					</div>
					<div className="flex items-center space-x-3 text-sm text-gray-400 hover:text-gray-300 transition-colors">
						<div className="w-8 h-8 bg-neonOrange/10 rounded-full flex items-center justify-center border border-neonOrange/30">
							<Zap className="w-4 h-4 text-neonOrange" />
						</div>
						<span>Free testnet tokens available</span>
					</div>
				</div>
			</div>
		);
	};

	return (
		<div className={`relative w-full ${className}`}>
			{/* 背景グリッドパターン */}
			<GridPattern size={40} opacity={0.02} animated={true} />

			{/* メインコンテンツ */}
			<div className="relative z-10">
				{/* ヘッダー */}
				{renderHeader()}

				{/* チェーンリスト */}
				{renderChainList()}

				{/* 推奨情報 */}
				{renderRecommendations()}

				{/* フッター */}
				{renderFooter()}
			</div>

			{/* グローバルローディングオーバーレイ */}
			{loading && (
				<div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center rounded-sm z-20">
					<CyberCard className="bg-dark-200 border-neonGreen/30 animate-pulse-fast">
						<div className="flex items-center space-x-4 p-2">
							<Loader2 className="w-8 h-8 text-neonGreen animate-spin" />
							<div>
								<div className="text-white font-heading font-medium">Loading Networks</div>
								<div className="text-gray-400 text-sm">Please wait...</div>
							</div>
						</div>
					</CyberCard>
				</div>
			)}

			{/* 選択アニメーション効果 */}
			{selectedChain && (
				<div className="fixed inset-0 pointer-events-none z-30">
					<div className="absolute inset-0 bg-neonGreen/5 animate-pulse" />
				</div>
			)}

			{/* カスタムアニメーション定義 */}
			<style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes glow {
          0%, 100% {
            box-shadow: 0 0 20px rgba(0, 255, 127, 0.2);
          }
          50% {
            box-shadow: 0 0 30px rgba(0, 255, 127, 0.4);
          }
        }
        
        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }
        
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
        
        .animate-glow {
          animation: glow 3s ease-in-out infinite;
        }
        
        @media (prefers-reduced-motion: reduce) {
          .animate-fade-in,
          .animate-slide-up,
          .animate-glow {
            animation: none;
          }
        }
      `}</style>
		</div>
	);
};

export default ChainSelector;
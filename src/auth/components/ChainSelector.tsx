// src/auth/components/ChainSelector.tsx
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { ChainSelectorProps, SelectableChain, SelectableChainId } from '@/types/chain-selection';
import { testnetUtils, SUPPORTED_TESTNETS } from '@/auth/config/testnet-chains';
import { ChainSelectionUtils } from '@/auth/utils/chain-utils';
import ChainCard from './ChainCard';
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
 * チェーン選択メイン画面コンポーネント
 * 複数チェーンの選択UIとメタデータ表示
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
	const [chainErrors, setChainErrors] = useState<Record<SelectableChainId, string>>();
	const [showComparison, setShowComparison] = useState(false);

	// 利用可能なチェーンをフィルタリング
	const availableChains = useMemo(() => {
		let chains = SUPPORTED_TESTNETS;

		// allowedChainsが指定されている場合はフィルタリング
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
		const baseClasses = 'grid gap-4';

		if (variant === 'compact') {
			return `${baseClasses} grid-cols-1`;
		}

		return `${baseClasses} ${columns === 1 ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'}`;
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
			<div className="flex items-center justify-between mb-4">
				<div className="flex items-center space-x-3">
					{showBackButton && onBack && (
						<button
							onClick={onBack}
							className="p-2 text-gray-400 hover:text-neonGreen transition-colors rounded-sm hover:bg-dark-200"
							aria-label="Go back"
						>
							<ArrowLeft className="w-5 h-5" />
						</button>
					)}
					<div>
						<h2 className="text-2xl font-heading font-bold text-white">
							{title}
						</h2>
						<p className="text-gray-400 text-sm mt-1">
							{description}
						</p>
					</div>
				</div>

				{/* 比較表示切り替え */}
				{availableChains.length > 1 && variant !== 'compact' && (
					<button
						onClick={() => setShowComparison(!showComparison)}
						className="flex items-center space-x-2 px-3 py-2 bg-dark-200 hover:bg-dark-300 border border-gray-600 rounded-sm text-sm text-gray-300 transition-colors"
					>
						<Info className="w-4 h-4" />
						<span>{showComparison ? 'Hide' : 'Compare'}</span>
					</button>
				)}
			</div>

			{/* エラー表示 */}
			{error && (
				<div className="mb-6 p-4 bg-red-900/30 border border-red-500/50 text-red-300 rounded-sm">
					<div className="flex items-center space-x-2">
						<AlertCircle className="w-4 h-4 flex-shrink-0" />
						<span className="text-sm">{error}</span>
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
			<div className="mb-6 bg-dark-200/50 border border-dark-300 rounded-sm overflow-hidden">
				<div className="p-4 border-b border-dark-300">
					<h3 className="text-white font-semibold flex items-center space-x-2">
						<Zap className="w-4 h-4 text-neonGreen" />
						<span>Network Comparison</span>
					</h3>
				</div>

				<div className="overflow-x-auto">
					<table className="w-full text-sm">
						<thead className="bg-dark-300">
							<tr>
								<th className="text-left p-3 text-gray-300">Network</th>
								<th className="text-left p-3 text-gray-300">Block Time</th>
								<th className="text-left p-3 text-gray-300">Confirmations</th>
								<th className="text-left p-3 text-gray-300">Features</th>
							</tr>
						</thead>
						<tbody>
							{comparisonData.map((stat, index) => {
								const chain = testnetUtils.getChainById(stat.chainId);
								return (
									<tr key={stat.chainId} className={index % 2 === 0 ? 'bg-dark-100/30' : 'bg-transparent'}>
										<td className="p-3">
											<div className="flex items-center space-x-2">
												<span className="text-lg">{chain?.icon}</span>
												<span className="text-white">{stat.name}</span>
											</div>
										</td>
										<td className="p-3 text-gray-300">~{stat.blockTime}s</td>
										<td className="p-3 text-gray-300">{stat.confirmations}</td>
										<td className="p-3 text-gray-300">{stat.features}</td>
									</tr>
								);
							})}
						</tbody>
					</table>
				</div>
			</div>
		);
	};

	// チェーンリスト
	const renderChainList = () => {
		if (loading) {
			return (
				<div className="flex items-center justify-center py-12">
					<div className="flex items-center space-x-2 text-neonGreen">
						<Loader2 className="w-6 h-6 animate-spin" />
						<span>Loading networks...</span>
					</div>
				</div>
			);
		}

		if (availableChains.length === 0) {
			return (
				<div className="text-center py-12">
					<AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
					<h3 className="text-lg font-semibold text-white mb-2">No Networks Available</h3>
					<p className="text-gray-400 text-sm">
						No supported networks found for your configuration.
					</p>
				</div>
			);
		}

		return (
			<div className={getGridClasses()}>
				{availableChains.map((chain) => {
					const isDisabled = disabledChains.includes(chain.id);
					const isLoading = loadingChain === chain.id;
					const isSelected = selectedChain === chain.id;
					const hasError = chainErrors[chain.id];

					return (
						<div key={chain.id} className="relative">
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
								<div className="absolute inset-x-0 -bottom-1 mx-2">
									<div className="bg-red-900/90 border border-red-500/50 text-red-300 text-xs p-2 rounded-sm backdrop-blur-sm">
										<div className="flex items-center justify-between">
											<span>{hasError}</span>
											<button
												onClick={() => clearChainError(chain.id)}
												className="text-red-400 hover:text-red-300 ml-2"
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
			<div className="mt-8 p-4 bg-gradient-to-r from-neonGreen/10 to-neonOrange/10 border border-neonGreen/30 rounded-sm">
				<div className="flex items-start space-x-3">
					<div className="w-8 h-8 bg-neonGreen/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
						<Zap className="w-4 h-4 text-neonGreen" />
					</div>
					<div>
						<h4 className="text-white font-semibold text-sm mb-1">
							Recommended for {isDevelopment ? 'Development' : 'Testing'}
						</h4>
						<p className="text-gray-300 text-xs leading-relaxed">
							<span className="text-neonGreen font-medium">{recommended.displayName}</span>
							{' '}is recommended for {isDevelopment ? 'fast development with low fees' : 'stable testing environment'}.
							{' '}{recommended.metadata.averageBlockTime < 5 && 'Features quick block times '}
							and {recommended.metadata.gasTokenSymbol} for gas fees.
						</p>
					</div>
				</div>
			</div>
		);
	};

	// フッター情報
	const renderFooter = () => {
		if (variant === 'compact') return null;

		return (
			<div className="mt-8 pt-6 border-t border-dark-300">
				<div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-gray-400">
					<div className="flex items-center space-x-2">
						<Shield className="w-4 h-4 text-neonGreen" />
						<span>All networks are testnets</span>
					</div>
					<div className="flex items-center space-x-2">
						<Clock className="w-4 h-4 text-neonBlue" />
						<span>No real funds required</span>
					</div>
					<div className="flex items-center space-x-2">
						<Zap className="w-4 h-4 text-neonOrange" />
						<span>Free testnet tokens available</span>
					</div>
				</div>
			</div>
		);
	};

	return (
		<div className={`chain-selector ${className}`}>
			{/* メインコンテンツ */}
			<div className="relative">
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
				<div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center rounded-sm">
					<div className="bg-dark-200 border border-neonGreen/30 rounded-sm p-6">
						<div className="flex items-center space-x-3">
							<Loader2 className="w-6 h-6 text-neonGreen animate-spin" />
							<div>
								<div className="text-white font-medium">Loading Networks</div>
								<div className="text-gray-400 text-sm">Please wait...</div>
							</div>
						</div>
					</div>
				</div>
			)}

			{/* 選択アニメーション効果 */}
			{selectedChain && (
				<div className="fixed inset-0 pointer-events-none z-50">
					<div className="absolute inset-0 bg-neonGreen/5 animate-pulse" />
				</div>
			)}
		</div>
	);
};

export default ChainSelector;
// src/auth/components/ChainCard.tsx
'use client';

import React from 'react';
import { ChainCardProps, SelectableChain } from '@/types/chain-selection';
import CyberCard from '@/app/components/common/CyberCard';
import {
	Check,
	Info,
	Clock,
	Zap,
	Shield,
	ExternalLink,
	Loader2,
	AlertTriangle
} from 'lucide-react';

/**
 * CyberCardベースの個別チェーン選択カード
 * 既存のサイバーパンクテーマとの統一性を保持
 */
export const ChainCard: React.FC<ChainCardProps> = ({
	chain,
	isSelected = false,
	isDisabled = false,
	isLoading = false,
	onClick,
	onInfoClick,
	variant = 'default',
	showDescription = true,
	showMetadata = true,
	className = '',
}) => {
	const handleClick = () => {
		if (!isDisabled && !isLoading) {
			onClick(chain);
		}
	};

	const handleInfoClick = (e: React.MouseEvent) => {
		e.stopPropagation();
		if (onInfoClick) {
			onInfoClick(chain);
		}
	};

	// バリアント別の設定
	const getVariantConfig = () => {
		switch (variant) {
			case 'compact':
				return {
					cyberVariant: 'interactive' as const,
					showMetadata: false,
					minHeight: 'min-h-[100px]',
					padding: 'p-4',
				};
			case 'detailed':
				return {
					cyberVariant: 'default' as const,
					showMetadata: true,
					minHeight: 'min-h-[200px]',
					padding: 'p-6',
				};
			default:
				return {
					cyberVariant: 'interactive' as const,
					showMetadata: showMetadata,
					minHeight: 'min-h-[160px]',
					padding: 'p-6',
				};
		}
	};

	const config = getVariantConfig();

	// 選択状態とローディング状態のスタイル
	const getCardClassName = () => {
		let classes = `
      ${config.minHeight} 
      transition-all duration-300 ease-out
      ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      ${className}
    `;

		if (isSelected) {
			classes += ` 
        border-neonGreen 
        bg-gradient-to-br from-neonGreen/10 to-neonOrange/10
        shadow-lg shadow-neonGreen/25
        scale-[1.02]
      `;
		} else if (!isDisabled) {
			classes += ` hover:border-neonGreen/50 hover:scale-[1.01]`;
		}

		return classes;
	};

	// チェーンアイコンとヘッダー情報
	const renderChainHeader = () => (
		<div className="flex items-start justify-between mb-4">
			<div className="flex items-center space-x-3">
				{/* チェーンアイコン */}
				<div
					className="w-10 h-10 rounded-sm flex items-center justify-center text-2xl border transition-all duration-300"
					style={{
						background: `linear-gradient(135deg, ${chain.colors.primary}20, ${chain.colors.secondary}20)`,
						borderColor: isSelected ? chain.colors.primary : `${chain.colors.primary}40`,
						boxShadow: isSelected ? `0 0 15px ${chain.colors.primary}40` : 'none',
					}}
				>
					{chain.icon}
				</div>

				<div>
					<h3 className="text-white font-heading font-bold text-lg">
						{chain.displayName}
					</h3>
					{variant !== 'compact' && (
						<p className="text-gray-400 text-sm">
							Chain ID: {chain.chainId}
						</p>
					)}
				</div>
			</div>

			{/* 状態インジケーター */}
			{renderStatusIndicator()}
		</div>
	);

	// 状態インジケーター
	const renderStatusIndicator = () => {
		if (isLoading) {
			return (
				<div className="flex items-center space-x-1">
					<Loader2 className="w-4 h-4 text-neonGreen animate-spin" />
					{variant === 'detailed' && (
						<span className="text-xs text-neonGreen">Connecting</span>
					)}
				</div>
			);
		}

		if (isSelected) {
			return (
				<div className="w-6 h-6 bg-neonGreen rounded-full flex items-center justify-center animate-pulse-fast">
					<Check className="w-4 h-4 text-black" />
				</div>
			);
		}

		if (!chain.isSupported) {
			return (
				<div className="flex items-center space-x-1">
					<AlertTriangle className="w-4 h-4 text-yellow-400" />
					{variant === 'detailed' && (
						<span className="text-xs text-yellow-400">Unavailable</span>
					)}
				</div>
			);
		}

		// 情報ボタン（詳細表示時のみ）
		if (onInfoClick && variant === 'detailed') {
			return (
				<button
					onClick={handleInfoClick}
					className="p-1 text-gray-400 hover:text-neonGreen transition-colors rounded-sm hover:bg-dark-200"
					title="More information"
				>
					<Info className="w-4 h-4" />
				</button>
			);
		}

		return null;
	};

	// 説明文
	const renderDescription = () => {
		if (!showDescription || variant === 'compact') return null;

		return (
			<p className="text-gray-300 text-sm mb-4 leading-relaxed">
				{chain.description}
			</p>
		);
	};

	// メタデータ（スペック情報）
	const renderMetadata = () => {
		if (!config.showMetadata) return null;

		return (
			<div className="space-y-3 mb-4">
				<div className="grid grid-cols-2 gap-3 text-xs">
					{/* ブロック時間 */}
					<div className="flex items-center justify-between p-2 bg-dark-200/50 rounded-sm border border-dark-300">
						<div className="flex items-center space-x-1 text-gray-400">
							<Clock className="w-3 h-3" />
							<span>Block Time</span>
						</div>
						<span className="text-white font-mono">~{chain.metadata.averageBlockTime}s</span>
					</div>

					{/* ガストークン */}
					<div className="flex items-center justify-between p-2 bg-dark-200/50 rounded-sm border border-dark-300">
						<div className="flex items-center space-x-1 text-gray-400">
							<Zap className="w-3 h-3" />
							<span>Gas Token</span>
						</div>
						<span className="text-white font-mono">{chain.metadata.gasTokenSymbol}</span>
					</div>
				</div>

				{/* 確認数 */}
				<div className="flex items-center justify-between text-xs p-2 bg-dark-200/30 rounded-sm">
					<div className="flex items-center space-x-1 text-gray-400">
						<Shield className="w-3 h-3" />
						<span>Required Confirmations</span>
					</div>
					<span className="text-white">{chain.metadata.confirmations}</span>
				</div>
			</div>
		);
	};

	// 機能バッジ（詳細表示時のみ）
	const renderFeatures = () => {
		if (variant !== 'detailed' || !chain.metadata.features.length) return null;

		return (
			<div className="space-y-2 mb-4">
				<div className="text-xs text-gray-400 font-medium">Key Features</div>
				<div className="flex flex-wrap gap-1">
					{chain.metadata.features.slice(0, 3).map((feature, index) => (
						<span
							key={index}
							className="px-2 py-1 bg-gradient-to-r from-neonGreen/10 to-neonOrange/10 border border-neonGreen/30 rounded-sm text-xs text-neonGreen"
						>
							{feature}
						</span>
					))}
					{chain.metadata.features.length > 3 && (
						<span className="px-2 py-1 bg-dark-300 border border-gray-600 rounded-sm text-xs text-gray-400">
							+{chain.metadata.features.length - 3} more
						</span>
					)}
				</div>
			</div>
		);
	};

	// フッター情報
	const renderFooter = () => {
		if (variant === 'compact') return null;

		return (
			<div className="flex items-center justify-between mt-auto pt-3 border-t border-dark-300">
				{/* ネットワーク状況 */}
				<div className="flex items-center space-x-2">
					<div
						className={`w-2 h-2 rounded-full ${chain.isSupported ? 'bg-neonGreen animate-pulse' : 'bg-red-400'
							}`}
					/>
					<span className="text-xs text-gray-400">
						{chain.isSupported ? 'Available' : 'Unavailable'}
					</span>
				</div>

				{/* エクスプローラーリンク */}
				{variant === 'detailed' && chain.network.blockExplorer && (
					<a
						href={chain.network.blockExplorer}
						target="_blank"
						rel="noopener noreferrer"
						onClick={(e) => e.stopPropagation()}
						className="flex items-center space-x-1 text-gray-400 hover:text-neonGreen transition-colors text-xs"
						title="View on explorer"
					>
						<ExternalLink className="w-3 h-3" />
						<span>Explorer</span>
					</a>
				)}
			</div>
		);
	};

	// メインコンテンツ
	const cardContent = (
		<div className="h-full flex flex-col relative">
			{/* ヘッダー */}
			{renderChainHeader()}

			{/* 説明文 */}
			{renderDescription()}

			{/* メタデータ */}
			{renderMetadata()}

			{/* 機能バッジ */}
			{renderFeatures()}

			{/* フッター */}
			{renderFooter()}

			{/* ローディングオーバーレイ */}
			{isLoading && (
				<div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center rounded-sm">
					<div className="flex flex-col items-center space-y-2 text-neonGreen">
						<Loader2 className="w-6 h-6 animate-spin" />
						<span className="text-sm font-medium">Connecting...</span>
					</div>
				</div>
			)}

			{/* 選択時のパルス効果 */}
			{isSelected && (
				<div className="absolute inset-0 bg-neonGreen/5 animate-pulse rounded-sm pointer-events-none" />
			)}

			{/* ホバー時のスキャンライン効果 */}
			{!isDisabled && !isLoading && (
				<div className="absolute inset-0 overflow-hidden pointer-events-none opacity-0 group-hover:opacity-30 transition-opacity duration-300">
					<div className="absolute w-full h-px bg-gradient-to-r from-transparent via-neonGreen to-transparent animate-scanline top-1/2" />
				</div>
			)}
		</div>
	);

	return (
		<div
			className="group"
			onClick={handleClick}
			role="button"
			tabIndex={isDisabled ? -1 : 0}
			onKeyDown={(e) => {
				if (e.key === 'Enter' || e.key === ' ') {
					e.preventDefault();
					handleClick();
				}
			}}
			aria-selected={isSelected}
			aria-disabled={isDisabled}
		>
			<CyberCard
				variant={config.cyberVariant}
				className={getCardClassName()}
				showEffects={!isLoading}
				glowIntensity={isSelected ? 'high' : 'medium'}
			>
				{cardContent}
			</CyberCard>
		</div>
	);
};

export default ChainCard;
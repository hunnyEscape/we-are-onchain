// src/auth/components/ChainCard.tsx
'use client';

import React from 'react';
import { ChainCardProps } from '@/types/chain-selection';
import { testnetUtils } from '@/auth/config/testnet-chains';
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
 * 個別チェーン選択カードコンポーネント
 * サイバーパンクテーマに合致したデザイン
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

	// バリアント別のスタイリング
	const getCardClasses = () => {
		const baseClasses = `
      relative cursor-pointer transition-all duration-300 rounded-sm border overflow-hidden
      ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-lg'}
      ${className}
    `;

		const variantClasses = {
			default: `
        p-6 min-h-[160px]
        ${isSelected
					? 'bg-gradient-to-br from-neonGreen/10 to-neonOrange/10 border-neonGreen'
					: 'bg-dark-200/50 border-dark-300 hover:border-neonGreen/50'
				}
      `,
			compact: `
        p-4 min-h-[100px]
        ${isSelected
					? 'bg-gradient-to-br from-neonGreen/10 to-neonOrange/10 border-neonGreen'
					: 'bg-dark-200/50 border-dark-300 hover:border-neonGreen/50'
				}
      `,
			detailed: `
        p-8 min-h-[200px]
        ${isSelected
					? 'bg-gradient-to-br from-neonGreen/10 to-neonOrange/10 border-neonGreen'
					: 'bg-dark-200/50 border-dark-300 hover:border-neonGreen/50'
				}
      `,
		};

		return `${baseClasses} ${variantClasses[variant]}`;
	};

	// チェーンの状態インジケーター
	const renderStatusIndicator = () => {
		if (isLoading) {
			return (
				<div className="absolute top-3 right-3">
					<Loader2 className="w-4 h-4 text-neonGreen animate-spin" />
				</div>
			);
		}

		if (isSelected) {
			return (
				<div className="absolute top-3 right-3">
					<div className="w-6 h-6 bg-neonGreen rounded-full flex items-center justify-center">
						<Check className="w-4 h-4 text-black" />
					</div>
				</div>
			);
		}

		if (!chain.isSupported) {
			return (
				<div className="absolute top-3 right-3">
					<AlertTriangle className="w-4 h-4 text-yellow-400" />
				</div>
			);
		}

		return null;
	};

	// チェーンアイコンとタイトル
	const renderHeader = () => (
		<div className="flex items-start justify-between mb-3">
			<div className="flex items-center space-x-3">
				{/* チェーンアイコン */}
				<div
					className="w-10 h-10 rounded-sm flex items-center justify-center text-2xl"
					style={{
						background: `linear-gradient(135deg, ${chain.colors.primary}20, ${chain.colors.secondary}20)`,
						border: `1px solid ${chain.colors.primary}40`,
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

			{/* 情報ボタン */}
			{onInfoClick && variant === 'detailed' && (
				<button
					onClick={handleInfoClick}
					className="p-1 text-gray-400 hover:text-neonGreen transition-colors"
					title="More information"
				>
					<Info className="w-4 h-4" />
				</button>
			)}
		</div>
	);

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
		if (!showMetadata || variant === 'compact') return null;

		return (
			<div className="space-y-2 mb-4">
				{/* ブロック時間 */}
				<div className="flex items-center justify-between text-xs">
					<div className="flex items-center space-x-1 text-gray-400">
						<Clock className="w-3 h-3" />
						<span>Block Time</span>
					</div>
					<span className="text-white">~{chain.metadata.averageBlockTime}s</span>
				</div>

				{/* 確認数 */}
				<div className="flex items-center justify-between text-xs">
					<div className="flex items-center space-x-1 text-gray-400">
						<Shield className="w-3 h-3" />
						<span>Confirmations</span>
					</div>
					<span className="text-white">{chain.metadata.confirmations}</span>
				</div>

				{/* ガストークン */}
				<div className="flex items-center justify-between text-xs">
					<div className="flex items-center space-x-1 text-gray-400">
						<Zap className="w-3 h-3" />
						<span>Gas Token</span>
					</div>
					<span className="text-white">{chain.metadata.gasTokenSymbol}</span>
				</div>
			</div>
		);
	};

	// 機能バッジ（詳細表示時のみ）
	const renderFeatures = () => {
		if (variant !== 'detailed' || !chain.metadata.features.length) return null;

		return (
			<div className="space-y-2">
				<div className="text-xs text-gray-400 font-medium">Features</div>
				<div className="flex flex-wrap gap-1">
					{chain.metadata.features.slice(0, 3).map((feature, index) => (
						<span
							key={index}
							className="px-2 py-1 bg-dark-300 border border-gray-600 rounded-sm text-xs text-gray-300"
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

	// ネットワーク状況インジケーター
	const renderNetworkStatus = () => {
		if (variant === 'compact') return null;

		return (
			<div className="absolute bottom-3 left-3">
				<div className="flex items-center space-x-1">
					<div
						className={`w-2 h-2 rounded-full ${chain.isSupported ? 'bg-neonGreen' : 'bg-red-400'
							}`}
					/>
					<span className="text-xs text-gray-400">
						{chain.isSupported ? 'Available' : 'Unavailable'}
					</span>
				</div>
			</div>
		);
	};

	// エクスプローラーリンク（詳細表示時のみ）
	const renderExplorerLink = () => {
		if (variant !== 'detailed' || !chain.network.blockExplorer) return null;

		return (
			<div className="absolute bottom-3 right-3">
				<a
					href={chain.network.blockExplorer}
					target="_blank"
					rel="noopener noreferrer"
					onClick={(e) => e.stopPropagation()}
					className="text-gray-400 hover:text-neonGreen transition-colors"
					title="View on explorer"
				>
					<ExternalLink className="w-4 h-4" />
				</a>
			</div>
		);
	};

	// ホバーエフェクト
	const renderHoverEffects = () => {
		if (isDisabled || isLoading) return null;

		return (
			<>
				{/* グロー効果 */}
				<div
					className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-sm blur-sm ${isSelected ? 'bg-neonGreen/20' : 'bg-neonGreen/10'
						}`}
				/>

				{/* スキャンライン効果 */}
				<div className="absolute inset-0 overflow-hidden pointer-events-none opacity-0 group-hover:opacity-30 transition-opacity duration-300">
					<div className="absolute w-full h-px bg-gradient-to-r from-transparent via-neonGreen to-transparent animate-scanline top-1/2" />
				</div>

				{/* パルス効果（選択時） */}
				{isSelected && (
					<div className="absolute inset-0 bg-neonGreen/5 animate-pulse rounded-sm" />
				)}
			</>
		);
	};

	return (
		<div
			className={`group ${getCardClasses()}`}
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
			{/* 背景エフェクト */}
			{renderHoverEffects()}

			{/* ステータスインジケーター */}
			{renderStatusIndicator()}

			{/* メインコンテンツ */}
			<div className="relative z-10">
				{/* ヘッダー */}
				{renderHeader()}

				{/* 説明文 */}
				{renderDescription()}

				{/* メタデータ */}
				{renderMetadata()}

				{/* 機能バッジ */}
				{renderFeatures()}
			</div>

			{/* フッター要素 */}
			{renderNetworkStatus()}
			{renderExplorerLink()}

			{/* ローディングオーバーレイ */}
			{isLoading && (
				<div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center rounded-sm">
					<div className="flex items-center space-x-2 text-neonGreen">
						<Loader2 className="w-5 h-5 animate-spin" />
						<span className="text-sm">Connecting...</span>
					</div>
				</div>
			)}

			{/* 選択時のボーダー強調 */}
			{isSelected && (
				<div
					className="absolute inset-0 rounded-sm pointer-events-none"
					style={{
						boxShadow: `0 0 0 2px ${chain.colors.primary}40, 0 0 20px ${chain.colors.primary}20`,
					}}
				/>
			)}
		</div>
	);
};

export default ChainCard;
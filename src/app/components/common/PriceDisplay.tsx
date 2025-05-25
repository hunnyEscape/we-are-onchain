// src/components/common/PriceDisplay.tsx
'use client';

import React from 'react';
import { RefreshCw, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';
import { usePriceConverter } from '@/hooks/usePriceConverter';
import { PriceDisplayProps } from '../../../../types/dashboard';

export const PriceDisplay: React.FC<PriceDisplayProps> = ({
	usdAmount,
	selectedCurrency,
	showBoth = true,
	showChange = false,
	size = 'md',
	className = ''
}) => {
	const {
		convertUSDTo,
		formatCryptoPrice,
		formatUSDPrice,
		isLoading,
		error,
		exchangeRates
	} = usePriceConverter();

	const cryptoAmount = convertUSDTo(usdAmount, selectedCurrency);
	const hasError = error !== null;

	// Size classes
	const sizeClasses = {
		sm: {
			primary: 'text-sm',
			secondary: 'text-xs',
			icon: 'w-3 h-3'
		},
		md: {
			primary: 'text-base font-semibold',
			secondary: 'text-sm',
			icon: 'w-4 h-4'
		},
		lg: {
			primary: 'text-lg font-bold',
			secondary: 'text-base',
			icon: 'w-5 h-5'
		}
	};

	const classes = sizeClasses[size];

	// Mock price change data (in real implementation, this would come from the price hook)
	const getPriceChange = (currency: string) => {
		// This would be real data from the prices hook
		const mockChanges: Record<string, number> = {
			BTC: 2.34,
			ETH: -1.89,
			SOL: 5.67,
			AVAX: -2.23,
			SUI: 8.12
		};
		return mockChanges[currency] || 0;
	};

	const priceChange = showChange ? getPriceChange(selectedCurrency) : 0;
	const isPositiveChange = priceChange >= 0;

	return (
		<div className={`space-y-1 ${className}`}>
			{/* USD Price */}
			<div className={`text-white ${classes.primary}`}>
				{formatUSDPrice(usdAmount)}
			</div>

			{/* Crypto Price */}
			{showBoth && (
				<div className="flex items-center space-x-2">
					<div className={`${hasError ? 'text-red-400' : 'text-gray-400'} ${classes.secondary} flex items-center space-x-1`}>
						{isLoading ? (
							<>
								<RefreshCw className={`${classes.icon} animate-spin`} />
								<span>Loading...</span>
							</>
						) : hasError ? (
							<>
								<AlertTriangle className={`${classes.icon} text-red-400`} />
								<span>Unavailable</span>
							</>
						) : (
							<span>≈ {formatCryptoPrice(cryptoAmount, selectedCurrency)}</span>
						)}
					</div>

					{/* Price Change Indicator */}
					{showChange && !isLoading && !hasError && (
						<div className={`flex items-center space-x-1 ${classes.secondary} ${
							isPositiveChange ? 'text-green-400' : 'text-red-400'
						}`}>
							{isPositiveChange ? (
								<TrendingUp className={classes.icon} />
							) : (
								<TrendingDown className={classes.icon} />
							)}
							<span>
								{isPositiveChange ? '+' : ''}{priceChange.toFixed(2)}%
							</span>
						</div>
					)}
				</div>
			)}
		</div>
	);
};

export default PriceDisplay;
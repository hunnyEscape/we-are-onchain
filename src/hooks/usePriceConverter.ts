// hooks/usePriceConverter.ts
'use client';

import { useMemo, useCallback } from 'react';
import { useCryptoPrices } from './useCryptoPrices';
import {
	SUPPORTED_CRYPTOS,
	SupportedCryptoSymbol,
	PriceConversionResult,
	CRYPTO_DEFAULTS
} from '@/types/crypto';

interface UsePriceConverterReturn {
	convertUSDTo: (usdAmount: number, targetCurrency: string) => number;
	formatCryptoPrice: (amount: number, currency: string) => string;
	formatUSDPrice: (amount: number) => string;
	getConversionDetails: (usdAmount: number, targetCurrency: string) => PriceConversionResult | null;
	isSupported: (currency: string) => boolean;
	getSupportedCurrencies: () => string[];
	isLoading: boolean;
	error: string | null;
	lastUpdated: Date | null;
	exchangeRates: Record<string, number>;
}

export function usePriceConverter(): UsePriceConverterReturn {
	const { prices, loading, error, lastUpdated } = useCryptoPrices();

	// Memoized exchange rates for performance
	const exchangeRates = useMemo(() => {
		const rates: Record<string, number> = {};

		Object.entries(prices).forEach(([symbol, priceData]) => {
			if (priceData.price_usd > 0) {
				rates[symbol] = priceData.price_usd;
			}
		});

		return rates;
	}, [prices]);

	// Check if currency is supported
	const isSupported = useCallback((currency: string): boolean => {
		return Object.keys(SUPPORTED_CRYPTOS).includes(currency.toUpperCase());
	}, []);

	// Get list of supported currencies
	const getSupportedCurrencies = useCallback((): string[] => {
		return Object.keys(SUPPORTED_CRYPTOS);
	}, []);

	// Convert USD amount to cryptocurrency
	const convertUSDTo = useCallback((usdAmount: number, targetCurrency: string | null): number => {
		if (!usdAmount || usdAmount <= 0) return 0;
		if (!targetCurrency) return 0; // null チェックを追加

		const currencyUpper = targetCurrency.toUpperCase();

		if (!isSupported(currencyUpper)) {
			console.warn(`Currency ${currencyUpper} is not supported`);
			return 0;
		}

		const exchangeRate = exchangeRates[currencyUpper];

		if (!exchangeRate || exchangeRate <= 0) {
			console.warn(`No exchange rate available for ${currencyUpper}`);
			return 0;
		}

		const convertedAmount = usdAmount / exchangeRate;

		// Round to appropriate decimal places
		const decimals = CRYPTO_DEFAULTS.DECIMAL_PLACES[currencyUpper as keyof typeof CRYPTO_DEFAULTS.DECIMAL_PLACES] || 4;
		return Number(convertedAmount.toFixed(decimals));
	}, [exchangeRates, isSupported]);

	// Get detailed conversion information
	const getConversionDetails = useCallback((
		usdAmount: number,
		targetCurrency: string
	): PriceConversionResult | null => {
		if (!usdAmount || usdAmount <= 0) return null;

		const currencyUpper = targetCurrency.toUpperCase();

		if (!isSupported(currencyUpper)) return null;

		const exchangeRate = exchangeRates[currencyUpper];

		if (!exchangeRate || exchangeRate <= 0) return null;

		const convertedAmount = convertUSDTo(usdAmount, currencyUpper);

		return {
			originalAmount: usdAmount,
			originalCurrency: 'USD',
			convertedAmount,
			targetCurrency: currencyUpper,
			exchangeRate,
			lastUpdated: lastUpdated || new Date()
		};
	}, [convertUSDTo, exchangeRates, isSupported, lastUpdated]);

	// Format cryptocurrency amount with appropriate precision and symbol
	const formatCryptoPrice = useCallback((amount: number, currency: string | null): string => {
		if (!amount || amount <= 0) return '0';
		if (!currency) return '0'; // null チェックを追加

		const currencyUpper = currency.toUpperCase() as SupportedCryptoSymbol;

		if (!isSupported(currencyUpper)) return amount.toString();

		const cryptoConfig = SUPPORTED_CRYPTOS[currencyUpper];
		const decimals = cryptoConfig.decimals;
		const symbol = cryptoConfig.symbol;

		// Format with appropriate decimal places
		const formattedAmount = amount.toFixed(decimals);

		// Remove trailing zeros for cleaner display
		const cleanAmount = parseFloat(formattedAmount).toString();

		return `${cleanAmount} ${symbol}`;
	}, [isSupported]);

	// Format USD amount
	const formatUSDPrice = useCallback((amount: number): string => {
		if (!amount || amount <= 0) return '$0.00';

		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD',
			minimumFractionDigits: 2,
			maximumFractionDigits: 2
		}).format(amount);
	}, []);

	// Determine loading state and error message
	const isLoading = loading;
	const errorMessage = error ? error.message : null;

	return {
		convertUSDTo,
		formatCryptoPrice,
		formatUSDPrice,
		getConversionDetails,
		isSupported,
		getSupportedCurrencies,
		isLoading,
		error: errorMessage,
		lastUpdated,
		exchangeRates
	};
}
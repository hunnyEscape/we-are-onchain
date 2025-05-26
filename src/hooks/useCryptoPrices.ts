// hooks/useCryptoPrices.ts
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { collection, onSnapshot, query, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
	CryptoPricesMap,
	CryptoPriceData,
	FirestoreCryptoPriceData,
	CryptoError,
	CryptoLoadingState,
	CRYPTO_DEFAULTS,
	SUPPORTED_CRYPTOS
} from '@/types/crypto';

interface UseCryptoPricesOptions {
	enableRealtime?: boolean;
	staleDataThreshold?: number;
	maxRetries?: number;
}

interface UseCryptoPricesReturn {
	prices: CryptoPricesMap;
	loading: boolean;
	error: CryptoError | null;
	lastUpdated: Date | null;
	isStale: boolean;
	refreshPrices: () => void;
	retryCount: number;
}

export function useCryptoPrices(options: UseCryptoPricesOptions = {}): UseCryptoPricesReturn {
	const {
		enableRealtime = true,
		staleDataThreshold = CRYPTO_DEFAULTS.STALE_DATA_THRESHOLD,
		maxRetries = CRYPTO_DEFAULTS.MAX_RETRIES
	} = options;

	// State management
	const [prices, setPrices] = useState<CryptoPricesMap>({});
	const [loadingState, setLoadingState] = useState<CryptoLoadingState>({
		isLoading: true,
		isRefreshing: false,
		lastFetch: null,
		retryCount: 0,
		maxRetries
	});
	const [error, setError] = useState<CryptoError | null>(null);
	const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

	// Refs for cleanup and avoiding memory leaks
	const unsubscribeRef = useRef<(() => void) | null>(null);
	const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

	// Convert Firestore data to frontend format
	const convertFirestoreData = useCallback((firestoreData: FirestoreCryptoPriceData): CryptoPriceData => {
		return {
			id: firestoreData.id,
			symbol: firestoreData.symbol,
			name: firestoreData.name,
			price_usd: firestoreData.price_usd,
			price_change_24h: firestoreData.price_change_24h,
			price_change_percentage_24h: firestoreData.price_change_percentage_24h,
			market_cap_usd: firestoreData.market_cap_usd,
			volume_24h_usd: firestoreData.volume_24h_usd,
			last_updated: firestoreData.last_updated instanceof Timestamp 
				? firestoreData.last_updated.toDate() 
				: new Date(firestoreData.last_updated as any),
			source: firestoreData.source
		};
	}, []);

	// Check if data is stale
	const isStale = useCallback((dataTimestamp: Date): boolean => {
		const now = new Date();
		const timeDiff = now.getTime() - dataTimestamp.getTime();
		return timeDiff > staleDataThreshold;
	}, [staleDataThreshold]);

	// Create error object
	const createError = useCallback((code: CryptoError['code'], message: string, details?: any): CryptoError => {
		return {
			code,
			message,
			details,
			timestamp: new Date()
		};
	}, []);

	// Setup Firestore listener
	const setupFirestoreListener = useCallback(() => {
		try {
			setLoadingState(prev => ({ ...prev, isLoading: true }));
			setError(null);

			const cryptoPricesQuery = query(collection(db, 'crypto_prices'));

			const unsubscribe = onSnapshot(
				cryptoPricesQuery,
				(snapshot) => {
					try {
						const newPrices: CryptoPricesMap = {};
						let mostRecentUpdate: Date | null = null;

						snapshot.docs.forEach((doc) => {
							const data = { id: doc.id, ...doc.data() } as FirestoreCryptoPriceData;
							
							// Only process supported cryptocurrencies
							if (Object.keys(SUPPORTED_CRYPTOS).includes(data.symbol)) {
								const convertedData = convertFirestoreData(data);
								newPrices[data.symbol] = convertedData;

								// Track most recent update
								if (!mostRecentUpdate || convertedData.last_updated > mostRecentUpdate) {
									mostRecentUpdate = convertedData.last_updated;
								}
							}
						});

						// Update state
						setPrices(newPrices);
						setLastUpdated(mostRecentUpdate);
						setLoadingState(prev => ({
							...prev,
							isLoading: false,
							isRefreshing: false,
							lastFetch: new Date(),
							retryCount: 0
						}));

						console.log('📊 Crypto prices updated:', Object.keys(newPrices));
					} catch (processingError) {
						console.error('Error processing crypto price data:', processingError);
						const error = createError(
							'fetch-failed',
							'Failed to process price data',
							processingError
						);
						setError(error);
						setLoadingState(prev => ({ ...prev, isLoading: false, isRefreshing: false }));
					}
				},
				(firestoreError) => {
					console.error('Firestore subscription error:', firestoreError);
					const error = createError(
						'network-error',
						'Failed to connect to price data',
						firestoreError
					);
					setError(error);
					setLoadingState(prev => ({
						...prev,
						isLoading: false,
						isRefreshing: false,
						retryCount: prev.retryCount + 1
					}));

					// Auto-retry logic
					if (loadingState.retryCount < maxRetries) {
						console.log(`🔄 Retrying crypto prices fetch (${loadingState.retryCount + 1}/${maxRetries})`);
						retryTimeoutRef.current = setTimeout(() => {
							setupFirestoreListener();
						}, Math.pow(2, loadingState.retryCount) * 1000); // Exponential backoff
					}
				}
			);

			unsubscribeRef.current = unsubscribe;
		} catch (setupError) {
			console.error('Error setting up Firestore listener:', setupError);
			const error = createError(
				'fetch-failed',
				'Failed to setup price data connection',
				setupError
			);
			setError(error);
			setLoadingState(prev => ({ ...prev, isLoading: false }));
		}
	}, [convertFirestoreData, createError, loadingState.retryCount, maxRetries]);

	// Manual refresh function
	const refreshPrices = useCallback(() => {
		console.log('🔄 Manual refresh triggered');
		setLoadingState(prev => ({ ...prev, isRefreshing: true, retryCount: 0 }));
		
		// Clean up existing listener
		if (unsubscribeRef.current) {
			unsubscribeRef.current();
			unsubscribeRef.current = null;
		}

		// Setup new listener
		setupFirestoreListener();
	}, [setupFirestoreListener]);

	// Initialize listener on mount
	useEffect(() => {
		if (enableRealtime) {
			setupFirestoreListener();
		}

		// Cleanup on unmount
		return () => {
			if (unsubscribeRef.current) {
				unsubscribeRef.current();
				unsubscribeRef.current = null;
			}
			if (retryTimeoutRef.current) {
				clearTimeout(retryTimeoutRef.current);
				retryTimeoutRef.current = null;
			}
		};
	}, [enableRealtime, setupFirestoreListener]);

	// Check for stale data
	const dataIsStale = lastUpdated ? isStale(lastUpdated) : false;

	return {
		prices,
		loading: loadingState.isLoading,
		error,
		lastUpdated,
		isStale: dataIsStale,
		refreshPrices,
		retryCount: loadingState.retryCount
	};
}
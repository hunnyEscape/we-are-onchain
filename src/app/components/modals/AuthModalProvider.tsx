// src/components/modals/AuthModalProvider.tsx
'use client';

import React from 'react';
import { useAuthModal } from '@/contexts/AuthModalContext';
import { ExtendedAuthModal } from '@/auth/components/AuthModal';
import { useUnifiedAuth } from '@/auth/contexts/UnifiedAuthContext';
import { handleAsyncOperation, parseGeneralError } from '@/utils/errorHandling';
import { ExtendedFirestoreUser } from '@/types/user-extended';

/**
 * グローバル認証モーダルプロバイダー
 * アプリケーション全体で単一のモーダルインスタンスを管理
 */
export const AuthModalProvider = () => {
	const {
		isOpen,
		modalOptions,
		closeAuthModal,
		_debug
	} = useAuthModal();

	const {
		isAuthenticated,
		extendedUser,
		error: authError
	} = useUnifiedAuth();

	// グローバルモーダルのコンテキストから内部ハンドラーを取得
	const context = useAuthModal() as any;
	const handleSuccess = context._internal?.handleSuccess;
	const handleError = context._internal?.handleError;

	// 認証成功の監視
	React.useEffect(() => {
		if (isAuthenticated && extendedUser && isOpen && handleSuccess) {
			console.log('🎉 Global AuthModal: Authentication success detected');

			// 成功ハンドラーを実行
			handleSuccess(extendedUser);
		}
	}, [isAuthenticated, extendedUser, isOpen, handleSuccess]);

	// 認証エラーの監視
	React.useEffect(() => {
		if (authError && isOpen && handleError) {
			console.error('❌ Global AuthModal: Authentication error detected:', authError);

			// エラーを統一フォーマットに変換
			const appError = parseGeneralError(new Error(authError), 'wallet-authentication');
			handleError(appError);
		}
	}, [authError, isOpen, handleError]);

	// モーダルが開いているときのログ
	React.useEffect(() => {
		if (isOpen) {
			console.log('🔓 Global AuthModal rendered:', {
				preferredChain: modalOptions.preferredChain,
				title: modalOptions.title,
				autoClose: modalOptions.autoClose,
				debugInfo: _debug
			});
		}
	}, [isOpen, modalOptions, _debug]);

	// モーダルが閉じられていれば何も表示しない
	if (!isOpen) {
		return null;
	}

	return (
		<div className="fixed inset-0 z-[100]">
			<ExtendedAuthModal
				isOpen={isOpen}
				onClose={closeAuthModal}
				preferredChain={modalOptions.preferredChain || 'evm'}
			/>
		</div>
	);
};

/**
 * グローバル認証モーダルのルートコンポーネント
 * layout.tsxで使用するためのラッパー
 */
export const GlobalAuthModal = () => {
	return (
		<>
			<AuthModalProvider />
			{/* デバッグ情報表示（開発環境のみ） */}
			{process.env.NODE_ENV === 'development' && (
				<AuthModalDebugInfo />
			)}
		</>
	);
};

/**
 * デバッグ情報表示コンポーネント
 */
const AuthModalDebugInfo = () => {
	const { isOpen, modalOptions, _debug } = useAuthModal();
	const { isAuthenticated, isLoading, walletAddress } = useUnifiedAuth();

	return (
		<div className="fixed bottom-4 left-4 p-3 bg-black/90 border border-purple-500/30 rounded-sm text-xs text-white z-[100] max-w-sm">
			<div className="font-bold text-purple-400 mb-2">🔐 Global AuthModal Debug</div>

			{/* モーダル状態 */}
			<div className="space-y-1 mb-3">
				<div className="flex justify-between">
					<span>Modal Status:</span>
					<span className={isOpen ? 'text-green-400' : 'text-gray-400'}>
						{isOpen ? 'Open' : 'Closed'}
					</span>
				</div>
				<div className="flex justify-between">
					<span>Auth Status:</span>
					<span className={isAuthenticated ? 'text-green-400' : 'text-gray-400'}>
						{isLoading ? 'Loading...' : isAuthenticated ? 'Authenticated' : 'Not Auth'}
					</span>
				</div>
				<div className="flex justify-between">
					<span>Total Opens:</span>
					<span className="text-white">{_debug.openCount}</span>
				</div>
			</div>

			{/* モーダルオプション */}
			{isOpen && (
				<div className="mb-3 p-2 bg-purple-900/30 rounded">
					<div className="text-purple-300 mb-1">Current Options:</div>
					<div className="text-xs space-y-1">
						<div>Chain: {modalOptions.preferredChain}</div>
						<div>Title: {modalOptions.title || 'Default'}</div>
						<div>Auto Close: {modalOptions.autoClose ? 'Yes' : 'No'}</div>
						<div>Chain Selector: {modalOptions.showChainSelector ? 'Yes' : 'No'}</div>
					</div>
				</div>
			)}

			{/* 認証情報 */}
			{isAuthenticated && walletAddress && (
				<div className="mb-3 p-2 bg-green-900/30 rounded">
					<div className="text-green-300 mb-1">Authenticated:</div>
					<div className="text-xs font-mono">
						{walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
					</div>
				</div>
			)}

			{/* タイムスタンプ */}
			<div className="text-xs text-gray-400 space-y-1">
				{_debug.lastOpened && (
					<div>Last Opened: {_debug.lastOpened.toLocaleTimeString()}</div>
				)}
				{_debug.lastClosed && (
					<div>Last Closed: {_debug.lastClosed.toLocaleTimeString()}</div>
				)}
			</div>

			{/* コールバック情報 */}
			{isOpen && (
				<div className="mt-2 text-xs text-gray-400">
					<div>Callbacks:</div>
					<div>Success: {modalOptions.onSuccess ? '✅' : '❌'}</div>
					<div>Error: {modalOptions.onError ? '✅' : '❌'}</div>
					{modalOptions.redirectAfterSuccess && (
						<div>Redirect: {modalOptions.redirectAfterSuccess}</div>
					)}
				</div>
			)}
		</div>
	);
};

/**
 * モーダル統計情報を提供するhook（デバッグ用）
 */
export const useAuthModalStats = () => {
	const { _debug } = useAuthModal();
	const { isAuthenticated } = useUnifiedAuth();

	return {
		totalOpens: _debug.openCount,
		lastOpened: _debug.lastOpened,
		lastClosed: _debug.lastClosed,
		isCurrentlyAuthenticated: isAuthenticated,
		timeSinceLastOpen: _debug.lastOpened
			? Date.now() - _debug.lastOpened.getTime()
			: null,
		timeSinceLastClose: _debug.lastClosed
			? Date.now() - _debug.lastClosed.getTime()
			: null,
	};
};

/**
 * モーダルの使用状況を監視するhook（分析用）
 */
export const useAuthModalAnalytics = () => {
	const stats = useAuthModalStats();
	const { isOpen } = useAuthModal();

	// 使用パターンの分析
	const getUsagePattern = () => {
		if (stats.totalOpens === 0) return 'unused';
		if (stats.totalOpens === 1) return 'first-time';
		if (stats.totalOpens <= 5) return 'occasional';
		if (stats.totalOpens <= 10) return 'regular';
		return 'frequent';
	};

	// セッション時間の計算
	const getCurrentSessionDuration = () => {
		if (!isOpen || !stats.lastOpened) return 0;
		return Date.now() - stats.lastOpened.getTime();
	};

	return {
		...stats,
		usagePattern: getUsagePattern(),
		currentSessionDuration: getCurrentSessionDuration(),
		averageSessionsPerHour: stats.totalOpens /
			((Date.now() - (stats.lastOpened?.getTime() || Date.now())) / (1000 * 60 * 60)),
	};
};

export default AuthModalProvider;
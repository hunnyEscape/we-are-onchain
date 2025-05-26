// src/contexts/AuthModalContext.tsx
'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { ChainType } from '@/types/wallet';
import { ExtendedFirestoreUser } from '@/types/user-extended';
import { AppError } from '@/utils/errorHandling';

/**
 * 認証モーダルのオプション設定
 */
export interface AuthModalOptions {
	preferredChain?: ChainType;
	onSuccess?: (user: ExtendedFirestoreUser) => void;
	onError?: (error: AppError) => void;
	title?: string;
	redirectAfterSuccess?: string;
	autoClose?: boolean; // 成功時の自動クローズ
	showChainSelector?: boolean; // チェーン選択の表示
}

/**
 * 認証モーダルのコンテキスト型
 */
export interface AuthModalContextType {
	// 基本状態
	isOpen: boolean;
	modalOptions: AuthModalOptions;

	// 操作
	openAuthModal: (options?: AuthModalOptions) => void;
	closeAuthModal: () => void;
	updateModalOptions: (options: Partial<AuthModalOptions>) => void;

	// 内部状態（デバッグ用）
	_debug: {
		openCount: number;
		lastOpened: Date | null;
		lastClosed: Date | null;
	};
}

/**
 * デフォルトのモーダルオプション
 */
const DEFAULT_MODAL_OPTIONS: AuthModalOptions = {
	preferredChain: 'evm',
	autoClose: true,
	showChainSelector: true,
	title: 'Connect Wallet',
};

/**
 * AuthModalContextの作成
 */
const AuthModalContext = createContext<AuthModalContextType | undefined>(undefined);

/**
 * AuthModalProviderのプロパティ
 */
interface AuthModalProviderProps {
	children: React.ReactNode;
	defaultOptions?: Partial<AuthModalOptions>;
}

/**
 * グローバル認証モーダル管理プロバイダー
 */
export const AuthModalProvider = ({
	children,
	defaultOptions = {}
}: AuthModalProviderProps) => {
	// 基本状態
	const [isOpen, setIsOpen] = useState(false);
	const [modalOptions, setModalOptions] = useState<AuthModalOptions>({
		...DEFAULT_MODAL_OPTIONS,
		...defaultOptions
	});

	// デバッグ情報
	const [debugInfo, setDebugInfo] = useState({
		openCount: 0,
		lastOpened: null as Date | null,
		lastClosed: null as Date | null,
	});

	// モーダルを開く
	const openAuthModal = useCallback((options: AuthModalOptions = {}) => {
		const mergedOptions = {
			...DEFAULT_MODAL_OPTIONS,
			...defaultOptions,
			...options
		};

		setModalOptions(mergedOptions);
		setIsOpen(true);

		// デバッグ情報更新
		setDebugInfo(prev => ({
			...prev,
			openCount: prev.openCount + 1,
			lastOpened: new Date()
		}));

		console.log('🔓 AuthModal opened with options:', mergedOptions);
	}, [defaultOptions]);

	// モーダルを閉じる
	const closeAuthModal = useCallback(() => {
		setIsOpen(false);

		// デバッグ情報更新
		setDebugInfo(prev => ({
			...prev,
			lastClosed: new Date()
		}));

		console.log('🔒 AuthModal closed');

		// クローズ後のクリーンアップ（オプションリセット）
		setTimeout(() => {
			setModalOptions({
				...DEFAULT_MODAL_OPTIONS,
				...defaultOptions
			});
		}, 300); // アニメーション完了後
	}, [defaultOptions]);

	// モーダルオプションを更新
	const updateModalOptions = useCallback((options: Partial<AuthModalOptions>) => {
		setModalOptions(prev => ({
			...prev,
			...options
		}));

		console.log('⚙️ AuthModal options updated:', options);
	}, []);

	// 外部からのイベントリスニング（後方互換性）
	useEffect(() => {
		const handleOpenAuthModal = (event: Event) => {
			const customEvent = event as CustomEvent;
			const eventOptions = customEvent.detail || {};

			console.log('📡 Received openAuthModal event:', eventOptions);
			openAuthModal(eventOptions);
		};

		const handleCloseAuthModal = () => {
			console.log('📡 Received closeAuthModal event');
			closeAuthModal();
		};

		// カスタムイベントリスナーを追加
		window.addEventListener('openAuthModal', handleOpenAuthModal);
		window.addEventListener('closeAuthModal', handleCloseAuthModal);

		return () => {
			window.removeEventListener('openAuthModal', handleOpenAuthModal);
			window.removeEventListener('closeAuthModal', handleCloseAuthModal);
		};
	}, [openAuthModal, closeAuthModal]);

	// ESCキーでモーダルを閉じる
	useEffect(() => {
		const handleEscKey = (event: KeyboardEvent) => {
			if (event.key === 'Escape' && isOpen) {
				closeAuthModal();
			}
		};

		if (isOpen) {
			document.addEventListener('keydown', handleEscKey);
			// ボディスクロールを無効化
			document.body.style.overflow = 'hidden';
		} else {
			// ボディスクロールを復元
			document.body.style.overflow = '';
		}

		return () => {
			document.removeEventListener('keydown', handleEscKey);
			document.body.style.overflow = '';
		};
	}, [isOpen, closeAuthModal]);

	// 成功/エラー時のコールバックハンドラー
	const handleSuccess = useCallback((user: ExtendedFirestoreUser) => {
		console.log('✅ AuthModal success:', user.walletAddress);

		// 成功コールバックを実行
		if (modalOptions.onSuccess) {
			modalOptions.onSuccess(user);
		}

		// リダイレクト処理
		if (modalOptions.redirectAfterSuccess) {
			setTimeout(() => {
				window.location.href = modalOptions.redirectAfterSuccess!;
			}, 1000);
		}

		// 自動クローズ
		if (modalOptions.autoClose !== false) {
			setTimeout(() => {
				closeAuthModal();
			}, 2000);
		}
	}, [modalOptions, closeAuthModal]);

	const handleError = useCallback((error: AppError) => {
		console.error('❌ AuthModal error:', error);

		// エラーコールバックを実行
		if (modalOptions.onError) {
			modalOptions.onError(error);
		}

		// エラー時は自動クローズしない（ユーザーがリトライできるように）
	}, [modalOptions]);

	// コンテキスト値
	const contextValue: AuthModalContextType = {
		// 基本状態
		isOpen,
		modalOptions,

		// 操作
		openAuthModal,
		closeAuthModal,
		updateModalOptions,

		// デバッグ情報
		_debug: debugInfo,
	};

	// 成功/エラーハンドラーをコンテキストに注入
	const extendedContextValue = {
		...contextValue,
		_internal: {
			handleSuccess,
			handleError,
		},
	};

	return (
		<AuthModalContext.Provider value={extendedContextValue as AuthModalContextType}>
			{children}
		</AuthModalContext.Provider>
	);
};

/**
 * AuthModalContextを使用するhook
 */
export const useAuthModal = (): AuthModalContextType => {
	const context = useContext(AuthModalContext);
	if (!context) {
		throw new Error('useAuthModal must be used within AuthModalProvider');
	}
	return context;
};

/**
 * モーダル状態のみを取得する軽量hook
 */
export const useAuthModalState = () => {
	const { isOpen, modalOptions } = useAuthModal();
	return { isOpen, modalOptions };
};

/**
 * モーダル操作のみを取得するhook
 */
export const useAuthModalActions = () => {
	const { openAuthModal, closeAuthModal, updateModalOptions } = useAuthModal();
	return { openAuthModal, closeAuthModal, updateModalOptions };
};

/**
 * 特定の設定でモーダルを開くヘルパーhook
 */
export const useAuthModalHelpers = () => {
	const { openAuthModal } = useAuthModal();

	const openWalletConnect = useCallback((onSuccess?: (user: ExtendedFirestoreUser) => void) => {
		openAuthModal({
			title: 'Connect Wallet',
			preferredChain: 'evm',
			onSuccess,
			autoClose: true,
		});
	}, [openAuthModal]);

	const openWalletAuth = useCallback((onSuccess?: (user: ExtendedFirestoreUser) => void) => {
		openAuthModal({
			title: 'Authenticate Wallet',
			preferredChain: 'evm',
			onSuccess,
			autoClose: true,
		});
	}, [openAuthModal]);

	const openProfileSetup = useCallback((onSuccess?: (user: ExtendedFirestoreUser) => void) => {
		openAuthModal({
			title: 'Complete Your Profile',
			preferredChain: 'evm',
			onSuccess,
			autoClose: false, // プロフィール設定時は手動クローズ
		});
	}, [openAuthModal]);

	return {
		openWalletConnect,
		openWalletAuth,
		openProfileSetup,
	};
};

/**
 * デバッグ情報を表示するコンポーネント（開発環境のみ）
 */
export const AuthModalDebugInfo = () => {
	const { isOpen, modalOptions, _debug } = useAuthModal();

	if (process.env.NODE_ENV !== 'development') {
		return null;
	}

	return (
		<div className="fixed bottom-4 left-4 p-3 bg-black/90 border border-purple-500/30 rounded-sm text-xs text-white z-[90] max-w-xs">
			<div className="font-bold text-purple-400 mb-2">🔐 AuthModal Debug</div>

			<div className="space-y-1 mb-3">
				<div className="flex justify-between">
					<span>Status:</span>
					<span className={isOpen ? 'text-green-400' : 'text-gray-400'}>
						{isOpen ? 'Open' : 'Closed'}
					</span>
				</div>
				<div className="flex justify-between">
					<span>Opens:</span>
					<span className="text-white">{_debug.openCount}</span>
				</div>
				<div className="flex justify-between">
					<span>Chain:</span>
					<span className="text-purple-300">{modalOptions.preferredChain}</span>
				</div>
				<div className="flex justify-between">
					<span>Auto Close:</span>
					<span className={modalOptions.autoClose ? 'text-green-400' : 'text-red-400'}>
						{modalOptions.autoClose ? 'Yes' : 'No'}
					</span>
				</div>
			</div>

			{modalOptions.title && (
				<div className="mb-3">
					<div className="text-gray-400 mb-1">Title:</div>
					<div className="text-purple-300 text-xs">{modalOptions.title}</div>
				</div>
			)}

			{_debug.lastOpened && (
				<div className="text-xs text-gray-400">
					Last opened: {_debug.lastOpened.toLocaleTimeString()}
				</div>
			)}
		</div>
	);
};
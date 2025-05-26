// src/contexts/AuthModalContext.tsx
'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { ChainType } from '@/types/wallet';
import { ExtendedFirestoreUser } from '@/types/user-extended';
import { AppError } from '@/utils/errorHandling';
import { SelectableChainId, SelectableChain } from '@/types/chain-selection';
import { testnetUtils } from '@/auth/config/testnet-chains';

/**
 * 認証モーダルの拡張オプション設定（既存との完全互換性）
 */
export interface AuthModalOptions {
	// 既存のオプション（完全互換性）
	preferredChain?: ChainType;
	onSuccess?: (user: ExtendedFirestoreUser) => void;
	onError?: (error: AppError) => void;
	title?: string;
	redirectAfterSuccess?: string;
	autoClose?: boolean; // 成功時の自動クローズ
	showChainSelector?: boolean; // チェーン選択の表示

	// ★ 新規追加: チェーン選択の詳細設定（オプショナル）
	chainSelection?: {
		availableChains?: SelectableChainId[];
		defaultChain?: SelectableChainId;
		variant?: 'default' | 'compact' | 'detailed';
		columns?: 1 | 2;
		allowChainSwitch?: boolean;
		requireChainSwitch?: boolean;
		preset?: string;
		customTitle?: string;
		customDescription?: string;
		onChainSelect?: (chainId: SelectableChainId) => void;
		onChainSwitchStart?: (chainId: SelectableChainId) => void;
		onChainSwitchComplete?: (chainId: SelectableChainId) => void;
		onChainSwitchError?: (error: string, chainId: SelectableChainId) => void;
	};

	// ★ 新規追加: ステップ管理（オプショナル）
	step?: {
		initialStep?: 'chain-select' | 'wallet-connect' | 'wallet-sign';
		skipChainSelection?: boolean;
		skipWalletConnection?: boolean;
		allowStepBack?: boolean;
		showStepProgress?: boolean;
		stepTitles?: {
			chainSelect?: string;
			walletConnect?: string;
			walletSign?: string;
			success?: string;
			error?: string;
		};
	};
}

/**
 * ★ 新規追加: 認証フロー状態
 */
export type AuthStep = 'chain-select' | 'wallet-connect' | 'wallet-sign' | 'success' | 'error';

export interface AuthFlowState {
	currentStep: AuthStep;
	progress: number;
	signatureRequired: boolean;
	verificationRequired: boolean;

	chainSelection?: {
		selectedChain: SelectableChainId | null;
		availableChains: SelectableChainId[];
		isSwitching: boolean;
		switchProgress: number;
		switchError: string | null;
		selectionHistory: Array<{
			chainId: SelectableChainId;
			timestamp: Date;
			success: boolean;
		}>;
	};

	stepManagement?: {
		visitedSteps: AuthStep[];
		canGoBack: boolean;
		canSkipStep: boolean;
		autoAdvance: boolean;
		autoAdvanceDelay: number;
	};
}

/**
 * 拡張された認証モーダルのコンテキスト型（既存との完全互換性）
 */
export interface AuthModalContextType {
	// 既存のインターフェース（完全互換性）
	isOpen: boolean;
	modalOptions: AuthModalOptions;
	openAuthModal: (options?: AuthModalOptions) => void;
	closeAuthModal: () => void;
	updateModalOptions: (options: Partial<AuthModalOptions>) => void;
	_debug: {
		openCount: number;
		lastOpened: Date | null;
		lastClosed: Date | null;
	};

	// ★ 新規追加: 拡張機能（オプショナル）
	authFlowState?: AuthFlowState;
	setAuthStep?: (step: AuthStep) => void;
	goBackStep?: () => boolean;
	resetAuthFlow?: () => void;
	selectChain?: (chainId: SelectableChainId) => Promise<boolean>;
	switchChain?: (chainId: SelectableChainId) => Promise<boolean>;
	resetChainSelection?: () => void;
	getSelectedChain?: () => SelectableChain | null;
	updateProgress?: (progress: number) => void;
	setStepStatus?: (status: {
		signatureRequired?: boolean;
		verificationRequired?: boolean;
	}) => void;
}

/**
 * デフォルトのモーダルオプション（既存と同じ）
 */
const DEFAULT_MODAL_OPTIONS: AuthModalOptions = {
	preferredChain: 'evm',
	autoClose: true,
	showChainSelector: true,
	title: 'Connect Wallet',
};

/**
 * ★ 新規追加: デフォルトのフロー状態
 */
const DEFAULT_FLOW_STATE: AuthFlowState = {
	currentStep: 'chain-select',
	progress: 0,
	signatureRequired: false,
	verificationRequired: false,

	chainSelection: {
		selectedChain: null,
		availableChains: ['sepolia', 'avalanche-fuji'],
		isSwitching: false,
		switchProgress: 0,
		switchError: null,
		selectionHistory: [],
	},

	stepManagement: {
		visitedSteps: [],
		canGoBack: false,
		canSkipStep: false,
		autoAdvance: false,
		autoAdvanceDelay: 2000,
	},
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
 * 拡張されたグローバル認証モーダル管理プロバイダー（既存との完全互換性）
 */
export const AuthModalProvider = ({
	children,
	defaultOptions = {}
}: AuthModalProviderProps) => {
	// 既存の基本状態（完全互換性）
	const [isOpen, setIsOpen] = useState(false);
	const [modalOptions, setModalOptions] = useState<AuthModalOptions>({
		...DEFAULT_MODAL_OPTIONS,
		...defaultOptions
	});

	// 既存のデバッグ情報（完全互換性）
	const [debugInfo, setDebugInfo] = useState({
		openCount: 0,
		lastOpened: null as Date | null,
		lastClosed: null as Date | null,
	});

	// ★ 新規追加: フロー状態（既存機能に影響なし）
	const [authFlowState, setAuthFlowState] = useState<AuthFlowState>(DEFAULT_FLOW_STATE);

	// ★ 新規追加: フロー履歴追加
	const addFlowHistory = useCallback((step: AuthStep, data?: any) => {
		// デバッグ用の拡張（既存に影響なし）
		console.log('📍 Auth flow:', step, data);
	}, []);

	// 既存のモーダルを開く機能（完全互換性 + 拡張）
	const openAuthModal = useCallback((options: AuthModalOptions = {}) => {
		const mergedOptions = {
			...DEFAULT_MODAL_OPTIONS,
			...defaultOptions,
			...options
		};

		setModalOptions(mergedOptions);
		setIsOpen(true);

		// ★ 新規追加: フロー状態の初期化（既存に影響なし）
		if (mergedOptions.showChainSelector && mergedOptions.chainSelection) {
			const initialStep = mergedOptions.step?.skipChainSelection
				? 'wallet-connect'
				: 'chain-select';

			setAuthFlowState(prev => ({
				...DEFAULT_FLOW_STATE,
				currentStep: initialStep,
				chainSelection: {
					...DEFAULT_FLOW_STATE.chainSelection!,
					selectedChain: mergedOptions.chainSelection?.defaultChain || null,
					availableChains: mergedOptions.chainSelection?.availableChains || ['sepolia', 'avalanche-fuji'],
				},
			}));

			addFlowHistory(initialStep, { options: mergedOptions });
		}

		// 既存のデバッグ情報更新（完全互換性）
		setDebugInfo(prev => ({
			...prev,
			openCount: prev.openCount + 1,
			lastOpened: new Date()
		}));

		console.log('🔓 AuthModal opened with options:', mergedOptions);
	}, [defaultOptions, addFlowHistory]);

	// 既存のモーダルを閉じる機能（完全互換性）
	const closeAuthModal = useCallback(() => {
		setIsOpen(false);

		// 既存のデバッグ情報更新（完全互換性）
		setDebugInfo(prev => ({
			...prev,
			lastClosed: new Date()
		}));

		console.log('🔒 AuthModal closed');

		// 既存のクリーンアップ（完全互換性）
		setTimeout(() => {
			setModalOptions({
				...DEFAULT_MODAL_OPTIONS,
				...defaultOptions
			});
			// ★ 新規追加: フロー状態もリセット（既存に影響なし）
			setAuthFlowState(DEFAULT_FLOW_STATE);
		}, 300); // アニメーション完了後
	}, [defaultOptions]);

	// 既存のモーダルオプション更新（完全互換性）
	const updateModalOptions = useCallback((options: Partial<AuthModalOptions>) => {
		setModalOptions(prev => ({
			...prev,
			...options
		}));

		console.log('⚙️ AuthModal options updated:', options);
	}, []);

	// ★ 新規追加: ステップ管理（既存に影響なし）
	const setAuthStep = useCallback((step: AuthStep) => {
		setAuthFlowState(prev => {
			const newVisitedSteps = prev.stepManagement?.visitedSteps.includes(step)
				? prev.stepManagement.visitedSteps
				: [...(prev.stepManagement?.visitedSteps || []), step];

			return {
				...prev,
				currentStep: step,
				stepManagement: {
					...prev.stepManagement,
					visitedSteps: newVisitedSteps,
					canGoBack: newVisitedSteps.length > 1,
				} as AuthFlowState['stepManagement'],
			};
		});

		addFlowHistory(step);
		console.log('📍 Auth step changed:', step);
	}, [addFlowHistory]);

	// ★ 新規追加: 戻るボタン（既存に影響なし）
	const goBackStep = useCallback((): boolean => {
		const { stepManagement, currentStep } = authFlowState;

		if (!stepManagement?.canGoBack || !stepManagement.visitedSteps.length) {
			return false;
		}

		const currentIndex = stepManagement.visitedSteps.indexOf(currentStep);
		if (currentIndex > 0) {
			const previousStep = stepManagement.visitedSteps[currentIndex - 1];
			setAuthStep(previousStep);
			return true;
		}

		return false;
	}, [authFlowState, setAuthStep]);

	// ★ 新規追加: フロー状態リセット（既存に影響なし）
	const resetAuthFlow = useCallback(() => {
		setAuthFlowState(DEFAULT_FLOW_STATE);
		addFlowHistory('chain-select', { action: 'flow-reset' });
		console.log('🔄 Auth flow reset');
	}, [addFlowHistory]);

	// ★ 新規追加: チェーン選択（既存に影響なし）
	const selectChain = useCallback(async (chainId: SelectableChainId): Promise<boolean> => {
		try {
			setAuthFlowState(prev => ({
				...prev,
				chainSelection: {
					...prev.chainSelection!,
					selectedChain: chainId,
					selectionHistory: [
						...prev.chainSelection!.selectionHistory,
						{
							chainId,
							timestamp: new Date(),
							success: true,
						}
					],
				},
			}));

			// コールバック実行
			if (modalOptions.chainSelection?.onChainSelect) {
				modalOptions.chainSelection.onChainSelect(chainId);
			}

			addFlowHistory(authFlowState.currentStep, { action: 'chain-selected', chainId });
			console.log('⛓️ Chain selected:', chainId);

			return true;
		} catch (error) {
			console.error('Chain selection failed:', error);
			return false;
		}
	}, [modalOptions, authFlowState.currentStep, addFlowHistory]);

	// ★ 新規追加: チェーン切り替え（既存に影響なし）
	const switchChain = useCallback(async (chainId: SelectableChainId): Promise<boolean> => {
		try {
			setAuthFlowState(prev => ({
				...prev,
				chainSelection: {
					...prev.chainSelection!,
					isSwitching: true,
					switchProgress: 0,
					switchError: null,
				},
			}));

			// TODO: 実際のチェーン切り替えロジック
			await new Promise(resolve => setTimeout(resolve, 1000));

			setAuthFlowState(prev => ({
				...prev,
				chainSelection: {
					...prev.chainSelection!,
					isSwitching: false,
					switchProgress: 100,
					selectedChain: chainId,
				},
			}));

			addFlowHistory(authFlowState.currentStep, { action: 'chain-switched', chainId });
			console.log('🔄 Chain switched:', chainId);

			return true;
		} catch (error) {
			console.error('Chain switch failed:', error);
			return false;
		}
	}, [authFlowState.currentStep, addFlowHistory]);

	// ★ 新規追加: チェーン選択リセット（既存に影響なし）
	const resetChainSelection = useCallback(() => {
		setAuthFlowState(prev => ({
			...prev,
			chainSelection: {
				...DEFAULT_FLOW_STATE.chainSelection!,
				availableChains: prev.chainSelection?.availableChains || ['sepolia', 'avalanche-fuji'],
			},
		}));

		addFlowHistory(authFlowState.currentStep, { action: 'chain-selection-reset' });
		console.log('🔄 Chain selection reset');
	}, [authFlowState.currentStep, addFlowHistory]);

	// ★ 新規追加: 選択されたチェーンの取得（既存に影響なし）
	const getSelectedChain = useCallback((): SelectableChain | null => {
		const selectedChainId = authFlowState.chainSelection?.selectedChain;
		return selectedChainId ? testnetUtils.getChainById(selectedChainId) : null;
	}, [authFlowState.chainSelection?.selectedChain]);

	// ★ 新規追加: 進捗更新（既存に影響なし）
	const updateProgress = useCallback((progress: number) => {
		setAuthFlowState(prev => ({
			...prev,
			progress: Math.max(0, Math.min(100, progress)),
		}));
	}, []);

	// ★ 新規追加: ステップ状態更新（既存に影響なし）
	const setStepStatus = useCallback((status: {
		signatureRequired?: boolean;
		verificationRequired?: boolean;
	}) => {
		setAuthFlowState(prev => ({
			...prev,
			...status,
		}));
	}, []);

	// 既存の外部イベントリスニング（完全互換性）
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

	// 既存のESCキー処理（完全互換性）
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

	// 既存の成功/エラー時のコールバックハンドラー（完全互換性）
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

	// 既存のコンテキスト値（完全互換性 + 拡張）
	const contextValue: AuthModalContextType = {
		// 既存のインターフェース（完全互換性）
		isOpen,
		modalOptions,
		openAuthModal,
		closeAuthModal,
		updateModalOptions,
		_debug: debugInfo,

		// ★ 新規追加: 拡張機能（既存に影響なし）
		authFlowState,
		setAuthStep,
		goBackStep,
		resetAuthFlow,
		selectChain,
		switchChain,
		resetChainSelection,
		getSelectedChain,
		updateProgress,
		setStepStatus,
	};

	// 既存の成功/エラーハンドラーをコンテキストに注入（完全互換性）
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
 * 既存のAuthModalContextを使用するhook（完全互換性）
 */
export const useAuthModal = (): AuthModalContextType => {
	const context = useContext(AuthModalContext);
	if (!context) {
		throw new Error('useAuthModal must be used within AuthModalProvider');
	}
	return context;
};

/**
 * 既存のモーダル状態のみを取得する軽量hook（完全互換性）
 */
export const useAuthModalState = () => {
	const { isOpen, modalOptions } = useAuthModal();
	return { isOpen, modalOptions };
};

/**
 * 既存のモーダル操作のみを取得するhook（完全互換性）
 */
export const useAuthModalActions = () => {
	const { openAuthModal, closeAuthModal, updateModalOptions } = useAuthModal();
	return { openAuthModal, closeAuthModal, updateModalOptions };
};

/**
 * 既存の特定の設定でモーダルを開くヘルパーhook（完全互換性）
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
 * 既存のデバッグ情報を表示するコンポーネント（完全互換性 + 拡張）
 */
export const AuthModalDebugInfo = () => {
	const { isOpen, modalOptions, _debug, authFlowState } = useAuthModal();

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
				{/* ★ 新規追加: フロー状態デバッグ（既存に影響なし） */}
				{authFlowState && (
					<>
						<div className="flex justify-between">
							<span>Step:</span>
							<span className="text-cyan-300">{authFlowState.currentStep}</span>
						</div>
						<div className="flex justify-between">
							<span>Progress:</span>
							<span className="text-cyan-300">{authFlowState.progress}%</span>
						</div>
						{authFlowState.chainSelection?.selectedChain && (
							<div className="flex justify-between">
								<span>Chain:</span>
								<span className="text-cyan-300">{authFlowState.chainSelection.selectedChain}</span>
							</div>
						)}
					</>
				)}
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
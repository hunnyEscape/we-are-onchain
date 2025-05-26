// src/auth/services/AuthActionsService.ts (リファクタリング版)
import { ChainType } from '@/types/wallet';
import { WalletAuthRequest, WalletAuthResponse } from '@/types/api-wallet';
import { ExtendedFirestoreUser, WalletOperationResult, AuthFlowState } from '@/types/user-extended';
import { SelectableChainId } from '@/types/chain-selection';

/**
 * 認証フロー制御のインターフェース
 */
interface AuthFlowController {
	setStep: (step: AuthFlowState['currentStep']) => void;
	updateProgress: (progress: number) => void;
	setSignatureRequired: (required: boolean) => void;
	setVerificationRequired: (required: boolean) => void;
	setError: () => void;
	completeSuccess: () => void;
}

/**
 * EVMウォレットインターフェース（簡素化）
 */
interface EVMWalletInterface {
	address: string | null;
	chainId: number | null;
	isConnected: boolean;
	isAuthenticated: boolean;
	connectWallet: (walletType?: string) => Promise<any>;
	disconnectWallet: () => Promise<void>;
	signMessage: (message: string) => Promise<string>;
	switchChain: (chainId: number) => Promise<void>;
}

/**
 * チェーン選択インターフェース（簡素化）
 */
interface ChainSelectionInterface {
	selectedChain: SelectableChainId | null;
	selectChain: (chainId: SelectableChainId) => Promise<boolean>;
	switchToChain: (chainId: SelectableChainId) => Promise<boolean>;
	getSelectedChain: () => any;
}

/**
 * 統合認証アクションサービス
 * UnifiedAuthContextから分離されたビジネスロジック
 */
export class AuthActionsService {
	constructor(
		private evmWallet: EVMWalletInterface,
		private authFlow: AuthFlowController,
		private chainSelection: ChainSelectionInterface,
		private apiClient: {
			callAPI: (url: string, options?: RequestInit) => Promise<any>;
		},
		private userStore: {
			setExtendedUser: (user: ExtendedFirestoreUser | null) => void;
			setIsAuthenticated: (authenticated: boolean) => void;
		},
		private eventEmitter: {
			emitEvent: (type: string, data?: any) => void;
		},
		private errorHandler: {
			handleError: (error: any, context?: string) => void;
		}
	) { }

	/**
	 * 統合ウォレット接続
	 * チェーン選択→ウォレット接続のフロー
	 */
	async connectWallet(chainType: ChainType = 'evm', walletType?: string) {
		try {
			this.authFlow.setStep('connecting');
			this.authFlow.updateProgress(25);

			if (chainType === 'evm') {
				const connection = await this.evmWallet.connectWallet(walletType);
				this.authFlow.updateProgress(100);

				this.eventEmitter.emitEvent('wallet-connected', {
					address: connection.address,
					chainType,
					walletType
				});

				return connection;
			} else {
				throw new Error(`Chain type ${chainType} not supported yet`);
			}
		} catch (error) {
			this.errorHandler.handleError(error, 'Wallet connect');
			this.authFlow.setError();
			throw error;
		}
	}

	/**
	 * 統合ウォレット認証
	 * 署名→API認証→ユーザーデータ取得のフロー
	 */
	async authenticateWallet(chainType: ChainType = 'evm', address?: string) {
		try {
			this.authFlow.setStep('signing');
			this.authFlow.setSignatureRequired(true);
			this.authFlow.updateProgress(25);

			if (chainType === 'evm') {
				// 1. EVMAuthServiceの初期化とNonce生成
				const authService = new (await import('@/auth/services/EVMAuthService')).EVMAuthService();
				const nonce = authService.generateNonce();

				// 2. ウォレットアドレス確認
				const currentAddress = address || this.evmWallet.address;
				if (!currentAddress) {
					throw new Error('Wallet address not available. Please ensure wallet is connected.');
				}

				console.log('🔗 Using wallet address for authentication:', currentAddress);

				// 3. Nonceを保存
				authService.storeNonce(currentAddress, nonce);
				this.authFlow.updateProgress(50);

				// 4. 認証メッセージ作成と署名
				const authMessage = authService.createAuthMessage(currentAddress, nonce, chainType);
				console.log('📝 Requesting signature for message...');

				let signature: string;
				try {
					signature = await this.evmWallet.signMessage(authMessage);
					console.log('✅ Signature obtained');
				} catch (signError: any) {
					console.error('❌ Signature failed:', signError);
					throw new Error(`Signature failed: ${signError.message || 'User rejected or wallet error'}`);
				}

				// 5. 署名データ構築
				const signatureData = {
					message: authMessage,
					signature,
					address: currentAddress,
					chainType,
					chainId: this.evmWallet.chainId || undefined, // null を undefined に変換
					nonce,
					timestamp: Date.now(),
				};

				this.authFlow.setSignatureRequired(false);
				this.authFlow.setVerificationRequired(true);
				this.authFlow.updateProgress(75);

				console.log('🚀 Sending extended wallet auth to API...');

				// 6. Extended API Routes経由でFirestore認証
				const apiRequest: WalletAuthRequest = {
					signature: signatureData.signature,
					message: signatureData.message,
					address: signatureData.address,
					chainType: signatureData.chainType,
					chainId: signatureData.chainId || undefined, // null を undefined に変換
					nonce: signatureData.nonce,
					timestamp: signatureData.timestamp,
				};

				const result: WalletAuthResponse = await this.apiClient.callAPI('/api/auth/wallet', {
					method: 'POST',
					body: JSON.stringify(apiRequest),
				});

				if (!result.success) {
					throw new Error(result.error?.message || 'Extended API authentication failed');
				}

				console.log('✅ Extended API authentication successful:', result.data);

				// 7. Extended Firestoreユーザーデータを保存
				if (result.data?.user) {
					this.userStore.setExtendedUser(result.data.user);
					this.userStore.setIsAuthenticated(true);

					console.log('🎉 Extended user data received:', {
						address: result.data.user.walletAddress,
						authMethod: result.data.user.authMethod,
						isNewUser: result.data.isNewUser,
					});

					this.eventEmitter.emitEvent('user-authenticated', {
						user: result.data.user,
						isNewUser: result.data.isNewUser
					});
				}

				this.authFlow.setVerificationRequired(false);
				this.authFlow.completeSuccess();
				this.authFlow.updateProgress(100);

				// 成功時は少し待ってからidleに戻す
				setTimeout(() => {
					this.authFlow.updateProgress(0);
				}, 2000);

				return {
					success: true,
					user: {
						address: signatureData.address,
						chainType: signatureData.chainType,
						chainId: signatureData.chainId,
					},
					signature: signatureData
				};
			} else {
				throw new Error(`Chain type ${chainType} not supported yet`);
			}
		} catch (error) {
			console.error('💥 Extended Wallet authenticate error:', error);
			this.errorHandler.handleError(error, 'Extended Wallet authenticate');
			this.authFlow.setError();
			this.authFlow.setSignatureRequired(false);
			this.authFlow.setVerificationRequired(false);

			return {
				success: false,
				error: error instanceof Error ? error.message : 'Extended authentication failed'
			};
		}
	}

	/**
	 * チェーン選択付きウォレット接続
	 * モーダルフローでの統合処理
	 */
	async connectWithChainSelection(chainId: SelectableChainId, walletType?: string) {
		try {
			console.log('🔗 Starting chain selection + wallet connection flow...');

			// 1. チェーン選択
			this.authFlow.setStep('connecting');
			this.authFlow.updateProgress(25);

			const chainSelected = await this.chainSelection.selectChain(chainId);
			if (!chainSelected) {
				throw new Error('Chain selection failed');
			}

			this.authFlow.updateProgress(50);

			// 2. チェーン切り替え（必要な場合）
			const selectedChain = this.chainSelection.getSelectedChain();
			if (selectedChain && this.evmWallet.chainId !== selectedChain.chainId) {
				console.log(`🔄 Switching to chain: ${selectedChain.displayName}`);
				await this.chainSelection.switchToChain(chainId);
			}

			this.authFlow.updateProgress(75);

			// 3. ウォレット接続
			const connection = await this.connectWallet('evm', walletType);

			console.log('✅ Chain selection + wallet connection completed');
			return connection;

		} catch (error) {
			console.error('❌ Chain selection + wallet connection failed:', error);
			this.authFlow.setError();
			throw error;
		}
	}

	/**
	 * 完全な認証フロー
	 * チェーン選択→ウォレット接続→認証→完了
	 */
	async completeAuthFlow(chainId: SelectableChainId, walletType?: string) {
		try {
			console.log('🚀 Starting complete auth flow...');

			// 1. チェーン選択付きでウォレット接続
			const connection = await this.connectWithChainSelection(chainId, walletType);

			// 2. ウォレット認証
			const authResult = await this.authenticateWallet('evm', connection.address);

			if (!authResult.success) {
				throw new Error(authResult.error || 'Authentication failed');
			}

			console.log('🎉 Complete auth flow successful');
			return {
				success: true,
				connection,
				authResult
			};

		} catch (error) {
			console.error('💥 Complete auth flow failed:', error);
			this.authFlow.setError();
			throw error;
		}
	}

	/**
	 * チェーン切り替え
	 */
	async switchWalletChain(chainType: ChainType, chainId: number | string) {
		try {
			if (chainType === 'evm' && typeof chainId === 'number') {
				await this.evmWallet.switchChain(chainId);

				this.eventEmitter.emitEvent('chain-switched', {
					chainType,
					chainId
				});
			} else {
				throw new Error(`Chain switching not supported for ${chainType}`);
			}
		} catch (error) {
			this.errorHandler.handleError(error, 'Extended Chain switch');
			throw error;
		}
	}

	/**
	 * 統合ログアウト
	 */
	async logout() {
		try {
			this.authFlow.updateProgress(25);

			// Wallet ログアウト
			if (this.evmWallet.isConnected) {
				await this.evmWallet.disconnectWallet();
			}

			// 状態リセット
			this.userStore.setExtendedUser(null);
			this.userStore.setIsAuthenticated(false);

			// チェーン選択もリセット
			// this.chainSelection.resetSelection(); // 実装されている場合

			this.authFlow.updateProgress(100);
			this.eventEmitter.emitEvent('unified-logout');

			console.log('🚪 Logout completed');
		} catch (error) {
			this.errorHandler.handleError(error, 'Extended Logout');
			this.authFlow.setError();
			throw error;
		}
	}

	/**
	 * プロフィール更新
	 */
	async updateProfile(
		data: Partial<ExtendedFirestoreUser>,
		extendedUser: ExtendedFirestoreUser | null
	): Promise<WalletOperationResult> {
		try {
			if (!extendedUser) {
				throw new Error('No extended user data available');
			}

			console.log('Extended profile update requested:', data);

			// TODO: API Routes経由でプロフィール更新
			// 現在は暫定的にローカル更新
			this.userStore.setExtendedUser({ ...extendedUser, ...data });

			this.eventEmitter.emitEvent('profile-updated', {
				userId: extendedUser.walletAddress,
				updateData: data
			});

			return {
				success: true,
				data: { message: 'Profile updated successfully' }
			};
		} catch (error) {
			this.errorHandler.handleError(error, 'Extended Profile update');
			return {
				success: false,
				error: {
					code: 'UPDATE_FAILED',
					message: error instanceof Error ? error.message : 'Profile update failed'
				}
			};
		}
	}

	/**
	 * セッション更新
	 */
	async refreshSession() {
		try {
			// TODO: セッション更新ロジック
			console.log('🔄 Session refresh requested');

			this.eventEmitter.emitEvent('session-refreshed');
		} catch (error) {
			this.errorHandler.handleError(error, 'Extended Session refresh');
			throw error;
		}
	}

	/**
	 * 認証状態の検証
	 */
	async validateAuthentication(): Promise<boolean> {
		try {
			const isWalletConnected = this.evmWallet.isConnected;
			const isWalletAuthenticated = this.evmWallet.isAuthenticated;
			const hasUserData = !!this.userStore;

			const isValid = isWalletConnected && isWalletAuthenticated && hasUserData;

			console.log('🔍 Authentication validation:', {
				walletConnected: isWalletConnected,
				walletAuthenticated: isWalletAuthenticated,
				hasUserData,
				isValid
			});

			return isValid;
		} catch (error) {
			console.error('❌ Authentication validation failed:', error);
			return false;
		}
	}

	/**
	 * デバッグ情報の取得
	 */
	getDebugInfo() {
		return {
			evmWallet: {
				isConnected: this.evmWallet.isConnected,
				isAuthenticated: this.evmWallet.isAuthenticated,
				address: this.evmWallet.address,
				chainId: this.evmWallet.chainId,
			},
			chainSelection: {
				selectedChain: this.chainSelection.selectedChain,
			},
			authFlow: {
				// currentStep: this.authFlow.currentStep, // 実装依存
			}
		};
	}
}
// src/auth/services/AuthActionsService.ts
import { ChainType } from '@/types/wallet';
import { WalletAuthRequest, WalletAuthResponse } from '@/types/api-wallet';
import { ExtendedFirestoreUser, WalletOperationResult } from '@/types/user-extended';

interface AuthFlowActions {
  startConnecting: (chainType?: ChainType, walletType?: string) => void;
  startSigning: () => void;
  startVerifying: () => void;
  completeSuccess: () => void;
  setError: () => void;
  updateProgress: (progress: number) => void;
}

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
 * 認証アクションを管理するサービスクラス
 */
export class AuthActionsService {
  constructor(
    private evmWallet: EVMWalletInterface,
    private flowActions: AuthFlowActions,
    private handleError: (error: any, context?: string) => void,
    private callAPI: (url: string, options?: RequestInit) => Promise<any>,
    private setExtendedUser: (user: ExtendedFirestoreUser | null) => void,
    private setIsAuthenticated: (authenticated: boolean) => void,
    private emitEvent: (type: string, data?: any) => void
  ) {}

  /**
   * ウォレット接続
   */
  async connectWallet(chainType: ChainType = 'evm', walletType?: string) {
    try {
      this.flowActions.startConnecting(chainType, walletType);

      if (chainType === 'evm') {
        const connection = await this.evmWallet.connectWallet(walletType);
        this.flowActions.updateProgress(100);
        return connection;
      } else {
        throw new Error(`Chain type ${chainType} not supported yet`);
      }
    } catch (error) {
      this.handleError(error, 'Extended Wallet connect');
      this.flowActions.setError();
      throw error;
    }
  }

  /**
   * ウォレット認証
   */
  async authenticateWallet(chainType: ChainType = 'evm', address?: string) {
    try {
      this.flowActions.startSigning();

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
        this.flowActions.updateProgress(50);

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
          chainId: this.evmWallet.chainId,
          nonce,
          timestamp: Date.now(),
        };

        this.flowActions.startVerifying();

        // 6. API認証
        const apiRequest: WalletAuthRequest = {
          signature: signatureData.signature,
          message: signatureData.message,
          address: signatureData.address,
          chainType: signatureData.chainType,
          chainId: signatureData.chainId,
          nonce: signatureData.nonce,
          timestamp: signatureData.timestamp,
        };

        const result: WalletAuthResponse = await this.callAPI('/api/auth/wallet', {
          method: 'POST',
          body: JSON.stringify(apiRequest),
        });

        if (!result.success) {
          throw new Error(result.error?.message || 'Extended API authentication failed');
        }

        console.log('✅ Extended API authentication successful:', result.data);

        // 7. ユーザーデータを保存
        if (result.data?.user) {
          this.setExtendedUser(result.data.user);
          console.log('🎉 Extended user data received:', {
            address: result.data.user.walletAddress,
            authMethod: result.data.user.authMethod,
            isNewUser: result.data.isNewUser,
          });
        }

        this.flowActions.completeSuccess();

        // 成功時は少し待ってからidleに戻す
        setTimeout(() => {
          this.flowActions.updateProgress(0);
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
      this.handleError(error, 'Extended Wallet authenticate');
      this.flowActions.setError();

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Extended authentication failed'
      };
    }
  }

  /**
   * チェーン切り替え
   */
  async switchWalletChain(chainType: ChainType, chainId: number | string) {
    try {
      if (chainType === 'evm' && typeof chainId === 'number') {
        await this.evmWallet.switchChain(chainId);
      } else {
        throw new Error(`Chain switching not supported for ${chainType}`);
      }
    } catch (error) {
      this.handleError(error, 'Extended Chain switch');
      throw error;
    }
  }

  /**
   * ログアウト
   */
  async logout() {
    try {
      this.flowActions.updateProgress(25);

      // Wallet ログアウト
      if (this.evmWallet.isConnected) {
        await this.evmWallet.disconnectWallet();
      }

      // 状態リセット
      this.setExtendedUser(null);
      this.setIsAuthenticated(false);

      this.flowActions.updateProgress(100);
      this.emitEvent('unified-logout');
    } catch (error) {
      this.handleError(error, 'Extended Logout');
      this.flowActions.setError();
      throw error;
    }
  }

  /**
   * プロフィール更新
   */
  async updateProfile(data: Partial<ExtendedFirestoreUser>, extendedUser: ExtendedFirestoreUser | null): Promise<WalletOperationResult> {
    try {
      if (!extendedUser) {
        throw new Error('No extended user data available');
      }

      console.log('Extended profile update requested:', data);

      // 暫定的にローカル更新
      this.setExtendedUser({ ...extendedUser, ...data });

      return {
        success: true,
        data: { message: 'Profile updated successfully' }
      };
    } catch (error) {
      this.handleError(error, 'Extended Profile update');
      return {
        success: false,
        error: {
          code: 'UPDATE_FAILED',
          message: error instanceof Error ? error.message : 'Profile update failed'
        }
      };
    }
  }
}
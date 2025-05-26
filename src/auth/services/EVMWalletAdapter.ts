// src/wallet-auth/adapters/evm/EVMWalletAdapter.ts
import {
	useAccount,
	useConnect,
	useDisconnect,
	useSignMessage,
	useSwitchChain,  // ✅ v2では useSwitchChain
	useChainId,      // ✅ v2では useChainId
} from 'wagmi';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import {
	ChainType,
	WalletConnection,
	WalletSignatureData,
	WalletState,
	WalletProvider,
	ChainConfig,
	WalletError
} from '@/auth/types/wallet';
import { WalletAdapter } from '../../core/WalletAdapterInterface';
import { chainUtils, getEVMChains, CHAIN_DISPLAY_NAMES } from '../config/chain-config';

// 既存のwindow.ethereum定義を使用（型競合回避）
// CoinbaseWalletSDKやMetaMaskが既に定義しているためコメントアウト

/**
 * EVM系ウォレット用のAdapter実装
 * Wagmi v2 + RainbowKitを使用してEVMチェーンのウォレット接続を管理
 */
export class EVMWalletAdapter implements WalletAdapter {
	readonly chainType: ChainType = 'evm';

	private stateSubscribers: ((state: WalletState) => void)[] = [];
	private currentState: WalletState = {
		isConnecting: false,
		isConnected: false,
		isAuthenticated: false,
	};

	constructor() {
		// 初期化時の状態確認
		this.updateState();
	}

	get isSupported(): boolean {
		return typeof window !== 'undefined' && typeof (window as any).ethereum !== 'undefined';
	}

	get supportedWallets(): WalletProvider[] {
		const wallets: WalletProvider[] = [
			{
				id: 'metamask',
				name: 'MetaMask',
				chainType: 'evm',
				icon: '🦊',
				downloadUrl: 'https://metamask.io/download/',
				isInstalled: typeof window !== 'undefined' && !!((window as any).ethereum?.isMetaMask),
				capabilities: {
					canSwitchChain: true,
					canAddChain: true,
					canSignMessage: true,
					canSignTransaction: true,
					supportsEIP1559: true,
				},
			},
			{
				id: 'walletconnect',
				name: 'WalletConnect',
				chainType: 'evm',
				icon: '🔗',
				downloadUrl: 'https://walletconnect.com/',
				isInstalled: true, // WalletConnectは常に利用可能
				capabilities: {
					canSwitchChain: true,
					canAddChain: false,
					canSignMessage: true,
					canSignTransaction: true,
					supportsEIP1559: true,
				},
			},
			{
				id: 'coinbase',
				name: 'Coinbase Wallet',
				chainType: 'evm',
				icon: '🔵',
				downloadUrl: 'https://www.coinbase.com/wallet',
				isInstalled: typeof window !== 'undefined' && !!((window as any).ethereum?.isCoinbaseWallet),
				capabilities: {
					canSwitchChain: true,
					canAddChain: true,
					canSignMessage: true,
					canSignTransaction: true,
					supportsEIP1559: true,
				},
			},
		];

		return wallets;
	}

	// Wagmi v2 hooksをラップして使用する関数
	private useWagmiHooks() {
		const { address, isConnected, isConnecting, connector } = useAccount();
		const chainId = useChainId(); // ✅ v2の正しいhook
		const { connect, connectors, isPending } = useConnect(); // ✅ v2では isPending
		const { disconnect } = useDisconnect();
		const { signMessageAsync } = useSignMessage();
		const { switchChain } = useSwitchChain(); // ✅ v2の正しいhook
		const { openConnectModal } = useConnectModal();

		return {
			address,
			isConnected,
			isConnecting: isConnecting || isPending, // ✅ v2では isPending も確認
			connector,
			chainId, // ✅ 直接chainIdを取得
			connect,
			connectors,
			disconnect,
			signMessageAsync,
			switchChain, // ✅ v2の正しい関数名
			openConnectModal,
		};
	}

	getState(): WalletState {
		return { ...this.currentState };
	}

	subscribe(callback: (state: WalletState) => void): () => void {
		this.stateSubscribers.push(callback);

		// 初回呼び出し
		callback(this.currentState);

		// Unsubscribe関数を返す
		return () => {
			const index = this.stateSubscribers.indexOf(callback);
			if (index > -1) {
				this.stateSubscribers.splice(index, 1);
			}
		};
	}

	private updateState(): void {
		// この関数はReactコンポーネント内で呼び出される必要がある
		// 実際の状態更新はuseEffectで行う
	}

	private notifyStateChange(): void {
		this.stateSubscribers.forEach(callback => callback(this.currentState));
	}

	async connect(walletType?: string): Promise<WalletConnection> {
		try {
			this.currentState.isConnecting = true;
			this.currentState.error = undefined;
			this.notifyStateChange();

			// RainbowKitのモーダルを開く
			if (typeof window !== 'undefined') {
				// カスタムイベントでRainbowKitモーダルを開く要求を送信
				window.dispatchEvent(new CustomEvent('openWalletModal', {
					detail: { walletType }
				}));
			}

			// 接続完了を待機（実際の実装では適切な待機処理が必要）
			await new Promise(resolve => setTimeout(resolve, 100));

			// 接続状態を確認して返す
			const connection = this.createWalletConnection();

			this.currentState.isConnecting = false;
			this.currentState.isConnected = true;
			this.notifyStateChange();

			return connection;
		} catch (error) {
			this.currentState.isConnecting = false;
			this.currentState.error = this.formatError(error).message;
			this.notifyStateChange();
			throw error;
		}
	}

	async disconnect(): Promise<void> {
		try {
			// Wagmi v2のdisconnect関数を呼び出す

			this.currentState.isConnected = false;
			this.currentState.isAuthenticated = false;
			this.currentState.address = undefined;
			this.currentState.chainType = undefined;
			this.currentState.chainId = undefined;
			this.currentState.walletType = undefined;
			this.notifyStateChange();
		} catch (error) {
			this.currentState.error = this.formatError(error).message;
			this.notifyStateChange();
			throw error;
		}
	}

	async reconnect(): Promise<WalletConnection | null> {
		try {
			// 自動再接続の試行
			// Wagmiの自動接続機能を利用
			return this.createWalletConnection();
		} catch (error) {
			console.warn('Auto-reconnect failed:', error);
			return null;
		}
	}

	getAddress(): string | null {
		return this.currentState.address || null;
	}

	getChainId(): number | string | null {
		return this.currentState.chainId || null;
	}

	getWalletType(): string | null {
		return this.currentState.walletType || null;
	}

	isConnected(): boolean {
		return this.currentState.isConnected;
	}

	async signMessage(message: string): Promise<string> {
		if (!this.isConnected()) {
			throw new Error('Wallet not connected');
		}

		try {
			// Wagmi v2のサインメッセージを使用
			const signature = await this.executeSignMessage(message);
			return signature;
		} catch (error) {
			throw this.formatError(error);
		}
	}

	async signAuthMessage(nonce: string): Promise<WalletSignatureData> {
		const address = this.getAddress();
		if (!address) {
			throw new Error('No address available');
		}

		const message = this.createAuthMessage(address, nonce);
		const signature = await this.signMessage(message);

		return {
			message,
			signature,
			address,
			chainType: this.chainType,
			chainId: this.getChainId() || undefined,
			nonce,
			timestamp: Date.now(),
		};
	}

	async switchChain(chainId: number | string): Promise<void> {
		const numericChainId = typeof chainId === 'string' ? parseInt(chainId) : chainId;

		if (!chainUtils.isSupported(numericChainId)) {
			throw new Error(`Chain ${chainId} is not supported`);
		}

		try {
			// Wagmi v2のswitchChainを使用
			await this.executeSwitchChain(numericChainId);

			this.currentState.chainId = numericChainId;
			this.notifyStateChange();
		} catch (error) {
			throw this.formatError(error);
		}
	}

	async addChain(chainConfig: ChainConfig): Promise<void> {
		try {
			if (typeof window !== 'undefined' && (window as any).ethereum?.request) {
				await (window as any).ethereum.request({
					method: 'wallet_addEthereumChain',
					params: [{
						chainId: `0x${chainConfig.chainId.toString(16)}`,
						chainName: chainConfig.name,
						nativeCurrency: chainConfig.nativeCurrency,
						rpcUrls: chainConfig.rpcUrls,
						blockExplorerUrls: chainConfig.blockExplorerUrls,
					}],
				});
			} else {
				throw new Error('Ethereum provider not available or does not support adding chains');
			}
		} catch (error) {
			throw this.formatError(error);
		}
	}

	getSupportedChains(): ChainConfig[] {
		return getEVMChains().map(chain => ({
			chainId: chain.id,
			name: chain.name,
			nativeCurrency: chain.nativeCurrency,
			rpcUrls: [...chain.rpcUrls.default.http],
			blockExplorerUrls: chain.blockExplorers ? [chain.blockExplorers.default.url] : undefined,
			isTestnet: chain.testnet,
		}));
	}

	validateAddress(address: string): boolean {
		return /^0x[a-fA-F0-9]{40}$/.test(address);
	}

	formatAddress(address: string): string {
		return chainUtils.formatAddress(address);
	}

	getExplorerUrl(address: string): string {
		const chainId = this.getChainId();
		if (typeof chainId === 'number') {
			return chainUtils.getExplorerUrl(chainId, address);
		}
		return '';
	}

	// プライベートヘルパーメソッド
	private createWalletConnection(): WalletConnection {
		return {
			address: this.getAddress() || '',
			chainType: this.chainType,
			chainId: this.getChainId() || undefined,
			walletType: this.getWalletType() || 'unknown',
			isConnected: this.isConnected(),
			connectedAt: new Date(),
			lastUsedAt: new Date(),
		};
	}

	private createAuthMessage(address: string, nonce: string): string {
		return `Welcome to We are on-chain!

Please sign this message to authenticate your wallet.

Address: ${address}
Nonce: ${nonce}
Timestamp: ${new Date().toISOString()}

This request will not trigger a blockchain transaction or cost any gas fees.`;
	}

	private formatError(error: any): WalletError {
		let code = 'unknown-error';
		let message = 'An unknown error occurred';

		if (error?.code) {
			code = String(error.code);
		}

		if (error?.message) {
			message = error.message;
		} else if (typeof error === 'string') {
			message = error;
		}

		// EVM固有のエラーコード処理
		const numericCode = typeof error?.code === 'number' ? error.code : parseInt(code);

		if (numericCode === 4001) {
			code = 'user-rejected';
			message = 'User rejected the request';
		} else if (numericCode === -32002) {
			code = 'already-pending';
			message = 'A request is already pending';
		} else if (numericCode === -32603) {
			code = 'internal-error';
			message = 'Internal error';
		}

		return {
			code,
			message,
			details: error,
			chainType: this.chainType,
		};
	}

	// これらのメソッドは実際にはReactコンポーネント内でhooksを使用して実装される
	private async executeSignMessage(message: string): Promise<string> {
		throw new Error('This method should be called from a React component with wagmi hooks');
	}

	private async executeSwitchChain(chainId: number): Promise<void> {
		throw new Error('This method should be called from a React component with wagmi hooks');
	}
}
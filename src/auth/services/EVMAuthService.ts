// src/wallet-auth/adapters/evm/EVMAuthService.ts
import { verifyMessage } from 'ethers';
import { nanoid } from 'nanoid';
import {
	ChainType,
	WalletAuthResult,
	WalletSignatureData
} from '@/auth/types/wallet';
import { WalletAdapter, WalletAuthService } from './WalletAdapterInterface';

/**
 * EVM系ウォレット認証サービス
 * Ethereum系チェーンでの署名検証とセッション管理を行う
 */
export class EVMAuthService implements WalletAuthService {
	private nonceStorage = new Map<string, { nonce: string; timestamp: number }>();
	private sessionStorage = new Map<string, { address: string; chainType: ChainType; expires: number }>();

	// Nonce有効期限（5分）
	private readonly NONCE_EXPIRY = 5 * 60 * 1000;

	// セッション有効期限（24時間）
	private readonly SESSION_EXPIRY = 24 * 60 * 60 * 1000;

	// ドメイン設定
	private readonly DOMAIN = typeof window !== 'undefined' ? window.location.host : 'localhost';

	generateNonce(): string {
		return nanoid(32);
	}

	validateNonce(nonce: string): boolean {
		const now = Date.now();

		// 期限切れのnonceをクリーンアップ
		for (const [address, data] of this.nonceStorage.entries()) {
			if (now - data.timestamp > this.NONCE_EXPIRY) {
				this.nonceStorage.delete(address);
			}
		}

		// nonceの存在確認
		return Array.from(this.nonceStorage.values()).some(data =>
			data.nonce === nonce && (now - data.timestamp) <= this.NONCE_EXPIRY
		);
	}

	storeNonce(address: string, nonce: string): void {
		this.nonceStorage.set(address.toLowerCase(), {
			nonce,
			timestamp: Date.now()
		});
	}

	clearNonce(address: string): void {
		this.nonceStorage.delete(address.toLowerCase());
	}

	createAuthMessage(address: string, nonce: string, chainType: ChainType): string {
		const timestamp = new Date().toISOString();

		return `Welcome to We are on-chain!

Click to sign in and accept the Terms of Service.

This request will not trigger a blockchain transaction or cost any gas fees.

Wallet address: ${address}
Chain: ${chainType.toUpperCase()}
Domain: ${this.DOMAIN}
Nonce: ${nonce}
Issued At: ${timestamp}`;
	}

	parseAuthMessage(message: string): {
		address: string;
		nonce: string;
		timestamp: number;
		domain: string;
	} | null {
		try {
			const lines = message.split('\n');
			let address = '';
			let nonce = '';
			let timestamp = 0;
			let domain = '';

			for (const line of lines) {
				if (line.startsWith('Wallet address: ')) {
					address = line.replace('Wallet address: ', '').trim();
				} else if (line.startsWith('Domain: ')) {
					domain = line.replace('Domain: ', '').trim();
				} else if (line.startsWith('Nonce: ')) {
					nonce = line.replace('Nonce: ', '').trim();
				} else if (line.startsWith('Issued At: ')) {
					const timestampStr = line.replace('Issued At: ', '').trim();
					timestamp = new Date(timestampStr).getTime();
				}
			}

			if (!address || !nonce || !timestamp || !domain) {
				return null;
			}

			return { address, nonce, timestamp, domain };
		} catch (error) {
			console.error('Failed to parse auth message:', error);
			return null;
		}
	}

	async verifySignature(
		signature: string,
		message: string,
		address: string,
		chainType: ChainType
	): Promise<boolean> {
		try {
			// EVM系チェーンでの署名検証
			if (chainType !== 'evm') {
				throw new Error(`Unsupported chain type: ${chainType}`);
			}

			// ethers.jsを使用して署名を検証
			const recoveredAddress = verifyMessage(message, signature);

			// アドレスの正規化と比較
			const normalizedRecovered = recoveredAddress.toLowerCase();
			const normalizedExpected = address.toLowerCase();

			return normalizedRecovered === normalizedExpected;
		} catch (error) {
			console.error('Signature verification failed:', error);
			return false;
		}
	}

	async authenticate(adapter: WalletAdapter): Promise<WalletAuthResult> {
		try {
			// 1. ウォレット接続確認
			if (!adapter.isConnected()) {
				return {
					success: false,
					error: 'Wallet not connected'
				};
			}

			const address = adapter.getAddress();
			if (!address) {
				return {
					success: false,
					error: 'No wallet address available'
				};
			}

			// 2. Nonce生成と保存
			const nonce = this.generateNonce();
			this.storeNonce(address, nonce);

			// 3. 署名要求
			let signatureData: WalletSignatureData;
			try {
				signatureData = await adapter.signAuthMessage(nonce);
			} catch (error) {
				this.clearNonce(address);
				return {
					success: false,
					error: error instanceof Error ? error.message : 'Signature failed'
				};
			}

			// 4. 署名検証
			const isValid = await this.verifySignature(
				signatureData.signature,
				signatureData.message,
				signatureData.address,
				signatureData.chainType
			);

			if (!isValid) {
				this.clearNonce(address);
				return {
					success: false,
					error: 'Invalid signature'
				};
			}

			// 5. Nonce検証
			if (!this.validateNonce(nonce)) {
				this.clearNonce(address);
				return {
					success: false,
					error: 'Invalid or expired nonce'
				};
			}

			// 6. メッセージ内容検証
			const parsedMessage = this.parseAuthMessage(signatureData.message);
			if (!parsedMessage || parsedMessage.address.toLowerCase() !== address.toLowerCase()) {
				this.clearNonce(address);
				return {
					success: false,
					error: 'Invalid message content'
				};
			}

			// 7. 認証成功
			this.clearNonce(address);

			return {
				success: true,
				user: {
					address: signatureData.address,
					chainType: signatureData.chainType,
					chainId: signatureData.chainId
				},
				signature: signatureData
			};

		} catch (error) {
			console.error('Authentication failed:', error);
			return {
				success: false,
				error: error instanceof Error ? error.message : 'Authentication failed'
			};
		}
	}

	async logout(address: string): Promise<void> {
		// Nonce削除
		this.clearNonce(address);

		// セッション削除
		const sessionKey = this.generateSessionKey(address);
		this.sessionStorage.delete(sessionKey);

		// ローカルストレージからも削除
		if (typeof window !== 'undefined') {
			localStorage.removeItem(`wallet_session_${address.toLowerCase()}`);
		}
	}

	async createSession(authResult: WalletAuthResult): Promise<string> {
		if (!authResult.success || !authResult.user) {
			throw new Error('Cannot create session for failed authentication');
		}

		const sessionToken = nanoid(64);
		const sessionKey = this.generateSessionKey(authResult.user.address);
		const expires = Date.now() + this.SESSION_EXPIRY;

		// メモリに保存
		this.sessionStorage.set(sessionKey, {
			address: authResult.user.address,
			chainType: authResult.user.chainType,
			expires
		});

		// ローカルストレージにも保存
		if (typeof window !== 'undefined') {
			const sessionData = {
				token: sessionToken,
				address: authResult.user.address,
				chainType: authResult.user.chainType,
				expires
			};
			localStorage.setItem(
				`wallet_session_${authResult.user.address.toLowerCase()}`,
				JSON.stringify(sessionData)
			);
		}

		return sessionToken;
	}

	async validateSession(sessionToken: string): Promise<boolean> {
		if (!sessionToken) return false;

		try {
			// ローカルストレージから検索
			if (typeof window !== 'undefined') {
				for (let i = 0; i < localStorage.length; i++) {
					const key = localStorage.key(i);
					if (key?.startsWith('wallet_session_')) {
						const data = localStorage.getItem(key);
						if (data) {
							const sessionData = JSON.parse(data);
							if (sessionData.token === sessionToken) {
								// 有効期限チェック
								if (Date.now() > sessionData.expires) {
									localStorage.removeItem(key);
									return false;
								}
								return true;
							}
						}
					}
				}
			}

			return false;
		} catch (error) {
			console.error('Session validation failed:', error);
			return false;
		}
	}

	async refreshSession(sessionToken: string): Promise<string> {
		const isValid = await this.validateSession(sessionToken);
		if (!isValid) {
			throw new Error('Invalid session token');
		}

		// 新しいトークンを生成
		const newToken = nanoid(64);
		const expires = Date.now() + this.SESSION_EXPIRY;

		// ローカルストレージで該当セッションを更新
		if (typeof window !== 'undefined') {
			for (let i = 0; i < localStorage.length; i++) {
				const key = localStorage.key(i);
				if (key?.startsWith('wallet_session_')) {
					const data = localStorage.getItem(key);
					if (data) {
						const sessionData = JSON.parse(data);
						if (sessionData.token === sessionToken) {
							sessionData.token = newToken;
							sessionData.expires = expires;
							localStorage.setItem(key, JSON.stringify(sessionData));
							break;
						}
					}
				}
			}
		}

		return newToken;
	}

	async destroySession(sessionToken: string): Promise<void> {
		// ローカルストレージから削除
		if (typeof window !== 'undefined') {
			for (let i = 0; i < localStorage.length; i++) {
				const key = localStorage.key(i);
				if (key?.startsWith('wallet_session_')) {
					const data = localStorage.getItem(key);
					if (data) {
						const sessionData = JSON.parse(data);
						if (sessionData.token === sessionToken) {
							localStorage.removeItem(key);

							// メモリからも削除
							const sessionKey = this.generateSessionKey(sessionData.address);
							this.sessionStorage.delete(sessionKey);
							break;
						}
					}
				}
			}
		}
	}

	// プライベートヘルパーメソッド
	private generateSessionKey(address: string): string {
		return `session_${address.toLowerCase()}`;
	}

	// セッションクリーンアップ（定期実行推奨）
	public cleanupExpiredSessions(): void {
		const now = Date.now();

		// メモリからクリーンアップ
		for (const [key, session] of this.sessionStorage.entries()) {
			if (now > session.expires) {
				this.sessionStorage.delete(key);
			}
		}

		// ローカルストレージからクリーンアップ
		if (typeof window !== 'undefined') {
			const keysToRemove: string[] = [];

			for (let i = 0; i < localStorage.length; i++) {
				const key = localStorage.key(i);
				if (key?.startsWith('wallet_session_')) {
					const data = localStorage.getItem(key);
					if (data) {
						try {
							const sessionData = JSON.parse(data);
							if (now > sessionData.expires) {
								keysToRemove.push(key);
							}
						} catch (error) {
							// 破損したデータも削除
							keysToRemove.push(key);
						}
					}
				}
			}

			keysToRemove.forEach(key => localStorage.removeItem(key));
		}
	}
}
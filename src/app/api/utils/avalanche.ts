// src/app/api/utils/avalanche.ts
import { ethers } from 'ethers';
import {
	AVALANCHE_FUJI_CONFIG,
	AVALANCHE_FUJI_RPC_ENDPOINTS,
	GAS_CONFIG,
	LOGGING_CONFIG,
	avaxToWei,
	weiToAVAX
} from '@/lib/avalanche-config';
import { DemoPaymentError } from '../../../../types/demo-payment';

/**
 * トランザクション情報
 */
interface TransactionInfo {
	hash: string;
	blockNumber: number | null;
	confirmations: number;
	from: string;
	to: string;
	value: string; // Wei
	gasPrice: string;
	gasUsed?: string;
	status: number | null; // 1 = success, 0 = failed
	timestamp?: number;
}

/**
 * 残高チェック結果
 */
interface BalanceCheckResult {
	currentBalance: string; // Wei
	currentBalanceAVAX: string; // AVAX
	requiredAmount: string; // Wei
	requiredAmountAVAX: string; // AVAX
	hasReceived: boolean;
	isExactMatch: boolean;
	isOverpayment: boolean;
	receivedAmount: string; // Wei (if any)
}

/**
 * Avalanche RPC接続管理クラス
 */
export class AvalancheRPCManager {
	private providers: ethers.JsonRpcProvider[];
	private currentProviderIndex: number = 0;
	private connectionAttempts: Map<string, number> = new Map();
	private maxRetries: number = 3;

	constructor() {
		// 複数のRPCエンドポイントでプロバイダー初期化
		this.providers = AVALANCHE_FUJI_RPC_ENDPOINTS.map(url => {
			return new ethers.JsonRpcProvider(url, {
				chainId: AVALANCHE_FUJI_CONFIG.chainId,
				name: AVALANCHE_FUJI_CONFIG.name
			});
		});

		if (LOGGING_CONFIG.enableDebugLogs) {
			console.log('🔗 AvalancheRPCManager initialized with', this.providers.length, 'providers');
		}
	}

	/**
	 * 現在のプロバイダー取得
	 */
	public getCurrentProvider(): ethers.JsonRpcProvider {
		return this.providers[this.currentProviderIndex];
	}

	/**
	 * 次のプロバイダーに切り替え
	 */
	private switchToNextProvider(): void {
		this.currentProviderIndex = (this.currentProviderIndex + 1) % this.providers.length;

		if (LOGGING_CONFIG.enableDebugLogs) {
			console.log('🔄 Switched to provider index:', this.currentProviderIndex);
		}
	}

	/**
	 * RPC接続テスト
	 */
	public async testConnection(): Promise<{ success: boolean; blockNumber?: number; error?: string }> {
		try {
			const provider = this.getCurrentProvider();
			const blockNumber = await provider.getBlockNumber();

			if (LOGGING_CONFIG.enableDebugLogs) {
				console.log('✅ RPC connection test successful, block number:', blockNumber);
			}

			return { success: true, blockNumber };
		} catch (error) {
			console.error('❌ RPC connection test failed:', error);

			// 他のプロバイダーを試す
			const originalIndex = this.currentProviderIndex;
			let attempts = 0;

			while (attempts < this.providers.length - 1) {
				this.switchToNextProvider();
				attempts++;

				try {
					const provider = this.getCurrentProvider();
					const blockNumber = await provider.getBlockNumber();

					if (LOGGING_CONFIG.enableDebugLogs) {
						console.log('✅ Fallback RPC connection successful, block number:', blockNumber);
					}

					return { success: true, blockNumber };
				} catch (fallbackError) {
					console.warn('⚠️ Fallback RPC also failed:', fallbackError);
				}
			}

			// 元のプロバイダーに戻す
			this.currentProviderIndex = originalIndex;

			return {
				success: false,
				error: error instanceof Error ? error.message : 'Unknown RPC error'
			};
		}
	}

	/**
	 * アドレスの残高取得
	 */
	public async getBalance(address: string): Promise<string> {
		try {
			if (!ethers.isAddress(address)) {
				throw new Error(`Invalid address: ${address}`);
			}

			const provider = this.getCurrentProvider();
			const balance = await provider.getBalance(address);

			if (LOGGING_CONFIG.enableDebugLogs) {
				console.log('💰 Balance for', address, ':', weiToAVAX(balance.toString()), 'AVAX');
			}

			return balance.toString();
		} catch (error) {
			console.error('❌ Error getting balance:', error);
			throw this.createAvalancheError('RPC_CONNECTION_FAILED', 'Failed to get balance', error);
		}
	}

	/**
	 * アドレスに対する支払いチェック
	 */
	public async checkPayment(
		address: string,
		expectedAmountWei: string,
		fromBlock?: number
	): Promise<BalanceCheckResult> {
		try {
			// 現在残高取得
			const currentBalanceWei = await this.getBalance(address);
			const currentBalanceAVAX = weiToAVAX(currentBalanceWei);
			const requiredAmountAVAX = weiToAVAX(expectedAmountWei);

			// 金額比較
			const currentBalance = BigInt(currentBalanceWei);
			const requiredAmount = BigInt(expectedAmountWei);

			const hasReceived = currentBalance >= requiredAmount;
			const isExactMatch = currentBalance === requiredAmount;
			const isOverpayment = currentBalance > requiredAmount;

			const result: BalanceCheckResult = {
				currentBalance: currentBalanceWei,
				currentBalanceAVAX,
				requiredAmount: expectedAmountWei,
				requiredAmountAVAX,
				hasReceived,
				isExactMatch,
				isOverpayment,
				receivedAmount: hasReceived ? currentBalanceWei : '0'
			};

			if (LOGGING_CONFIG.enableDebugLogs) {
				console.log('💳 Payment check result:', {
					address: address.substring(0, 10) + '...',
					hasReceived,
					currentBalanceAVAX,
					requiredAmountAVAX
				});
			}

			return result;
		} catch (error) {
			console.error('❌ Error checking payment:', error);
			throw this.createAvalancheError('PAYMENT_MONITORING_FAILED', 'Failed to check payment', error);
		}
	}

	/**
	 * トランザクション情報取得
	 */
	public async getTransactionInfo(txHash: string): Promise<TransactionInfo | null> {
		try {
			if (!txHash.startsWith('0x') || txHash.length !== 66) {
				throw new Error(`Invalid transaction hash: ${txHash}`);
			}

			const provider = this.getCurrentProvider();

			// トランザクション取得
			const tx = await provider.getTransaction(txHash);
			if (!tx) {
				return null;
			}

			// レシート取得（確認済みトランザクションの場合）
			const receipt = await provider.getTransactionReceipt(txHash);

			// 現在のブロック番号取得
			const currentBlock = await provider.getBlockNumber();

			const confirmations = tx.blockNumber ? currentBlock - tx.blockNumber + 1 : 0;

			const txInfo: TransactionInfo = {
				hash: tx.hash,
				blockNumber: tx.blockNumber,
				confirmations,
				from: tx.from,
				to: tx.to || '',
				value: tx.value.toString(),
				gasPrice: tx.gasPrice?.toString() || '0',
				gasUsed: receipt?.gasUsed?.toString(),
				status: receipt?.status ?? null,
				timestamp: tx.blockNumber ? (await provider.getBlock(tx.blockNumber))?.timestamp : undefined
			};

			if (LOGGING_CONFIG.enableDebugLogs) {
				console.log('📋 Transaction info retrieved:', {
					hash: txHash.substring(0, 10) + '...',
					confirmations,
					status: txInfo.status
				});
			}

			return txInfo;
		} catch (error) {
			console.error('❌ Error getting transaction info:', error);
			throw this.createAvalancheError('RPC_CONNECTION_FAILED', 'Failed to get transaction info', error);
		}
	}

	/**
	 * 最新ブロック番号取得
	 */
	public async getLatestBlockNumber(): Promise<number> {
		try {
			const provider = this.getCurrentProvider();
			const blockNumber = await provider.getBlockNumber();

			if (LOGGING_CONFIG.enableDebugLogs) {
				console.log('📦 Latest block number:', blockNumber);
			}

			return blockNumber;
		} catch (error) {
			console.error('❌ Error getting latest block number:', error);
			throw this.createAvalancheError('RPC_CONNECTION_FAILED', 'Failed to get latest block number', error);
		}
	}

	/**
	 * ガス価格取得
	 */
	public async getGasPrice(): Promise<string> {
		try {
			const provider = this.getCurrentProvider();
			const feeData = await provider.getFeeData();

			// EIP-1559対応: maxFeePerGas を優先、フォールバックでgasPrice
			const gasPrice = feeData.maxFeePerGas || feeData.gasPrice || BigInt(GAS_CONFIG.maxFeePerGas);

			if (LOGGING_CONFIG.enableDebugLogs) {
				console.log('⛽ Current gas price:', ethers.formatUnits(gasPrice, 'gwei'), 'gwei');
			}

			return gasPrice.toString();
		} catch (error) {
			console.error('❌ Error getting gas price:', error);
			// フォールバック値を返す
			return GAS_CONFIG.maxFeePerGas;
		}
	}

	/**
	 * アドレスのトランザクション履歴取得（制限付き）
	 */
	public async getRecentTransactions(
		address: string,
		fromBlock: number = 0,
		toBlock: number | 'latest' = 'latest'
	): Promise<TransactionInfo[]> {
		try {
			const provider = this.getCurrentProvider();

			// 受信トランザクションを検索
			const filter = {
				address: null,
				topics: null,
				fromBlock,
				toBlock
			};

			// 注意: この方法は効率的ではないため、本番環境では別のアプローチを検討
			console.warn('⚠️ getRecentTransactions は開発用です。本番環境では Indexing Service を使用してください。');

			return [];
		} catch (error) {
			console.error('❌ Error getting recent transactions:', error);
			return [];
		}
	}

	/**
	 * ネットワーク情報取得
	 */
	public async getNetworkInfo(): Promise<{ chainId: number; name: string; blockNumber: number }> {
		try {
			const provider = this.getCurrentProvider();
			const network = await provider.getNetwork();
			const blockNumber = await provider.getBlockNumber();

			const networkInfo = {
				chainId: Number(network.chainId),
				name: network.name,
				blockNumber
			};

			if (LOGGING_CONFIG.enableDebugLogs) {
				console.log('🌐 Network info:', networkInfo);
			}

			return networkInfo;
		} catch (error) {
			console.error('❌ Error getting network info:', error);
			throw this.createAvalancheError('RPC_CONNECTION_FAILED', 'Failed to get network info', error);
		}
	}

	/**
	 * エラーオブジェクト作成
	 */
	private createAvalancheError(
		code: 'RPC_CONNECTION_FAILED' | 'PAYMENT_MONITORING_FAILED',
		message: string,
		details?: any
	): DemoPaymentError {
		return {
			code,
			message,
			details,
			timestamp: new Date()
		};
	}
}

/**
 * シングルトンインスタンス
 */
let rpcManagerInstance: AvalancheRPCManager | null = null;

/**
 * RPC マネージャー取得（シングルトン）
 */
export function getAvalancheRPC(): AvalancheRPCManager {
	if (!rpcManagerInstance) {
		rpcManagerInstance = new AvalancheRPCManager();
	}
	return rpcManagerInstance;
}

/**
 * 簡単な残高チェック（便利関数）
 */
export async function checkAddressBalance(address: string): Promise<string> {
	const rpc = getAvalancheRPC();
	return await rpc.getBalance(address);
}

/**
 * 簡単な支払いチェック（便利関数）
 */
export async function checkPaymentReceived(
	address: string,
	expectedAmountWei: string
): Promise<boolean> {
	const rpc = getAvalancheRPC();
	const result = await rpc.checkPayment(address, expectedAmountWei);
	return result.hasReceived;
}

/**
 * RPC接続状態チェック
 */
export async function checkRPCHealth(): Promise<{ healthy: boolean; blockNumber?: number; error?: string }> {
	try {
		const rpc = getAvalancheRPC();
		const testResult = await rpc.testConnection();
		return {
			healthy: testResult.success,
			blockNumber: testResult.blockNumber,
			error: testResult.error
		};
	} catch (error) {
		return {
			healthy: false,
			error: error instanceof Error ? error.message : 'Unknown error'
		};
	}
}
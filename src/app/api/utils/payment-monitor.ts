// src/app/api/utils/payment-monitor.ts
import { Timestamp, doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
	DemoInvoiceDocument,
	DemoInvoiceStatus,
	DemoPaymentError
} from '@/types/demo-payment';
import {
	FIRESTORE_COLLECTIONS,
	PAYMENT_MONITOR_CONFIG,
	AVALANCHE_FUJI_CONFIG,
	LOGGING_CONFIG
} from '@/lib/avalanche-config';
import { getAvalancheRPC } from './avalanche';

/**
 * 決済監視結果
 */
export interface PaymentMonitorResult {
	invoiceId: string;
	status: DemoInvoiceStatus;
	hasPayment: boolean;
	transactionHash?: string;
	blockNumber?: number;
	confirmations?: number;
	paidAmount?: string;
	timeRemaining?: number; // seconds
	error?: string;
}

/**
 * 決済監視クラス
 */
export class PaymentMonitor {
	private rpc = getAvalancheRPC();

	/**
	 * Invoice情報をFirestoreから取得
	 */
	private async getInvoiceFromFirestore(invoiceId: string): Promise<DemoInvoiceDocument | null> {
		try {
			const docRef = doc(db, FIRESTORE_COLLECTIONS.DEMO_INVOICES, invoiceId);
			const docSnap = await getDoc(docRef);

			if (!docSnap.exists()) {
				return null;
			}

			const data = docSnap.data() as DemoInvoiceDocument;

			if (LOGGING_CONFIG.enableDebugLogs) {
				console.log('📄 Retrieved invoice from Firestore:', {
					invoiceId,
					status: data.status,
					address: data.paymentAddress.substring(0, 10) + '...'
				});
			}

			return data;
		} catch (error) {
			console.error('❌ Error retrieving invoice from Firestore:', error);
			throw this.createMonitorError('FIRESTORE_ERROR', 'Failed to retrieve invoice', error);
		}
	}

	/**
	 * Invoiceステータスを更新
	 */
	private async updateInvoiceStatus(
		invoiceId: string,
		updates: Partial<DemoInvoiceDocument>
	): Promise<void> {
		try {
			const docRef = doc(db, FIRESTORE_COLLECTIONS.DEMO_INVOICES, invoiceId);

			// updatedAtタイムスタンプを追加
			const updateData = {
				...updates,
				updatedAt: Timestamp.now()
			};

			await updateDoc(docRef, updateData);

			if (LOGGING_CONFIG.enableDebugLogs) {
				console.log('💾 Updated invoice status:', { invoiceId, updates: Object.keys(updates) });
			}
		} catch (error) {
			console.error('❌ Error updating invoice status:', error);
			throw this.createMonitorError('FIRESTORE_ERROR', 'Failed to update invoice status', error);
		}
	}

	/**
	 * Invoice期限切れチェック
	 */
	private checkInvoiceExpiry(invoice: DemoInvoiceDocument): boolean {
		const now = new Date();
		const expiresAt = invoice.expiresAt instanceof Timestamp
			? invoice.expiresAt.toDate()
			: new Date(invoice.expiresAt as any);

		return now > expiresAt;
	}

	/**
	 * 残り時間計算（秒）
	 */
	private calculateTimeRemaining(invoice: DemoInvoiceDocument): number {
		const now = new Date();
		const expiresAt = invoice.expiresAt instanceof Timestamp
			? invoice.expiresAt.toDate()
			: new Date(invoice.expiresAt as any);

		const remainingMs = expiresAt.getTime() - now.getTime();
		return Math.max(0, Math.floor(remainingMs / 1000));
	}

	/**
	 * アドレスの受信履歴をチェック（簡易版）
	 */
	private async scanForIncomingTransactions(
		address: string,
		expectedAmountWei: string
	): Promise<{ found: boolean; txHash?: string; blockNumber?: number; amount?: string }> {
		try {
			// 現在の残高チェック
			const balance = await this.rpc.getBalance(address);
			const expectedAmount = BigInt(expectedAmountWei);
			const currentBalance = BigInt(balance);

			if (currentBalance >= expectedAmount) {
				// 残高が期待値以上の場合、支払いありと判定
				// 注意: 実際のトランザクションハッシュ取得には別途実装が必要

				if (LOGGING_CONFIG.enableDebugLogs) {
					console.log('💰 Payment detected by balance check:', {
						address: address.substring(0, 10) + '...',
						expectedAmount: expectedAmountWei,
						currentBalance: balance,
						hasPayment: true
					});
				}

				return {
					found: true,
					amount: balance,
					// 注意: 実際の実装では、トランザクション履歴APIまたはイベントログを使用
					txHash: undefined,
					blockNumber: undefined
				};
			}

			return { found: false };
		} catch (error) {
			console.error('❌ Error scanning for transactions:', error);
			throw this.createMonitorError('PAYMENT_MONITORING_FAILED', 'Failed to scan for transactions', error);
		}
	}

	/**
	 * 特定のトランザクションの確認数チェック
	 */
	private async checkTransactionConfirmations(txHash: string): Promise<number> {
		try {
			const txInfo = await this.rpc.getTransactionInfo(txHash);

			if (!txInfo || !txInfo.blockNumber) {
				return 0;
			}

			return txInfo.confirmations;
		} catch (error) {
			console.error('❌ Error checking transaction confirmations:', error);
			return 0;
		}
	}

	/**
	 * メイン決済監視関数
	 */
	public async monitorPayment(invoiceId: string): Promise<PaymentMonitorResult> {
		try {
			// Invoiceデータ取得
			const invoice = await this.getInvoiceFromFirestore(invoiceId);

			if (!invoice) {
				return {
					invoiceId,
					status: 'error',
					hasPayment: false,
					error: 'Invoice not found'
				};
			}

			// 期限切れチェック
			if (this.checkInvoiceExpiry(invoice)) {
				// 期限切れの場合、ステータス更新
				if (invoice.status === 'pending') {
					await this.updateInvoiceStatus(invoiceId, { status: 'expired' });
				}

				return {
					invoiceId,
					status: 'expired',
					hasPayment: false,
					timeRemaining: 0
				};
			}

			// 残り時間計算
			const timeRemaining = this.calculateTimeRemaining(invoice);

			// すでに完了している場合
			if (invoice.status === 'completed') {
				return {
					invoiceId,
					status: 'completed',
					hasPayment: true,
					transactionHash: invoice.transactionHash,
					blockNumber: invoice.blockNumber,
					confirmations: invoice.confirmations,
					paidAmount: invoice.paidAmount,
					timeRemaining
				};
			}

			// トランザクション確認中の場合
			if (invoice.status === 'confirming' && invoice.transactionHash) {
				const confirmations = await this.checkTransactionConfirmations(invoice.transactionHash);

				// 十分な確認数に達した場合
				if (confirmations >= AVALANCHE_FUJI_CONFIG.confirmationBlocks) {
					await this.updateInvoiceStatus(invoiceId, {
						status: 'completed',
						confirmations,
						paidAt: Timestamp.now()
					});

					return {
						invoiceId,
						status: 'completed',
						hasPayment: true,
						transactionHash: invoice.transactionHash,
						blockNumber: invoice.blockNumber,
						confirmations,
						paidAmount: invoice.paidAmount,
						timeRemaining
					};
				} else {
					// まだ確認中
					await this.updateInvoiceStatus(invoiceId, { confirmations });

					return {
						invoiceId,
						status: 'confirming',
						hasPayment: true,
						transactionHash: invoice.transactionHash,
						blockNumber: invoice.blockNumber,
						confirmations,
						paidAmount: invoice.paidAmount,
						timeRemaining
					};
				}
			}

			// 新しい支払いをチェック（pending状態の場合）
			if (invoice.status === 'pending') {
				const paymentResult = await this.scanForIncomingTransactions(
					invoice.paymentAddress,
					invoice.amountWei
				);

				if (paymentResult.found) {
					// 支払い検出 - 確認中ステータスに更新
					const updates: Partial<DemoInvoiceDocument> = {
						status: 'confirming',
						paidAmount: paymentResult.amount,
						confirmations: 0
					};

					if (paymentResult.txHash) {
						updates.transactionHash = paymentResult.txHash;
					}
					if (paymentResult.blockNumber) {
						updates.blockNumber = paymentResult.blockNumber;
					}

					await this.updateInvoiceStatus(invoiceId, updates);

					if (LOGGING_CONFIG.enableAPILogs) {
						console.log('✅ Payment detected for invoice:', invoiceId);
					}

					return {
						invoiceId,
						status: 'confirming',
						hasPayment: true,
						transactionHash: paymentResult.txHash,
						blockNumber: paymentResult.blockNumber,
						confirmations: 0,
						paidAmount: paymentResult.amount,
						timeRemaining
					};
				}
			}

			// 支払い未検出
			return {
				invoiceId,
				status: invoice.status,
				hasPayment: false,
				timeRemaining
			};

		} catch (error) {
			console.error('❌ Payment monitoring error:', error);

			return {
				invoiceId,
				status: 'error',
				hasPayment: false,
				error: error instanceof Error ? error.message : 'Unknown monitoring error'
			};
		}
	}

	/**
	 * 複数Invoiceの一括監視
	 */
	public async monitorMultiplePayments(invoiceIds: string[]): Promise<PaymentMonitorResult[]> {
		try {
			// 並列処理で効率化
			const promises = invoiceIds.map(id => this.monitorPayment(id));
			const results = await Promise.all(promises);

			if (LOGGING_CONFIG.enableDebugLogs) {
				console.log('📊 Bulk payment monitoring completed:', {
					total: invoiceIds.length,
					completed: results.filter(r => r.status === 'completed').length,
					pending: results.filter(r => r.status === 'pending').length
				});
			}

			return results;
		} catch (error) {
			console.error('❌ Bulk payment monitoring error:', error);
			throw this.createMonitorError('PAYMENT_MONITORING_FAILED', 'Failed to monitor multiple payments', error);
		}
	}

	/**
	 * 期限切れInvoiceの一括更新
	 */
	public async expireOldInvoices(): Promise<{ expiredCount: number }> {
		try {
			// 注意: 実際の実装では、Firestoreクエリで期限切れInvoiceを検索
			// ここでは簡単な実装例を示す

			console.log('🧹 Starting expired invoice cleanup...');

			// TODO: Firestoreクエリで期限切れInvoiceを取得し、一括更新

			return { expiredCount: 0 };
		} catch (error) {
			console.error('❌ Error expiring old invoices:', error);
			throw this.createMonitorError('FIRESTORE_ERROR', 'Failed to expire old invoices', error);
		}
	}

	/**
	 * エラーオブジェクト作成
	 */
	private createMonitorError(
		code: 'FIRESTORE_ERROR' | 'PAYMENT_MONITORING_FAILED',
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
let paymentMonitorInstance: PaymentMonitor | null = null;

/**
 * Payment Monitor取得（シングルトン）
 */
export function getPaymentMonitor(): PaymentMonitor {
	if (!paymentMonitorInstance) {
		paymentMonitorInstance = new PaymentMonitor();
	}
	return paymentMonitorInstance;
}

/**
 * 簡単な決済チェック（便利関数）
 */
export async function checkInvoicePayment(invoiceId: string): Promise<PaymentMonitorResult> {
	const monitor = getPaymentMonitor();
	return await monitor.monitorPayment(invoiceId);
}

/**
 * 決済監視の統計情報取得
 */
export function getMonitoringStats(): {
	activeMonitors: number;
	checkInterval: number;
	confirmationBlocks: number;
} {
	return {
		activeMonitors: paymentMonitorInstance ? 1 : 0,
		checkInterval: PAYMENT_MONITOR_CONFIG.pollInterval,
		confirmationBlocks: AVALANCHE_FUJI_CONFIG.confirmationBlocks
	};
}
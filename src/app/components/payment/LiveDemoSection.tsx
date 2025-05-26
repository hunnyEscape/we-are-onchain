// src/app/components/payment/LiveDemoSection.tsx
'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
	Play,
	RefreshCw,
	CheckCircle,
	Clock,
	AlertCircle,
	XCircle,
	Zap,
	ExternalLink
} from 'lucide-react';
import CyberButton from '../common/CyberButton';
import CyberCard from '../common/CyberCard';
import QRCodeDisplay from './QRCodeDisplay';
import { CreateDemoInvoiceResponse, DemoInvoiceStatusResponse } from '@/types/demo-payment';

/**
 * デモの状態管理（API型に合わせて拡張）
 */
type DemoStatus = 'idle' | 'generating' | 'pending' | 'waiting' | 'confirming' | 'completed' | 'expired' | 'error';

/**
 * デモ決済の状態
 */
interface DemoState {
	status: DemoStatus;
	invoiceId?: string;
	paymentAddress?: string;
	amount?: string;
	qrCodeDataURL?: string;
	paymentURI?: string;
	expiresAt?: string;
	timeRemaining?: number;
	transactionHash?: string;
	confirmations?: number;
	errorMessage?: string;
}

/**
 * ライブデモセクションコンポーネント
 */
const LiveDemoSection: React.FC = () => {
	const [demoState, setDemoState] = useState<DemoState>({ status: 'idle' });
	const [isPolling, setIsPolling] = useState(false);

	// ポーリング管理用ref
	const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
	const timeoutRef = useRef<NodeJS.Timeout | null>(null);

	/**
	 * ポーリング停止
	 */
	const stopPolling = useCallback(() => {
		if (pollingIntervalRef.current) {
			clearInterval(pollingIntervalRef.current);
			pollingIntervalRef.current = null;
		}
		if (timeoutRef.current) {
			clearTimeout(timeoutRef.current);
			timeoutRef.current = null;
		}
		setIsPolling(false);
	}, []);

	/**
	 * コンポーネントアンマウント時のクリーンアップ
	 */
	useEffect(() => {
		return () => {
			stopPolling();
		};
	}, [stopPolling]);

	/**
	 * 時間フォーマット（秒 → mm:ss）
	 */
	const formatTime = useCallback((seconds: number): string => {
		const minutes = Math.floor(seconds / 60);
		const remainingSeconds = seconds % 60;
		return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
	}, []);

	/**
	 * ステータス確認API呼び出し
	 */
	const checkInvoiceStatus = useCallback(async (invoiceId: string): Promise<void> => {
		try {
			const response = await fetch(`/api/demo/invoice/${invoiceId}/status`);
			const data: DemoInvoiceStatusResponse = await response.json();

			if (!data.success) {
				throw new Error(data.error?.message || 'Status check failed');
			}

			const statusData = data.data!;

			// API の status を UI の status にマッピング
			let uiStatus: DemoStatus = statusData.status as DemoStatus;
			if (statusData.status === 'pending') {
				uiStatus = 'waiting'; // APIの'pending'をUIの'waiting'にマッピング
			}

			// 状態更新
			setDemoState(prev => ({
				...prev,
				status: uiStatus,
				timeRemaining: statusData.timeRemaining,
				transactionHash: statusData.transactionHash,
				confirmations: statusData.confirmations
			}));

			// 完了・期限切れ・エラー時はポーリング停止
			if (['completed', 'expired', 'error'].includes(uiStatus)) {
				stopPolling();
			}

			console.log('📊 Status updated:', {
				invoiceId,
				apiStatus: statusData.status,
				uiStatus: uiStatus,
				timeRemaining: statusData.timeRemaining
			});

		} catch (error) {
			console.error('❌ Status check failed:', error);
			setDemoState(prev => ({
				...prev,
				status: 'error',
				errorMessage: error instanceof Error ? error.message : 'Status check failed'
			}));
			stopPolling();
		}
	}, [stopPolling]);

	/**
	 * ポーリング開始
	 */
	const startPolling = useCallback((invoiceId: string) => {
		setIsPolling(true);

		// 即座に1回チェック
		checkInvoiceStatus(invoiceId);

		// 5秒間隔でポーリング
		pollingIntervalRef.current = setInterval(() => {
			checkInvoiceStatus(invoiceId);
		}, 5000);

		// 5分後に自動停止
		timeoutRef.current = setTimeout(() => {
			stopPolling();
			setDemoState(prev => ({
				...prev,
				status: 'expired'
			}));
		}, 5 * 60 * 1000);

		console.log('🔄 Started polling for invoice:', invoiceId);
	}, [checkInvoiceStatus, stopPolling]);

	/**
	 * デモInvoice生成
	 */
	const generateDemoInvoice = useCallback(async () => {
		try {
			setDemoState({ status: 'generating' });

			const response = await fetch('/api/demo/invoice/create', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					chainId: 43113 // Avalanche FUJI
				}),
			});

			const data: CreateDemoInvoiceResponse = await response.json();

			if (!data.success) {
				throw new Error(data.error?.message || 'Invoice generation failed');
			}

			const invoiceData = data.data!;

			// 状態更新
			setDemoState({
				status: 'waiting',
				invoiceId: invoiceData.invoiceId,
				paymentAddress: invoiceData.paymentAddress,
				amount: invoiceData.amount,
				qrCodeDataURL: invoiceData.qrCodeDataURL,
				paymentURI: invoiceData.paymentURI,
				expiresAt: invoiceData.expiresAt,
				timeRemaining: 300 // 5分
			});

			// ポーリング開始
			startPolling(invoiceData.invoiceId);

			console.log('✅ Demo invoice generated:', {
				invoiceId: invoiceData.invoiceId,
				address: invoiceData.paymentAddress.substring(0, 10) + '...'
			});

		} catch (error) {
			console.error('❌ Invoice generation failed:', error);
			setDemoState({
				status: 'error',
				errorMessage: error instanceof Error ? error.message : 'Failed to generate invoice'
			});
		}
	}, [startPolling]);

	/**
	 * デモリセット
	 */
	const resetDemo = useCallback(() => {
		stopPolling();
		setDemoState({ status: 'idle' });
		console.log('🔄 Demo reset');
	}, [stopPolling]);

	/**
	 * コピー時のフィードバック
	 */
	const handleCopy = useCallback((text: string, type: 'address' | 'uri') => {
		console.log(`📋 ${type} copied:`, text.substring(0, 20) + '...');
	}, []);

	/**
	 * ブロックエクスプローラーリンク
	 */
	const getExplorerLink = useCallback((txHash: string) => {
		return `https://testnet.snowscan.xyz/tx/${txHash}`;
	}, []);

	/**
	 * ステータスアイコン取得
	 */
	const getStatusIcon = () => {
		switch (demoState.status) {
			case 'generating':
				return <RefreshCw className="w-5 h-5 text-blue-400 animate-spin" />;
			case 'waiting':
				return <Clock className="w-5 h-5 text-yellow-400" />;
			case 'confirming':
				return <Zap className="w-5 h-5 text-orange-400" />;
			case 'completed':
				return <CheckCircle className="w-5 h-5 text-green-400" />;
			case 'expired':
				return <XCircle className="w-5 h-5 text-red-400" />;
			case 'error':
				return <AlertCircle className="w-5 h-5 text-red-400" />;
			default:
				return <Play className="w-5 h-5 text-neonGreen" />;
		}
	};

	/**
	 * ステータステキスト取得
	 */
	const getStatusText = () => {
		switch (demoState.status) {
			case 'idle':
				return 'Ready to start demo';
			case 'generating':
				return 'Generating payment invoice...';
			case 'pending':
			case 'waiting':
				return 'Waiting for payment';
			case 'confirming':
				return `Confirming transaction (${demoState.confirmations || 0}/3 confirmations)`;
			case 'completed':
				return 'Payment completed successfully!';
			case 'expired':
				return 'Demo payment expired';
			case 'error':
				return 'Error occurred';
			default:
				return 'Unknown status';
		}
	};

	return (
		<div className="space-y-6">
			{/* ヘッダー */}
			<div className="text-center">
				<h4 className="text-lg font-semibold text-white mb-2 flex items-center justify-center space-x-2">
					{getStatusIcon()}
					<span>Live Payment Demo</span>
				</h4>
				<p className="text-sm text-gray-400">
					Try demo payment with 0.001 AVAX on Avalanche FUJI Testnet
				</p>
			</div>

			{/* ステータス表示 */}
			<CyberCard showEffects={false} className="text-center">
				<div className="space-y-4">
					{/* ステータスインジケーター */}
					<div className="flex items-center justify-center space-x-3">
						{getStatusIcon()}
						<span className="text-white font-medium">
							{getStatusText()}
						</span>
					</div>

					{/* タイマー表示 */}
					{demoState.timeRemaining !== undefined && ['pending', 'waiting'].includes(demoState.status) && (
						<div className="text-center">
							<div className="text-2xl font-bold text-yellow-400 font-mono">
								{formatTime(demoState.timeRemaining)}
							</div>
							<div className="text-xs text-gray-400">
								Time remaining
							</div>
						</div>
					)}

					{/* エラーメッセージ */}
					{demoState.status === 'error' && demoState.errorMessage && (
						<div className="p-3 bg-red-900/20 border border-red-600/30 rounded-sm">
							<div className="text-sm text-red-400">
								{demoState.errorMessage}
							</div>
						</div>
					)}

					{/* 完了時のトランザクション情報 */}
					{demoState.status === 'completed' && demoState.transactionHash && (
						<div className="p-3 bg-green-900/20 border border-green-600/30 rounded-sm">
							<div className="text-sm text-green-400 mb-2">
								Transaction confirmed!
							</div>
							<CyberButton
								size="sm"
								variant="outline"
								onClick={() => window.open(getExplorerLink(demoState.transactionHash!), '_blank')}
								className="flex items-center space-x-1"
							>
								<ExternalLink className="w-3 h-3" />
								<span>View on Explorer</span>
							</CyberButton>
						</div>
					)}

					{/* アクションボタン */}
					<div className="flex justify-center space-x-3">
						{demoState.status === 'idle' && (
							<CyberButton
								variant="primary"
								onClick={generateDemoInvoice}
								className="flex items-center space-x-2"
							>
								<Play className="w-4 h-4" />
								<span>Generate Demo Invoice</span>
							</CyberButton>
						)}

						{['completed', 'expired', 'error'].includes(demoState.status) && (
							<CyberButton
								variant="secondary"
								onClick={resetDemo}
								className="flex items-center space-x-2"
							>
								<RefreshCw className="w-4 h-4" />
								<span>Try Again</span>
							</CyberButton>
						)}

						{['waiting', 'confirming', 'pending'].includes(demoState.status) && (
							<CyberButton
								variant="outline"
								onClick={resetDemo}
								className="flex items-center space-x-2"
							>
								<XCircle className="w-4 h-4" />
								<span>Cancel</span>
							</CyberButton>
						)}
					</div>
				</div>
			</CyberCard>

			{/* QRコード表示 */}
			{['waiting', 'confirming', 'completed', 'pending'].includes(demoState.status) &&
				demoState.qrCodeDataURL && demoState.paymentURI && demoState.paymentAddress && (<>
					<QRCodeDisplay
						qrCodeDataURL={demoState.qrCodeDataURL}
						paymentURI={demoState.paymentURI}
						paymentAddress={demoState.paymentAddress}
						amount={demoState.amount || '0.001'}
						chainId={43113}
						onCopy={handleCopy}
						showMetadata={true}
					/>
					<div className="mt-4 text-center">
						<button
							onClick={() => {
								window.location.href = demoState.paymentURI!;
							}}
							className="inline-block px-4 py-2 bg-neonGreen text-black font-semibold rounded-md hover:bg-neonGreen/90"
						>
							Pay with Wallet
						</button>
					</div>
				</>)}

			{/* 使用方法説明 */}
			{demoState.status === 'idle' && (
				<div className="bg-blue-900/20 border border-blue-600/30 rounded-sm p-4">
					<h5 className="text-blue-400 font-medium mb-2">📖 How to use this demo</h5>
					<div className="text-sm text-gray-300 space-y-1">
						<div>1. Click "Generate Demo Invoice" to create a payment request</div>
						<div>2. Scan the QR code with your mobile wallet (or copy the address)</div>
						<div>3. Send exactly 0.001 AVAX to the displayed address</div>
						<div>4. Watch the real-time payment confirmation</div>
					</div>
					<div className="mt-3 text-xs text-blue-300">
						💡 Need FUJI testnet tokens? Get them from the{' '}
						<a
							href="https://faucet.avax.network/"
							target="_blank"
							rel="noopener noreferrer"
							className="underline hover:text-blue-200"
						>
							Avalanche Faucet
						</a>
					</div>
				</div>
			)}

			{/* デバッグ情報（開発環境のみ） */}
			{process.env.NODE_ENV === 'development' && (
				<div className="bg-yellow-900/20 border border-yellow-600/30 rounded-sm p-3">
					<div className="text-xs text-yellow-400 font-mono">
						🔧 Debug: Status={demoState.status} |
						Polling={isPolling.toString()} |
						ID={demoState.invoiceId || 'none'}
					</div>
				</div>
			)}
		</div>
	);
};

export default LiveDemoSection;
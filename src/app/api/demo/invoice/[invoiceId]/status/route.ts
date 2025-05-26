// src/app/api/demo/invoice/[invoiceId]/status/route.ts
import { NextRequest, NextResponse } from 'next/server';
import {
	DemoInvoiceStatusResponse,
	DemoPaymentErrorCode
} from '@/types/demo-payment';
import {
	LOGGING_CONFIG,
	getExplorerURL
} from '@/lib/avalanche-config';
import { checkInvoicePayment, getPaymentMonitor } from '../../../../utils/payment-monitor';

/**
 * パラメータ型定義
 */
interface RouteParams {
	params: {
		invoiceId: string;
	};
}

/**
 * Invoice ID バリデーション
 */
function validateInvoiceId(invoiceId: string): { valid: boolean; error?: string } {
	if (!invoiceId || typeof invoiceId !== 'string') {
		return { valid: false, error: 'Invoice ID is required' };
	}

	if (!invoiceId.startsWith('demo_')) {
		return { valid: false, error: 'Invalid invoice ID format' };
	}

	if (invoiceId.length < 10 || invoiceId.length > 50) {
		return { valid: false, error: 'Invalid invoice ID length' };
	}

	// 英数字とアンダースコアのみ許可
	if (!/^demo_[a-zA-Z0-9_-]+$/.test(invoiceId)) {
		return { valid: false, error: 'Invalid invoice ID characters' };
	}

	return { valid: true };
}

/**
 * エラーレスポンス生成
 */
function createErrorResponse(
	code: DemoPaymentErrorCode,
	message: string,
	status: number = 400
): NextResponse<DemoInvoiceStatusResponse> {
	return NextResponse.json({
		success: false,
		error: { code, message }
	}, { status });
}

/**
 * CORS ヘッダー設定
 */
function setCORSHeaders(headers: Headers): void {
	headers.set('Access-Control-Allow-Origin', '*');
	headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
	headers.set('Access-Control-Allow-Headers', 'Content-Type');
	headers.set('Access-Control-Max-Age', '86400');
}

/**
 * キャッシュヘッダー設定
 */
function setCacheHeaders(headers: Headers, maxAge: number = 5): void {
	headers.set('Cache-Control', `public, max-age=${maxAge}, s-maxage=${maxAge}`);
	headers.set('Vary', 'Accept-Encoding');
}

/**
 * GET /api/demo/invoice/[invoiceId]/status
 */
export async function GET(
	request: NextRequest,
	{ params }: RouteParams
): Promise<NextResponse<DemoInvoiceStatusResponse>> {
	const startTime = Date.now();

	try {
		if (LOGGING_CONFIG.enableAPILogs) {
			console.log('📊 Invoice status check request:', { invoiceId: params.invoiceId });
		}

		// Invoice ID バリデーション
		const validation = validateInvoiceId(params.invoiceId);
		if (!validation.valid) {
			return createErrorResponse(
				'INVOICE_NOT_FOUND',
				validation.error || 'Invalid invoice ID',
				400
			);
		}

		// 決済監視実行
		let monitorResult;
		try {
			monitorResult = await checkInvoicePayment(params.invoiceId);
		} catch (error) {
			console.error('❌ Payment monitoring failed:', error);

			if (error instanceof Error) {
				// 特定エラーのハンドリング
				if (error.message.includes('not found')) {
					return createErrorResponse(
						'INVOICE_NOT_FOUND',
						'Invoice not found',
						404
					);
				}

				if (error.message.includes('network') || error.message.includes('RPC')) {
					return createErrorResponse(
						'RPC_CONNECTION_FAILED',
						'Network connection error',
						503
					);
				}
			}

			return createErrorResponse(
				'PAYMENT_MONITORING_FAILED',
				'Failed to check payment status',
				500
			);
		}

		// エラー状態の処理
		if (monitorResult.status === 'error') {
			if (monitorResult.error?.includes('not found')) {
				return createErrorResponse(
					'INVOICE_NOT_FOUND',
					'Invoice not found',
					404
				);
			}

			return createErrorResponse(
				'PAYMENT_MONITORING_FAILED',
				monitorResult.error || 'Payment monitoring error',
				500
			);
		}

		// レスポンスデータ作成
		const responseData: DemoInvoiceStatusResponse['data'] = {
			invoiceId: params.invoiceId,
			status: monitorResult.status,
			paymentAddress: '', // monitorResultに含まれていない場合は空文字
			amount: '', // monitorResultに含まれていない場合は空文字
			chainId: 43113, // FUJI固定
			createdAt: '', // 実際の実装では取得する
			expiresAt: '', // 実際の実装では取得する
			timeRemaining: monitorResult.timeRemaining
		};

		// 支払い完了情報の追加
		if (monitorResult.hasPayment) {
			responseData.transactionHash = monitorResult.transactionHash;
			responseData.blockNumber = monitorResult.blockNumber;
			responseData.confirmations = monitorResult.confirmations;
			responseData.paidAt = ''; // 実際の実装では正確な日時を設定
		}

		// レスポンス作成
		const response: DemoInvoiceStatusResponse = {
			success: true,
			data: responseData
		};

		// レスポンスヘッダー設定
		const headers = new Headers();
		setCORSHeaders(headers);

		// ステータスに応じたキャッシュ設定
		if (monitorResult.status === 'completed') {
			setCacheHeaders(headers, 300); // 5分キャッシュ（完了状態）
		} else if (monitorResult.status === 'expired') {
			setCacheHeaders(headers, 3600); // 1時間キャッシュ（期限切れ）
		} else {
			setCacheHeaders(headers, 5); // 5秒キャッシュ（進行中）
		}

		// パフォーマンス計測
		const duration = Date.now() - startTime;
		headers.set('X-Response-Time', `${duration}ms`);
		headers.set('X-Invoice-Status', monitorResult.status);

		if (monitorResult.hasPayment) {
			headers.set('X-Payment-Detected', 'true');
		}

		// 追加情報ヘッダー
		if (monitorResult.transactionHash) {
			headers.set('X-Transaction-Hash', monitorResult.transactionHash);
			headers.set('X-Explorer-URL', getExplorerURL('tx', monitorResult.transactionHash));
		}

		if (LOGGING_CONFIG.enableAPILogs) {
			console.log('✅ Invoice status check completed:', {
				invoiceId: params.invoiceId,
				status: monitorResult.status,
				hasPayment: monitorResult.hasPayment,
				duration: `${duration}ms`
			});
		}

		return NextResponse.json(response, {
			status: 200,
			headers
		});

	} catch (error) {
		const duration = Date.now() - startTime;

		console.error('❌ Unexpected error in status check:', {
			invoiceId: params.invoiceId,
			error,
			duration: `${duration}ms`
		});

		return createErrorResponse(
			'PAYMENT_MONITORING_FAILED',
			'Internal server error',
			500
		);
	}
}

/**
 * POST /api/demo/invoice/[invoiceId]/status (method not allowed)
 */
export async function POST(): Promise<NextResponse> {
	return NextResponse.json(
		{ error: 'Method not allowed. Use GET to check invoice status.' },
		{ status: 405 }
	);
}

/**
 * PUT /api/demo/invoice/[invoiceId]/status (method not allowed)
 */
export async function PUT(): Promise<NextResponse> {
	return NextResponse.json(
		{ error: 'Method not allowed. Invoice status updates are automatic.' },
		{ status: 405 }
	);
}

/**
 * DELETE /api/demo/invoice/[invoiceId]/status (method not allowed)
 */
export async function DELETE(): Promise<NextResponse> {
	return NextResponse.json(
		{ error: 'Method not allowed. Invoices expire automatically.' },
		{ status: 405 }
	);
}

/**
 * OPTIONS /api/demo/invoice/[invoiceId]/status (CORS preflight)
 */
export async function OPTIONS(): Promise<NextResponse> {
	const headers = new Headers();
	setCORSHeaders(headers);

	return new NextResponse(null, {
		status: 200,
		headers
	});
}

/**
 * PATCH /api/demo/invoice/[invoiceId]/status (管理用 - 将来実装)
 */
export async function PATCH(
	request: NextRequest,
	{ params }: RouteParams
): Promise<NextResponse> {
	// 将来の管理機能用（現在は無効）
	return NextResponse.json(
		{ error: 'Manual status updates are not currently supported.' },
		{ status: 501 }
	);
}
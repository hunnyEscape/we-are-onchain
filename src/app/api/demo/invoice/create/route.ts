// src/app/api/demo/invoice/create/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { serverTimestamp } from 'firebase/firestore';
import {
	CreateDemoInvoiceRequest,
	CreateDemoInvoiceResponse,
	DemoInvoiceDocument,
	DemoPaymentErrorCode
} from '@/types/demo-payment';
import {
	DEMO_PAYMENT_CONFIG,
	AVALANCHE_FUJI_CONFIG,
	RATE_LIMIT_CONFIG,
	FIRESTORE_COLLECTIONS,
	avaxToWei,
	LOGGING_CONFIG,
	validateEnvironmentVariables
} from '@/lib/avalanche-config';
import { generateDemoWallet } from '../../../utils/wallet-generator';
import { generatePaymentQRCode } from '../../../utils/qr-generator';
import { getAvalancheRPC } from '../../../utils/avalanche';
import { doc, setDoc, collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

/**
 * Rate limiting用のメモリキャッシュ
 */
interface RateLimitEntry {
	count: number;
	windowStart: number;
}

const rateLimitCache = new Map<string, RateLimitEntry>();

/**
 * IPアドレス取得
 */
function getClientIP(request: NextRequest): string {
	const forwarded = request.headers.get('x-forwarded-for');
	const realIP = request.headers.get('x-real-ip');
	const remoteAddr = request.headers.get('x-remote-addr');

	if (forwarded) {
		return forwarded.split(',')[0].trim();
	}
	if (realIP) {
		return realIP;
	}
	if (remoteAddr) {
		return remoteAddr;
	}

	return 'unknown';
}

/**
 * Rate limiting チェック
 */
function checkRateLimit(ip: string): { allowed: boolean; remaining: number } {
	const now = Date.now();
	const windowMs = RATE_LIMIT_CONFIG.windowMinutes * 60 * 1000;

	const entry = rateLimitCache.get(ip);

	if (!entry) {
		// 新しいIP
		rateLimitCache.set(ip, { count: 1, windowStart: now });
		return { allowed: true, remaining: RATE_LIMIT_CONFIG.maxInvoicesPerIP - 1 };
	}

	// ウィンドウ期間をチェック
	if (now - entry.windowStart > windowMs) {
		// 新しいウィンドウ
		rateLimitCache.set(ip, { count: 1, windowStart: now });
		return { allowed: true, remaining: RATE_LIMIT_CONFIG.maxInvoicesPerIP - 1 };
	}

	// 現在のウィンドウ内での制限チェック
	if (entry.count >= RATE_LIMIT_CONFIG.maxInvoicesPerIP) {
		return { allowed: false, remaining: 0 };
	}

	// カウント更新
	entry.count++;
	rateLimitCache.set(ip, entry);

	return { allowed: true, remaining: RATE_LIMIT_CONFIG.maxInvoicesPerIP - entry.count };
}

/**
 * Rate limiting キャッシュクリーンアップ
 */
function cleanupRateLimit(): void {
	const now = Date.now();
	const windowMs = RATE_LIMIT_CONFIG.windowMinutes * 60 * 1000;

	for (const [ip, entry] of rateLimitCache.entries()) {
		if (now - entry.windowStart > windowMs) {
			rateLimitCache.delete(ip);
		}
	}
}

/**
 * エラーレスポンス生成
 */
function createErrorResponse(
	code: DemoPaymentErrorCode,
	message: string,
	status: number = 400,
	details?: any
): NextResponse<CreateDemoInvoiceResponse> {
	return NextResponse.json({
		success: false,
		error: { code, message, details }
	}, { status });
}

/**
 * 環境変数検証
 */
function validateEnvironment(): { valid: boolean; error?: string } {
	const validation = validateEnvironmentVariables();

	if (!validation.isValid) {
		return {
			valid: false,
			error: `Missing environment variables: ${validation.missingVars.join(', ')}`
		};
	}

	return { valid: true };
}

/**
 * POST /api/demo/invoice/create
 */
export async function POST(request: NextRequest): Promise<NextResponse<CreateDemoInvoiceResponse>> {
	try {
		if (LOGGING_CONFIG.enableAPILogs) {
			console.log('📋 Demo invoice creation request received');
		}

		// 環境変数検証
		const envValidation = validateEnvironment();
		if (!envValidation.valid) {
			console.error('❌ Environment validation failed:', envValidation.error);
			return createErrorResponse(
				'RPC_CONNECTION_FAILED',
				'Server configuration error',
				500
			);
		}

		// Rate limiting クリーンアップ
		cleanupRateLimit();

		// クライアントIP取得
		const clientIP = getClientIP(request);

		// Rate limiting チェック
		const rateLimitResult = checkRateLimit(clientIP);
		if (!rateLimitResult.allowed) {
			if (LOGGING_CONFIG.enableAPILogs) {
				console.warn('⚠️ Rate limit exceeded for IP:', clientIP);
			}

			return createErrorResponse(
				'RATE_LIMIT_EXCEEDED',
				`Too many requests. Maximum ${RATE_LIMIT_CONFIG.maxInvoicesPerIP} invoices per ${RATE_LIMIT_CONFIG.windowMinutes} minutes.`,
				429
			);
		}

		// リクエストボディ解析
		let requestBody: CreateDemoInvoiceRequest;
		try {
			requestBody = await request.json();
		} catch {
			requestBody = {}; // デフォルト値使用
		}

		// チェーンID検証
		const chainId = requestBody.chainId || AVALANCHE_FUJI_CONFIG.chainId;
		if (chainId !== AVALANCHE_FUJI_CONFIG.chainId) {
			return createErrorResponse(
				'INVALID_CHAIN_ID',
				`Unsupported chain ID: ${chainId}. Only Avalanche FUJI (${AVALANCHE_FUJI_CONFIG.chainId}) is supported.`
			);
		}

		// Invoice ID生成
		const invoiceId = `demo_${nanoid(16)}`;

		// ユーザーエージェント取得
		const userAgent = request.headers.get('user-agent') || 'Unknown';

		if (LOGGING_CONFIG.enableDebugLogs) {
			console.log('🆔 Generated invoice ID:', invoiceId);
		}

		// ウォレット生成
		let wallet;
		try {
			wallet = generateDemoWallet(invoiceId);
		} catch (error) {
			console.error('❌ Wallet generation failed:', error);
			return createErrorResponse(
				'WALLET_GENERATION_FAILED',
				'Failed to generate payment wallet',
				500,
				error
			);
		}

		// 金額設定（Wei変換）
		const amountAVAX = DEMO_PAYMENT_CONFIG.defaultAmount;
		const amountWei = avaxToWei(amountAVAX);

		// RPC接続テスト
		try {
			const rpc = getAvalancheRPC();
			const connectionTest = await rpc.testConnection();

			if (!connectionTest.success) {
				console.error('❌ RPC connection test failed:', connectionTest.error);
				return createErrorResponse(
					'RPC_CONNECTION_FAILED',
					'Unable to connect to Avalanche network',
					503
				);
			}
		} catch (error) {
			console.error('❌ RPC connection error:', error);
			return createErrorResponse(
				'RPC_CONNECTION_FAILED',
				'Network connection error',
				503
			);
		}

		// QRコード生成
		let qrCode;
		try {
			qrCode = await generatePaymentQRCode(wallet.address, amountWei, chainId);
		} catch (error) {
			console.error('❌ QR code generation failed:', error);
			return createErrorResponse(
				'QR_GENERATION_FAILED',
				'Failed to generate QR code',
				500,
				error
			);
		}

		// 有効期限設定
		const now = new Date();
		const expiresAt = new Date(now.getTime() + (DEMO_PAYMENT_CONFIG.expiryMinutes * 60 * 1000));

		// Firestore保存用データ準備
		const invoiceDocument: Omit<DemoInvoiceDocument, 'createdAt' | 'expiresAt'> & {
			createdAt: any;
			expiresAt: any;
		} = {
			invoiceId,
			paymentAddress: wallet.address,
			privateKey: wallet.privateKey, // 注意: 本番環境では暗号化が必要
			amount: amountAVAX,
			amountWei: amountWei,
			chainId,
			status: 'pending',
			userAgent,
			ipAddress: clientIP,
			createdAt: serverTimestamp(),
			expiresAt: Timestamp.fromDate(expiresAt)
		};

		// Firestoreに保存
		try {
			const docRef = doc(db, FIRESTORE_COLLECTIONS.DEMO_INVOICES, invoiceId);
			await setDoc(docRef, invoiceDocument);

			if (LOGGING_CONFIG.enableDebugLogs) {
				console.log('💾 Invoice saved to Firestore:', invoiceId);
			}
		} catch (error) {
			console.error('❌ Firestore save failed:', error);
			return createErrorResponse(
				'FIRESTORE_ERROR',
				'Failed to save invoice',
				500,
				error
			);
		}

		// ガス代見積もり（簡易版）
		const estimatedGasFee = '0.0005'; // 固定値（実際は動的に計算可能）

		// レスポンス作成
		const response: CreateDemoInvoiceResponse = {
			success: true,
			data: {
				invoiceId,
				paymentAddress: wallet.address,
				amount: amountAVAX,
				amountWei: amountWei,
				chainId,
				qrCodeDataURL: qrCode.dataURL,
				paymentURI: qrCode.paymentURI,
				expiresAt: expiresAt.toISOString(),
				estimatedGasFee
			}
		};

		// レスポンスヘッダー設定
		const headers = new Headers();
		headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString());
		headers.set('X-RateLimit-Limit', RATE_LIMIT_CONFIG.maxInvoicesPerIP.toString());
		headers.set('X-Invoice-ID', invoiceId);

		if (LOGGING_CONFIG.enableAPILogs) {
			console.log('✅ Demo invoice created successfully:', {
				invoiceId,
				address: wallet.address.substring(0, 10) + '...',
				amount: amountAVAX,
				expiresAt: expiresAt.toISOString()
			});
		}

		return NextResponse.json(response, {
			status: 201,
			headers
		});

	} catch (error) {
		console.error('❌ Unexpected error in invoice creation:', error);

		return createErrorResponse(
			'RPC_CONNECTION_FAILED',
			'Internal server error',
			500,
			LOGGING_CONFIG.enableDebugLogs ? error : undefined
		);
	}
}

/**
 * GET /api/demo/invoice/create (method not allowed)
 */
export async function GET(): Promise<NextResponse> {
	return NextResponse.json(
		{ error: 'Method not allowed. Use POST to create invoices.' },
		{ status: 405 }
	);
}

/**
 * OPTIONS /api/demo/invoice/create (CORS preflight)
 */
export async function OPTIONS(): Promise<NextResponse> {
	return new NextResponse(null, {
		status: 200,
		headers: {
			'Access-Control-Allow-Methods': 'POST',
			'Access-Control-Allow-Headers': 'Content-Type',
		},
	});
}
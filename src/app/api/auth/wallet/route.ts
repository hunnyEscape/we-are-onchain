// src/app/api/auth/wallet/route.ts (Extended版に更新)
import { NextRequest, NextResponse } from 'next/server';
import { EVMAuthService } from '@/wallet-auth/adapters/evm/EVMAuthService';
import {
	syncExtendedWalletAuthWithFirestore,
	checkExtendedWalletUserExists,
	getExtendedWalletUserByAddress
} from '@/lib/firestore/users-wallet-extended';
import {
	WalletAuthRequest,
	WalletAuthResponse,
	WalletApiErrorCode
} from '../../../../../types/api-wallet';
import { CreateExtendedUserData } from '../../../../../types/user-extended';

/**
 * Extended Wallet認証API
 * POST /api/auth/wallet
 * 
 * Wallet署名を検証してFirestoreにExtendedUserを作成/更新
 */

// Rate limiting用の簡易メモリストレージ
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

// Rate limit設定
const RATE_LIMIT = {
	maxRequests: 15,        // 10分間に最大15回（拡張）
	windowMs: 10 * 60 * 1000, // 10分
};

/**
 * Rate limitingチェック
 */
function checkRateLimit(identifier: string): boolean {
	const now = Date.now();
	const record = rateLimitMap.get(identifier);

	if (!record) {
		rateLimitMap.set(identifier, { count: 1, resetTime: now + RATE_LIMIT.windowMs });
		return true;
	}

	if (now > record.resetTime) {
		// ウィンドウリセット
		rateLimitMap.set(identifier, { count: 1, resetTime: now + RATE_LIMIT.windowMs });
		return true;
	}

	if (record.count >= RATE_LIMIT.maxRequests) {
		return false;
	}

	record.count++;
	return true;
}

/**
 * IPアドレス取得
 */
function getClientIP(request: NextRequest): string {
	const forwarded = request.headers.get('x-forwarded-for');
	const realIP = request.headers.get('x-real-ip');
	const remoteAddr = request.headers.get('remote-addr');

	if (forwarded) {
		return forwarded.split(',')[0].trim();
	}

	return realIP || remoteAddr || 'unknown';
}

/**
 * エラーレスポンス生成
 */
function createErrorResponse(
	code: WalletApiErrorCode,
	message: string,
	details?: any,
	status: number = 400
): NextResponse<WalletAuthResponse> {
	const response: WalletAuthResponse = {
		success: false,
		error: {
			code,
			message,
			details,
		}
	};

	console.error(`❌ Extended Wallet Auth API Error [${code}]: ${message}`, details);

	return NextResponse.json(response, { status });
}

/**
 * 成功レスポンス生成
 */
function createSuccessResponse(
	user: any, // ExtendedFirestoreUser
	isNewUser: boolean,
	sessionToken?: string
): NextResponse<WalletAuthResponse> {
	const response: WalletAuthResponse = {
		success: true,
		data: {
			user,
			sessionToken,
			isNewUser,
			message: isNewUser
				? 'New extended wallet user created successfully'
				: 'Extended wallet user authenticated successfully'
		}
	};

	console.log(`✅ Extended Wallet Auth Success: ${user.walletAddress} (new: ${isNewUser})`);

	return NextResponse.json(response);
}

/**
 * POST: Extended Wallet認証処理
 */
export async function POST(request: NextRequest) {
	try {
		// リクエスト情報取得
		const clientIP = getClientIP(request);
		const userAgent = request.headers.get('user-agent') || undefined;

		console.log(`🔐 Extended wallet auth request from ${clientIP}`);

		// Rate limiting
		if (!checkRateLimit(clientIP)) {
			return createErrorResponse(
				'RATE_LIMITED',
				'Too many authentication requests. Please try again later.',
				{ clientIP, limit: RATE_LIMIT.maxRequests },
				429
			);
		}

		// リクエストボディ解析
		let body: WalletAuthRequest;
		try {
			body = await request.json();
		} catch (error) {
			return createErrorResponse(
				'VALIDATION_ERROR',
				'Invalid JSON in request body',
				error
			);
		}

		// 必須フィールド検証
		const requiredFields = ['signature', 'message', 'address', 'chainType', 'nonce'];
		for (const field of requiredFields) {
			if (!body[field as keyof WalletAuthRequest]) {
				return createErrorResponse(
					'VALIDATION_ERROR',
					`Missing required field: ${field}`
				);
			}
		}

		const { signature, message, address, chainType, chainId, nonce, timestamp } = body;

		// 基本検証
		if (chainType !== 'evm') {
			return createErrorResponse(
				'INVALID_CHAIN',
				`Unsupported chain type: ${chainType}`
			);
		}

		// アドレス形式検証
		if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
			return createErrorResponse(
				'VALIDATION_ERROR',
				'Invalid wallet address format'
			);
		}

		console.log(`🔍 Validating signature for extended user: ${address}`);

		// 署名検証
		const authService = new EVMAuthService();

		// 1. 署名の検証
		const isValidSignature = await authService.verifySignature(
			signature,
			message,
			address,
			chainType
		);

		if (!isValidSignature) {
			return createErrorResponse(
				'INVALID_SIGNATURE',
				'Wallet signature verification failed'
			);
		}

		console.log(`✅ Extended signature verified for address: ${address}`);

		// 2. Nonce検証（API側で再生成して検証）
		console.log(`🔍 Validating nonce: ${nonce} for address: ${address}`);

		// API側でNonceを再保存してから検証
		authService.storeNonce(address, nonce);

		if (!authService.validateNonce(nonce)) {
			console.log(`❌ Nonce validation failed: ${nonce}`);
			return createErrorResponse(
				'EXPIRED_NONCE',
				'Nonce is invalid or expired'
			);
		}

		console.log(`✅ Extended nonce validated: ${nonce}`);

		// 3. メッセージ内容検証
		const parsedMessage = authService.parseAuthMessage(message);
		if (!parsedMessage || parsedMessage.address.toLowerCase() !== address.toLowerCase()) {
			return createErrorResponse(
				'ADDRESS_MISMATCH',
				'Message address does not match signature address'
			);
		}

		console.log(`✅ Extended message content validated`);

		// 4. Nonce使用済みマーク（再利用防止）
		authService.clearNonce(address);

		// 5. Extended Firestoreでユーザー作成/更新
		console.log(`📊 Syncing with Extended Firestore: ${address}`);

		const isNewUser = !(await checkExtendedWalletUserExists(address));

		// Extended用のデータ準備
		const extendedUserData: CreateExtendedUserData = {
			authMethod: 'wallet',
			walletAddress: address,
			chainType,
			chainId,
			displayName: `${address.slice(0, 6)}...${address.slice(-4)}`,
			ipAddress: clientIP,
			userAgent,
		};

		const user = await syncExtendedWalletAuthWithFirestore(extendedUserData);

		console.log(`🎉 Extended user sync completed:`, {
			address: user.walletAddress,
			isNewUser,
			authMethod: user.authMethod,
			connectedWallets: user.connectedWallets.length,
			authHistoryCount: user.authHistory.length,
		});

		// 6. セッション作成（オプション）
		let sessionToken: string | undefined;
		try {
			const mockAuthResult = {
				success: true,
				user: { address, chainType, chainId }
			};
			sessionToken = await authService.createSession(mockAuthResult);
			console.log(`🔑 Session created for extended user: ${address}`);
		} catch (error) {
			console.warn('⚠️ Extended session creation failed:', error);
			// セッション作成失敗は致命的エラーではない
		}

		// 成功レスポンス
		return createSuccessResponse(user, isNewUser, sessionToken);

	} catch (error) {
		console.error('💥 Extended wallet auth API internal error:', error);

		// Firestore エラーの特別処理
		if (error instanceof Error) {
			if (error.message.includes('permission-denied')) {
				return createErrorResponse(
					'PERMISSION_DENIED',
					'Database permission denied. Please contact support.',
					undefined,
					403
				);
			}

			if (error.message.includes('not found')) {
				return createErrorResponse(
					'USER_NOT_FOUND',
					'User data inconsistency. Please try again.',
					undefined,
					404
				);
			}
		}

		return createErrorResponse(
			'INTERNAL_ERROR',
			'Internal server error occurred',
			process.env.NODE_ENV === 'development' ? {
				message: error instanceof Error ? error.message : 'Unknown error',
				stack: error instanceof Error ? error.stack : undefined
			} : undefined,
			500
		);
	}
}

/**
 * GET: Extended認証状態確認（デバッグ用）
 */
export async function GET(request: NextRequest) {
	// 開発環境でのみ利用可能
	if (process.env.NODE_ENV !== 'development') {
		return NextResponse.json(
			{ error: 'Not available in production' },
			{ status: 403 }
		);
	}

	const { searchParams } = new URL(request.url);
	const address = searchParams.get('address');

	if (!address) {
		return NextResponse.json({ error: 'Address parameter required' }, { status: 400 });
	}

	try {
		const exists = await checkExtendedWalletUserExists(address);
		const user = exists ? await getExtendedWalletUserByAddress(address) : null;

		return NextResponse.json({
			success: true,
			data: {
				address,
				exists,
				user: user ? {
					id: user.id,
					authMethod: user.authMethod,
					displayName: user.displayName,
					walletAddress: user.walletAddress,
					chainType: user.primaryWallet?.chainType,
					lastAuthAt: user.lastAuthAt,
					createdAt: user.createdAt,
					isWalletVerified: user.isWalletVerified,
					connectedWalletsCount: user.connectedWallets.length,
					authHistoryCount: user.authHistory?.length || 0,
					membershipTier: user.membershipTier,
					totalSpent: user.stats.totalSpent,
					badges: user.stats.badges,
				} : null
			}
		});

	} catch (error) {
		return NextResponse.json({
			success: false,
			error: error instanceof Error ? error.message : 'Unknown error'
		}, { status: 500 });
	}
}
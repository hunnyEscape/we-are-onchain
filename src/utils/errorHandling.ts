// src/utils/errorHandling.ts
import { FirebaseError } from 'firebase/app';

// エラータイプの定義
export interface AppError {
	code: string;
	message: string;
	userMessage: string;
	details?: any;
}

// Firebase Authエラーコードのマッピング
const authErrorMessages: Record<string, string> = {
	'auth/user-not-found': 'このメールアドレスに関連付けられたアカウントが見つかりません。',
	'auth/wrong-password': 'パスワードが正しくありません。',
	'auth/email-already-in-use': 'このメールアドレスは既に使用されています。',
	'auth/weak-password': 'パスワードは6文字以上で入力してください。',
	'auth/invalid-email': 'メールアドレスの形式が正しくありません。',
	'auth/user-disabled': 'このアカウントは無効化されています。',
	'auth/too-many-requests': '試行回数が多すぎます。しばらく待ってから再度お試しください。',
	'auth/network-request-failed': 'ネットワークに接続できません。インターネット接続を確認してください。',
	'auth/popup-closed-by-user': 'サインインがキャンセルされました。',
	'auth/cancelled-popup-request': 'サインインがキャンセルされました。',
	'auth/popup-blocked': 'ポップアップがブロックされました。ポップアップを許可してください。'
};

// Firestoreエラーコードのマッピング
const firestoreErrorMessages: Record<string, string> = {
	'permission-denied': 'データへのアクセス権限がありません。',
	'not-found': 'データが見つかりません。',
	'already-exists': 'データは既に存在します。',
	'failed-precondition': 'データの前提条件が満たされていません。',
	'aborted': '操作が中断されました。再度お試しください。',
	'out-of-range': 'データの範囲が正しくありません。',
	'unimplemented': 'この機能は実装されていません。',
	'internal': 'サーバー内部でエラーが発生しました。',
	'unavailable': 'サービスが一時的に利用できません。',
	'data-loss': 'データの損失が発生しました。',
	'unauthenticated': '認証が必要です。ログインしてください。',
	'deadline-exceeded': '操作がタイムアウトしました。',
	'resource-exhausted': 'リソースの制限に達しました。'
};

// 一般的なエラーメッセージ
const generalErrorMessages: Record<string, string> = {
	'network-error': 'ネットワークエラーが発生しました。インターネット接続を確認してください。',
	'unknown-error': '予期しないエラーが発生しました。',
	'validation-error': '入力内容に問題があります。',
	'user-creation-failed': 'ユーザーアカウントの作成に失敗しました。',
	'profile-update-failed': 'プロフィールの更新に失敗しました。',
	'data-sync-failed': 'データの同期に失敗しました。'
};

/**
 * Firebaseエラーを解析してユーザーフレンドリーなメッセージに変換
 */
export const parseFirebaseError = (error: FirebaseError): AppError => {
	const { code, message } = error;

	let userMessage: string;

	if (code.startsWith('auth/')) {
		userMessage = authErrorMessages[code] || 'ログイン処理でエラーが発生しました。';
	} else if (code.startsWith('firestore/')) {
		const firestoreCode = code.replace('firestore/', '');
		userMessage = firestoreErrorMessages[firestoreCode] || 'データベース処理でエラーが発生しました。';
	} else {
		userMessage = generalErrorMessages['unknown-error'];
	}

	return {
		code,
		message,
		userMessage,
		details: error
	};
};

/**
 * 一般的なエラーをAppError形式に変換
 */
export const parseGeneralError = (error: Error, context?: string): AppError => {
	let userMessage = generalErrorMessages['unknown-error'];

	// ネットワークエラーの検出
	if (error.message.includes('network') || error.message.includes('fetch')) {
		userMessage = generalErrorMessages['network-error'];
	}

	// コンテキスト別のエラーメッセージ
	if (context) {
		switch (context) {
			case 'user-creation':
				userMessage = generalErrorMessages['user-creation-failed'];
				break;
			case 'profile-update':
				userMessage = generalErrorMessages['profile-update-failed'];
				break;
			case 'data-sync':
				userMessage = generalErrorMessages['data-sync-failed'];
				break;
		}
	}

	return {
		code: 'general-error',
		message: error.message,
		userMessage,
		details: error
	};
};

/**
 * エラーハンドリング用のラッパー関数
 */
export const handleAsyncOperation = async <T>(
	operation: () => Promise<T>,
	context?: string
): Promise<{ data?: T; error?: AppError }> => {
	try {
		const data = await operation();
		return { data };
	} catch (error) {
		let appError: AppError;

		if (error instanceof FirebaseError) {
			appError = parseFirebaseError(error);
		} else if (error instanceof Error) {
			appError = parseGeneralError(error, context);
		} else {
			appError = {
				code: 'unknown-error',
				message: String(error),
				userMessage: generalErrorMessages['unknown-error'],
				details: error
			};
		}

		// ログ出力（開発環境のみ）
		if (process.env.NODE_ENV === 'development') {
			console.error('🚨 Error in operation:', {
				context,
				error: appError,
				stack: error instanceof Error ? error.stack : undefined
			});
		}

		return { error: appError };
	}
};

/**
 * エラーメッセージをトーストで表示する用のユーティリティ
 */
export const getErrorDisplayMessage = (error: AppError): {
	title: string;
	message: string;
	type: 'error' | 'warning';
} => {
	// ネットワークエラーは警告レベル
	if (error.code.includes('network') || error.code.includes('unavailable')) {
		return {
			title: 'Connection Issue',
			message: error.userMessage,
			type: 'warning'
		};
	}

	// 認証エラーは情報レベル
	if (error.code.startsWith('auth/')) {
		return {
			title: 'Authentication Required',
			message: error.userMessage,
			type: 'warning'
		};
	}

	// その他はエラーレベル
	return {
		title: 'Error',
		message: error.userMessage,
		type: 'error'
	};
};

/**
 * リトライ機能付きの操作実行
 */
export const retryOperation = async <T>(
	operation: () => Promise<T>,
	maxRetries: number = 3,
	delay: number = 1000
): Promise<T> => {
	let lastError: Error;

	for (let attempt = 1; attempt <= maxRetries; attempt++) {
		try {
			return await operation();
		} catch (error) {
			lastError = error as Error;

			// 最後の試行でない場合、待機してからリトライ
			if (attempt < maxRetries) {
				await new Promise(resolve => setTimeout(resolve, delay * attempt));
				console.log(`🔄 Retry attempt ${attempt}/${maxRetries} for operation`);
			}
		}
	}

	throw lastError!;
};

/**
 * バリデーションエラーを生成
 */
export const createValidationError = (field: string, message: string): AppError => {
	return {
		code: 'validation-error',
		message: `Validation failed for ${field}: ${message}`,
		userMessage: message,
		details: { field }
	};
};
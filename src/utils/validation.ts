// src/utils/validation.ts
import { FirestoreUser, UpdateUserProfile } from '@/types/user';

// バリデーションエラーの型
export interface ValidationError {
	field: string;
	message: string;
}

// バリデーション結果の型
export interface ValidationResult {
	isValid: boolean;
	errors: ValidationError[];
}

/**
 * メールアドレスのバリデーション
 */
export const validateEmail = (email: string): boolean => {
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	return emailRegex.test(email);
};

/**
 * 表示名のバリデーション
 */
export const validateDisplayName = (displayName: string): ValidationError[] => {
	const errors: ValidationError[] = [];

	if (!displayName || !displayName.trim()) {
		errors.push({
			field: 'displayName',
			message: 'Display name is required'
		});
		return errors;
	}

	if (displayName.trim().length < 2) {
		errors.push({
			field: 'displayName',
			message: 'Display name must be at least 2 characters long'
		});
	}

	if (displayName.trim().length > 50) {
		errors.push({
			field: 'displayName',
			message: 'Display name must be less than 50 characters'
		});
	}

	// 特殊文字のチェック（基本的な文字、数字、スペース、一部の記号のみ許可）
	const allowedCharsRegex = /^[a-zA-Z0-9\s\-_.あ-んア-ン一-龯]+$/;
	if (!allowedCharsRegex.test(displayName.trim())) {
		errors.push({
			field: 'displayName',
			message: 'Display name contains invalid characters'
		});
	}

	return errors;
};

/**
 * ニックネームのバリデーション
 */
export const validateNickname = (nickname?: string): ValidationError[] => {
	const errors: ValidationError[] = [];

	if (!nickname) return errors; // ニックネームはオプショナル

	if (nickname.trim().length > 30) {
		errors.push({
			field: 'nickname',
			message: 'Nickname must be less than 30 characters'
		});
	}

	const allowedCharsRegex = /^[a-zA-Z0-9\s\-_.あ-んア-ン一-龯]+$/;
	if (!allowedCharsRegex.test(nickname.trim())) {
		errors.push({
			field: 'nickname',
			message: 'Nickname contains invalid characters'
		});
	}

	return errors;
};

/**
 * 住所のバリデーション
 */
export const validateAddress = (address?: FirestoreUser['address']): ValidationError[] => {
	const errors: ValidationError[] = [];

	if (!address) {
		errors.push({
			field: 'address',
			message: 'Address information is required'
		});
		return errors;
	}

	// 国
	if (!address.country || !address.country.trim()) {
		errors.push({
			field: 'address.country',
			message: 'Country is required'
		});
	} else if (address.country.trim().length > 50) {
		errors.push({
			field: 'address.country',
			message: 'Country name is too long'
		});
	}

	// 都道府県
	if (!address.prefecture || !address.prefecture.trim()) {
		errors.push({
			field: 'address.prefecture',
			message: 'Prefecture/State is required'
		});
	} else if (address.prefecture.trim().length > 50) {
		errors.push({
			field: 'address.prefecture',
			message: 'Prefecture/State name is too long'
		});
	}

	// 市区町村
	if (!address.city || !address.city.trim()) {
		errors.push({
			field: 'address.city',
			message: 'City is required'
		});
	} else if (address.city.trim().length > 100) {
		errors.push({
			field: 'address.city',
			message: 'City name is too long'
		});
	}

	// 住所1
	if (!address.addressLine1 || !address.addressLine1.trim()) {
		errors.push({
			field: 'address.addressLine1',
			message: 'Address line 1 is required'
		});
	} else if (address.addressLine1.trim().length > 200) {
		errors.push({
			field: 'address.addressLine1',
			message: 'Address line 1 is too long'
		});
	}

	// 住所2（オプショナル）
	if (address.addressLine2 && address.addressLine2.trim().length > 200) {
		errors.push({
			field: 'address.addressLine2',
			message: 'Address line 2 is too long'
		});
	}

	// 郵便番号
	if (!address.postalCode || !address.postalCode.trim()) {
		errors.push({
			field: 'address.postalCode',
			message: 'Postal code is required'
		});
	} else if (address.postalCode.trim().length > 20) {
		errors.push({
			field: 'address.postalCode',
			message: 'Postal code is too long'
		});
	}

	// 電話番号（オプショナル）
	if (address.phone && address.phone.trim()) {
		const phoneRegex = /^[\+]?[0-9\s\-\(\)]+$/;
		if (!phoneRegex.test(address.phone.trim())) {
			errors.push({
				field: 'address.phone',
				message: 'Invalid phone number format'
			});
		} else if (address.phone.trim().length > 20) {
			errors.push({
				field: 'address.phone',
				message: 'Phone number is too long'
			});
		}
	}

	return errors;
};

/**
 * プロフィール更新データの全体バリデーション
 */
export const validateUpdateUserProfile = (data: UpdateUserProfile): ValidationResult => {
	const allErrors: ValidationError[] = [];

	// 表示名のバリデーション
	if (data.displayName !== undefined) {
		allErrors.push(...validateDisplayName(data.displayName));
	}

	// ニックネームのバリデーション
	if (data.nickname !== undefined) {
		allErrors.push(...validateNickname(data.nickname));
	}

	// 住所のバリデーション
	if (data.address !== undefined) {
		allErrors.push(...validateAddress(data.address));
	}

	return {
		isValid: allErrors.length === 0,
		errors: allErrors
	};
};

/**
 * Firestoreユーザーデータの全体バリデーション
 */
export const validateFirestoreUser = (user: Partial<FirestoreUser>): ValidationResult => {
	const allErrors: ValidationError[] = [];

	// 必須フィールドのチェック
	if (!user.id || !user.id.trim()) {
		allErrors.push({
			field: 'id',
			message: 'User ID is required'
		});
	}

	if (!user.email || !user.email.trim()) {
		allErrors.push({
			field: 'email',
			message: 'Email is required'
		});
	} else if (!validateEmail(user.email)) {
		allErrors.push({
			field: 'email',
			message: 'Invalid email format'
		});
	}

	// 表示名のバリデーション
	if (user.displayName !== undefined) {
		allErrors.push(...validateDisplayName(user.displayName));
	}

	// ニックネームのバリデーション
	if (user.nickname !== undefined) {
		allErrors.push(...validateNickname(user.nickname));
	}

	// 住所のバリデーション
	if (user.address !== undefined) {
		allErrors.push(...validateAddress(user.address));
	}

	return {
		isValid: allErrors.length === 0,
		errors: allErrors
	};
};

/**
 * フィールド名を日本語に変換
 */
export const getFieldLabel = (field: string): string => {
	const labels: Record<string, string> = {
		'displayName': '表示名',
		'nickname': 'ニックネーム',
		'email': 'メールアドレス',
		'address': '住所',
		'address.country': '国',
		'address.prefecture': '都道府県',
		'address.city': '市区町村',
		'address.addressLine1': '住所1',
		'address.addressLine2': '住所2',
		'address.postalCode': '郵便番号',
		'address.phone': '電話番号'
	};

	return labels[field] || field;
};

/**
 * バリデーションエラーをユーザーフレンドリーなメッセージに変換
 */
export const formatValidationErrors = (errors: ValidationError[]): string[] => {
	return errors.map(error => {
		const fieldLabel = getFieldLabel(error.field);
		return `${fieldLabel}: ${error.message}`;
	});
};

/**
 * データサニタイゼーション
 */
export const sanitizeUserData = (data: UpdateUserProfile): UpdateUserProfile => {
	const sanitized: UpdateUserProfile = {};

	if (data.displayName !== undefined) {
		sanitized.displayName = data.displayName.trim();
	}

	if (data.nickname !== undefined) {
		sanitized.nickname = data.nickname.trim() || undefined;
	}

	if (data.address !== undefined) {
		sanitized.address = {
			country: data.address.country?.trim() || '',
			prefecture: data.address.prefecture?.trim() || '',
			city: data.address.city?.trim() || '',
			addressLine1: data.address.addressLine1?.trim() || '',
			addressLine2: data.address.addressLine2?.trim() || '',
			postalCode: data.address.postalCode?.trim() || '',
			phone: data.address.phone?.trim() || ''
		};
	}

	return sanitized;
};
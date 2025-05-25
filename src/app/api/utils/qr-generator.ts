// src/app/api/utils/qr-generator.ts
import QRCode from 'qrcode';
import { QRCodeConfig, DemoPaymentError } from '../../../../types/demo-payment';
import { QR_CODE_CONFIG, generatePaymentURI, LOGGING_CONFIG } from '@/lib/avalanche-config';

/**
 * QRコード生成オプション
 */
interface QRGenerationOptions {
	format?: 'png' | 'svg' | 'utf8';
	includeMetadata?: boolean;
	customConfig?: Partial<QRCodeConfig>;
}

/**
 * 生成されたQRコードデータ
 */
interface GeneratedQRCode {
	dataURL: string; // Base64データURL
	paymentURI: string; // EIP-681 URI
	metadata: {
		size: number;
		format: string;
		errorCorrectionLevel: string;
		generatedAt: string;
		chainId: number;
		amount: string;
		address: string;
	};
}

/**
 * QRコード生成クラス
 */
export class DemoQRGenerator {
	private config: QRCodeConfig;

	constructor(customConfig?: Partial<QRCodeConfig>) {
		this.config = { ...QR_CODE_CONFIG, ...customConfig };
	}

	/**
	 * EIP-681 Payment URI用のQRコード生成
	 */
	public async generatePaymentQR(
		address: string,
		amountWei: string,
		chainId: number = 43113,
		options: QRGenerationOptions = {}
	): Promise<GeneratedQRCode> {
		try {
			// 入力検証
			this.validateInputs(address, amountWei, chainId);

			// Payment URI生成
			const paymentURI = generatePaymentURI(address, amountWei, chainId);

			if (LOGGING_CONFIG.enableDebugLogs) {
				console.log('🔗 Generated payment URI:', paymentURI);
			}

			// QRコード設定準備
			const qrConfig = { ...this.config, ...options.customConfig };

			// QRコード生成オプション
			const qrOptions: QRCode.QRCodeToDataURLOptions = {
				errorCorrectionLevel: qrConfig.errorCorrectionLevel,
				type: 'image/png',
			//	quality: 0.92,
				margin: qrConfig.margin,
				color: {
					dark: qrConfig.colorDark,
					light: qrConfig.colorLight,
				},
				width: qrConfig.size,
			};

			// QRコード生成
			const dataURL = await QRCode.toDataURL(paymentURI, qrOptions);

			// メタデータ生成
			const metadata = this.generateMetadata(address, amountWei, chainId, qrConfig);

			const result: GeneratedQRCode = {
				dataURL,
				paymentURI,
				metadata
			};

			if (LOGGING_CONFIG.enableDebugLogs) {
				console.log('✅ QR code generated successfully:', {
					address: address.substring(0, 10) + '...',
					size: qrConfig.size,
					format: 'PNG'
				});
			}

			return result;
		} catch (error) {
			console.error('❌ Error generating payment QR code:', error);
			throw this.createQRError('QR_GENERATION_FAILED', 'Failed to generate payment QR code', error);
		}
	}

	/**
	 * SVG形式でのQRコード生成
	 */
	public async generatePaymentQRSVG(
		address: string,
		amountWei: string,
		chainId: number = 43113,
		options: QRGenerationOptions = {}
	): Promise<{ svg: string; paymentURI: string; metadata: any }> {
		try {
			this.validateInputs(address, amountWei, chainId);

			const paymentURI = generatePaymentURI(address, amountWei, chainId);
			const qrConfig = { ...this.config, ...options.customConfig };

			const svgOptions: QRCode.QRCodeToStringOptions = {
				errorCorrectionLevel: qrConfig.errorCorrectionLevel,
				type: 'svg',
				margin: qrConfig.margin,
				color: {
					dark: qrConfig.colorDark,
					light: qrConfig.colorLight,
				},
				width: qrConfig.size,
			};

			const svg = await QRCode.toString(paymentURI, svgOptions);
			const metadata = this.generateMetadata(address, amountWei, chainId, qrConfig);

			return { svg, paymentURI, metadata };
		} catch (error) {
			console.error('❌ Error generating SVG QR code:', error);
			throw this.createQRError('QR_GENERATION_FAILED', 'Failed to generate SVG QR code', error);
		}
	}

	/**
	 * ASCII形式でのQRコード生成（デバッグ用）
	 */
	public async generatePaymentQRText(
		address: string,
		amountWei: string,
		chainId: number = 43113
	): Promise<{ text: string; paymentURI: string }> {
		try {
			this.validateInputs(address, amountWei, chainId);

			const paymentURI = generatePaymentURI(address, amountWei, chainId);

			const textOptions: QRCode.QRCodeToStringOptions = {
				errorCorrectionLevel: this.config.errorCorrectionLevel,
				type: 'utf8',
				//small: true
			};

			const text = await QRCode.toString(paymentURI, textOptions);

			return { text, paymentURI };
		} catch (error) {
			console.error('❌ Error generating text QR code:', error);
			throw this.createQRError('QR_GENERATION_FAILED', 'Failed to generate text QR code', error);
		}
	}

	/**
	 * バッチでのQRコード生成（複数チェーン対応）
	 */
	public async generateMultiChainQRs(
		address: string,
		amountWei: string,
		chainIds: number[]
	): Promise<Record<number, GeneratedQRCode>> {
		try {
			const results: Record<number, GeneratedQRCode> = {};

			// 並列処理で複数チェーンのQRコード生成
			const promises = chainIds.map(async (chainId) => {
				const qr = await this.generatePaymentQR(address, amountWei, chainId);
				return { chainId, qr };
			});

			const completed = await Promise.all(promises);

			completed.forEach(({ chainId, qr }) => {
				results[chainId] = qr;
			});

			if (LOGGING_CONFIG.enableDebugLogs) {
				console.log('✅ Generated QR codes for chains:', chainIds);
			}

			return results;
		} catch (error) {
			console.error('❌ Error generating multi-chain QRs:', error);
			throw this.createQRError('QR_GENERATION_FAILED', 'Failed to generate multi-chain QR codes', error);
		}
	}

	/**
	 * 入力値の検証
	 */
	private validateInputs(address: string, amountWei: string, chainId: number): void {
		// アドレス検証
		if (!address || typeof address !== 'string') {
			throw new Error('Invalid address: must be a non-empty string');
		}

		if (!address.startsWith('0x') || address.length !== 42) {
			throw new Error('Invalid address: must be a valid Ethereum address');
		}

		// 金額検証
		if (!amountWei || typeof amountWei !== 'string') {
			throw new Error('Invalid amount: must be a non-empty string');
		}

		try {
			const amount = BigInt(amountWei);
			if (amount <= 0) {
				throw new Error('Invalid amount: must be greater than 0');
			}
		} catch {
			throw new Error('Invalid amount: must be a valid Wei amount');
		}

		// チェーンID検証
		if (!Number.isInteger(chainId) || chainId <= 0) {
			throw new Error('Invalid chainId: must be a positive integer');
		}
	}

	/**
	 * メタデータ生成
	 */
	private generateMetadata(
		address: string,
		amountWei: string,
		chainId: number,
		config: QRCodeConfig
	) {
		return {
			size: config.size,
			format: 'PNG',
			errorCorrectionLevel: config.errorCorrectionLevel,
			generatedAt: new Date().toISOString(),
			chainId,
			amount: amountWei,
			address: address.toLowerCase()
		};
	}

	/**
	 * エラーオブジェクト作成
	 */
	private createQRError(code: 'QR_GENERATION_FAILED', message: string, details?: any): DemoPaymentError {
		return {
			code,
			message,
			details,
			timestamp: new Date()
		};
	}
}

/**
 * デフォルトQRジェネレーターのシングルトンインスタンス
 */
let qrGeneratorInstance: DemoQRGenerator | null = null;

/**
 * QRジェネレーター取得（シングルトン）
 */
export function getQRGenerator(customConfig?: Partial<QRCodeConfig>): DemoQRGenerator {
	if (!qrGeneratorInstance || customConfig) {
		qrGeneratorInstance = new DemoQRGenerator(customConfig);
	}
	return qrGeneratorInstance;
}

/**
 * 簡単なQRコード生成（便利関数）
 */
export async function generatePaymentQRCode(
	address: string,
	amountWei: string,
	chainId: number = 43113
): Promise<GeneratedQRCode> {
	const generator = getQRGenerator();
	return generator.generatePaymentQR(address, amountWei, chainId);
}

/**
 * カスタム設定でのQRコード生成
 */
export async function generateCustomPaymentQR(
	address: string,
	amountWei: string,
	chainId: number,
	customConfig: Partial<QRCodeConfig>
): Promise<GeneratedQRCode> {
	const generator = new DemoQRGenerator(customConfig);
	return generator.generatePaymentQR(address, amountWei, chainId);
}

/**
 * QRコード生成能力のテスト
 */
export async function testQRGeneration(): Promise<{ success: boolean; error?: string }> {
	try {
		const testAddress = '0x742d35Cc6634C0532925a3b8D0A9A81a9b6c3C7B';
		const testAmount = '1000000000000000000'; // 1 AVAX in Wei
		const testChainId = 43113;

		await generatePaymentQRCode(testAddress, testAmount, testChainId);

		if (LOGGING_CONFIG.enableDebugLogs) {
			console.log('✅ QR generation test passed');
		}

		return { success: true };
	} catch (error) {
		console.error('❌ QR generation test failed:', error);
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Unknown error'
		};
	}
}
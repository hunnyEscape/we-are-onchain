// src/app/api/utils/wallet-generator.ts
import { ethers } from 'ethers';
import { generateMnemonic, mnemonicToSeedSync, validateMnemonic } from 'bip39';
import HDKey from 'hdkey';
import crypto from 'crypto';
import { GeneratedWallet, DemoPaymentError } from '@/types/demo-payment';
import { DEMO_PAYMENT_CONFIG, LOGGING_CONFIG } from '@/lib/avalanche-config';

/**
 * HDウォレットからのアドレス生成クラス
 */
export class DemoWalletGenerator {
  private hdWallet: HDKey;
  private basePath: string;
  private usedIndices: Set<number>;

  constructor(mnemonic?: string) {
    // マスターシードの検証と設定
    const masterMnemonic = mnemonic || DEMO_PAYMENT_CONFIG.masterMnemonic;
    
    if (!validateMnemonic(masterMnemonic)) {
      throw new Error('Invalid mnemonic phrase');
    }

    // HDウォレット生成
    const seed = mnemonicToSeedSync(masterMnemonic);
    this.hdWallet = HDKey.fromMasterSeed(seed);
    this.basePath = DEMO_PAYMENT_CONFIG.derivationPath;
    this.usedIndices = new Set<number>();

    if (LOGGING_CONFIG.enableDebugLogs) {
      console.log('🔐 DemoWalletGenerator initialized with derivation path:', this.basePath);
    }
  }

  /**
   * デモIDから決定論的にウォレットインデックスを生成
   */
  private generateDeterministicIndex(demoId: string): number {
    // SHA256でハッシュ化してインデックス生成
    const hash = crypto.createHash('sha256').update(demoId).digest('hex');
    const hashNum = parseInt(hash.substring(0, 8), 16);
    
    // 最大アドレス数以内に収める
    const index = hashNum % DEMO_PAYMENT_CONFIG.maxAddressReuse;
    
    if (LOGGING_CONFIG.enableDebugLogs) {
      console.log('📍 Generated deterministic index:', index, 'for demoId:', demoId);
    }
    
    return index;
  }

  /**
   * デモIDから決定論的にウォレット生成
   */
  public generateWalletFromDemoId(demoId: string): GeneratedWallet {
    try {
      const index = this.generateDeterministicIndex(demoId);
      return this.generateWalletAtIndex(index);
    } catch (error) {
      console.error('❌ Error generating wallet from demoId:', error);
      throw this.createWalletError('WALLET_GENERATION_FAILED', 'Failed to generate wallet from demo ID', error);
    }
  }

  /**
   * 指定されたインデックスでウォレット生成
   */
  public generateWalletAtIndex(index: number): GeneratedWallet {
    try {
      if (index < 0 || index >= DEMO_PAYMENT_CONFIG.maxAddressReuse) {
        throw new Error(`Index ${index} is out of range (0-${DEMO_PAYMENT_CONFIG.maxAddressReuse - 1})`);
      }

      // 派生パス生成
      const derivationPath = `${this.basePath}${index}`;
      const derivedKey = this.hdWallet.derive(derivationPath);

      if (!derivedKey.privateKey) {
        throw new Error('Failed to derive private key');
      }

      // ethers.jsでウォレット作成
      const privateKeyHex = '0x' + derivedKey.privateKey.toString('hex');
      const wallet = new ethers.Wallet(privateKeyHex);

      // 公開鍵を手動で生成（ethers v6では直接アクセスできないため）
      const publicKey = derivedKey.publicKey ? '0x' + derivedKey.publicKey.toString('hex') : wallet.signingKey.publicKey;

      // 使用済みインデックスとして記録
      this.usedIndices.add(index);

      const result: GeneratedWallet = {
        address: wallet.address,
        privateKey: privateKeyHex,
        publicKey: publicKey,
        index,
        derivationPath
      };

      if (LOGGING_CONFIG.enableDebugLogs) {
        console.log('✅ Generated wallet:', {
          address: result.address,
          index: result.index,
          derivationPath: result.derivationPath
        });
      }

      return result;
    } catch (error) {
      console.error('❌ Error generating wallet at index:', index, error);
      throw this.createWalletError('WALLET_GENERATION_FAILED', `Failed to generate wallet at index ${index}`, error);
    }
  }

  /**
   * 次の未使用インデックスでウォレット生成
   */
  public generateNextWallet(): GeneratedWallet {
    try {
      // 未使用のインデックスを探す
      let index = 0;
      while (this.usedIndices.has(index) && index < DEMO_PAYMENT_CONFIG.maxAddressReuse) {
        index++;
      }

      if (index >= DEMO_PAYMENT_CONFIG.maxAddressReuse) {
        throw new Error('No available wallet indices');
      }

      return this.generateWalletAtIndex(index);
    } catch (error) {
      console.error('❌ Error generating next wallet:', error);
      throw this.createWalletError('WALLET_GENERATION_FAILED', 'Failed to generate next available wallet', error);
    }
  }

  /**
   * ランダムなインデックスでウォレット生成（衝突回避）
   */
  public generateRandomWallet(maxAttempts: number = 10): GeneratedWallet {
    try {
      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        const randomIndex = Math.floor(Math.random() * DEMO_PAYMENT_CONFIG.maxAddressReuse);
        
        if (!this.usedIndices.has(randomIndex)) {
          return this.generateWalletAtIndex(randomIndex);
        }
      }

      // フォールバック: 次の利用可能なウォレットを生成
      console.warn('⚠️ Random wallet generation failed, falling back to next available wallet');
      return this.generateNextWallet();
    } catch (error) {
      console.error('❌ Error generating random wallet:', error);
      throw this.createWalletError('WALLET_GENERATION_FAILED', 'Failed to generate random wallet', error);
    }
  }

  /**
   * ウォレットアドレスの検証
   */
  public static validateAddress(address: string): boolean {
    try {
      return ethers.isAddress(address);
    } catch {
      return false;
    }
  }

  /**
   * 秘密鍵の検証
   */
  public static validatePrivateKey(privateKey: string): boolean {
    try {
      new ethers.Wallet(privateKey);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 使用済みインデックスの状態取得
   */
  public getUsageStats(): { used: number; available: number; total: number } {
    return {
      used: this.usedIndices.size,
      available: DEMO_PAYMENT_CONFIG.maxAddressReuse - this.usedIndices.size,
      total: DEMO_PAYMENT_CONFIG.maxAddressReuse
    };
  }

  /**
   * 使用済みインデックスのリセット（テスト用）
   */
  public resetUsedIndices(): void {
    this.usedIndices.clear();
    if (LOGGING_CONFIG.enableDebugLogs) {
      console.log('🔄 Reset used wallet indices');
    }
  }

  /**
   * エラーオブジェクト作成ヘルパー
   */
  private createWalletError(code: 'WALLET_GENERATION_FAILED', message: string, details?: any): DemoPaymentError {
    return {
      code,
      message,
      details,
      timestamp: new Date()
    };
  }
}

/**
 * シングルトンインスタンス（メモリ効率化）
 */
let walletGeneratorInstance: DemoWalletGenerator | null = null;

/**
 * ウォレットジェネレーター取得（シングルトン）
 */
export function getWalletGenerator(): DemoWalletGenerator {
  if (!walletGeneratorInstance) {
    walletGeneratorInstance = new DemoWalletGenerator();
  }
  return walletGeneratorInstance;
}

/**
 * デモID用のウォレット生成（便利関数）
 */
export function generateDemoWallet(demoId: string): GeneratedWallet {
  const generator = getWalletGenerator();
  return generator.generateWalletFromDemoId(demoId);
}

/**
 * ランダムウォレット生成（便利関数）
 */
export function generateRandomDemoWallet(): GeneratedWallet {
  const generator = getWalletGenerator();
  return generator.generateRandomWallet();
}

/**
 * ウォレット生成の統計情報取得
 */
export function getWalletGenerationStats() {
  const generator = getWalletGenerator();
  return generator.getUsageStats();
}

/**
 * 新しいマスターシード生成（セットアップ用）
 */
export function generateNewMasterMnemonic(): string {
  const mnemonic = generateMnemonic(256); // 24語のシード
  
  if (LOGGING_CONFIG.enableDebugLogs) {
    console.log('🆕 Generated new master mnemonic (24 words)');
  }
  
  return mnemonic;
}

/**
 * マスターシードの検証
 */
export function validateMasterMnemonic(mnemonic: string): { isValid: boolean; wordCount: number } {
  const isValid = validateMnemonic(mnemonic);
  const wordCount = mnemonic.trim().split(/\s+/).length;
  
  return { isValid, wordCount };
}
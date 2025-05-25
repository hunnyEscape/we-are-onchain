// src/app/components/payment/QRCodeDisplay.tsx
'use client';

import React, { useState, useCallback } from 'react';
import { Copy, Check, ExternalLink, Smartphone, AlertCircle } from 'lucide-react';
import CyberButton from '../common/CyberButton';

/**
 * QRコード表示コンポーネントのプロパティ
 */
interface QRCodeDisplayProps {
  qrCodeDataURL: string;
  paymentURI: string;
  paymentAddress: string;
  amount: string;
  chainId: number;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showMetadata?: boolean;
  onCopy?: (text: string, type: 'address' | 'uri') => void;
}

/**
 * コピー状態管理
 */
interface CopyState {
  address: boolean;
  uri: boolean;
}

/**
 * QRコード表示コンポーネント
 */
const QRCodeDisplay: React.FC<QRCodeDisplayProps> = ({
  qrCodeDataURL,
  paymentURI,
  paymentAddress,
  amount,
  chainId,
  className = '',
  size = 'md',
  showMetadata = true,
  onCopy
}) => {
  const [copyState, setCopyState] = useState<CopyState>({ address: false, uri: false });
  const [imageError, setImageError] = useState(false);

  // サイズ設定
  const sizeConfig = {
    sm: { qr: 'w-48 h-48', container: 'p-4' },
    md: { qr: 'w-64 h-64', container: 'p-6' },
    lg: { qr: 'w-80 h-80', container: 'p-8' }
  };

  const config = sizeConfig[size];

  /**
   * テキストコピー機能
   */
  const handleCopy = useCallback(async (text: string, type: 'address' | 'uri') => {
    try {
      await navigator.clipboard.writeText(text);
      
      // コピー状態更新
      setCopyState(prev => ({ ...prev, [type]: true }));
      
      // 2秒後にリセット
      setTimeout(() => {
        setCopyState(prev => ({ ...prev, [type]: false }));
      }, 2000);
      
      // 親コンポーネントに通知
      onCopy?.(text, type);
      
      console.log('📋 Copied to clipboard:', type, text.substring(0, 20) + '...');
    } catch (error) {
      console.error('❌ Failed to copy to clipboard:', error);
    }
  }, [onCopy]);

  /**
   * QRコード画像エラーハンドリング
   */
  const handleImageError = useCallback(() => {
    setImageError(true);
    console.error('❌ QR code image failed to load');
  }, []);

  /**
   * ブロックエクスプローラーURL生成
   */
  const getExplorerURL = useCallback((address: string) => {
    return `https://testnet.snowscan.xyz/address/${address}`;
  }, []);

  /**
   * ネットワーク名取得
   */
  const getNetworkName = useCallback((chainId: number) => {
    switch (chainId) {
      case 43113: return 'Avalanche FUJI';
      case 43114: return 'Avalanche Mainnet';
      default: return `Chain ${chainId}`;
    }
  }, []);

  /**
   * アドレス短縮表示
   */
  const formatAddress = useCallback((address: string) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  }, []);

  return (
    <div className={`bg-dark-200/50 border border-dark-300 rounded-sm ${config.container} ${className}`}>
      {/* ヘッダー */}
      <div className="text-center mb-4">
        <h3 className="text-lg font-semibold text-white mb-1">
          Payment QR Code
        </h3>
        <p className="text-sm text-gray-400">
          Scan with any compatible wallet
        </p>
      </div>

      {/* QRコード表示エリア */}
      <div className="flex justify-center mb-6">
        <div className="relative">
          {!imageError ? (
            <img
              src={qrCodeDataURL}
              alt="Payment QR Code"
              className={`${config.qr} border-2 border-white rounded-sm shadow-lg`}
              onError={handleImageError}
            />
          ) : (
            // QRコード読み込みエラー時のフォールバック
            <div className={`${config.qr} border-2 border-red-400 rounded-sm bg-red-900/20 flex items-center justify-center`}>
              <div className="text-center">
                <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-2" />
                <p className="text-sm text-red-400">QR Code Error</p>
              </div>
            </div>
          )}
          
          {/* QRコード角のアクセント */}
          <div className="absolute -top-1 -left-1 w-4 h-4 border-l-2 border-t-2 border-neonGreen"></div>
          <div className="absolute -top-1 -right-1 w-4 h-4 border-r-2 border-t-2 border-neonGreen"></div>
          <div className="absolute -bottom-1 -left-1 w-4 h-4 border-l-2 border-b-2 border-neonGreen"></div>
          <div className="absolute -bottom-1 -right-1 w-4 h-4 border-r-2 border-b-2 border-neonGreen"></div>
        </div>
      </div>

      {/* モバイル用説明 */}
      <div className="bg-blue-900/20 border border-blue-600/30 rounded-sm p-3 mb-4">
        <div className="flex items-start space-x-3">
          <Smartphone className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <div className="text-blue-400 font-medium text-sm mb-1">
              📱 Mobile Wallet Instructions
            </div>
            <div className="text-xs text-gray-300">
              Open your wallet app → Scan QR → Confirm transaction
            </div>
          </div>
        </div>
      </div>

      {/* 決済詳細情報 */}
      <div className="space-y-3">
        {/* 支払いアドレス */}
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1">
            Payment Address
          </label>
          <div className="flex items-center space-x-2">
            <div className="flex-1 bg-dark-100 border border-dark-300 rounded-sm p-2">
              <div className="font-mono text-sm text-white break-all">
                {paymentAddress}
              </div>
            </div>
            <CyberButton
              size="sm"
              variant="outline"
              onClick={() => handleCopy(paymentAddress, 'address')}
              className="flex items-center space-x-1 min-w-[80px]"
            >
              {copyState.address ? (
                <>
                  <Check className="w-3 h-3" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>Copy</span>
                </>
              )}
            </CyberButton>
          </div>
        </div>

        {/* 金額表示 */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">
              Amount
            </label>
            <div className="bg-dark-100 border border-dark-300 rounded-sm p-2">
              <div className="text-sm font-semibold text-white">
                {amount} AVAX
              </div>
            </div>
          </div>
          
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">
              Network
            </label>
            <div className="bg-dark-100 border border-dark-300 rounded-sm p-2">
              <div className="text-sm text-white">
                {getNetworkName(chainId)}
              </div>
            </div>
          </div>
        </div>

        {/* Payment URI（オプション） */}
        {showMetadata && (
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">
              Payment URI
            </label>
            <div className="flex items-center space-x-2">
              <div className="flex-1 bg-dark-100 border border-dark-300 rounded-sm p-2">
                <div className="font-mono text-xs text-gray-300 break-all">
                  {paymentURI.length > 60 
                    ? `${paymentURI.substring(0, 60)}...` 
                    : paymentURI
                  }
                </div>
              </div>
              <CyberButton
                size="sm"
                variant="outline"
                onClick={() => handleCopy(paymentURI, 'uri')}
                className="flex items-center space-x-1 min-w-[80px]"
              >
                {copyState.uri ? (
                  <>
                    <Check className="w-3 h-3" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copy</span>
                  </>
                )}
              </CyberButton>
            </div>
          </div>
        )}
      </div>

      {/* フッターアクション */}
      <div className="mt-4 pt-4 border-t border-dark-300">
        <div className="flex items-center justify-between">
          <div className="text-xs text-gray-400">
            Chain ID: {chainId}
          </div>
          
          <CyberButton
            size="sm"
            variant="outline"
            onClick={() => window.open(getExplorerURL(paymentAddress), '_blank')}
            className="flex items-center space-x-1"
          >
            <ExternalLink className="w-3 h-3" />
            <span>Explorer</span>
          </CyberButton>
        </div>
      </div>

      {/* デバッグ情報（開発環境のみ） */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-3 p-2 bg-yellow-900/20 border border-yellow-600/30 rounded-sm">
          <div className="text-xs text-yellow-400">
            🔧 Dev: Address {formatAddress(paymentAddress)} • URI {paymentURI.substring(0, 30)}...
          </div>
        </div>
      )}
    </div>
  );
};

export default QRCodeDisplay;
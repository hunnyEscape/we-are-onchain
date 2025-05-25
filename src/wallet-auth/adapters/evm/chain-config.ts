// src/wallet-auth/adapters/evm/chain-config.ts
import { type Chain } from 'viem'; // wagmiではなくviemからインポート
import { mainnet, sepolia, polygon, bsc, avalanche, avalancheFuji } from 'wagmi/chains';
import { EVMChainConfig } from '../../../../types/wallet';

/**
 * サポートするEVMチェーンの設定
 */
export const EVM_CHAINS: Record<string, Chain> = {
	// Mainnets
	ethereum: mainnet,
	polygon: polygon,
	bsc: bsc,
	avalanche: avalanche,

	// Testnets
	sepolia: sepolia,
	avalancheFuji: avalancheFuji,
};

/**
 * 本番環境とテスト環境のチェーン設定
 */
export const getEVMChains = (): Chain[] => {
	const isDevelopment = process.env.NODE_ENV === 'development';

	if (isDevelopment) {
		// 開発環境：テストネットも含める
		return [
			mainnet,
			polygon,
			avalanche,
			sepolia,
			avalancheFuji,
		];
	} else {
		// 本番環境：メインネットのみ
		return [
			mainnet,
			polygon,
			avalanche,
		];
	}
};

/**
 * デフォルトチェーン（環境別）
 */
export const getDefaultChain = (): Chain => {
	const isDevelopment = process.env.NODE_ENV === 'development';
	return isDevelopment ? avalancheFuji : mainnet;
};

/**
 * 内部形式からWagmi形式への変換
 */
export const evmConfigToWagmiChain = (config: EVMChainConfig): Chain => {
	return {
		id: config.chainId,
		name: config.name,
		nativeCurrency: config.nativeCurrency,
		rpcUrls: {
			default: {
				http: config.rpcUrls,
			},
			public: {
				http: config.rpcUrls,
			},
		},
		blockExplorers: config.blockExplorerUrls ? {
			default: {
				name: 'Explorer',
				url: config.blockExplorerUrls[0],
			},
		} : undefined,
		testnet: config.isTestnet,
	};
};

/**
 * WagmiチェーンからEVM設定への変換
 */
export const wagmiChainToEVMConfig = (chain: Chain): EVMChainConfig => {
	return {
		chainId: chain.id,
		name: chain.name,
		nativeCurrency: chain.nativeCurrency,
		rpcUrls: [...chain.rpcUrls.default.http], // readonly配列をmutable配列にコピー
		blockExplorerUrls: chain.blockExplorers ? [chain.blockExplorers.default.url] : undefined,
		iconUrls: [],
		isTestnet: chain.testnet,
	};
};

/**
 * チェーンID別のアイコンマッピング
 */
export const CHAIN_ICONS: Record<number, string> = {
	1: '🔵', // Ethereum
	137: '🟣', // Polygon
	56: '🟡', // BSC
	43114: '🔺', // Avalanche
	11155111: '🔵', // Sepolia
	43113: '🔺', // Avalanche Fuji
};

/**
 * チェーン表示名のマッピング
 */
export const CHAIN_DISPLAY_NAMES: Record<number, string> = {
	1: 'Ethereum',
	137: 'Polygon',
	56: 'BSC',
	43114: 'Avalanche',
	11155111: 'Sepolia Testnet',
	43113: 'Avalanche Fuji',
};

/**
 * チェーンの色テーマ
 */
export const CHAIN_COLORS: Record<number, { primary: string; secondary: string }> = {
	1: { primary: '#627EEA', secondary: '#8B9DC3' }, // Ethereum blue
	137: { primary: '#8247E5', secondary: '#A66EF5' }, // Polygon purple
	56: { primary: '#F3BA2F', secondary: '#F8D347' }, // BSC yellow
	43114: { primary: '#E84142', secondary: '#ED6B6C' }, // Avalanche red
	11155111: { primary: '#627EEA', secondary: '#8B9DC3' }, // Sepolia (same as Ethereum)
	43113: { primary: '#E84142', secondary: '#ED6B6C' }, // Fuji (same as Avalanche)
};

/**
 * ガス料金の単位
 */
export const GAS_UNITS: Record<number, string> = {
	1: 'gwei',
	137: 'gwei',
	56: 'gwei',
	43114: 'nAVAX',
	11155111: 'gwei',
	43113: 'nAVAX',
};

/**
 * チェーン固有の設定
 */
export interface ChainSpecificConfig {
	confirmations: number;
	blockTime: number; // seconds
	maxGasLimit: number;
	nativeTokenDecimals: number;
	explorerApiUrl?: string;
}

export const CHAIN_CONFIGS: Record<number, ChainSpecificConfig> = {
	1: {
		confirmations: 12,
		blockTime: 12,
		maxGasLimit: 10000000,
		nativeTokenDecimals: 18,
		explorerApiUrl: 'https://api.etherscan.io/api',
	},
	137: {
		confirmations: 10,
		blockTime: 2,
		maxGasLimit: 20000000,
		nativeTokenDecimals: 18,
		explorerApiUrl: 'https://api.polygonscan.com/api',
	},
	56: {
		confirmations: 15,
		blockTime: 3,
		maxGasLimit: 10000000,
		nativeTokenDecimals: 18,
		explorerApiUrl: 'https://api.bscscan.com/api',
	},
	43114: {
		confirmations: 5,
		blockTime: 3,
		maxGasLimit: 8000000,
		nativeTokenDecimals: 18,
		explorerApiUrl: 'https://api.routescan.io/v2/network/mainnet/evm/43114/etherscan/api',
	},
	11155111: {
		confirmations: 3,
		blockTime: 12,
		maxGasLimit: 10000000,
		nativeTokenDecimals: 18,
		explorerApiUrl: 'https://api-sepolia.etherscan.io/api',
	},
	43113: {
		confirmations: 1,
		blockTime: 3,
		maxGasLimit: 8000000,
		nativeTokenDecimals: 18,
		explorerApiUrl: 'https://api.routescan.io/v2/network/testnet/evm/43113/etherscan/api',
	},
};

/**
 * フォーセット情報（テストネット用）
 */
export const TESTNET_FAUCETS: Record<number, { name: string; url: string }[]> = {
	11155111: [
		{ name: 'Sepolia Faucet', url: 'https://sepoliafaucet.com/' },
		{ name: 'Alchemy Faucet', url: 'https://sepoliafaucet.net/' },
	],
	43113: [
		{ name: 'Avalanche Faucet', url: 'https://faucet.avax.network/' },
		{ name: 'Core Faucet', url: 'https://core.app/tools/testnet-faucet/' },
	],
};

/**
 * チェーンユーティリティ関数
 */
export const chainUtils = {
	/**
	 * チェーンIDからチェーン情報を取得
	 */
	getChainById(chainId: number): Chain | undefined {
		return Object.values(EVM_CHAINS).find(chain => chain.id === chainId);
	},

	/**
	 * チェーンがテストネットかどうか
	 */
	isTestnet(chainId: number): boolean {
		const chain = this.getChainById(chainId);
		return chain?.testnet ?? false;
	},

	/**
	 * チェーンの表示名を取得
	 */
	getDisplayName(chainId: number): string {
		return CHAIN_DISPLAY_NAMES[chainId] || `Chain ${chainId}`;
	},

	/**
	 * チェーンのアイコンを取得
	 */
	getIcon(chainId: number): string {
		return CHAIN_ICONS[chainId] || '⚪';
	},

	/**
	 * チェーンの色を取得
	 */
	getColors(chainId: number): { primary: string; secondary: string } {
		return CHAIN_COLORS[chainId] || { primary: '#6B7280', secondary: '#9CA3AF' };
	},

	/**
	 * アドレスのエクスプローラーURLを生成
	 */
	getExplorerUrl(chainId: number, address: string): string {
		const chain = this.getChainById(chainId);
		if (!chain?.blockExplorers) return '';
		return `${chain.blockExplorers.default.url}/address/${address}`;
	},

	/**
	 * トランザクションのエクスプローラーURLを生成
	 */
	getTxExplorerUrl(chainId: number, txHash: string): string {
		const chain = this.getChainById(chainId);
		if (!chain?.blockExplorers) return '';
		return `${chain.blockExplorers.default.url}/tx/${txHash}`;
	},

	/**
	 * チェーンがサポートされているかチェック
	 */
	isSupported(chainId: number): boolean {
		return Object.values(EVM_CHAINS).some(chain => chain.id === chainId);
	},

	/**
	 * アドレスを短縮表示
	 */
	formatAddress(address: string): string {
		if (!address || address.length < 10) return address;
		return `${address.slice(0, 6)}...${address.slice(-4)}`;
	},

	/**
	 * フォーセット情報を取得
	 */
	getFaucets(chainId: number): { name: string; url: string }[] {
		return TESTNET_FAUCETS[chainId] || [];
	},
};
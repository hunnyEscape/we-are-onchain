// src/auth/config/testnet-chains.ts
import { SelectableChain, SelectableChainId, ChainSelectionPreset } from '@/types/chain-selection';
import { sepolia, avalancheFuji } from 'wagmi/chains';

/**
 * テストネット用チェーン設定
 * Ethereum Sepolia と Avalanche Fuji の詳細設定
 */

// Ethereum Sepolia テストネット設定
export const SEPOLIA_TESTNET: SelectableChain = {
	// 識別子
	id: 'sepolia',
	chainId: sepolia.id, // 11155111

	// 表示情報
	name: sepolia.name,
	displayName: 'Ethereum Testnet',
	description: 'Ethereum testnet for development and testing',

	// UI要素
	icon: '🔵',
	colors: {
		primary: '#627EEA',
		secondary: '#8B9DC3',
	},

	// ネットワーク情報
	network: {
		rpcUrl: sepolia.rpcUrls.default.http[0],
		blockExplorer: sepolia.blockExplorers?.default.url || 'https://sepolia.etherscan.io',
		faucetUrls: [
			'https://sepoliafaucet.com/',
			'https://faucet.sepolia.dev/',
			'https://faucet.quicknode.com/ethereum/sepolia'
		],
	},

	// 機能フラグ
	isTestnet: true,
	isSupported: true,

	// メタデータ
	metadata: {
		averageBlockTime: 12, // seconds
		confirmations: 3,
		gasTokenSymbol: 'ETH',
		features: [
			'EIP-1559 Gas Optimization',
			'Smart Contracts',
			'NFT Support',
			'DeFi Compatible',
			'MetaMask Native Support'
		],
	},
};

// Avalanche Fuji テストネット設定
export const AVALANCHE_FUJI_TESTNET: SelectableChain = {
	// 識別子
	id: 'avalanche-fuji',
	chainId: avalancheFuji.id, // 43113

	// 表示情報
	name: avalancheFuji.name,
	displayName: 'Avalanche Testnet',
	description: 'Avalanche testnet for high-speed development',

	// UI要素
	icon: '🔺',
	colors: {
		primary: '#E84142',
		secondary: '#ED6B6C',
	},

	// ネットワーク情報
	network: {
		rpcUrl: avalancheFuji.rpcUrls.default.http[0],
		blockExplorer: avalancheFuji.blockExplorers?.default.url || 'https://testnet.snowtrace.io',
		faucetUrls: [
			'https://faucet.avax.network/',
			'https://core.app/tools/testnet-faucet/',
		],
	},

	// 機能フラグ
	isTestnet: true,
	isSupported: true,

	// メタデータ
	metadata: {
		averageBlockTime: 3, // seconds
		confirmations: 1,
		gasTokenSymbol: 'AVAX',
		features: [
			'High-Speed Transactions',
			'Low Gas Fees',
			'EVM Compatible',
			'Subnet Support',
			'Cross-Chain Bridge'
		],
	},
};

// サポートされているテストネットの配列
export const SUPPORTED_TESTNETS: SelectableChain[] = [
	SEPOLIA_TESTNET,
	AVALANCHE_FUJI_TESTNET,
];

// チェーンIDでの検索マップ
export const TESTNET_CHAIN_MAP: Record<SelectableChainId, SelectableChain> = {
	'sepolia': SEPOLIA_TESTNET,
	'avalanche-fuji': AVALANCHE_FUJI_TESTNET,
};

// Wagmi ChainIdでの検索マップ
export const WAGMI_CHAIN_ID_MAP: Record<number, SelectableChain> = {
	[sepolia.id]: SEPOLIA_TESTNET,
	[avalancheFuji.id]: AVALANCHE_FUJI_TESTNET,
};

// デフォルトチェーン設定
export const DEFAULT_TESTNET_CHAIN: SelectableChainId = 'sepolia';

// 環境別の推奨チェーン
export const getRecommendedChain = (): SelectableChainId => {
	// 開発環境での推奨チェーン
	const isDevelopment = process.env.NODE_ENV === 'development';

	// Avalancheの方が高速なので開発時に推奨
	return isDevelopment ? 'avalanche-fuji' : 'sepolia';
};

// プリセット設定
export const TESTNET_PRESETS: Record<string, ChainSelectionPreset> = {
	// 標準的な開発環境用
	development: {
		name: 'Development',
		description: 'Standard setup for development',
		chains: ['sepolia', 'avalanche-fuji'],
		defaultChain: 'avalanche-fuji',
		ui: {
			title: 'Select Development Network',
			description: 'Choose a testnet for development and testing',
			variant: 'default',
			columns: 2,
		},
	},

	// Ethereum 中心の開発
	ethereum: {
		name: 'Ethereum Focus',
		description: 'Ethereum-centric development',
		chains: ['sepolia'],
		defaultChain: 'sepolia',
		ui: {
			title: 'Connect to Ethereum',
			description: 'Connect to Ethereum testnet',
			variant: 'compact',
			columns: 1,
		},
	},

	// Avalanche 中心の開発
	avalanche: {
		name: 'Avalanche Focus',
		description: 'Avalanche-centric development',
		chains: ['avalanche-fuji'],
		defaultChain: 'avalanche-fuji',
		ui: {
			title: 'Connect to Avalanche',
			description: 'Connect to Avalanche testnet',
			variant: 'compact',
			columns: 1,
		},
	},

	// プロダクション準備用
	production: {
		name: 'Production Ready',
		description: 'Production-ready testnet setup',
		chains: ['sepolia', 'avalanche-fuji'],
		defaultChain: 'sepolia',
		ui: {
			title: 'Select Network',
			description: 'Choose your preferred blockchain network',
			variant: 'detailed',
			columns: 2,
		},
	},
};

// チェーン固有のユーティリティ関数
export const testnetUtils = {
	/**
	 * チェーンIDからSelectableChainを取得
	 */
	getChainById(chainId: SelectableChainId): SelectableChain | null {
		return TESTNET_CHAIN_MAP[chainId] || null;
	},

	/**
	 * WagmiチェーンIDからSelectableChainを取得
	 */
	getChainByWagmiId(wagmiChainId: number): SelectableChain | null {
		return WAGMI_CHAIN_ID_MAP[wagmiChainId] || null;
	},

	/**
	 * すべてのサポートされているチェーンを取得
	 */
	getAllSupportedChains(): SelectableChain[] {
		return SUPPORTED_TESTNETS.filter(chain => chain.isSupported);
	},

	/**
	 * チェーンがサポートされているかチェック
	 */
	isChainSupported(chainId: SelectableChainId): boolean {
		const chain = this.getChainById(chainId);
		return chain?.isSupported ?? false;
	},

	/**
	 * チェーンの表示名を取得
	 */
	getDisplayName(chainId: SelectableChainId): string {
		const chain = this.getChainById(chainId);
		return chain?.displayName || 'Unknown Network';
	},

	/**
	 * チェーンのアイコンを取得
	 */
	getIcon(chainId: SelectableChainId): string {
		const chain = this.getChainById(chainId);
		return chain?.icon || '⚪';
	},

	/**
	 * チェーンの色を取得
	 */
	getColors(chainId: SelectableChainId): { primary: string; secondary: string } {
		const chain = this.getChainById(chainId);
		return chain?.colors || { primary: '#6B7280', secondary: '#9CA3AF' };
	},

	/**
	 * フォーセットURLsを取得
	 */
	getFaucetUrls(chainId: SelectableChainId): string[] {
		const chain = this.getChainById(chainId);
		return chain?.network.faucetUrls || [];
	},

	/**
	 * ブロックエクスプローラーURLを取得
	 */
	getExplorerUrl(chainId: SelectableChainId): string {
		const chain = this.getChainById(chainId);
		return chain?.network.blockExplorer || '';
	},

	/**
	 * アドレスのエクスプローラーURLを生成
	 */
	getAddressExplorerUrl(chainId: SelectableChainId, address: string): string {
		const explorerUrl = this.getExplorerUrl(chainId);
		return explorerUrl ? `${explorerUrl}/address/${address}` : '';
	},

	/**
	 * トランザクションのエクスプローラーURLを生成
	 */
	getTxExplorerUrl(chainId: SelectableChainId, txHash: string): string {
		const explorerUrl = this.getExplorerUrl(chainId);
		return explorerUrl ? `${explorerUrl}/tx/${txHash}` : '';
	},

	/**
	 * チェーンの平均ブロック時間を取得
	 */
	getBlockTime(chainId: SelectableChainId): number {
		const chain = this.getChainById(chainId);
		return chain?.metadata.averageBlockTime || 12;
	},

	/**
	 * 推奨確認数を取得
	 */
	getConfirmations(chainId: SelectableChainId): number {
		const chain = this.getChainById(chainId);
		return chain?.metadata.confirmations || 3;
	},

	/**
	 * ガストークンのシンボルを取得
	 */
	getGasTokenSymbol(chainId: SelectableChainId): string {
		const chain = this.getChainById(chainId);
		return chain?.metadata.gasTokenSymbol || 'ETH';
	},

	/**
	 * プリセット設定を取得
	 */
	getPreset(presetName: string): ChainSelectionPreset | null {
		return TESTNET_PRESETS[presetName] || null;
	},

	/**
	 * 環境に適したプリセットを取得
	 */
	getEnvironmentPreset(): ChainSelectionPreset {
		const isDevelopment = process.env.NODE_ENV === 'development';
		return isDevelopment ? TESTNET_PRESETS.development : TESTNET_PRESETS.production;
	},

	/**
	 * チェーンの機能一覧を取得
	 */
	getFeatures(chainId: SelectableChainId): string[] {
		const chain = this.getChainById(chainId);
		return chain?.metadata.features || [];
	},

	/**
	 * アドレスを短縮表示
	 */
	formatAddress(address: string): string {
		if (!address || address.length < 10) return address;
		return `${address.slice(0, 6)}...${address.slice(-4)}`;
	},

	/**
	 * チェーン比較用の統計情報
	 */
	getComparisonStats(): Array<{
		chainId: SelectableChainId;
		name: string;
		blockTime: number;
		confirmations: number;
		features: number;
	}> {
		return SUPPORTED_TESTNETS.map(chain => ({
			chainId: chain.id,
			name: chain.displayName,
			blockTime: chain.metadata.averageBlockTime,
			confirmations: chain.metadata.confirmations,
			features: chain.metadata.features.length,
		}));
	},
};

// 開発環境用のデバッグ情報
export const debugInfo = {
	supportedChains: SUPPORTED_TESTNETS.length,
	defaultChain: DEFAULT_TESTNET_CHAIN,
	recommendedChain: getRecommendedChain(),
	availablePresets: Object.keys(TESTNET_PRESETS),

	// 各チェーンの基本情報
	chainSummary: SUPPORTED_TESTNETS.map(chain => ({
		id: chain.id,
		name: chain.displayName,
		chainId: chain.chainId,
		isSupported: chain.isSupported,
		blockTime: chain.metadata.averageBlockTime,
	})),
};
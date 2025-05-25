-e 
### FILE: ./src/contexts/AuthContext.tsx

// src/contexts/AuthContext.tsx
'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useRef } from 'react';
import {
	User as FirebaseUser,
	onAuthStateChanged,
	signInWithEmailAndPassword,
	createUserWithEmailAndPassword,
	signOut,
	GoogleAuthProvider,
	signInWithPopup
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { 
	FirestoreUser, 
	UpdateUserProfile 
} from '../../types/user';
import {
	syncAuthWithFirestore,
	updateUserProfile,
	subscribeToUser,
	getUserById
} from '@/lib/firestore/users';

interface AuthContextType {
	// Firebase Auth関連
	user: FirebaseUser | null;
	loading: boolean;
	signIn: (email: string, password: string) => Promise<void>;
	signUp: (email: string, password: string) => Promise<void>;
	signInWithGoogle: () => Promise<void>;
	logout: () => Promise<void>;
	
	// Firestore関連
	firestoreUser: FirestoreUser | null;
	firestoreLoading: boolean;
	updateProfile: (data: UpdateUserProfile) => Promise<void>;
	refreshUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
	const context = useContext(AuthContext);
	if (context === undefined) {
		throw new Error('useAuth must be used within an AuthProvider');
	}
	return context;
};

interface AuthProviderProps {
	children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
	// Firebase Auth状態
	const [user, setUser] = useState<FirebaseUser | null>(null);
	const [loading, setLoading] = useState(true);
	
	// Firestore状態
	const [firestoreUser, setFirestoreUser] = useState<FirestoreUser | null>(null);
	const [firestoreLoading, setFirestoreLoading] = useState(false);
	
	// 無限ループ防止用のref
	const lastSyncedUserId = useRef<string | null>(null);
	const firestoreUnsubscribe = useRef<(() => void) | null>(null);
	const isSyncing = useRef<boolean>(false);

	// Firebase Auth状態変化を監視
	useEffect(() => {
		const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
			console.log('🔄 Auth state changed:', firebaseUser?.uid || 'null');
			
			// 既存のFirestore監視を停止
			if (firestoreUnsubscribe.current) {
				firestoreUnsubscribe.current();
				firestoreUnsubscribe.current = null;
			}

			if (firebaseUser) {
				setUser(firebaseUser);
				
				// 同じユーザーで既に同期済みの場合はスキップ
				if (lastSyncedUserId.current === firebaseUser.uid && !isSyncing.current) {
					console.log('👤 User already synced, skipping sync:', firebaseUser.uid);
					setLoading(false);
					return;
				}
				
				// 同期中フラグを設定
				if (isSyncing.current) {
					console.log('⏳ Sync already in progress, skipping...');
					return;
				}
				
				setFirestoreLoading(true);
				isSyncing.current = true;
				
				try {
					// Firebase AuthとFirestoreを同期（初回のみlastLoginAtを更新）
					const shouldUpdateLastLogin = lastSyncedUserId.current !== firebaseUser.uid;
					
					if (shouldUpdateLastLogin) {
						await syncAuthWithFirestore(firebaseUser);
						lastSyncedUserId.current = firebaseUser.uid;
						console.log('✅ Initial sync completed for user:', firebaseUser.uid);
					}
					
					// Firestoreユーザーデータをリアルタイム監視開始
					const unsubscribeFirestore = subscribeToUser(firebaseUser.uid, (userData) => {
						console.log('📊 Firestore user data updated:', userData?.id || 'null');
						setFirestoreUser(userData);
						setFirestoreLoading(false);
					});
					
					firestoreUnsubscribe.current = unsubscribeFirestore;
					
				} catch (error) {
					console.error('❌ Error syncing with Firestore:', error);
					setFirestoreUser(null);
					setFirestoreLoading(false);
				} finally {
					isSyncing.current = false;
				}
			} else {
				// ログアウト時の状態リセット
				setUser(null);
				setFirestoreUser(null);
				setFirestoreLoading(false);
				lastSyncedUserId.current = null;
				isSyncing.current = false;
			}
			
			setLoading(false);
		});

		return () => {
			unsubscribe();
			if (firestoreUnsubscribe.current) {
				firestoreUnsubscribe.current();
			}
		};
	}, []); // 空の依存配列で一度だけ実行

	// 認証関数
	const signIn = async (email: string, password: string) => {
		try {
			setLoading(true);
			await signInWithEmailAndPassword(auth, email, password);
			// onAuthStateChangedで自動的にFirestore同期が実行される
		} catch (error) {
			console.error('❌ サインインエラー:', error);
			setLoading(false);
			throw error;
		}
	};

	const signUp = async (email: string, password: string) => {
		try {
			setLoading(true);
			await createUserWithEmailAndPassword(auth, email, password);
			// onAuthStateChangedで自動的にFirestore同期が実行される
		} catch (error) {
			console.error('❌ サインアップエラー:', error);
			setLoading(false);
			throw error;
		}
	};

	const signInWithGoogle = async () => {
		try {
			setLoading(true);
			const provider = new GoogleAuthProvider();
			await signInWithPopup(auth, provider);
			// onAuthStateChangedで自動的にFirestore同期が実行される
		} catch (error) {
			console.error('❌ Googleサインインエラー:', error);
			setLoading(false);
			throw error;
		}
	};

	const logout = async () => {
		try {
			setLoading(true);
			lastSyncedUserId.current = null; // リセット
			await signOut(auth);
			// onAuthStateChangedで自動的に状態がリセットされる
		} catch (error) {
			console.error('❌ ログアウトエラー:', error);
			setLoading(false);
			throw error;
		}
	};

	// Firestoreプロフィール更新
	const updateProfile = async (data: UpdateUserProfile) => {
		if (!user) {
			throw new Error('User not authenticated');
		}
		
		try {
			setFirestoreLoading(true);
			await updateUserProfile(user.uid, data);
			// subscribeToUserで自動的に最新データが反映される
			console.log('✅ Profile updated successfully');
		} catch (error) {
			console.error('❌ Error updating profile:', error);
			setFirestoreLoading(false);
			throw error;
		}
	};

	// Firestoreユーザーデータを手動で再取得
	const refreshUserData = async () => {
		if (!user) {
			throw new Error('User not authenticated');
		}
		
		try {
			setFirestoreLoading(true);
			const userData = await getUserById(user.uid);
			setFirestoreUser(userData);
			setFirestoreLoading(false);
			console.log('🔄 User data refreshed');
		} catch (error) {
			console.error('❌ Error refreshing user data:', error);
			setFirestoreLoading(false);
			throw error;
		}
	};

	const value = {
		// Firebase Auth
		user,
		loading,
		signIn,
		signUp,
		signInWithGoogle,
		logout,
		
		// Firestore
		firestoreUser,
		firestoreLoading,
		updateProfile,
		refreshUserData,
	};

	return (
		<AuthContext.Provider value={value}>
			{children}
		</AuthContext.Provider>
	);
};-e 
### FILE: ./src/lib/firebase.ts

// src/lib/firebase.ts
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
	apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
	authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
	projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
	storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
	messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
	appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Firebase初期化
const app = initializeApp(firebaseConfig);

// Authentication初期化
export const auth = getAuth(app);

export const db = getFirestore(app);

export default app;-e 
### FILE: ./src/lib/avalanche-config.ts

// src/lib/avalanche-config.ts
import { AvalancheConfig, PaymentMonitorConfig, QRCodeConfig, RateLimitConfig } from '../../types/demo-payment';

/**
 * Avalanche FUJI Testnet 設定
 */
export const AVALANCHE_FUJI_CONFIG: AvalancheConfig = {
  chainId: 43113,
  name: 'Avalanche FUJI C-Chain',
  rpcUrl: process.env.AVALANCHE_FUJI_RPC_URL || 'https://api.avax-test.network/ext/bc/C/rpc',
  blockExplorer: 'https://testnet.snowscan.xyz',
  nativeCurrency: {
    name: 'Avalanche',
    symbol: 'AVAX',
    decimals: 18
  },
  faucetUrl: 'https://faucet.avax.network/',
  averageBlockTime: 2000, // 2秒
  confirmationBlocks: 3
};

/**
 * フォールバック RPC エンドポイント（冗長性確保）
 */
export const AVALANCHE_FUJI_RPC_ENDPOINTS = [
  'https://api.avax-test.network/ext/bc/C/rpc',
  'https://avalanche-fuji.public.blastapi.io/ext/bc/C/rpc',
  'https://rpc.ankr.com/avalanche_fuji'
];

/**
 * ガス価格設定（FUJI Testnet用）
 */
export const GAS_CONFIG = {
  gasLimit: '21000', // 標準送金
  maxFeePerGas: '30000000000', // 30 gwei
  maxPriorityFeePerGas: '2000000000', // 2 gwei
  gasBuffer: 1.2 // 20%のバッファ
};

/**
 * デモ決済設定
 */
export const DEMO_PAYMENT_CONFIG = {
  // 基本設定
  defaultAmount: process.env.DEMO_INVOICE_AMOUNT || '0.001', // AVAX
  expiryMinutes: parseInt(process.env.INVOICE_EXPIRY_MINUTES || '5'),
  
  // HDウォレット設定
  masterMnemonic: process.env.MASTER_WALLET_MNEMONIC || 'test test test test test test test test test test test junk',
  derivationPath: "m/44'/43113'/0'/0/", // Avalanche用のBIP44パス
  
  // セキュリティ設定
  maxAddressReuse: 1000, // 最大1000アドレスまで生成
  addressPoolSize: 100, // 事前生成プール
};

/**
 * 決済監視設定
 */
export const PAYMENT_MONITOR_CONFIG: PaymentMonitorConfig = {
  pollInterval: 5000, // 5秒間隔
  maxPollDuration: 300000, // 5分間
  confirmationBlocks: 3, // 3ブロック確認
  retryAttempts: 3,
  backoffMultiplier: 1.5
};

/**
 * QRコード生成設定
 */
export const QR_CODE_CONFIG: QRCodeConfig = {
  size: 300,
  margin: 4,
  colorDark: '#000000',
  colorLight: '#ffffff',
  errorCorrectionLevel: 'M' // 中程度のエラー訂正
};

/**
 * Rate Limiting設定
 */
export const RATE_LIMIT_CONFIG: RateLimitConfig = {
  maxInvoicesPerIP: 3, // IPあたり最大3個
  windowMinutes: 60, // 1時間ウィンドウ
  maxInvoicesPerHour: 10, // 1時間あたり最大10個
  cleanupIntervalMinutes: 5 // 5分間隔でクリーンアップ
};

/**
 * Firestore コレクション名
 */
export const FIRESTORE_COLLECTIONS = {
  DEMO_INVOICES: 'demo_invoices',
  DEMO_TRANSACTIONS: 'demo_transactions',
  DEMO_ANALYTICS: 'demo_analytics',
  DEMO_RATE_LIMITS: 'demo_rate_limits'
} as const;

/**
 * 環境変数バリデーション
 */
export function validateEnvironmentVariables(): { isValid: boolean; missingVars: string[] } {
  const requiredVars = [
    'AVALANCHE_FUJI_RPC_URL',
    'MASTER_WALLET_MNEMONIC',
    'NEXT_PUBLIC_FIREBASE_PROJECT_ID'
  ];
  
  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  return {
    isValid: missingVars.length === 0,
    missingVars
  };
}

/**
 * Avalanche用のEIP-681 URI生成
 */
export function generatePaymentURI(address: string, amountWei: string, chainId: number = 43113): string {
  return `ethereum:${address}?value=${amountWei}&chainId=${chainId}`;
}

/**
 * Wei から AVAX への変換
 */
export function weiToAVAX(weiAmount: string): string {
  const wei = BigInt(weiAmount);
  const avax = Number(wei) / Math.pow(10, 18);
  return avax.toFixed(6); // 6桁精度
}

/**
 * AVAX から Wei への変換
 */
export function avaxToWei(avaxAmount: string): string {
  const avax = parseFloat(avaxAmount);
  const wei = BigInt(Math.floor(avax * Math.pow(10, 18)));
  return wei.toString();
}

/**
 * ブロックエクスプローラーURL生成
 */
export function getExplorerURL(type: 'tx' | 'address', value: string): string {
  const baseUrl = AVALANCHE_FUJI_CONFIG.blockExplorer;
  return type === 'tx' 
    ? `${baseUrl}/tx/${value}`
    : `${baseUrl}/address/${value}`;
}

/**
 * デモ用の統計データ初期化
 */
export function createInitialAnalytics(date: string) {
  return {
    date,
    invoicesGenerated: 0,
    invoicesCompleted: 0,
    invoicesExpired: 0,
    averageCompletionTime: 0,
    totalAmountPaid: '0',
    uniqueIPs: 0,
    popularTimeSlots: {}
  };
}

/**
 * 開発環境判定
 */
export const isDevelopment = process.env.NODE_ENV === 'development';
export const isProduction = process.env.NODE_ENV === 'production';

/**
 * ログ設定
 */
export const LOGGING_CONFIG = {
  enableDebugLogs: isDevelopment,
  enableAPILogs: true,
  enableErrorTracking: isProduction,
  logLevel: isDevelopment ? 'debug' : 'info'
};

/**
 * セキュリティ設定
 */
export const SECURITY_CONFIG = {
  // Private key暗号化（将来実装）
  enablePrivateKeyEncryption: false,
  encryptionKey: process.env.ENCRYPTION_KEY,
  
  // IPアドレス記録
  recordIPAddresses: true,
  enableGeoLocation: false,
  
  // CORS設定
  allowedOrigins: isDevelopment 
    ? ['http://localhost:3000', 'http://127.0.0.1:3000']
    : [process.env.NEXT_PUBLIC_APP_URL || 'https://your-domain.com']
};-e 
### FILE: ./src/lib/firestore/users.ts

// src/lib/firestore/users.ts
import {
	doc,
	getDoc,
	setDoc,
	updateDoc,
	collection,
	query,
	where,
	onSnapshot,
	serverTimestamp,
	Timestamp
} from 'firebase/firestore';
import { User as FirebaseUser } from 'firebase/auth';
import { db } from '@/lib/firebase';
import {
	FirestoreUser,
	CreateUserData,
	UpdateUserProfile,
	UpdateUserStats,
	ProfileCompleteness
} from '../../../types/user';
import { UserProfile } from '../../../types/dashboard';

// コレクション名
const USERS_COLLECTION = 'users';

/**
 * ユーザーが存在するかチェック
 */
export const checkUserExists = async (userId: string): Promise<boolean> => {
	try {
		const userRef = doc(db, USERS_COLLECTION, userId);
		const userSnap = await getDoc(userRef);
		return userSnap.exists();
	} catch (error) {
		console.error('Error checking user existence:', error);
		return false;
	}
};

/**
 * ユーザーIDでFirestoreユーザーデータを取得
 */
export const getUserById = async (userId: string): Promise<FirestoreUser | null> => {
	try {
		const userRef = doc(db, USERS_COLLECTION, userId);
		const userSnap = await getDoc(userRef);

		if (userSnap.exists()) {
			return { id: userSnap.id, ...userSnap.data() } as FirestoreUser;
		}
		return null;
	} catch (error) {
		console.error('Error getting user:', error);
		return null;
	}
};

/**
 * EmptyUserデータを生成
 */
export const generateEmptyUserData = (firebaseUser: FirebaseUser): CreateUserData => {
	return {
		id: firebaseUser.uid,
		email: firebaseUser.email || '',
		displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Anonymous User',
		nickname: firebaseUser.displayName || undefined,
		profileImage: firebaseUser.photoURL || undefined,
		address: {},
		isEmailVerified: firebaseUser.emailVerified,
		isActive: true,
		membershipTier: 'bronze',
		isProfileComplete: false,
		stats: {
			totalSpent: 0,
			totalSpentUSD: 0,
			totalOrders: 0,
			rank: 999999,
			badges: ['New Member']
		}
	};
};

/**
 * 新規ユーザーをFirestoreに作成
 */
export const createEmptyUser = async (firebaseUser: FirebaseUser): Promise<FirestoreUser> => {
	try {
		const userData = generateEmptyUserData(firebaseUser);
		const userRef = doc(db, USERS_COLLECTION, firebaseUser.uid);

		const firestoreUserData = {
			...userData,
			createdAt: serverTimestamp(),
			updatedAt: serverTimestamp(),
			lastLoginAt: serverTimestamp(),
		};

		await setDoc(userRef, firestoreUserData);

		// 作成されたデータを返す（serverTimestampはFirestoreで自動変換される）
		const createdUser = await getUserById(firebaseUser.uid);
		if (!createdUser) {
			throw new Error('Failed to retrieve created user');
		}

		console.log('✅ New user created in Firestore:', firebaseUser.uid);
		return createdUser;
	} catch (error) {
		console.error('Error creating empty user:', error);
		throw error;
	}
};

/**
 * 最終ログイン時刻を更新
 */
export const updateLastLogin = async (userId: string): Promise<void> => {
	try {
		const userRef = doc(db, USERS_COLLECTION, userId);
		await updateDoc(userRef, {
			lastLoginAt: serverTimestamp(),
			updatedAt: serverTimestamp()
		});
		console.log('✅ Last login updated for user:', userId);
	} catch (error) {
		console.error('Error updating last login:', error);
		throw error;
	}
};

/**
 * プロフィール情報を更新
 */
export const updateUserProfile = async (
	userId: string,
	profileData: UpdateUserProfile
): Promise<void> => {
	try {
		const userRef = doc(db, USERS_COLLECTION, userId);
		await updateDoc(userRef, {
			...profileData,
			updatedAt: serverTimestamp()
		});
		console.log('✅ User profile updated:', userId);
	} catch (error) {
		console.error('Error updating user profile:', error);
		throw error;
	}
};

/**
 * ユーザー統計を更新
 */
export const updateUserStats = async (
	userId: string,
	statsData: UpdateUserStats
): Promise<void> => {
	try {
		const userRef = doc(db, USERS_COLLECTION, userId);
		await updateDoc(userRef, {
			'stats.totalSpent': statsData.totalSpent,
			'stats.totalSpentUSD': statsData.totalSpentUSD,
			'stats.totalOrders': statsData.totalOrders,
			'stats.rank': statsData.rank,
			'stats.badges': statsData.badges,
			updatedAt: serverTimestamp()
		});
		console.log('✅ User stats updated:', userId);
	} catch (error) {
		console.error('Error updating user stats:', error);
		throw error;
	}
};

/**
 * Firebase AuthとFirestoreの自動同期（最適化版）
 */
export const syncAuthWithFirestore = async (firebaseUser: FirebaseUser): Promise<FirestoreUser> => {
	try {
		// 1. ユーザー存在確認
		const existingUser = await getUserById(firebaseUser.uid);

		if (!existingUser) {
			// 2. 存在しない場合：EmptyUserを作成
			console.log('🆕 Creating new user in Firestore:', firebaseUser.uid);
			return await createEmptyUser(firebaseUser);
		} else {
			// 3. 存在する場合：lastLoginAtを更新（ただし、最後の更新から5分以上経過している場合のみ）
			const now = new Date();
			const lastLogin = existingUser.lastLoginAt instanceof Timestamp
				? existingUser.lastLoginAt.toDate()
				: new Date(existingUser.lastLoginAt as any);

			const timeDiff = now.getTime() - lastLogin.getTime();
			const fiveMinutesInMs = 5 * 60 * 1000; // 5分

			if (timeDiff > fiveMinutesInMs) {
				console.log('🔄 Updating lastLoginAt for user:', firebaseUser.uid);
				await updateLastLogin(firebaseUser.uid);
			} else {
				console.log('⏭️ Skipping lastLoginAt update (too recent):', firebaseUser.uid);
			}

			// 最新データを取得して返す
			const updatedUser = await getUserById(firebaseUser.uid);
			return updatedUser!;
		}
	} catch (error) {
		console.error('Error syncing auth with Firestore:', error);
		throw error;
	}
};

/**
 * リアルタイムでユーザーデータを監視
 */
export const subscribeToUser = (
	userId: string,
	callback: (user: FirestoreUser | null) => void
): (() => void) => {
	const userRef = doc(db, USERS_COLLECTION, userId);

	return onSnapshot(userRef, (doc) => {
		if (doc.exists()) {
			callback({ id: doc.id, ...doc.data() } as FirestoreUser);
		} else {
			callback(null);
		}
	}, (error) => {
		console.error('Error subscribing to user:', error);
		callback(null);
	});
};

/**
 * プロフィール完成度をチェック
 */
export const checkProfileCompleteness = (user: FirestoreUser): ProfileCompleteness => {
	const requiredFields: (keyof FirestoreUser)[] = [
		'displayName',
		'address'
	];

	const missingFields: string[] = [];
	let completedFields = 0;

	// 基本情報チェック
	if (!user.displayName?.trim()) {
		missingFields.push('Display Name');
	} else {
		completedFields++;
	}

	// 住所情報チェック
	if (!user.address?.country || !user.address?.prefecture ||
		!user.address?.city || !user.address?.addressLine1 ||
		!user.address?.postalCode) {
		missingFields.push('Address Information');
	} else {
		completedFields++;
	}

	const completionPercentage = Math.round((completedFields / requiredFields.length) * 100);
	const isComplete = missingFields.length === 0;

	return {
		isComplete,
		completionPercentage,
		missingFields,
		requiredFields
	};
};

/**
 * FirestoreUserを既存のUserProfile形式に変換
 */
export const firestoreUserToUserProfile = (firestoreUser: FirestoreUser): UserProfile => {
	return {
		walletAddress: firestoreUser.walletAddress || firestoreUser.id,
		displayName: firestoreUser.displayName,
		totalSpent: firestoreUser.stats.totalSpent,
		totalOrders: firestoreUser.stats.totalOrders,
		rank: firestoreUser.stats.rank,
		badges: firestoreUser.stats.badges,
		joinDate: firestoreUser.createdAt instanceof Timestamp
			? firestoreUser.createdAt.toDate()
			: new Date(firestoreUser.createdAt as any)
	};
};-e 
### FILE: ./src/lib/firestore/inventory.ts

// src/lib/firestore/inventory.ts
import {
	doc,
	collection,
	getDocs,
	getDoc,
	setDoc,
	updateDoc,
	deleteDoc,
	query,
	where,
	orderBy,
	limit as firestoreLimit,
	writeBatch,
	runTransaction,
	serverTimestamp,
	Timestamp,
	addDoc
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
	CartReservation,
	StockCheckResult,
	UpdateInventoryData,
	BatchInventoryUpdate,
	ProductError
} from '../../../types/product';
import { getProductById } from './products';
import { handleAsyncOperation } from '@/utils/errorHandling';

// コレクション名
const RESERVATIONS_COLLECTION = 'cart_reservations';
const PRODUCTS_COLLECTION = 'products';

// 予約の有効期限（15分）
const RESERVATION_EXPIRY_MINUTES = 15;
const RESERVATION_EXPIRY_MS = RESERVATION_EXPIRY_MINUTES * 60 * 1000;

/**
 * セッションIDを生成（匿名ユーザー用）
 */
export const generateSessionId = (): string => {
	return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * 予約期限を計算
 */
const calculateExpiryTime = (): Timestamp => {
	const expiryTime = new Date(Date.now() + RESERVATION_EXPIRY_MS);
	return Timestamp.fromDate(expiryTime);
};

/**
 * 在庫チェック（詳細情報付き）
 */
export const checkStockAvailability = async (
	productId: string,
	requestedQuantity: number,
	userId?: string,
	sessionId?: string
): Promise<StockCheckResult> => {
	const result = await handleAsyncOperation(async () => {
		const product = await getProductById(productId);

		if (!product) {
			throw new Error(`Product not found: ${productId}`);
		}

		// 既存予約を確認
		let existingReservation: StockCheckResult['existingReservation'] = undefined;

		if (userId || sessionId) {
			const reservationQuery = query(
				collection(db, RESERVATIONS_COLLECTION),
				where('productId', '==', productId),
				where('status', '==', 'active'),
				userId ? where('userId', '==', userId) : where('sessionId', '==', sessionId)
			);

			const reservationSnapshot = await getDocs(reservationQuery);

			if (!reservationSnapshot.empty) {
				const reservation = reservationSnapshot.docs[0].data() as CartReservation;
				existingReservation = {
					quantity: reservation.quantity,
					expiresAt: reservation.expiresAt
				};
			}
		}

		// 利用可能数量を計算（既存予約は除外）
		const availableForUser = product.inventory.availableStock + (existingReservation?.quantity || 0);
		const maxOrderQuantity = product.settings.maxOrderQuantity;
		const maxCanReserve = Math.min(availableForUser, maxOrderQuantity);

		// 制限理由をチェック
		const limitReasons = {
			exceedsStock: requestedQuantity > availableForUser,
			exceedsOrderLimit: requestedQuantity > maxOrderQuantity,
			productInactive: !product.settings.isActive
		};

		const canReserve = requestedQuantity <= maxCanReserve &&
			product.settings.isActive &&
			!limitReasons.exceedsStock &&
			!limitReasons.exceedsOrderLimit;

		return {
			productId,
			requestedQuantity,
			totalStock: product.inventory.totalStock,
			availableStock: product.inventory.availableStock,
			reservedStock: product.inventory.reservedStock,
			canReserve,
			maxCanReserve: Math.max(0, maxCanReserve),
			limitReasons,
			existingReservation
		};
	}, 'stock-check');

	if (result.error) {
		console.error('Error checking stock availability:', result.error);
		// エラー時は安全側に倒す
		return {
			productId,
			requestedQuantity,
			totalStock: 0,
			availableStock: 0,
			reservedStock: 0,
			canReserve: false,
			maxCanReserve: 0,
			limitReasons: {
				exceedsStock: true,
				exceedsOrderLimit: false,
				productInactive: false
			}
		};
	}

	return result.data!;
};

/**
 * 在庫を予約
 */
export const reserveStock = async (
	productId: string,
	quantity: number,
	userId?: string,
	sessionId?: string
): Promise<{ success: boolean; reservationId?: string; error?: ProductError }> => {
	if (!userId && !sessionId) {
		return {
			success: false,
			error: {
				code: 'validation-error',
				message: 'Either userId or sessionId is required',
				productId
			}
		};
	}

	const result = await handleAsyncOperation(async () => {
		return await runTransaction(db, async (transaction) => {
			// 1. 在庫チェック
			const stockCheck = await checkStockAvailability(productId, quantity, userId, sessionId);

			if (!stockCheck.canReserve) {
				let errorCode: ProductError['code'] = 'insufficient-stock';
				let message = 'Cannot reserve stock';

				if (stockCheck.limitReasons.productInactive) {
					errorCode = 'product-inactive';
					message = 'Product is not available';
				} else if (stockCheck.limitReasons.exceedsStock) {
					errorCode = 'insufficient-stock';
					message = `Only ${stockCheck.maxCanReserve} items available`;
				}

				throw new Error(`${errorCode}:${message}`);
			}

			// 2. 既存予約を処理
			if (stockCheck.existingReservation) {
				// 既存予約を更新
				const existingReservationQuery = query(
					collection(db, RESERVATIONS_COLLECTION),
					where('productId', '==', productId),
					where('status', '==', 'active'),
					userId ? where('userId', '==', userId) : where('sessionId', '==', sessionId)
				);

				const existingSnapshot = await getDocs(existingReservationQuery);
				if (!existingSnapshot.empty) {
					const existingReservationDoc = existingSnapshot.docs[0];
					const existingReservation = existingReservationDoc.data() as CartReservation;

					// 予約数量を更新
					transaction.update(existingReservationDoc.ref, {
						quantity,
						expiresAt: calculateExpiryTime()
					});

					// 商品の予約在庫を更新
					const productRef = doc(db, PRODUCTS_COLLECTION, productId);
					const stockDiff = quantity - existingReservation.quantity;

					transaction.update(productRef, {
						'inventory.availableStock': stockCheck.availableStock - stockDiff,
						'inventory.reservedStock': stockCheck.reservedStock + stockDiff,
						'timestamps.updatedAt': serverTimestamp()
					});

					return { reservationId: existingReservationDoc.id };
				}
			}

			// 3. 新規予約を作成
			const reservationData: Omit<CartReservation, 'id'> = {
				userId,
				sessionId: sessionId || `session_${Date.now()}`,
				productId,
				quantity,
				createdAt: serverTimestamp() as Timestamp,
				expiresAt: calculateExpiryTime(),
				status: 'active'
			};

			const reservationRef = doc(collection(db, RESERVATIONS_COLLECTION));
			transaction.set(reservationRef, reservationData);

			// 4. 商品の在庫を更新
			const productRef = doc(db, PRODUCTS_COLLECTION, productId);
			transaction.update(productRef, {
				'inventory.availableStock': stockCheck.availableStock - quantity,
				'inventory.reservedStock': stockCheck.reservedStock + quantity,
				'timestamps.updatedAt': serverTimestamp()
			});

			return { reservationId: reservationRef.id };
		});
	}, 'stock-reservation');

	if (result.error) {
		console.error('Error reserving stock:', result.error);

		// エラーメッセージからエラーコードを抽出
		const errorMessage = result.error.message;
		if (errorMessage.includes('insufficient-stock')) {
			return {
				success: false,
				error: {
					code: 'insufficient-stock',
					message: errorMessage.split(':')[1] || 'Insufficient stock',
					productId,
					requestedQuantity: quantity
				}
			};
		}

		if (errorMessage.includes('product-inactive')) {
			return {
				success: false,
				error: {
					code: 'product-inactive',
					message: 'Product is not available',
					productId
				}
			};
		}

		return {
			success: false,
			error: {
				code: 'validation-error',
				message: 'Failed to reserve stock',
				productId,
				requestedQuantity: quantity
			}
		};
	}

	return {
		success: true,
		reservationId: result.data!.reservationId
	};
};

/**
 * 予約をキャンセル（在庫を解放）
 */
export const cancelReservation = async (
	productId: string,
	userId?: string,
	sessionId?: string
): Promise<{ success: boolean; error?: ProductError }> => {
	const result = await handleAsyncOperation(async () => {
		return await runTransaction(db, async (transaction) => {
			// 1. 予約を検索
			const reservationQuery = query(
				collection(db, RESERVATIONS_COLLECTION),
				where('productId', '==', productId),
				where('status', '==', 'active'),
				userId ? where('userId', '==', userId) : where('sessionId', '==', sessionId)
			);

			const reservationSnapshot = await getDocs(reservationQuery);

			if (reservationSnapshot.empty) {
				throw new Error('Reservation not found');
			}

			const reservationDoc = reservationSnapshot.docs[0];
			const reservation = reservationDoc.data() as CartReservation;

			// 2. 予約をキャンセル状態に更新
			transaction.update(reservationDoc.ref, {
				status: 'cancelled'
			});

			// 3. 商品の在庫を復元
			const productRef = doc(db, PRODUCTS_COLLECTION, productId);
			const productSnapshot = await transaction.get(productRef);

			if (productSnapshot.exists()) {
				const currentStock = productSnapshot.data().inventory;

				transaction.update(productRef, {
					'inventory.availableStock': currentStock.availableStock + reservation.quantity,
					'inventory.reservedStock': currentStock.reservedStock - reservation.quantity,
					'timestamps.updatedAt': serverTimestamp()
				});
			}

			return { success: true };
		});
	}, 'cancel-reservation');

	if (result.error) {
		console.error('Error cancelling reservation:', result.error);
		return {
			success: false,
			error: {
				code: 'not-found',
				message: 'Reservation not found or already processed',
				productId
			}
		};
	}

	return result.data || { success: false };
};

/**
 * 期限切れ予約を自動削除
 */
export const cleanupExpiredReservations = async (): Promise<number> => {
	const result = await handleAsyncOperation(async () => {
		const now = Timestamp.now();
		const expiredQuery = query(
			collection(db, RESERVATIONS_COLLECTION),
			where('status', '==', 'active'),
			where('expiresAt', '<=', now)
		);

		const expiredSnapshot = await getDocs(expiredQuery);

		if (expiredSnapshot.empty) {
			return 0;
		}

		const batch = writeBatch(db);
		const productUpdates: { [productId: string]: number } = {};

		// 期限切れ予約を処理
		expiredSnapshot.docs.forEach((doc) => {
			const reservation = doc.data() as CartReservation;

			// 予約を期限切れ状態に更新
			batch.update(doc.ref, { status: 'expired' });

			// 商品ごとの復元数量を集計
			if (!productUpdates[reservation.productId]) {
				productUpdates[reservation.productId] = 0;
			}
			productUpdates[reservation.productId] += reservation.quantity;
		});

		// 商品の在庫を復元
		for (const [productId, quantity] of Object.entries(productUpdates)) {
			const productRef = doc(db, PRODUCTS_COLLECTION, productId);

			// トランザクションではなくバッチで処理（パフォーマンス優先）
			batch.update(productRef, {
				'inventory.availableStock': serverTimestamp(), // FieldValue.increment(quantity) の代替
				'inventory.reservedStock': serverTimestamp(), // FieldValue.increment(-quantity) の代替
				'timestamps.updatedAt': serverTimestamp()
			});
		}

		await batch.commit();

		// 実際の在庫更新（increment処理）
		for (const [productId, quantity] of Object.entries(productUpdates)) {
			const productRef = doc(db, PRODUCTS_COLLECTION, productId);
			const productDoc = await getDoc(productRef);

			if (productDoc.exists()) {
				const currentInventory = productDoc.data().inventory;
				await updateDoc(productRef, {
					'inventory.availableStock': currentInventory.availableStock + quantity,
					'inventory.reservedStock': Math.max(0, currentInventory.reservedStock - quantity)
				});
			}
		}

		return expiredSnapshot.docs.length;
	}, 'cleanup-expired-reservations');

	if (result.error) {
		console.error('Error cleaning up expired reservations:', result.error);
		return 0;
	}

	return result.data || 0;
};

/**
 * ユーザー/セッションの全予約を取得
 */
export const getUserReservations = async (
	userId?: string,
	sessionId?: string
): Promise<CartReservation[]> => {
	const result = await handleAsyncOperation(async () => {
		if (!userId && !sessionId) {
			return [];
		}

		const reservationQuery = query(
			collection(db, RESERVATIONS_COLLECTION),
			where('status', '==', 'active'),
			userId ? where('userId', '==', userId) : where('sessionId', '==', sessionId),
			orderBy('createdAt', 'desc')
		);

		const snapshot = await getDocs(reservationQuery);
		const reservations: CartReservation[] = [];

		snapshot.forEach((doc) => {
			reservations.push({ id: doc.id, ...doc.data() } as CartReservation);
		});

		return reservations;
	}, 'get-user-reservations');

	return result.data || [];
};

/**
 * 予約を確定（チェックアウト時）
 */
export const confirmReservations = async (
	reservationIds: string[]
): Promise<{ success: boolean; confirmedIds: string[]; errors: ProductError[] }> => {
	const result = await handleAsyncOperation(async () => {
		const confirmedIds: string[] = [];
		const errors: ProductError[] = [];

		const batch = writeBatch(db);

		for (const reservationId of reservationIds) {
			try {
				const reservationRef = doc(db, RESERVATIONS_COLLECTION, reservationId);
				const reservationDoc = await getDoc(reservationRef);

				if (!reservationDoc.exists()) {
					errors.push({
						code: 'not-found',
						message: `Reservation ${reservationId} not found`
					});
					continue;
				}

				const reservation = reservationDoc.data() as CartReservation;

				// 期限チェック
				if (reservation.expiresAt.toMillis() < Date.now()) {
					errors.push({
						code: 'reservation-expired',
						message: `Reservation ${reservationId} has expired`,
						productId: reservation.productId
					});
					continue;
				}

				// 予約を確定状態に更新
				batch.update(reservationRef, { status: 'confirmed' });
				confirmedIds.push(reservationId);

			} catch (error) {
				errors.push({
					code: 'validation-error',
					message: `Error processing reservation ${reservationId}: ${error}`
				});
			}
		}

		await batch.commit();

		return {
			success: confirmedIds.length > 0,
			confirmedIds,
			errors
		};
	}, 'confirm-reservations');

	if (result.error) {
		return {
			success: false,
			confirmedIds: [],
			errors: [{
				code: 'validation-error',
				message: 'Failed to confirm reservations'
			}]
		};
	}

	return result.data!;
};

// 定期クリーンアップを設定（ブラウザ環境で定期実行）
let cleanupInterval: NodeJS.Timeout | null = null;

export const startPeriodicCleanup = () => {
	if (cleanupInterval) return;

	// 10分ごとに期限切れ予約をクリーンアップ
	cleanupInterval = setInterval(() => {
		cleanupExpiredReservations()
			.then((cleaned) => {
				if (cleaned > 0) {
					console.log(`🧹 Cleaned up ${cleaned} expired reservations`);
				}
			})
			.catch((error) => {
				console.error('Error in periodic cleanup:', error);
			});
	}, 10 * 60 * 1000);
};

export const stopPeriodicCleanup = () => {
	if (cleanupInterval) {
		clearInterval(cleanupInterval);
		cleanupInterval = null;
	}
};-e 
### FILE: ./src/lib/firestore/products.ts

// src/lib/firestore/products.ts
import {
	doc,
	collection,
	getDocs,
	getDoc,
	query,
	where,
	orderBy,
	limit as firestoreLimit,
	onSnapshot,
	serverTimestamp,
	Timestamp,
	Query,
	DocumentSnapshot
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
	FirestoreProduct,
	CreateProductData,
	UpdateProductData,
	ProductFilters,
	ProductSortOptions,
	GetProductsOptions,
	ProductSummary,
	ProductDetails,
	ProductError
} from '../../../types/product';
import { handleAsyncOperation } from '@/utils/errorHandling';

// コレクション名
const PRODUCTS_COLLECTION = 'products';

/**
 * 商品が存在するかチェック
 */
export const checkProductExists = async (productId: string): Promise<boolean> => {
	try {
		const productRef = doc(db, PRODUCTS_COLLECTION, productId);
		const productSnap = await getDoc(productRef);
		return productSnap.exists();
	} catch (error) {
		console.error('Error checking product existence:', error);
		return false;
	}
};

/**
 * 商品IDで商品データを取得
 */
export const getProductById = async (productId: string): Promise<FirestoreProduct | null> => {
	const result = await handleAsyncOperation(async () => {
		const productRef = doc(db, PRODUCTS_COLLECTION, productId);
		const productSnap = await getDoc(productRef);

		if (productSnap.exists()) {
			return { id: productSnap.id, ...productSnap.data() } as FirestoreProduct;
		}
		return null;
	}, 'product-fetch');

	if (result.error) {
		console.error('Error getting product:', result.error);
		return null;
	}

	return result.data || null;
};

/**
 * 複数商品を取得（フィルター・ソート対応）
 */
export const getProducts = async (options: GetProductsOptions = {}): Promise<FirestoreProduct[]> => {
	const result = await handleAsyncOperation(async () => {
		let q: Query = collection(db, PRODUCTS_COLLECTION);

		// フィルター適用
		if (options.filters) {
			const { category, isActive, minPrice, maxPrice, inStock, tags } = options.filters;

			if (category) {
				q = query(q, where('settings.category', '==', category));
			}

			if (isActive !== undefined) {
				q = query(q, where('settings.isActive', '==', isActive));
			}

			if (minPrice !== undefined) {
				q = query(q, where('price.usd', '>=', minPrice));
			}

			if (maxPrice !== undefined) {
				q = query(q, where('price.usd', '<=', maxPrice));
			}

			if (inStock) {
				q = query(q, where('inventory.availableStock', '>', 0));
			}

			if (tags && tags.length > 0) {
				q = query(q, where('metadata.tags', 'array-contains-any', tags));
			}
		}

		// ソート適用
		if (options.sort) {
			q = query(q, orderBy(options.sort.field, options.sort.direction));
		} else {
			// デフォルトソート: アクティブ → 在庫あり → 作成日新しい順
			q = query(q, orderBy('settings.isActive', 'desc'), orderBy('inventory.availableStock', 'desc'));
		}

		// 制限適用
		if (options.limit) {
			q = query(q, firestoreLimit(options.limit));
		}

		const querySnapshot = await getDocs(q);
		const products: FirestoreProduct[] = [];

		querySnapshot.forEach((doc) => {
			products.push({ id: doc.id, ...doc.data() } as FirestoreProduct);
		});

		// クライアントサイドでの追加フィルタリング（Firestoreの制限対応）
		let filteredProducts = products;

		if (options.filters?.searchQuery) {
			const searchQuery = options.filters.searchQuery.toLowerCase();
			filteredProducts = products.filter(product =>
				product.name.toLowerCase().includes(searchQuery) ||
				product.description.toLowerCase().includes(searchQuery) ||
				product.metadata.tags.some(tag => tag.toLowerCase().includes(searchQuery))
			);
		}

		return filteredProducts;
	}, 'products-fetch');

	if (result.error) {
		console.error('Error getting products:', result.error);
		return [];
	}

	return result.data || [];
};

/**
 * アクティブな商品のみを取得
 */
export const getActiveProducts = async (limit?: number): Promise<FirestoreProduct[]> => {
	return getProducts({
		filters: { isActive: true, inStock: true },
		sort: { field: 'metadata.rating', direction: 'desc' },
		limit
	});
};

/**
 * 商品をサマリー形式で取得
 */
export const getProductsSummary = async (options: GetProductsOptions = {}): Promise<ProductSummary[]> => {
	const products = await getProducts(options);

	return products.map(product => ({
		id: product.id,
		name: product.name,
		price: product.price.usd,
		availableStock: product.inventory.availableStock,
		isActive: product.settings.isActive,
		category: product.settings.category,
		rating: product.metadata.rating,
		image: product.metadata.images[0] || undefined
	}));
};

/**
 * 商品詳細を表示用フォーマットで取得
 */
export const getProductDetails = async (productId: string): Promise<ProductDetails | null> => {
	const product = await getProductById(productId);

	if (!product) return null;

	// 在庫レベルを計算
	const getStockLevel = (available: number, total: number): 'high' | 'medium' | 'low' | 'out' => {
		if (available === 0) return 'out';
		const ratio = available / total;
		if (ratio > 0.5) return 'high';
		if (ratio > 0.2) return 'medium';
		return 'low';
	};

	return {
		id: product.id,
		name: product.name,
		description: product.description,
		price: {
			usd: product.price.usd,
			formatted: `$${product.price.usd.toFixed(2)}`
		},
		inventory: {
			inStock: product.inventory.availableStock,
			isAvailable: product.inventory.availableStock > 0,
			stockLevel: getStockLevel(product.inventory.availableStock, product.inventory.totalStock)
		},
		metadata: {
			rating: product.metadata.rating,
			reviewCount: product.metadata.reviewCount,
			features: product.metadata.features,
			nutritionFacts: product.metadata.nutritionFacts,
			images: product.metadata.images,
			tags: product.metadata.tags
		},
		settings: {
			maxOrderQuantity: product.settings.maxOrderQuantity,
			minOrderQuantity: product.settings.minOrderQuantity
		},
		timestamps: {
			createdAt: product.timestamps.createdAt instanceof Timestamp
				? product.timestamps.createdAt.toDate()
				: new Date(product.timestamps.createdAt as any),
			updatedAt: product.timestamps.updatedAt instanceof Timestamp
				? product.timestamps.updatedAt.toDate()
				: new Date(product.timestamps.updatedAt as any)
		}
	};
};

/**
 * 商品をリアルタイムで監視
 */
export const subscribeToProduct = (
	productId: string,
	callback: (product: FirestoreProduct | null) => void
): (() => void) => {
	const productRef = doc(db, PRODUCTS_COLLECTION, productId);

	return onSnapshot(productRef, (doc) => {
		if (doc.exists()) {
			callback({ id: doc.id, ...doc.data() } as FirestoreProduct);
		} else {
			callback(null);
		}
	}, (error) => {
		console.error('Error subscribing to product:', error);
		callback(null);
	});
};

/**
 * 商品リストをリアルタイムで監視
 */
export const subscribeToProducts = (
	options: GetProductsOptions = {},
	callback: (products: FirestoreProduct[]) => void
): (() => void) => {
	let q: Query = collection(db, PRODUCTS_COLLECTION);

	// フィルター適用（subscribeToProductsでは基本的なもののみ）
	if (options.filters?.isActive !== undefined) {
		q = query(q, where('settings.isActive', '==', options.filters.isActive));
	}

	if (options.filters?.category) {
		q = query(q, where('settings.category', '==', options.filters.category));
	}

	// ソート適用
	if (options.sort) {
		q = query(q, orderBy(options.sort.field, options.sort.direction));
	} else {
		q = query(q, orderBy('settings.isActive', 'desc'), orderBy('inventory.availableStock', 'desc'));
	}

	// 制限適用
	if (options.limit) {
		q = query(q, firestoreLimit(options.limit));
	}

	return onSnapshot(q, (querySnapshot) => {
		const products: FirestoreProduct[] = [];
		querySnapshot.forEach((doc) => {
			products.push({ id: doc.id, ...doc.data() } as FirestoreProduct);
		});

		// クライアントサイドフィルタリング
		let filteredProducts = products;

		if (options.filters?.searchQuery) {
			const searchQuery = options.filters.searchQuery.toLowerCase();
			filteredProducts = products.filter(product =>
				product.name.toLowerCase().includes(searchQuery) ||
				product.description.toLowerCase().includes(searchQuery)
			);
		}

		if (options.filters?.inStock) {
			filteredProducts = filteredProducts.filter(product => product.inventory.availableStock > 0);
		}

		callback(filteredProducts);
	}, (error) => {
		console.error('Error subscribing to products:', error);
		callback([]);
	});
};

/**
 * カテゴリ一覧を取得
 */
export const getProductCategories = async (): Promise<string[]> => {
	const result = await handleAsyncOperation(async () => {
		const products = await getProducts({ filters: { isActive: true } });
		const categories = new Set(products.map(product => product.settings.category));
		return Array.from(categories).sort();
	}, 'categories-fetch');

	return result.data || [];
};

/**
 * 商品の在庫状況をチェック
 */
export const checkProductStock = async (
	productId: string,
	requestedQuantity: number
): Promise<{ available: boolean; stock: number; maxAllowed: number }> => {
	const product = await getProductById(productId);

	if (!product) {
		return { available: false, stock: 0, maxAllowed: 0 };
	}

	if (!product.settings.isActive) {
		return { available: false, stock: product.inventory.availableStock, maxAllowed: 0 };
	}

	const maxAllowed = Math.min(
		product.inventory.availableStock,
		product.settings.maxOrderQuantity
	);

	return {
		available: requestedQuantity <= maxAllowed,
		stock: product.inventory.availableStock,
		maxAllowed
	};
};

/**
 * 商品検索（全文検索対応）
 */
export const searchProducts = async (
	searchQuery: string,
	options: Omit<GetProductsOptions, 'filters'> & { filters?: Omit<ProductFilters, 'searchQuery'> } = {}
): Promise<FirestoreProduct[]> => {
	return getProducts({
		...options,
		filters: {
			...options.filters,
			searchQuery,
			isActive: true // 検索時はアクティブな商品のみ
		}
	});
};

/**
 * エラーハンドリング用のヘルパー関数
 */
export const createProductError = (
	code: ProductError['code'],
	message: string,
	productId?: string,
	requestedQuantity?: number,
	availableStock?: number
): ProductError => {
	return {
		code,
		message,
		productId,
		requestedQuantity,
		availableStock
	};
};

// 商品関連の定数
export const PRODUCT_CONSTANTS = {
	MAX_PRODUCTS_PER_PAGE: 20,
	DEFAULT_MAX_ORDER_QUANTITY: 10,
	DEFAULT_MIN_ORDER_QUANTITY: 1,
	STOCK_LEVELS: {
		HIGH_THRESHOLD: 0.5,
		MEDIUM_THRESHOLD: 0.2
	},
	CATEGORIES: {
		PROTEIN: 'protein',
		SUPPLEMENTS: 'supplements',
		MERCHANDISE: 'merchandise'
	}
} as const;-e 
### FILE: ./src/app/dashboard/components/sections/ProfileSection.tsx

// src/app/dashboard/components/sections/ProfileSection.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import CyberCard from '../../../components/common/CyberCard';
import CyberButton from '../../../components/common/CyberButton';
import { ProfileEditModal } from './ProfileEditModal';
import {
	User,
	Wallet,
	Trophy,
	Calendar,
	ShoppingBag,
	TrendingUp,
	Award,
	ExternalLink,
	Copy,
	Check,
	Shield,
	LogIn,
	Edit,
	AlertCircle,
	CheckCircle
} from 'lucide-react';
import {
	getUserDisplayName,
	getUserAvatarUrl,
	getUserInitials,
	formatUserStats,
	formatDate,
	formatAddress,
	calculateProfileCompleteness
} from '@/utils/userHelpers';

const ProfileSection: React.FC = () => {
	const { user, loading, firestoreUser, firestoreLoading } = useAuth();
	const [copiedAddress, setCopiedAddress] = useState(false);
	const [isEditModalOpen, setIsEditModalOpen] = useState(false);

	// ローディング状態
	if (loading || firestoreLoading) {
		return (
			<div className="space-y-8">
				<div className="text-center">
					<h2 className="text-3xl font-heading font-bold text-white mb-2">
						Profile
					</h2>
					<p className="text-gray-400">
						Loading your Web3 protein journey...
					</p>
				</div>

				<CyberCard showEffects={false}>
					<div className="flex items-center justify-center py-12">
						<div className="flex items-center space-x-3">
							<div className="w-8 h-8 border-2 border-neonGreen border-t-transparent rounded-full animate-spin"></div>
							<span className="text-white">Loading profile data...</span>
						</div>
					</div>
				</CyberCard>
			</div>
		);
	}

	// 未認証の場合のプロンプト
	if (!user) {
		return (
			<div className="space-y-8">
				<div className="text-center">
					<h2 className="text-3xl font-heading font-bold text-white mb-2">
						Profile
					</h2>
					<p className="text-gray-400">
						Your Web3 protein journey and achievements
					</p>
				</div>

				<CyberCard showEffects={false}>
					<div className="text-center py-12">
						<div className="w-20 h-20 bg-gradient-to-br from-neonGreen/20 to-neonOrange/20 rounded-full flex items-center justify-center mx-auto mb-6">
							<Shield className="w-10 h-10 text-neonGreen" />
						</div>

						<h3 className="text-2xl font-bold text-white mb-4">
							Authentication Required
						</h3>

						<p className="text-gray-400 mb-8 max-w-md mx-auto">
							Please log in to access your profile, view your order history, and track your achievements in the on-chain protein revolution.
						</p>

						<div className="flex flex-col sm:flex-row gap-4 justify-center">
							<CyberButton
								variant="primary"
								className="flex items-center space-x-2"
								onClick={() => {
									const loginEvent = new CustomEvent('openAuthModal');
									window.dispatchEvent(loginEvent);
								}}
							>
								<LogIn className="w-4 h-4" />
								<span>Sign In</span>
							</CyberButton>

							<CyberButton
								variant="outline"
								onClick={() => window.location.href = '/'}
							>
								Back to Home
							</CyberButton>
						</div>

						<div className="mt-8 p-4 border border-neonGreen/30 rounded-sm bg-neonGreen/5">
							<h4 className="text-neonGreen font-semibold mb-2">Why Sign In?</h4>
							<ul className="text-sm text-gray-300 space-y-1 text-left max-w-xs mx-auto">
								<li>• Track your order history</li>
								<li>• Earn badges and achievements</li>
								<li>• Access exclusive member benefits</li>
								<li>• Join the community leaderboard</li>
							</ul>
						</div>
					</div>
				</CyberCard>
			</div>
		);
	}

	// Firestoreユーザーデータが存在しない場合
	if (!firestoreUser) {
		return (
			<div className="space-y-8">
				<div className="text-center">
					<h2 className="text-3xl font-heading font-bold text-white mb-2">
						Profile
					</h2>
					<p className="text-gray-400">
						Setting up your profile...
					</p>
				</div>

				<CyberCard showEffects={false}>
					<div className="text-center py-12">
						<div className="w-20 h-20 bg-gradient-to-br from-neonOrange/20 to-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
							<AlertCircle className="w-10 h-10 text-neonOrange" />
						</div>

						<h3 className="text-2xl font-bold text-white mb-4">
							Profile Setup in Progress
						</h3>

						<p className="text-gray-400 mb-8 max-w-md mx-auto">
							We're setting up your profile. This usually takes just a moment.
						</p>

						<CyberButton
							variant="outline"
							onClick={() => window.location.reload()}
						>
							Refresh Page
						</CyberButton>
					</div>
				</CyberCard>
			</div>
		);
	}

	// プロフィール完成度を計算
	const profileCompleteness = calculateProfileCompleteness(firestoreUser);
	const formattedStats = formatUserStats(firestoreUser.stats);
	const displayName = getUserDisplayName(firestoreUser, user);
	const avatarUrl = getUserAvatarUrl(firestoreUser, user);
	const initials = getUserInitials(firestoreUser, user);

	const handleCopyAddress = () => {
		navigator.clipboard.writeText(firestoreUser.walletAddress || firestoreUser.id);
		setCopiedAddress(true);
		setTimeout(() => setCopiedAddress(false), 2000);
	};

	const orderHistory = [
		{
			id: 'order-001',
			date: new Date('2024-05-15'),
			product: 'Pepe Flavor Protein',
			quantity: 1,
			amount: 0.025,
			amountUSD: 89.99,
			status: 'Delivered',
			txHash: '0x789xyz...def456'
		},
		{
			id: 'order-002',
			date: new Date('2024-04-28'),
			product: 'Pepe Flavor Protein',
			quantity: 2,
			amount: 0.05,
			amountUSD: 179.98,
			status: 'Delivered',
			txHash: '0xabc123...789def'
		},
		{
			id: 'order-003',
			date: new Date('2024-04-10'),
			product: 'Pepe Flavor Protein',
			quantity: 1,
			amount: 0.05,
			amountUSD: 189.99,
			status: 'Delivered',
			txHash: '0x456def...123abc'
		}
	];

	const achievements = [
		{ name: 'First Purchase', description: 'Made your first crypto purchase', earned: true },
		{ name: 'Loyal Customer', description: 'Made 5+ purchases', earned: false, progress: firestoreUser.stats.totalOrders },
		{ name: 'Community Champion', description: 'Active in Discord for 30 days', earned: true },
		{ name: 'Whale Status', description: 'Spent over 1 ETH total', earned: false, progress: firestoreUser.stats.totalSpent }
	];

	const getStatusColor = (status: string) => {
		switch (status) {
			case 'Delivered': return 'text-neonGreen';
			case 'Shipped': return 'text-neonOrange';
			case 'Processing': return 'text-yellow-400';
			default: return 'text-gray-400';
		}
	};

	return (
		<div className="space-y-8">
			{/* Header */}
			<div className="text-center">
				<h2 className="text-3xl font-heading font-bold text-white mb-2">
					Profile
				</h2>
				<p className="text-gray-400">
					Your Web3 protein journey and achievements
				</p>
			</div>

			{/* Profile Completeness Alert */}
			{!profileCompleteness.isComplete && (
				<div className="bg-gradient-to-r from-neonOrange/10 to-yellow-500/10 border border-neonOrange/30 rounded-sm p-4">
					<div className="flex items-start space-x-3">
						<AlertCircle className="w-5 h-5 text-neonOrange mt-0.5" />
						<div className="flex-1">
							<h4 className="text-neonOrange font-semibold mb-1">
								Complete Your Profile ({profileCompleteness.completionPercentage}%)
							</h4>
							<p className="text-sm text-gray-300 mb-3">
								Add missing information to unlock all features and improve your experience.
							</p>
							<div className="w-full bg-dark-300 rounded-full h-2 mb-3">
								<div
									className="bg-gradient-to-r from-neonOrange to-yellow-500 h-2 rounded-full transition-all duration-300"
									style={{ width: `${profileCompleteness.completionPercentage}%` }}
								/>
							</div>
							<div className="flex flex-wrap gap-2 mb-3">
								{profileCompleteness.missingFields.map((field, index) => (
									<span key={index} className="text-xs bg-neonOrange/20 text-neonOrange px-2 py-1 rounded">
										{field}
									</span>
								))}
							</div>
							<CyberButton
								variant="outline"
								size="sm"
								onClick={() => setIsEditModalOpen(true)}
								className="flex items-center space-x-2"
							>
								<Edit className="w-3 h-3" />
								<span>Complete Profile</span>
							</CyberButton>
						</div>
					</div>
				</div>
			)}

			{/* Welcome Message */}
			<div className="bg-gradient-to-r from-neonGreen/10 to-neonOrange/10 border border-neonGreen/30 rounded-sm p-4">
				<div className="flex items-center justify-between">
					<div className="flex items-center space-x-3">
						<div className="w-10 h-10 bg-gradient-to-br from-neonGreen to-neonOrange rounded-full flex items-center justify-center">
							{profileCompleteness.isComplete ? (
								<CheckCircle className="w-5 h-5 text-black" />
							) : (
								<User className="w-5 h-5 text-black" />
							)}
						</div>
						<div>
							<h3 className="text-white font-semibold">Welcome back, {displayName}!</h3>
							<p className="text-sm text-gray-400">
								Connected via {user.providerData[0]?.providerId === 'google.com' ? 'Google' : 'Email'}
								{user.emailVerified && <span className="text-neonGreen ml-2">✓ Verified</span>}
								{profileCompleteness.isComplete && <span className="text-neonGreen ml-2">✓ Complete</span>}
							</p>
						</div>
					</div>
					<CyberButton
						variant="outline"
						size="sm"
						onClick={() => setIsEditModalOpen(true)}
						className="flex items-center space-x-2"
					>
						<Edit className="w-3 h-3" />
						<span>Edit</span>
					</CyberButton>
				</div>
			</div>

			{/* Profile Overview */}
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				{/* Main Profile Card */}
				<CyberCard showEffects={false} className="lg:col-span-2">
					<div className="flex items-start space-x-6">
						{/* Avatar */}
						<div className="flex-shrink-0">
							{avatarUrl ? (
								<img
									src={avatarUrl}
									alt="Profile"
									className="w-20 h-20 rounded-full border-2 border-neonGreen"
								/>
							) : (
								<div className="w-20 h-20 bg-gradient-to-br from-neonGreen to-neonOrange rounded-full flex items-center justify-center">
									<span className="text-2xl font-bold text-black">
										{initials}
									</span>
								</div>
							)}
						</div>

						{/* Profile Info */}
						<div className="flex-1">
							<div className="flex items-center space-x-3 mb-2">
								<h3 className="text-xl font-bold text-white">{displayName}</h3>
								{firestoreUser.nickname && firestoreUser.nickname !== displayName && (
									<span className="text-sm text-gray-400">({firestoreUser.nickname})</span>
								)}
							</div>

							<div className="flex items-center space-x-2 mb-2">
								<span className="text-sm text-gray-400">Email:</span>
								<span className="text-sm text-gray-300">{firestoreUser.email}</span>
								{user.emailVerified && (
									<span className="text-xs bg-neonGreen/20 text-neonGreen px-2 py-1 rounded">Verified</span>
								)}
							</div>

							<div className="flex items-center space-x-2 mb-4">
								<Wallet className="w-4 h-4 text-gray-400" />
								<span className="font-mono text-sm text-gray-300">
									User ID: {firestoreUser.id.slice(0, 8)}...{firestoreUser.id.slice(-4)}
								</span>
								<button
									onClick={handleCopyAddress}
									className="text-gray-400 hover:text-neonGreen transition-colors"
								>
									{copiedAddress ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
								</button>
							</div>

							<div className="grid grid-cols-2 gap-4">
								<div>
									<div className="text-sm text-gray-400">Member Since</div>
									<div className="text-white font-semibold">{formatDate(firestoreUser.createdAt)}</div>
								</div>
								<div>
									<div className="text-sm text-gray-400">Community Rank</div>
									<div className="text-neonGreen font-semibold">{formattedStats.rankFormatted}</div>
								</div>
							</div>

							{/* Address Display */}
							<div className="mt-4 p-3 bg-dark-200/30 rounded-sm">
								<div className="text-sm text-gray-400 mb-1">Address</div>
								<div className="text-sm text-gray-300">{formatAddress(firestoreUser.address)}</div>
							</div>
						</div>
					</div>
				</CyberCard>

				{/* Stats Card */}
				<CyberCard title="Stats" showEffects={false}>
					<div className="space-y-4">
						<div className="flex justify-between items-center">
							<span className="text-gray-400">Total Spent</span>
							<div className="text-right">
								<div className="text-neonGreen font-bold">{formattedStats.totalSpentFormatted}</div>
								<div className="text-xs text-gray-500">{formattedStats.totalSpentUSDFormatted}</div>
							</div>
						</div>

						<div className="flex justify-between items-center">
							<span className="text-gray-400">Total Orders</span>
							<span className="text-white font-semibold">{firestoreUser.stats.totalOrders}</span>
						</div>

						<div className="flex justify-between items-center">
							<span className="text-gray-400">Badges Earned</span>
							<span className="text-neonOrange font-semibold">{formattedStats.badgeCount}</span>
						</div>

						<div className="flex justify-between items-center">
							<span className="text-gray-400">Profile Status</span>
							<span className={`font-semibold ${profileCompleteness.isComplete ? 'text-neonGreen' : 'text-neonOrange'}`}>
								{profileCompleteness.isComplete ? 'Complete' : `${profileCompleteness.completionPercentage}%`}
							</span>
						</div>
					</div>
				</CyberCard>
			</div>

			{/* Badges */}
			<CyberCard title="Badges & Achievements" showEffects={false}>
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
					{firestoreUser.stats.badges.map((badge, index) => (
						<div key={index} className="flex items-center space-x-3 p-3 border border-neonOrange/30 rounded-sm bg-neonOrange/5">
							<Award className="w-5 h-5 text-neonOrange" />
							<span className="text-white font-medium">{badge}</span>
						</div>
					))}
				</div>
			</CyberCard>

			{/* Achievement Progress */}
			<CyberCard title="Achievement Progress" showEffects={false}>
				<div className="space-y-4">
					{achievements.map((achievement, index) => (
						<div key={index} className="flex items-center justify-between p-4 border border-dark-300 rounded-sm">
							<div className="flex items-center space-x-3">
								<Trophy className={`w-5 h-5 ${achievement.earned ? 'text-neonGreen' : 'text-gray-400'}`} />
								<div>
									<div className="text-white font-medium">{achievement.name}</div>
									<div className="text-sm text-gray-400">{achievement.description}</div>
								</div>
							</div>

							<div className="text-right">
								{achievement.earned ? (
									<span className="text-neonGreen font-semibold">Earned</span>
								) : (
									<div>
										<div className="text-sm text-gray-400">
											Progress: {achievement.progress}/{achievement.name === 'Loyal Customer' ? '5' : '1'}
										</div>
										<div className="w-24 h-2 bg-dark-300 rounded-full overflow-hidden">
											<div
												className="h-full bg-neonOrange transition-all duration-300"
												style={{
													width: `${achievement.name === 'Loyal Customer'
														? (achievement.progress! / 5) * 100
														: (achievement.progress! / 1) * 100}%`
												}}
											/>
										</div>
									</div>
								)}
							</div>
						</div>
					))}
				</div>
			</CyberCard>

			{/* Order History */}
			<CyberCard title="Recent Orders" showEffects={false}>
				<div className="overflow-x-auto">
					<table className="w-full">
						<thead>
							<tr className="border-b border-dark-300">
								<th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Date</th>
								<th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Product</th>
								<th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Amount</th>
								<th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Status</th>
								<th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Actions</th>
							</tr>
						</thead>
						<tbody>
							{orderHistory.map((order) => (
								<tr key={order.id} className="border-b border-dark-300/50 hover:bg-dark-200/30 transition-colors">
									<td className="py-4 px-4 text-sm text-gray-300">{formatDate(order.date)}</td>
									<td className="py-4 px-4">
										<div>
											<div className="text-white font-medium">{order.product}</div>
											<div className="text-xs text-gray-400">Qty: {order.quantity}</div>
										</div>
									</td>
									<td className="py-4 px-4">
										<div>
											<div className="text-neonGreen font-bold">Ξ {order.amount}</div>
											<div className="text-xs text-gray-400">${order.amountUSD}</div>
										</div>
									</td>
									<td className="py-4 px-4">
										<span className={`font-medium ${getStatusColor(order.status)}`}>
											{order.status}
										</span>
									</td>
									<td className="py-4 px-4">
										<CyberButton variant="outline" size="sm" className="flex items-center space-x-1">
											<ExternalLink className="w-3 h-3" />
											<span>View</span>
										</CyberButton>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</CyberCard>

			{/* Profile Edit Modal */}
			<ProfileEditModal
				isOpen={isEditModalOpen}
				onClose={() => setIsEditModalOpen(false)}
				firestoreUser={firestoreUser}
			/>
		</div>
	);
};

export default ProfileSection;-e 
### FILE: ./src/app/dashboard/components/sections/HowToBuySection.tsx

// src/app/dashboard/components/sections/HowToBuySection.tsx
'use client';

import React, { useState } from 'react';
import CyberCard from '../../../components/common/CyberCard';
import CyberButton from '../../../components/common/CyberButton';
import {
	ShoppingCart,
	Wallet,
	MapPin,
	AlertTriangle,
	Zap,
	Star,
	Monitor,
	Smartphone
} from 'lucide-react';

interface PaymentChain {
	id: string;
	name: string;
	symbol: string;
	status: 'active' | 'coming-soon';
	recommended?: boolean;
	description: string;
}

interface WalletOption {
	name: string;
	description: string;
	icon: React.ReactNode;
	chains: string[];
	type: 'browser' | 'mobile' | 'both';
	popular?: boolean;
}

const HowToBuySection: React.FC = () => {
	const [activeStep, setActiveStep] = useState(1);
	const [selectedChainType, setSelectedChainType] = useState<'evm' | 'solana' | 'all'>('all');

	const paymentChains: PaymentChain[] = [
		{
			id: 'solana',
			name: 'Solana',
			symbol: '$SOL',
			status: 'active',
			description: 'Ultra-fast with minimal fees'
		},
		{
			id: 'avalanche',
			name: 'Avalanche c-chain',
			symbol: '$AVAX',
			status: 'active',
			recommended: true,
			description: 'Fast and low-cost transactions'
		},
		{
			id: 'ethereum',
			name: 'Ethereum mainnet',
			symbol: '$ETH',
			status: 'active',
			description: 'Most widely supported blockchain'
		},
		{
			id: 'lightning',
			name: 'Lightning',
			symbol: '$BTC',
			status: 'coming-soon',
			description: 'Instant Bitcoin payments'
		},
		{
			id: 'sui',
			name: 'Sui',
			symbol: '$SUI',
			status: 'coming-soon',
			description: 'Next-generation blockchain'
		}
	];

	const walletOptions: WalletOption[] = [
		{
			name: 'MetaMask',
			description: 'Most popular wallet',
			icon: <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center text-white text-xs font-bold">MM</div>,
			chains: ['ethereum', 'avalanche'],
			type: 'both',
			popular: true
		},
		{
			name: 'WalletConnect',
			description: 'Connect mobile wallets',
			icon: <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center text-white text-xs font-bold">WC</div>,
			chains: ['ethereum', 'avalanche'],
			type: 'mobile'
		},
		{
			name: 'Coinbase Wallet',
			description: 'Official Coinbase wallet',
			icon: <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white text-xs font-bold">CB</div>,
			chains: ['ethereum', 'avalanche'],
			type: 'both'
		},
		{
			name: 'Phantom',
			description: 'Leading Solana wallet',
			icon: <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center text-white text-xs font-bold">👻</div>,
			chains: ['solana'],
			type: 'both',
			popular: true
		},
		{
			name: 'Solflare',
			description: 'Solana wallet',
			icon: <div className="w-8 h-8 bg-yellow-500 rounded-lg flex items-center justify-center text-white text-xs font-bold">SF</div>,
			chains: ['solana'],
			type: 'both'
		}
	];

	const steps = [
		{
			id: 1,
			title: 'Add to Cart & Checkout',
			description: 'Select products and proceed to checkout',
			details: 'No wallet connection or login required at this step'
		},
		{
			id: 2,
			title: 'Connect Wallet, Shipping Address & Pay',
			description: 'Connect wallet, enter address, and complete payment',
			details: 'Connect your crypto wallet, enter your shipping address, and complete the payment in one seamless process.'
		}
	];

	const getFilteredWallets = () => {
		if (selectedChainType === 'all') return walletOptions;
		if (selectedChainType === 'evm') {
			return walletOptions.filter(wallet =>
				wallet.chains.some(chain => ['ethereum', 'avalanche'].includes(chain))
			);
		}
		if (selectedChainType === 'solana') {
			return walletOptions.filter(wallet => wallet.chains.includes('solana'));
		}
		return walletOptions;
	};

	const activeChains = paymentChains.filter(chain => chain.status === 'active');
	const comingSoonChains = paymentChains.filter(chain => chain.status === 'coming-soon');

	return (
		<div className="space-y-8">
			{/* Header */}
			<div className="text-center space-y-4">
				<h2 className="text-3xl font-heading font-bold text-white mb-2">
					How to Buy
				</h2>
				<p className="text-gray-400 max-w-xl mx-auto text-lg leading-relaxed">
					<span className="text-purple-400 font-semibold">Solana</span>,
					<span className="text-red-400 font-semibold"> Avalanche c-chain</span> and
					<span className="text-blue-400 font-semibold"> Ethereum mainnet</span> are accepted.
					<span className="text-orange-400 font-semibold"> Lightning</span> and
					<span className="text-sky-300 font-semibold"> Sui</span> are coming soon.
				</p>
			</div>

			{/* Step-by-Step Guide */}
			<CyberCard title="Purchase Process" showEffects={false}>
				<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
					{/* Step Navigation */}
					<div className="lg:col-span-1">
						<div className="space-y-2">
							{steps.map((step) => (
								<button
									key={step.id}
									onClick={() => setActiveStep(step.id)}
									className={`
										w-full text-left p-4 rounded-lg border transition-all duration-200
										${activeStep === step.id
											? 'bg-neonGreen/10 border-neonGreen text-neonGreen'
											: 'border-dark-300 text-gray-300 hover:border-gray-500 hover:text-white'
										}
									`}
								>
									<div className="flex items-center space-x-3">
										<div className={`
											w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm
											${activeStep === step.id ? 'bg-neonGreen text-black' : 'bg-dark-300 text-gray-400'}
										`}>
											{step.id}
										</div>
										<div>
											<div className="font-medium">{step.title}</div>
										</div>
									</div>
								</button>
							))}
						</div>
					</div>

					{/* Step Content */}
					<div className="lg:col-span-2">
						{steps.map((step) => (
							activeStep === step.id && (
								<div key={step.id} className="space-y-6">
									<div>
										<h3 className="text-xl font-bold text-white mb-2">
											Step {step.id}: {step.title}
										</h3>
										<p className="text-gray-300 leading-relaxed">
											{step.details}
										</p>
									</div>

									{/* Step 1: Add to Cart */}
									{step.id === 1 && (
										<div className="space-y-6">
											<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
												<div className="p-4 border border-dark-300 rounded-lg">
													<ShoppingCart className="w-6 h-6 text-neonGreen mb-2" />
													<div className="text-white font-medium mb-1">Browse & Add</div>
													<div className="text-sm text-gray-400">Select products and add to cart</div>
												</div>
												<div className="p-4 border border-dark-300 rounded-lg">
													<Zap className="w-6 h-6 text-neonOrange mb-2" />
													<div className="text-white font-medium mb-1">Quick Checkout</div>
													<div className="text-sm text-gray-400">Proceed to payment when ready</div>
												</div>
											</div>
										</div>
									)}

									{/* Step 2: Connect, Pay & Address */}
									{step.id === 2 && (
										<div className="space-y-6">
											<div>
												<h4 className="text-lg font-semibold text-white mb-4">Choose Payment Method</h4>
												<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
													{activeChains.map((chain) => (
														<div key={chain.id} className={`
															p-4 border rounded-lg transition-all duration-200 hover:border-neonGreen/50
														`}>
															<div className="flex items-center space-x-3 mb-3">
																<Wallet className="w-5 h-5 text-gray-400" />
																<div>
																	<div className="text-white font-medium">{chain.name}</div>
																	<div className="text-sm text-gray-400">{chain.symbol}</div>
																</div>
															</div>
														</div>
													))}
												</div>
											</div>

											{/* Supported Wallets */}
											<div>
												<div className="flex items-center justify-between mb-4">
													<h4 className="text-lg font-semibold text-white">Supported Wallets</h4>
													<div className="flex space-x-2">
														<button
															onClick={() => setSelectedChainType('all')}
															className={`px-3 py-1 rounded text-xs transition-colors ${selectedChainType === 'all'
																? 'bg-neonGreen/20 text-neonGreen border border-neonGreen/50'
																: 'bg-dark-300 text-gray-400 hover:text-white'
																}`}
														>
															All
														</button>
														<button
															onClick={() => setSelectedChainType('evm')}
															className={`px-3 py-1 rounded text-xs transition-colors ${selectedChainType === 'evm'
																? 'bg-neonGreen/20 text-neonGreen border border-neonGreen/50'
																: 'bg-dark-300 text-gray-400 hover:text-white'
																}`}
														>
															EVM
														</button>
														<button
															onClick={() => setSelectedChainType('solana')}
															className={`px-3 py-1 rounded text-xs transition-colors ${selectedChainType === 'solana'
																? 'bg-neonGreen/20 text-neonGreen border border-neonGreen/50'
																: 'bg-dark-300 text-gray-400 hover:text-white'
																}`}
														>
															Solana
														</button>
													</div>
												</div>

												<div className="grid grid-cols-2 md:grid-cols-3 gap-4">
													{getFilteredWallets().map((wallet, index) => (
														<div key={index} className="p-3 border border-dark-300 rounded-lg hover:border-gray-500 transition-colors">
															<div className="flex items-center space-x-3 mb-2">
																{wallet.icon}
																<div className="flex-1 min-w-0">
																	<div className="text-white font-medium text-sm flex items-center">
																		{wallet.name}
																		{wallet.popular && <Star className="w-3 h-3 text-yellow-400 ml-1" />}
																	</div>
																</div>
															</div>
															<div className="text-xs text-gray-400 mb-2">{wallet.description}</div>
															<div className="flex items-center space-x-2">
																{wallet.type === 'both' ? (
																	<>
																		<Monitor className="w-3 h-3 text-gray-500" />
																		<Smartphone className="w-3 h-3 text-gray-500" />
																	</>
																) : wallet.type === 'mobile' ? (
																	<Smartphone className="w-3 h-3 text-gray-500" />
																) : (
																	<Monitor className="w-3 h-3 text-gray-500" />
																)}
															</div>
														</div>
													))}
												</div>
											</div>

											{/* Shipping Address Info */}
											<div className="p-4 border border-blue-600/30 rounded-lg bg-blue-600/5">
												<div className="flex items-start space-x-3">
													<MapPin className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
													<div>
														<div className="text-blue-400 font-medium mb-1">Shipping Address</div>
														<div className="text-sm text-gray-300">
															Your wallet address and shipping information will be saved for future purchases. Worldwide delivery available.
														</div>
													</div>
												</div>
											</div>
										</div>
									)}
								</div>
							)
						))}
					</div>
				</div>
			</CyberCard>
		</div>
	);
};

export default HowToBuySection;-e 
### FILE: ./src/app/dashboard/components/sections/CartSection.tsx

// src/app/dashboard/components/sections/CartSection.tsx
'use client';

import React from 'react';
import CyberCard from '../../../components/common/CyberCard';
import CyberButton from '../../../components/common/CyberButton';
import { useCart, usePanel } from '../../context/DashboardContext';
import { useAuth } from '@/contexts/AuthContext';
import {
	ShoppingCart,
	Trash2,
	Plus,
	Minus,
	Clock,
	Package
} from 'lucide-react';

const CartSection: React.FC = () => {
	const {
		cartItems,
		removeFromCart,
		updateQuantity,
		getCartItemCount,
		getCartItemsWithDetails
	} = useCart();

	const { openPanel } = usePanel();
	const { user } = useAuth();

	// カートアイテムの詳細情報を取得
	const cartItemsWithDetails = getCartItemsWithDetails();

	const updateItemQuantity = (id: string, newQuantity: number) => {
		if (newQuantity <= 0) {
			removeFromCart(id);
			return;
		}

		// ローカルでの基本的な数量制限（1-10個）
		const validQuantity = Math.max(1, Math.min(newQuantity, 10));
		updateQuantity(id, validQuantity);
	};

	const handleRemoveItem = (id: string) => {
		removeFromCart(id);
	};

	const handleCheckout = () => {
		try {
			if (!user) {
				// ログインが必要
				window.dispatchEvent(new CustomEvent('openAuthModal'));
				return;
			}

			// TODO: チェックアウト処理を実装
			console.log('Checkout initiated', {
				cartItems,
				user: user.uid
			});

			alert('Checkout initiated!');
		} catch (error) {
			console.error('Checkout error:', error);
		}
	};

	const handleContinueShopping = () => {
		openPanel('shop');
	};

	const formatUSDPrice = (amount: number) => {
		return `$${amount.toFixed(2)}`;
	};

	if (cartItems.length === 0) {
		return (
			<div className="space-y-8">
				<div className="text-center">
					<h2 className="text-3xl font-heading font-bold text-white mb-2">Shopping Cart</h2>
					<p className="text-gray-400">Your cart is currently empty</p>
				</div>

				<div className="max-w-2xl mx-auto">
					<CyberCard showEffects={false} className="text-center py-12">
						<ShoppingCart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
						<h3 className="text-xl font-semibold text-white mb-2">Your cart is empty</h3>
						<p className="text-gray-400 mb-6">Add some premium protein to get started</p>
						<CyberButton variant="primary" onClick={handleContinueShopping}>
							Start Shopping
						</CyberButton>
					</CyberCard>
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-8">
			{/* Header */}
			<div className="text-center">
				<h2 className="text-3xl font-heading font-bold text-white mb-2">
					Shopping Cart
				</h2>
				<p className="text-gray-400">
					Review your items and proceed to checkout
				</p>
			</div>

			{/* Cart Items - 中央配置 */}
			<div className="max-w-4xl mx-auto">
				<CyberCard title={`Cart Items (${getCartItemCount()})`} showEffects={false}>
					<div className="space-y-4">
						{cartItemsWithDetails.map((item) => (
							<div key={item.id} className="flex items-center space-x-4 p-4 border border-dark-300 rounded-sm">
								{/* Product Image */}
								<div className="w-16 h-16 bg-gradient-to-br from-neonGreen to-neonOrange rounded-sm flex items-center justify-center flex-shrink-0">
									<Package className="w-8 h-8 text-black" />
								</div>

								{/* Product Info */}
								<div className="flex-1 min-w-0">
									<h3 className="text-white font-semibold">{item.name}</h3>
									<p className="text-sm text-gray-400">Premium whey protein blend</p>
									<div className="text-white font-semibold">{formatUSDPrice(item.price)}</div>

									{/* Item Info */}
									{item.timeLeft && (
										<div className="flex items-center space-x-1 mt-1">
											<Clock className="w-3 h-3 text-yellow-400" />
											<span className="text-xs text-yellow-400">{item.timeLeft}</span>
										</div>
									)}
								</div>

								{/* Quantity Controls */}
								<div className="flex items-center space-x-2 flex-shrink-0">
									<button
										onClick={() => updateItemQuantity(item.id, item.quantity - 1)}
										className="w-8 h-8 border border-dark-300 rounded-sm flex items-center justify-center text-white hover:bg-dark-200 transition-colors"
									>
										<Minus className="w-4 h-4" />
									</button>
									<span className="w-12 text-center text-white font-medium">{item.quantity}</span>
									<button
										onClick={() => updateItemQuantity(item.id, item.quantity + 1)}
										className="w-8 h-8 border border-dark-300 rounded-sm flex items-center justify-center text-white hover:bg-dark-200 transition-colors"
									>
										<Plus className="w-4 h-4" />
									</button>
								</div>

								{/* Item Total */}
								<div className="text-right flex-shrink-0">
									<div className="text-white font-semibold">{formatUSDPrice(item.price * item.quantity)}</div>
									<div className="text-xs text-gray-400">
										{item.quantity} × {formatUSDPrice(item.price)}
									</div>
								</div>

								{/* Remove Button */}
								<button
									onClick={() => handleRemoveItem(item.id)}
									className="p-2 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-sm transition-colors flex-shrink-0"
									title="Remove from cart"
								>
									<Trash2 className="w-4 h-4" />
								</button>
							</div>
						))}
					</div>
				</CyberCard>
				<div className="mt-6">
					<CyberButton
						variant="primary"
						className="w-full flex items-center justify-center space-x-2"
						onClick={handleCheckout}
					>
						<span>Proceed to checkout</span>
					</CyberButton>
				</div>
			</div>
		</div>
	);
};

export default CartSection;-e 
### FILE: ./src/app/dashboard/components/sections/ProfileEditModal.tsx

// src/app/dashboard/components/sections/ProfileEditModal.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import CyberButton from '../../../components/common/CyberButton';
import { FirestoreUser, UpdateUserProfile } from '../../../../../types/user';
import {
	X,
	User,
	Mail,
	MapPin,
	Phone,
	Save,
	AlertCircle,
	CheckCircle,
	Loader
} from 'lucide-react';
import { handleAsyncOperation } from '@/utils/errorHandling';
import { calculateProfileCompleteness } from '@/utils/userHelpers';

interface ProfileEditModalProps {
	isOpen: boolean;
	onClose: () => void;
	firestoreUser: FirestoreUser;
}

export const ProfileEditModal: React.FC<ProfileEditModalProps> = ({
	isOpen,
	onClose,
	firestoreUser
}) => {
	const { updateProfile } = useAuth();
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState(false);

	// フォームデータ
	const [formData, setFormData] = useState({
		displayName: '',
		nickname: '',
		address: {
			country: '',
			prefecture: '',
			city: '',
			addressLine1: '',
			addressLine2: '',
			postalCode: '',
			phone: ''
		}
	});

	// firestoreUserが変更されたときにフォームデータを更新
	useEffect(() => {
		if (firestoreUser) {
			setFormData({
				displayName: firestoreUser.displayName || '',
				nickname: firestoreUser.nickname || '',
				address: {
					country: firestoreUser.address?.country || '',
					prefecture: firestoreUser.address?.prefecture || '',
					city: firestoreUser.address?.city || '',
					addressLine1: firestoreUser.address?.addressLine1 || '',
					addressLine2: firestoreUser.address?.addressLine2 || '',
					postalCode: firestoreUser.address?.postalCode || '',
					phone: firestoreUser.address?.phone || ''
				}
			});
		}
	}, [firestoreUser]);

	// モーダルが閉じられたときの状態リセット
	useEffect(() => {
		if (!isOpen) {
			setError(null);
			setSuccess(false);
		}
	}, [isOpen]);

	const handleInputChange = (field: string, value: string) => {
		if (field.startsWith('address.')) {
			const addressField = field.replace('address.', '');
			setFormData(prev => ({
				...prev,
				address: {
					...prev.address,
					[addressField]: value
				}
			}));
		} else {
			setFormData(prev => ({
				...prev,
				[field]: value
			}));
		}
	};

	const validateForm = (): string[] => {
		const errors: string[] = [];

		if (!formData.displayName.trim()) {
			errors.push('Display name is required');
		}

		if (!formData.address.country.trim()) {
			errors.push('Country is required');
		}

		if (!formData.address.prefecture.trim()) {
			errors.push('Prefecture is required');
		}

		if (!formData.address.city.trim()) {
			errors.push('City is required');
		}

		if (!formData.address.addressLine1.trim()) {
			errors.push('Address line 1 is required');
		}

		if (!formData.address.postalCode.trim()) {
			errors.push('Postal code is required');
		}

		return errors;
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);
		setSuccess(false);
		setLoading(true);

		// バリデーション
		const validationErrors = validateForm();
		if (validationErrors.length > 0) {
			setError(validationErrors.join(', '));
			setLoading(false);
			return;
		}

		// プロフィール完成度をチェック
		const tempUser: FirestoreUser = {
			...firestoreUser,
			displayName: formData.displayName,
			nickname: formData.nickname,
			address: formData.address
		};
		const completeness = calculateProfileCompleteness(tempUser);

		const updateData: UpdateUserProfile = {
			displayName: formData.displayName,
			nickname: formData.nickname || undefined,
			address: formData.address,
			isProfileComplete: completeness.isComplete
		};

		const { error: updateError } = await handleAsyncOperation(
			() => updateProfile(updateData),
			'profile-update'
		);

		if (updateError) {
			setError(updateError.userMessage);
			setLoading(false);
			return;
		}

		setSuccess(true);
		setLoading(false);

		// 成功後に1.5秒でモーダルを閉じる
		setTimeout(() => {
			onClose();
		}, 1500);
	};

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
			<div className="relative bg-black/90 backdrop-blur-md border border-neonGreen/30 rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
				{/* Scanline effect */}
				<div className="absolute inset-0 overflow-hidden pointer-events-none">
					<div className="absolute w-full h-px bg-gradient-to-r from-transparent via-neonGreen to-transparent animate-scanline opacity-30"></div>
				</div>

				{/* Header */}
				<div className="relative p-6 border-b border-gray-700">
					<div className="flex justify-between items-center">
						<div>
							<h2 className="text-2xl font-heading font-bold text-white mb-1">
								Edit Profile
							</h2>
							<p className="text-sm text-gray-400">
								Update your information and complete your profile
							</p>
						</div>
						<button
							onClick={onClose}
							className="text-gray-400 hover:text-neonGreen transition-colors text-2xl font-light"
						>
							<X className="w-6 h-6" />
						</button>
					</div>
				</div>

				{/* Content */}
				<div className="relative p-6 max-h-[calc(90vh-140px)] overflow-y-auto">
					{/* Success Message */}
					{success && (
						<div className="bg-neonGreen/10 border border-neonGreen/30 text-neonGreen px-4 py-3 rounded-sm mb-6 flex items-center">
							<CheckCircle className="w-5 h-5 mr-3" />
							<span>Profile updated successfully!</span>
						</div>
					)}

					{/* Error Message */}
					{error && (
						<div className="bg-red-900/30 border border-red-500/50 text-red-300 px-4 py-3 rounded-sm mb-6 flex items-center">
							<AlertCircle className="w-5 h-5 mr-3" />
							<span>{error}</span>
						</div>
					)}

					<form onSubmit={handleSubmit} className="space-y-6">
						{/* Personal Information */}
						<div>
							<h3 className="text-lg font-semibold text-white mb-4 flex items-center">
								<User className="w-5 h-5 mr-2 text-neonGreen" />
								Personal Information
							</h3>

							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div>
									<label htmlFor="displayName" className="block text-sm font-medium text-gray-300 mb-2">
										Display Name *
									</label>
									<input
										type="text"
										id="displayName"
										value={formData.displayName}
										onChange={(e) => handleInputChange('displayName', e.target.value)}
										required
										className="w-full px-4 py-3 bg-black/50 border border-gray-600 rounded-sm focus:outline-none focus:border-neonGreen focus:ring-1 focus:ring-neonGreen text-white placeholder-gray-500 transition-all duration-200"
										placeholder="Your display name"
									/>
								</div>

								<div>
									<label htmlFor="nickname" className="block text-sm font-medium text-gray-300 mb-2">
										Nickname
									</label>
									<input
										type="text"
										id="nickname"
										value={formData.nickname}
										onChange={(e) => handleInputChange('nickname', e.target.value)}
										className="w-full px-4 py-3 bg-black/50 border border-gray-600 rounded-sm focus:outline-none focus:border-neonGreen focus:ring-1 focus:ring-neonGreen text-white placeholder-gray-500 transition-all duration-200"
										placeholder="Optional nickname"
									/>
								</div>
							</div>
						</div>

						{/* Address Information */}
						<div>
							<h3 className="text-lg font-semibold text-white mb-4 flex items-center">
								<MapPin className="w-5 h-5 mr-2 text-neonGreen" />
								Address Information
							</h3>

							<div className="space-y-4">
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									<div>
										<label htmlFor="country" className="block text-sm font-medium text-gray-300 mb-2">
											Country *
										</label>
										<input
											type="text"
											id="country"
											value={formData.address.country}
											onChange={(e) => handleInputChange('address.country', e.target.value)}
											required
											className="w-full px-4 py-3 bg-black/50 border border-gray-600 rounded-sm focus:outline-none focus:border-neonGreen focus:ring-1 focus:ring-neonGreen text-white placeholder-gray-500 transition-all duration-200"
											placeholder="Japan"
										/>
									</div>

									<div>
										<label htmlFor="prefecture" className="block text-sm font-medium text-gray-300 mb-2">
											Prefecture/State *
										</label>
										<input
											type="text"
											id="prefecture"
											value={formData.address.prefecture}
											onChange={(e) => handleInputChange('address.prefecture', e.target.value)}
											required
											className="w-full px-4 py-3 bg-black/50 border border-gray-600 rounded-sm focus:outline-none focus:border-neonGreen focus:ring-1 focus:ring-neonGreen text-white placeholder-gray-500 transition-all duration-200"
											placeholder="Tokyo"
										/>
									</div>
								</div>

								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									<div>
										<label htmlFor="city" className="block text-sm font-medium text-gray-300 mb-2">
											City *
										</label>
										<input
											type="text"
											id="city"
											value={formData.address.city}
											onChange={(e) => handleInputChange('address.city', e.target.value)}
											required
											className="w-full px-4 py-3 bg-black/50 border border-gray-600 rounded-sm focus:outline-none focus:border-neonGreen focus:ring-1 focus:ring-neonGreen text-white placeholder-gray-500 transition-all duration-200"
											placeholder="Shibuya"
										/>
									</div>

									<div>
										<label htmlFor="postalCode" className="block text-sm font-medium text-gray-300 mb-2">
											Postal Code *
										</label>
										<input
											type="text"
											id="postalCode"
											value={formData.address.postalCode}
											onChange={(e) => handleInputChange('address.postalCode', e.target.value)}
											required
											className="w-full px-4 py-3 bg-black/50 border border-gray-600 rounded-sm focus:outline-none focus:border-neonGreen focus:ring-1 focus:ring-neonGreen text-white placeholder-gray-500 transition-all duration-200"
											placeholder="150-0001"
										/>
									</div>
								</div>

								<div>
									<label htmlFor="addressLine1" className="block text-sm font-medium text-gray-300 mb-2">
										Address Line 1 *
									</label>
									<input
										type="text"
										id="addressLine1"
										value={formData.address.addressLine1}
										onChange={(e) => handleInputChange('address.addressLine1', e.target.value)}
										required
										className="w-full px-4 py-3 bg-black/50 border border-gray-600 rounded-sm focus:outline-none focus:border-neonGreen focus:ring-1 focus:ring-neonGreen text-white placeholder-gray-500 transition-all duration-200"
										placeholder="1-1-1 Shibuya"
									/>
								</div>

								<div>
									<label htmlFor="addressLine2" className="block text-sm font-medium text-gray-300 mb-2">
										Address Line 2
									</label>
									<input
										type="text"
										id="addressLine2"
										value={formData.address.addressLine2}
										onChange={(e) => handleInputChange('address.addressLine2', e.target.value)}
										className="w-full px-4 py-3 bg-black/50 border border-gray-600 rounded-sm focus:outline-none focus:border-neonGreen focus:ring-1 focus:ring-neonGreen text-white placeholder-gray-500 transition-all duration-200"
										placeholder="Apartment, suite, etc. (optional)"
									/>
								</div>

								<div>
									<label htmlFor="phone" className="block text-sm font-medium text-gray-300 mb-2">
										<Phone className="w-4 h-4 inline mr-1" />
										Phone Number
									</label>
									<input
										type="tel"
										id="phone"
										value={formData.address.phone}
										onChange={(e) => handleInputChange('address.phone', e.target.value)}
										className="w-full px-4 py-3 bg-black/50 border border-gray-600 rounded-sm focus:outline-none focus:border-neonGreen focus:ring-1 focus:ring-neonGreen text-white placeholder-gray-500 transition-all duration-200"
										placeholder="+81 90-1234-5678"
									/>
								</div>
							</div>
						</div>

						{/* Form Actions */}
						<div className="flex items-center justify-between pt-4 border-t border-gray-700">
							<div className="text-sm text-gray-400">
								<span className="text-red-400">*</span> Required fields
							</div>

							<div className="flex space-x-4">
								<CyberButton
									type="button"
									variant="outline"
									onClick={onClose}
									disabled={loading}
								>
									Cancel
								</CyberButton>

								<CyberButton
									type="submit"
									variant="primary"
									disabled={loading}
									className="flex items-center space-x-2"
								>
									{loading ? (
										<>
											<Loader className="w-4 h-4 animate-spin" />
											<span>Saving...</span>
										</>
									) : (
										<>
											<Save className="w-4 h-4" />
											<span>Save Changes</span>
										</>
									)}
								</CyberButton>
							</div>
						</div>
					</form>
				</div>
			</div>
		</div>
	);
};-e 
### FILE: ./src/app/dashboard/components/sections/PurchaseScanSection.tsx

// src/app/dashboard/components/sections/PurchaseScanSection.tsx
'use client';

import React, { useState } from 'react';
import CyberCard from '../../../components/common/CyberCard';
import CyberButton from '../../../components/common/CyberButton';
import { PurchaseRecord, FilterOptions } from '../../../../../types/dashboard';
import { TrendingUp, Users, DollarSign, Activity, Trophy, ExternalLink } from 'lucide-react';

const PurchaseScanSection: React.FC = () => {
	const [filterOptions, setFilterOptions] = useState<FilterOptions>({
		period: 'all',
		sortBy: 'amount',
		sortOrder: 'desc'
	});

	// モックデータ
	const mockPurchases: PurchaseRecord[] = [
		{
			rank: 1,
			walletAddress: '0x742d35CC6634C0532925a3b8D404e22d65be3b32',
			displayAddress: '0x742d...3b32',
			totalSpent: 2.45,
			totalSpentUSD: 8234.50,
			purchaseCount: 47,
			lastPurchase: new Date('2024-05-20'),
			txHashes: ['0xabc123...', '0xdef456...'],
			badges: ['Whale', 'Early Adopter'],
			isCurrentUser: false
		},
		{
			rank: 2,
			walletAddress: '0x8ba1f109551bD432803012645Hac136c0E46c33e',
			displayAddress: '0x8ba1...c33e',
			totalSpent: 1.89,
			totalSpentUSD: 6345.75,
			purchaseCount: 32,
			lastPurchase: new Date('2024-05-19'),
			txHashes: ['0x123abc...'],
			badges: ['Power User'],
			isCurrentUser: false
		},
		{
			rank: 42,
			walletAddress: '0x1234567890123456789012345678901234567890',
			displayAddress: '0x1234...7890',
			totalSpent: 0.125,
			totalSpentUSD: 420.25,
			purchaseCount: 3,
			lastPurchase: new Date('2024-05-15'),
			txHashes: ['0x789xyz...'],
			badges: ['New Member'],
			isCurrentUser: true
		}
	];

	const stats = {
		totalPurchases: 247,
		totalVolume: 89.7,
		totalVolumeUSD: 301456.78,
		activeUsers: 156
	};

	const handleFilterChange = (key: keyof FilterOptions, value: any) => {
		setFilterOptions(prev => ({ ...prev, [key]: value }));
	};

	const formatDate = (date: Date) => {
		return date.toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	};

	return (
		<div className="space-y-8">
			{/* Header */}
			<div className="text-center">
				<h2 className="text-3xl font-heading font-bold text-white mb-2">
					Purchase Scan
				</h2>
				<p className="text-gray-400">
					Community purchase rankings and transaction transparency
				</p>
			</div>

			{/* Stats Cards */}
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
				<CyberCard showEffects={false} className="text-center">
					<TrendingUp className="w-8 h-8 text-neonGreen mx-auto mb-2" />
					<div className="text-2xl font-bold text-white">{stats.totalPurchases}</div>
					<div className="text-xs text-gray-400">Total Purchases</div>
				</CyberCard>

				<CyberCard showEffects={false} className="text-center">
					<DollarSign className="w-8 h-8 text-neonOrange mx-auto mb-2" />
					<div className="text-2xl font-bold text-white">Ξ {stats.totalVolume}</div>
					<div className="text-xs text-gray-400">Total Volume</div>
				</CyberCard>

				<CyberCard showEffects={false} className="text-center">
					<Activity className="w-8 h-8 text-neonGreen mx-auto mb-2" />
					<div className="text-2xl font-bold text-white">${stats.totalVolumeUSD.toLocaleString()}</div>
					<div className="text-xs text-gray-400">USD Volume</div>
				</CyberCard>

				<CyberCard showEffects={false} className="text-center">
					<Users className="w-8 h-8 text-neonOrange mx-auto mb-2" />
					<div className="text-2xl font-bold text-white">{stats.activeUsers}</div>
					<div className="text-xs text-gray-400">Active Users</div>
				</CyberCard>
			</div>

			{/* Filters */}
			<CyberCard title="Filters" showEffects={false}>
				<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
					<div>
						<label className="block text-sm font-medium text-white mb-2">Period</label>
						<select
							value={filterOptions.period}
							onChange={(e) => handleFilterChange('period', e.target.value)}
							className="w-full px-3 py-2 bg-dark-200 border border-dark-300 rounded-sm text-white focus:border-neonGreen focus:outline-none"
						>
							<option value="today">Today</option>
							<option value="week">This Week</option>
							<option value="month">This Month</option>
							<option value="all">All Time</option>
						</select>
					</div>

					<div>
						<label className="block text-sm font-medium text-white mb-2">Sort By</label>
						<select
							value={filterOptions.sortBy}
							onChange={(e) => handleFilterChange('sortBy', e.target.value)}
							className="w-full px-3 py-2 bg-dark-200 border border-dark-300 rounded-sm text-white focus:border-neonGreen focus:outline-none"
						>
							<option value="amount">Total Amount</option>
							<option value="count">Purchase Count</option>
							<option value="date">Last Purchase</option>
						</select>
					</div>

					<div>
						<label className="block text-sm font-medium text-white mb-2">Order</label>
						<select
							value={filterOptions.sortOrder}
							onChange={(e) => handleFilterChange('sortOrder', e.target.value)}
							className="w-full px-3 py-2 bg-dark-200 border border-dark-300 rounded-sm text-white focus:border-neonGreen focus:outline-none"
						>
							<option value="desc">Highest First</option>
							<option value="asc">Lowest First</option>
						</select>
					</div>
				</div>
			</CyberCard>

			{/* Rankings Table */}
			<CyberCard title="Top Purchasers" showEffects={false}>
				<div className="overflow-x-auto">
					<table className="w-full">
						<thead>
							<tr className="border-b border-dark-300">
								<th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Rank</th>
								<th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Address</th>
								<th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Total Spent</th>
								<th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Purchases</th>
								<th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Last Activity</th>
								<th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Badges</th>
								<th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Actions</th>
							</tr>
						</thead>
						<tbody>
							{mockPurchases.map((record) => (
								<tr
									key={record.walletAddress}
									className={`border-b border-dark-300/50 hover:bg-dark-200/30 transition-colors ${record.isCurrentUser ? 'bg-neonGreen/5 border-neonGreen/20' : ''
										}`}
								>
									<td className="py-4 px-4">
										<div className="flex items-center space-x-2">
											{record.rank <= 3 && (
												<Trophy className={`w-4 h-4 ${record.rank === 1 ? 'text-yellow-400' :
														record.rank === 2 ? 'text-gray-300' :
															'text-orange-400'
													}`} />
											)}
											<span className={`font-bold ${record.isCurrentUser ? 'text-neonGreen' : 'text-white'}`}>
												#{record.rank}
											</span>
										</div>
									</td>
									<td className="py-4 px-4">
										<div className="font-mono text-sm">
											{record.displayAddress}
											{record.isCurrentUser && (
												<span className="ml-2 text-xs bg-neonGreen/20 text-neonGreen px-2 py-1 rounded-sm">
													You
												</span>
											)}
										</div>
									</td>
									<td className="py-4 px-4">
										<div>
											<div className="font-bold text-neonGreen">Ξ {record.totalSpent}</div>
											<div className="text-xs text-gray-400">${record.totalSpentUSD.toLocaleString()}</div>
										</div>
									</td>
									<td className="py-4 px-4 text-white">{record.purchaseCount}</td>
									<td className="py-4 px-4 text-sm text-gray-400">
										{formatDate(record.lastPurchase)}
									</td>
									<td className="py-4 px-4">
										<div className="flex flex-wrap gap-1">
											{record.badges?.map((badge, index) => (
												<span
													key={index}
													className="text-xs bg-neonOrange/20 text-neonOrange px-2 py-1 rounded-sm"
												>
													{badge}
												</span>
											))}
										</div>
									</td>
									<td className="py-4 px-4">
										<CyberButton
											variant="outline"
											size="sm"
											className="flex items-center space-x-1"
										>
											<ExternalLink className="w-3 h-3" />
											<span>View</span>
										</CyberButton>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</CyberCard>
		</div>
	);
};

export default PurchaseScanSection;-e 
### FILE: ./src/app/dashboard/components/sections/WhitepaperSection.tsx

// src/app/dashboard/components/sections/WhitepaperSection.tsx
'use client';

import React, { useState } from 'react';
import CyberCard from '../../../components/common/CyberCard';
import CyberButton from '../../../components/common/CyberButton';
import {
	FileText,
	ShoppingCart,
	Shield,
	Zap,
	Users,
	BarChart3,
	Download,
	ExternalLink
} from 'lucide-react';

interface WhitepaperSection {
	id: string;
	title: string;
	icon: React.ReactNode;
	content: React.ReactNode;
	subsections?: string[];
}

const WhitepaperSection: React.FC = () => {
	const [activeSection, setActiveSection] = useState<string>('overview');

	const sections: WhitepaperSection[] = [
		{
			id: 'overview',
			title: 'Overview',
			icon: <FileText className="w-5 h-5" />,
			content: (
				<div className="space-y-6">
					<div>
						<h3 className="text-xl font-bold text-white mb-4">Executive Summary</h3>
						<p className="text-gray-300 leading-relaxed mb-4">
							We are on-chain represents the first Web3-native protein brand, combining premium nutrition
							with blockchain technology to create a transparent, community-driven supplement ecosystem.
						</p>
						<p className="text-gray-300 leading-relaxed">
							Our flagship product, Pepe Flavor Protein, leverages smart contracts for quality assurance,
							decentralized governance for product development, and cryptocurrency payments for seamless
							global distribution.
						</p>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
						<div className="text-center">
							<div className="text-2xl font-bold text-neonGreen">100%</div>
							<div className="text-sm text-gray-400">Blockchain Verified</div>
						</div>
						<div className="text-center">
							<div className="text-2xl font-bold text-neonOrange">247</div>
							<div className="text-sm text-gray-400">Community Members</div>
						</div>
						<div className="text-center">
							<div className="text-2xl font-bold text-neonGreen">25g</div>
							<div className="text-sm text-gray-400">Protein per Serving</div>
						</div>
					</div>
				</div>
			)
		},
		{
			id: 'how-to-buy',
			title: 'How to Buy',
			icon: <ShoppingCart className="w-5 h-5" />,
			content: (
				<div className="space-y-6">
					<div>
						<h3 className="text-xl font-bold text-white mb-4">Purchase Process</h3>
						<div className="space-y-4">
							<div className="flex items-start space-x-4">
								<div className="flex-shrink-0 w-8 h-8 bg-neonGreen rounded-full flex items-center justify-center text-black font-bold">1</div>
								<div>
									<h4 className="font-semibold text-white">Connect Your Wallet</h4>
									<p className="text-gray-400 text-sm">Support for MetaMask, WalletConnect, and major Web3 wallets</p>
								</div>
							</div>

							<div className="flex items-start space-x-4">
								<div className="flex-shrink-0 w-8 h-8 bg-neonOrange rounded-full flex items-center justify-center text-black font-bold">2</div>
								<div>
									<h4 className="font-semibold text-white">Select Payment Method</h4>
									<p className="text-gray-400 text-sm">Pay with ETH, USDC, USDT, or other supported cryptocurrencies</p>
								</div>
							</div>

							<div className="flex items-start space-x-4">
								<div className="flex-shrink-0 w-8 h-8 bg-neonGreen rounded-full flex items-center justify-center text-black font-bold">3</div>
								<div>
									<h4 className="font-semibold text-white">Confirm Transaction</h4>
									<p className="text-gray-400 text-sm">Review order details and approve the smart contract transaction</p>
								</div>
							</div>

							<div className="flex items-start space-x-4">
								<div className="flex-shrink-0 w-8 h-8 bg-neonOrange rounded-full flex items-center justify-center text-black font-bold">4</div>
								<div>
									<h4 className="font-semibold text-white">Receive Your Order</h4>
									<p className="text-gray-400 text-sm">Fast global shipping with blockchain-verified tracking</p>
								</div>
							</div>
						</div>
					</div>

					<CyberCard title="Supported Wallets" showEffects={false}>
						<div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
							<div className="p-4 border border-dark-300 rounded-sm">
								<div className="font-semibold text-white">MetaMask</div>
							</div>
							<div className="p-4 border border-dark-300 rounded-sm">
								<div className="font-semibold text-white">WalletConnect</div>
							</div>
							<div className="p-4 border border-dark-300 rounded-sm">
								<div className="font-semibold text-white">Coinbase Wallet</div>
							</div>
							<div className="p-4 border border-dark-300 rounded-sm">
								<div className="font-semibold text-white">Trust Wallet</div>
							</div>
						</div>
					</CyberCard>
				</div>
			)
		},
		{
			id: 'technology',
			title: 'Technology & Security',
			icon: <Shield className="w-5 h-5" />,
			content: (
				<div className="space-y-6">
					<div>
						<h3 className="text-xl font-bold text-white mb-4">Blockchain Infrastructure</h3>
						<p className="text-gray-300 leading-relaxed mb-4">
							Our platform leverages Ethereum smart contracts to ensure transparent transactions,
							immutable quality records, and decentralized governance.
						</p>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
						<CyberCard title="Smart Contracts" showEffects={false}>
							<ul className="space-y-2 text-sm">
								<li className="flex items-center space-x-2">
									<div className="w-2 h-2 bg-neonGreen rounded-full"></div>
									<span>Automated payment processing</span>
								</li>
								<li className="flex items-center space-x-2">
									<div className="w-2 h-2 bg-neonGreen rounded-full"></div>
									<span>Quality assurance verification</span>
								</li>
								<li className="flex items-center space-x-2">
									<div className="w-2 h-2 bg-neonGreen rounded-full"></div>
									<span>Supply chain tracking</span>
								</li>
							</ul>
						</CyberCard>

						<CyberCard title="Security Features" showEffects={false}>
							<ul className="space-y-2 text-sm">
								<li className="flex items-center space-x-2">
									<div className="w-2 h-2 bg-neonOrange rounded-full"></div>
									<span>Multi-signature wallets</span>
								</li>
								<li className="flex items-center space-x-2">
									<div className="w-2 h-2 bg-neonOrange rounded-full"></div>
									<span>Audited smart contracts</span>
								</li>
								<li className="flex items-center space-x-2">
									<div className="w-2 h-2 bg-neonOrange rounded-full"></div>
									<span>Decentralized storage</span>
								</li>
							</ul>
						</CyberCard>
					</div>
				</div>
			)
		},
		{
			id: 'tokenomics',
			title: 'Tokenomics',
			icon: <BarChart3 className="w-5 h-5" />,
			content: (
				<div className="space-y-6">
					<div>
						<h3 className="text-xl font-bold text-white mb-4">Future Token Economy</h3>
						<p className="text-gray-300 leading-relaxed mb-4">
							Our roadmap includes launching a native governance token that will enable community-driven
							decision making, reward loyal customers, and facilitate decentralized product development.
						</p>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
						<CyberCard title="Governance (40%)" showEffects={false}>
							<div className="text-sm text-gray-300">
								Community voting on product development, flavor innovations, and platform upgrades.
							</div>
						</CyberCard>

						<CyberCard title="Rewards (30%)" showEffects={false}>
							<div className="text-sm text-gray-300">
								Loyalty rewards, purchase bonuses, and staking incentives for active community members.
							</div>
						</CyberCard>

						<CyberCard title="Development (30%)" showEffects={false}>
							<div className="text-sm text-gray-300">
								Platform development, security audits, and ecosystem expansion funding.
							</div>
						</CyberCard>
					</div>
				</div>
			)
		},
		{
			id: 'community',
			title: 'Community & Governance',
			icon: <Users className="w-5 h-5" />,
			content: (
				<div className="space-y-6">
					<div>
						<h3 className="text-xl font-bold text-white mb-4">Decentralized Community</h3>
						<p className="text-gray-300 leading-relaxed mb-4">
							We believe in community-driven innovation. Our governance model empowers token holders
							to participate in key decisions about product development, flavors, and platform features.
						</p>
					</div>

					<div className="space-y-4">
						<CyberCard title="Community Proposals" showEffects={false}>
							<p className="text-sm text-gray-300 mb-3">
								Submit and vote on new flavor ideas, packaging designs, and platform improvements.
							</p>
							<CyberButton variant="outline" size="sm">
								<span>View Active Proposals</span>
								<ExternalLink className="w-3 h-3 ml-1" />
							</CyberButton>
						</CyberCard>

						<CyberCard title="Discord Community" showEffects={false}>
							<p className="text-sm text-gray-300 mb-3">
								Join our active Discord server for real-time discussions, AMAs, and exclusive updates.
							</p>
							<CyberButton variant="outline" size="sm">
								<span>Join Discord</span>
								<ExternalLink className="w-3 h-3 ml-1" />
							</CyberButton>
						</CyberCard>
					</div>
				</div>
			)
		},
		{
			id: 'roadmap',
			title: 'Roadmap',
			icon: <Zap className="w-5 h-5" />,
			content: (
				<div className="space-y-6">
					<div>
						<h3 className="text-xl font-bold text-white mb-4">Development Timeline</h3>
					</div>

					<div className="space-y-6">
						<div className="flex items-start space-x-4">
							<div className="flex-shrink-0 w-12 h-12 bg-neonGreen rounded-full flex items-center justify-center text-black font-bold">Q1</div>
							<div>
								<h4 className="font-semibold text-white mb-2">Platform Launch</h4>
								<ul className="text-sm text-gray-300 space-y-1">
									<li>• Web3 e-commerce platform</li>
									<li>• Pepe Flavor Protein release</li>
									<li>• Community building</li>
								</ul>
							</div>
						</div>

						<div className="flex items-start space-x-4">
							<div className="flex-shrink-0 w-12 h-12 bg-neonOrange rounded-full flex items-center justify-center text-black font-bold">Q2</div>
							<div>
								<h4 className="font-semibold text-white mb-2">Product Expansion</h4>
								<ul className="text-sm text-gray-300 space-y-1">
									<li>• Additional protein flavors</li>
									<li>• Pre-workout supplements</li>
									<li>• Mobile app development</li>
								</ul>
							</div>
						</div>

						<div className="flex items-start space-x-4">
							<div className="flex-shrink-0 w-12 h-12 bg-neonGreen rounded-full flex items-center justify-center text-black font-bold">Q3</div>
							<div>
								<h4 className="font-semibold text-white mb-2">Token Launch</h4>
								<ul className="text-sm text-gray-300 space-y-1">
									<li>• Governance token distribution</li>
									<li>• DAO implementation</li>
									<li>• Staking rewards program</li>
								</ul>
							</div>
						</div>

						<div className="flex items-start space-x-4">
							<div className="flex-shrink-0 w-12 h-12 bg-neonOrange rounded-full flex items-center justify-center text-black font-bold">Q4</div>
							<div>
								<h4 className="font-semibold text-white mb-2">Global Expansion</h4>
								<ul className="text-sm text-gray-300 space-y-1">
									<li>• International shipping</li>
									<li>• Multi-chain support</li>
									<li>• Partnership integrations</li>
								</ul>
							</div>
						</div>
					</div>
				</div>
			)
		}
	];

	const activeContent = sections.find(section => section.id === activeSection);

	return (
		<div className="space-y-8">
			{/* Header */}
			<div className="text-center">
				<h2 className="text-3xl font-heading font-bold text-white mb-2">
					Whitepaper
				</h2>
				<p className="text-gray-400">
					Technical documentation and project overview
				</p>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
				{/* Navigation Sidebar */}
				<div className="lg:col-span-1">
					<CyberCard title="Contents" showEffects={false}>
						<nav className="space-y-2">
							{sections.map((section) => (
								<button
									key={section.id}
									onClick={() => setActiveSection(section.id)}
									className={`
                    w-full flex items-center space-x-3 px-3 py-2 rounded-sm text-left transition-colors
                    ${activeSection === section.id
											? 'bg-neonGreen/10 text-neonGreen border border-neonGreen/30'
											: 'text-gray-300 hover:bg-dark-200 hover:text-white'
										}
                  `}
								>
									{section.icon}
									<span className="text-sm font-medium">{section.title}</span>
								</button>
							))}
						</nav>

						<div className="mt-6 pt-4 border-t border-dark-300">
							<CyberButton variant="outline" size="sm" className="w-full flex items-center justify-center space-x-2">
								<Download className="w-4 h-4" />
								<span>Download PDF</span>
							</CyberButton>
						</div>
					</CyberCard>
				</div>

				{/* Main Content */}
				<div className="lg:col-span-3">
					<CyberCard
						title={activeContent?.title}
						showEffects={false}
						className="min-h-[600px]"
					>
						{activeContent?.content}
					</CyberCard>
				</div>
			</div>
		</div>
	);
};

export default WhitepaperSection;-e 
### FILE: ./src/app/dashboard/components/sections/ShopSection.tsx

// src/app/dashboard/components/sections/ShopSection.tsx (簡易版)
'use client';

import React, { useState, useEffect } from 'react';
import CyberCard from '../../../components/common/CyberCard';
import CyberButton from '../../../components/common/CyberButton';
import ProteinModel from '../../../components/home/glowing-3d-text/ProteinModel';
import { useCart } from '../../context/DashboardContext';
import { ShoppingCart, Star, Shield, Zap, Check, AlertTriangle, Clock, Loader2 } from 'lucide-react';
import { ProductDetails } from '../../../../../types/product';
import { getProductDetails, subscribeToProduct } from '@/lib/firestore/products';

const ShopSection: React.FC = () => {
	const [quantity, setQuantity] = useState(1);
	const [selectedCurrency, setSelectedCurrency] = useState<'ETH' | 'USDC' | 'USDT'>('ETH');
	const [showSuccessMessage, setShowSuccessMessage] = useState(false);
	const [showStockWarning, setShowStockWarning] = useState(false);
	const [stockWarningMessage, setStockWarningMessage] = useState('');
	const [loading, setLoading] = useState(true);
	const [product, setProduct] = useState<ProductDetails | null>(null);
	const [isAddingToCart, setIsAddingToCart] = useState(false);

	const { addToCart, cartItems } = useCart();

	// 固定の商品ID
	const PRODUCT_ID = 'pepe-protein-1';

	// 商品データをリアルタイムで取得
	useEffect(() => {
		let unsubscribe: (() => void) | null = null;

		const loadProduct = async () => {
			try {
				setLoading(true);
				
				// 初回データ取得
				const productData = await getProductDetails(PRODUCT_ID);
				if (productData) {
					setProduct(productData);
				}
				
				// リアルタイム監視を開始
				unsubscribe = subscribeToProduct(PRODUCT_ID, (firestoreProduct) => {
					if (firestoreProduct) {
						// FirestoreProductをProductDetailsに変換
						const getStockLevel = (available: number, total: number): 'high' | 'medium' | 'low' | 'out' => {
							if (available === 0) return 'out';
							const ratio = available / total;
							if (ratio > 0.5) return 'high';
							if (ratio > 0.2) return 'medium';
							return 'low';
						};

						const productDetails: ProductDetails = {
							id: firestoreProduct.id,
							name: firestoreProduct.name,
							description: firestoreProduct.description,
							price: {
								usd: firestoreProduct.price.usd,
								formatted: `$${firestoreProduct.price.usd.toFixed(2)}`
							},
							inventory: {
								inStock: firestoreProduct.inventory.availableStock,
								isAvailable: firestoreProduct.inventory.availableStock > 0,
								stockLevel: getStockLevel(firestoreProduct.inventory.availableStock, firestoreProduct.inventory.totalStock)
							},
							metadata: firestoreProduct.metadata,
							settings: firestoreProduct.settings,
							timestamps: {
								createdAt: firestoreProduct.timestamps.createdAt.toDate(),
								updatedAt: firestoreProduct.timestamps.updatedAt.toDate()
							}
						};
						
						setProduct(productDetails);
					} else {
						setProduct(null);
					}
				});
				
			} catch (error) {
				console.error('Error loading product:', error);
				setProduct(null);
			} finally {
				setLoading(false);
			}
		};

		loadProduct();

		return () => {
			if (unsubscribe) {
				unsubscribe();
			}
		};
	}, [PRODUCT_ID]);

	// カート内の商品数量を取得
	const getCartQuantity = () => {
		const cartItem = cartItems.find(item => item.id === PRODUCT_ID);
		return cartItem ? cartItem.quantity : 0;
	};

	// 簡易在庫チェック（Firestoreトランザクションなし）
	const checkSimpleStock = (requestedQuantity: number) => {
		if (!product) return { canAdd: false, message: 'Product not found' };
		
		const currentCartQuantity = getCartQuantity();
		const totalRequested = currentCartQuantity + requestedQuantity;
		
		// 在庫チェック
		if (totalRequested > product.inventory.inStock) {
			return { 
				canAdd: false, 
				message: `Only ${product.inventory.inStock - currentCartQuantity} items available` 
			};
		}
		
		// 注文制限チェック
		if (totalRequested > product.settings.maxOrderQuantity) {
			return { 
				canAdd: false, 
				message: `Maximum ${product.settings.maxOrderQuantity} items per order` 
			};
		}
		
		// 商品アクティブチェック
		if (!product.settings.isActive) {
			return { 
				canAdd: false, 
				message: 'Product is currently unavailable' 
			};
		}
		
		return { canAdd: true, message: '' };
	};

	// 数量変更時のバリデーション
	const handleQuantityChange = (newQuantity: number) => {
		if (!product) return;

		if (newQuantity < 1) {
			setQuantity(1);
			return;
		}

		const stockCheck = checkSimpleStock(newQuantity - quantity);
		
		if (!stockCheck.canAdd && newQuantity > quantity) {
			setStockWarningMessage(stockCheck.message);
			setShowStockWarning(true);
			setTimeout(() => setShowStockWarning(false), 3000);
			return;
		}

		const maxAllowed = Math.min(
			product.inventory.inStock - getCartQuantity(),
			product.settings.maxOrderQuantity - getCartQuantity(),
			product.settings.maxOrderQuantity
		);

		setQuantity(Math.min(newQuantity, Math.max(1, maxAllowed)));
	};

	const handleAddToCart = async () => {
		if (!product || isAddingToCart) return;

		try {
			setIsAddingToCart(true);

			// 簡易在庫チェック
			const stockCheck = checkSimpleStock(quantity);
			
			if (!stockCheck.canAdd) {
				setStockWarningMessage(stockCheck.message);
				setShowStockWarning(true);
				setTimeout(() => setShowStockWarning(false), 3000);
				return;
			}

			// ローカルカートに追加（Firestore予約なし）
			const cartItem = {
				id: product.id,
				name: product.name,
				price: product.price.usd,
				quantity: quantity,
				currency: selectedCurrency,
			};

			addToCart(cartItem, product.inventory.inStock);
			setShowSuccessMessage(true);

			setTimeout(() => {
				setShowSuccessMessage(false);
			}, 3000);

			// 追加後は数量を1にリセット
			setQuantity(1);

		} catch (error) {
			console.error('Error adding to cart:', error);
			setStockWarningMessage('An error occurred. Please try again.');
			setShowStockWarning(true);
			setTimeout(() => setShowStockWarning(false), 3000);
		} finally {
			setIsAddingToCart(false);
		}
	};

	// ローディング状態
	if (loading) {
		return (
			<div className="space-y-8">
				<div className="text-center">
					<h2 className="text-3xl font-heading font-bold text-white mb-2">
						Premium Protein Store
					</h2>
					<p className="text-gray-400">
						Loading product information...
					</p>
				</div>
				
				<div className="flex justify-center items-center h-64">
					<Loader2 className="w-8 h-8 text-neonGreen animate-spin" />
				</div>
			</div>
		);
	}

	// 商品が見つからない場合
	if (!product) {
		return (
			<div className="space-y-8">
				<div className="text-center">
					<h2 className="text-3xl font-heading font-bold text-white mb-2">
						Premium Protein Store
					</h2>
					<p className="text-gray-400">
						Product not found or currently unavailable
					</p>
				</div>
				
				<CyberCard showEffects={false} className="text-center py-12">
					<AlertTriangle className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
					<h3 className="text-xl font-semibold text-white mb-2">Product Unavailable</h3>
					<p className="text-gray-400 mb-6">This product is currently not available</p>
				</CyberCard>
			</div>
		);
	}

	const currentCartQuantity = getCartQuantity();
	const isOutOfStock = !product.inventory.isAvailable;
	const isAtOrderLimit = currentCartQuantity >= product.settings.maxOrderQuantity;
	const availableToAdd = Math.min(
		product.inventory.inStock - currentCartQuantity,
		product.settings.maxOrderQuantity - currentCartQuantity
	);

	return (
		<div className="space-y-8">
			{/* Header */}
			<div className="text-center">
				<h2 className="text-3xl font-heading font-bold text-white mb-2">
					Premium Protein Store
				</h2>
				<p className="text-gray-400">
					Pay with cryptocurrency - No wallet connection required
				</p>
			</div>

			{/* Success Message */}
			{showSuccessMessage && (
				<div className="fixed top-24 right-4 z-50 p-4 bg-neonGreen/10 border border-neonGreen rounded-sm backdrop-blur-sm animate-pulse">
					<div className="flex items-center space-x-2">
						<Check className="w-5 h-5 text-neonGreen" />
						<span className="text-neonGreen font-medium">Added to cart!</span>
					</div>
				</div>
			)}

			{/* Stock Warning */}
			{showStockWarning && (
				<div className="fixed top-24 right-4 z-50 p-4 bg-yellow-600/10 border border-yellow-600 rounded-sm backdrop-blur-sm animate-pulse">
					<div className="flex items-center space-x-2">
						<AlertTriangle className="w-5 h-5 text-yellow-400" />
						<span className="text-yellow-400 font-medium">{stockWarningMessage}</span>
					</div>
				</div>
			)}

			{/* Product Display */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
				{/* 3D Model */}
				<CyberCard
					variant="default"
					showEffects={false}
					className="h-[500px] w-full"
				>
					<div className="h-full w-full flex flex-col">
						<div className="w-full h-[400px] pointer-events-auto">
							<ProteinModel
								scale={1}
								autoRotate={true}
							/>
						</div>
						<div className="w-full flex justify-center pt-4 pb-2">
							<div className="inline-flex items-center space-x-2 px-4 py-2 bg-neonGreen/10 border border-neonGreen/30 rounded-sm">
								<Shield className="w-5 h-5 text-neonGreen" />
								<span className="text-sm text-neonGreen font-medium">Blockchain Verified</span>
							</div>
						</div>
					</div>
				</CyberCard>

				{/* Product Info */}
				<div className="space-y-6">
					{/* Product Header */}
					<div>
						<h3 className="text-2xl font-heading font-bold text-white mb-2">
							{product.name}
						</h3>
						<div className="flex items-center space-x-4 mb-4">
							<div className="flex items-center space-x-1">
								{[...Array(5)].map((_, i) => (
									<Star
										key={i}
										className={`w-4 h-4 ${i < Math.floor(product.metadata.rating) ? 'text-neonOrange fill-current' : 'text-gray-400'}`}
									/>
								))}
								<span className="text-sm text-gray-400 ml-2">({product.metadata.rating})</span>
								{product.metadata.reviewCount > 0 && (
									<span className="text-sm text-gray-400">• {product.metadata.reviewCount} reviews</span>
								)}
							</div>
							<span className={`text-sm ${
								product.inventory.stockLevel === 'high' ? 'text-neonGreen' : 
								product.inventory.stockLevel === 'medium' ? 'text-yellow-400' : 
								product.inventory.stockLevel === 'low' ? 'text-orange-400' : 'text-red-400'
							}`}>
								{product.inventory.isAvailable ? 
									`${product.inventory.inStock} in stock` : 
									'Out of stock'
								}
							</span>
						</div>
						<p className="text-gray-400 leading-relaxed">
							{product.description}
						</p>
					</div>

					{/* Price */}
					<div className="border border-dark-300 rounded-sm p-4 bg-dark-200/30">
						<div className="flex items-center justify-between">
							<div>
								<div className="text-sm text-gray-400">
									{product.price.formatted}
								</div>
							</div>
							<div className="text-right">
								<div className="text-xs text-gray-500">per 50g serving</div>
								<div className="text-xs text-gray-500">Invoice-based payment</div>
							</div>
						</div>
					</div>

					{/* Cart Status */}
					{currentCartQuantity > 0 && (
						<div className="flex items-center space-x-2 p-3 border border-neonGreen/30 rounded-sm bg-neonGreen/5">
							<ShoppingCart className="w-4 h-4 text-neonGreen" />
							<span className="text-sm text-neonGreen">
								{currentCartQuantity} item{currentCartQuantity > 1 ? 's' : ''} in cart
							</span>
						</div>
					)}

					{/* Stock Level Indicator */}
					{product.inventory.isAvailable && (
						<div className={`flex items-center space-x-2 p-2 rounded-sm ${
							product.inventory.stockLevel === 'high' ? 'bg-neonGreen/5 border border-neonGreen/20' :
							product.inventory.stockLevel === 'medium' ? 'bg-yellow-400/5 border border-yellow-400/20' :
							'bg-orange-400/5 border border-orange-400/20'
						}`}>
							<div className={`w-2 h-2 rounded-full ${
								product.inventory.stockLevel === 'high' ? 'bg-neonGreen' :
								product.inventory.stockLevel === 'medium' ? 'bg-yellow-400' :
								'bg-orange-400'
							}`}></div>
							<span className={`text-xs ${
								product.inventory.stockLevel === 'high' ? 'text-neonGreen' :
								product.inventory.stockLevel === 'medium' ? 'text-yellow-400' :
								'text-orange-400'
							}`}>
								{product.inventory.stockLevel === 'high' ? 'In Stock' :
								 product.inventory.stockLevel === 'medium' ? 'Limited Stock' :
								 'Low Stock'}
							</span>
						</div>
					)}

					{/* Quantity Selector */}
					<div className="flex items-center space-x-4">
						<label className="text-sm font-medium text-white">Quantity:</label>
						<div className="flex items-center border border-dark-300 rounded-sm">
							<button
								onClick={() => handleQuantityChange(quantity - 1)}
								className="px-3 py-2 text-white hover:bg-dark-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
								disabled={quantity <= 1 || isAddingToCart}
							>
								-
							</button>
							<span className="px-4 py-2 bg-dark-200 text-white min-w-[60px] text-center">
								{quantity}
							</span>
							<button
								onClick={() => handleQuantityChange(quantity + 1)}
								className="px-3 py-2 text-white hover:bg-dark-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
								disabled={availableToAdd <= 0 || isOutOfStock || isAtOrderLimit || isAddingToCart}
							>
								+
							</button>
						</div>
						<div className="text-xs text-gray-400">
							{isOutOfStock ? 'Out of stock' : 
							 isAtOrderLimit ? 'Max limit reached' :
							 `Max ${product.settings.maxOrderQuantity}`}
						</div>
					</div>

					{/* Stock/Order Warnings */}
					{(isOutOfStock || isAtOrderLimit) && (
						<div className="flex items-start space-x-2 p-3 border border-yellow-600/30 rounded-sm bg-yellow-600/5">
							<AlertTriangle className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
							<div className="text-xs text-gray-300">
								{isOutOfStock ? 'This item is currently out of stock.' :
								 `Maximum order limit (${product.settings.maxOrderQuantity} items) reached for this product.`}
							</div>
						</div>
					)}

					<div className="space-y-3">
						<CyberButton
							variant="outline"
							className="w-full flex items-center justify-center space-x-2"
							onClick={handleAddToCart}
							disabled={isOutOfStock || isAtOrderLimit || isAddingToCart || availableToAdd <= 0}
						>
							{isAddingToCart ? (
								<Loader2 className="w-4 h-4 animate-spin" />
							) : (
								<ShoppingCart className="w-4 h-4" />
							)}
							<span>{isAddingToCart ? 'Adding...' : 'Add to Cart'}</span>
						</CyberButton>
					</div>

					{/* Features */}
					<div className="space-y-3">
						<h4 className="text-lg font-semibold text-white">Key Features</h4>
						<div className="grid grid-cols-1 gap-2">
							{product.metadata.features.map((feature, index) => (
								<div key={index} className="flex items-center space-x-2">
									<div className="w-2 h-2 bg-neonGreen rounded-full"></div>
									<span className="text-sm text-gray-300">{feature}</span>
								</div>
							))}
						</div>
					</div>

					{/* Tags */}
					{product.metadata.tags.length > 0 && (
						<div className="space-y-3">
							<h4 className="text-lg font-semibold text-white">Tags</h4>
							<div className="flex flex-wrap gap-2">
								{product.metadata.tags.map((tag, index) => (
									<span 
										key={index}
										className="px-2 py-1 text-xs bg-dark-200 text-neonGreen border border-neonGreen/30 rounded-sm"
									>
										{tag}
									</span>
								))}
							</div>
						</div>
					)}
				</div>
			</div>

			{/* Nutrition Facts */}
			<CyberCard
				title="Nutrition Facts"
				description="Per 50g serving"
				showEffects={false}
			>
				<div className="grid grid-cols-2 md:grid-cols-5 gap-4">
					{Object.entries(product.metadata.nutritionFacts).map(([key, value]) => (
						<div key={key} className="text-center">
							<div className="text-lg font-bold text-neonGreen">{value}</div>
							<div className="text-xs text-gray-400 capitalize">{key}</div>
						</div>
					))}
				</div>
			</CyberCard>

			{/* Product Info */}
			<div className="grid grid-cols-1 md:grid-cols-2 gap-8">
				<CyberCard
					title="Product Information"
					showEffects={false}
				>
					<div className="space-y-4">
						<div className="flex justify-between">
							<span className="text-gray-400">SKU:</span>
							<span className="text-white">{product.id}</span>
						</div>
						<div className="flex justify-between">
							<span className="text-gray-400">Category:</span>
							<span className="text-white capitalize">{product.settings.category || 'Protein'}</span>
						</div>
						<div className="flex justify-between">
							<span className="text-gray-400">Min Order:</span>
							<span className="text-white">{product.settings.minOrderQuantity}</span>
						</div>
						<div className="flex justify-between">
							<span className="text-gray-400">Max Order:</span>
							<span className="text-white">{product.settings.maxOrderQuantity}</span>
						</div>
						<div className="flex justify-between">
							<span className="text-gray-400">Updated:</span>
							<span className="text-white">{product.timestamps.updatedAt.toLocaleDateString()}</span>
						</div>
					</div>
				</CyberCard>

				<CyberCard
					title="Shipping & Returns"
					showEffects={false}
				>
					<div className="space-y-4 text-sm text-gray-300">
						<div className="flex items-center space-x-2">
							<Zap className="w-4 h-4 text-neonGreen" />
							<span>Fast shipping worldwide</span>
						</div>
						<div className="flex items-center space-x-2">
							<Shield className="w-4 h-4 text-neonGreen" />
							<span>30-day return guarantee</span>
						</div>
						<div className="flex items-center space-x-2">
							<Check className="w-4 h-4 text-neonGreen" />
							<span>Quality assured</span>
						</div>
						<p className="text-xs text-gray-400 mt-4">
							All products are verified on the blockchain for authenticity and quality assurance.
						</p>
					</div>
				</CyberCard>
			</div>
		</div>
	);
};

export default ShopSection;-e 
### FILE: ./src/app/dashboard/components/DashboardCard.tsx

// src/app/dashboard/components/DashboardCard.tsx
'use client';

import React, { useState } from 'react';
import { DashboardCardProps } from '../../../../types/dashboard';
import GridPattern from '../../components/common/GridPattern';

const DashboardCard: React.FC<DashboardCardProps> = ({
	id, // ←　idプロパティを受け取る
	title,
	description,
	icon,
	stats,
	badge,
	onClick,
	className = ''
}) => {
	const [isHovered, setIsHovered] = useState(false);

	// クリックハンドラー
	const handleClick = () => {
		onClick(id); // ←　idを渡してonClickを実行
	};

	return (
		<div
			className={`
        relative bg-gradient-to-t from-dark-100 to-black 
        border border-dark-300 rounded-sm overflow-hidden
        cursor-pointer transition-all duration-300 ease-out
        hover:border-neonGreen hover:scale-[1.02]
        hover:shadow-lg hover:shadow-neonGreen/20
        group
        ${className}
      `}
			onMouseEnter={() => setIsHovered(true)}
			onMouseLeave={() => setIsHovered(false)}
			onClick={handleClick} // ←　クリックイベントを追加
		>
			{/* Background Effects - スキャンラインなし、軽微なグリッドのみ */}
			<GridPattern
				size={30}
				opacity={0.03}
				color="rgba(0, 255, 127, 0.08)"
			/>

			{/* Content */}
			<div className="relative z-10 p-6">
				{/* Header */}
				<div className="flex items-center justify-between mb-4">
					<div className="flex items-center space-x-3">
						<div className="p-2 rounded-sm bg-dark-200/50 border border-dark-300">
							{icon}
						</div>
						<div>
							<h3 className="text-white font-heading font-semibold text-lg">
								{title}
							</h3>
						</div>
					</div>

					{badge && (
						<span className="inline-block px-2 py-1 text-xs rounded-sm bg-neonGreen/10 text-neonGreen border border-neonGreen/30 animate-pulse">
							{badge}
						</span>
					)}
				</div>

				{/* Description */}
				<p className="text-gray-400 text-sm mb-4 leading-relaxed">
					{description}
				</p>

				{/* Stats */}
				{stats && (
					<div className="flex items-center justify-between border-t border-dark-300 pt-3">
						<span className="text-xs text-gray-500">
							{stats}
						</span>
						<div className="w-2 h-2 bg-neonGreen rounded-full animate-pulse opacity-60" />
					</div>
				)}

				{/* Action Indicator */}
				<div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
					<div className="w-6 h-6 border border-neonGreen rounded-sm flex items-center justify-center">
						<svg
							className="w-3 h-3 text-neonGreen"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M9 5l7 7-7 7"
							/>
						</svg>
					</div>
				</div>
			</div>

			{/* Hover Overlay */}
			<div
				className={`
          absolute inset-0 bg-gradient-to-r from-neonGreen/5 to-neonOrange/5 
          transition-opacity duration-300 pointer-events-none
          ${isHovered ? 'opacity-100' : 'opacity-0'}
        `}
			/>

			{/* Subtle glow on hover */}
			{isHovered && (
				<div className="absolute inset-0 border border-neonGreen/20 rounded-sm pointer-events-none" />
			)}
		</div>
	);
};

export default DashboardCard;-e 
### FILE: ./src/app/dashboard/components/DashboardGrid.tsx

// src/app/dashboard/components/DashboardGrid.tsx
'use client';

import React from 'react';
import DashboardCard from './DashboardCard';
import { SectionType } from '../../../../types/dashboard';
import { useCart } from '../context/DashboardContext';
import { 
  ShoppingBag, 
  FileText, 
  CreditCard
} from 'lucide-react';

interface DashboardGridProps {
  onCardClick: (section: SectionType) => void;
}

const DashboardGrid: React.FC<DashboardGridProps> = ({ onCardClick }) => {
  const { getCartItemCount } = useCart();
  const cartItemCount = getCartItemCount();

  const dashboardCards = [
    {
      id: 'shop' as SectionType,
      title: 'Shop',
      description: 'Browse and purchase premium protein',
      icon: <ShoppingBag className="w-8 h-8 text-neonGreen" />,
      stats: '1 Product Available',
      badge: 'New'
    },
    {
      id: 'how-to-buy' as SectionType,
      title: 'How to Buy',
      description: 'Complete guide for crypto purchases',
      icon: <CreditCard className="w-8 h-8 text-neonOrange" />,
      stats: '5 Simple Steps'
    },
    {
      id: 'whitepaper' as SectionType,
      title: 'Whitepaper',
      description: 'Technical documentation and guides',
      icon: <FileText className="w-8 h-8 text-neonOrange" />,
      stats: '6 Sections'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {dashboardCards.map((card) => (
        <DashboardCard
          key={card.id}
          {...card}
          onClick={() => onCardClick(card.id)}
        />
      ))}
    </div>
  );
};

export default DashboardGrid;-e 
### FILE: ./src/app/dashboard/components/SlideInPanel.tsx

// src/app/dashboard/components/SlideInPanel.tsx
'use client';

import React, { useEffect } from 'react';
import { SlideInPanelProps } from '../../../../types/dashboard';
import { X, ArrowLeft } from 'lucide-react';
import CyberButton from '../../components/common/CyberButton';
import GridPattern from '../../components/common/GridPattern';

const SlideInPanel: React.FC<SlideInPanelProps> = ({
	isOpen,
	onClose,
	title,
	children,
	className = ''
}) => {
	// Escape key handling
	useEffect(() => {
		const handleEscape = (e: KeyboardEvent) => {
			if (e.key === 'Escape' && isOpen) {
				onClose();
			}
		};

		if (isOpen) {
			document.addEventListener('keydown', handleEscape);
			// Prevent background scrolling
			document.body.style.overflow = 'hidden';
		}

		return () => {
			document.removeEventListener('keydown', handleEscape);
			document.body.style.overflow = 'unset';
		};
	}, [isOpen, onClose]);

	if (!isOpen) return null;

	return (
		<>
			{/* Backdrop */}
			<div
				className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] transition-opacity duration-300"
				onClick={onClose}
			/>

			{/* Panel */}
			<div
				className={`
          fixed top-0 right-0 h-full w-full md:w-4/5 lg:w-3/4 xl:w-2/3 2xl:w-1/2
          bg-gradient-to-t from-dark-100 to-black
          border-l border-dark-300 shadow-2xl z-[110]
          transform transition-transform duration-300 ease-out
          translate-x-full
          ${isOpen ? '!translate-x-0' : ''}
          ${className}
        `}
			>
				{/* Background Effects */}
				<div className="absolute inset-0 overflow-hidden">
					<GridPattern
						size={40}
						opacity={0.02}
						color="rgba(0, 255, 127, 0.06)"
					/>
				</div>

				{/* Header */}
				<div className="relative z-10 flex items-center justify-between p-6 border-b border-dark-300">
					<div className="flex items-center space-x-4">
						{/* Back Button */}
						<CyberButton
							variant="outline"
							size="sm"
							onClick={onClose}
							className="flex items-center space-x-2 hover:bg-dark-200/50 transition-colors"
						>
							<ArrowLeft className="w-4 h-4" />
							<span>Back</span>
						</CyberButton>

						{/* Title */}
						<h2 className="text-2xl font-heading font-bold text-white">
							{title}
						</h2>
					</div>

					{/* Close Button */}
					<button
						onClick={onClose}
						className="p-2 text-gray-400 hover:text-white transition-colors duration-200 hover:bg-dark-200 rounded-sm group"
						aria-label="Close panel"
					>
						<X className="w-6 h-6 group-hover:rotate-90 transition-transform duration-200" />
					</button>
				</div>

				{/* Content */}
				<div className="relative z-10 h-[calc(100%-5rem)] overflow-y-auto">
					<div className={`
            p-6 transition-all duration-700 ease-out delay-300
            ${isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}
          `}>
						{children}
					</div>
				</div>

				{/* Subtle border glow */}
				<div className="absolute inset-0 border-l-2 border-neonGreen/10 pointer-events-none" />
			</div>
		</>
	);
};

export default SlideInPanel;-e 
### FILE: ./src/app/dashboard/layout.tsx

// src/app/dashboard/layout.tsx
'use client';

import Header from '../components/ui/Header';
import Footer from '../components/ui/Footer';
import GridPattern from '../components/common/GridPattern';
import SlideInPanel from './components/SlideInPanel';
import { DashboardProvider, usePanel } from './context/DashboardContext';

// セクションコンポーネントのインポート
import ShopSection from './components/sections/ShopSection';
import HowToBuySection from './components/sections/HowToBuySection';
import WhitepaperSection from './components/sections/WhitepaperSection';
import ProfileSection from './components/sections/ProfileSection';
import CartSection from './components/sections/CartSection';
import { SectionType } from '../../../types/dashboard';

interface DashboardLayoutProps {
	children: React.ReactNode;
}

// パネル管理コンポーネント
function DashboardPanelManager() {
	const { activeSection, isSlideOpen, closePanel } = usePanel();

	const renderSectionContent = () => {
		switch (activeSection) {
			case 'shop':
				return <ShopSection />;
			case 'how-to-buy':
				return <HowToBuySection />;
			case 'whitepaper':
				return <WhitepaperSection />;
			case 'profile':
				return <ProfileSection />;
			case 'cart':
				return <CartSection />;
			default:
				return <div className="text-white">Loading...</div>;
		}
	};

	const getSectionTitle = (section: SectionType | null): string => {
		const titles = {
			'shop': 'Shop',
			'how-to-buy': 'How to Buy',
			'whitepaper': 'Whitepaper',
			'profile': 'Profile',
			'cart': 'Cart'
		};
		return section ? titles[section] : '';
	};

	return (
		<SlideInPanel
			isOpen={isSlideOpen}
			onClose={closePanel}
			title={getSectionTitle(activeSection)}
		>
			{renderSectionContent()}
		</SlideInPanel>
	);
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
	return (
		<DashboardProvider>
			<div className="min-h-screen bg-black text-white relative">
				{/* Header */}
				<Header />

				{/* Background Effects */}
				<div className="fixed inset-0 z-0">
					<div className="absolute inset-0 bg-gradient-to-b from-black via-dark-100 to-black opacity-80" />
					<GridPattern
						size={40}
						opacity={0.02}
						color="rgba(0, 255, 127, 0.05)"
					/>
				</div>

				{/* Main Content */}
				<main className="relative z-10 pt-16 min-h-[calc(100vh-4rem)]">
					<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
						{children}
					</div>
				</main>

				{/* Footer */}
				<Footer />

				{/* SlideInPanel - 最前面に配置 */}
				<DashboardPanelManager />
			</div>
		</DashboardProvider>
	);
}-e 
### FILE: ./src/app/dashboard/context/DashboardContext.tsx

// src/app/dashboard/context/DashboardContext.tsx
'use client';

import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { DashboardState, CartItem, UserProfile, SectionType } from '../../../../types/dashboard';
import { useAuth } from '@/contexts/AuthContext';

// カート有効期限（30日）
const CART_EXPIRY_DAYS = 30;
const CART_EXPIRY_MS = CART_EXPIRY_DAYS * 24 * 60 * 60 * 1000;

// 簡素化されたCartItemの型（有効期限のみ）
interface CartItemWithExpiry extends CartItem {
	addedAt: string; // ISO string
}

// Actions
type DashboardAction =
	| { type: 'SET_USER_PROFILE'; payload: UserProfile | null }
	| { type: 'ADD_TO_CART'; payload: CartItem & { maxStock?: number } }
	| { type: 'REMOVE_FROM_CART'; payload: string }
	| { type: 'UPDATE_CART_QUANTITY'; payload: { id: string; quantity: number; maxStock?: number } }
	| { type: 'CLEAR_CART' }
	| { type: 'CLEAR_EXPIRED_ITEMS' }
	| { type: 'LOAD_FROM_STORAGE'; payload: Partial<DashboardState> }
	| { type: 'SET_HYDRATED'; payload: boolean }
	| { type: 'SET_ACTIVE_SECTION'; payload: SectionType | null }
	| { type: 'SET_SLIDE_OPEN'; payload: boolean };

// Helper functions for cart management
const isItemExpired = (addedAt: string): boolean => {
	const addedTime = new Date(addedAt).getTime();
	const currentTime = Date.now();
	return currentTime - addedTime > CART_EXPIRY_MS;
};

const validateQuantity = (quantity: number, maxStock?: number): number => {
	const validQuantity = Math.max(1, Math.min(quantity, 10)); // 最低1個、最大10個
	return maxStock ? Math.min(validQuantity, maxStock) : validQuantity;
};

const removeExpiredItems = (items: CartItemWithExpiry[]): CartItemWithExpiry[] => {
	return items.filter(item => !isItemExpired(item.addedAt));
};

// 拡張されたDashboardStateの型
interface ExtendedDashboardState extends DashboardState {
	isHydrated: boolean; // ハイドレーション完了フラグ
}

// Initial state
const initialState: ExtendedDashboardState = {
	activeSection: null,
	isSlideOpen: false,
	cartItems: [],
	userProfile: null,
	walletConnected: false,
	isHydrated: false, // 初期状態では false
};

// Reducer
function dashboardReducer(state: ExtendedDashboardState, action: DashboardAction): ExtendedDashboardState {
	switch (action.type) {
		case 'SET_USER_PROFILE':
			return { ...state, userProfile: action.payload };

		case 'ADD_TO_CART': {
			const { maxStock, ...itemData } = action.payload;
			const newItem: CartItemWithExpiry = {
				...itemData,
				addedAt: new Date().toISOString()
			};

			// 期限切れアイテムを除去
			const validItems = removeExpiredItems(state.cartItems as CartItemWithExpiry[]);

			const existingItem = validItems.find(item => item.id === newItem.id);

			if (existingItem) {
				const newQuantity = validateQuantity(existingItem.quantity + newItem.quantity, maxStock);
				return {
					...state,
					cartItems: validItems.map(item =>
						item.id === newItem.id
							? { ...item, quantity: newQuantity }
							: item
					),
				};
			}

			// 新しいアイテムの数量検証
			const validatedQuantity = validateQuantity(newItem.quantity, maxStock);

			return {
				...state,
				cartItems: [...validItems, { ...newItem, quantity: validatedQuantity }],
			};
		}

		case 'REMOVE_FROM_CART': {
			const validItems = removeExpiredItems(state.cartItems as CartItemWithExpiry[]);

			return {
				...state,
				cartItems: validItems.filter(item => item.id !== action.payload),
			};
		}

		case 'UPDATE_CART_QUANTITY': {
			const { id, quantity, maxStock } = action.payload;
			const validItems = removeExpiredItems(state.cartItems as CartItemWithExpiry[]);

			if (quantity <= 0) {
				return {
					...state,
					cartItems: validItems.filter(item => item.id !== id),
				};
			}

			const validatedQuantity = validateQuantity(quantity, maxStock);

			return {
				...state,
				cartItems: validItems.map(item =>
					item.id === id
						? { ...item, quantity: validatedQuantity }
						: item
				),
			};
		}

		case 'CLEAR_CART': {
			return { ...state, cartItems: [] };
		}

		case 'CLEAR_EXPIRED_ITEMS': {
			const validItems = removeExpiredItems(state.cartItems as CartItemWithExpiry[]);
			return { ...state, cartItems: validItems };
		}

		case 'LOAD_FROM_STORAGE': {
			// ストレージからロード時も期限チェック
			const loadedData = { ...action.payload };
			if (loadedData.cartItems) {
				loadedData.cartItems = removeExpiredItems(loadedData.cartItems as CartItemWithExpiry[]);
			}
			return { ...state, ...loadedData };
		}

		case 'SET_HYDRATED':
			return { ...state, isHydrated: action.payload };

		case 'SET_ACTIVE_SECTION':
			return { ...state, activeSection: action.payload };

		case 'SET_SLIDE_OPEN':
			return { ...state, isSlideOpen: action.payload };

		default:
			return state;
	}
}

// Context
const DashboardContext = createContext<{
	state: ExtendedDashboardState;
	dispatch: React.Dispatch<DashboardAction>;
} | null>(null);

// Provider
export function DashboardProvider({ children }: { children: React.ReactNode }) {
	const [state, dispatch] = useReducer(dashboardReducer, initialState);
	const { user } = useAuth();

	// Load from localStorage on mount (クライアントサイドのみ)
	useEffect(() => {
		// ブラウザ環境でのみ実行
		if (typeof window === 'undefined') return;

		try {
			const savedState = localStorage.getItem('dashboard-state');
			if (savedState) {
				const parsed = JSON.parse(savedState);
				console.log('📦 Loading from localStorage:', parsed);
				dispatch({ type: 'LOAD_FROM_STORAGE', payload: parsed });
			}
		} catch (error) {
			console.error('Failed to load dashboard state from localStorage:', error);
		} finally {
			// ハイドレーション完了をマーク
			dispatch({ type: 'SET_HYDRATED', payload: true });
		}
	}, []);

	// 期限切れアイテムの定期クリーンアップ（1時間ごと）
	useEffect(() => {
		const cleanup = () => {
			dispatch({ type: 'CLEAR_EXPIRED_ITEMS' });
		};

		// 初回クリーンアップ
		cleanup();

		// 1時間ごとにクリーンアップ
		const interval = setInterval(cleanup, 60 * 60 * 1000);

		return () => clearInterval(interval);
	}, []);

	// Save to localStorage when state changes (ハイドレーション完了後のみ)
	useEffect(() => {
		// ハイドレーション完了前は保存しない
		if (!state.isHydrated) return;

		try {
			const stateToSave = {
				cartItems: state.cartItems,
				userProfile: state.userProfile,
				lastUpdated: new Date().toISOString(),
			};
			console.log('💾 Saving to localStorage:', stateToSave);
			localStorage.setItem('dashboard-state', JSON.stringify(stateToSave));
		} catch (error) {
			console.error('Failed to save dashboard state to localStorage:', error);
		}
	}, [state.cartItems, state.userProfile, state.isHydrated]);

	// Notify header about cart changes (ハイドレーション完了後のみ)
	useEffect(() => {
		// ハイドレーション完了前は通知しない
		if (!state.isHydrated) return;

		const itemCount = state.cartItems.reduce((count, item) => count + item.quantity, 0);

		// カスタムイベントでヘッダーにカート数を通知
		const cartUpdateEvent = new CustomEvent('cartUpdated', {
			detail: { itemCount }
		});
		window.dispatchEvent(cartUpdateEvent);
		console.log('🔔 Cart updated notification sent:', itemCount);
	}, [state.cartItems, state.isHydrated]);

	// Set up cart click handler for header
	useEffect(() => {
		const cartClickHandler = () => {
			dispatch({ type: 'SET_ACTIVE_SECTION', payload: 'cart' });
			dispatch({ type: 'SET_SLIDE_OPEN', payload: true });
		};

		// カスタムイベントでヘッダーにクリックハンドラーを登録
		const handlerEvent = new CustomEvent('cartClickHandlerSet', {
			detail: { clickHandler: cartClickHandler }
		});
		window.dispatchEvent(handlerEvent);
	}, []);

	return (
		<DashboardContext.Provider value={{ state, dispatch }}>
			{children}
		</DashboardContext.Provider>
	);
}

// Hook
export function useDashboard() {
	const context = useContext(DashboardContext);
	if (!context) {
		throw new Error('useDashboard must be used within a DashboardProvider');
	}
	return context;
}

// Panel management hook
export function usePanel() {
	const { state, dispatch } = useDashboard();

	const openPanel = (section: SectionType) => {
		dispatch({ type: 'SET_ACTIVE_SECTION', payload: section });
		dispatch({ type: 'SET_SLIDE_OPEN', payload: true });
	};

	const closePanel = () => {
		dispatch({ type: 'SET_SLIDE_OPEN', payload: false });
		// アニメーション完了後にactiveSectionをクリア
		setTimeout(() => {
			dispatch({ type: 'SET_ACTIVE_SECTION', payload: null });
		}, 300);
	};

	return {
		activeSection: state.activeSection,
		isSlideOpen: state.isSlideOpen,
		openPanel,
		closePanel,
	};
}

// Cart management hook
export function useCart() {
	const { state, dispatch } = useDashboard();

	const addToCart = (item: CartItem, maxStock?: number) => {
		dispatch({ type: 'ADD_TO_CART', payload: { ...item, maxStock } });
	};

	const removeFromCart = (id: string) => {
		dispatch({ type: 'REMOVE_FROM_CART', payload: id });
	};

	const updateQuantity = (id: string, quantity: number, maxStock?: number) => {
		dispatch({ type: 'UPDATE_CART_QUANTITY', payload: { id, quantity, maxStock } });
	};

	const clearCart = () => {
		dispatch({ type: 'CLEAR_CART' });
	};

	const getCartTotal = () => {
		return state.cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
	};

	const getCartItemCount = () => {
		return state.cartItems.reduce((count, item) => count + item.quantity, 0);
	};

	// カート内のアイテムの残り有効期限を取得
	const getItemTimeLeft = (addedAt: string) => {
		const addedTime = new Date(addedAt).getTime();
		const currentTime = Date.now();
		const timeLeft = CART_EXPIRY_MS - (currentTime - addedTime);

		if (timeLeft <= 0) return null;

		const daysLeft = Math.floor(timeLeft / (24 * 60 * 60 * 1000));
		const hoursLeft = Math.floor((timeLeft % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));

		if (daysLeft > 0) return `${daysLeft} day${daysLeft > 1 ? 's' : ''} left`;
		if (hoursLeft > 0) return `${hoursLeft} hour${hoursLeft > 1 ? 's' : ''} left`;
		return 'Expires soon';
	};

	// 在庫チェック機能（ローカル版）
	const checkStock = (id: string, requestedQuantity: number, availableStock: number) => {
		const currentItem = state.cartItems.find(item => item.id === id);
		const currentQuantity = currentItem ? currentItem.quantity : 0;
		const totalRequested = currentQuantity + requestedQuantity;

		return {
			canAdd: totalRequested <= availableStock && totalRequested <= 10,
			maxCanAdd: Math.min(availableStock - currentQuantity, 10 - currentQuantity),
			willExceedStock: totalRequested > availableStock,
			willExceedLimit: totalRequested > 10
		};
	};

	// カートアイテムの詳細情報を取得（期限情報付き）
	const getCartItemsWithDetails = () => {
		return state.cartItems.map(item => {
			const itemWithExpiry = item as CartItemWithExpiry;
			return {
				...item,
				addedAt: itemWithExpiry.addedAt,
				timeLeft: getItemTimeLeft(itemWithExpiry.addedAt)
			};
		});
	};

	return {
		cartItems: state.cartItems,
		addToCart,
		removeFromCart,
		updateQuantity,
		clearCart,
		getCartTotal,
		getCartItemCount,
		getItemTimeLeft,
		checkStock,
		getCartItemsWithDetails,
	};
}

// Profile management hook
export function useProfile() {
	const { state, dispatch } = useDashboard();

	const setUserProfile = (profile: UserProfile | null) => {
		dispatch({ type: 'SET_USER_PROFILE', payload: profile });
	};

	return {
		userProfile: state.userProfile,
		setUserProfile,
	};
}

// Optional wallet hook for future integration
export function useWallet() {
	const { state } = useDashboard();

	const connectWallet = () => {
		console.log('Wallet connection not required for invoice payments');
	};

	const disconnectWallet = () => {
		console.log('Wallet disconnection not required for invoice payments');
	};

	return {
		walletConnected: false,
		userProfile: state.userProfile,
		connectWallet,
		disconnectWallet,
	};
}-e 
### FILE: ./src/app/dashboard/page.tsx

// src/app/dashboard/page.tsx
'use client';

import React from 'react';
import DashboardGrid from './components/DashboardGrid';
import PurchaseScanSection from './components/sections/PurchaseScanSection';
import { usePanel } from './context/DashboardContext';

export default function DashboardPage() {
	const { openPanel } = usePanel();

	return (
		<>
			{/* ダッシュボードヘッダー */}
			<div className="mb-8">
				<h1 className="text-4xl font-heading font-bold text-white mb-2">
					Dashboard
				</h1>
				<p className="text-gray-400">
					Welcome to your Web3 protein command center
				</p>
			</div>

			{/* ダッシュボードグリッド */}
			<div className="mb-12">
				<DashboardGrid onCardClick={openPanel} />
			</div>

			{/* Purchase Scan セクション - 独立表示 */}
			<div className="border-t border-dark-300 pt-12">
				<PurchaseScanSection />
			</div>
		</>
	);
}-e 
### FILE: ./src/app/profile/layout.tsx

// src/app/profile/layout.tsx
'use client';

import Header from '../components/ui/Header';
import Footer from '../components/ui/Footer';
import GridPattern from '../components/common/GridPattern';

interface ProfileLayoutProps {
	children: React.ReactNode;
}

export default function ProfileLayout({ children }: ProfileLayoutProps) {
	return (
		<div className="min-h-screen bg-black text-white relative">
			{/* Header */}
			<Header />

			{/* Background Effects */}
			<div className="fixed inset-0 z-0">
				<div className="absolute inset-0 bg-gradient-to-b from-black via-dark-100 to-black opacity-80" />
				<GridPattern
					size={40}
					opacity={0.02}
					color="rgba(0, 255, 127, 0.05)"
				/>
			</div>

			{/* Main Content */}
			<main className="relative z-10 pt-16 min-h-[calc(100vh-4rem)]">
				{children}
			</main>

			{/* Footer */}
			<Footer />
		</div>
	);
}-e 
### FILE: ./src/app/profile/page.tsx

// src/app/profile/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import CyberCard from '../components/common/CyberCard';
import CyberButton from '../components/common/CyberButton';
import { ProfileEditModal } from '../dashboard/components/sections/ProfileEditModal';
import {
	User,
	Wallet,
	Trophy,
	Calendar,
	ShoppingBag,
	TrendingUp,
	Award,
	ExternalLink,
	Copy,
	Check,
	Shield,
	LogIn,
	Edit,
	AlertCircle,
	CheckCircle,
	ArrowLeft
} from 'lucide-react';
import {
	getUserDisplayName,
	getUserAvatarUrl,
	getUserInitials,
	formatUserStats,
	formatDate,
	formatAddress,
	calculateProfileCompleteness
} from '@/utils/userHelpers';

export default function ProfilePage() {
	const { user, loading, firestoreUser, firestoreLoading } = useAuth();
	const [copiedAddress, setCopiedAddress] = useState(false);
	const [isEditModalOpen, setIsEditModalOpen] = useState(false);

	// ページタイトルの設定
	useEffect(() => {
		document.title = 'Profile - We are on-chain';
		return () => {
			document.title = 'We are on-chain';
		};
	}, []);

	// ローディング状態
	if (loading || firestoreLoading) {
		return (
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				<div className="space-y-8">
					<div className="text-center">
						<h1 className="text-4xl font-heading font-bold text-white mb-2">
							Profile
						</h1>
						<p className="text-gray-400">
							Loading your Web3 protein journey...
						</p>
					</div>

					<CyberCard showEffects={false}>
						<div className="flex items-center justify-center py-12">
							<div className="flex items-center space-x-3">
								<div className="w-8 h-8 border-2 border-neonGreen border-t-transparent rounded-full animate-spin"></div>
								<span className="text-white">Loading profile data...</span>
							</div>
						</div>
					</CyberCard>
				</div>
			</div>
		);
	}

	// 未認証の場合のプロンプト
	if (!user) {
		return (
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				<div className="space-y-8">
					<div className="text-center">
						<h1 className="text-4xl font-heading font-bold text-white mb-2">
							Profile
						</h1>
						<p className="text-gray-400">
							Your Web3 protein journey and achievements
						</p>
					</div>

					<CyberCard showEffects={false}>
						<div className="text-center py-12">
							<div className="w-20 h-20 bg-gradient-to-br from-neonGreen/20 to-neonOrange/20 rounded-full flex items-center justify-center mx-auto mb-6">
								<Shield className="w-10 h-10 text-neonGreen" />
							</div>

							<h3 className="text-2xl font-bold text-white mb-4">
								Authentication Required
							</h3>

							<p className="text-gray-400 mb-8 max-w-md mx-auto">
								Please log in to access your profile, view your order history, and track your achievements in the on-chain protein revolution.
							</p>

							<div className="flex flex-col sm:flex-row gap-4 justify-center">
								<CyberButton
									variant="primary"
									className="flex items-center space-x-2"
									onClick={() => {
										const loginEvent = new CustomEvent('openAuthModal');
										window.dispatchEvent(loginEvent);
									}}
								>
									<LogIn className="w-4 h-4" />
									<span>Sign In</span>
								</CyberButton>

								<CyberButton
									variant="outline"
									onClick={() => window.location.href = '/dashboard'}
									className="flex items-center space-x-2"
								>
									<ArrowLeft className="w-4 h-4" />
									<span>Back to Dashboard</span>
								</CyberButton>
							</div>

							<div className="mt-8 p-4 border border-neonGreen/30 rounded-sm bg-neonGreen/5">
								<h4 className="text-neonGreen font-semibold mb-2">Why Sign In?</h4>
								<ul className="text-sm text-gray-300 space-y-1 text-left max-w-xs mx-auto">
									<li>• Track your order history</li>
									<li>• Earn badges and achievements</li>
									<li>• Access exclusive member benefits</li>
									<li>• Join the community leaderboard</li>
								</ul>
							</div>
						</div>
					</CyberCard>
				</div>
			</div>
		);
	}

	// Firestoreユーザーデータが存在しない場合
	if (!firestoreUser) {
		return (
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				<div className="space-y-8">
					<div className="text-center">
						<h1 className="text-4xl font-heading font-bold text-white mb-2">
							Profile
						</h1>
						<p className="text-gray-400">
							Setting up your profile...
						</p>
					</div>

					<CyberCard showEffects={false}>
						<div className="text-center py-12">
							<div className="w-20 h-20 bg-gradient-to-br from-neonOrange/20 to-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
								<AlertCircle className="w-10 h-10 text-neonOrange" />
							</div>

							<h3 className="text-2xl font-bold text-white mb-4">
								Profile Setup in Progress
							</h3>

							<p className="text-gray-400 mb-8 max-w-md mx-auto">
								We're setting up your profile. This usually takes just a moment.
							</p>

							<div className="flex flex-col sm:flex-row gap-4 justify-center">
								<CyberButton
									variant="outline"
									onClick={() => window.location.reload()}
								>
									Refresh Page
								</CyberButton>

								<CyberButton
									variant="outline"
									onClick={() => window.location.href = '/dashboard'}
									className="flex items-center space-x-2"
								>
									<ArrowLeft className="w-4 h-4" />
									<span>Back to Dashboard</span>
								</CyberButton>
							</div>
						</div>
					</CyberCard>
				</div>
			</div>
		);
	}

	// プロフィール完成度を計算
	const profileCompleteness = calculateProfileCompleteness(firestoreUser);
	const formattedStats = formatUserStats(firestoreUser.stats);
	const displayName = getUserDisplayName(firestoreUser, user);
	const avatarUrl = getUserAvatarUrl(firestoreUser, user);
	const initials = getUserInitials(firestoreUser, user);

	const handleCopyAddress = () => {
		navigator.clipboard.writeText(firestoreUser.walletAddress || firestoreUser.id);
		setCopiedAddress(true);
		setTimeout(() => setCopiedAddress(false), 2000);
	};

	const orderHistory = [
		{
			id: 'order-001',
			date: new Date('2024-05-15'),
			product: 'Pepe Flavor Protein',
			quantity: 1,
			amount: 0.025,
			amountUSD: 89.99,
			status: 'Delivered',
			txHash: '0x789xyz...def456'
		},
		{
			id: 'order-002',
			date: new Date('2024-04-28'),
			product: 'Pepe Flavor Protein',
			quantity: 2,
			amount: 0.05,
			amountUSD: 179.98,
			status: 'Delivered',
			txHash: '0xabc123...789def'
		},
		{
			id: 'order-003',
			date: new Date('2024-04-10'),
			product: 'Pepe Flavor Protein',
			quantity: 1,
			amount: 0.05,
			amountUSD: 189.99,
			status: 'Delivered',
			txHash: '0x456def...123abc'
		}
	];

	const achievements = [
		{ name: 'First Purchase', description: 'Made your first crypto purchase', earned: true },
		{ name: 'Loyal Customer', description: 'Made 5+ purchases', earned: false, progress: firestoreUser.stats.totalOrders },
		{ name: 'Community Champion', description: 'Active in Discord for 30 days', earned: true },
		{ name: 'Whale Status', description: 'Spent over 1 ETH total', earned: false, progress: firestoreUser.stats.totalSpent }
	];

	const getStatusColor = (status: string) => {
		switch (status) {
			case 'Delivered': return 'text-neonGreen';
			case 'Shipped': return 'text-neonOrange';
			case 'Processing': return 'text-yellow-400';
			default: return 'text-gray-400';
		}
	};

	return (
		<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
			<div className="space-y-8">
				{/* Header with Back Button */}
				<div className="flex items-center justify-between">
					<div>
						<div className="flex items-center space-x-4 mb-2">
							<CyberButton
								variant="outline"
								size="sm"
								onClick={() => window.location.href = '/dashboard'}
								className="flex items-center space-x-2"
							>
								<ArrowLeft className="w-4 h-4" />
								<span>Dashboard</span>
							</CyberButton>
							<h1 className="text-4xl font-heading font-bold text-white">
								Profile
							</h1>
						</div>
						<p className="text-gray-400">
							Your Web3 protein journey and achievements
						</p>
					</div>
				</div>

				{/* Profile Completeness Alert */}
				{!profileCompleteness.isComplete && (
					<div className="bg-gradient-to-r from-neonOrange/10 to-yellow-500/10 border border-neonOrange/30 rounded-sm p-4">
						<div className="flex items-start space-x-3">
							<AlertCircle className="w-5 h-5 text-neonOrange mt-0.5" />
							<div className="flex-1">
								<h4 className="text-neonOrange font-semibold mb-1">
									Complete Your Profile ({profileCompleteness.completionPercentage}%)
								</h4>
								<p className="text-sm text-gray-300 mb-3">
									Add missing information to unlock all features and improve your experience.
								</p>
								<div className="w-full bg-dark-300 rounded-full h-2 mb-3">
									<div
										className="bg-gradient-to-r from-neonOrange to-yellow-500 h-2 rounded-full transition-all duration-300"
										style={{ width: `${profileCompleteness.completionPercentage}%` }}
									/>
								</div>
								<div className="flex flex-wrap gap-2 mb-3">
									{profileCompleteness.missingFields.map((field, index) => (
										<span key={index} className="text-xs bg-neonOrange/20 text-neonOrange px-2 py-1 rounded">
											{field}
										</span>
									))}
								</div>
								<CyberButton
									variant="outline"
									size="sm"
									onClick={() => setIsEditModalOpen(true)}
									className="flex items-center space-x-2"
								>
									<Edit className="w-3 h-3" />
									<span>Complete Profile</span>
								</CyberButton>
							</div>
						</div>
					</div>
				)}

				{/* Welcome Message */}
				<div className="bg-gradient-to-r from-neonGreen/10 to-neonOrange/10 border border-neonGreen/30 rounded-sm p-4">
					<div className="flex items-center justify-between">
						<div className="flex items-center space-x-3">
							<div className="w-10 h-10 bg-gradient-to-br from-neonGreen to-neonOrange rounded-full flex items-center justify-center">
								{profileCompleteness.isComplete ? (
									<CheckCircle className="w-5 h-5 text-black" />
								) : (
									<User className="w-5 h-5 text-black" />
								)}
							</div>
							<div>
								<h3 className="text-white font-semibold">Welcome back, {displayName}!</h3>
								<p className="text-sm text-gray-400">
									Connected via {user.providerData[0]?.providerId === 'google.com' ? 'Google' : 'Email'}
									{user.emailVerified && <span className="text-neonGreen ml-2">✓ Verified</span>}
									{profileCompleteness.isComplete && <span className="text-neonGreen ml-2">✓ Complete</span>}
								</p>
							</div>
						</div>
						<CyberButton
							variant="outline"
							size="sm"
							onClick={() => setIsEditModalOpen(true)}
							className="flex items-center space-x-2"
						>
							<Edit className="w-3 h-3" />
							<span>Edit</span>
						</CyberButton>
					</div>
				</div>

				{/* Profile Overview */}
				<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
					{/* Main Profile Card */}
					<CyberCard showEffects={false} className="lg:col-span-2">
						<div className="flex items-start space-x-6">
							{/* Avatar */}
							<div className="flex-shrink-0">
								{avatarUrl ? (
									<img
										src={avatarUrl}
										alt="Profile"
										className="w-20 h-20 rounded-full border-2 border-neonGreen"
									/>
								) : (
									<div className="w-20 h-20 bg-gradient-to-br from-neonGreen to-neonOrange rounded-full flex items-center justify-center">
										<span className="text-2xl font-bold text-black">
											{initials}
										</span>
									</div>
								)}
							</div>

							{/* Profile Info */}
							<div className="flex-1">
								<div className="flex items-center space-x-3 mb-2">
									<h3 className="text-xl font-bold text-white">{displayName}</h3>
									{firestoreUser.nickname && firestoreUser.nickname !== displayName && (
										<span className="text-sm text-gray-400">({firestoreUser.nickname})</span>
									)}
								</div>

								<div className="flex items-center space-x-2 mb-2">
									<span className="text-sm text-gray-400">Email:</span>
									<span className="text-sm text-gray-300">{firestoreUser.email}</span>
									{user.emailVerified && (
										<span className="text-xs bg-neonGreen/20 text-neonGreen px-2 py-1 rounded">Verified</span>
									)}
								</div>

								<div className="flex items-center space-x-2 mb-4">
									<Wallet className="w-4 h-4 text-gray-400" />
									<span className="font-mono text-sm text-gray-300">
										User ID: {firestoreUser.id.slice(0, 8)}...{firestoreUser.id.slice(-4)}
									</span>
									<button
										onClick={handleCopyAddress}
										className="text-gray-400 hover:text-neonGreen transition-colors"
									>
										{copiedAddress ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
									</button>
								</div>

								<div className="grid grid-cols-2 gap-4">
									<div>
										<div className="text-sm text-gray-400">Member Since</div>
										<div className="text-white font-semibold">{formatDate(firestoreUser.createdAt)}</div>
									</div>
									<div>
										<div className="text-sm text-gray-400">Community Rank</div>
										<div className="text-neonGreen font-semibold">{formattedStats.rankFormatted}</div>
									</div>
								</div>

								{/* Address Display */}
								<div className="mt-4 p-3 bg-dark-200/30 rounded-sm">
									<div className="text-sm text-gray-400 mb-1">Address</div>
									<div className="text-sm text-gray-300">{formatAddress(firestoreUser.address)}</div>
								</div>
							</div>
						</div>
					</CyberCard>

					{/* Stats Card */}
					<CyberCard title="Stats" showEffects={false}>
						<div className="space-y-4">
							<div className="flex justify-between items-center">
								<span className="text-gray-400">Total Spent</span>
								<div className="text-right">
									<div className="text-neonGreen font-bold">{formattedStats.totalSpentFormatted}</div>
									<div className="text-xs text-gray-500">{formattedStats.totalSpentUSDFormatted}</div>
								</div>
							</div>

							<div className="flex justify-between items-center">
								<span className="text-gray-400">Total Orders</span>
								<span className="text-white font-semibold">{firestoreUser.stats.totalOrders}</span>
							</div>

							<div className="flex justify-between items-center">
								<span className="text-gray-400">Badges Earned</span>
								<span className="text-neonOrange font-semibold">{formattedStats.badgeCount}</span>
							</div>

							<div className="flex justify-between items-center">
								<span className="text-gray-400">Profile Status</span>
								<span className={`font-semibold ${profileCompleteness.isComplete ? 'text-neonGreen' : 'text-neonOrange'}`}>
									{profileCompleteness.isComplete ? 'Complete' : `${profileCompleteness.completionPercentage}%`}
								</span>
							</div>
						</div>
					</CyberCard>
				</div>

				{/* Badges */}
				<CyberCard title="Badges & Achievements" showEffects={false}>
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
						{firestoreUser.stats.badges.map((badge, index) => (
							<div key={index} className="flex items-center space-x-3 p-3 border border-neonOrange/30 rounded-sm bg-neonOrange/5">
								<Award className="w-5 h-5 text-neonOrange" />
								<span className="text-white font-medium">{badge}</span>
							</div>
						))}
					</div>
				</CyberCard>

				{/* Achievement Progress */}
				<CyberCard title="Achievement Progress" showEffects={false}>
					<div className="space-y-4">
						{achievements.map((achievement, index) => (
							<div key={index} className="flex items-center justify-between p-4 border border-dark-300 rounded-sm">
								<div className="flex items-center space-x-3">
									<Trophy className={`w-5 h-5 ${achievement.earned ? 'text-neonGreen' : 'text-gray-400'}`} />
									<div>
										<div className="text-white font-medium">{achievement.name}</div>
										<div className="text-sm text-gray-400">{achievement.description}</div>
									</div>
								</div>

								<div className="text-right">
									{achievement.earned ? (
										<span className="text-neonGreen font-semibold">Earned</span>
									) : (
										<div>
											<div className="text-sm text-gray-400">
												Progress: {achievement.progress}/{achievement.name === 'Loyal Customer' ? '5' : '1'}
											</div>
											<div className="w-24 h-2 bg-dark-300 rounded-full overflow-hidden">
												<div
													className="h-full bg-neonOrange transition-all duration-300"
													style={{
														width: `${achievement.name === 'Loyal Customer'
															? (achievement.progress! / 5) * 100
															: (achievement.progress! / 1) * 100}%`
													}}
												/>
											</div>
										</div>
									)}
								</div>
							</div>
						))}
					</div>
				</CyberCard>

				{/* Order History */}
				<CyberCard title="Recent Orders" showEffects={false}>
					<div className="overflow-x-auto">
						<table className="w-full">
							<thead>
								<tr className="border-b border-dark-300">
									<th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Date</th>
									<th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Product</th>
									<th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Amount</th>
									<th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Status</th>
									<th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Actions</th>
								</tr>
							</thead>
							<tbody>
								{orderHistory.map((order) => (
									<tr key={order.id} className="border-b border-dark-300/50 hover:bg-dark-200/30 transition-colors">
										<td className="py-4 px-4 text-sm text-gray-300">{formatDate(order.date)}</td>
										<td className="py-4 px-4">
											<div>
												<div className="text-white font-medium">{order.product}</div>
												<div className="text-xs text-gray-400">Qty: {order.quantity}</div>
											</div>
										</td>
										<td className="py-4 px-4">
											<div>
												<div className="text-neonGreen font-bold">Ξ {order.amount}</div>
												<div className="text-xs text-gray-400">${order.amountUSD}</div>
											</div>
										</td>
										<td className="py-4 px-4">
											<span className={`font-medium ${getStatusColor(order.status)}`}>
												{order.status}
											</span>
										</td>
										<td className="py-4 px-4">
											<CyberButton variant="outline" size="sm" className="flex items-center space-x-1">
												<ExternalLink className="w-3 h-3" />
												<span>View</span>
											</CyberButton>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</CyberCard>

				{/* Profile Edit Modal */}
				<ProfileEditModal
					isOpen={isEditModalOpen}
					onClose={() => setIsEditModalOpen(false)}
					firestoreUser={firestoreUser}
				/>
			</div>
		</div>
	);
}-e 
### FILE: ./src/app/components/home/layout/constants.ts

// src/app/components/floating-images-fix/cyber-scroll-messages/constants.ts

export type GlitchEffectType = 'rgb' | 'slice' | 'wave' | 'pulse' | 'jitter' | 'none';
export type TextDirection = 'horizontal' | 'vertical';
export type TextAlignment = 'left' | 'center' | 'right';

export interface MessageConfig {
	id: string;
	text: string;
	position: {
		start: number; // vh単位での開始位置
		end: number;   // vh単位での終了位置
	};
	style: TextDirection;
	size: string;
	align?: TextAlignment;
	glitchEffect?: GlitchEffectType;
	keywords?: string[]; // 特別強調するキーワード
	delay?: number;      // 表示遅延 (ms)
	color?: string;      // オーバーライド色
}

export interface GlitchEffectConfig {
	className: string;
	intensity: number;
}

// メッセージ定義
export const cyberMessages: MessageConfig[] = [
	{
		id: 'message-1',
		text: 'Pepe Ascends.',
		position: { start: 0, end: 200 },
		style: 'horizontal',
		size: '4rem',
		align: 'left',
		glitchEffect: 'rgb',
		keywords: ['mystery', 'miracle'],
		color: '#ffffff', // 白色ベース
	},
	{
		id: 'message-2',
		text: 'Pepe Summons Us Here.',
		position: { start: 200, end: 400 },
		style: 'horizontal',
		size: '4rem',
		align: 'right',
		glitchEffect: 'slice',
		keywords: ['限られた', 'たどり着く'],
		color: '#ffffff', // 白色ベース
	},
	{
		id: 'message-3',
		text: 'The<br/>Awakening',
		position: { start: 400, end: 700 },
		style: 'horizontal',
		size: '10rem',
		align: 'left',
		glitchEffect: 'rgb',
		keywords: ['境地'],
		color: '#ffffff', // 白色ベース
	}
];

// グリッチエフェクト設定
export const glitchEffects: Record<GlitchEffectType, GlitchEffectConfig> = {
	rgb: {
		className: 'rgbSplit',
		intensity: 2
	},
	wave: {
		className: 'waveDistort',
		intensity: 1.5
	},
	slice: {
		className: 'sliceGlitch',
		intensity: 3
	},
	pulse: {
		className: 'pulseEffect',
		intensity: 2
	},
	jitter: {
		className: 'jitterEffect',
		intensity: 1
	},
	none: {
		className: '',
		intensity: 0
	}
};

// システムステータス表示用テキスト
export const systemStatusText = {
	loading: 'Loading...',
	ready: 'Activate',
	awakening: 'Start...',
	complete: 'END'
};

// 装飾用ランダムバイナリ生成
export const generateRandomBinary = (length: number): string => {
	return Array.from({ length }, () => Math.round(Math.random())).join('');
};

// 装飾用16進数生成
export const generateRandomHex = (length: number): string => {
	const hexChars = '0123456789ABCDEF';
	return Array.from(
		{ length },
		() => hexChars[Math.floor(Math.random() * hexChars.length)]
	).join('');
};-e 
### FILE: ./src/app/components/home/layout/CyberInterface.tsx

// src/app/components/floating-images-fix/cyber-scroll-messages/CyberInterface.tsx

'use client';

import React, { useEffect, useState } from 'react';
import styles from './styles.module.css';
import {
	generateRandomBinary,
	generateRandomHex,
	systemStatusText,
	cyberMessages
} from './constants';

interface CyberInterfaceProps {
}

const CyberInterface: React.FC<CyberInterfaceProps> = ({

}) => {
	const [dataStream, setDataStream] = useState<string[]>([]);
	const [systemTime, setSystemTime] = useState<string>('');
	const [scrollProgress, setScrollProgress] = useState<number>(0);
	const [activeIndex, setActiveIndex] = useState<number | null>(null);
	const [randomGlitch, setRandomGlitch] = useState<boolean>(false);
	const [isFlashActive, setIsFlashActive] = useState<boolean>(false);
	const [debugInfo, setDebugInfo] = useState<{ [key: string]: any }>({});

	// 強制的に全てのメッセージをアクティブにする（デバッグ用）
	const [forceAllActive, setForceAllActive] = useState<boolean>(false);

	useEffect(() => {
		const handleScroll = () => {
			// 現在のページ全体のスクロール位置
			const scrollTop = window.scrollY;
			const winHeight = window.innerHeight;
			const docHeight = document.documentElement.scrollHeight;

			// まず全体のスクロール進捗を計算
			const totalScrollProgress = scrollTop / (docHeight - winHeight);

			// FloatingImagesFixSectionを特定のセレクターで検索
			const targetSection = document.querySelector('#floating-images-fix-section') as HTMLElement;

			if (!targetSection) {
				// フォールバック: クラス名でも検索
				const fallbackSection = document.querySelector('.floating-images-fix-section') as HTMLElement;

				if (!fallbackSection) {
					// セクションが見つからない場合、ページの相対位置で推定
					console.log('Target section not found, estimating position');

					// ページの相対位置から推定（調整された値）
					const estimatedStart = docHeight * 0.5;  // 0.66から0.5に調整
					const estimatedHeight = docHeight * 0.25;

					// 相対スクロール位置を計算
					const relativeScroll = Math.max(0, Math.min(1,
						(scrollTop - estimatedStart) / estimatedHeight
					));

					setScrollProgress(relativeScroll);
					setDebugInfo({
						scrollTop,
						docHeight,
						estimatedStart,
						estimatedHeight,
						relativeScroll,
						mode: 'estimated'
					});

					// メッセージ表示の判定
					updateActiveMessage(relativeScroll * 800);
				} else {
					// フォールバックセクションを使用
					processSectionScroll(fallbackSection, scrollTop);
				}
			} else {
				// メインのIDセレクターで見つかった場合
				processSectionScroll(targetSection, scrollTop);
			}

			// ランダムグリッチの発生
			triggerRandomGlitch();
		};

		// セクションスクロール処理を共通化
		const processSectionScroll = (section: HTMLElement, scrollTop: number) => {
			const rect = section.getBoundingClientRect();
			const sectionTop = rect.top + scrollTop;
			const sectionHeight = rect.height;

			// セクション内相対位置を計算
			let relativeScroll = 0;
			if (scrollTop < sectionTop) {
				relativeScroll = 0;
			} else if (scrollTop > sectionTop + sectionHeight) {
				relativeScroll = 1;
			} else {
				relativeScroll = (scrollTop - sectionTop) / sectionHeight;
			}

			setScrollProgress(relativeScroll);
			setDebugInfo({
				scrollTop,
				sectionTop,
				sectionHeight,
				relativeScroll,
				viewportOffset: rect.top,
				mode: 'section-based',
				sectionFound: section.id || section.className
			});

			// メッセージ表示の判定
			updateActiveMessage(relativeScroll * 800);
		};

		// メッセージのアクティブ状態を更新
		const updateActiveMessage = (currentVhPosition: number) => {
			if (forceAllActive) {
				setActiveIndex(0);
				return;
			}

			// セクション検出が正常に動作している場合は、オフセット調整を少なくする
			const adjustedPosition = currentVhPosition - 50; // 150から50に調整

			let foundActive = false;
			let activeIdx = null;


			setActiveIndex(foundActive ? activeIdx : null);
		};

		// フラッシュエフェクトをトリガー
		const triggerFlashEffect = () => {
			setIsFlashActive(true);
			setTimeout(() => setIsFlashActive(false), 300);
		};

		// ランダムなグリッチエフェクトをトリガー
		const triggerRandomGlitch = () => {
			if (Math.random() > 0.95) {
				setRandomGlitch(true);
				setTimeout(() => setRandomGlitch(false), 150);
			}
		};

		window.addEventListener('scroll', handleScroll);
		handleScroll(); // 初期化時に一度実行

		// キーボードショートカット：Dキーでデバッグモード切替
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === 'd' || e.key === 'D') {
				setForceAllActive(prev => !prev);
				console.log('Debug mode:', !forceAllActive);
			}
		};

		window.addEventListener('keydown', handleKeyDown);

		return () => {
			window.removeEventListener('scroll', handleScroll);
			window.removeEventListener('keydown', handleKeyDown);
		};
	}, [forceAllActive, isFlashActive]);


	// システムステータステキスト
	const getStatusText = () => {
		if (activeIndex === null) return systemStatusText.loading;
		if (activeIndex === 0) return systemStatusText.ready;
		if (activeIndex === 1) return systemStatusText.awakening;
		if (activeIndex === 2) return systemStatusText.complete;
		return systemStatusText.loading;
	};

	// データストリームを生成
	useEffect(() => {
		// 初期データストリームを生成
		const initialData: string[] = [];
		for (let i = 0; i < 50; i++) {
			if (Math.random() > 0.7) {
				initialData.push(generateRandomHex(16));
			} else {
				initialData.push(generateRandomBinary(16));
			}
		}
		setDataStream(initialData);

		// 定期的にデータストリームを更新
		const interval = setInterval(() => {
			setDataStream(prev => {
				const newData = [...prev];
				// 1-3行をランダムに置き換え
				const replaceCount = Math.floor(Math.random() * 3) + 1;
				for (let i = 0; i < replaceCount; i++) {
					const index = Math.floor(Math.random() * newData.length);
					if (Math.random() > 0.7) {
						newData[index] = generateRandomHex(16);
					} else {
						newData[index] = generateRandomBinary(16);
					}
				}
				return newData;
			});

			// ランダムなグリッチ効果
			if (Math.random() > 0.9) {
				setRandomGlitch(true);
				setTimeout(() => setRandomGlitch(false), 200);
			}
		}, 500);

		// システム時間の更新
		const timeInterval = setInterval(() => {
			const now = new Date();
			setSystemTime(`SYS://AWAKENING_SEQUENCE v2.4.7 | ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`);
		}, 1000);

		return () => {
			clearInterval(interval);
			clearInterval(timeInterval);
		};
	}, []);

	// エネルギーレベル（スクロール進行に基づく）
	const energyLevel = Math.max(5, Math.min(100, scrollProgress * 100));

	return (
		<>


			{/* フラッシュエフェクト */}
			<div className={`${styles.flashEffect} ${isFlashActive ? styles.flashActive : ''}`}></div>

			{/* コーナーマーカー */}
			<div className={styles.cyberFrame}>
				<div className={`${styles.cornerMarker} ${styles.topLeft} ${randomGlitch ? styles.jitterEffect : ''}`}></div>
				<div className={`${styles.cornerMarker} ${styles.topRight} ${randomGlitch ? styles.jitterEffect : ''}`}></div>
				<div className={`${styles.cornerMarker} ${styles.bottomLeft} ${randomGlitch ? styles.jitterEffect : ''}`}></div>
				<div className={`${styles.cornerMarker} ${styles.bottomRight} ${randomGlitch ? styles.jitterEffect : ''}`}></div>
			</div>

			<div className={`${styles.thickScanline}`} />
			<div className={`${styles.scanline}`}></div>
			{/* データストリーム */}
			<div className={`${styles.dataStream} hidden sm:block`}>
				<div className={styles.dataContent}>
					{dataStream.map((line, index) => (
						<div key={index} className={randomGlitch && index % 5 === 0 ? styles.jitterEffect : ''}>
							{line}
						</div>
					))}
				</div>
			</div>

			{/* エネルギーメーター */}
			<div className={`${styles.energyMeter} hidden sm:block`}>
				<div
					className={styles.energyLevel}
					style={{ height: `${energyLevel}%` }}
				></div>
			</div>

			{/* システムステータス */}
			<div className={`${styles.systemStatus} hidden sm:block`}>
				<div>{systemTime}</div>
				<div>SECTION: {activeIndex !== null ? activeIndex + 1 : 0}/{cyberMessages.length}</div>
				<div>ENERGY: {Math.floor(energyLevel)}%</div>
				<div>{getStatusText()}</div>
			</div>

		</>
	);
};

export default CyberInterface;-e 
### FILE: ./src/app/components/home/layout/ScanlineEffect.tsx

// src/app/components/ui/ScanlineEffect.tsx
import React from 'react';

export const ScanlineEffect: React.FC = () => {
  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden hidden sm:block">
      <div className="absolute inset-0 z-10 h-full w-full bg-transparent opacity-10">
        {/* スキャンライン効果 */}
        <div className="absolute left-0 top-0 h-[1px] w-full animate-scanline bg-neonGreen opacity-50 shadow-[0_0_5px_#00FF7F] hidden sm:block"></div>
    
      </div>
    </div>
  );
};

export default ScanlineEffect;-e 
### FILE: ./src/app/components/home/layout/PulsatingComponent.tsx

'use client';
import { useState, useEffect } from 'react';

const PulsatingComponent = () => {
	const [pulses, setPulses] = useState<{ id: number; size: number; opacity: number }[]>([]);

	// Create a new pulse every second
	useEffect(() => {
		const interval = setInterval(() => {
			setPulses(prev => [
				...prev,
				{
					id: Date.now(),   // 安全にユニークにするなら timestamp など
					size: 0,
					opacity: 0.8
				}
			]);
		}, 1000);

		return () => clearInterval(interval);
	}, []);

	// Update pulses animation
	useEffect(() => {
		const animationInterval = setInterval(() => {
			setPulses(prev =>
				prev
					.map(pulse => ({
						...pulse,
						size: pulse.size + 3,
						opacity: Math.max(0, pulse.opacity - 0.01),
					}))
					.filter(pulse => pulse.opacity > 0)
			);
		}, 50);

		return () => clearInterval(animationInterval);
	}, []);

	return (
		<div className="w-full h-[80vh] relative overflow-hidden bg-black">
			<div className="absolute inset-0 flex items-center justify-center pointer-events-none">
				{pulses.map(pulse => (
					<div
						key={pulse.id}
						className="absolute rounded-full border border-neonGreen"
						style={{
							width: `${pulse.size}px`,
							height: `${pulse.size}px`,
							opacity: pulse.opacity,
							left: '50%',     // ← 中心
							top: '50%',      // ← 中心
							transform: 'translate(-50%, -50%)',  // ← 真ん中合わせ
						}}
					/>
				))}

				<div className="z-10 border border-neonGreen px-8 py-3 text-white font-mono whitespace-nowrap bg-black bg-opacity-70">
					We Are <span className="text-orange-500">On-Chain</span>
				</div>
			</div>
		</div>
	);
};

export default PulsatingComponent;
-e 
### FILE: ./src/app/components/home/hero-section/GlitchEffects.tsx

// src/app/components/hero-section/GlitchEffects.tsx
'use client';
import { useState, useEffect } from 'react';

export interface GlitchState {
  active: boolean;
  intensity: number;
  type: 'none' | 'horizontal' | 'vertical' | 'rgb' | 'rgb-horizontal' | 'rgb-vertical' | 'rgb-shift';
}

// グリッチシーケンスの定義
const defaultGlitchSequence = [
  // 中程度のRGBシフト
  { delay: 2000, duration: 400, type: 'rgb', intensity: 2 },
  // 間隔
  { delay: 1000, duration: 0, type: 'none', intensity: 0 },
  // 水平グリッチ + RGB
  { delay: 300, duration: 250, type: 'rgb-horizontal', intensity: 3 },
  // 短い間隔
  { delay: 800, duration: 0, type: 'none', intensity: 0 },
  // 垂直グリッチ + RGB
  { delay: 250, duration: 200, type: 'rgb-vertical', intensity: 2 },
  // 中程度の間隔
  { delay: 1500, duration: 0, type: 'none', intensity: 0 },
  // 強いRGBシフト + 水平グリッチ
  { delay: 200, duration: 300, type: 'rgb-horizontal', intensity: 4 },
  // 長い間隔
  { delay: 3000, duration: 0, type: 'none', intensity: 0 },
  // 一連の短いRGBグリッチ
  { delay: 150, duration: 80, type: 'rgb-shift', intensity: 3 },
  { delay: 100, duration: 50, type: 'rgb-horizontal', intensity: 2 },
  { delay: 200, duration: 100, type: 'rgb-vertical', intensity: 3 },
  // 長い休止
  { delay: 4000, duration: 0, type: 'none', intensity: 0 },
];

export function useGlitchEffect(
  sequence = defaultGlitchSequence,
  initialDelay = 3000
) {
  const [glitchState, setGlitchState] = useState<GlitchState>({
    active: false,
    intensity: 0,
    type: 'none',
  });

  useEffect(() => {
    let currentIndex = 0;
    let timeoutId: NodeJS.Timeout;

    const runGlitchSequence = () => {
      const { delay, duration, type, intensity } = sequence[currentIndex];

      // グリッチの実行
      if (duration > 0) {
        setGlitchState({ 
          active: true, 
          type: type as GlitchState['type'], 
          intensity 
        });

        // グリッチの終了
        setTimeout(() => {
          setGlitchState({ active: false, type: 'none', intensity: 0 });
        }, duration);
      }

      // 次のグリッチへ
      currentIndex = (currentIndex + 1) % sequence.length;
      timeoutId = setTimeout(runGlitchSequence, delay);
    };

    // シーケンス開始
    timeoutId = setTimeout(runGlitchSequence, initialDelay);

    return () => clearTimeout(timeoutId);
  }, [sequence, initialDelay]);

  // グリッチスタイル計算関数
  const getGlitchStyle = (baseTransform: string = '') => {
    if (!glitchState.active) return {};

    const { type, intensity } = glitchState;
    let transform = baseTransform;
    let filter = '';

    // 強度に応じたスタイル
    const intensityFactor = intensity * 0.5;

    switch (type) {
      case 'horizontal':
        transform += ` translateX(${Math.random() * intensity * 4 - intensity * 2}px)`;
        filter = `contrast(${1 + intensityFactor * 0.1})`;
        break;
      case 'vertical':
        transform += ` translateY(${Math.random() * intensity * 2 - intensity}px)`;
        filter = `contrast(${1 + intensityFactor * 0.05})`;
        break;
      case 'rgb':
        filter = `hue-rotate(${intensityFactor * 15}deg) contrast(${1 + intensityFactor * 0.15})`;
        break;
      case 'rgb-horizontal':
        transform += ` translateX(${Math.random() * intensity * 4 - intensity * 2}px)`;
        filter = `hue-rotate(${intensityFactor * 20}deg) contrast(${1 + intensityFactor * 0.2})`;
        break;
      case 'rgb-vertical':
        transform += ` translateY(${Math.random() * intensity * 3 - intensity * 1.5}px)`;
        filter = `hue-rotate(${intensityFactor * 20}deg) contrast(${1 + intensityFactor * 0.15})`;
        break;
      case 'rgb-shift':
        // RGBずれ効果のみ (変形なし)
        filter = `hue-rotate(${intensityFactor * 30}deg) saturate(${1 + intensityFactor * 0.5})`;
        break;
      default:
        break;
    }

    return {
      transform,
      filter,
      transition: 'transform 0.05s linear, filter 0.05s linear',
    };
  };

  return { glitchState, getGlitchStyle };
}-e 
### FILE: ./src/app/components/home/hero-section/HeroTitle.tsx

// src/app/components/hero-section/HeroTitle.tsx
import React from 'react';
import GlitchText from '../../ui/GlitchText';
import styles from './HeroSection.module.css';
interface HeroTitleProps {
	style?: React.CSSProperties;
}

export const HeroTitle: React.FC<HeroTitleProps> = ({ style }) => {
	return (
		<div className={styles.titleContainer} style={style}>
			{/* メインタイトル */}
			<div className={styles.titleGroup}>
				<GlitchText
					text="NO BANKS"
					className="text-6xl md:text-7xl lg:text-9xl"
					color="text-neonOrange"
					glitchIntensity="high"
					isMainTitle={true}
				/>
				<GlitchText
					text="PEER-TO-PEER"
					className="text-6xl md:text-7xl lg:text-9xl"
					color="text-neonGreen"
					glitchIntensity="medium"
					isMainTitle={true}
				/>
				<GlitchText
					text="JUST PROTEIN"
					className="text-6xl md:text-7xl lg:text-9xl"
					color="text-white"
					glitchIntensity="high"
					isMainTitle={true}
				/>
			</div>
			<p className="mt-6 text-sm md:text-lg text-white">
				Only non-custodial wallets accepted.<br />
				Built for the chain. Priced for the degens.
			</p>
		</div>
	);
};

export default HeroTitle;-e 
### FILE: ./src/app/components/home/hero-section/HeroBackground.tsx

// src/app/components/hero-section/HeroBackground.tsx

import React from 'react';
import styles from './HeroSection.module.css';
import { GlitchState } from './GlitchEffects';

interface HeroBackgroundProps {
	backgroundTransform: string;
	midLayerTransform: string;
	glitchState: GlitchState;
	getGlitchStyle: (baseTransform: string) => any;
}

export const HeroBackground: React.FC<HeroBackgroundProps> = ({
	backgroundTransform,
	midLayerTransform,
	glitchState,
	getGlitchStyle,
}) => {
	return (
		<>
			{/* 背景画像 - グリッチ効果に対応 */}
			<div
				className={`${styles.backgroundImage} ${glitchState.active ? styles.glitchActive : ''}`}
				style={{
					backgroundImage: `url('${process.env.NEXT_PUBLIC_CLOUDFRONT_URL}/pepe/pepe-cyberpunk.webp')`,
					...(!glitchState.active
						? {
							filter: 'contrast(1.1) brightness(0.9)',
							transform: backgroundTransform,
							transition: 'transform 2s ease-out',
						}
						: getGlitchStyle(backgroundTransform))
				}}
			/>

			{/* ライトとオーバーレイは常時レンダリング */}
			<div
				className={`${styles.darkOverlay} w-full`}
				style={{transition: 'transform 1.5s ease-out',}}
			/>
			<div className='hidden sm:block'>

				{glitchState.active && glitchState.type.includes('rgb') && glitchState.intensity > 2 && (
					<>
						<div
							className={styles.rgbSliceRed}
							style={{
								backgroundImage: `url('${process.env.NEXT_PUBLIC_CLOUDFRONT_URL}/pepe/pepe-cyberpunk.webp')`,
								transform: `translateX(${glitchState.intensity * 1.5}px)`,
							}}
						/>
						<div
							className={styles.rgbSliceBlue}
							style={{
								backgroundImage: `url('${process.env.NEXT_PUBLIC_CLOUDFRONT_URL}/pepe/pepe-cyberpunk.webp')`,
								transform: `translateX(-${glitchState.intensity * 1.5}px)`,
							}}
						/>
					</>
				)}
				<div
					className={styles.centerLight}
					style={{
						transform: midLayerTransform,
						transition: 'transform 1.5s ease-out',
					}}
				/>
			</div>
		</>
	);
};

export default HeroBackground;
-e 
### FILE: ./src/app/components/home/hero-section/HeroSection.tsx

'use client';
import React, { useState, useEffect } from 'react';
import styles from './HeroSection.module.css';
import { useGlitchEffect } from './GlitchEffects';
import HeroBackground from './HeroBackground';
import HeroTitle from './HeroTitle';

export const HeroSection: React.FC = () => {
	const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
	const { glitchState, getGlitchStyle } = useGlitchEffect();

	useEffect(() => {
		const handleMouseMove = (e: MouseEvent) => {
			setMousePosition({
				x: e.clientX / window.innerWidth,
				y: e.clientY / window.innerHeight,
			});
		};
		window.addEventListener('mousemove', handleMouseMove);
		return () => window.removeEventListener('mousemove', handleMouseMove);
	}, []);

	const backgroundTransform = `
    scale(1.05)
    translateX(${(mousePosition.x - 0.5) * 10}px)
    translateY(${(mousePosition.y - 0.5) * 10}px)
  `;
	const midLayerTransform = `
    translateX(${(mousePosition.x - 0.5) * -15}px)
    translateY(${(mousePosition.y - 0.5) * -7.5}px)
  `;
	const foregroundTransform = `
    translateX(${(mousePosition.x - 0.5) * -25}px)
    translateY(${(mousePosition.y - 0.5) * -12.5}px)
  `;

	return (
		<div className="sticky w-full top-0 h-[80vh] md:h-[90vh] overflow-hidden">
			<HeroBackground
				backgroundTransform={backgroundTransform}
				midLayerTransform={midLayerTransform}
				glitchState={glitchState}
				getGlitchStyle={getGlitchStyle}
			/>
			<div
				className={`${styles.contentContainer} mt-10 max-w-screen-xl mx-auto flex justify-center items-center`}
				style={{
					transform: foregroundTransform,
					transition: 'transform 0.5s ease-out',
				}}
			>
				<HeroTitle />
			</div>
		</div>

	);
};

export default HeroSection;
-e 
### FILE: ./src/app/components/home/pepePush/types/index.ts

// types/index.ts
export interface ControlPoint {
  scrollProgress: number; // 0-1の範囲
  position: [number, number, number]; // x, y, z座標
  rotation?: [number, number, number]; // オプショナルな回転
  scale?: [number, number, number]; // オプショナルなスケール
}

export interface ScrollState {
  scrollProgress: number; // 0-1の範囲でのスクロール進行度
  isInSection: boolean; // セッション内にいるかどうか
}

export interface ModelTransform {
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
}

export interface PepePushProps {
  className?: string;
}

export interface StickyCanvasProps {
  children: React.ReactNode;
  className?: string;
}-e 
### FILE: ./src/app/components/home/pepePush/config/controlPoints.ts

// config/controlPoints.ts
import { ControlPoint } from '../types';

// スマホ判定のヘルパー関数
const isMobile = () => {
	if (typeof window === 'undefined') return false;
	return window.innerWidth <= 768;
};

export const controlPoints: ControlPoint[] = [
	{
		scrollProgress: 0,
		position: [0, -1, 0],
		rotation: [Math.PI / 4, -Math.PI / 12, 0],
		scale: [1, 1, 1]
	},
	{
		scrollProgress: 0.25,
		position: [0, 0, 0],
		rotation: [0, 0, 0],
		scale: [1.2, 1.2, 1.2]
	},
	{
		scrollProgress: 0.5,
		position: [2, 1, -1],
		rotation: [0, Math.PI / 3, 0],
		scale: [1, 1, 1]
	},
	{
		scrollProgress: 0.75,
		position: [0, -1, 2],
		rotation: [0, Math.PI, 0],
		scale: [0.8, 0.8, 0.8]
	},
	{
		scrollProgress: 1,
		position: [0, -2, 0],
		rotation: [0, -Math.PI / 2, 0],
		scale: isMobile() ? [0.6, 0.6, 0.6] : [1, 1, 1] // スマホでは小さく
	}
];

// レスポンシブ対応の制御点を取得する関数
export const getResponsiveControlPoints = (): ControlPoint[] => {
	const mobile = isMobile();

	return [
		{
			scrollProgress: 0,
			position: [0, -1, 0],
			rotation: [Math.PI / 4, -Math.PI / 12, 0],
			scale: [1, 1, 1]
		},
		{
			scrollProgress: 0.25,
			position: [-3, -0.5, 0],
			rotation: [0, Math.PI / 8, 0],
			scale: [1.2, 1.2, 1.2]
		},
		{
			scrollProgress: 0.5,
			position: [-3, 3, -1],
			rotation: [0, Math.PI / 3, Math.PI / 3],
			scale: [1.1, 1.1, 1.1]
		},
		{
			scrollProgress: 0.75,
			position: [1.5, 0, 0.8],
			rotation: [0, Math.PI, Math.PI / 10],
			scale: [1.1, 1.1, 1.1]
		},
		{
			scrollProgress: 1,
			position: [0, -2, 0],
			rotation: [0, -Math.PI / 2, 0],
			scale: mobile ? [0.6, 0.6, 0.6] : [1, 1, 1] // スマホでは60%のサイズ
		}
	];
};

// 設定値の調整用ヘルパー
export const CONFIG = {
	// セッションの高さ（vh）
	SECTION_HEIGHT_VH: 400,

	// アニメーション補間の滑らかさ
	LERP_FACTOR: 0.1,

	// デバッグモード（開発時にスクロール位置を表示）
	DEBUG_MODE: false,

	// レスポンシブ設定
	MOBILE_BREAKPOINT: 768,
	MOBILE_SCALE_FACTOR: 0.6 // スマホでの最終スケール
} as const;-e 
### FILE: ./src/app/components/home/pepePush/config/animations.ts

// config/animations.ts

export const ANIMATION_CONFIG = {
	// 基本アニメーション設定
	PRIMARY_ANIMATION: 'PushUp',
	ARMATURE_FADE_IN_DURATION: 0.3,

	// アニメーション速度調整
	ANIMATION_SPEED: {
		PUSH_UP: 1.0,
		IDLE: 0.8,
		TRANSITION: 1.2
	},

	// ループ設定
	LOOP_SETTINGS: {
		PUSH_UP: {
			enabled: true,
			count: Infinity // 無限ループ
		}
	},

	// スクロール位置に応じたアニメーション変更（将来の拡張用）
	SCROLL_BASED_ANIMATIONS: {
		0: { animation: 'PushUp', speed: 0.5 },
		0.25: { animation: 'PushUp', speed: 1.0 },
		0.5: { animation: 'PushUp', speed: 1.5 },
		0.75: { animation: 'PushUp', speed: 1.2 },
		1: { animation: 'PushUp', speed: 0.8 }
	},

	// パフォーマンス設定
	PERFORMANCE: {
		// フレームレート制限（必要に応じて）
		MAX_FPS: 60,

		// LOD設定（距離に応じた詳細度）
		LOD_DISTANCES: [10, 50, 100],

		// アニメーション品質
		ANIMATION_QUALITY: {
			HIGH: { timeScale: 1.0, precision: 'high' },
			MEDIUM: { timeScale: 0.8, precision: 'medium' },
			LOW: { timeScale: 0.5, precision: 'low' }
		}
	}
} as const;

// アニメーション状態の型定義
export type AnimationState = {
	currentAnimation: string;
	speed: number;
	isPlaying: boolean;
	loopCount: number;
};

// アニメーション制御のヘルパー関数
export const getAnimationForScrollProgress = (progress: number) => {
	const scrollAnimations = ANIMATION_CONFIG.SCROLL_BASED_ANIMATIONS;
	const keys = Object.keys(scrollAnimations).map(Number).sort((a, b) => a - b);

	let targetKey = keys[0];
	for (const key of keys) {
		if (progress >= key) {
			targetKey = key;
		} else {
			break;
		}
	}

	return scrollAnimations[targetKey as keyof typeof scrollAnimations];
};-e 
### FILE: ./src/app/components/home/pepePush/StickyCanvas.tsx

// StickyCanvas.tsx
'use client';

import React from 'react';
import { Canvas } from '@react-three/fiber';
import { StickyCanvasProps } from './types';

export default function StickyCanvas({ children, className = '' }: StickyCanvasProps) {
	return (
		<div className={`sticky top-0 w-full h-screen z-10 ${className}`}>
			<Canvas
				className="w-full h-full"
				gl={{ antialias: false }}
				shadows={false}
				frameloop="always"
				camera={{
					position: [0, 0, 5],
					fov: 75,
					near: 0.1,
					far: 1000
				}}
				dpr={1}
			>
				{/* @ts-expect-error React Three Fiber JSX elements */}
				<directionalLight
					position={[5, 10, 7]}
					intensity={1}
					castShadow={false}
				/>

				{/* 子コンポーネント（3Dモデルなど）を描画 */}
				{children}
			</Canvas>
		</div>
	);
}-e 
### FILE: ./src/app/components/home/pepePush/messages/MessageTest.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { ScrollMessages } from '.';

/**
 * メッセージ表示機能のテスト用コンポーネント
 * スライダーでスクロール進行度を手動調整可能
 */
const MessageTest: React.FC = () => {
	const [scrollProgress, setScrollProgress] = useState(0);
	const [autoScroll, setAutoScroll] = useState(false);

	// 自動スクロールのシミュレーション
	useEffect(() => {
		if (!autoScroll) return;

		const interval = setInterval(() => {
			setScrollProgress(prev => {
				// 0から1までループ
				const next = prev + 0.005;
				return next > 1 ? 0 : next;
			});
		}, 50);

		return () => clearInterval(interval);
	}, [autoScroll]);

	return (
		<div className="min-h-screen bg-black text-white p-4">
			<div className="fixed top-4 left-4 z-50 bg-black/70 p-4 rounded-lg w-80 backdrop-blur-sm">
				<h2 className="text-xl font-bold mb-4">メッセージテスト</h2>

				<div className="mb-4">
					<label className="block mb-2">スクロール進行度: {scrollProgress.toFixed(3)}</label>
					<input
						type="range"
						min="0"
						max="1"
						step="0.01"
						value={scrollProgress}
						onChange={e => setScrollProgress(parseFloat(e.target.value))}
						className="w-full"
					/>
				</div>

				<div className="flex items-center mb-4">
					<label className="flex items-center cursor-pointer">
						<input
							type="checkbox"
							checked={autoScroll}
							onChange={() => setAutoScroll(!autoScroll)}
							className="mr-2"
						/>
						<span>自動スクロール</span>
					</label>
				</div>

				<div className="grid grid-cols-5 gap-2 mt-4">
					{[0, 0.2, 0.4, 0.6, 0.8].map(value => (
						<button
							key={value}
							onClick={() => setScrollProgress(value)}
							className="px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm"
						>
							{value}
						</button>
					))}
				</div>
			</div>

			{/* メッセージ表示 */}
			<ScrollMessages scrollProgress={scrollProgress} />

			{/* サイバーパンク風グリッドバックグラウンド */}
			<div
				className="fixed inset-0 pointer-events-none z-0 opacity-30"
				style={{
					backgroundImage: `
            linear-gradient(rgba(0, 255, 102, 0.05) 1px, transparent 1px), 
            linear-gradient(90deg, rgba(0, 255, 102, 0.05) 1px, transparent 1px)
          `,
					backgroundSize: '20px 20px',
					backgroundPosition: 'center center',
				}}
			/>
		</div>
	);
};

export default MessageTest;-e 
### FILE: ./src/app/components/home/pepePush/messages/constants.ts

// src/app/components/pepePush/messages/constants.ts
import { MessageConfig, ScrollMessageConfig, GlitchEffectType } from './types';

// スマホ判定のヘルパー関数
export const isMobile = () => {
  if (typeof window === 'undefined') return false;
  return window.innerWidth <= 768;
};

// スクロールメッセージ設定
export const SCROLL_CONFIG: ScrollMessageConfig = {
  SECTION_HEIGHT_VH: 600,    // pepePushセクションと合わせる
  SCROLL_SENSITIVITY: 1.0,   // スクロール感度
  DEBUG_MODE: false,         // デバッグモード
  FADE_DURATION: 500,        // フェードイン/アウト時間 (ms)
  VISIBILITY_THRESHOLD: 0.1  // メッセージ表示閾値
};

// エフェクト適用のヘルパー関数
export const getEffectClass = (effect?: GlitchEffectType): string => {
  if (!effect || effect === 'none') return '';
  
  // 命名規則: effect{エフェクト名} (最初の文字を大文字に)
  return `effect${effect.charAt(0).toUpperCase() + effect.slice(1)}`;
};

// メッセージ定義
export const cyberMessages: MessageConfig[] = [
  {
    id: 'message-1',
    text: 'Pepe knows \nwhat a real man is.',
    scrollProgress: 0.2,
    style: 'horizontal',
    size: isMobile() ? '3rem' : '8rem',
    align: 'left',
    glitchEffect: 'none',
    keywords: ['Pepe','real','man'],
  },
  {
    id: 'message-2',
    text: 'Pepe pursues \nthe goals others \ndon’t dare to approach.',
    scrollProgress: 0.35,
    style: 'horizontal',
    size: isMobile() ? '2rem' : '7rem',
    align: 'right',
    glitchEffect: 'none',
    keywords: ['Pepe','others','dare'],
  },
  {
    id: 'message-3',
    text: 'Pepe always outworks himself. \nEvery. \nSingle. \nDay.',
    scrollProgress: 0.55,
    style: 'horizontal',
    size: isMobile() ? '2rem' : '7rem',
    align: 'left',
    glitchEffect: 'none',
    keywords: ['Pepe','outworks'],
  },
  {
    id: 'message-4',
    text: 'Pepe never stops; \nstopping is death.',
    scrollProgress: 0.7,
    style: 'horizontal',
    size: isMobile() ? '2rem' : '5rem',
    align: 'right',
    glitchEffect: 'none',
    keywords: ['Pepe'],
  },
  {
    id: 'message-5',
    text: 'Pepe bets bold, never loses. \nSmart. \nDiligent. \nUnstoppable.',
    scrollProgress: 0.8,
    style: 'horizontal',
    size: isMobile() ? '3rem' : '7rem',
    align: 'left',
    glitchEffect: 'none',
    keywords: ['Pepe', 'ascends'],
  },
];

// メッセージ表示範囲の計算
export const calculateMessageVisibility = (
  messageScrollProgress: number,
  currentScrollProgress: number
): { isVisible: boolean; opacity: number; isActive: boolean } => {
  // メッセージの表示範囲を広げる
  const showStart = messageScrollProgress - 0.2; // 表示開始位置を早める
  const showPeak = messageScrollProgress;       // 最大表示
  const showEnd = messageScrollProgress + 0.2;  // 表示終了位置を延長

  // デフォルト値
  let isVisible = false;
  let opacity = 0;
  let isActive = false;

  // 表示範囲内の場合
  if (currentScrollProgress >= showStart && currentScrollProgress <= showEnd) {
    isVisible = true;
    
    // フェードイン（より滑らかに）
    if (currentScrollProgress <= showPeak) {
      opacity = (currentScrollProgress - showStart) / (showPeak - showStart);
      // イージング関数で滑らかに
      opacity = Math.sin(opacity * Math.PI / 2);
    } 
    // フェードアウト
    else {
      opacity = 1 - (currentScrollProgress - showPeak) / (showEnd - showPeak);
      // イージング関数で滑らかに
      opacity = Math.sin(opacity * Math.PI / 2);
    }
    
    // 0-1の範囲に制限
    opacity = Math.max(0, Math.min(1, opacity));
    
    // ピーク付近でアクティブ状態の範囲を広げる
    isActive = Math.abs(currentScrollProgress - showPeak) < 0.08;
  }

  return { isVisible, opacity, isActive };
};-e 
### FILE: ./src/app/components/home/pepePush/messages/MessageText.tsx

'use client';

import React, { useMemo } from 'react';
import { MessageConfig, GlitchEffectType } from './types';
import styles from './effects.module.css';
import { getEffectClass } from './constants';

interface MessageTextProps {
	message: MessageConfig;
	isActive: boolean;
	opacity: number;
}

const MessageText: React.FC<MessageTextProps> = ({
	message,
	isActive,
	opacity
}) => {
	// スタイルの動的生成
	const messageStyle = useMemo(() => {
		// 位置とサイズの基本スタイル
		const style: React.CSSProperties = {
			opacity,
			fontSize: message.size,
			transition: 'opacity 500ms ease-in-out, transform 500ms ease-in-out',
			transform: `translateY(${(1 - opacity) * 20}px)`,
		};

		// テキスト配置
		switch (message.align) {
			case 'right':
				style.right = '5vw';
				style.textAlign = 'right';
				break;
			case 'center':
				style.left = '50%';
				style.transform = `translateX(-50%) translateY(${(1 - opacity) * 20}px)`;
				style.textAlign = 'center';
				break;
			case 'left':
			default:
				style.left = '5vw';
				style.textAlign = 'left';
		}

		// スクロール位置に基づく垂直位置の設定
		switch (message.id) {
			case 'message-1':
				style.top = '8vh';
				break;
			case 'message-2':
				style.top = '60vh';
				break;
			case 'message-3':
				style.top = '40vh';
				break;
			case 'message-4':
				style.top = '80vh';
				break;
			case 'message-5':
				style.top = '10vh';
				break;
			default:
				style.top = '50vh';
		}

		return style;
	}, [message, opacity]);

	// キーワードをハイライト処理するヘルパー関数
	const renderText = () => {
		// 改行を処理
		const parts = message.text.split(/(\n)/g);

		return (
			<>
				{parts.map((part, index) => {
					if (part === '\n') return <br key={`br-${index}`} />;

					// 単語を分割して処理
					const words = part.split(' ');

					return (
						<span key={`part-${index}`}>
							{words.map((word, wordIndex) => {
								// キーワードかどうか確認
								const isKeyword = message.keywords?.some(
									keyword => word.toLowerCase().includes(keyword.toLowerCase())
								);

								// エフェクトクラスを取得
								const effectClass = getKeywordEffectClass(
									message.glitchEffect,
									isKeyword
								);

								return (
									<React.Fragment key={`word-${wordIndex}`}>
										<span
											className={effectClass}
											data-text={word}
											style={{
												display: 'inline-block',
												whiteSpace: 'nowrap'
											}}
										>
											{word}
										</span>
										{wordIndex < words.length - 1 ? ' ' : ''}
									</React.Fragment>
								);
							})}
						</span>
					);
				})}
			</>
		);
	};

	// キーワードに対する特別なエフェクトクラスを取得
	const getKeywordEffectClass = (effect?: GlitchEffectType, isKeyword = false) => {
		if (!effect || effect === 'none') {
			return isKeyword ? styles.keywordEffect : '';
		}

		const effectCapitalized = effect.charAt(0).toUpperCase() + effect.slice(1);

		// キーワードの場合は強調エフェクト
		if (isKeyword) {
			// キーワード特化クラス (keywordRgb, keywordRainbow など)
			const keywordClass = `keyword${effectCapitalized}`;
			return styles[keywordClass] || styles.keywordEffect;
		}

		// 通常のエフェクト (effectRgb, effectRainbow など)
		const effectClass = `effect${effectCapitalized}`;
		return styles[effectClass] || '';
	};

	return (
		<div
			className={`${styles.messageContainer} ${isActive ? 'z-50' : 'z-40'}`}
			style={{
				...messageStyle,
				fontFamily: 'var(--font-roboto-condensed), Arial, sans-serif',
				letterSpacing: '0px',
				lineHeight: 1.1,
				textShadow: '0 1px 2px rgba(0, 0, 0, 0.5)',
			}}
		>
			{renderText()}
		</div>
	);
};

export default MessageText;-e 
### FILE: ./src/app/components/home/pepePush/messages/ScrollMessages.tsx

'use client';

import React, { useEffect, useState } from 'react';
import MessageText from './MessageText';
import { cyberMessages, calculateMessageVisibility, SCROLL_CONFIG } from './constants';
import { ActiveMessageState, DebugInfo } from './types';

interface ScrollMessagesProps {
	scrollProgress: number;
	className?: string;
}

const ScrollMessages: React.FC<ScrollMessagesProps> = ({
	scrollProgress,
	className = '',
}) => {
	// アクティブメッセージの状態管理
	const [activeMessages, setActiveMessages] = useState<ActiveMessageState[]>([]);
	// スクロール位置に基づいてメッセージ表示を更新
	useEffect(() => {
		// アクティブなメッセージを計算
		const newActiveMessages = cyberMessages.map(message => {
			const { isVisible, opacity, isActive } = calculateMessageVisibility(
				message.scrollProgress,
				scrollProgress
			);

			return {
				message,
				opacity: isVisible ? opacity : 0,
				isActive
			};
		}).filter(item => item.opacity > 0);

		setActiveMessages(newActiveMessages);

	}, [scrollProgress]);

	return (
		<>
			{activeMessages.map(({ message, opacity, isActive }) => (
				<MessageText
					key={message.id}
					message={message}
					isActive={isActive}
					opacity={opacity}
				/>
			))}
		</>
	);
};

export default ScrollMessages;-e 
### FILE: ./src/app/components/home/pepePush/messages/types.ts

// src/app/components/pepePush/messages/types.ts

// グリッチエフェクトタイプの定義
export type GlitchEffectType = 
  | 'rgb'      // RGB分離効果
  | 'slice'    // スライスグリッチ
  | 'wave'     // 波形歪み
  | 'pulse'    // パルス効果
  | 'jitter'   // 震え効果
  | 'rainbow'  // 虹色エフェクト
  | 'neon'     // ネオン発光
  | 'none';    // エフェクトなし

// テキスト配置タイプ
export type TextAlignment = 'left' | 'center' | 'right';

// メッセージ設定インターフェース
export interface MessageConfig {
  id: string;
  text: string;
  scrollProgress: number;    // 0-1の範囲のスクロール位置
  style: 'horizontal';       // 現在は横書きのみサポート
  size: string;              // フォントサイズ (例: '2rem')
  align: TextAlignment;      // テキスト配置
  glitchEffect?: GlitchEffectType;  // 適用するグリッチエフェクト
  keywords?: string[];       // 強調するキーワード
  delay?: number;            // 表示遅延 (ms)
}

// スクロールメッセージの設定
export interface ScrollMessageConfig {
  SECTION_HEIGHT_VH: number;  // セクションの高さ (vh単位)
  SCROLL_SENSITIVITY: number; // スクロール感度
  DEBUG_MODE: boolean;        // デバッグモード
  FADE_DURATION: number;      // フェードイン/アウト時間 (ms)
  VISIBILITY_THRESHOLD: number; // メッセージ表示閾値
}

// アクティブメッセージの状態
export interface ActiveMessageState {
  message: MessageConfig;
  opacity: number;
  isActive: boolean;
}

// デバッグ情報
export interface DebugInfo {
  scrollProgress: number;
  activeMessageCount: number;
  viewportHeight: number;
  scrollY: number;
}-e 
### FILE: ./src/app/components/home/pepePush/messages/index.ts

// src/app/components/pepePush/messages/index.ts

// メインコンポーネントをエクスポート
export { default as ScrollMessages } from './ScrollMessages';

// 型定義をエクスポート
export type { 
  GlitchEffectType,
  TextAlignment,
  MessageConfig,
  ScrollMessageConfig,
  ActiveMessageState,
  DebugInfo
} from './types';

// 定数と設定をエクスポート
export {
  cyberMessages,
  calculateMessageVisibility,
  SCROLL_CONFIG,
  getEffectClass,
  isMobile
} from './constants';-e 
### FILE: ./src/app/components/home/pepePush/hooks/useScrollProgress.ts

// hooks/useScrollProgress.ts
'use client';

import React,{ useState, useEffect, useRef, useCallback } from 'react';
import { ScrollState } from '../types';
import { CONFIG } from '../config/controlPoints';

export function useScrollProgress() {
  const [scrollState, setScrollState] = useState<ScrollState>({
    scrollProgress: 0,
    isInSection: false
  });
  
  const sectionRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<number>(null);

  const updateScrollProgress = useCallback(() => {
    if (!sectionRef.current) return;

    const rect = sectionRef.current.getBoundingClientRect();
    const windowHeight = window.innerHeight;
    const sectionHeight = rect.height;
    
    // セクションが画面に入っているかチェック
    const isInView = rect.top < windowHeight && rect.bottom > 0;
    
    if (!isInView) {
      setScrollState(prev => ({ ...prev, isInSection: false }));
      return;
    }

    // スクロール進行度を計算（0-1の範囲）
    const scrollTop = -rect.top;
    const maxScroll = sectionHeight - windowHeight;
    const progress = Math.max(0, Math.min(1, scrollTop / maxScroll));

    setScrollState({
      scrollProgress: progress,
      isInSection: true
    });

    if (CONFIG.DEBUG_MODE) {
      console.log('Scroll Progress:', progress.toFixed(3));
    }
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
      
      frameRef.current = requestAnimationFrame(updateScrollProgress);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // 初期化

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [updateScrollProgress]);

  return { scrollState, sectionRef };
}-e 
### FILE: ./src/app/components/home/pepePush/hooks/useModelPosition.ts

// hooks/useModelPosition.ts
'use client';

import { useMemo } from 'react';
import { ModelTransform } from '../types';
import { getResponsiveControlPoints } from '../config/controlPoints';

export function useModelPosition(scrollProgress: number): ModelTransform {
	return useMemo(() => {
		// レスポンシブ対応の制御点を取得
		const controlPoints = getResponsiveControlPoints();

		// スクロール進行度が0-1の範囲外の場合の処理
		if (scrollProgress <= 0) {
			const firstPoint = controlPoints[0];
			return {
				position: firstPoint.position,
				rotation: firstPoint.rotation || [0, 0, 0],
				scale: firstPoint.scale || [1, 1, 1]
			};
		}

		if (scrollProgress >= 1) {
			const lastPoint = controlPoints[controlPoints.length - 1];
			return {
				position: lastPoint.position,
				rotation: lastPoint.rotation || [0, 0, 0],
				scale: lastPoint.scale || [1, 1, 1]
			};
		}

		// 現在のスクロール位置に対応する制御点のペアを見つける
		let fromIndex = 0;
		let toIndex = 1;

		for (let i = 0; i < controlPoints.length - 1; i++) {
			if (scrollProgress >= controlPoints[i].scrollProgress &&
				scrollProgress <= controlPoints[i + 1].scrollProgress) {
				fromIndex = i;
				toIndex = i + 1;
				break;
			}
		}

		const fromPoint = controlPoints[fromIndex];
		const toPoint = controlPoints[toIndex];

		// 2つの制御点間での進行度を計算
		const segmentProgress = (scrollProgress - fromPoint.scrollProgress) /
			(toPoint.scrollProgress - fromPoint.scrollProgress);

		// 線形補間
		const lerp = (start: number, end: number, factor: number) =>
			start + (end - start) * factor;

		const lerpArray = (start: number[], end: number[], factor: number): [number, number, number] => [
			lerp(start[0], end[0], factor),
			lerp(start[1], end[1], factor),
			lerp(start[2], end[2], factor)
		];

		return {
			position: lerpArray(
				fromPoint.position,
				toPoint.position,
				segmentProgress
			),
			rotation: lerpArray(
				fromPoint.rotation || [0, 0, 0],
				toPoint.rotation || [0, 0, 0],
				segmentProgress
			),
			scale: lerpArray(
				fromPoint.scale || [1, 1, 1],
				toPoint.scale || [1, 1, 1],
				segmentProgress
			)
		};
	}, [scrollProgress]);
}-e 
### FILE: ./src/app/components/home/pepePush/hooks/useScrollMessages.ts

'use client';

import { useState, useEffect } from 'react';
import { ActiveMessageState, DebugInfo } from '../messages/types';
import { cyberMessages, calculateMessageVisibility, SCROLL_CONFIG } from '../messages/constants';

/**
 * スクロールに応じたメッセージ表示状態を管理するカスタムフック
 * useScrollProgressから提供されるスクロール進行度を使用
 */
export function useScrollMessages(scrollProgress: number) {
  // アクティブメッセージの状態
  const [activeMessages, setActiveMessages] = useState<ActiveMessageState[]>([]);
  
  // ランダムグリッチエフェクト
  const [randomGlitchTriggered, setRandomGlitchTriggered] = useState(false);
  
  // デバッグ情報
  const [debugInfo, setDebugInfo] = useState<DebugInfo>({
    scrollProgress: 0,
    activeMessageCount: 0,
    viewportHeight: 0,
    scrollY: 0
  });

  // ランダムグリッチエフェクト処理
  useEffect(() => {
    const triggerRandomGlitch = () => {
      // 10%の確率でグリッチをトリガー
      if (Math.random() < 0.1) {
        setRandomGlitchTriggered(true);
        // 100-300msでグリッチ解除
        setTimeout(() => {
          setRandomGlitchTriggered(false);
        }, 100 + Math.random() * 200);
      }
    };

    // 200ms毎にグリッチチェック
    const glitchInterval = setInterval(triggerRandomGlitch, 200);
    
    return () => {
      clearInterval(glitchInterval);
    };
  }, []);

  // スクロール位置に基づいてメッセージ表示を更新
  useEffect(() => {
    // アクティブなメッセージを計算
    const newActiveMessages = cyberMessages.map(message => {
      const { isVisible, opacity, isActive } = calculateMessageVisibility(
        message.scrollProgress,
        scrollProgress
      );

      return {
        message,
        opacity: isVisible ? opacity : 0,
        isActive
      };
    }).filter(item => item.opacity > 0);

    setActiveMessages(newActiveMessages);

    // デバッグ情報を更新
    if (SCROLL_CONFIG.DEBUG_MODE) {
      setDebugInfo({
        scrollProgress,
        activeMessageCount: newActiveMessages.length,
        viewportHeight: window.innerHeight,
        scrollY: window.scrollY
      });
    }
  }, [scrollProgress]);

  return {
    activeMessages,
    randomGlitchTriggered,
    debugInfo
  };
}-e 
### FILE: ./src/app/components/home/pepePush/PepeModel3D.tsx

// PepeModel3D.tsx
'use client';

import React, { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF, useAnimations } from '@react-three/drei';
import * as THREE from 'three';
import { ModelTransform } from './types';
import { CONFIG } from './config/controlPoints';

interface PepeModel3DProps {
	transform: ModelTransform;
	url?: string;
}

export default function PepeModel3D({
	transform,
	url = `${process.env.NEXT_PUBLIC_CLOUDFRONT_URL}/pepe/push-up-pepe.glb`
}: PepeModel3DProps) {
	const { scene, animations } = useGLTF(url);
	const { actions, mixer } = useAnimations(animations, scene);
	const groupRef = useRef<THREE.Group>(null);

	// 現在の変換値を保持（スムーズな補間のため）
	const currentTransform = useRef<ModelTransform>({
		position: [0, 0, 0],
		rotation: [0, 0, 0],
		scale: [1, 1, 1]
	});

	// マテリアルとアニメーション初期化
	useEffect(() => {
		// 色管理を有効化
		THREE.ColorManagement.enabled = true;

		// 重ねられた2つのテキストオブジェクトの発光マテリアル設定
		scene.traverse((child) => {
			if (child instanceof THREE.Mesh && child.material) {
				const materials = Array.isArray(child.material) ? child.material : [child.material];

				materials.forEach((material) => {
					if (material instanceof THREE.MeshStandardMaterial) {
						// Text.001 (緑色発光)
						if (child.name === 'Text.001') {
							material.emissive = new THREE.Color(0x00ff00); // 緑色
							material.emissiveIntensity = 3.0;
							material.toneMapped = false; // 重要：色変換を防止
							// 少し前に配置
							child.position.z += 0.01;
							console.log('Applied green emissive to Text.001');
						}

						// Text.004 (オレンジ色発光)
						else if (child.name === 'Text.004') {
							material.emissive = new THREE.Color(0xff4500); // オレンジ色
							material.emissiveIntensity = 3.0;
							material.toneMapped = false; // 重要：色変換を防止
							// 少し後ろに配置
							child.position.z -= 0.01;
							console.log('Applied orange emissive to Text.004');
						}

						// その他のオブジェクトは既存のマテリアル設定を保持
						else if (material.emissive && !material.emissive.equals(new THREE.Color(0x000000))) {
							material.toneMapped = false; // 他の発光オブジェクトも色変換を防止
							if (material.emissiveIntensity === undefined || material.emissiveIntensity === 0) {
								material.emissiveIntensity = 1;
							}
						}
					}
				});
			}
		});

		// 既存のアニメーションを停止
		Object.values(actions).forEach((action) => action?.stop());

		// PushUpアニメーションを再生
		if (actions['PushUp']) {
			actions['PushUp'].reset().play();
		}

		// Armatureアニメーションがあれば再生
		const bodyKey = Object.keys(actions).find((key) =>
			key.includes('Armature')
		);
		if (bodyKey && actions[bodyKey]) {
			actions[bodyKey].reset().fadeIn(0.3).play();
		}
	}, [actions, scene]);

	// フレームごとの更新
	useFrame((_, delta) => {
		// アニメーションミキサーを更新
		mixer.update(delta);

		// スムーズな位置変更（線形補間）
		if (groupRef.current) {
			const group = groupRef.current;
			const lerpFactor = CONFIG.LERP_FACTOR;

			// 位置の補間
			const targetPos = new THREE.Vector3(...transform.position);
			group.position.lerp(targetPos, lerpFactor);

			// 回転の補間
			const targetRot = new THREE.Euler(...transform.rotation);
			group.rotation.x += (targetRot.x - group.rotation.x) * lerpFactor;
			group.rotation.y += (targetRot.y - group.rotation.y) * lerpFactor;
			group.rotation.z += (targetRot.z - group.rotation.z) * lerpFactor;

			// スケールの補間
			const targetScale = new THREE.Vector3(...transform.scale);
			group.scale.lerp(targetScale, lerpFactor);

			// デバッグ情報
			if (CONFIG.DEBUG_MODE) {
				currentTransform.current = {
					position: [group.position.x, group.position.y, group.position.z],
					rotation: [group.rotation.x, group.rotation.y, group.rotation.z],
					scale: [group.scale.x, group.scale.y, group.scale.z]
				};
			}
		}
	});

	// glTFファイルのマテリアルをそのまま適用
	return (
		// @ts-expect-error React Three Fiber JSX elements
		<group ref={groupRef}>
			{/* @ts-expect-error React Three Fiber JSX elements */}
			<primitive object={scene} />
			{/* @ts-expect-error React Three Fiber JSX elements */}
		</group>
	);
}

// モデルのプリロード
useGLTF.preload(`${process.env.NEXT_PUBLIC_CLOUDFRONT_URL}/pepe/push-up-pepe.glb`);-e 
### FILE: ./src/app/components/home/pepePush/PepePush.tsx

// ScrollController.tsx (Modified)
'use client';
import React, { Suspense } from 'react';
import StickyCanvas from './StickyCanvas';
import PepeModel3D from './PepeModel3D';
import { useScrollProgress } from './hooks/useScrollProgress';
import { useModelPosition } from './hooks/useModelPosition';
import { ScrollMessages } from './messages';

interface ScrollControllerProps {
	className?: string;
	showMessages?: boolean; // メッセージ表示の切り替えオプション
}

export default function PepePush({}: ScrollControllerProps) {
	const { scrollState, sectionRef } = useScrollProgress();
	const modelTransform = useModelPosition(scrollState.scrollProgress);
	return (
		<div ref={sectionRef} className={`relative w-full h-[400vh] bg-black`}>
			<StickyCanvas>
				<Suspense fallback={null}>
					<PepeModel3D transform={modelTransform} />
				</Suspense>
			</StickyCanvas>
			<ScrollMessages scrollProgress={scrollState.scrollProgress}/>
			{scrollState.isInSection && (
				<div className="fixed top-5 md:top-20 left-1/2 transform -translate-x-1/2 z-40">
					<div className="w-64 h-2 bg-white/20 rounded-full overflow-hidden">
						<div
							className="h-full bg-white/80 rounded-full transition-all duration-100"
							style={{ width: `${scrollState.scrollProgress * 100}%` }}
						/>
					</div>
					<div className="text-center text-white/60 text-xs mt-2">
						Training Progress
					</div>
				</div>
			)}
		</div>
	);
}-e 
### FILE: ./src/app/components/home/glowing-3d-text/PepeFlavorModel.tsx

'use client';
import { useRef, useEffect, useState } from 'react';
import { useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { MotionValue } from 'framer-motion';
import * as THREE from 'three';

interface PepeFlavorModelProps {
	scrollProgress: MotionValue<number>;
	preserveOriginalMaterials?: boolean; // Blenderのマテリアルをそのまま使用するかどうか
}

const PepeFlavorModel: React.FC<PepeFlavorModelProps> = ({
	scrollProgress,
	preserveOriginalMaterials = true // デフォルトでBlenderのマテリアルを保持
}) => {
	// GLBモデルをロード
	const { scene, nodes, materials } = useGLTF(`${process.env.NEXT_PUBLIC_CLOUDFRONT_URL}/pepe/pepe_flavor.glb`);
	const modelRef = useRef<THREE.Group>(null);

	// 画面サイズの状態管理
	const [isMobile, setIsMobile] = useState(false);

	// 画面サイズの監視
	useEffect(() => {
		const checkMobile = () => {
			setIsMobile(window.innerWidth <= 768); // 768px以下をモバイルと判定
		};

		// 初期チェック
		checkMobile();

		// リサイズイベントリスナーを追加
		window.addEventListener('resize', checkMobile);

		// クリーンアップ
		return () => window.removeEventListener('resize', checkMobile);
	}, []);

	// モデルの初期設定
	useEffect(() => {
		if (!scene) return;

		console.log("Loading Pepe Flavor model with materials:", materials);

		// 色管理を有効化 - これは常に有効にするとよい
		THREE.ColorManagement.enabled = true;

		// Blenderから読み込んだマテリアルを処理
		scene.traverse((object) => {
			if (object instanceof THREE.Mesh && object.material) {
				console.log(`Found mesh: ${object.name} with material:`, object.material);

				if (preserveOriginalMaterials) {
					// オリジナルのマテリアルを保持しつつ、設定を最適化
					if (object.material instanceof THREE.Material) {

						// トーンマッピングを無効化して色変換を防止
						object.material.toneMapped = false;

						// メタリック・反射設定を微調整（必要に応じて）
						if ('metalness' in object.material) object.material.metalness = 0.8;
						if ('roughness' in object.material) object.material.roughness = 0.2;

						console.log(`Enhanced original material for ${object.name}`);
					}
				} else {
					// オリジナルの色を保持
					const originalColor = object.material.color ? object.material.color.clone() : new THREE.Color("#00ff9f");

					// マテリアルをカスタムシェーダーマテリアルに置き換え
					const material = new THREE.MeshPhysicalMaterial({
						color: originalColor, // オリジナルの色を使用
						emissive: originalColor.clone(),
						emissiveIntensity: 1.2,
						metalness: 0.7,
						roughness: 0.2,
						clearcoat: 0.5,
						clearcoatRoughness: 0.2,
						transmission: 0.2,
						thickness: 0.5,
						toneMapped: false,
					});

					// オリジナルマテリアルから必要なプロパティをコピー
					if (object.material.map) material.map = object.material.map;
					if (object.material.normalMap) material.normalMap = object.material.normalMap;

					// マテリアルを置き換え
					object.material = material;
				}
			}
		});
	}, [scene, preserveOriginalMaterials]);

	const INITIAL_Y = Math.PI / 4;

	// スクロール位置に応じたアニメーション
	useFrame((state, delta) => {
		if (!modelRef.current) return;

		// 現在のスクロール位置を取得
		const progress = scrollProgress.get();

		modelRef.current.rotation.y = THREE.MathUtils.lerp(
			modelRef.current.rotation.y,
			Math.sin(state.clock.elapsedTime * 0.1) * 0.1 - progress * Math.PI * 0.1,
			0.05
		);

		// わずかな浮遊アニメーション
		modelRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.05;

		// スクロールに応じたZ位置の調整
		modelRef.current.position.z = THREE.MathUtils.lerp(
			modelRef.current.position.z,
			-2 + progress * 5, // 奥から手前に移動
			0.05
		);
	});

	return (
		// @ts-expect-error React Three Fiber JSX elements
		<primitive
			ref={modelRef}
			object={scene}
			scale={0.9}
			position={[0, 0, 0]}
			rotation={[0, 0, 0]}
		/>
	);
};

// モデルの事前ロード
useGLTF.preload(`${process.env.NEXT_PUBLIC_CLOUDFRONT_URL}/pepe/pepe_flavor.glb`);

export default PepeFlavorModel;-e 
### FILE: ./src/app/components/home/glowing-3d-text/GlowingTextScene.tsx

import { Canvas } from '@react-three/fiber';
import { Suspense } from 'react';
import { MotionValue } from 'framer-motion';
import { PerspectiveCamera } from '@react-three/drei';
import PepeFlavorModel from './PepeFlavorModel';

interface GlowingTextSceneProps {
	scrollProgress: MotionValue<number>;
}

const GlowingTextScene: React.FC<GlowingTextSceneProps> = ({
	scrollProgress
}) => {
	return (
		<Canvas
			className="w-full h-full"
			gl={{ antialias: false }}
			dpr={0.4}
			shadows={false}
			frameloop="always"
		>
			<PerspectiveCamera makeDefault position={[0, 0, 5]} fov={20} />
			<Suspense fallback={null}>
				<PepeFlavorModel scrollProgress={scrollProgress} />
			</Suspense>
		</Canvas>
	);
};

export default GlowingTextScene;-e 
### FILE: ./src/app/components/home/glowing-3d-text/HeroModel.tsx

// src/app/components/hero-section/HeroModel.tsx
import React from 'react';
import ProteinModel from './ProteinModel';

interface HeroModelProps {
	style?: React.CSSProperties;
	scale?: number;
}

export const HeroModel: React.FC<HeroModelProps> = ({
	style,
	scale = 1.2
}) => {
	return (
		<ProteinModel
			autoRotate={true}
			scale={scale}
		/>
	);
};

export default HeroModel;-e 
### FILE: ./src/app/components/home/glowing-3d-text/ProteinModel.tsx

// src/app/components/3d/ProteinModel.tsx
'use client';
import React, { useRef, useState, useEffect } from 'react';
import { useGLTF, Environment, OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { useFrame, Canvas } from '@react-three/fiber';
import * as THREE from 'three';

// エラーバウンダリーコンポーネント
interface ErrorBoundaryProps {
	children: React.ReactNode;
	fallback: React.ReactNode;
}
interface ErrorBoundaryState {
	hasError: boolean;
}
class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
	constructor(props: ErrorBoundaryProps) {
		super(props);
		this.state = { hasError: false };
	}
	static getDerivedStateFromError(error: any) {
		return { hasError: true };
	}
	render() {
		if (this.state.hasError) {
			return this.props.fallback;
		}
		return this.props.children;
	}
}

// プロテインモデルコンテナ
interface ProteinContainerProps {
	autoRotate?: boolean;
	scale?: number;
	rotationSpeed?: number;
}
const ProteinContainer: React.FC<ProteinContainerProps> = ({ autoRotate = true, scale = 1, rotationSpeed = 0.5 }) => {
	const groupRef = useRef<THREE.Group>(null);
	const { scene } = useGLTF(`${process.env.NEXT_PUBLIC_CLOUDFRONT_URL}/pepe/protein_powder.glb`);

	useFrame((_, delta) => {
		if (autoRotate && groupRef.current) {
			groupRef.current.rotation.y += delta * rotationSpeed;
		}
	});

	if (!scene) {
		return (
			//@ts-expect-error React Three Fiber JSX elements
			<mesh>
				{/* @ts-expect-error React Three Fiber JSX elements */}
				<boxGeometry args={[1, 1, 1]} />
				{/* @ts-expect-error React Three Fiber JSX elements */}
				<meshBasicMaterial color="hotpink" />
				{/* @ts-expect-error React Three Fiber JSX elements */}
			</mesh>
		);
	}

	return (
		//@ts-expect-error React Three Fiber JSX elements
		<group
			ref={groupRef}
			scale={[scale, scale, scale]}
			position={[0, -0.5, 0]}
			rotation={[0, Math.PI * 0.25, 0]}
		>
			{/* @ts-expect-error React Three Fiber JSX elements */}
			<primitive object={scene.clone()} />
			{/* @ts-expect-error React Three Fiber JSX elements */}
		</group>
	);
};

// メインコンポーネント
interface ProteinModelProps extends ProteinContainerProps {
	className?: string;
}
const ProteinModel: React.FC<ProteinModelProps> = ({ className = '', autoRotate = true, scale = 1, rotationSpeed = 0.5 }) => {
	// モバイル判定
	const [isMobile, setIsMobile] = useState(false);
	useEffect(() => {
		const check = () => setIsMobile(window.innerWidth <= 768);
		check();
		window.addEventListener('resize', check);
		return () => window.removeEventListener('resize', check);
	}, []);

	return (

			<Canvas
				gl={{ antialias: false }}
				dpr={1}
				shadows={false}
				frameloop="always"
				style={{ touchAction: 'pan-y' }}
			>
				<ProteinContainer autoRotate={autoRotate} scale={scale} rotationSpeed={rotationSpeed} />

				<Environment preset="city" />
				<PerspectiveCamera makeDefault position={[0, 0, 3]} fov={40} />

				{/* モバイルでは触れないよう完全シャットダウン、PC のみ水平回転許可 */}
				{!isMobile && (
					<OrbitControls
						enableZoom={false}
						enablePan={false}
						enableRotate={true}
						// Y軸水平回転全域
						minAzimuthAngle={-Infinity}
						maxAzimuthAngle={Infinity}
						// X軸固定
						minPolarAngle={Math.PI / 2.6}
						maxPolarAngle={Math.PI / 2.6}
						makeDefault
					/>
				)}
			</Canvas>

	);
};

export default ProteinModel;

// モデルプリロード
if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_CLOUDFRONT_URL) {
	useGLTF.preload(`${process.env.NEXT_PUBLIC_CLOUDFRONT_URL}/pepe/protein_powder.glb`);
}
-e 
### FILE: ./src/app/components/home/glowing-3d-text/GlowingTextSection.tsx

"use client";
import { useRef } from 'react';
import { useScroll } from 'framer-motion';
import GlowingTextScene from './GlowingTextScene';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import HeroModel from './HeroModel';
import CyberButton from '../../common/CyberButton';
const GlowingTextSection = () => {
	const sectionRef = useRef<HTMLDivElement>(null);
	const router = useRouter();
	// スクロール位置の検出
	const { scrollYProgress } = useScroll({
		target: sectionRef as React.RefObject<HTMLElement>,
		offset: ["start end", "end start"]
	});
	const handleNavigateToDashboard = () => {
		router.push('/dashboard');
	};

	return (
		<section
			ref={sectionRef}
			className="relative w-full overflow-hidden bg-black flex flex-col items-center justify-center"
		>
			<motion.div
				initial={{ opacity: 0, y: -10 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ delay: 0.5, duration: 0.8, repeat: Infinity, repeatType: "reverse" }}
			>
				<div className="text-xl text-center mb-2 mt-5">↓</div>
				<div className="text-sm font-mono">SCROLL DOWN</div>
			</motion.div>


			<div className="flex w-full justify-center mt-40">
				<div className="relative w-full h-[110px] md:w-[800px] md:h-[150px] lg:w-[1200px] lg:h-[200px] pointer-events-auto">
					<GlowingTextScene scrollProgress={scrollYProgress} />
				</div>
			</div>
			<div className="flex w-full justify-center">
				<div className="w-[300px] h-[400px] md:w-[400px] md:h-[500px] lg:w-[500px] lg:h-[600px] pointer-events-auto">
					<HeroModel scale={1.2} />
				</div>
			</div>
			<p className="text-center w-full text-white">
				Not just protein. It’s a story of courage and humor - encrypted in every scoop.
			</p>
			<div className="text-xs mt-8 w-full max-w-sm px-4">
				<table className="w-full table-auto border-collapse border border-white text-white">
					<tbody>
						<tr>
							<td className="border border-white px-2 py-1 text-center">Nutritional Profile</td>
							<td className="border border-white px-2 py-1 text-left"> per 50g</td>
						</tr>
						<tr>
							<td className="border border-white px-2 py-1 text-center">Protein</td>
							<td className="border border-white px-2 py-1 text-left">25 g</td>
						</tr>
						<tr>
							<td className="border border-white px-2 py-1 text-center">Fat</td>
							<td className="border border-white px-2 py-1 text-left">1.5 g</td>
						</tr>
						<tr>
							<td className="border border-white px-2 py-1 text-center">Carbs</td>
							<td className="border border-white px-2 py-1 text-left">2 g</td>
						</tr>
						<tr>
							<td className="border border-white px-2 py-1 text-center">Minerals</td>
							<td className="border border-white px-2 py-1 text-left">1 g</td>
						</tr>
						<tr>
							<td className="border border-white px-2 py-1 text-center">allergen</td>
							<td className="border border-white px-2 py-1 text-left">Milk</td>
						</tr>
					</tbody>
				</table>
			</div>
			<div className="text-center mt-5">
				<CyberButton variant="primary" className="px-4 py-2 text-l" onClick={handleNavigateToDashboard}>
					How to buy
				</CyberButton>
			</div>
		</section>
	);
};

export default GlowingTextSection;-e 
### FILE: ./src/app/components/home/glowing-3d-text/LightingSetup.tsx

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const LightingSetup = () => {
  // ライトの参照を保持
  const spotLightRef = useRef<THREE.SpotLight>(null);
  const pointLightRef = useRef<THREE.PointLight>(null);
  
  // ライトのアニメーション
  useFrame(({ clock }) => {
    const time = clock.getElapsedTime();
    
    // スポットライトの位置を微妙に変化
    if (spotLightRef.current) {
      spotLightRef.current.position.x = Math.sin(time * 0.3) * 3;
      spotLightRef.current.position.z = Math.cos(time * 0.2) * 3;
    }
    
    // ポイントライトの強度を変化（パルス効果）
    if (pointLightRef.current) {
      pointLightRef.current.intensity = 1 + Math.sin(time * 2) * 0.3;
    }
  });
  
  return (
    <>
      {/* 環境光 - 暗めの基本照明 */}

      
      {/* メインのスポットライト - テキストを照らす */}
    </>
  );
};

export default LightingSetup;-e 
### FILE: ./src/app/components/auth/AuthModal.tsx

// src/components/auth/AuthModal.tsx
'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface AuthModalProps {
	isOpen: boolean;
	onClose: () => void;
}

export const AuthModal = ({ isOpen, onClose }: AuthModalProps) => {
	const [isSignUp, setIsSignUp] = useState(false);
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [error, setError] = useState('');
	const [loading, setLoading] = useState(false);

	const { signIn, signUp, signInWithGoogle } = useAuth();

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError('');
		setLoading(true);

		try {
			if (isSignUp) {
				await signUp(email, password);
			} else {
				await signIn(email, password);
			}
			onClose();
			setEmail('');
			setPassword('');
		} catch (error: any) {
			setError(error.message || 'エラーが発生しました');
		} finally {
			setLoading(false);
		}
	};

	const handleGoogleSignIn = async () => {
		setError('');
		setLoading(true);

		try {
			await signInWithGoogle();
			onClose();
		} catch (error: any) {
			setError(error.message || 'Googleサインインでエラーが発生しました');
		} finally {
			setLoading(false);
		}
	};

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
			<div className="relative bg-black/90 backdrop-blur-md border border-neonGreen/30 rounded-lg shadow-2xl w-full max-w-md overflow-hidden">
				{/* Scanline effect */}
				<div className="absolute inset-0 overflow-hidden pointer-events-none">
					<div className="absolute w-full h-px bg-gradient-to-r from-transparent via-neonGreen to-transparent animate-scanline opacity-30"></div>
				</div>

				{/* Glitch border effect */}
				<div className="absolute inset-0 border border-neonGreen/20 rounded-lg animate-glitch-border"></div>

				<div className="relative p-8">
					{/* Header */}
					<div className="flex justify-between items-center mb-6">
						<div>
							<h2 className="text-2xl font-heading font-bold text-white mb-1">
								{isSignUp ? 'Create Account' : 'Access Terminal'}
							</h2>
							<p className="text-sm text-gray-400">
								{isSignUp ? 'Join the on-chain revolution' : 'Enter the decentralized network'}
							</p>
						</div>
						<button
							onClick={onClose}
							className="text-gray-400 hover:text-neonGreen transition-colors text-2xl font-light"
						>
							×
						</button>
					</div>

					{/* Error Display */}
					{error && (
						<div className="bg-red-900/30 border border-red-500/50 text-red-300 px-4 py-3 rounded-sm mb-4 text-sm">
							<div className="flex items-center">
								<span className="text-red-500 mr-2">⚠</span>
								{error}
							</div>
						</div>
					)}

					{/* Form */}
					<form onSubmit={handleSubmit} className="space-y-4">
						<div>
							<label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
								Email Address
							</label>
							<div className="relative">
								<input
									type="email"
									id="email"
									value={email}
									onChange={(e) => setEmail(e.target.value)}
									required
									className="w-full px-4 py-3 bg-black/50 border border-gray-600 rounded-sm focus:outline-none focus:border-neonGreen focus:ring-1 focus:ring-neonGreen text-white placeholder-gray-500 transition-all duration-200"
									placeholder="user@example.com"
								/>
								<div className="absolute inset-0 border border-neonGreen/20 rounded-sm pointer-events-none opacity-0 focus-within:opacity-100 transition-opacity duration-200"></div>
							</div>
						</div>

						<div>
							<label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
								Password
							</label>
							<div className="relative">
								<input
									type="password"
									id="password"
									value={password}
									onChange={(e) => setPassword(e.target.value)}
									required
									minLength={6}
									className="w-full px-4 py-3 bg-black/50 border border-gray-600 rounded-sm focus:outline-none focus:border-neonGreen focus:ring-1 focus:ring-neonGreen text-white placeholder-gray-500 transition-all duration-200"
									placeholder="••••••••"
								/>
								<div className="absolute inset-0 border border-neonGreen/20 rounded-sm pointer-events-none opacity-0 focus-within:opacity-100 transition-opacity duration-200"></div>
							</div>
							{isSignUp && (
								<p className="text-xs text-gray-500 mt-1">
									Minimum 6 characters required
								</p>
							)}
						</div>

						<button
							type="submit"
							disabled={loading}
							className="w-full relative px-6 py-3 bg-gradient-to-r from-neonGreen to-neonOrange text-black font-semibold rounded-sm overflow-hidden group transition-all duration-200 hover:shadow-lg hover:shadow-neonGreen/25 disabled:opacity-50 disabled:cursor-not-allowed"
						>
							<span className="relative z-10">
								{loading ? (
									<div className="flex items-center justify-center">
										<div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin mr-2"></div>
										Processing...
									</div>
								) : (
									isSignUp ? 'Initialize Account' : 'Access Network'
								)}
							</span>
							<div className="absolute inset-0 bg-gradient-to-r from-neonOrange to-neonGreen transform scale-x-0 group-hover:scale-x-100 transition-transform duration-200 origin-left"></div>
						</button>
					</form>

					{/* Divider */}
					<div className="mt-6">
						<div className="relative">
							<div className="absolute inset-0 flex items-center">
								<div className="w-full border-t border-gray-700" />
							</div>
							<div className="relative flex justify-center text-sm">
								<span className="px-4 bg-black/90 text-gray-400">Alternative Access</span>
							</div>
						</div>

						{/* Google Sign In */}
						<button
							onClick={handleGoogleSignIn}
							disabled={loading}
							className="mt-4 w-full relative px-6 py-3 bg-white/10 hover:bg-white/20 border border-gray-600 hover:border-gray-500 text-white font-medium rounded-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group"
						>
							<div className="flex items-center justify-center">
								<svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
									<path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
									<path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
									<path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
									<path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
								</svg>
								Continue with Google
							</div>
							<div className="absolute inset-0 border border-neonGreen/20 rounded-sm pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
						</button>
					</div>

					{/* Toggle Sign Up / Sign In */}
					<div className="mt-6 text-center">
						<button
							onClick={() => setIsSignUp(!isSignUp)}
							className="text-neonGreen hover:text-neonOrange transition-colors text-sm"
						>
							{isSignUp
								? 'Already have an account? Sign In'
								: 'Need an account? Create One'}
						</button>
					</div>
				</div>
			</div>
		</div>
	);
};-e 
### FILE: ./src/app/components/ui/Footer.tsx

'use client';

import Link from 'next/link';

const Footer = () => {
	const currentYear = new Date().getFullYear();

	const productLinks = [
		{ href: '/products/whey-protein', label: 'Whey Protein' },
		{ href: '/products/bcaa', label: 'BCAA' },
		{ href: '/products/pre-workout', label: 'Pre-Workout' },
		{ href: '/products/creatine', label: 'Creatine' },
	];

	const companyLinks = [
		{ href: '/about', label: 'About Us' },
		{ href: '/how-to-buy', label: 'How to Buy' },
		{ href: '/whitepaper', label: 'White Paper' },
		{ href: '/roadmap', label: 'Roadmap' },
	];

	const communityLinks = [
		{ href: '/discord', label: 'Discord' },
		{ href: '/telegram', label: 'Telegram' },
		{ href: '/twitter', label: 'Twitter' },
		{ href: '/medium', label: 'Medium' },
	];

	const legalLinks = [
		{ href: '/privacy', label: 'Privacy Policy' },
		{ href: '/terms', label: 'Terms of Service' },
		{ href: '/cookies', label: 'Cookie Policy' },
	];

	return (
		<footer className="w-full relative bg-black border-t border-dark-300 overflow-hidden z-20">
			{/* Background Effects */}
			<div className="absolute inset-0 bg-gradient-to-t from-dark-100 to-black"></div>

			{/* Animated scanline */}
			<div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-neonGreen to-transparent animate-pulse opacity-50"></div>

			{/* Grid pattern overlay */}
			<div className="absolute inset-0 opacity-5">
				<div className="w-full h-full" style={{
					backgroundImage: `
            linear-gradient(rgba(0, 255, 127, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 255, 127, 0.1) 1px, transparent 1px)
          `,
					backgroundSize: '50px 50px'
				}}></div>
			</div>

			<div className="relative px-4 sm:px-6 lg:px-8 py-12">
				<div className="max-w-7xl mx-auto">
					{/* Main Footer Content */}
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
						{/* Brand Section */}
						<div className="lg:col-span-1">
							<div className="flex items-center space-x-2 mb-6">
								<div className="relative">
									<div className="w-10 h-10 bg-gradient-to-br from-neonGreen to-neonOrange rounded-sm animate-pulse-fast"></div>
									<div className="absolute inset-0 w-10 h-10 bg-gradient-to-br from-neonGreen to-neonOrange rounded-sm blur-md opacity-50"></div>
								</div>
								<span className="text-2xl font-heading font-bold text-white md:animate-glitch-slow">
									We are on-chain
								</span>
							</div>

							<p className="text-gray-400 text-sm leading-relaxed mb-6">
								The first Web3-native protein brand. Premium supplements powered by blockchain technology and community governance.
							</p>


							{/* Connect Wallet */}
							<button className="w-full px-6 py-3 bg-gradient-to-r from-neonGreen to-neonOrange text-black font-semibold rounded-sm transition-all duration-200 hover:shadow-lg hover:shadow-neonGreen/25 group">
								<span className="relative z-10 text-sm">Login</span>
							</button>
						</div>

						{/* Products */}
						<div>
							<h3 className="text-white font-heading font-semibold mb-4 relative">
								Products
								<div className="absolute bottom-0 left-0 w-8 h-px bg-gradient-to-r from-neonGreen to-transparent"></div>
							</h3>
							<ul className="space-y-3">
								{productLinks.map((link, index) => (
									<li key={link.href}>
										<Link
											href={link.href}
											className="text-gray-400 hover:text-neonGreen transition-colors duration-200 text-sm block relative group"
											style={{ animationDelay: `${index * 50}ms` }}
										>
											<span className="relative z-10">{link.label}</span>
											<div className="absolute left-0 bottom-0 w-0 h-px bg-neonGreen group-hover:w-full transition-all duration-200"></div>
										</Link>
									</li>
								))}
							</ul>
						</div>
						
						<div>
							<h3 className="text-white font-heading font-semibold mb-4 relative">
								Company
								<div className="absolute bottom-0 left-0 w-8 h-px bg-gradient-to-r from-neonOrange to-transparent"></div>
							</h3>
							<ul className="space-y-3">
								{companyLinks.map((link, index) => (
									<li key={link.href}>
										<Link
											href={link.href}
											className="text-gray-400 hover:text-neonGreen transition-colors duration-200 text-sm block relative group"
											style={{ animationDelay: `${index * 50}ms` }}
										>
											<span className="relative z-10">{link.label}</span>
											<div className="absolute left-0 bottom-0 w-0 h-px bg-neonGreen group-hover:w-full transition-all duration-200"></div>
										</Link>
									</li>
								))}
							</ul>
						</div>

						{/* Community */}
						<div>
							<h3 className="text-white font-heading font-semibold mb-4 relative">
								Community
								<div className="absolute bottom-0 left-0 w-8 h-px bg-gradient-to-r from-neonGreen to-neonOrange"></div>
							</h3>
							<ul className="space-y-3">
								{communityLinks.map((link, index) => (
									<li key={link.href}>
										<Link
											href={link.href}
											className="text-gray-400 hover:text-neonGreen transition-colors duration-200 text-sm block relative group"
											style={{ animationDelay: `${index * 50}ms` }}
										>
											<span className="relative z-10">{link.label}</span>
											<div className="absolute left-0 bottom-0 w-0 h-px bg-neonGreen group-hover:w-full transition-all duration-200"></div>
										</Link>
									</li>
								))}
							</ul>
						</div>
					</div>

					{/* Divider */}
					<div className="relative mb-8">
						<div className="absolute inset-0 flex items-center">
							<div className="w-full border-t border-dark-300"></div>
						</div>
						<div className="relative flex justify-center">
							<div className="bg-black px-4">
								<div className="w-2 h-2 bg-neonGreen rounded-full animate-pulse"></div>
							</div>
						</div>
					</div>

			
					<div className="flex flex-col lg:flex-row justify-between items-center space-y-4 lg:space-y-0">
						{/* Legal Links */}
						<div className="flex flex-wrap items-center space-x-6">
							{legalLinks.map((link, index) => (
								<Link
									key={link.href}
									href={link.href}
									className="text-gray-500 hover:text-gray-300 transition-colors duration-200 text-xs"
									style={{ animationDelay: `${index * 25}ms` }}
								>
									{link.label}
								</Link>
							))}
						</div>

						{/* Copyright */}
						<div className="text-center lg:text-right">
							<p className="text-gray-500 text-xs">
								© {currentYear} We are on-chain. All rights reserved.
							</p>
							<p className="text-gray-600 text-xs mt-1">
								Powered by Web3 • Built on Blockchain
							</p>
						</div>
					</div>

					{/* Glitch Effect */}
					<div className="absolute bottom-4 right-4 opacity-20">
						<div className="text-neonGreen font-pixel text-xs md:animate-glitch">
							[BLOCKCHAIN_ENABLED]
						</div>
					</div>
				</div>
			</div>
		</footer>
	);
};

export default Footer;-e 
### FILE: ./src/app/components/ui/Header.tsx

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { AuthModal } from '../auth/AuthModal';
import { ShoppingCart } from 'lucide-react';

// ダッシュボードページでのみカート機能を使用するためのhook
const useCartInDashboard = () => {
	const [cartItemCount, setCartItemCount] = useState(0);
	const [onCartClick, setOnCartClick] = useState<(() => void) | null>(null);
	const [isHydrated, setIsHydrated] = useState(false);

	useEffect(() => {
		// ハイドレーション完了を待つ
		setIsHydrated(true);
		
		// カスタムイベントリスナーを追加してダッシュボードからカート情報を受信
		const handleCartUpdate = (event: CustomEvent) => {
			console.log('📨 Header received cart update:', event.detail.itemCount);
			setCartItemCount(event.detail.itemCount);
		};

		const handleCartClickHandler = (event: CustomEvent) => {
			setOnCartClick(() => event.detail.clickHandler);
		};

		window.addEventListener('cartUpdated', handleCartUpdate as EventListener);
		window.addEventListener('cartClickHandlerSet', handleCartClickHandler as EventListener);

		return () => {
			window.removeEventListener('cartUpdated', handleCartUpdate as EventListener);
			window.removeEventListener('cartClickHandlerSet', handleCartClickHandler as EventListener);
		};
	}, []);

	return { cartItemCount: isHydrated ? cartItemCount : 0, onCartClick };
};

const Header = () => {
	const [isVisible, setIsVisible] = useState(true);
	const [lastScrollY, setLastScrollY] = useState(0);
	const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
	const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

	const { user, logout, loading } = useAuth();
	const { cartItemCount, onCartClick } = useCartInDashboard();

	useEffect(() => {
		// カスタムイベントリスナーを追加してプロフィールページからログインモーダルを開く
		const handleOpenAuthModal = () => {
			setIsAuthModalOpen(true);
		};

		window.addEventListener('openAuthModal', handleOpenAuthModal);

		const handleScroll = () => {
			const currentScrollY = window.scrollY;

			if (currentScrollY < lastScrollY || currentScrollY < 100) {
				setIsVisible(true);
			} else if (currentScrollY > lastScrollY && currentScrollY > 100) {
				setIsVisible(false);
			}

			setLastScrollY(currentScrollY);
		};

		window.addEventListener('scroll', handleScroll, { passive: true });

		return () => {
			window.removeEventListener('scroll', handleScroll);
			window.removeEventListener('openAuthModal', handleOpenAuthModal);
		};
	}, [lastScrollY]);

	const handleLogout = async () => {
		try {
			await logout();
			setIsMobileMenuOpen(false);
		} catch (error) {
			console.error('ログアウトエラー:', error);
		}
	};

	const handleLoginClick = () => {
		setIsAuthModalOpen(true);
		setIsMobileMenuOpen(false);
	};

	const handleCartClick = () => {
		if (onCartClick) {
			onCartClick();
		}
		setIsMobileMenuOpen(false);
	};

	const navLinks = [
		{ href: '/dashboard', label: 'Shop', isHome: true },
		{ href: '/dashboard', label: 'How to Buy' },
		{ href: '/dashboard', label: 'White Paper' },
	];

	return (
		<>
			<header
				className={`fixed top-0 left-0 right-0 z-50 transition-transform duration-300 ease-out ${isVisible ? 'translate-y-0' : '-translate-y-full'
					}`}
			>
				{/* Background with blur effect */}
				<div className="absolute inset-0 bg-black/90 backdrop-blur-md border-b border-dark-300"></div>

				{/* Scanline effect */}
				<div className="absolute inset-0 overflow-hidden pointer-events-none">
					<div className="absolute w-full h-px bg-gradient-to-r from-transparent via-neonGreen to-transparent animate-scanline opacity-30"></div>
				</div>

				<nav className="relative px-4 sm:px-6 lg:px-8">
					<div className="flex items-center justify-between h-16 max-w-7xl mx-auto">
						{/* Logo/Brand */}
						<Link href="/" className="flex items-center space-x-2 group">
							<div className="relative">
								<div className="w-8 h-8 bg-gradient-to-br from-neonGreen to-neonOrange rounded-sm animate-pulse-fast"></div>
								<div className="absolute inset-0 w-8 h-8 bg-gradient-to-br from-neonGreen to-neonOrange rounded-sm blur-sm opacity-50"></div>
							</div>
							<span className="text-xl font-heading font-bold text-white group-hover:text-neonGreen transition-colors duration-200 md:animate-glitch-slow">
								We are on-chain
							</span>
						</Link>

						{/* Desktop Navigation */}
						<div className="hidden md:flex items-center space-x-8">
							{navLinks.map((link, index) => (
								<Link
									key={link.href}
									href={link.href}
									className={`relative px-4 py-2 text-sm font-medium transition-all duration-200 group ${link.isHome
											? 'text-neonGreen'
											: 'text-gray-300 hover:text-white'
										}`}
									style={{ animationDelay: `${index * 100}ms` }}
								>
									<span className="relative z-10">{link.label}</span>

									{/* Hover effect */}
									<div className="absolute inset-0 bg-gradient-to-r from-neonGreen/20 to-neonOrange/20 rounded-sm transform scale-0 group-hover:scale-100 transition-transform duration-200"></div>

									{/* Border animation */}
									<div className="absolute bottom-0 left-0 w-0 h-px bg-gradient-to-r from-neonGreen to-neonOrange group-hover:w-full transition-all duration-300"></div>

									{/* Glitch effect for active link */}
									{link.isHome && (
										<div className="absolute inset-0 bg-neonGreen/10 rounded-sm animate-glitch opacity-30"></div>
									)}
								</Link>
							))}

							{/* Cart Icon - Desktop */}
							<button
								onClick={handleCartClick}
								className="relative p-2 text-gray-300 hover:text-white transition-colors duration-200 hover:bg-dark-200/50 rounded-sm group"
								aria-label="Shopping cart"
							>
								<ShoppingCart className="w-6 h-6" />
								
								{/* Cart Badge */}
								{cartItemCount > 0 && (
									<div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-neonGreen to-neonOrange rounded-full flex items-center justify-center">
										<span className="text-xs font-bold text-black">
											{cartItemCount > 99 ? '99+' : cartItemCount}
										</span>
									</div>
								)}

								{/* Glow effect */}
								<div className="absolute inset-0 bg-gradient-to-r from-neonGreen/20 to-neonOrange/20 rounded-sm transform scale-0 group-hover:scale-100 transition-transform duration-200"></div>
							</button>

							{/* Authentication Section */}
							{loading ? (
								<div className="px-6 py-2">
									<div className="w-6 h-6 border-2 border-neonGreen border-t-transparent rounded-full animate-spin"></div>
								</div>
							) : user ? (
								<div className="flex items-center space-x-4">
									{/* User Info - クリック可能にしてプロフィールページへ */}
									<button
										onClick={() => window.location.href = '/profile'}
										className="hidden lg:flex flex-col text-right hover:bg-dark-200/50 px-2 py-1 rounded-sm transition-colors group"
									>
										<span className="text-xs text-gray-400 group-hover:text-gray-300">Welcome back</span>
										<span className="text-sm text-white font-medium truncate max-w-32 group-hover:text-neonGreen">
											{user.displayName || user.email?.split('@')[0]}
										</span>
									</button>

									{/* User Avatar - クリック可能にしてプロフィールページへ */}
									<button
										onClick={() => window.location.href = '/profile'}
										className="relative group"
										title="View Profile"
									>
										<div className="w-8 h-8 bg-gradient-to-br from-neonGreen to-neonOrange rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
											<span className="text-black font-bold text-sm">
												{(user.displayName || user.email || 'U')[0].toUpperCase()}
											</span>
										</div>
										<div className="absolute inset-0 w-8 h-8 bg-gradient-to-br from-neonGreen to-neonOrange rounded-full blur-sm opacity-50 group-hover:opacity-75 transition-opacity duration-200"></div>
									</button>

									{/* Logout Button */}
									<button
										onClick={handleLogout}
										className="relative px-4 py-2 bg-red-600/80 hover:bg-red-600 text-white text-sm font-medium rounded-sm transition-all duration-200 hover:shadow-lg hover:shadow-red-500/25 group"
									>
										<span className="relative z-10">Logout</span>
										<div className="absolute inset-0 bg-red-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-200 origin-left rounded-sm"></div>
									</button>
								</div>
							) : (
								<button
									onClick={handleLoginClick}
									className="relative px-6 py-2 bg-gradient-to-r from-neonGreen to-neonOrange text-black font-semibold rounded-sm overflow-hidden group transition-all duration-200 hover:shadow-lg hover:shadow-neonGreen/25"
								>
									<span className="relative z-10 text-sm">Login</span>
									<div className="absolute inset-0 bg-gradient-to-r from-neonOrange to-neonGreen transform scale-x-0 group-hover:scale-x-100 transition-transform duration-200 origin-left"></div>
									<div className="absolute inset-0 animate-pulse bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
								</button>
							)}
						</div>

						{/* Mobile menu button */}
						<button
							onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
							className="md:hidden relative w-10 h-10 flex flex-col items-center justify-center space-y-1 group"
							aria-label="Toggle mobile menu"
						>
							<span className={`w-6 h-0.5 bg-white transition-all duration-200 ${isMobileMenuOpen ? 'rotate-45 translate-y-1.5' : ''}`}></span>
							<span className={`w-6 h-0.5 bg-white transition-all duration-200 ${isMobileMenuOpen ? 'opacity-0' : ''}`}></span>
							<span className={`w-6 h-0.5 bg-white transition-all duration-200 ${isMobileMenuOpen ? '-rotate-45 -translate-y-1.5' : ''}`}></span>
						</button>
					</div>

					{/* Mobile Menu */}
					<div className={`md:hidden transition-all duration-300 ease-out overflow-hidden ${isMobileMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
						}`}>
						<div className="px-4 py-4 space-y-3 border-t border-dark-300 bg-black/50">
							{navLinks.map((link, index) => (
								<Link
									key={link.href}
									href={link.href}
									className={`block px-4 py-3 text-base font-medium transition-all duration-200 rounded-sm ${link.isHome
											? 'text-neonGreen bg-neonGreen/10 border border-neonGreen/20'
											: 'text-gray-300 hover:text-white hover:bg-dark-200'
										}`}
									onClick={() => setIsMobileMenuOpen(false)}
									style={{ animationDelay: `${index * 50}ms` }}
								>
									{link.label}
								</Link>
							))}

							{/* Cart Icon - Mobile */}
							<button
								onClick={handleCartClick}
								className="flex items-center justify-between w-full px-4 py-3 text-base font-medium text-gray-300 hover:text-white hover:bg-dark-200 transition-all duration-200 rounded-sm"
							>
								<div className="flex items-center space-x-3">
									<ShoppingCart className="w-5 h-5" />
									<span>Shopping Cart</span>
								</div>
								{cartItemCount > 0 && (
									<div className="w-6 h-6 bg-gradient-to-r from-neonGreen to-neonOrange rounded-full flex items-center justify-center">
										<span className="text-xs font-bold text-black">
											{cartItemCount > 99 ? '99+' : cartItemCount}
										</span>
									</div>
								)}
							</button>

							{/* Mobile Authentication Section */}
							{loading ? (
								<div className="flex justify-center py-4">
									<div className="w-6 h-6 border-2 border-neonGreen border-t-transparent rounded-full animate-spin"></div>
								</div>
							) : user ? (
								<div className="space-y-3 pt-4 border-t border-dark-300">
									{/* Profile Link - Mobile */}
									<button
										onClick={() => {
											window.location.href = '/profile';
											setIsMobileMenuOpen(false);
										}}
										className="flex items-center justify-between w-full px-4 py-3 text-base font-medium text-gray-300 hover:text-white hover:bg-dark-200 transition-all duration-200 rounded-sm"
									>
										<div className="flex items-center space-x-3">
											<div className="w-8 h-8 bg-gradient-to-br from-neonGreen to-neonOrange rounded-full flex items-center justify-center">
												<span className="text-black font-bold text-sm">
													{(user.displayName || user.email || 'U')[0].toUpperCase()}
												</span>
											</div>
											<span>Profile</span>
										</div>
									</button>

									{/* User Info */}
									<div className="px-4 py-2 bg-neonGreen/5 rounded-sm border border-neonGreen/20">
										<div className="text-xs text-gray-400">Logged in as</div>
										<div className="text-sm text-white font-medium">
											{user.displayName || user.email}
										</div>
									</div>

									{/* Logout Button */}
									<button
										onClick={handleLogout}
										className="w-full px-6 py-3 bg-red-600/80 hover:bg-red-600 text-white font-semibold rounded-sm transition-all duration-200 hover:shadow-lg hover:shadow-red-500/25"
									>
										Logout
									</button>
								</div>
							) : (
								<button
									onClick={handleLoginClick}
									className="w-full mt-4 px-6 py-3 bg-gradient-to-r from-neonGreen to-neonOrange text-black font-semibold rounded-sm transition-all duration-200 hover:shadow-lg hover:shadow-neonGreen/25"
								>
									Login
								</button>
							)}
						</div>
					</div>
				</nav>
			</header>

			{/* Auth Modal */}
			<AuthModal
				isOpen={isAuthModalOpen}
				onClose={() => setIsAuthModalOpen(false)}
			/>
		</>
	);
};

export default Header;-e 
### FILE: ./src/app/components/ui/GlitchText.tsx

// src/app/components/ui/GlitchText.tsx
'use client';
import React, { useState, useEffect } from 'react';

interface GlitchTextProps {
	text: string;
	className?: string;
	glitchIntensity?: 'low' | 'medium' | 'high';
	color?: string;
	isMainTitle?: boolean;
}

export const GlitchText: React.FC<GlitchTextProps> = ({
	text,
	className = '',
	glitchIntensity = 'medium',
	color = 'text-neonGreen',
	isMainTitle = false,
}) => {
	const [isGlitching, setIsGlitching] = useState(false);
	const [rgbShift, setRgbShift] = useState({ r: 0, g: 0, b: 0 });

	// グリッチ効果のランダム発生
	useEffect(() => {
		const triggerGlitch = () => {
			const shouldGlitch = Math.random() > (
				glitchIntensity === 'low' ? 0.9 :
					glitchIntensity === 'medium' ? 0.8 : 0.7
			);

			if (shouldGlitch) {
				setIsGlitching(true);

				// RGB分離エフェクト用の値を設定
				setRgbShift({
					r: Math.random() * 4 - 2,
					g: Math.random() * 4 - 2,
					b: Math.random() * 4 - 2
				});

				// 短い時間後にグリッチを終了
				setTimeout(() => {
					setIsGlitching(false);
					setRgbShift({ r: 0, g: 0, b: 0 });
				}, Math.random() * 200 + 50);
			}
		};

		const intervalId = setInterval(triggerGlitch, Math.random() * 3000 + 2000);
		return () => clearInterval(intervalId);
	}, [glitchIntensity]);

	const baseClasses = `relative ${color} ${className} ${isMainTitle ? 'font-heading font-bold tracking-wider' : ''}`;

	const glitchClasses = isGlitching ? 'animate-glitch' : '';

	const textShadow = isMainTitle
		? `0 0 5px currentColor, 0 0 10px currentColor, 0 0 20px currentColor`
		: `0 0 3px currentColor`;

	return (
		<div className="relative">
			{/* RGB分離効果 */}
			{isGlitching && (
				<>
					<span
						className={`absolute ${baseClasses} opacity-50 text-red-500`}
						style={{
							transform: `translate(${rgbShift.r}px, 0)`,
							textShadow: '0 0 2px currentColor',
							left: 0,
							top: 0,
							filter: 'blur(0.5px)'
						}}
						aria-hidden="true"
					>
						{text}
					</span>
					<span
						className={`absolute ${baseClasses} opacity-50 text-green-500`}
						style={{
							transform: `translate(${rgbShift.g}px, 0)`,
							textShadow: '0 0 2px currentColor',
							left: 0,
							top: 0,
							filter: 'blur(0.5px)'
						}}
						aria-hidden="true"
					>
						{text}
					</span>
					<span
						className={`absolute ${baseClasses} opacity-50 text-blue-500`}
						style={{
							transform: `translate(${rgbShift.b}px, 0)`,
							textShadow: '0 0 2px currentColor',
							left: 0,
							top: 0,
							filter: 'blur(0.5px)'
						}}
						aria-hidden="true"
					>
						{text}
					</span>
				</>
			)}

			{/* メインテキスト */}
			<span
				className={`${baseClasses} ${glitchClasses} inline-block`}
				style={{
					textShadow,
					animation: isMainTitle ? 'pulse 2s ease-in-out infinite' : undefined,
				}}
			>
				{text}
			</span>
		</div>
	);
};

export default GlitchText;-e 
### FILE: ./src/app/components/payment/LiveDemoSection.tsx

// src/app/components/payment/LiveDemoSection.tsx
'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
	Play,
	RefreshCw,
	CheckCircle,
	Clock,
	AlertCircle,
	XCircle,
	Zap,
	ExternalLink
} from 'lucide-react';
import CyberButton from '../common/CyberButton';
import CyberCard from '../common/CyberCard';
import QRCodeDisplay from './QRCodeDisplay';
import { CreateDemoInvoiceResponse, DemoInvoiceStatusResponse } from '../../../../types/demo-payment';

/**
 * デモの状態管理（API型に合わせて拡張）
 */
type DemoStatus = 'idle' | 'generating' | 'pending' | 'waiting' | 'confirming' | 'completed' | 'expired' | 'error';

/**
 * デモ決済の状態
 */
interface DemoState {
	status: DemoStatus;
	invoiceId?: string;
	paymentAddress?: string;
	amount?: string;
	qrCodeDataURL?: string;
	paymentURI?: string;
	expiresAt?: string;
	timeRemaining?: number;
	transactionHash?: string;
	confirmations?: number;
	errorMessage?: string;
}

/**
 * ライブデモセクションコンポーネント
 */
const LiveDemoSection: React.FC = () => {
	const [demoState, setDemoState] = useState<DemoState>({ status: 'idle' });
	const [isPolling, setIsPolling] = useState(false);

	// ポーリング管理用ref
	const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
	const timeoutRef = useRef<NodeJS.Timeout | null>(null);

	/**
	 * ポーリング停止
	 */
	const stopPolling = useCallback(() => {
		if (pollingIntervalRef.current) {
			clearInterval(pollingIntervalRef.current);
			pollingIntervalRef.current = null;
		}
		if (timeoutRef.current) {
			clearTimeout(timeoutRef.current);
			timeoutRef.current = null;
		}
		setIsPolling(false);
	}, []);

	/**
	 * コンポーネントアンマウント時のクリーンアップ
	 */
	useEffect(() => {
		return () => {
			stopPolling();
		};
	}, [stopPolling]);

	/**
	 * 時間フォーマット（秒 → mm:ss）
	 */
	const formatTime = useCallback((seconds: number): string => {
		const minutes = Math.floor(seconds / 60);
		const remainingSeconds = seconds % 60;
		return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
	}, []);

	/**
	 * ステータス確認API呼び出し
	 */
	const checkInvoiceStatus = useCallback(async (invoiceId: string): Promise<void> => {
		try {
			const response = await fetch(`/api/demo/invoice/${invoiceId}/status`);
			const data: DemoInvoiceStatusResponse = await response.json();

			if (!data.success) {
				throw new Error(data.error?.message || 'Status check failed');
			}

			const statusData = data.data!;

			// API の status を UI の status にマッピング
			let uiStatus: DemoStatus = statusData.status as DemoStatus;
			if (statusData.status === 'pending') {
				uiStatus = 'waiting'; // APIの'pending'をUIの'waiting'にマッピング
			}

			// 状態更新
			setDemoState(prev => ({
				...prev,
				status: uiStatus,
				timeRemaining: statusData.timeRemaining,
				transactionHash: statusData.transactionHash,
				confirmations: statusData.confirmations
			}));

			// 完了・期限切れ・エラー時はポーリング停止
			if (['completed', 'expired', 'error'].includes(uiStatus)) {
				stopPolling();
			}

			console.log('📊 Status updated:', {
				invoiceId,
				apiStatus: statusData.status,
				uiStatus: uiStatus,
				timeRemaining: statusData.timeRemaining
			});

		} catch (error) {
			console.error('❌ Status check failed:', error);
			setDemoState(prev => ({
				...prev,
				status: 'error',
				errorMessage: error instanceof Error ? error.message : 'Status check failed'
			}));
			stopPolling();
		}
	}, [stopPolling]);

	/**
	 * ポーリング開始
	 */
	const startPolling = useCallback((invoiceId: string) => {
		setIsPolling(true);

		// 即座に1回チェック
		checkInvoiceStatus(invoiceId);

		// 5秒間隔でポーリング
		pollingIntervalRef.current = setInterval(() => {
			checkInvoiceStatus(invoiceId);
		}, 5000);

		// 5分後に自動停止
		timeoutRef.current = setTimeout(() => {
			stopPolling();
			setDemoState(prev => ({
				...prev,
				status: 'expired'
			}));
		}, 5 * 60 * 1000);

		console.log('🔄 Started polling for invoice:', invoiceId);
	}, [checkInvoiceStatus, stopPolling]);

	/**
	 * デモInvoice生成
	 */
	const generateDemoInvoice = useCallback(async () => {
		try {
			setDemoState({ status: 'generating' });

			const response = await fetch('/api/demo/invoice/create', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					chainId: 43113 // Avalanche FUJI
				}),
			});

			const data: CreateDemoInvoiceResponse = await response.json();

			if (!data.success) {
				throw new Error(data.error?.message || 'Invoice generation failed');
			}

			const invoiceData = data.data!;

			// 状態更新
			setDemoState({
				status: 'waiting',
				invoiceId: invoiceData.invoiceId,
				paymentAddress: invoiceData.paymentAddress,
				amount: invoiceData.amount,
				qrCodeDataURL: invoiceData.qrCodeDataURL,
				paymentURI: invoiceData.paymentURI,
				expiresAt: invoiceData.expiresAt,
				timeRemaining: 300 // 5分
			});

			// ポーリング開始
			startPolling(invoiceData.invoiceId);

			console.log('✅ Demo invoice generated:', {
				invoiceId: invoiceData.invoiceId,
				address: invoiceData.paymentAddress.substring(0, 10) + '...'
			});

		} catch (error) {
			console.error('❌ Invoice generation failed:', error);
			setDemoState({
				status: 'error',
				errorMessage: error instanceof Error ? error.message : 'Failed to generate invoice'
			});
		}
	}, [startPolling]);

	/**
	 * デモリセット
	 */
	const resetDemo = useCallback(() => {
		stopPolling();
		setDemoState({ status: 'idle' });
		console.log('🔄 Demo reset');
	}, [stopPolling]);

	/**
	 * コピー時のフィードバック
	 */
	const handleCopy = useCallback((text: string, type: 'address' | 'uri') => {
		console.log(`📋 ${type} copied:`, text.substring(0, 20) + '...');
	}, []);

	/**
	 * ブロックエクスプローラーリンク
	 */
	const getExplorerLink = useCallback((txHash: string) => {
		return `https://testnet.snowscan.xyz/tx/${txHash}`;
	}, []);

	/**
	 * ステータスアイコン取得
	 */
	const getStatusIcon = () => {
		switch (demoState.status) {
			case 'generating':
				return <RefreshCw className="w-5 h-5 text-blue-400 animate-spin" />;
			case 'waiting':
				return <Clock className="w-5 h-5 text-yellow-400" />;
			case 'confirming':
				return <Zap className="w-5 h-5 text-orange-400" />;
			case 'completed':
				return <CheckCircle className="w-5 h-5 text-green-400" />;
			case 'expired':
				return <XCircle className="w-5 h-5 text-red-400" />;
			case 'error':
				return <AlertCircle className="w-5 h-5 text-red-400" />;
			default:
				return <Play className="w-5 h-5 text-neonGreen" />;
		}
	};

	/**
	 * ステータステキスト取得
	 */
	const getStatusText = () => {
		switch (demoState.status) {
			case 'idle':
				return 'Ready to start demo';
			case 'generating':
				return 'Generating payment invoice...';
			case 'pending':
			case 'waiting':
				return 'Waiting for payment';
			case 'confirming':
				return `Confirming transaction (${demoState.confirmations || 0}/3 confirmations)`;
			case 'completed':
				return 'Payment completed successfully!';
			case 'expired':
				return 'Demo payment expired';
			case 'error':
				return 'Error occurred';
			default:
				return 'Unknown status';
		}
	};

	return (
		<div className="space-y-6">
			{/* ヘッダー */}
			<div className="text-center">
				<h4 className="text-lg font-semibold text-white mb-2 flex items-center justify-center space-x-2">
					{getStatusIcon()}
					<span>Live Payment Demo</span>
				</h4>
				<p className="text-sm text-gray-400">
					Try demo payment with 0.001 AVAX on Avalanche FUJI Testnet
				</p>
			</div>

			{/* ステータス表示 */}
			<CyberCard showEffects={false} className="text-center">
				<div className="space-y-4">
					{/* ステータスインジケーター */}
					<div className="flex items-center justify-center space-x-3">
						{getStatusIcon()}
						<span className="text-white font-medium">
							{getStatusText()}
						</span>
					</div>

					{/* タイマー表示 */}
					{demoState.timeRemaining !== undefined && ['pending', 'waiting'].includes(demoState.status) && (
						<div className="text-center">
							<div className="text-2xl font-bold text-yellow-400 font-mono">
								{formatTime(demoState.timeRemaining)}
							</div>
							<div className="text-xs text-gray-400">
								Time remaining
							</div>
						</div>
					)}

					{/* エラーメッセージ */}
					{demoState.status === 'error' && demoState.errorMessage && (
						<div className="p-3 bg-red-900/20 border border-red-600/30 rounded-sm">
							<div className="text-sm text-red-400">
								{demoState.errorMessage}
							</div>
						</div>
					)}

					{/* 完了時のトランザクション情報 */}
					{demoState.status === 'completed' && demoState.transactionHash && (
						<div className="p-3 bg-green-900/20 border border-green-600/30 rounded-sm">
							<div className="text-sm text-green-400 mb-2">
								Transaction confirmed!
							</div>
							<CyberButton
								size="sm"
								variant="outline"
								onClick={() => window.open(getExplorerLink(demoState.transactionHash!), '_blank')}
								className="flex items-center space-x-1"
							>
								<ExternalLink className="w-3 h-3" />
								<span>View on Explorer</span>
							</CyberButton>
						</div>
					)}

					{/* アクションボタン */}
					<div className="flex justify-center space-x-3">
						{demoState.status === 'idle' && (
							<CyberButton
								variant="primary"
								onClick={generateDemoInvoice}
								className="flex items-center space-x-2"
							>
								<Play className="w-4 h-4" />
								<span>Generate Demo Invoice</span>
							</CyberButton>
						)}

						{['completed', 'expired', 'error'].includes(demoState.status) && (
							<CyberButton
								variant="secondary"
								onClick={resetDemo}
								className="flex items-center space-x-2"
							>
								<RefreshCw className="w-4 h-4" />
								<span>Try Again</span>
							</CyberButton>
						)}

						{['waiting', 'confirming', 'pending'].includes(demoState.status) && (
							<CyberButton
								variant="outline"
								onClick={resetDemo}
								className="flex items-center space-x-2"
							>
								<XCircle className="w-4 h-4" />
								<span>Cancel</span>
							</CyberButton>
						)}
					</div>
				</div>
			</CyberCard>

			{/* QRコード表示 */}
			{['waiting', 'confirming', 'completed', 'pending'].includes(demoState.status) &&
				demoState.qrCodeDataURL && demoState.paymentURI && demoState.paymentAddress && (<>
					<QRCodeDisplay
						qrCodeDataURL={demoState.qrCodeDataURL}
						paymentURI={demoState.paymentURI}
						paymentAddress={demoState.paymentAddress}
						amount={demoState.amount || '0.001'}
						chainId={43113}
						onCopy={handleCopy}
						showMetadata={true}
					/>
					<div className="mt-4 text-center">
						<button
							onClick={() => {
								window.location.href = demoState.paymentURI!;
							}}
							className="inline-block px-4 py-2 bg-neonGreen text-black font-semibold rounded-md hover:bg-neonGreen/90"
						>
							Pay with Wallet
						</button>
					</div>
				</>)}

			{/* 使用方法説明 */}
			{demoState.status === 'idle' && (
				<div className="bg-blue-900/20 border border-blue-600/30 rounded-sm p-4">
					<h5 className="text-blue-400 font-medium mb-2">📖 How to use this demo</h5>
					<div className="text-sm text-gray-300 space-y-1">
						<div>1. Click "Generate Demo Invoice" to create a payment request</div>
						<div>2. Scan the QR code with your mobile wallet (or copy the address)</div>
						<div>3. Send exactly 0.001 AVAX to the displayed address</div>
						<div>4. Watch the real-time payment confirmation</div>
					</div>
					<div className="mt-3 text-xs text-blue-300">
						💡 Need FUJI testnet tokens? Get them from the{' '}
						<a
							href="https://faucet.avax.network/"
							target="_blank"
							rel="noopener noreferrer"
							className="underline hover:text-blue-200"
						>
							Avalanche Faucet
						</a>
					</div>
				</div>
			)}

			{/* デバッグ情報（開発環境のみ） */}
			{process.env.NODE_ENV === 'development' && (
				<div className="bg-yellow-900/20 border border-yellow-600/30 rounded-sm p-3">
					<div className="text-xs text-yellow-400 font-mono">
						🔧 Debug: Status={demoState.status} |
						Polling={isPolling.toString()} |
						ID={demoState.invoiceId || 'none'}
					</div>
				</div>
			)}
		</div>
	);
};

export default LiveDemoSection;-e 
### FILE: ./src/app/components/payment/QRCodeDisplay.tsx

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

export default QRCodeDisplay;-e 
### FILE: ./src/app/components/common/GridPattern.tsx

// src/app/components/common/GridPattern.tsx
'use client';

import React from 'react';

export interface GridPatternProps {
  size?: number;
  opacity?: number;
  color?: string;
  className?: string;
  animated?: boolean;
}

const GridPattern: React.FC<GridPatternProps> = ({
  size = 50,
  opacity = 0.05,
  color = 'rgba(0, 255, 127, 0.1)',
  className = '',
  animated = false
}) => {
  const gridStyle: React.CSSProperties = {
    backgroundImage: `
      linear-gradient(${color} 1px, transparent 1px),
      linear-gradient(90deg, ${color} 1px, transparent 1px)
    `,
    backgroundSize: `${size}px ${size}px`,
    opacity,
  };

  const animatedStyle = animated
    ? {
        ...gridStyle,
        animation: 'gridPulse 4s ease-in-out infinite',
      }
    : gridStyle;

  return (
    <>
      <div
        className={`absolute inset-0 pointer-events-none ${className}`}
        style={animatedStyle}
      />
      
      {/* CSS アニメーション定義 */}
      {animated && (
        <style jsx>{`
          @keyframes gridPulse {
            0%, 100% {
              opacity: ${opacity};
            }
            50% {
              opacity: ${opacity * 2};
            }
          }
        `}</style>
      )}
    </>
  );
};

export default GridPattern;-e 
### FILE: ./src/app/components/common/CyberCard.tsx

// src/app/components/common/CyberCard.tsx
'use client';

import React from 'react';
import GridPattern from './GridPattern';

export interface CyberCardProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  stats?: string;
  badge?: string;
  onClick?: () => void;
  className?: string;
  variant?: 'default' | 'dashboard' | 'interactive';
  showEffects?: boolean;
  glowIntensity?: 'low' | 'medium' | 'high';
}

const CyberCard: React.FC<CyberCardProps> = ({
  children,
  title,
  description,
  stats,
  badge,
  onClick,
  className = '',
  variant = 'default',
  showEffects = true,
  glowIntensity = 'medium'
}) => {
  const baseClasses = `
    relative bg-gradient-to-t from-dark-100 to-black 
    border border-dark-300 rounded-sm overflow-hidden
    transition-all duration-300 ease-out
  `;

  const variantClasses = {
    default: 'p-6',
    dashboard: 'p-6 cursor-pointer hover:border-neonGreen hover:scale-[1.02]',
    interactive: 'p-4 cursor-pointer hover:border-neonGreen hover:shadow-lg hover:shadow-neonGreen/20'
  };

  const glowClasses = {
    low: 'hover:shadow-md hover:shadow-neonGreen/10',
    medium: 'hover:shadow-lg hover:shadow-neonGreen/20',
    high: 'hover:shadow-xl hover:shadow-neonGreen/30'
  };

  const handleClick = () => {
    if (onClick) {
      onClick();
    }
  };

  return (
    <div
      className={`
        ${baseClasses}
        ${variantClasses[variant]}
        ${glowClasses[glowIntensity]}
        ${className}
      `}
      onClick={handleClick}
    >
      {/* Background Effects */}
      {showEffects && (
        <>
          <GridPattern />
        </>
      )}

      {/* Content Container */}
      <div className="relative z-10">
        {/* Header */}
        {(title || badge) && (
          <div className="flex items-center justify-between mb-4">
            {title && (
              <h3 className="text-white font-heading font-semibold text-lg cyber-text-glitch">
                {title}
              </h3>
            )}
            {badge && (
              <span className="inline-block px-2 py-1 text-xs rounded-sm bg-neonGreen/10 text-neonGreen border border-neonGreen/30">
                {badge}
              </span>
            )}
          </div>
        )}

        {/* Description */}
        {description && (
          <p className="text-gray-400 text-sm mb-4 leading-relaxed">
            {description}
          </p>
        )}

        {/* Main Content */}
        <div className="mb-4">
          {children}
        </div>

        {/* Stats */}
        {stats && (
          <div className="text-xs text-gray-500 border-t border-dark-300 pt-3">
            {stats}
          </div>
        )}
      </div>

      {/* Hover Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-neonGreen/5 to-neonOrange/5 opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
    </div>
  );
};

export default CyberCard;-e 
### FILE: ./src/app/components/common/PriceDisplay.tsx

// src/components/common/PriceDisplay.tsx
'use client';

import React from 'react';
import { RefreshCw, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';
import { usePriceConverter } from '@/hooks/usePriceConverter';
import { PriceDisplayProps } from '../../../../types/dashboard';

export const PriceDisplay: React.FC<PriceDisplayProps> = ({
	usdAmount,
	selectedCurrency,
	showBoth = true,
	showChange = false,
	size = 'md',
	className = ''
}) => {
	const {
		convertUSDTo,
		formatCryptoPrice,
		formatUSDPrice,
		isLoading,
		error,
		exchangeRates
	} = usePriceConverter();

	const cryptoAmount = convertUSDTo(usdAmount, selectedCurrency);
	const hasError = error !== null;

	// Size classes
	const sizeClasses = {
		sm: {
			primary: 'text-sm',
			secondary: 'text-xs',
			icon: 'w-3 h-3'
		},
		md: {
			primary: 'text-base font-semibold',
			secondary: 'text-sm',
			icon: 'w-4 h-4'
		},
		lg: {
			primary: 'text-lg font-bold',
			secondary: 'text-base',
			icon: 'w-5 h-5'
		}
	};

	const classes = sizeClasses[size];

	// Mock price change data (in real implementation, this would come from the price hook)
	const getPriceChange = (currency: string) => {
		// This would be real data from the prices hook
		const mockChanges: Record<string, number> = {
			BTC: 2.34,
			ETH: -1.89,
			SOL: 5.67,
			AVAX: -2.23,
			SUI: 8.12
		};
		return mockChanges[currency] || 0;
	};

	const priceChange = showChange ? getPriceChange(selectedCurrency) : 0;
	const isPositiveChange = priceChange >= 0;

	return (
		<div className={`space-y-1 ${className}`}>
			{/* USD Price */}
			<div className={`text-white ${classes.primary}`}>
				{formatUSDPrice(usdAmount)}
			</div>

			{/* Crypto Price */}
			{showBoth && (
				<div className="flex items-center space-x-2">
					<div className={`${hasError ? 'text-red-400' : 'text-gray-400'} ${classes.secondary} flex items-center space-x-1`}>
						{isLoading ? (
							<>
								<RefreshCw className={`${classes.icon} animate-spin`} />
								<span>Loading...</span>
							</>
						) : hasError ? (
							<>
								<AlertTriangle className={`${classes.icon} text-red-400`} />
								<span>Unavailable</span>
							</>
						) : (
							<span>≈ {formatCryptoPrice(cryptoAmount, selectedCurrency)}</span>
						)}
					</div>

					{/* Price Change Indicator */}
					{showChange && !isLoading && !hasError && (
						<div className={`flex items-center space-x-1 ${classes.secondary} ${
							isPositiveChange ? 'text-green-400' : 'text-red-400'
						}`}>
							{isPositiveChange ? (
								<TrendingUp className={classes.icon} />
							) : (
								<TrendingDown className={classes.icon} />
							)}
							<span>
								{isPositiveChange ? '+' : ''}{priceChange.toFixed(2)}%
							</span>
						</div>
					)}
				</div>
			)}
		</div>
	);
};

export default PriceDisplay;-e 
### FILE: ./src/app/components/common/CyberButton.tsx

// src/app/components/common/CyberButton.tsx
'use client';

import React from 'react';

export interface CyberButtonProps {
	children: React.ReactNode;
	onClick?: () => void;
	variant?: 'primary' | 'secondary' | 'outline';
	size?: 'sm' | 'md' | 'lg';
	disabled?: boolean;
	className?: string;
	type?: 'button' | 'submit' | 'reset';
}

const CyberButton: React.FC<CyberButtonProps> = ({
	children,
	onClick,
	variant = 'primary',
	size = 'md',
	disabled = false,
	className = '',
	type = 'button',
}) => {
	const baseClasses = 'relative font-semibold rounded-sm transition-all duration-200 overflow-hidden group';

	const variantClasses = {
		primary: 'bg-gradient-to-r from-neonGreen to-neonOrange text-black hover:shadow-lg hover:shadow-neonGreen/25',
		secondary: 'bg-gradient-to-r from-neonOrange to-neonGreen text-black hover:shadow-lg hover:shadow-neonOrange/25',
		outline: 'border border-neonGreen text-neonGreen hover:bg-neonGreen hover:text-black'
	};

	const sizeClasses = {
		sm: 'px-4 py-2 text-sm',
		md: 'px-6 py-3 text-base',
		lg: 'px-8 py-4 text-lg'
	};

	const disabledClasses = disabled
		? 'opacity-50 cursor-not-allowed'
		: 'cursor-pointer';

	return (
		<button
			type={type}
			onClick={disabled ? undefined : onClick}
			disabled={disabled}
			className={`
        ${baseClasses}
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${disabledClasses}
        ${className}
      `}
		>
			{/* ホバー時のリバースグラデーション */}
			{variant === 'primary' && (
				<div className="absolute inset-0 bg-gradient-to-r from-neonOrange to-neonGreen transform scale-x-0 group-hover:scale-x-100 transition-transform duration-200 origin-left"></div>
			)}

			{variant === 'secondary' && (
				<div className="absolute inset-0 bg-gradient-to-r from-neonGreen to-neonOrange transform scale-x-0 group-hover:scale-x-100 transition-transform duration-200 origin-left"></div>
			)}

			{/* パルス効果 */}
			{!disabled && (
				<div className="absolute inset-0 animate-pulse bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
			)}

			{/* テキスト */}
			<span className="relative z-10">{children}</span>
		</button>
	);
};

export default CyberButton;-e 
### FILE: ./src/app/layout.tsx

import { Montserrat, Space_Grotesk } from 'next/font/google';
import './globals.css';
import type { Metadata } from 'next';
import { AuthProvider } from '@/contexts/AuthContext';
// フォントの設定
const montserrat = Montserrat({
	subsets: ['latin'],
	variable: '--font-montserrat',
	display: 'swap',
});

const spaceGrotesk = Space_Grotesk({
	subsets: ['latin'],
	variable: '--font-space-grotesk',
	display: 'swap',
});
// メタデータ設定
export const metadata: Metadata = {
	title: 'We Are On-Chain | Pepe Protein',
	description: 'Pay, Pump, Live. The crypto-exclusive protein for the blockchain generation.',
	keywords: 'crypto, protein, blockchain, pepe, fitness, cryptocurrency',
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang="en" className={`${montserrat.variable} ${spaceGrotesk.variable}`}>
			<body className="bg-black text-white min-h-screen font-sans antialiased">
				<AuthProvider>
					{children}
				</AuthProvider>
			</body>
		</html>
	);
}-e 
### FILE: ./src/app/page.tsx

import HeroSection from './components/home/hero-section/HeroSection';
import GlowingTextSection from './components/home/glowing-3d-text/GlowingTextSection';
import Header from './components/ui/Header';
import Footer from './components/ui/Footer';
import CyberInterface from './components/home/layout/CyberInterface';
import PepePush from './components/home/pepePush/PepePush';
export default function Home() {
	return (
		<main className="relative flex flex-col items-center w-full">
			<Header/>
			<CyberInterface />
			<HeroSection />
			<GlowingTextSection />
			<PepePush />
			<Footer />
		</main>
	);
}-e 
### FILE: ./src/app/api/demo/invoice/create/route.ts

// src/app/api/demo/invoice/create/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { serverTimestamp } from 'firebase/firestore';
import {
	CreateDemoInvoiceRequest,
	CreateDemoInvoiceResponse,
	DemoInvoiceDocument,
	DemoPaymentErrorCode
} from '../../../../../../types/demo-payment';
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
}-e 
### FILE: ./src/app/api/demo/invoice/[invoiceId]/status/route.ts

// src/app/api/demo/invoice/[invoiceId]/status/route.ts
import { NextRequest, NextResponse } from 'next/server';
import {
	DemoInvoiceStatusResponse,
	DemoPaymentErrorCode
} from '../../../../../../../types/demo-payment';
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
}-e 
### FILE: ./src/app/api/utils/avalanche.ts

// src/app/api/utils/avalanche.ts
import { ethers } from 'ethers';
import {
	AVALANCHE_FUJI_CONFIG,
	AVALANCHE_FUJI_RPC_ENDPOINTS,
	GAS_CONFIG,
	LOGGING_CONFIG,
	avaxToWei,
	weiToAVAX
} from '@/lib/avalanche-config';
import { DemoPaymentError } from '../../../../types/demo-payment';

/**
 * トランザクション情報
 */
interface TransactionInfo {
	hash: string;
	blockNumber: number | null;
	confirmations: number;
	from: string;
	to: string;
	value: string; // Wei
	gasPrice: string;
	gasUsed?: string;
	status: number | null; // 1 = success, 0 = failed
	timestamp?: number;
}

/**
 * 残高チェック結果
 */
interface BalanceCheckResult {
	currentBalance: string; // Wei
	currentBalanceAVAX: string; // AVAX
	requiredAmount: string; // Wei
	requiredAmountAVAX: string; // AVAX
	hasReceived: boolean;
	isExactMatch: boolean;
	isOverpayment: boolean;
	receivedAmount: string; // Wei (if any)
}

/**
 * Avalanche RPC接続管理クラス
 */
export class AvalancheRPCManager {
	private providers: ethers.JsonRpcProvider[];
	private currentProviderIndex: number = 0;
	private connectionAttempts: Map<string, number> = new Map();
	private maxRetries: number = 3;

	constructor() {
		// 複数のRPCエンドポイントでプロバイダー初期化
		this.providers = AVALANCHE_FUJI_RPC_ENDPOINTS.map(url => {
			return new ethers.JsonRpcProvider(url, {
				chainId: AVALANCHE_FUJI_CONFIG.chainId,
				name: AVALANCHE_FUJI_CONFIG.name
			});
		});

		if (LOGGING_CONFIG.enableDebugLogs) {
			console.log('🔗 AvalancheRPCManager initialized with', this.providers.length, 'providers');
		}
	}

	/**
	 * 現在のプロバイダー取得
	 */
	public getCurrentProvider(): ethers.JsonRpcProvider {
		return this.providers[this.currentProviderIndex];
	}

	/**
	 * 次のプロバイダーに切り替え
	 */
	private switchToNextProvider(): void {
		this.currentProviderIndex = (this.currentProviderIndex + 1) % this.providers.length;

		if (LOGGING_CONFIG.enableDebugLogs) {
			console.log('🔄 Switched to provider index:', this.currentProviderIndex);
		}
	}

	/**
	 * RPC接続テスト
	 */
	public async testConnection(): Promise<{ success: boolean; blockNumber?: number; error?: string }> {
		try {
			const provider = this.getCurrentProvider();
			const blockNumber = await provider.getBlockNumber();

			if (LOGGING_CONFIG.enableDebugLogs) {
				console.log('✅ RPC connection test successful, block number:', blockNumber);
			}

			return { success: true, blockNumber };
		} catch (error) {
			console.error('❌ RPC connection test failed:', error);

			// 他のプロバイダーを試す
			const originalIndex = this.currentProviderIndex;
			let attempts = 0;

			while (attempts < this.providers.length - 1) {
				this.switchToNextProvider();
				attempts++;

				try {
					const provider = this.getCurrentProvider();
					const blockNumber = await provider.getBlockNumber();

					if (LOGGING_CONFIG.enableDebugLogs) {
						console.log('✅ Fallback RPC connection successful, block number:', blockNumber);
					}

					return { success: true, blockNumber };
				} catch (fallbackError) {
					console.warn('⚠️ Fallback RPC also failed:', fallbackError);
				}
			}

			// 元のプロバイダーに戻す
			this.currentProviderIndex = originalIndex;

			return {
				success: false,
				error: error instanceof Error ? error.message : 'Unknown RPC error'
			};
		}
	}

	/**
	 * アドレスの残高取得
	 */
	public async getBalance(address: string): Promise<string> {
		try {
			if (!ethers.isAddress(address)) {
				throw new Error(`Invalid address: ${address}`);
			}

			const provider = this.getCurrentProvider();
			const balance = await provider.getBalance(address);

			if (LOGGING_CONFIG.enableDebugLogs) {
				console.log('💰 Balance for', address, ':', weiToAVAX(balance.toString()), 'AVAX');
			}

			return balance.toString();
		} catch (error) {
			console.error('❌ Error getting balance:', error);
			throw this.createAvalancheError('RPC_CONNECTION_FAILED', 'Failed to get balance', error);
		}
	}

	/**
	 * アドレスに対する支払いチェック
	 */
	public async checkPayment(
		address: string,
		expectedAmountWei: string,
		fromBlock?: number
	): Promise<BalanceCheckResult> {
		try {
			// 現在残高取得
			const currentBalanceWei = await this.getBalance(address);
			const currentBalanceAVAX = weiToAVAX(currentBalanceWei);
			const requiredAmountAVAX = weiToAVAX(expectedAmountWei);

			// 金額比較
			const currentBalance = BigInt(currentBalanceWei);
			const requiredAmount = BigInt(expectedAmountWei);

			const hasReceived = currentBalance >= requiredAmount;
			const isExactMatch = currentBalance === requiredAmount;
			const isOverpayment = currentBalance > requiredAmount;

			const result: BalanceCheckResult = {
				currentBalance: currentBalanceWei,
				currentBalanceAVAX,
				requiredAmount: expectedAmountWei,
				requiredAmountAVAX,
				hasReceived,
				isExactMatch,
				isOverpayment,
				receivedAmount: hasReceived ? currentBalanceWei : '0'
			};

			if (LOGGING_CONFIG.enableDebugLogs) {
				console.log('💳 Payment check result:', {
					address: address.substring(0, 10) + '...',
					hasReceived,
					currentBalanceAVAX,
					requiredAmountAVAX
				});
			}

			return result;
		} catch (error) {
			console.error('❌ Error checking payment:', error);
			throw this.createAvalancheError('PAYMENT_MONITORING_FAILED', 'Failed to check payment', error);
		}
	}

	/**
	 * トランザクション情報取得
	 */
	public async getTransactionInfo(txHash: string): Promise<TransactionInfo | null> {
		try {
			if (!txHash.startsWith('0x') || txHash.length !== 66) {
				throw new Error(`Invalid transaction hash: ${txHash}`);
			}

			const provider = this.getCurrentProvider();

			// トランザクション取得
			const tx = await provider.getTransaction(txHash);
			if (!tx) {
				return null;
			}

			// レシート取得（確認済みトランザクションの場合）
			const receipt = await provider.getTransactionReceipt(txHash);

			// 現在のブロック番号取得
			const currentBlock = await provider.getBlockNumber();

			const confirmations = tx.blockNumber ? currentBlock - tx.blockNumber + 1 : 0;

			const txInfo: TransactionInfo = {
				hash: tx.hash,
				blockNumber: tx.blockNumber,
				confirmations,
				from: tx.from,
				to: tx.to || '',
				value: tx.value.toString(),
				gasPrice: tx.gasPrice?.toString() || '0',
				gasUsed: receipt?.gasUsed?.toString(),
				status: receipt?.status ?? null,
				timestamp: tx.blockNumber ? (await provider.getBlock(tx.blockNumber))?.timestamp : undefined
			};

			if (LOGGING_CONFIG.enableDebugLogs) {
				console.log('📋 Transaction info retrieved:', {
					hash: txHash.substring(0, 10) + '...',
					confirmations,
					status: txInfo.status
				});
			}

			return txInfo;
		} catch (error) {
			console.error('❌ Error getting transaction info:', error);
			throw this.createAvalancheError('RPC_CONNECTION_FAILED', 'Failed to get transaction info', error);
		}
	}

	/**
	 * 最新ブロック番号取得
	 */
	public async getLatestBlockNumber(): Promise<number> {
		try {
			const provider = this.getCurrentProvider();
			const blockNumber = await provider.getBlockNumber();

			if (LOGGING_CONFIG.enableDebugLogs) {
				console.log('📦 Latest block number:', blockNumber);
			}

			return blockNumber;
		} catch (error) {
			console.error('❌ Error getting latest block number:', error);
			throw this.createAvalancheError('RPC_CONNECTION_FAILED', 'Failed to get latest block number', error);
		}
	}

	/**
	 * ガス価格取得
	 */
	public async getGasPrice(): Promise<string> {
		try {
			const provider = this.getCurrentProvider();
			const feeData = await provider.getFeeData();

			// EIP-1559対応: maxFeePerGas を優先、フォールバックでgasPrice
			const gasPrice = feeData.maxFeePerGas || feeData.gasPrice || BigInt(GAS_CONFIG.maxFeePerGas);

			if (LOGGING_CONFIG.enableDebugLogs) {
				console.log('⛽ Current gas price:', ethers.formatUnits(gasPrice, 'gwei'), 'gwei');
			}

			return gasPrice.toString();
		} catch (error) {
			console.error('❌ Error getting gas price:', error);
			// フォールバック値を返す
			return GAS_CONFIG.maxFeePerGas;
		}
	}

	/**
	 * アドレスのトランザクション履歴取得（制限付き）
	 */
	public async getRecentTransactions(
		address: string,
		fromBlock: number = 0,
		toBlock: number | 'latest' = 'latest'
	): Promise<TransactionInfo[]> {
		try {
			const provider = this.getCurrentProvider();

			// 受信トランザクションを検索
			const filter = {
				address: null,
				topics: null,
				fromBlock,
				toBlock
			};

			// 注意: この方法は効率的ではないため、本番環境では別のアプローチを検討
			console.warn('⚠️ getRecentTransactions は開発用です。本番環境では Indexing Service を使用してください。');

			return [];
		} catch (error) {
			console.error('❌ Error getting recent transactions:', error);
			return [];
		}
	}

	/**
	 * ネットワーク情報取得
	 */
	public async getNetworkInfo(): Promise<{ chainId: number; name: string; blockNumber: number }> {
		try {
			const provider = this.getCurrentProvider();
			const network = await provider.getNetwork();
			const blockNumber = await provider.getBlockNumber();

			const networkInfo = {
				chainId: Number(network.chainId),
				name: network.name,
				blockNumber
			};

			if (LOGGING_CONFIG.enableDebugLogs) {
				console.log('🌐 Network info:', networkInfo);
			}

			return networkInfo;
		} catch (error) {
			console.error('❌ Error getting network info:', error);
			throw this.createAvalancheError('RPC_CONNECTION_FAILED', 'Failed to get network info', error);
		}
	}

	/**
	 * エラーオブジェクト作成
	 */
	private createAvalancheError(
		code: 'RPC_CONNECTION_FAILED' | 'PAYMENT_MONITORING_FAILED',
		message: string,
		details?: any
	): DemoPaymentError {
		return {
			code,
			message,
			details,
			timestamp: new Date()
		};
	}
}

/**
 * シングルトンインスタンス
 */
let rpcManagerInstance: AvalancheRPCManager | null = null;

/**
 * RPC マネージャー取得（シングルトン）
 */
export function getAvalancheRPC(): AvalancheRPCManager {
	if (!rpcManagerInstance) {
		rpcManagerInstance = new AvalancheRPCManager();
	}
	return rpcManagerInstance;
}

/**
 * 簡単な残高チェック（便利関数）
 */
export async function checkAddressBalance(address: string): Promise<string> {
	const rpc = getAvalancheRPC();
	return await rpc.getBalance(address);
}

/**
 * 簡単な支払いチェック（便利関数）
 */
export async function checkPaymentReceived(
	address: string,
	expectedAmountWei: string
): Promise<boolean> {
	const rpc = getAvalancheRPC();
	const result = await rpc.checkPayment(address, expectedAmountWei);
	return result.hasReceived;
}

/**
 * RPC接続状態チェック
 */
export async function checkRPCHealth(): Promise<{ healthy: boolean; blockNumber?: number; error?: string }> {
	try {
		const rpc = getAvalancheRPC();
		const testResult = await rpc.testConnection();
		return {
			healthy: testResult.success,
			blockNumber: testResult.blockNumber,
			error: testResult.error
		};
	} catch (error) {
		return {
			healthy: false,
			error: error instanceof Error ? error.message : 'Unknown error'
		};
	}
}-e 
### FILE: ./src/app/api/utils/payment-monitor.ts

// src/app/api/utils/payment-monitor.ts
import { Timestamp, doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
	DemoInvoiceDocument,
	DemoInvoiceStatus,
	DemoPaymentError
} from '../../../../types/demo-payment';
import {
	FIRESTORE_COLLECTIONS,
	PAYMENT_MONITOR_CONFIG,
	AVALANCHE_FUJI_CONFIG,
	LOGGING_CONFIG
} from '@/lib/avalanche-config';
import { getAvalancheRPC } from './avalanche';

/**
 * 決済監視結果
 */
export interface PaymentMonitorResult {
	invoiceId: string;
	status: DemoInvoiceStatus;
	hasPayment: boolean;
	transactionHash?: string;
	blockNumber?: number;
	confirmations?: number;
	paidAmount?: string;
	timeRemaining?: number; // seconds
	error?: string;
}

/**
 * 決済監視クラス
 */
export class PaymentMonitor {
	private rpc = getAvalancheRPC();

	/**
	 * Invoice情報をFirestoreから取得
	 */
	private async getInvoiceFromFirestore(invoiceId: string): Promise<DemoInvoiceDocument | null> {
		try {
			const docRef = doc(db, FIRESTORE_COLLECTIONS.DEMO_INVOICES, invoiceId);
			const docSnap = await getDoc(docRef);

			if (!docSnap.exists()) {
				return null;
			}

			const data = docSnap.data() as DemoInvoiceDocument;

			if (LOGGING_CONFIG.enableDebugLogs) {
				console.log('📄 Retrieved invoice from Firestore:', {
					invoiceId,
					status: data.status,
					address: data.paymentAddress.substring(0, 10) + '...'
				});
			}

			return data;
		} catch (error) {
			console.error('❌ Error retrieving invoice from Firestore:', error);
			throw this.createMonitorError('FIRESTORE_ERROR', 'Failed to retrieve invoice', error);
		}
	}

	/**
	 * Invoiceステータスを更新
	 */
	private async updateInvoiceStatus(
		invoiceId: string,
		updates: Partial<DemoInvoiceDocument>
	): Promise<void> {
		try {
			const docRef = doc(db, FIRESTORE_COLLECTIONS.DEMO_INVOICES, invoiceId);

			// updatedAtタイムスタンプを追加
			const updateData = {
				...updates,
				updatedAt: Timestamp.now()
			};

			await updateDoc(docRef, updateData);

			if (LOGGING_CONFIG.enableDebugLogs) {
				console.log('💾 Updated invoice status:', { invoiceId, updates: Object.keys(updates) });
			}
		} catch (error) {
			console.error('❌ Error updating invoice status:', error);
			throw this.createMonitorError('FIRESTORE_ERROR', 'Failed to update invoice status', error);
		}
	}

	/**
	 * Invoice期限切れチェック
	 */
	private checkInvoiceExpiry(invoice: DemoInvoiceDocument): boolean {
		const now = new Date();
		const expiresAt = invoice.expiresAt instanceof Timestamp
			? invoice.expiresAt.toDate()
			: new Date(invoice.expiresAt as any);

		return now > expiresAt;
	}

	/**
	 * 残り時間計算（秒）
	 */
	private calculateTimeRemaining(invoice: DemoInvoiceDocument): number {
		const now = new Date();
		const expiresAt = invoice.expiresAt instanceof Timestamp
			? invoice.expiresAt.toDate()
			: new Date(invoice.expiresAt as any);

		const remainingMs = expiresAt.getTime() - now.getTime();
		return Math.max(0, Math.floor(remainingMs / 1000));
	}

	/**
	 * アドレスの受信履歴をチェック（簡易版）
	 */
	private async scanForIncomingTransactions(
		address: string,
		expectedAmountWei: string
	): Promise<{ found: boolean; txHash?: string; blockNumber?: number; amount?: string }> {
		try {
			// 現在の残高チェック
			const balance = await this.rpc.getBalance(address);
			const expectedAmount = BigInt(expectedAmountWei);
			const currentBalance = BigInt(balance);

			if (currentBalance >= expectedAmount) {
				// 残高が期待値以上の場合、支払いありと判定
				// 注意: 実際のトランザクションハッシュ取得には別途実装が必要

				if (LOGGING_CONFIG.enableDebugLogs) {
					console.log('💰 Payment detected by balance check:', {
						address: address.substring(0, 10) + '...',
						expectedAmount: expectedAmountWei,
						currentBalance: balance,
						hasPayment: true
					});
				}

				return {
					found: true,
					amount: balance,
					// 注意: 実際の実装では、トランザクション履歴APIまたはイベントログを使用
					txHash: undefined,
					blockNumber: undefined
				};
			}

			return { found: false };
		} catch (error) {
			console.error('❌ Error scanning for transactions:', error);
			throw this.createMonitorError('PAYMENT_MONITORING_FAILED', 'Failed to scan for transactions', error);
		}
	}

	/**
	 * 特定のトランザクションの確認数チェック
	 */
	private async checkTransactionConfirmations(txHash: string): Promise<number> {
		try {
			const txInfo = await this.rpc.getTransactionInfo(txHash);

			if (!txInfo || !txInfo.blockNumber) {
				return 0;
			}

			return txInfo.confirmations;
		} catch (error) {
			console.error('❌ Error checking transaction confirmations:', error);
			return 0;
		}
	}

	/**
	 * メイン決済監視関数
	 */
	public async monitorPayment(invoiceId: string): Promise<PaymentMonitorResult> {
		try {
			// Invoiceデータ取得
			const invoice = await this.getInvoiceFromFirestore(invoiceId);

			if (!invoice) {
				return {
					invoiceId,
					status: 'error',
					hasPayment: false,
					error: 'Invoice not found'
				};
			}

			// 期限切れチェック
			if (this.checkInvoiceExpiry(invoice)) {
				// 期限切れの場合、ステータス更新
				if (invoice.status === 'pending') {
					await this.updateInvoiceStatus(invoiceId, { status: 'expired' });
				}

				return {
					invoiceId,
					status: 'expired',
					hasPayment: false,
					timeRemaining: 0
				};
			}

			// 残り時間計算
			const timeRemaining = this.calculateTimeRemaining(invoice);

			// すでに完了している場合
			if (invoice.status === 'completed') {
				return {
					invoiceId,
					status: 'completed',
					hasPayment: true,
					transactionHash: invoice.transactionHash,
					blockNumber: invoice.blockNumber,
					confirmations: invoice.confirmations,
					paidAmount: invoice.paidAmount,
					timeRemaining
				};
			}

			// トランザクション確認中の場合
			if (invoice.status === 'confirming' && invoice.transactionHash) {
				const confirmations = await this.checkTransactionConfirmations(invoice.transactionHash);

				// 十分な確認数に達した場合
				if (confirmations >= AVALANCHE_FUJI_CONFIG.confirmationBlocks) {
					await this.updateInvoiceStatus(invoiceId, {
						status: 'completed',
						confirmations,
						paidAt: Timestamp.now()
					});

					return {
						invoiceId,
						status: 'completed',
						hasPayment: true,
						transactionHash: invoice.transactionHash,
						blockNumber: invoice.blockNumber,
						confirmations,
						paidAmount: invoice.paidAmount,
						timeRemaining
					};
				} else {
					// まだ確認中
					await this.updateInvoiceStatus(invoiceId, { confirmations });

					return {
						invoiceId,
						status: 'confirming',
						hasPayment: true,
						transactionHash: invoice.transactionHash,
						blockNumber: invoice.blockNumber,
						confirmations,
						paidAmount: invoice.paidAmount,
						timeRemaining
					};
				}
			}

			// 新しい支払いをチェック（pending状態の場合）
			if (invoice.status === 'pending') {
				const paymentResult = await this.scanForIncomingTransactions(
					invoice.paymentAddress,
					invoice.amountWei
				);

				if (paymentResult.found) {
					// 支払い検出 - 確認中ステータスに更新
					const updates: Partial<DemoInvoiceDocument> = {
						status: 'confirming',
						paidAmount: paymentResult.amount,
						confirmations: 0
					};

					if (paymentResult.txHash) {
						updates.transactionHash = paymentResult.txHash;
					}
					if (paymentResult.blockNumber) {
						updates.blockNumber = paymentResult.blockNumber;
					}

					await this.updateInvoiceStatus(invoiceId, updates);

					if (LOGGING_CONFIG.enableAPILogs) {
						console.log('✅ Payment detected for invoice:', invoiceId);
					}

					return {
						invoiceId,
						status: 'confirming',
						hasPayment: true,
						transactionHash: paymentResult.txHash,
						blockNumber: paymentResult.blockNumber,
						confirmations: 0,
						paidAmount: paymentResult.amount,
						timeRemaining
					};
				}
			}

			// 支払い未検出
			return {
				invoiceId,
				status: invoice.status,
				hasPayment: false,
				timeRemaining
			};

		} catch (error) {
			console.error('❌ Payment monitoring error:', error);

			return {
				invoiceId,
				status: 'error',
				hasPayment: false,
				error: error instanceof Error ? error.message : 'Unknown monitoring error'
			};
		}
	}

	/**
	 * 複数Invoiceの一括監視
	 */
	public async monitorMultiplePayments(invoiceIds: string[]): Promise<PaymentMonitorResult[]> {
		try {
			// 並列処理で効率化
			const promises = invoiceIds.map(id => this.monitorPayment(id));
			const results = await Promise.all(promises);

			if (LOGGING_CONFIG.enableDebugLogs) {
				console.log('📊 Bulk payment monitoring completed:', {
					total: invoiceIds.length,
					completed: results.filter(r => r.status === 'completed').length,
					pending: results.filter(r => r.status === 'pending').length
				});
			}

			return results;
		} catch (error) {
			console.error('❌ Bulk payment monitoring error:', error);
			throw this.createMonitorError('PAYMENT_MONITORING_FAILED', 'Failed to monitor multiple payments', error);
		}
	}

	/**
	 * 期限切れInvoiceの一括更新
	 */
	public async expireOldInvoices(): Promise<{ expiredCount: number }> {
		try {
			// 注意: 実際の実装では、Firestoreクエリで期限切れInvoiceを検索
			// ここでは簡単な実装例を示す

			console.log('🧹 Starting expired invoice cleanup...');

			// TODO: Firestoreクエリで期限切れInvoiceを取得し、一括更新

			return { expiredCount: 0 };
		} catch (error) {
			console.error('❌ Error expiring old invoices:', error);
			throw this.createMonitorError('FIRESTORE_ERROR', 'Failed to expire old invoices', error);
		}
	}

	/**
	 * エラーオブジェクト作成
	 */
	private createMonitorError(
		code: 'FIRESTORE_ERROR' | 'PAYMENT_MONITORING_FAILED',
		message: string,
		details?: any
	): DemoPaymentError {
		return {
			code,
			message,
			details,
			timestamp: new Date()
		};
	}
}

/**
 * シングルトンインスタンス
 */
let paymentMonitorInstance: PaymentMonitor | null = null;

/**
 * Payment Monitor取得（シングルトン）
 */
export function getPaymentMonitor(): PaymentMonitor {
	if (!paymentMonitorInstance) {
		paymentMonitorInstance = new PaymentMonitor();
	}
	return paymentMonitorInstance;
}

/**
 * 簡単な決済チェック（便利関数）
 */
export async function checkInvoicePayment(invoiceId: string): Promise<PaymentMonitorResult> {
	const monitor = getPaymentMonitor();
	return await monitor.monitorPayment(invoiceId);
}

/**
 * 決済監視の統計情報取得
 */
export function getMonitoringStats(): {
	activeMonitors: number;
	checkInterval: number;
	confirmationBlocks: number;
} {
	return {
		activeMonitors: paymentMonitorInstance ? 1 : 0,
		checkInterval: PAYMENT_MONITOR_CONFIG.pollInterval,
		confirmationBlocks: AVALANCHE_FUJI_CONFIG.confirmationBlocks
	};
}-e 
### FILE: ./src/app/api/utils/wallet-generator.ts

// src/app/api/utils/wallet-generator.ts
import { ethers } from 'ethers';
import { generateMnemonic, mnemonicToSeedSync, validateMnemonic } from 'bip39';
import HDKey from 'hdkey';
import crypto from 'crypto';
import { GeneratedWallet, DemoPaymentError } from '../../../../types/demo-payment';
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
}-e 
### FILE: ./src/app/api/utils/qr-generator.ts

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
}-e 
### FILE: ./src/hooks/usePriceConverter.ts

// hooks/usePriceConverter.ts
'use client';

import { useMemo, useCallback } from 'react';
import { useCryptoPrices } from './useCryptoPrices';
import {
	SUPPORTED_CRYPTOS,
	SupportedCryptoSymbol,
	PriceConversionResult,
	CRYPTO_DEFAULTS
} from '../../types/crypto';

interface UsePriceConverterReturn {
	convertUSDTo: (usdAmount: number, targetCurrency: string) => number;
	formatCryptoPrice: (amount: number, currency: string) => string;
	formatUSDPrice: (amount: number) => string;
	getConversionDetails: (usdAmount: number, targetCurrency: string) => PriceConversionResult | null;
	isSupported: (currency: string) => boolean;
	getSupportedCurrencies: () => string[];
	isLoading: boolean;
	error: string | null;
	lastUpdated: Date | null;
	exchangeRates: Record<string, number>;
}

export function usePriceConverter(): UsePriceConverterReturn {
	const { prices, loading, error, lastUpdated } = useCryptoPrices();

	// Memoized exchange rates for performance
	const exchangeRates = useMemo(() => {
		const rates: Record<string, number> = {};

		Object.entries(prices).forEach(([symbol, priceData]) => {
			if (priceData.price_usd > 0) {
				rates[symbol] = priceData.price_usd;
			}
		});

		return rates;
	}, [prices]);

	// Check if currency is supported
	const isSupported = useCallback((currency: string): boolean => {
		return Object.keys(SUPPORTED_CRYPTOS).includes(currency.toUpperCase());
	}, []);

	// Get list of supported currencies
	const getSupportedCurrencies = useCallback((): string[] => {
		return Object.keys(SUPPORTED_CRYPTOS);
	}, []);

	// Convert USD amount to cryptocurrency
	const convertUSDTo = useCallback((usdAmount: number, targetCurrency: string | null): number => {
		if (!usdAmount || usdAmount <= 0) return 0;
		if (!targetCurrency) return 0; // null チェックを追加

		const currencyUpper = targetCurrency.toUpperCase();

		if (!isSupported(currencyUpper)) {
			console.warn(`Currency ${currencyUpper} is not supported`);
			return 0;
		}

		const exchangeRate = exchangeRates[currencyUpper];

		if (!exchangeRate || exchangeRate <= 0) {
			console.warn(`No exchange rate available for ${currencyUpper}`);
			return 0;
		}

		const convertedAmount = usdAmount / exchangeRate;

		// Round to appropriate decimal places
		const decimals = CRYPTO_DEFAULTS.DECIMAL_PLACES[currencyUpper as keyof typeof CRYPTO_DEFAULTS.DECIMAL_PLACES] || 4;
		return Number(convertedAmount.toFixed(decimals));
	}, [exchangeRates, isSupported]);

	// Get detailed conversion information
	const getConversionDetails = useCallback((
		usdAmount: number,
		targetCurrency: string
	): PriceConversionResult | null => {
		if (!usdAmount || usdAmount <= 0) return null;

		const currencyUpper = targetCurrency.toUpperCase();

		if (!isSupported(currencyUpper)) return null;

		const exchangeRate = exchangeRates[currencyUpper];

		if (!exchangeRate || exchangeRate <= 0) return null;

		const convertedAmount = convertUSDTo(usdAmount, currencyUpper);

		return {
			originalAmount: usdAmount,
			originalCurrency: 'USD',
			convertedAmount,
			targetCurrency: currencyUpper,
			exchangeRate,
			lastUpdated: lastUpdated || new Date()
		};
	}, [convertUSDTo, exchangeRates, isSupported, lastUpdated]);

	// Format cryptocurrency amount with appropriate precision and symbol
	const formatCryptoPrice = useCallback((amount: number, currency: string | null): string => {
		if (!amount || amount <= 0) return '0';
		if (!currency) return '0'; // null チェックを追加

		const currencyUpper = currency.toUpperCase() as SupportedCryptoSymbol;

		if (!isSupported(currencyUpper)) return amount.toString();

		const cryptoConfig = SUPPORTED_CRYPTOS[currencyUpper];
		const decimals = cryptoConfig.decimals;
		const symbol = cryptoConfig.symbol;

		// Format with appropriate decimal places
		const formattedAmount = amount.toFixed(decimals);

		// Remove trailing zeros for cleaner display
		const cleanAmount = parseFloat(formattedAmount).toString();

		return `${cleanAmount} ${symbol}`;
	}, [isSupported]);

	// Format USD amount
	const formatUSDPrice = useCallback((amount: number): string => {
		if (!amount || amount <= 0) return '$0.00';

		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD',
			minimumFractionDigits: 2,
			maximumFractionDigits: 2
		}).format(amount);
	}, []);

	// Determine loading state and error message
	const isLoading = loading;
	const errorMessage = error ? error.message : null;

	return {
		convertUSDTo,
		formatCryptoPrice,
		formatUSDPrice,
		getConversionDetails,
		isSupported,
		getSupportedCurrencies,
		isLoading,
		error: errorMessage,
		lastUpdated,
		exchangeRates
	};
}-e 
### FILE: ./src/hooks/useCryptoPrices.ts

// hooks/useCryptoPrices.ts
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { collection, onSnapshot, query, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
	CryptoPricesMap,
	CryptoPriceData,
	FirestoreCryptoPriceData,
	CryptoError,
	CryptoLoadingState,
	CRYPTO_DEFAULTS,
	SUPPORTED_CRYPTOS
} from '../../types/crypto';

interface UseCryptoPricesOptions {
	enableRealtime?: boolean;
	staleDataThreshold?: number;
	maxRetries?: number;
}

interface UseCryptoPricesReturn {
	prices: CryptoPricesMap;
	loading: boolean;
	error: CryptoError | null;
	lastUpdated: Date | null;
	isStale: boolean;
	refreshPrices: () => void;
	retryCount: number;
}

export function useCryptoPrices(options: UseCryptoPricesOptions = {}): UseCryptoPricesReturn {
	const {
		enableRealtime = true,
		staleDataThreshold = CRYPTO_DEFAULTS.STALE_DATA_THRESHOLD,
		maxRetries = CRYPTO_DEFAULTS.MAX_RETRIES
	} = options;

	// State management
	const [prices, setPrices] = useState<CryptoPricesMap>({});
	const [loadingState, setLoadingState] = useState<CryptoLoadingState>({
		isLoading: true,
		isRefreshing: false,
		lastFetch: null,
		retryCount: 0,
		maxRetries
	});
	const [error, setError] = useState<CryptoError | null>(null);
	const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

	// Refs for cleanup and avoiding memory leaks
	const unsubscribeRef = useRef<(() => void) | null>(null);
	const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

	// Convert Firestore data to frontend format
	const convertFirestoreData = useCallback((firestoreData: FirestoreCryptoPriceData): CryptoPriceData => {
		return {
			id: firestoreData.id,
			symbol: firestoreData.symbol,
			name: firestoreData.name,
			price_usd: firestoreData.price_usd,
			price_change_24h: firestoreData.price_change_24h,
			price_change_percentage_24h: firestoreData.price_change_percentage_24h,
			market_cap_usd: firestoreData.market_cap_usd,
			volume_24h_usd: firestoreData.volume_24h_usd,
			last_updated: firestoreData.last_updated instanceof Timestamp 
				? firestoreData.last_updated.toDate() 
				: new Date(firestoreData.last_updated as any),
			source: firestoreData.source
		};
	}, []);

	// Check if data is stale
	const isStale = useCallback((dataTimestamp: Date): boolean => {
		const now = new Date();
		const timeDiff = now.getTime() - dataTimestamp.getTime();
		return timeDiff > staleDataThreshold;
	}, [staleDataThreshold]);

	// Create error object
	const createError = useCallback((code: CryptoError['code'], message: string, details?: any): CryptoError => {
		return {
			code,
			message,
			details,
			timestamp: new Date()
		};
	}, []);

	// Setup Firestore listener
	const setupFirestoreListener = useCallback(() => {
		try {
			setLoadingState(prev => ({ ...prev, isLoading: true }));
			setError(null);

			const cryptoPricesQuery = query(collection(db, 'crypto_prices'));

			const unsubscribe = onSnapshot(
				cryptoPricesQuery,
				(snapshot) => {
					try {
						const newPrices: CryptoPricesMap = {};
						let mostRecentUpdate: Date | null = null;

						snapshot.docs.forEach((doc) => {
							const data = { id: doc.id, ...doc.data() } as FirestoreCryptoPriceData;
							
							// Only process supported cryptocurrencies
							if (Object.keys(SUPPORTED_CRYPTOS).includes(data.symbol)) {
								const convertedData = convertFirestoreData(data);
								newPrices[data.symbol] = convertedData;

								// Track most recent update
								if (!mostRecentUpdate || convertedData.last_updated > mostRecentUpdate) {
									mostRecentUpdate = convertedData.last_updated;
								}
							}
						});

						// Update state
						setPrices(newPrices);
						setLastUpdated(mostRecentUpdate);
						setLoadingState(prev => ({
							...prev,
							isLoading: false,
							isRefreshing: false,
							lastFetch: new Date(),
							retryCount: 0
						}));

						console.log('📊 Crypto prices updated:', Object.keys(newPrices));
					} catch (processingError) {
						console.error('Error processing crypto price data:', processingError);
						const error = createError(
							'fetch-failed',
							'Failed to process price data',
							processingError
						);
						setError(error);
						setLoadingState(prev => ({ ...prev, isLoading: false, isRefreshing: false }));
					}
				},
				(firestoreError) => {
					console.error('Firestore subscription error:', firestoreError);
					const error = createError(
						'network-error',
						'Failed to connect to price data',
						firestoreError
					);
					setError(error);
					setLoadingState(prev => ({
						...prev,
						isLoading: false,
						isRefreshing: false,
						retryCount: prev.retryCount + 1
					}));

					// Auto-retry logic
					if (loadingState.retryCount < maxRetries) {
						console.log(`🔄 Retrying crypto prices fetch (${loadingState.retryCount + 1}/${maxRetries})`);
						retryTimeoutRef.current = setTimeout(() => {
							setupFirestoreListener();
						}, Math.pow(2, loadingState.retryCount) * 1000); // Exponential backoff
					}
				}
			);

			unsubscribeRef.current = unsubscribe;
		} catch (setupError) {
			console.error('Error setting up Firestore listener:', setupError);
			const error = createError(
				'fetch-failed',
				'Failed to setup price data connection',
				setupError
			);
			setError(error);
			setLoadingState(prev => ({ ...prev, isLoading: false }));
		}
	}, [convertFirestoreData, createError, loadingState.retryCount, maxRetries]);

	// Manual refresh function
	const refreshPrices = useCallback(() => {
		console.log('🔄 Manual refresh triggered');
		setLoadingState(prev => ({ ...prev, isRefreshing: true, retryCount: 0 }));
		
		// Clean up existing listener
		if (unsubscribeRef.current) {
			unsubscribeRef.current();
			unsubscribeRef.current = null;
		}

		// Setup new listener
		setupFirestoreListener();
	}, [setupFirestoreListener]);

	// Initialize listener on mount
	useEffect(() => {
		if (enableRealtime) {
			setupFirestoreListener();
		}

		// Cleanup on unmount
		return () => {
			if (unsubscribeRef.current) {
				unsubscribeRef.current();
				unsubscribeRef.current = null;
			}
			if (retryTimeoutRef.current) {
				clearTimeout(retryTimeoutRef.current);
				retryTimeoutRef.current = null;
			}
		};
	}, [enableRealtime, setupFirestoreListener]);

	// Check for stale data
	const dataIsStale = lastUpdated ? isStale(lastUpdated) : false;

	return {
		prices,
		loading: loadingState.isLoading,
		error,
		lastUpdated,
		isStale: dataIsStale,
		refreshPrices,
		retryCount: loadingState.retryCount
	};
}-e 
### FILE: ./src/utils/errorHandling.ts

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
};-e 
### FILE: ./src/utils/userHelpers.ts

// src/utils/userHelpers.ts
import { Timestamp } from 'firebase/firestore';
import { User as FirebaseUser } from 'firebase/auth';
import { FirestoreUser, ProfileCompleteness } from '../../types/user';
import { UserProfile } from '../../types/dashboard';

/**
 * FirestoreUserを既存のUserProfile形式に変換
 */
export const convertFirestoreUserToUserProfile = (firestoreUser: FirestoreUser): UserProfile => {
	return {
		walletAddress: firestoreUser.walletAddress || firestoreUser.id,
		displayName: firestoreUser.displayName,
		totalSpent: firestoreUser.stats.totalSpent,
		totalOrders: firestoreUser.stats.totalOrders,
		rank: firestoreUser.stats.rank,
		badges: firestoreUser.stats.badges,
		joinDate: firestoreUser.createdAt instanceof Timestamp
			? firestoreUser.createdAt.toDate()
			: new Date(firestoreUser.createdAt as any)
	};
};

/**
 * Firebase UserからFirestoreUser作成時の初期データを生成
 */
export const generateInitialUserData = (firebaseUser: FirebaseUser) => {
	return {
		id: firebaseUser.uid,
		email: firebaseUser.email || '',
		displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Anonymous User',
		nickname: firebaseUser.displayName || undefined,
		profileImage: firebaseUser.photoURL || undefined,
		address: {},
		isEmailVerified: firebaseUser.emailVerified,
		isActive: true as const,
		membershipTier: 'bronze' as const,
		isProfileComplete: false,
		stats: {
			totalSpent: 0,
			totalSpentUSD: 0,
			totalOrders: 0,
			rank: 999999,
			badges: ['New Member']
		}
	};
};

/**
 * プロフィール完成度を計算
 */
export const calculateProfileCompleteness = (user: FirestoreUser): ProfileCompleteness => {
	const requiredFields = [
		'displayName',
		'address.country',
		'address.prefecture',
		'address.city',
		'address.addressLine1',
		'address.postalCode'
	];

	const missingFields: string[] = [];
	let completedFields = 0;

	// 表示名チェック
	if (!user.displayName?.trim()) {
		missingFields.push('Display Name');
	} else {
		completedFields++;
	}

	// 住所情報チェック
	const addressFields = [
		{ key: 'country', label: 'Country' },
		{ key: 'prefecture', label: 'Prefecture' },
		{ key: 'city', label: 'City' },
		{ key: 'addressLine1', label: 'Address Line 1' },
		{ key: 'postalCode', label: 'Postal Code' }
	];

	addressFields.forEach(field => {
		const value = user.address?.[field.key as keyof typeof user.address];
		if (!value || !value.trim()) {
			missingFields.push(field.label);
		} else {
			completedFields++;
		}
	});

	const totalFields = requiredFields.length;
	const completionPercentage = Math.round((completedFields / totalFields) * 100);
	const isComplete = missingFields.length === 0;

	return {
		isComplete,
		completionPercentage,
		missingFields,
		requiredFields: requiredFields as (keyof FirestoreUser)[]
	};
};

/**
 * ユーザーの表示名を取得（フォールバック付き）
 */
export const getUserDisplayName = (
	firestoreUser?: FirestoreUser | null,
	firebaseUser?: FirebaseUser | null
): string => {
	if (firestoreUser?.nickname) return firestoreUser.nickname;
	if (firestoreUser?.displayName) return firestoreUser.displayName;
	if (firebaseUser?.displayName) return firebaseUser.displayName;
	if (firebaseUser?.email) return firebaseUser.email.split('@')[0];
	return 'Anonymous User';
};

/**
 * ユーザーのアバター画像URLを取得（フォールバック付き）
 */
export const getUserAvatarUrl = (
	firestoreUser?: FirestoreUser | null,
	firebaseUser?: FirebaseUser | null
): string | null => {
	if (firestoreUser?.profileImage) return firestoreUser.profileImage;
	if (firebaseUser?.photoURL) return firebaseUser.photoURL;
	return null;
};

/**
 * ユーザーのイニシャルを取得
 */
export const getUserInitials = (
	firestoreUser?: FirestoreUser | null,
	firebaseUser?: FirebaseUser | null
): string => {
	const displayName = getUserDisplayName(firestoreUser, firebaseUser);
	return displayName[0].toUpperCase();
};

/**
 * メンバーシップティアの表示用ラベルを取得
 */
export const getMembershipTierLabel = (tier: FirestoreUser['membershipTier']): string => {
	const labels = {
		bronze: '🥉 Bronze',
		silver: '🥈 Silver',
		gold: '🥇 Gold',
		platinum: '💎 Platinum'
	};
	return labels[tier];
};

/**
 * メンバーシップティアの色を取得
 */
export const getMembershipTierColor = (tier: FirestoreUser['membershipTier']): string => {
	const colors = {
		bronze: 'text-amber-600',
		silver: 'text-gray-400',
		gold: 'text-yellow-400',
		platinum: 'text-cyan-400'
	};
	return colors[tier];
};

/**
 * 統計データをフォーマット
 */
export const formatUserStats = (stats: FirestoreUser['stats']) => {
	return {
		totalSpentFormatted: `Ξ ${stats.totalSpent.toFixed(3)}`,
		totalSpentUSDFormatted: `$${stats.totalSpentUSD.toLocaleString()}`,
		rankFormatted: `#${stats.rank.toLocaleString()}`,
		badgeCount: stats.badges.length
	};
};

/**
 * 住所を1行のテキストにフォーマット
 */
export const formatAddress = (address?: FirestoreUser['address']): string => {
	if (!address) return 'No address provided';

	const parts = [
		address.addressLine1,
		address.addressLine2,
		address.city,
		address.prefecture,
		address.postalCode,
		address.country
	].filter(Boolean);

	return parts.length > 0 ? parts.join(', ') : 'No address provided';
};

/**
 * 日付をフォーマット
 */
export const formatDate = (timestamp: Timestamp | Date | string): string => {
	let date: Date;

	if (timestamp instanceof Timestamp) {
		date = timestamp.toDate();
	} else if (timestamp instanceof Date) {
		date = timestamp;
	} else {
		date = new Date(timestamp);
	}

	return date.toLocaleDateString('en-US', {
		year: 'numeric',
		month: 'short',
		day: 'numeric'
	});
};

/**
 * 相対時間をフォーマット（例：2 days ago）
 */
export const formatRelativeTime = (timestamp: Timestamp | Date | string): string => {
	let date: Date;

	if (timestamp instanceof Timestamp) {
		date = timestamp.toDate();
	} else if (timestamp instanceof Date) {
		date = timestamp;
	} else {
		date = new Date(timestamp);
	}

	const now = new Date();
	const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

	if (diffInSeconds < 60) return 'Just now';
	if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
	if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
	if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} days ago`;

	return formatDate(date);
};-e 
### FILE: ./src/utils/validation.ts

// src/utils/validation.ts
import { FirestoreUser, UpdateUserProfile } from '../../types/user';

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
};-e 
### FILE: ./types/demo-payment.ts

// types/demo-payment.ts
import { Timestamp } from 'firebase/firestore';

/**
 * デモInvoiceの状態
 */
export type DemoInvoiceStatus = 
  | 'pending'     // 支払い待機中
  | 'confirming'  // ブロック確認中（1-3 confirmations）
  | 'completed'   // 支払い完了
  | 'expired'     // 期限切れ
  | 'error';      // エラー状態

/**
 * サポートされるブロックチェーン
 */
export type SupportedChain = 'avalanche-fuji';

/**
 * Avalanche FUJI ネットワーク設定
 */
export interface AvalancheConfig {
  chainId: number;
  name: string;
  rpcUrl: string;
  blockExplorer: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  faucetUrl: string;
  averageBlockTime: number; // milliseconds
  confirmationBlocks: number;
}

/**
 * デモInvoice作成リクエスト
 */
export interface CreateDemoInvoiceRequest {
  chainId?: number; // デフォルト: 43113 (FUJI)
  userAgent?: string;
  ipAddress?: string;
}

/**
 * デモInvoice作成レスポンス
 */
export interface CreateDemoInvoiceResponse {
  success: boolean;
  data?: {
    invoiceId: string;
    paymentAddress: string;
    amount: string; // AVAX amount
    amountWei: string; // Wei amount  
    chainId: number;
    qrCodeDataURL: string; // Base64 QR code image
    paymentURI: string; // EIP-681 URI
    expiresAt: string; // ISO string
    estimatedGasFee: string; // AVAX amount
  };
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

/**
 * デモInvoiceステータスレスポンス
 */
export interface DemoInvoiceStatusResponse {
  success: boolean;
  data?: {
    invoiceId: string;
    status: DemoInvoiceStatus;
    paymentAddress: string;
    amount: string;
    chainId: number;
    createdAt: string;
    expiresAt: string;
    transactionHash?: string;
    blockNumber?: number;
    confirmations?: number;
    paidAt?: string;
    timeRemaining?: number; // seconds
  };
  error?: {
    code: string;
    message: string;
  };
}

/**
 * Firestore保存用のデモInvoiceデータ
 */
export interface DemoInvoiceDocument {
  invoiceId: string;
  paymentAddress: string;
  privateKey: string; // 暗号化して保存予定
  amount: string; // AVAX amount
  amountWei: string; // Wei amount
  chainId: number;
  status: DemoInvoiceStatus;
  
  // リクエスト情報
  userAgent?: string;
  ipAddress?: string;
  
  // タイムスタンプ
  createdAt: Timestamp;
  expiresAt: Timestamp;
  
  // 支払い完了後の情報
  transactionHash?: string;
  blockNumber?: number;
  confirmations?: number;
  paidAt?: Timestamp;
  paidAmount?: string; // 実際に支払われた金額
}

/**
 * ウォレット生成結果
 */
export interface GeneratedWallet {
  address: string;
  privateKey: string;
  publicKey: string;
  index: number; // HD wallet index
  derivationPath: string;
}

/**
 * 決済監視設定
 */
export interface PaymentMonitorConfig {
  pollInterval: number; // milliseconds
  maxPollDuration: number; // milliseconds  
  confirmationBlocks: number;
  retryAttempts: number;
  backoffMultiplier: number;
}

/**
 * QRコード生成設定
 */
export interface QRCodeConfig {
  size: number;
  margin: number;
  colorDark: string;
  colorLight: string;
  errorCorrectionLevel: 'L' | 'M' | 'Q' | 'H';
}

/**
 * Rate limiting設定
 */
export interface RateLimitConfig {
  maxInvoicesPerIP: number;
  windowMinutes: number;
  maxInvoicesPerHour: number;
  cleanupIntervalMinutes: number;
}

/**
 * デモ決済エラーコード
 */
export type DemoPaymentErrorCode = 
  | 'RATE_LIMIT_EXCEEDED'
  | 'INVALID_CHAIN_ID'
  | 'WALLET_GENERATION_FAILED'
  | 'FIRESTORE_ERROR'
  | 'QR_GENERATION_FAILED'
  | 'INVOICE_NOT_FOUND'
  | 'INVOICE_EXPIRED'
  | 'RPC_CONNECTION_FAILED'
  | 'PAYMENT_MONITORING_FAILED'
  | 'INVALID_TRANSACTION'
  | 'INSUFFICIENT_CONFIRMATIONS';

/**
 * デモ決済エラー
 */
export interface DemoPaymentError {
  code: DemoPaymentErrorCode;
  message: string;
  details?: any;
  timestamp: Date;
  invoiceId?: string;
}

/**
 * 統計データ（analytics用）
 */
export interface DemoAnalytics {
  date: string; // YYYY-MM-DD
  invoicesGenerated: number;
  invoicesCompleted: number;
  invoicesExpired: number;
  averageCompletionTime: number; // seconds
  totalAmountPaid: string; // AVAX
  uniqueIPs: number;
  popularTimeSlots: Record<string, number>; // hour -> count
}

/**
 * フロントエンド用のUI状態
 */
export interface DemoPaymentUIState {
  status: 'idle' | 'generating' | 'waiting' | 'confirming' | 'completed' | 'expired' | 'error';
  invoiceId?: string;
  paymentAddress?: string;
  qrCodeDataURL?: string;
  paymentURI?: string;
  timeRemaining?: number; // seconds
  confirmations?: number;
  transactionHash?: string;
  errorMessage?: string;
  isPolling: boolean;
}-e 
### FILE: ./types/product.ts

// types/product.ts
import { Timestamp } from 'firebase/firestore';

// Firestoreで管理する商品データの型
export interface FirestoreProduct {
  id: string;
  name: string;
  description: string;
  
  // 価格情報
  price: {
    usd: number;
    eth?: number; // ETH価格（自動計算可能）
  };
  
  // 在庫管理
  inventory: {
    totalStock: number;      // 総在庫数
    availableStock: number;  // 利用可能在庫数
    reservedStock: number;   // 予約済み在庫数（カート内商品）
  };
  
  // メタデータ
  metadata: {
    rating: number;
    reviewCount: number;
    features: string[];
    nutritionFacts: Record<string, string>;
    images: string[];
    tags: string[];
  };
  
  // 設定
  settings: {
    maxOrderQuantity: number;
    minOrderQuantity: number;
    isActive: boolean;
    category: string;
    sku: string;
  };
  
  // タイムスタンプ
  timestamps: {
    createdAt: Timestamp;
    updatedAt: Timestamp;
  };
}

// 商品作成用の型
export interface CreateProductData {
  name: string;
  description: string;
  price: {
    usd: number;
  };
  inventory: {
    totalStock: number;
    availableStock: number;
    reservedStock: 0;
  };
  metadata: {
    rating: number;              // 0 から number に変更
    reviewCount: number;         // 0 から number に変更
    features: string[];
    nutritionFacts: Record<string, string>;
    images: string[];
    tags: string[];
  };
  settings: {
    maxOrderQuantity: number;
    minOrderQuantity: 1;
    isActive: boolean;
    category: string;
    sku: string;
  };
}

// 商品更新用の部分型
export interface UpdateProductData {
  name?: string;
  description?: string;
  price?: Partial<FirestoreProduct['price']>;
  metadata?: Partial<FirestoreProduct['metadata']>;
  settings?: Partial<FirestoreProduct['settings']>;
}

// 在庫更新用の型
export interface UpdateInventoryData {
  totalStock?: number;
  availableStock?: number;
  reservedStock?: number;
}

// カート予約の型
export interface CartReservation {
  id: string;                    // 予約ID（ユニーク）
  userId?: string;               // ユーザーID（ログイン済みの場合）
  sessionId: string;             // セッションID（匿名ユーザー用）
  productId: string;
  quantity: number;
  
  // タイムスタンプ
  createdAt: Timestamp;
  expiresAt: Timestamp;          // 予約期限（15分後）
  
  // 状態
  status: 'active' | 'expired' | 'confirmed' | 'cancelled';
}

// 在庫チェック結果の型
export interface StockCheckResult {
  productId: string;
  requestedQuantity: number;
  
  // 在庫状況
  totalStock: number;
  availableStock: number;
  reservedStock: number;
  
  // チェック結果
  canReserve: boolean;
  maxCanReserve: number;
  
  // 制限理由
  limitReasons: {
    exceedsStock: boolean;
    exceedsOrderLimit: boolean;
    productInactive: boolean;
  };
  
  // 既存予約情報
  existingReservation?: {
    quantity: number;
    expiresAt: Timestamp;
  };
}

// 商品フィルター・検索用の型
export interface ProductFilters {
  category?: string;
  isActive?: boolean;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  tags?: string[];
  searchQuery?: string;
}

// 商品ソート用の型
export interface ProductSortOptions {
  field: 'name' | 'price.usd' | 'metadata.rating' | 'timestamps.createdAt' | 'inventory.availableStock';
  direction: 'asc' | 'desc';
}

// 商品リスト取得のオプション
export interface GetProductsOptions {
  filters?: ProductFilters;
  sort?: ProductSortOptions;
  limit?: number;
  offset?: number;
}

// ダッシュボード表示用に簡略化された商品型
export interface ProductSummary {
  id: string;
  name: string;
  price: number;
  availableStock: number;
  isActive: boolean;
  category: string;
  rating: number;
  image?: string;
}

// 商品詳細表示用の型（FirestoreProductの表示用ラッパー）
export interface ProductDetails {
  id: string;
  name: string;
  description: string;
  price: {
    usd: number;
    formatted: string;
  };
  inventory: {
    inStock: number;
    isAvailable: boolean;
    stockLevel: 'high' | 'medium' | 'low' | 'out';
  };
  metadata: {
    rating: number;
    reviewCount: number;
    features: string[];
    nutritionFacts: Record<string, string>;
    images: string[];
    tags: string[];
  };
  settings: {
    maxOrderQuantity: number;
    minOrderQuantity: number;
  };
  timestamps: {
    createdAt: Date;
    updatedAt: Date;
  };
}

// バッチ処理用の型
export interface BatchInventoryUpdate {
  productId: string;
  updates: UpdateInventoryData;
}

// 統計・分析用の型
export interface ProductAnalytics {
  productId: string;
  views: number;
  cartAdditions: number;
  purchases: number;
  conversionRate: number;
  averageRating: number;
  totalRevenue: number;
  period: {
    from: Date;
    to: Date;
  };
}

// エラー型
export interface ProductError {
  code: 'not-found' | 'insufficient-stock' | 'reservation-expired' | 'product-inactive' | 'validation-error';
  message: string;
  productId?: string;
  requestedQuantity?: number;
  availableStock?: number;
}-e 
### FILE: ./types/react-three-fiber.d.ts

// types/react-three-fiber.d.ts
import { ReactThreeFiber } from '@react-three/fiber'
import * as THREE from 'three'

declare global {
  namespace JSX {
    interface IntrinsicElements {
      mesh: ReactThreeFiber.Object3DNode<THREE.Mesh, typeof THREE.Mesh>
      group: ReactThreeFiber.Object3DNode<THREE.Group, typeof THREE.Group>
      planeGeometry: ReactThreeFiber.Node<THREE.PlaneGeometry, typeof THREE.PlaneGeometry>
      boxGeometry: ReactThreeFiber.Node<THREE.BoxGeometry, typeof THREE.BoxGeometry>
      sphereGeometry: ReactThreeFiber.Node<THREE.SphereGeometry, typeof THREE.SphereGeometry>
      meshBasicMaterial: ReactThreeFiber.Node<THREE.MeshBasicMaterial, typeof THREE.MeshBasicMaterial>
      meshStandardMaterial: ReactThreeFiber.Node<THREE.MeshStandardMaterial, typeof THREE.MeshStandardMaterial>
      ambientLight: ReactThreeFiber.Object3DNode<THREE.AmbientLight, typeof THREE.AmbientLight>
      directionalLight: ReactThreeFiber.Object3DNode<THREE.DirectionalLight, typeof THREE.DirectionalLight>
      spotLight: ReactThreeFiber.Object3DNode<THREE.SpotLight, typeof THREE.SpotLight>
      pointLight: ReactThreeFiber.Object3DNode<THREE.PointLight, typeof THREE.PointLight>
    }
  }
}

export {}-e 
### FILE: ./types/crypto.ts

// types/crypto.ts
import { Timestamp } from 'firebase/firestore';

// Firestore crypto_prices コレクションの型定義
export interface FirestoreCryptoPriceData {
	id: string;
	symbol: string;
	name: string;
	price_usd: number;
	price_change_24h: number;
	price_change_percentage_24h: number;
	market_cap_usd: number;
	volume_24h_usd: number;
	last_updated: Timestamp;
	source: 'coingecko';
}

// フロントエンド用に変換された価格データ
export interface CryptoPriceData {
	id: string;
	symbol: string;
	name: string;
	price_usd: number;
	price_change_24h: number;
	price_change_percentage_24h: number;
	market_cap_usd: number;
	volume_24h_usd: number;
	last_updated: Date;
	source: string;
}

// 価格データのマップ型
export interface CryptoPricesMap {
	[symbol: string]: CryptoPriceData;
}

// 暗号通貨メタデータ
export interface CryptoMetadata {
	supported_currencies: string[];
	update_frequency_minutes: number;
	last_sync_timestamp: Timestamp;
	sync_status: 'success' | 'error' | 'in_progress';
	error_message?: string;
	coingecko_rate_limit_remaining?: number;
	total_api_calls_today?: number;
}

// サポートされている暗号通貨の設定
export const SUPPORTED_CRYPTOS = {
	BTC: {
		id: 'bitcoin',
		symbol: 'BTC',
		name: 'Bitcoin',
		icon: '₿',
		decimals: 6,
		color: '#F7931A'
	},
	ETH: {
		id: 'ethereum',
		symbol: 'ETH',
		name: 'Ethereum',
		icon: 'Ξ',
		decimals: 4,
		color: '#627EEA'
	},
	SOL: {
		id: 'solana',
		symbol: 'SOL',
		name: 'Solana',
		icon: '◎',
		decimals: 4,
		color: '#14F195'
	},
	AVAX: {
		id: 'avalanche-2',
		symbol: 'AVAX',
		name: 'Avalanche',
		icon: '🔺',
		decimals: 4,
		color: '#E84142'
	},
	SUI: {
		id: 'sui',
		symbol: 'SUI',
		name: 'Sui Network',
		icon: '💧',
		decimals: 4,
		color: '#4DA2FF'
	}
} as const;

export type SupportedCryptoSymbol = keyof typeof SUPPORTED_CRYPTOS;

// Firestore操作の結果型
export interface CryptoFetchResult {
	success: boolean;
	data?: CryptoPricesMap;
	error?: string;
	lastUpdated?: Date;
}

// 価格変換の結果型
export interface PriceConversionResult {
	originalAmount: number;
	originalCurrency: 'USD';
	convertedAmount: number;
	targetCurrency: string;
	exchangeRate: number;
	lastUpdated: Date;
}

// エラーハンドリング用の型
export interface CryptoError {
	code: 'fetch-failed' | 'conversion-failed' | 'unsupported-currency' | 'stale-data' | 'network-error';
	message: string;
	details?: any;
	timestamp: Date;
}

// ローディング状態の管理
export interface CryptoLoadingState {
	isLoading: boolean;
	isRefreshing: boolean;
	lastFetch: Date | null;
	retryCount: number;
	maxRetries: number;
}

// リアルタイム購読の設定
export interface CryptoSubscriptionOptions {
	enableRealtime: boolean;
	refreshInterval?: number; // milliseconds
	staleDataThreshold?: number; // milliseconds
	autoRetry: boolean;
	maxRetries?: number;
}

// デフォルトの設定値
export const CRYPTO_DEFAULTS = {
	REFRESH_INTERVAL: 30000, // 30秒
	STALE_DATA_THRESHOLD: 300000, // 5分
	MAX_RETRIES: 3,
	DECIMAL_PLACES: {
		BTC: 6,
		ETH: 4,
		SOL: 4,
		AVAX: 4,
		SUI: 4,
		USD: 2
	}
} as const;-e 
### FILE: ./types/dashboard.ts

// types/dashboard.ts
export type SectionType = 'shop' | 'how-to-buy' | 'whitepaper' | 'profile' | 'cart';

export interface DashboardState {
	activeSection: SectionType | null;
	isSlideOpen: boolean;
	cartItems: CartItem[];
	userProfile: UserProfile | null;
	walletConnected: boolean;
}

export interface DashboardCardProps {
	id: SectionType;
	title: string;
	description: string;
	icon: React.ReactNode;
	stats?: string;
	badge?: string;
	onClick: (section: SectionType) => void;
	className?: string;
}

export interface CartItem {
	id: string;
	name: string;
	price: number;
	quantity: number;
	currency: 'BTC' | 'ETH' | 'SOL' | 'AVAX' | 'SUI'; // 更新: 新しい暗号通貨に対応
	image?: string;
}

export interface UserProfile {
	walletAddress: string;
	displayName?: string;
	totalSpent: number;
	totalOrders: number;
	rank: number;
	badges: string[];
	joinDate: Date;
}

export interface SlideInPanelProps {
	isOpen: boolean;
	onClose: () => void;
	title: string;
	children: React.ReactNode;
	className?: string;
}

export interface PurchaseRecord {
	rank: number;
	walletAddress: string;
	displayAddress: string; // 部分匿名化されたアドレス
	totalSpent: number;
	totalSpentUSD: number;
	purchaseCount: number;
	lastPurchase: Date;
	txHashes: string[];
	badges?: string[];
	isCurrentUser?: boolean;
}

export interface FilterOptions {
	period: 'today' | 'week' | 'month' | 'all';
	minAmount?: number;
	maxAmount?: number;
	sortBy: 'amount' | 'count' | 'date';
	sortOrder: 'asc' | 'desc';
}

// 新規追加: 暗号通貨価格関連の型定義
export interface CryptoPriceData {
	id: string;
	symbol: string;
	name: string;
	price_usd: number;
	price_change_24h: number;
	price_change_percentage_24h: number;
	market_cap_usd: number;
	volume_24h_usd: number;
	last_updated: Date;
	source: string;
}

export interface CryptoPricesMap {
	[symbol: string]: CryptoPriceData;
}

export interface UseCryptoPricesReturn {
	prices: CryptoPricesMap;
	loading: boolean;
	error: string | null;
	lastUpdated: Date | null;
	refreshPrices: () => void;
}

export interface UsePriceConverterReturn {
	convertUSDTo: (usdAmount: number, targetCurrency: string) => number;
	formatCryptoPrice: (amount: number, currency: string) => string;
	formatUSDPrice: (amount: number) => string;
	isSupported: (currency: string) => boolean;
	isLoading: boolean;
	error: string | null;
}

export interface PriceDisplayProps {
	usdAmount: number;
	selectedCurrency: string;
	showBoth?: boolean;
	showChange?: boolean;
	size?: 'sm' | 'md' | 'lg';
	className?: string;
}

// 支払い方法のマッピング
export const PAYMENT_METHODS = {
	SOL: { name: 'Solana', symbol: 'SOL', icon: '◎' },
	BTC: { name: 'Lightning', symbol: 'BTC', icon: '₿' },
	AVAX: { name: 'Avalanche c-chain', symbol: 'AVAX', icon: '🔺' },
	SUI: { name: 'Sui', symbol: 'SUI', icon: '💧' },
	ETH: { name: 'Ethereum mainnet', symbol: 'ETH', icon: 'Ξ' },
} as const;

export type PaymentMethodKey = keyof typeof PAYMENT_METHODS;

// ★ 新規追加: Demo Payment関連の型定義
export interface DemoPaymentSettings {
	enabled: boolean;
	defaultChain: 'avalanche-fuji';
	maxConcurrentInvoices: number;
	pollingInterval: number; // milliseconds
	demoTimeout: number; // milliseconds
}

// How to Buy セクション設定
export interface HowToBuyConfig {
	enableLiveDemo: boolean;
	demoSettings: DemoPaymentSettings;
	supportedChains: string[];
	faucetLinks: Record<string, string>;
}-e 
### FILE: ./types/user.ts

// types/user.ts
import { Timestamp } from 'firebase/firestore';
import { UserProfile } from './dashboard';

// Firestoreで管理するユーザーデータの型
export interface FirestoreUser {
	id: string;                    // Firebase Auth UID
	email: string;
	displayName: string;
	nickname?: string;             // ユーザーが設定可能なニックネーム
	profileImage?: string;
	walletAddress?: string;        // 将来のウォレット連携用

	// 住所情報（初期値：空）
	address?: {
		country?: string;
		prefecture?: string;          // 都道府県
		city?: string;               // 市区町村
		addressLine1?: string;       // 番地・建物名
		addressLine2?: string;      // アパート・部屋番号等
		postalCode?: string;         // 郵便番号
		phone?: string;
	};

	// アカウント情報
	createdAt: Timestamp;
	updatedAt: Timestamp;
	lastLoginAt: Timestamp;

	// ユーザーステータス
	isEmailVerified: boolean;
	isActive: boolean;
	membershipTier: 'bronze' | 'silver' | 'gold' | 'platinum';
	isProfileComplete: boolean;     // 住所等必須情報が入力済みか

	// 統計情報
	stats: {
		totalSpent: number;         // ETH（初期値：0）
		totalSpentUSD: number;      // USD（初期値：0）
		totalOrders: number;        // 初期値：0
		rank: number;               // 初期値：999999
		badges: string[];           // 初期値：['New Member']
	};
}

// 初期ユーザー作成用の型
export interface CreateUserData {
	id: string;
	email: string;
	displayName: string;
	nickname?: string;
	profileImage?: string;
	address?: {};
	isEmailVerified: boolean;
	isActive: true;
	membershipTier: 'bronze';
	isProfileComplete: false;
	stats: {
		totalSpent: 0;
		totalSpentUSD: 0;
		totalOrders: 0;
		rank: 999999;
		badges: ['New Member'];
	};
}

// プロフィール更新用の部分型
export interface UpdateUserProfile {
	displayName?: string;
	nickname?: string;
	profileImage?: string;
	address?: Partial<FirestoreUser['address']>;
	isProfileComplete?: boolean;
}

// ユーザー統計更新用の型
export interface UpdateUserStats {
	totalSpent?: number;
	totalSpentUSD?: number;
	totalOrders?: number;
	rank?: number;
	badges?: string[];
}

// 注文データの型
export interface Order {
	id: string;                   // 注文ID
	userId: string;               // ユーザーID（Firebase Auth UID）

	// 注文情報
	products: OrderItem[];
	totalAmount: number;          // ETH
	totalAmountUSD: number;
	status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';

	// ブロックチェーン情報
	transactionHash?: string;     // トランザクションハッシュ
	blockNumber?: number;
	networkId: number;            // 1 (Ethereum), 137 (Polygon) etc.

	// 配送情報
	shippingAddress: FirestoreUser['address'];
	trackingNumber?: string;

	// タイムスタンプ
	createdAt: Timestamp;
	updatedAt: Timestamp;
	shippedAt?: Timestamp;
	deliveredAt?: Timestamp;
}

export interface OrderItem {
	productId: string;
	productName: string;
	quantity: number;
	priceETH: number;
	priceUSD: number;
}

// 既存のUserProfileとFirestoreUserの変換用ヘルパー型
export interface UserProfileAdapter {
	fromFirestoreUser: (firestoreUser: FirestoreUser) => UserProfile;
	toFirestoreUser: (userProfile: UserProfile, userId: string, email: string) => Partial<FirestoreUser>;
}

// プロフィール完成度チェック用
export interface ProfileCompleteness {
	isComplete: boolean;
	completionPercentage: number;
	missingFields: string[];
	requiredFields: (keyof FirestoreUser)[];
}-e 
### FILE: ./scripts/seedProductsAdmin.js

// scripts/seedProductsAdmin.js
const admin = require('firebase-admin');
const dotenv = require('dotenv');

// 環境変数を読み込み
dotenv.config({ path: '.env.local' });

// Admin SDK を初期化
try {
  admin.initializeApp({
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'we-are-onchain',
  });
  console.log('🔧 Using Firebase Admin SDK with project:', process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'we-are-onchain');
} catch (error) {
  console.error('❌ Firebase Admin initialization error:', error.message);
  process.exit(1);
}

const db = admin.firestore();

// 商品データ
const products = [
  {
    id: 'pepe-protein-1',
    name: 'Pepe Flavor Protein 1kg',
    description: 'Premium whey protein with the legendary Pepe flavor. Built for the blockchain generation. This high-quality protein powder delivers 25g of protein per serving and is perfect for post-workout recovery.',
    price: {
      usd: 27.8
    },
    inventory: {
      totalStock: 100,
      availableStock: 45,
      reservedStock: 0
    },
    metadata: {
      rating: 4.9,
      reviewCount: 127,
      features: [
        'Blockchain Verified Quality',
        'Community Approved Formula',
        'Meme-Powered Gains',
        'Web3 Native Nutrition',
        'Premium Whey Isolate',
        'No Artificial Colors'
      ],
      nutritionFacts: {
        protein: '25g',
        fat: '1.5g',
        carbs: '2g',
        minerals: '1g',
        allergen: 'Milk',
        calories: '120'
      },
      images: [
        '/images/pepe-protein-main.webp',
        '/images/pepe-protein-side.webp',
        '/images/pepe-protein-back.webp'
      ],
      tags: ['protein', 'whey', 'pepe', 'meme', 'premium', 'blockchain']
    },
    settings: {
      maxOrderQuantity: 10,
      minOrderQuantity: 1,
      isActive: true,
      category: 'protein',
      sku: 'PEPE-PROT-1KG-001'
    }
  },
  {
    id: 'crypto-creatine-500g',
    name: 'Crypto Creatine Monohydrate 500g',
    description: 'Pure creatine monohydrate for maximum gains. Verified on the blockchain for authenticity and purity. Each serving provides 5g of micronized creatine.',
    price: {
      usd: 19.99
    },
    inventory: {
      totalStock: 75,
      availableStock: 68,
      reservedStock: 0
    },
    metadata: {
      rating: 4.7,
      reviewCount: 89,
      features: [
        'Micronized Formula',
        'Blockchain Verified Purity',
        '99.9% Pure Creatine',
        'No Fillers Added',
        'Third-Party Tested'
      ],
      nutritionFacts: {
        creatine: '5g',
        calories: '0',
        fat: '0g',
        carbs: '0g',
        protein: '0g',
        allergen: 'None'
      },
      images: [
        '/images/crypto-creatine-main.webp'
      ],
      tags: ['creatine', 'crypto', 'pure', 'strength', 'performance']
    },
    settings: {
      maxOrderQuantity: 5,
      minOrderQuantity: 1,
      isActive: true,
      category: 'supplements',
      sku: 'CRYPTO-CREAT-500G-001'
    }
  }
];

// データ投入関数
async function seedProducts() {
  try {
    console.log('🌱 Starting product data seeding with Admin SDK...');
    
    for (const product of products) {
      const { id, ...productData } = product;
      
      // Firestoreドキュメントを作成
      const productDoc = {
        ...productData,
        timestamps: {
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }
      };
      
      await db.collection('products').doc(id).set(productDoc);
      
      console.log(`✅ Product created: ${product.name} (${id})`);
    }
    
    console.log('🎉 Product seeding completed successfully!');
    console.log(`📊 Total products added: ${products.length}`);
    
  } catch (error) {
    console.error('❌ Error seeding products:', error);
    console.error('Error details:', error.message);
    process.exit(1);
  }
}

// スクリプト実行
if (require.main === module) {
  seedProducts()
    .then(() => {
      console.log('✨ Seeding process finished');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Seeding failed:', error);
      process.exit(1);
    });
}

module.exports = { seedProducts };-e 
### FILE: ./tailwind.config.js

/** @type {import('tailwindcss').Config} */
module.exports = {
	content: [
		'./src/pages/**/*.{js,ts,jsx,tsx,mdx}',
		'./src/components/**/*.{js,ts,jsx,tsx,mdx}',
		'./src/app/**/*.{js,ts,jsx,tsx,mdx}',
	],
	theme: {
		extend: {
			colors: {
				neonGreen: '#00FF7F',
				neonOrange: '#FF6D00',
				dark: {
					100: '#111111',
					200: '#222222',
					300: '#333333',
					400: '#444444',
					500: '#555555',
				},
			},
			fontFamily: {
				sans: ['var(--font-montserrat)', 'sans-serif'],
				heading: ['var(--font-space-grotesk)', 'sans-serif'],
				pixel: ['var(--font-pixel)', 'sans-serif'],
			},
			animation: {
				glitch: 'glitch 0.2s ease-in-out infinite',
				'glitch-slow': 'glitch 2s ease-in-out infinite',
				pulse: 'pulse 2s ease-in-out infinite',
				'pulse-fast': 'pulse 1s ease-in-out infinite',
				scanline: 'scanline 8s linear infinite',
				typewriter: 'typewriter 4s steps(40) 1s infinite',
			},
			keyframes: {
				glitch: {
					'0%, 100%': { transform: 'translate(0)' },
					'20%': { transform: 'translate(-2px, 2px)' },
					'40%': { transform: 'translate(-2px, -2px)' },
					'60%': { transform: 'translate(2px, 2px)' },
					'80%': { transform: 'translate(2px, -2px)' },
				},
				pulse: {
					'0%, 100%': {
						opacity: '1',
						filter: 'brightness(1) blur(0px)',
					},
					'50%': {
						opacity: '0.8',
						filter: 'brightness(1.2) blur(1px)',
					},
				},
				scanline: {
					'0%': {
						transform: 'translateY(-100%)',
					},
					'100%': {
						transform: 'translateY(100vh)',
					},
				},
				typewriter: {
					'0%, 100%': {
						width: '0%',
					},
					'20%, 80%': {
						width: '100%',
					},
				},
			},
			transitionProperty: {
				'transform': 'transform',
			},
			transitionTimingFunction: {
				'out-sine': 'cubic-bezier(0.39, 0.575, 0.565, 1)',
			},
			// クリップパスの追加（ClipPath プラグインを使わない場合）
			clipPath: {
				'diagonal-transition': 'polygon(100% 0, 100% 100%, 0 100%, 45% 0)',
				'diagonal-transition-mobile': 'polygon(100% 0, 100% 100%, 0 100%, 35% 0)',
			},
		},
	},
	plugins: [],
}-e 
### FILE: ./postcss.config.js

module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
-e 
### FILE: ./next.config.js

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['three', '@react-three/fiber', '@react-three/drei'], // この行を追加
  images: {
    domains: [],
    formats: ["image/avif", "image/webp"],
  },
  // WebGLキャンバスサポート
  webpack: (config) => {
    config.module.rules.push({
      test: /\.(glsl|vs|fs|vert|frag)$/,
      type: "asset/source",
    });

    return config;
  },
  // 実験的機能
  experimental: {
    optimizeCss: true,
    scrollRestoration: true,
    esmExternals: 'loose', // この行も追加
  },
};

module.exports = nextConfig;-e 
### FILE: ./next-env.d.ts

/// <reference types="next" />
/// <reference types="next/image-types/global" />

// NOTE: This file should not be edited
// see https://nextjs.org/docs/basic-features/typescript for more information.

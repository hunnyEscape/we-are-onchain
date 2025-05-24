// src/contexts/AuthContext.tsx
'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
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

	// Firestore関連（新規追加）
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
	const [firestoreUnsubscribe, setFirestoreUnsubscribe] = useState<(() => void) | null>(null);

	// Firebase Auth状態変化を監視
	useEffect(() => {
		const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
			console.log('🔄 Auth state changed:', firebaseUser?.uid || 'null');

			// 既存のFirestore監視を停止
			if (firestoreUnsubscribe) {
				firestoreUnsubscribe();
				setFirestoreUnsubscribe(null);
			}

			if (firebaseUser) {
				setUser(firebaseUser);
				setFirestoreLoading(true);

				try {
					// Firebase AuthとFirestoreを同期
					await syncAuthWithFirestore(firebaseUser);

					// Firestoreユーザーデータをリアルタイム監視開始
					const unsubscribeFirestore = subscribeToUser(firebaseUser.uid, (userData) => {
						console.log('📊 Firestore user data updated:', userData?.id || 'null');
						setFirestoreUser(userData);
						setFirestoreLoading(false);
					});

					setFirestoreUnsubscribe(() => unsubscribeFirestore);

				} catch (error) {
					console.error('❌ Error syncing with Firestore:', error);
					setFirestoreUser(null);
					setFirestoreLoading(false);
				}
			} else {
				// ログアウト時の状態リセット
				setUser(null);
				setFirestoreUser(null);
				setFirestoreLoading(false);
			}

			setLoading(false);
		});

		return () => {
			unsubscribe();
			if (firestoreUnsubscribe) {
				firestoreUnsubscribe();
			}
		};
	}, [firestoreUnsubscribe]);

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
};
// src/lib/firebase-admin.ts
import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

/**
 * Firebase Admin SDK初期化
 * サーバーサイドでFirestoreにアクセスするために使用
 */

let adminApp: App;
let adminDb: Firestore;

// 環境変数の検証
function validateAdminEnvVars(): void {
  const requiredVars = [
    'FIREBASE_ADMIN_PROJECT_ID',
    'FIREBASE_ADMIN_CLIENT_EMAIL', 
    'FIREBASE_ADMIN_PRIVATE_KEY'
  ];

  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    throw new Error(
      `Missing required Firebase Admin environment variables: ${missingVars.join(', ')}`
    );
  }
}

// Admin SDK初期化
function initializeAdminApp(): App {
  try {
    validateAdminEnvVars();

    // 既に初期化済みかチェック
    const existingApps = getApps();
    if (existingApps.length > 0) {
      console.log('📱 Firebase Admin already initialized');
      return existingApps[0];
    }

    // Admin SDK初期化
    const app = initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_ADMIN_PROJECT_ID!,
        clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL!,
        privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY!.replace(/\\n/g, '\n'),
      }),
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID!,
    });

    console.log('🔥 Firebase Admin SDK initialized successfully');
    return app;

  } catch (error) {
    console.error('❌ Firebase Admin SDK initialization failed:', error);
    throw new Error(`Firebase Admin initialization failed: ${error}`);
  }
}

// Firestore Admin インスタンス取得
function getAdminFirestore(): Firestore {
  if (!adminApp) {
    adminApp = initializeAdminApp();
  }
  
  if (!adminDb) {
    adminDb = getFirestore(adminApp);
    console.log('📊 Firestore Admin instance created');
  }
  
  return adminDb;
}

// エクスポート
export { getAdminFirestore };

// デフォルトエクスポート（利便性のため）
export default getAdminFirestore;

/**
 * 使用例:
 * 
 * import { getAdminFirestore } from '@/lib/firebase-admin';
 * 
 * const adminDb = getAdminFirestore();
 * const usersRef = adminDb.collection('users');
 */

/**
 * 開発環境での動作確認用ヘルパー
 */
export const testAdminConnection = async (): Promise<boolean> => {
  try {
    const db = getAdminFirestore();
    
    // 簡単な読み取りテスト
    const testDoc = await db.collection('_test').doc('connection').get();
    
    console.log('✅ Firebase Admin connection test successful');
    return true;
  } catch (error) {
    console.error('❌ Firebase Admin connection test failed:', error);
    return false;
  }
};

/**
 * エラーハンドリング用のヘルパー関数
 */
export const handleAdminError = (error: any, operation: string): never => {
  console.error(`Firebase Admin Error (${operation}):`, error);
  
  if (error.code === 'permission-denied') {
    throw new Error('Firebase Admin: Permission denied. Check service account permissions.');
  }
  
  if (error.code === 'not-found') {
    throw new Error('Firebase Admin: Document or collection not found.');
  }
  
  if (error.message?.includes('credential')) {
    throw new Error('Firebase Admin: Invalid credentials. Check environment variables.');
  }
  
  throw new Error(`Firebase Admin operation failed: ${error.message || error}`);
};
// src/app/api/test/admin/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore, testAdminConnection, handleAdminError } from '@/lib/firebase-admin';

/**
 * Firebase Admin SDK動作確認用のテストAPI
 * 開発環境でのみ使用（本番環境では削除予定）
 */

export async function GET(request: NextRequest) {
	// 開発環境でのみ実行
	if (process.env.NODE_ENV !== 'development') {
		return NextResponse.json(
			{ success: false, error: 'Test API is only available in development' },
			{ status: 403 }
		);
	}

	try {
		console.log('🧪 Testing Firebase Admin SDK connection...');

		// 1. 環境変数チェック
		const envCheck = {
			FIREBASE_ADMIN_PROJECT_ID: !!process.env.FIREBASE_ADMIN_PROJECT_ID,
			FIREBASE_ADMIN_CLIENT_EMAIL: !!process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
			FIREBASE_ADMIN_PRIVATE_KEY: !!process.env.FIREBASE_ADMIN_PRIVATE_KEY,
		};

		console.log('📋 Environment variables check:', envCheck);

		// 2. Admin SDK初期化テスト
		const adminDb = getAdminFirestore();
		console.log('✅ Admin SDK initialized');

		// 3. 接続テスト
		const connectionTest = await testAdminConnection();
		console.log('✅ Connection test:', connectionTest);

		// 4. 実際のFirestore操作テスト
		const testData = {
			message: 'Admin SDK test',
			timestamp: new Date().toISOString(),
			nodeEnv: process.env.NODE_ENV,
		};

		const testDocRef = adminDb.collection('_admin_test').doc('connection_test');
		await testDocRef.set(testData);
		console.log('✅ Write test successful');

		// 5. 読み取りテスト
		const readDoc = await testDocRef.get();
		const readData = readDoc.data();
		console.log('✅ Read test successful:', readData);

		// 6. テストドキュメント削除
		await testDocRef.delete();
		console.log('✅ Cleanup successful');

		return NextResponse.json({
			success: true,
			message: 'Firebase Admin SDK is working correctly',
			data: {
				envCheck,
				connectionTest,
				writeTest: true,
				readTest: true,
				cleanup: true,
				timestamp: new Date().toISOString(),
			}
		});

	} catch (error) {
		console.error('❌ Admin SDK test failed:', error);

		return NextResponse.json({
			success: false,
			error: error instanceof Error ? error.message : 'Unknown error',
			details: {
				stack: error instanceof Error ? error.stack : undefined,
				timestamp: new Date().toISOString(),
			}
		}, { status: 500 });
	}
}

export async function POST(request: NextRequest) {
	// 開発環境でのみ実行
	if (process.env.NODE_ENV !== 'development') {
		return NextResponse.json(
			{ success: false, error: 'Test API is only available in development' },
			{ status: 403 }
		);
	}

	try {
		const body = await request.json();
		const { testType = 'basic' } = body;

		const adminDb = getAdminFirestore();

		switch (testType) {
			case 'users_collection': {
				// usersコレクションの動作確認
				const usersRef = adminDb.collection('users');
				const snapshot = await usersRef.limit(1).get();

				return NextResponse.json({
					success: true,
					message: 'Users collection test successful',
					data: {
						collectionExists: true,
						documentCount: snapshot.size,
						hasDocuments: !snapshot.empty,
					}
				});
			}

			case 'write_permissions': {
				// 書き込み権限テスト
				const testRef = adminDb.collection('_admin_test').doc('write_test');
				await testRef.set({
					test: 'write_permissions',
					timestamp: new Date(),
				});
				await testRef.delete();

				return NextResponse.json({
					success: true,
					message: 'Write permissions test successful',
				});
			}

			default: {
				return NextResponse.json({
					success: false,
					error: `Unknown test type: ${testType}`,
				}, { status: 400 });
			}
		}

	} catch (error) {
		handleAdminError(error, 'POST test');
	}
}
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
		/*
		if (isMobile) {
			// モバイルの場合：スクロールに反応せず固定
			// 基本的な浮遊アニメーションのみ
			modelRef.current.rotation.y = THREE.MathUtils.lerp(
				modelRef.current.rotation.y,
				Math.sin(state.clock.elapsedTime * 0.1) * 0.1, // スクロール連動を削除
				0.05
			);

			// わずかな浮遊アニメーション
			modelRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.05;

			// Z位置を固定
			modelRef.current.position.z = THREE.MathUtils.lerp(
				modelRef.current.position.z,
				0, // 固定位置
				0.05
			);
		} else {*/
			// デスクトップの場合：元のスクロール連動アニメーション
			// モデルの回転 - スクロールに応じて回転
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
	//	}
	});

	return (
		// @ts-expect-error React Three Fiber JSX elements
		<primitive
			ref={modelRef}
			object={scene}
			scale={0.9}
			position={[0, 0, 0]}
			rotation={[ 0, 0, 0 ]}
		/>
	);
};

// モデルの事前ロード
useGLTF.preload(`${process.env.NEXT_PUBLIC_CLOUDFRONT_URL}/pepe/pepe_flavor.glb`);

export default PepeFlavorModel;
import { useState, useEffect, useCallback } from 'react';
import * as THREE from 'three';
import { ImageFile } from './constants';

/**
 * 画像読み込み状態の型定義
 */
interface ImageLoadingState {
  texture: THREE.Texture | null;
  loading: boolean;
  error: Error | null;
}

/**
 * 画像読み込み用カスタムフック
 * 指定されたURLから画像をテクスチャとして読み込む
 */
export const useImageLoader = (imageUrl: string): ImageLoadingState => {
  const [state, setState] = useState<ImageLoadingState>({
    texture: null,
    loading: true,
    error: null
  });

  useEffect(() => {
    // 画像を読み込むたびに状態をリセット
    setState({ texture: null, loading: true, error: null });

    const textureLoader = new THREE.TextureLoader();
    
    textureLoader.load(
      imageUrl,
      // 読み込み成功時
      (loadedTexture) => {
        loadedTexture.needsUpdate = true;
        setState({
          texture: loadedTexture,
          loading: false,
          error: null
        });
      },
      // 読み込み進捗時（必要に応じて実装）
      undefined,
      // 読み込み失敗時
      (error) => {
        console.error(`Error loading texture from ${imageUrl}:`, error);
      }
    );

    // クリーンアップ関数
    return () => {
      // コンポーネントのアンマウント時にテクスチャを破棄
      if (state.texture) {
        state.texture.dispose();
      }
    };
  }, [imageUrl]);

  return state;
};

/**
 * 複数画像の事前読み込み用ユーティリティ
 * 指定された画像リストを非同期で事前読み込みする
 */
export const preloadImages = async (images: ImageFile[]): Promise<void> => {
  const textureLoader = new THREE.TextureLoader();
  
  // すべての画像を非同期で読み込む
  const loadPromises = images.map(img => {
    return new Promise<void>((resolve, reject) => {
      textureLoader.load(
        img.path,
        () => resolve(),
        undefined,
        (error) => {
          console.warn(`Failed to preload image ${img.filename}:`, error);
          resolve(); // エラーでも続行するため、rejectではなくresolveを呼び出す
        }
      );
    });
  });

  // すべての読み込みが完了するまで待機
  await Promise.all(loadPromises);
};

/**
 * 画像配置を最適化するためのユーティリティ
 * サイズに基づいて画像の最適な配置を計算する
 */
export const calculateOptimalImagePositions = (
  images: ImageFile[],
  viewportWidth: number,
  viewportHeight: number
): { [key: number]: [number, number, number] } => {
  // 画像IDをキーとし、位置座標[x, y, z]を値とするオブジェクト
  const positions: { [key: number]: [number, number, number] } = {};
  
  // 特大画像(L)、中型画像(M)、小型画像(S)をグループ化
  const largeImages = images.filter(img => img.size === 'L');
  const mediumImages = images.filter(img => img.size === 'M');
  const smallImages = images.filter(img => img.size === 'S');
  
  // 視覚的な配置の多様性のために使用する係数
  const diversityFactor = 0.7;
  
  // Lサイズ画像の配置 - 主要な位置に配置
  largeImages.forEach((img, index) => {
    const xPos = (index % 3 - 1) * viewportWidth / 2.5;
    const yPos = -Math.floor(index / 3) * viewportHeight / 1.5;
    const zPos = 0; // 前面に配置
    positions[img.id] = [xPos, yPos, zPos];
  });
  
  // Mサイズ画像の配置 - Lサイズの間を埋める
  mediumImages.forEach((img, index) => {
    const xPos = ((index % 4) - 1.5) * viewportWidth / 3 * diversityFactor;
    const yPos = -Math.floor(index / 4) * viewportHeight / 2 - viewportHeight / 4;
    const zPos = 5; // Lの後ろに配置
    positions[img.id] = [xPos, yPos, zPos];
  });
  
  // Sサイズ画像の配置 - 埋め草的に散らす
  smallImages.forEach((img, index) => {
    const xPos = ((index % 5) - 2) * viewportWidth / 4 * diversityFactor;
    const yPos = -Math.floor(index / 5) * viewportHeight / 2.5 - viewportHeight / 3;
    const zPos = 10; // 最も後ろに配置
    positions[img.id] = [xPos, yPos, zPos];
  });
  
  return positions;
};
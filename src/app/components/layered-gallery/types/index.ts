// src/app/components/layered-gallery/types/index.ts

import { ImageFile, ImageSize } from '../../../floating-images-fix/constants'

// React Three Fiber の型拡張
declare global {
	namespace JSX {
		interface IntrinsicElements {
			group: any
			mesh: any
			planeGeometry: any
			meshBasicMaterial: any
			boxGeometry: any
			axesHelper: any
			gridHelper: any
			ringGeometry: any
			ambientLight: any
			directionalLight: any
		}
	}
}

/**
 * レイヤードギャラリー用の拡張画像設定
 */
export interface LayeredImageConfig extends ImageFile {
	// 3D配置設定
	position: {
		x: number
		y: number
		z: number
	}

	// ランダムオフセット範囲（オプション）
	randomOffset?: {
		x: number
		y: number
	}

	// 個別スクロール範囲（全体進行度 0-1 に対する相対値）
	scrollRange: {
		start: number    // アニメーション開始位置
		end: number      // アニメーション終了位置
		peak: number     // 最大ズーム位置
	}

	// ズーム設定
	zoom: {
		min: number      // 最小倍率
		max: number      // 最大倍率
		curve: EasingType // イージングカーブ
	}

	// 視差効果設定
	parallax: {
		speed: number    // 視差速度（1.0が標準）
	}

	// 回転設定（オプション）
	rotation?: {
		axis: 'x' | 'y' | 'z'
		amount: number   // 回転量（ラジアン）
	}
}

/**
 * イージングタイプ
 */
export type EasingType =
	| 'linear'
	| 'easeIn'
	| 'easeOut'
	| 'easeInOut'
	| 'easeInQuart'
	| 'easeOutQuart'

/**
 * スクロール進行度情報
 */
export interface ScrollProgress {
	// 全体の進行度（0-1）
	overall: number

	// セクション内での進行度（0-1）
	section: number

	// スクロール方向
	direction: 'up' | 'down'

	// スクロール速度
	velocity: number
}

/**
 * 画像アニメーション状態
 */
export interface ImageAnimationState {
	// 現在の位置
	position: {
		x: number
		y: number
		z: number
	}

	// 現在のスケール
	scale: number

	// 現在の透明度
	opacity: number

	// 現在の回転
	rotation: {
		x: number
		y: number
		z: number
	}

	// アニメーション中かどうか
	isAnimating: boolean

	// 可視状態
	isVisible: boolean
}

/**
 * レスポンシブ設定
 */
export interface ResponsiveConfig {
	// デスクトップ設定
	desktop: {
		scaleMultiplier: number
		positionMultiplier: number
		zoomMultiplier: number
	}

	// モバイル設定
	mobile: {
		scaleMultiplier: number
		positionMultiplier: number
		zoomMultiplier: number
	}
}

/**
 * セクション設定
 */
export interface LayeredGallerySectionConfig {
	// セクションの高さ（viewport height の倍数）
	sectionHeight: number

	// パディング設定
	padding: {
		top: number
		bottom: number
	}

	// カメラ設定
	camera: {
		fov: number
		near: number
		far: number
		position: {
			x: number
			y: number
			z: number
		}
	}

	// レスポンシブ設定
	responsive: ResponsiveConfig
}
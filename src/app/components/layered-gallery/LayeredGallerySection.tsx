// src/app/components/layered-gallery/LayeredGallerySection.tsx

'use client'

import React, { useRef, useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { SECTION_CONFIG, getCurrentConfig, DEBUG_CONFIG } from './constants'

// LayeredGalleryCanvasを動的インポートでSSR回避
const LayeredGalleryCanvas = dynamic(() => import('./LayeredGalleryCanvas'), {
  ssr: false,
  loading: () => (
    <div
      style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        color: '#666',
        fontSize: '18px',
        textAlign: 'center',
      }}
    >
      <div>Loading 3D Gallery...</div>
      <div style={{ fontSize: '12px', marginTop: '5px', opacity: 0.7 }}>
        Initializing Three.js Scene
      </div>
    </div>
  )
})

export interface LayeredGallerySectionProps {
  className?: string
  id?: string
}

/**
 * レイヤードギャラリーのメインセクションコンテナ
 * スクロール可能エリアの定義と基本レイアウトを提供
 */
export const LayeredGallerySection: React.FC<LayeredGallerySectionProps> = ({
  className = '',
  id = 'layered-gallery-section'
}) => {
  const sectionRef = useRef<HTMLElement>(null)
  const [sectionHeight, setSectionHeight] = useState<number>(0)
  const [isClient, setIsClient] = useState(false)

  // クライアントサイドでのみ実行
  useEffect(() => {
    setIsClient(true)
  }, [])

  // セクション高さの計算
  useEffect(() => {
    if (!isClient) return

    const calculateHeight = () => {
      const viewportHeight = window.innerHeight
      const calculatedHeight = viewportHeight * SECTION_CONFIG.sectionHeight
      setSectionHeight(calculatedHeight)
      
      if (DEBUG_CONFIG.logAnimationStates) {
        console.log('[LayeredGallerySection] Height calculated:', {
          viewportHeight,
          multiplier: SECTION_CONFIG.sectionHeight,
          totalHeight: calculatedHeight,
        })
      }
    }

    calculateHeight()

    // リサイズ対応
    const handleResize = () => {
      calculateHeight()
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [isClient])

  // セクション要素の監視（デバッグ用）
  useEffect(() => {
    if (!DEBUG_CONFIG.logAnimationStates || !sectionRef.current) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          console.log('[LayeredGallerySection] Intersection changed:', {
            isIntersecting: entry.isIntersecting,
            intersectionRatio: entry.intersectionRatio,
            boundingClientRect: entry.boundingClientRect,
          })
        })
      },
      {
        threshold: [0, 0.1, 0.25, 0.5, 0.75, 1.0],
        rootMargin: '100px',
      }
    )

    observer.observe(sectionRef.current)

    return () => observer.disconnect()
  }, [])

  // レスポンシブ設定の取得
  const config = getCurrentConfig()

  if (!isClient) {
    // SSR時は基本的なプレースホルダーを返す
    return (
      <section
        id={id}
        className={`layered-gallery-section ${className}`}
        style={{
          minHeight: '400vh',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div 
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            color: '#666',
            fontSize: '18px',
          }}
        >
          Loading Gallery...
        </div>
      </section>
    )
  }

  return (
    <section
      ref={sectionRef}
      id={id}
      className={`layered-gallery-section ${className}`}
      style={{
        height: sectionHeight,
        position: 'relative',
        overflow: 'hidden',
        paddingTop: SECTION_CONFIG.padding.top,
        paddingBottom: SECTION_CONFIG.padding.bottom,
        width: '100%', // セクション自体も幅を確保
        minWidth: '100vw', // 最小幅を保証
      }}
    >
      {/* Three.js Canvas */}
      <div
        className="layered-gallery-canvas-container"
        style={{
          position: 'sticky',
          top: 0,
          left: 0,
          width: '100vw', // ビューポート全体の幅
          height: '100vh',
          zIndex: 1,
          backgroundColor: 'rgba(255, 0, 0, 0.1)', // 赤い背景で確認用
          border: '2px solid red', // 境界を見やすく
          boxSizing: 'border-box',
        }}
      >
        {/* デバッグ表示 */}
        <div
          style={{
            position: 'absolute',
            top: '20px',
            left: '20px',
            background: 'rgba(0, 0, 0, 0.8)',
            color: 'white',
            padding: '10px',
            borderRadius: '5px',
            fontSize: '14px',
            zIndex: 10,
          }}
        >
          <div>✅ LayeredGallerySection is working!</div>
          <div>Section Height: {Math.round(sectionHeight)}px</div>
          <div>Is Client: {isClient ? 'Yes' : 'No'}</div>
          <div>Images Count: {getCurrentConfig().images.length}</div>
          <div>Container Width: 100vw</div>
          <div>Container Height: 100vh</div>
        </div>

        <LayeredGalleryCanvas />
      </div>

      {/* スクロール進行度インジケーター（デバッグ用） */}
      {DEBUG_CONFIG.showScrollRanges && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            background: 'rgba(0, 0, 0, 0.8)',
            color: 'white',
            padding: '10px',
            borderRadius: '5px',
            fontSize: '12px',
            fontFamily: 'monospace',
            zIndex: 1000,
          }}
        >
          <div>Section Config:</div>
          <div>Height Multiplier: {SECTION_CONFIG.sectionHeight}x</div>
          <div>Total Height: {Math.round(sectionHeight)}px</div>
          <div>Images: {config.images.length}</div>
          <div>Mobile: {config.responsive === config.section.responsive.mobile ? 'Yes' : 'No'}</div>
        </div>
      )}

      {/* スクロール可能エリアの可視化（デバッグ用） */}
      {DEBUG_CONFIG.showBoundingBoxes && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            border: '2px dashed #ff0000',
            pointerEvents: 'none',
            zIndex: 100,
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: '10px',
              left: '10px',
              background: 'rgba(255, 0, 0, 0.8)',
              color: 'white',
              padding: '5px',
              fontSize: '12px',
            }}
          >
            Layered Gallery Section Bounds
          </div>
        </div>
      )}

      {/* 次のステップで実装予定のコンポーネント */}
      {/* <LayeredGalleryCanvas /> */}
      {/* <ScrollController /> */}

      {/* テスト用画像表示 */}
      {DEBUG_CONFIG.showTestImage && <TestImageDisplay />}
    </section>
  )
}

/**
 * テスト用：CDN画像の表示確認
 */
const TestImageDisplay: React.FC = () => {
  const [testImageLoaded, setTestImageLoaded] = useState<boolean>(false)
  const [testImageError, setTestImageError] = useState<string | null>(null)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])
  
  if (!isClient) return null

  const config = getCurrentConfig()
  const testImage = config.images[0] // 最初の画像でテスト
  
  if (!testImage) return null

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        width: '200px',
        background: 'rgba(0, 0, 0, 0.8)',
        color: 'white',
        padding: '10px',
        borderRadius: '5px',
        fontSize: '12px',
        zIndex: 1000,
      }}
    >
      <div style={{ marginBottom: '10px' }}>
        <strong>Test Image:</strong><br />
        {testImage.filename}
      </div>
      
      <div style={{ marginBottom: '10px' }}>
        <strong>Path:</strong><br />
        <div style={{ 
          wordBreak: 'break-all', 
          fontSize: '10px', 
          opacity: 0.8 
        }}>
          {testImage.path}
        </div>
      </div>

      <div style={{ marginBottom: '10px' }}>
        <img
          src={testImage.path}
          alt={testImage.filename}
          style={{
            width: '100%',
            height: 'auto',
            border: testImageError ? '2px solid red' : '1px solid #333'
          }}
          onLoad={() => {
            setTestImageLoaded(true)
            setTestImageError(null)
            console.log(`[TestImage] Successfully loaded: ${testImage.filename}`)
          }}
          onError={(e) => {
            setTestImageLoaded(false)
            setTestImageError('Failed to load')
            console.error(`[TestImage] Failed to load: ${testImage.filename}`, e)
          }}
        />
      </div>

      <div style={{ fontSize: '10px' }}>
        Status: {testImageLoaded ? '✅ Loaded' : testImageError ? '❌ Error' : '⏳ Loading'}
      </div>
    </div>
  )
}
export default LayeredGallerySection
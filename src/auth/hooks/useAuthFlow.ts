// src/auth/hooks/useAuthFlow.ts (完成版)
import { useState, useCallback, useEffect, useRef } from 'react';
import { AuthFlowState } from '@/types/user-extended';
import { ChainType } from '@/types/wallet';
import { SelectableChainId } from '@/types/chain-selection';

/**
 * 拡張された認証ステップ型
 */
export type ExtendedAuthStep = 
  | 'idle' 
  | 'chain-select' 
  | 'wallet-connect' 
  | 'wallet-sign' 
  | 'connecting' 
  | 'signing' 
  | 'verifying' 
  | 'success' 
  | 'error';

/**
 * 認証フロー履歴エントリ
 */
interface AuthFlowHistoryEntry {
  step: ExtendedAuthStep;
  timestamp: Date;
  duration?: number;
  data?: any;
  error?: string;
}

/**
 * 認証フロー統計
 */
interface AuthFlowStats {
  totalAttempts: number;
  successfulAttempts: number;
  failedAttempts: number;
  averageCompletionTime: number;
  successRate: number;
  mostCommonFailureStep: ExtendedAuthStep | null;
  averageStepTime: Record<ExtendedAuthStep, number>;
}

/**
 * 認証フロー設定
 */
interface AuthFlowOptions {
  // フロー設定
  enableStepHistory?: boolean;
  enableAutoAdvance?: boolean;
  autoAdvanceDelay?: number;
  maxHistoryEntries?: number;
  
  // ステップ制御
  allowBackNavigation?: boolean;
  allowStepSkipping?: boolean;
  requiredSteps?: ExtendedAuthStep[];
  
  // タイムアウト設定
  stepTimeouts?: Partial<Record<ExtendedAuthStep, number>>;
  globalTimeout?: number;
  
  // コールバック
  onStepChange?: (step: ExtendedAuthStep, previousStep: ExtendedAuthStep | null) => void;
  onFlowComplete?: (duration: number) => void;
  onFlowError?: (error: string, step: ExtendedAuthStep) => void;
  onStepTimeout?: (step: ExtendedAuthStep) => void;
  
  // デバッグ
  enableLogging?: boolean;
}

/**
 * 拡張された認証フロー状態
 */
interface ExtendedAuthFlowState extends Omit<AuthFlowState, 'currentStep'> {
  currentStep: ExtendedAuthStep;
  
  // 拡張状態
  isActive: boolean;
  startTime: Date | null;
  stepStartTime: Date | null;
  
  // ステップ管理
  stepHistory: ExtendedAuthStep[];
  visitedSteps: Set<ExtendedAuthStep>;
  canGoBack: boolean;
  canSkipStep: boolean;
  
  // タイムアウト
  stepTimeoutId: NodeJS.Timeout | null;
  globalTimeoutId: NodeJS.Timeout | null;
  
  // エラー状態
  error: string | null;
  errorStep: ExtendedAuthStep | null;
  
  // 進捗詳細
  stepProgress: Record<ExtendedAuthStep, number>;
  estimatedTimeRemaining: number;
}

/**
 * 完成版の認証フロー管理カスタムフック
 */
export const useAuthFlow = (options: AuthFlowOptions = {}) => {
  // デフォルトオプション
  const {
    enableStepHistory = true,
    enableAutoAdvance = false,
    autoAdvanceDelay = 2000,
    maxHistoryEntries = 50,
    allowBackNavigation = true,
    allowStepSkipping = false,
    requiredSteps = ['chain-select', 'wallet-connect', 'wallet-sign'],
    stepTimeouts = {
      'connecting': 30000,
      'signing': 60000,
      'verifying': 30000,
    },
    globalTimeout = 300000, // 5分
    onStepChange,
    onFlowComplete,
    onFlowError,
    onStepTimeout,
    enableLogging = process.env.NODE_ENV === 'development',
  } = options;

  // 初期状態
  const initialState: ExtendedAuthFlowState = {
    currentStep: 'idle',
    progress: 0,
    signatureRequired: false,
    verificationRequired: false,
    
    // 拡張状態
    isActive: false,
    startTime: null,
    stepStartTime: null,
    
    // ステップ管理
    stepHistory: [],
    visitedSteps: new Set(),
    canGoBack: false,
    canSkipStep: false,
    
    // タイムアウト
    stepTimeoutId: null,
    globalTimeoutId: null,
    
    // エラー状態
    error: null,
    errorStep: null,
    
    // 進捗詳細
    stepProgress: {} as Record<ExtendedAuthStep, number>,
    estimatedTimeRemaining: 0,
  };

  // 状態管理
  const [authFlowState, setAuthFlowState] = useState<ExtendedAuthFlowState>(initialState);
  const [flowHistory, setFlowHistory] = useState<AuthFlowHistoryEntry[]>([]);
  
  // Refs
  const stepDurations = useRef<Map<ExtendedAuthStep, number>>(new Map());
  const flowStartTime = useRef<number | null>(null);

  // ログ出力
  const log = useCallback((message: string, data?: any) => {
    if (enableLogging) {
      console.log(`🔐 [AuthFlow] ${message}`, data || '');
    }
  }, [enableLogging]);

  // フロー履歴の追加
  const addFlowHistory = useCallback((
    step: ExtendedAuthStep, 
    data?: any, 
    error?: string
  ) => {
    if (!enableStepHistory) return;

    const entry: AuthFlowHistoryEntry = {
      step,
      timestamp: new Date(),
      data,
      error,
    };

    // 前回のエントリの期間を計算
    if (flowHistory.length > 0) {
      const lastEntry = flowHistory[flowHistory.length - 1];
      entry.duration = Date.now() - lastEntry.timestamp.getTime();
    }

    setFlowHistory(prev => {
      const newHistory = [...prev, entry].slice(-maxHistoryEntries);
      log(`Added flow history: ${step}`, { data, error });
      return newHistory;
    });
  }, [enableStepHistory, maxHistoryEntries, flowHistory, log]);

  // タイムアウト管理
  const clearTimeouts = useCallback(() => {
    if (authFlowState.stepTimeoutId) {
      clearTimeout(authFlowState.stepTimeoutId);
    }
    if (authFlowState.globalTimeoutId) {
      clearTimeout(authFlowState.globalTimeoutId);
    }
  }, [authFlowState.stepTimeoutId, authFlowState.globalTimeoutId]);

  const setStepTimeout = useCallback((step: ExtendedAuthStep) => {
    const timeoutDuration = stepTimeouts[step];
    if (!timeoutDuration) return null;

    return setTimeout(() => {
      log(`⏰ Step timeout: ${step} (${timeoutDuration}ms)`);
      if (onStepTimeout) {
        onStepTimeout(step);
      }
      setAuthFlowState(prev => ({
        ...prev,
        error: `Step ${step} timed out after ${timeoutDuration / 1000}s`,
        errorStep: step,
      }));
    }, timeoutDuration);
  }, [stepTimeouts, onStepTimeout, log]);

  const setGlobalTimeout = useCallback(() => {
    if (!globalTimeout) return null;

    return setTimeout(() => {
      log(`⏰ Global flow timeout (${globalTimeout}ms)`);
      if (onFlowError) {
        onFlowError(`Authentication flow timed out after ${globalTimeout / 1000}s`, authFlowState.currentStep);
      }
      setAuthFlowState(prev => ({
        ...prev,
        currentStep: 'error',
        error: `Authentication flow timed out after ${globalTimeout / 1000}s`,
      }));
    }, globalTimeout);
  }, [globalTimeout, authFlowState.currentStep, onFlowError, log]);

  // ステップ変更の処理
  const setStep = useCallback((step: ExtendedAuthStep, data?: any) => {
    const previousStep = authFlowState.currentStep;
    const now = Date.now();

    log(`Step change: ${previousStep} → ${step}`, data);

    // ステップ時間の記録
    if (authFlowState.stepStartTime && previousStep !== 'idle') {
      const stepDuration = now - authFlowState.stepStartTime.getTime();
      stepDurations.current.set(previousStep, stepDuration);
    }

    // タイムアウトクリア
    clearTimeouts();

    setAuthFlowState(prev => {
      const newVisitedSteps = new Set(prev.visitedSteps);
      newVisitedSteps.add(step);

      const newStepHistory = [...prev.stepHistory, step];
      
      // フロー開始時の処理
      const isStarting = previousStep === 'idle' && step !== 'idle';
      const startTime = isStarting ? new Date() : prev.startTime;
      
      if (isStarting) {
        flowStartTime.current = now;
      }

      return {
        ...prev,
        currentStep: step,
        stepHistory: newStepHistory,
        visitedSteps: newVisitedSteps,
        canGoBack: allowBackNavigation && newStepHistory.length > 1,
        canSkipStep: allowStepSkipping && !requiredSteps.includes(step),
        isActive: step !== 'idle' && step !== 'success' && step !== 'error',
        startTime,
        stepStartTime: new Date(),
        stepTimeoutId: setStepTimeout(step),
        globalTimeoutId: step === 'idle' ? null : (prev.globalTimeoutId || setGlobalTimeout()),
        error: step === 'error' ? prev.error : null,
        errorStep: step === 'error' ? prev.errorStep : null,
      };
    });

    // フロー履歴に追加
    addFlowHistory(step, data);

    // コールバック実行
    if (onStepChange) {
      onStepChange(step, previousStep);
    }

    // 完了時の処理
    if (step === 'success' && flowStartTime.current) {
      const totalDuration = now - flowStartTime.current;
      log(`✅ Flow completed in ${totalDuration}ms`);
      
      if (onFlowComplete) {
        onFlowComplete(totalDuration);
      }
    }

    // エラー時の処理
    if (step === 'error' && onFlowError && authFlowState.error) {
      onFlowError(authFlowState.error, previousStep);
    }

  }, [
    authFlowState.currentStep,
    authFlowState.stepStartTime,
    authFlowState.error,
    allowBackNavigation,
    allowStepSkipping,
    requiredSteps,
    clearTimeouts,
    setStepTimeout,
    setGlobalTimeout,
    addFlowHistory,
    onStepChange,
    onFlowComplete,
    onFlowError,
    log
  ]);

  // 進捗更新
  const updateProgress = useCallback((progress: number, step?: ExtendedAuthStep) => {
    const clampedProgress = Math.max(0, Math.min(100, progress));
    
    setAuthFlowState(prev => ({
      ...prev,
      progress: clampedProgress,
      stepProgress: step 
        ? { ...prev.stepProgress, [step]: clampedProgress }
        : prev.stepProgress,
    }));

    log(`Progress updated: ${clampedProgress}%`, { step });
  }, [log]);

  // 戻るボタン
  const goBack = useCallback((): boolean => {
    if (!authFlowState.canGoBack || authFlowState.stepHistory.length < 2) {
      log('❌ Cannot go back: no previous step available');
      return false;
    }

    const previousStep = authFlowState.stepHistory[authFlowState.stepHistory.length - 2];
    
    // 履歴から最後のステップを削除
    setAuthFlowState(prev => ({
      ...prev,
      stepHistory: prev.stepHistory.slice(0, -1),
      canGoBack: prev.stepHistory.length > 2,
    }));

    setStep(previousStep, { action: 'go-back' });
    
    log(`⬅️ Went back to step: ${previousStep}`);
    return true;
  }, [authFlowState.canGoBack, authFlowState.stepHistory, setStep, log]);

  // ステップスキップ
  const skipStep = useCallback((): boolean => {
    if (!authFlowState.canSkipStep) {
      log('❌ Cannot skip: step is required');
      return false;
    }

    const currentIndex = requiredSteps.indexOf(authFlowState.currentStep);
    if (currentIndex >= 0 && currentIndex < requiredSteps.length - 1) {
      const nextStep = requiredSteps[currentIndex + 1];
      setStep(nextStep, { action: 'skip-step' });
      log(`⏭️ Skipped step: ${authFlowState.currentStep} → ${nextStep}`);
      return true;
    }

    log('❌ Cannot skip: no next step available');
    return false;
  }, [authFlowState.canSkipStep, authFlowState.currentStep, requiredSteps, setStep, log]);

  // フロー完全リセット
  const resetFlow = useCallback(() => {
    clearTimeouts();
    flowStartTime.current = null;
    stepDurations.current.clear();
    
    setAuthFlowState(initialState);
    setFlowHistory([]);
    
    log('🔄 Flow completely reset');
  }, [clearTimeouts, initialState, log]);

  // ステップ状態の設定
  const setSignatureRequired = useCallback((required: boolean) => {
    setAuthFlowState(prev => ({ ...prev, signatureRequired: required }));
    log(`Signature required: ${required}`);
  }, [log]);

  const setVerificationRequired = useCallback((required: boolean) => {
    setAuthFlowState(prev => ({ ...prev, verificationRequired: required }));
    log(`Verification required: ${required}`);
  }, [log]);

  const setError = useCallback((error?: string, step?: ExtendedAuthStep) => {
    const errorMessage = error || 'An error occurred';
    const errorStep = step || authFlowState.currentStep;
    
    setAuthFlowState(prev => ({
      ...prev,
      currentStep: 'error',
      error: errorMessage,
      errorStep,
    }));

    addFlowHistory('error', { originalStep: errorStep }, errorMessage);
    log(`❌ Error set: ${errorMessage}`, { step: errorStep });
  }, [authFlowState.currentStep, addFlowHistory, log]);

  const clearError = useCallback(() => {
    setAuthFlowState(prev => ({
      ...prev,
      error: null,
      errorStep: null,
    }));
    log('✅ Error cleared');
  }, [log]);

  // 成功完了
  const completeSuccess = useCallback(() => {
    setStep('success', { completedAt: new Date() });
  }, [setStep]);

  // 統計情報の取得
  const getStats = useCallback((): AuthFlowStats => {
    if (flowHistory.length === 0) {
      return {
        totalAttempts: 0,
        successfulAttempts: 0,
        failedAttempts: 0,
        averageCompletionTime: 0,
        successRate: 0,
        mostCommonFailureStep: null,
        averageStepTime: {} as Record<ExtendedAuthStep, number>,
      };
    }

    const successfulFlows = flowHistory.filter(entry => entry.step === 'success');
    const failedFlows = flowHistory.filter(entry => entry.step === 'error');
    const totalAttempts = successfulFlows.length + failedFlows.length;
    
    const averageCompletionTime = successfulFlows.length > 0
      ? successfulFlows.reduce((avg, entry) => avg + (entry.duration || 0), 0) / successfulFlows.length
      : 0;

    const successRate = totalAttempts > 0 ? successfulFlows.length / totalAttempts : 0;

    // 最も一般的な失敗ステップ
    const failureSteps = failedFlows.reduce((acc, entry) => {
      const step = entry.data?.originalStep || entry.step;
      acc[step] = (acc[step] || 0) + 1;
      return acc;
    }, {} as Record<ExtendedAuthStep, number>);

    const mostCommonFailureStep = Object.entries(failureSteps).length > 0 
      ? Object.entries(failureSteps).reduce((a, b) => 
          failureSteps[a[0] as ExtendedAuthStep] > failureSteps[b[0] as ExtendedAuthStep] ? a : b
        )[0] as ExtendedAuthStep
      : null;

    // 平均ステップ時間
    const averageStepTime = {} as Record<ExtendedAuthStep, number>;
    for (const [step, duration] of stepDurations.current.entries()) {
      averageStepTime[step] = duration;
    }

    return {
      totalAttempts,
      successfulAttempts: successfulFlows.length,
      failedAttempts: failedFlows.length,
      averageCompletionTime,
      successRate,
      mostCommonFailureStep,
      averageStepTime,
    };
  }, [flowHistory, stepDurations]);

  // フロー進捗の予測
  const getEstimatedTimeRemaining = useCallback((): number => {
    const stats = getStats();
    if (stats.averageCompletionTime === 0) return 0;

    const currentStepIndex = requiredSteps.indexOf(authFlowState.currentStep);
    if (currentStepIndex === -1) return 0;

    const remainingSteps = requiredSteps.length - currentStepIndex - 1;
    const avgStepTime = stats.averageCompletionTime / requiredSteps.length;
    
    return remainingSteps * avgStepTime;
  }, [getStats, authFlowState.currentStep, requiredSteps]);

  // デバッグ情報
  const getDebugInfo = useCallback(() => {
    return {
      currentState: authFlowState,
      flowHistory: flowHistory.slice(-10), // 最新10件
      stepDurations: Object.fromEntries(stepDurations.current),
      stats: getStats(),
      estimatedTimeRemaining: getEstimatedTimeRemaining(),
      configuration: {
        enableStepHistory,
        enableAutoAdvance,
        allowBackNavigation,
        allowStepSkipping,
        requiredSteps,
        stepTimeouts,
        globalTimeout,
      },
    };
  }, [
    authFlowState,
    flowHistory,
    getStats,
    getEstimatedTimeRemaining,
    enableStepHistory,
    enableAutoAdvance,
    allowBackNavigation,
    allowStepSkipping,
    requiredSteps,
    stepTimeouts,
    globalTimeout,
  ]);

  // クリーンアップ
  useEffect(() => {
    return () => {
      clearTimeouts();
    };
  }, [clearTimeouts]);

  return {
    // 基本状態
    authFlowState,
    
    // 基本アクション
    setStep,
    updateProgress,
    goBack,
    skipStep,
    resetFlow,
    
    // ステップ状態制御
    setSignatureRequired,
    setVerificationRequired,
    setError,
    clearError,
    completeSuccess,
    
    // 統計と履歴
    flowHistory,
    getStats,
    getEstimatedTimeRemaining,
    
    // デバッグ
    getDebugInfo,
    
    // 便利なゲッター
    isActive: authFlowState.isActive,
    currentStep: authFlowState.currentStep,
    progress: authFlowState.progress,
    canGoBack: authFlowState.canGoBack,
    canSkipStep: authFlowState.canSkipStep,
    error: authFlowState.error,
    signatureRequired: authFlowState.signatureRequired,
    verificationRequired: authFlowState.verificationRequired,
  };
};
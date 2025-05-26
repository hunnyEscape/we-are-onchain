// src/auth/hooks/useAuthFlowState.ts
import { useState, useCallback } from 'react';
import { AuthFlowState } from '@/types/user-extended';
import { ChainType } from '@/types/wallet';

type ExtendedCurrentStep = 'idle' | 'chain-select' | 'wallet-connect' | 'wallet-sign' | 
                          'connecting' | 'signing' | 'verifying' | 'success' | 'error';

interface ExtendedAuthFlowState extends Omit<AuthFlowState, 'currentStep'> {
  currentStep: ExtendedCurrentStep;
}

/**
 * 認証フロー状態管理のカスタムフック
 */
export const useAuthFlowState = () => {
  const [authFlowState, setAuthFlowState] = useState<ExtendedAuthFlowState>({
    currentStep: 'idle',
    signatureRequired: false,
    verificationRequired: false,
    progress: 0,
  });

  const setCurrentStep = useCallback((step: ExtendedCurrentStep) => {
    setAuthFlowState(prev => ({ ...prev, currentStep: step }));
  }, []);

  const updateProgress = useCallback((progress: number) => {
    setAuthFlowState(prev => ({ 
      ...prev, 
      progress: Math.max(0, Math.min(100, progress)) 
    }));
  }, []);

  const setSignatureRequired = useCallback((required: boolean) => {
    setAuthFlowState(prev => ({ ...prev, signatureRequired: required }));
  }, []);

  const setVerificationRequired = useCallback((required: boolean) => {
    setAuthFlowState(prev => ({ ...prev, verificationRequired: required }));
  }, []);

  const goBackStep = useCallback((): boolean => {
    const steps: ExtendedCurrentStep[] = ['chain-select', 'wallet-connect', 'wallet-sign', 'success', 'error'];
    const currentIndex = steps.indexOf(authFlowState.currentStep);
    
    if (currentIndex > 0) {
      const previousStep = steps[currentIndex - 1];
      setCurrentStep(previousStep);
      return true;
    }
    return false;
  }, [authFlowState.currentStep, setCurrentStep]);

  const skipCurrentStep = useCallback((): boolean => {
    const steps: ExtendedCurrentStep[] = ['chain-select', 'wallet-connect', 'wallet-sign', 'success'];
    const currentIndex = steps.indexOf(authFlowState.currentStep);
    
    if (currentIndex < steps.length - 1) {
      const nextStep = steps[currentIndex + 1];
      setCurrentStep(nextStep);
      return true;
    }
    return false;
  }, [authFlowState.currentStep, setCurrentStep]);

  const resetAuthFlow = useCallback(() => {
    setAuthFlowState({
      currentStep: 'idle',
      signatureRequired: false,
      verificationRequired: false,
      progress: 0,
    });
  }, []);

  const startConnecting = useCallback((chainType?: ChainType, walletType?: string) => {
    setAuthFlowState(prev => ({
      ...prev,
      currentStep: 'connecting',
      progress: 25,
    }));
  }, []);

  const startSigning = useCallback(() => {
    setAuthFlowState(prev => ({
      ...prev,
      currentStep: 'signing',
      signatureRequired: true,
      progress: 25,
    }));
  }, []);

  const startVerifying = useCallback(() => {
    setAuthFlowState(prev => ({
      ...prev,
      currentStep: 'verifying',
      signatureRequired: false,
      verificationRequired: true,
      progress: 75,
    }));
  }, []);

  const completeSuccess = useCallback(() => {
    setAuthFlowState(prev => ({
      ...prev,
      currentStep: 'success',
      signatureRequired: false,
      verificationRequired: false,
      progress: 100,
    }));
  }, []);

  const setError = useCallback(() => {
    setAuthFlowState(prev => ({
      ...prev,
      currentStep: 'error',
      signatureRequired: false,
      verificationRequired: false,
    }));
  }, []);

  return {
    authFlowState,
    setCurrentStep,
    updateProgress,
    setSignatureRequired,
    setVerificationRequired,
    goBackStep,
    skipCurrentStep,
    resetAuthFlow,
    startConnecting,
    startSigning,
    startVerifying,
    completeSuccess,
    setError,
  };
};
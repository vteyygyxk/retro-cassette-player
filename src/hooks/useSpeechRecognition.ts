/**
 * useSpeechRecognition Hook - 语音识别
 * 支持讯飞语音识别（国内可用）
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  XunfeiSpeechRecognition,
  loadXunfeiConfig,
  saveXunfeiConfig,
  type XunfeiConfig,
} from '../services/xunfeiSpeechService';

// 语音识别状态
export type SpeechRecognitionState = 'idle' | 'listening' | 'processing';

// 重新导出 XunfeiConfig 供外部使用
export type { XunfeiConfig };

// Hook返回类型
export interface UseSpeechRecognitionReturn {
  /** 当前状态 */
  state: SpeechRecognitionState;
  /** 是否支持语音识别 */
  isSupported: boolean;
  /** 是否已配置讯飞 */
  isConfigured: boolean;
  /** 识别到的文本 */
  transcript: string;
  /** 错误信息 */
  error: string | null;
  /** 讯飞配置 */
  xunfeiConfig: XunfeiConfig | null;
  /** 保存讯飞配置 */
  saveConfig: (config: XunfeiConfig) => void;
  /** 开始录音 */
  startListening: () => void;
  /** 停止录音 */
  stopListening: () => void;
  /** 切换录音状态 */
  toggleListening: () => void;
  /** 清空识别结果 */
  resetTranscript: () => void;
}

/**
 * 语音识别Hook
 * 使用讯飞语音识别实现语音输入（国内可用）
 */
export function useSpeechRecognition(
  options: {
    /** 识别完成回调 */
    onResult?: (transcript: string) => void;
    /** 错误回调 */
    onError?: (error: string) => void;
  } = {}
): UseSpeechRecognitionReturn {
  const [state, setState] = useState<SpeechRecognitionState>('idle');
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isConfigured, setIsConfigured] = useState(false);
  const [xunfeiConfig, setXunfeiConfigState] = useState<XunfeiConfig | null>(null);

  const recognitionRef = useRef<XunfeiSpeechRecognition | null>(null);
  const latestTranscriptRef = useRef('');

  // 检查配置
  useEffect(() => {
    const config = loadXunfeiConfig();
    if (config) {
      setXunfeiConfigState(config);
      setIsConfigured(true);
    }
  }, []);

  // 保存配置
  const saveConfig = useCallback((config: XunfeiConfig) => {
    saveXunfeiConfig(config);
    setXunfeiConfigState(config);
    setIsConfigured(true);
    setError(null);
  }, []);

  // 创建识别实例
  const createRecognition = useCallback(() => {
    if (!xunfeiConfig) return null;

    const recognition = new XunfeiSpeechRecognition(xunfeiConfig);
    recognition.setCallbacks({
      onResult: (result) => {
        console.log('[Speech] Result:', result.text, 'isFinal:', result.isFinal);
        
        // 动态修正模式下，status=2 时可能只返回标点符号
        // 所以需要累积文字，而不是替换
        if (result.text && !result.text.match(/^[。，、！？；：""''（）【】《》…—]$/)) {
          // 如果不是单独的标点符号，更新文字
          latestTranscriptRef.current = result.text;
          setTranscript(result.text);
        }

        if (result.isFinal) {
          console.log('[Speech] isFinal=true, calling onResult with:', latestTranscriptRef.current);
          setState('processing');
          options.onResult?.(latestTranscriptRef.current);
          // 清空，防止 onEnd 重复调用
          latestTranscriptRef.current = '';
          setTimeout(() => {
            setState('idle');
          }, 300);
        }
      },
      onError: (err) => {
        console.log('[Speech] Error:', err);
        setError(err);
        setState('idle');
        options.onError?.(err);
      },
      onStart: () => {
        console.log('[Speech] Started');
        setState('listening');
        setError(null);
        latestTranscriptRef.current = '';
      },
      onEnd: () => {
        console.log('[Speech] Ended, transcript:', latestTranscriptRef.current);
        // 使用最新的识别结果
        if (latestTranscriptRef.current) {
          console.log('[Speech] Calling onResult with transcript');
          setState('processing');
          options.onResult?.(latestTranscriptRef.current);
          setTimeout(() => {
            setState('idle');
          }, 300);
        } else {
          console.log('[Speech] No transcript, setting idle');
          setState('idle');
        }
      },
    });

    return recognition;
  }, [xunfeiConfig, options.onResult, options.onError, state]);

  // 开始录音
  const startListening = useCallback(() => {
    if (!isConfigured) {
      setError('请先配置讯飞语音识别');
      return;
    }

    if (state === 'listening') {
      console.log('[Speech] Already listening');
      return;
    }

    console.log('[Speech] Starting...');
    setError(null);
    setTranscript('');
    latestTranscriptRef.current = '';

    const recognition = createRecognition();
    if (!recognition) {
      setError('初始化语音识别失败');
      return;
    }

    recognitionRef.current = recognition;
    recognition.start();
  }, [isConfigured, state, createRecognition]);

  // 停止录音
  const stopListening = useCallback(() => {
    console.log('[Speech] Stopping..., recognitionRef:', recognitionRef.current);
    if (!recognitionRef.current) {
      console.log('[Speech] No recognition instance, setting state to idle');
      setState('idle');
      return;
    }
    recognitionRef.current.stop();
    recognitionRef.current = null;
  }, []);

  // 切换录音状态
  const toggleListening = useCallback(() => {
    console.log('[Speech] Toggle, current state:', state);
    if (state === 'listening') {
      stopListening();
    } else {
      startListening();
    }
  }, [state, startListening, stopListening]);

  // 清空识别结果
  const resetTranscript = useCallback(() => {
    setTranscript('');
    latestTranscriptRef.current = '';
    setError(null);
  }, []);

  return {
    state,
    isSupported: true, // 讯飞服务始终可用（只要有配置）
    isConfigured,
    transcript,
    error,
    xunfeiConfig,
    saveConfig,
    startListening,
    stopListening,
    toggleListening,
    resetTranscript,
  };
}

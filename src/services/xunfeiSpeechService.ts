/**
 * 讯飞语音识别服务
 * 使用讯飞 Web 语音听写（流式版）API
 * 文档：https://www.xfyun.cn/doc/asr/voicedictation/API.html
 */

import CryptoJS from 'crypto-js';

// 讯飞语音识别配置
export interface XunfeiConfig {
  appId: string;
  apiKey: string;
  apiSecret: string;
}

// 语音识别结果
interface RecognitionResult {
  text: string;
  isFinal: boolean;
}

// 回调函数类型
type OnResultCallback = (result: RecognitionResult) => void;
type OnErrorCallback = (error: string) => void;
type OnStartCallback = () => void;
type OnEndCallback = () => void;

/**
 * 讯飞语音识别类
 */
export class XunfeiSpeechRecognition {
  private config: XunfeiConfig;
  private ws: WebSocket | null = null;
  private mediaStream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private processor: ScriptProcessorNode | null = null;
  private isRecording = false;
  private onResult: OnResultCallback | null = null;
  private onError: OnErrorCallback | null = null;
  private onStart: OnStartCallback | null = null;
  private onEnd: OnEndCallback | null = null;

  constructor(config: XunfeiConfig) {
    this.config = config;
  }

  /**
   * 设置回调函数
   */
  setCallbacks(callbacks: {
    onResult?: OnResultCallback;
    onError?: OnErrorCallback;
    onStart?: OnStartCallback;
    onEnd?: OnEndCallback;
  }) {
    this.onResult = callbacks.onResult || null;
    this.onError = callbacks.onError || null;
    this.onStart = callbacks.onStart || null;
    this.onEnd = callbacks.onEnd || null;
  }

  /**
   * 生成鉴权URL
   */
  private generateAuthUrl(): string {
    const host = 'iat-api.xfyun.cn';
    const path = '/v2/iat';
    const apiKey = this.config.apiKey;
    const apiSecret = this.config.apiSecret;

    const date = new Date().toUTCString();
    const algorithm = 'hmac-sha256';
    const headers = 'host date request-line';
    const signatureOrigin = `host: ${host}\ndate: ${date}\nGET ${path} HTTP/1.1`;
    const signatureSha = CryptoJS.HmacSHA256(signatureOrigin, apiSecret);
    const signature = CryptoJS.enc.Base64.stringify(signatureSha);
    const authorizationOrigin = `api_key="${apiKey}", algorithm="${algorithm}", headers="${headers}", signature="${signature}"`;
    const authorization = btoa(authorizationOrigin);

    const url = `wss://${host}${path}?authorization=${authorization}&date=${encodeURIComponent(date)}&host=${host}`;
    return url;
  }

  /**
   * 开始录音
   */
  async start(): Promise<void> {
    if (this.isRecording) {
      return;
    }

    try {
      // 获取麦克风权限 - 先获取所有设备
      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioDevices = devices.filter(d => d.kind === 'audioinput');
      console.log('[Xunfei] Available audio devices:', audioDevices.map(d => ({ id: d.deviceId, label: d.label })));
      
      // 选择真实的麦克风设备（排除虚拟设备）
      let selectedDeviceId = 'default';
      const realMic = audioDevices.find(d => 
        d.label && 
        !d.label.toLowerCase().includes('虚拟') && 
        !d.label.toLowerCase().includes('virtual')
      );
      if (realMic) {
        selectedDeviceId = realMic.deviceId;
        console.log('[Xunfei] Selected real microphone:', realMic.label);
      }
      
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          deviceId: { exact: selectedDeviceId },
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });
      
      // 检查麦克风轨道状态
      const audioTracks = this.mediaStream.getAudioTracks();
      console.log('[Xunfei] Audio tracks:', audioTracks.length);
      if (audioTracks.length > 0) {
        const track = audioTracks[0];
        console.log('[Xunfei] Track state:', track.readyState, 'enabled:', track.enabled, 'muted:', track.muted);
        console.log('[Xunfei] Track settings:', track.getSettings());
      }

      // 连接 WebSocket
      const wsUrl = this.generateAuthUrl();
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = async () => {
        console.log('[Xunfei] WebSocket connected');
        
        // WebSocket 连接成功后再创建音频处理器
        this.audioContext = new AudioContext({ sampleRate: 16000 });
        
        // 确保 AudioContext 处于运行状态
        if (this.audioContext.state === 'suspended') {
          console.log('[Xunfei] AudioContext suspended, resuming...');
          await this.audioContext.resume();
        }
        console.log('[Xunfei] AudioContext state:', this.audioContext.state);
        
        const source = this.audioContext.createMediaStreamSource(this.mediaStream!);
        this.processor = this.audioContext.createScriptProcessor(4096, 1, 1);
        source.connect(this.processor);
        this.processor.connect(this.audioContext.destination);

        // 发送音频数据
        let frameCount = 0;
        let isFirstFrame = true;
        let hasAudio = false;
        this.processor.onaudioprocess = (event) => {
          if (this.isRecording && this.ws?.readyState === WebSocket.OPEN) {
            const inputData = event.inputBuffer.getChannelData(0);
            
            // 检查是否有实际音频（不是静音）
            let sum = 0;
            for (let i = 0; i < inputData.length; i++) {
              sum += Math.abs(inputData[i]);
            }
            const avg = sum / inputData.length;
            
            if (frameCount % 10 === 0) {
              console.log('[Xunfei] Audio level:', avg.toFixed(6));
            }
            
            if (avg > 0.01) {
              hasAudio = true;
            }
            
            const audioData = this.float32ToPCM16(inputData);
            
            // 首帧需要携带 common 和 business 参数
            const status = isFirstFrame ? 0 : 1;
            this.sendFrame(audioData, status);
            isFirstFrame = false;
            
            frameCount++;
            if (frameCount % 10 === 0) {
              console.log('[Xunfei] Sent frames:', frameCount);
            }
          }
        };

        console.log('[Xunfei] Audio processor setup complete');
        this.isRecording = true;
        this.onStart?.();
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('[Xunfei] Received:', data);
          if (data.code !== 0) {
            console.error('[Xunfei] Error:', data.message);
            this.onError?.(data.message || '语音识别错误');
            return;
          }

          const result = data.data?.result;
          if (result) {
            const ws = result.ws || [];
            let text = '';
            console.log('[Xunfei] ws array:', ws);
            for (const item of ws) {
              console.log('[Xunfei] item.cw:', item.cw);
              for (const cw of item.cw || []) {
                console.log('[Xunfei] cw.w:', cw.w);
                text += cw.w || '';
              }
            }

            console.log('[Xunfei] Parsed text:', text, 'status:', data.data.status);
            
            // status=2 表示识别结束，停止发送音频
            if (data.data.status === 2) {
              this.isRecording = false;
            }
            
            if (text) {
              const isFinal = data.data.status === 2;
              console.log('[Xunfei] Recognized:', text, 'isFinal:', isFinal);
              this.onResult?.({ text, isFinal });
            }
          }
        } catch (e) {
          console.error('[Xunfei] Parse error:', e);
        }
      };

      this.ws.onerror = (error) => {
        console.error('[Xunfei] WebSocket error:', error);
        this.onError?.('网络连接失败');
        this.stop();
      };

      this.ws.onclose = () => {
        console.log('[Xunfei] WebSocket closed');
        this.onEnd?.();
      };

    } catch (error: any) {
      console.error('[Xunfei] Start error:', error);
      if (error.name === 'NotAllowedError') {
        this.onError?.('请允许麦克风权限');
      } else if (error.name === 'NotFoundError') {
        this.onError?.('未找到麦克风设备');
      } else {
        this.onError?.('启动语音识别失败: ' + error.message);
      }
    }
  }

  /**
   * 停止录音
   */
  stop(): void {
    if (!this.isRecording) {
      return;
    }

    // 先停止音频采集，但保持连接等待最终结果
    this.isRecording = false;

    // 关闭音频处理器
    if (this.processor) {
      this.processor.disconnect();
      this.processor = null;
    }

    // 关闭音频上下文
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    // 关闭媒体流
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }

    // 发送结束帧，等待服务端返回最终结果后关闭连接
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.sendFrame(null, 2);
      // WebSocket 会在收到 status=2 的响应后由 onclose 关闭
      // 设置超时保护，防止服务端不响应
      setTimeout(() => {
        if (this.ws) {
          this.ws.close();
          this.ws = null;
        }
      }, 2000);
    }
  }

  /**
   * 发送音频帧
   * @param audioData 音频数据
   * @param status 音频状态：0-首帧，1-中间帧，2-尾帧
   */
  private sendFrame(audioData: ArrayBuffer | null, status: number): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return;
    }

    const frame: any = {
      data: {
        status: status,
        format: 'audio/L16;rate=16000',
        encoding: 'raw',
        audio: audioData ? this.arrayBufferToBase64(audioData) : '',
      },
    };

    // 首帧需要携带 common 和 business 参数
    if (status === 0) {
      frame.common = {
        app_id: this.config.appId,
      };
      frame.business = {
        language: 'zh_cn',
        domain: 'iat',
        accent: 'mandarin',
        vad_eos: 3000,
        dwa: 'wpgs',
        ptt: 1,
        nunum: 1,
      };
    }

    this.ws.send(JSON.stringify(frame));
  }

  /**
   * Float32 转 PCM16
   */
  private float32ToPCM16(float32Array: Float32Array): ArrayBuffer {
    const buffer = new ArrayBuffer(float32Array.length * 2);
    const view = new DataView(buffer);
    for (let i = 0; i < float32Array.length; i++) {
      let s = Math.max(-1, Math.min(1, float32Array[i]));
      view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    }
    return buffer;
  }

  /**
   * ArrayBuffer 转 Base64
   */
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  /**
   * 获取当前状态
   */
  getIsRecording(): boolean {
    return this.isRecording;
  }
}

/**
 * 从 localStorage 加载讯飞配置
 */
export function loadXunfeiConfig(): XunfeiConfig | null {
  try {
    const saved = localStorage.getItem('xunfei_config');
    if (saved) {
      return JSON.parse(saved);
    }
  } catch {}
  return null;
}

/**
 * 保存讯飞配置到 localStorage
 */
export function saveXunfeiConfig(config: XunfeiConfig): void {
  localStorage.setItem('xunfei_config', JSON.stringify(config));
}

/**
 * 检查讯飞配置是否有效
 */
export function hasXunfeiConfig(): boolean {
  const config = loadXunfeiConfig();
  return !!(config?.appId && config?.apiKey && config?.apiSecret);
}

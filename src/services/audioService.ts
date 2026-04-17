/**
 * Retro Cassette Player - Audio Service
 * Wraps Web Audio API for audio playback control
 */

import { PlayerErrorType } from '../types';

// ============================================================================
// Types
// ============================================================================

export interface AudioServiceConfig {
  /** Volume level (0-100, mapped to 0-1) */
  volume?: number;
  /** Whether audio is muted */
  muted?: boolean;
  /** Playback rate (1 = normal, 4 = fast-forward/rewind) */
  playbackRate?: number;
}

export interface TimeUpdateEvent {
  currentTime: number;
  duration: number;
  progress: number;
}

export type TimeUpdateCallback = (event: TimeUpdateEvent) => void;
export type EndCallback = () => void;
export type ErrorCallback = (error: { type: PlayerErrorType; message: string }) => void;

// ============================================================================
// Constants
// ============================================================================

/** Fast-forward/rewind playback rate multiplier */
const SEEK_PLAYBACK_RATE = 4;

/** Normal playback rate */
const NORMAL_PLAYBACK_RATE = 1;

/** Minimum volume (0 = silent) */
const MIN_VOLUME = 0;

/** Maximum volume (100 = max) */
const MAX_VOLUME = 100;

// ============================================================================
// Audio Service Class
// ============================================================================

/** Number of frequency bands for visualization */
export const VISUALIZER_BANDS = 10;

/** Size of the FFT (Fast Fourier Transform) for frequency analysis */
const FFT_SIZE = 256;

/**
 * AudioService provides a clean interface for audio playback operations.
 * It wraps the Web Audio API and HTML5 Audio element for browser audio support.
 */
export class AudioService {
  private audio: HTMLAudioElement;
  private audioContext: AudioContext | null = null;
  private gainNode: GainNode | null = null;
  private sourceNode: MediaElementAudioSourceNode | null = null;
  private analyserNode: AnalyserNode | null = null;

  private timeUpdateCallback: TimeUpdateCallback | null = null;
  private endCallback: EndCallback | null = null;
  private errorCallback: ErrorCallback | null = null;
  private timeUpdateInterval: number | null = null;

  private _volume: number;
  private _isMuted: boolean;
  private _playbackRate: number;
  private _isLoaded: boolean = false;

  private objectUrlCreatedBySelf: string | null = null;

  constructor(config: AudioServiceConfig = {}) {
    this.audio = new Audio();
    this._volume = config.volume ?? 80;
    this._isMuted = config.muted ?? false;
    this._playbackRate = config.playbackRate ?? 1;

    this.setupAudioEvents();
  }

  // ========================================
  // Public API - Loading
  // ========================================

  /**
   * Load audio from a URL
   * @param url - The URL of the audio file
   */
  async loadFromUrl(url: string): Promise<void> {
    this.cleanup();
    // Set crossOrigin for streaming audio from external sources
    // This is required for Web Audio API to process cross-origin audio
    this.audio.crossOrigin = 'anonymous';
    this.audio.src = url;
    await this.loadAudio();
  }

  /**
   * Load audio from a File object
   * @param file - The audio file to load
   */
  async loadFromFile(file: File): Promise<void> {
    this.cleanup();
    const url = URL.createObjectURL(file);
    this.objectUrlCreatedBySelf = url;
    this.audio.src = url;
    await this.loadAudio();
  }

  /**
   * Check if audio is loaded
   */
  get isLoaded(): boolean {
    return this._isLoaded;
  }

  // ========================================
  // Public API - Playback Control
  // ========================================

  /**
   * Start or resume playback
   */
  async play(): Promise<void> {
    if (!this._isLoaded) {
      throw new Error('No audio loaded');
    }

    try {
      // Resume AudioContext if it's suspended (browser autoplay policy)
      if (this.audioContext && this.audioContext.state === 'suspended') {
        console.log('[DEBUG] Resuming AudioContext...');
        await this.audioContext.resume();
        console.log('[DEBUG] AudioContext resumed, state:', this.audioContext.state);
      }

      console.log('[DEBUG] Calling audio.play()...');
      await this.audio.play();
      console.log('[DEBUG] audio.play() succeeded');
    } catch (error) {
      console.error('[DEBUG] play() error:', error);
      this.handleError(PlayerErrorType.PLAYBACK_FAILED, 'Failed to start playback');
      throw error;
    }
  }

  /**
   * Pause playback
   */
  pause(): void {
    this.audio.pause();
  }

  /**
   * Stop playback and reset position to beginning
   */
  stop(): void {
    this.audio.pause();
    this.audio.currentTime = 0;
  }

  // ========================================
  // Public API - Volume Control
  // ========================================

  /**
   * Set volume level
   * @param volume - Volume level (0-100)
   */
  setVolume(volume: number): void {
    this._volume = Math.max(MIN_VOLUME, Math.min(MAX_VOLUME, volume));
    this.applyVolume();
  }

  /**
   * Get current volume level
   */
  getVolume(): number {
    return this._volume;
  }

  /**
   * Mute audio
   */
  mute(): void {
    this._isMuted = true;
    this.applyVolume();
  }

  /**
   * Unmute audio
   */
  unmute(): void {
    this._isMuted = false;
    this.applyVolume();
  }

  /**
   * Toggle mute state
   */
  toggleMute(): void {
    this._isMuted = !this._isMuted;
    this.applyVolume();
  }

  /**
   * Check if audio is muted
   */
  isMuted(): boolean {
    return this._isMuted;
  }

  // ========================================
  // Public API - Playback Rate Control
  // ========================================

  /**
   * Set playback rate
   * @param rate - Playback rate multiplier (1 = normal speed)
   */
  setPlaybackRate(rate: number): void {
    this._playbackRate = Math.max(0.25, rate);
    this.audio.playbackRate = this._playbackRate;
  }

  /**
   * Get current playback rate
   */
  getPlaybackRate(): number {
    return this._playbackRate;
  }

  /**
   * Enable fast-forward mode (4x speed)
   */
  enableFastForward(): void {
    this.setPlaybackRate(SEEK_PLAYBACK_RATE);
  }

  /**
   * Enable rewind mode (4x speed, backward)
   * Note: HTML5 Audio doesn't support negative playback rate,
   * so rewind is simulated by seeking backward periodically
   */
  enableRewind(): void {
    this.setPlaybackRate(SEEK_PLAYBACK_RATE);
  }

  /**
   * Reset to normal playback speed
   */
  resetPlaybackRate(): void {
    this.setPlaybackRate(NORMAL_PLAYBACK_RATE);
  }

  // ========================================
  // Public API - Seeking
  // ========================================

  /**
   * Seek to a specific time position
   * @param time - Time in seconds
   */
  seekTo(time: number): void {
    if (!this._isLoaded) return;
    const boundedTime = Math.max(0, Math.min(time, this.audio.duration || 0));
    this.audio.currentTime = boundedTime;
  }

  /**
   * Seek forward by a specified amount
   * @param seconds - Seconds to seek forward (default: 5)
   */
  seekForward(seconds: number = 5): void {
    this.seekTo(this.audio.currentTime + seconds);
  }

  /**
   * Seek backward by a specified amount
   * @param seconds - Seconds to seek backward (default: 5)
   */
  seekBackward(seconds: number = 5): void {
    this.seekTo(this.audio.currentTime - seconds);
  }

  /**
   * Get current playback position in seconds
   */
  getCurrentTime(): number {
    return this.audio.currentTime;
  }

  /**
   * Get total duration in seconds
   */
  getDuration(): number {
    return this.audio.duration || 0;
  }

  // ========================================
  // Public API - Audio Analysis
  // ========================================

  /**
   * Get frequency data for visualization
   * Returns an array of frequency band values (0-255)
   * @returns Uint8Array of frequency data, or empty array if analyser not available
   */
  getFrequencyData(): Uint8Array {
    if (!this.analyserNode) {
      return new Uint8Array(0);
    }

    const bufferLength = this.analyserNode.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    this.analyserNode.getByteFrequencyData(dataArray);
    return dataArray;
  }

  /**
   * Get averaged frequency bands for visualization
   * Divides the frequency spectrum into specified number of bands
   * @param bands - Number of frequency bands (default: VISUALIZER_BANDS)
   * @returns Array of averaged frequency values (0-255)
   */
  getFrequencyBands(bands: number = VISUALIZER_BANDS): number[] {
    const frequencyData = this.getFrequencyData();

    if (frequencyData.length === 0) {
      return new Array(bands).fill(0);
    }

    const bandData: number[] = [];
    const bandWidth = Math.floor(frequencyData.length / bands);

    for (let i = 0; i < bands; i++) {
      const start = i * bandWidth;
      const end = i === bands - 1 ? frequencyData.length : (i + 1) * bandWidth;

      let sum = 0;
      for (let j = start; j < end; j++) {
        sum += frequencyData[j];
      }
      const average = sum / (end - start);
      bandData.push(average);
    }

    return bandData;
  }

  /**
   * Get overall audio energy level (0-1)
   * Useful for beat detection or overall intensity
   * @returns Audio energy level between 0 and 1
   */
  getAudioEnergy(): number {
    const frequencyData = this.getFrequencyData();

    if (frequencyData.length === 0) {
      return 0;
    }

    let sum = 0;
    for (let i = 0; i < frequencyData.length; i++) {
      sum += frequencyData[i];
    }

    // Normalize to 0-1 range (255 is max value for each frequency bin)
    return sum / (frequencyData.length * 255);
  }

  /**
   * Check if analyser is available
   * @returns true if Web Audio API analyser is available
   */
  hasAnalyser(): boolean {
    return this.analyserNode !== null;
  }

  // ========================================
  // Public API - Event Callbacks
  // ========================================

  /**
   * Set callback for time update events
   * @param callback - Function to call on time update
   */
  onTimeUpdate(callback: TimeUpdateCallback): void {
    this.timeUpdateCallback = callback;
  }

  /**
   * Set callback for end of track event
   * @param callback - Function to call when track ends
   */
  onEnd(callback: EndCallback): void {
    this.endCallback = callback;
  }

  /**
   * Set callback for error events
   * @param callback - Function to call on error
   */
  onError(callback: ErrorCallback): void {
    this.errorCallback = callback;
  }

  // ========================================
  // Public API - Cleanup
  // ========================================

  /**
   * Clean up resources and event listeners
   */
  destroy(): void {
    this.cleanup();
    this.removeAudioEvents();

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    this.gainNode = null;
    this.sourceNode = null;
    this.analyserNode = null;
  }

  // ========================================
  // Private Methods - Audio Loading
  // ========================================

  private async loadAudio(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Use 'canplay' instead of 'canplaythrough' for streaming support
      // 'canplay' fires when enough data is loaded to begin playback
      // 'canplaythrough' waits for entire file to download (not suitable for streaming)
      const handleCanPlay = () => {
        this.audio.removeEventListener('canplay', handleCanPlay);
        this.audio.removeEventListener('error', handleError);

        console.log('[DEBUG] Audio canplay event fired, src:', this.audio.src?.substring(0, 100));
        this._isLoaded = true;
        this.initAudioContext();
        this.startTimeUpdateInterval();
        resolve();
      };

      const handleError = (event: Event) => {
        this.audio.removeEventListener('canplay', handleCanPlay);
        this.audio.removeEventListener('error', handleError);

        const error = (event.target as HTMLAudioElement).error;
        console.error('[DEBUG] Audio error event:', {
          code: error?.code,
          message: error?.message,
          src: this.audio.src?.substring(0, 100),
        });
        // Error code meanings:
        // 1 = MEDIA_ERR_ABORTED
        // 2 = MEDIA_ERR_NETWORK
        // 3 = MEDIA_ERR_DECODE
        // 4 = MEDIA_ERR_SRC_NOT_SUPPORTED
        const errorMessages: Record<number, string> = {
          1: '加载被中止',
          2: '网络错误',
          3: '解码错误',
          4: '不支持的格式或CORS错误',
        };
        const message = error ? (errorMessages[error.code] || error.message) : 'Failed to load audio';
        this.handleError(PlayerErrorType.LOAD_FAILED, message);
        reject(new Error(message));
      };

      this.audio.addEventListener('canplay', handleCanPlay);
      this.audio.addEventListener('error', handleError);

      console.log('[DEBUG] Starting audio load, src:', this.audio.src?.substring(0, 100));

      // Set preload to auto for streaming support
      this.audio.preload = 'auto';
      this.audio.load();
    });
  }

  private initAudioContext(): void {
    if (this.audioContext) {
      console.log('[DEBUG] AudioContext already exists, state:', this.audioContext.state);
      return;
    }

    try {
      console.log('[DEBUG] Creating new AudioContext...');
      this.audioContext = new (window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      console.log('[DEBUG] AudioContext created, initial state:', this.audioContext.state);

      this.sourceNode = this.audioContext.createMediaElementSource(this.audio);
      this.gainNode = this.audioContext.createGain();
      this.analyserNode = this.audioContext.createAnalyser();

      // Configure analyser
      this.analyserNode.fftSize = FFT_SIZE;
      this.analyserNode.smoothingTimeConstant = 0.8;

      // Connect nodes: source -> analyser -> gain -> destination
      this.sourceNode.connect(this.analyserNode);
      this.analyserNode.connect(this.gainNode);
      this.gainNode.connect(this.audioContext.destination);

      console.log('[DEBUG] Web Audio graph connected');
      this.applyVolume();
    } catch (err) {
      // If Web Audio API fails, fall back to basic audio element
      console.warn('[DEBUG] Web Audio API initialization failed:', err);
    }
  }

  // ========================================
  // Private Methods - Volume Control
  // ========================================

  private applyVolume(): void {
    // Convert 0-100 scale to 0-1
    const normalizedVolume = this._volume / MAX_VOLUME;
    const effectiveVolume = this._isMuted ? 0 : normalizedVolume;

    // Apply to Web Audio API gain node if available
    if (this.gainNode) {
      this.gainNode.gain.value = effectiveVolume;
    }

    // Also apply to audio element as fallback
    this.audio.volume = effectiveVolume;
  }

  // ========================================
  // Private Methods - Event Handling
  // ========================================

  // Debug event handlers (bound to this instance)
  private handleDebugPlay = (): void => console.log('[DEBUG] Audio event: play');
  private handleDebugPlaying = (): void => console.log('[DEBUG] Audio event: playing');
  private handleDebugPause = (): void => console.log('[DEBUG] Audio event: pause');
  private handleDebugWaiting = (): void => console.log('[DEBUG] Audio event: waiting');
  private handleDebugCanPlay = (): void => console.log('[DEBUG] Audio event: canplay');
  private handleDebugCanPlayThrough = (): void => console.log('[DEBUG] Audio event: canplaythrough');
  private handleDebugLoadedMetadata = (): void => console.log('[DEBUG] Audio event: loadedmetadata, duration:', this.audio.duration);

  private setupAudioEvents(): void {
    this.audio.addEventListener('ended', this.handleEnded);
    this.audio.addEventListener('error', this.handleErrorEvent);
    this.audio.addEventListener('timeupdate', this.handleTimeUpdate);

    // Debug events
    this.audio.addEventListener('play', this.handleDebugPlay);
    this.audio.addEventListener('playing', this.handleDebugPlaying);
    this.audio.addEventListener('pause', this.handleDebugPause);
    this.audio.addEventListener('waiting', this.handleDebugWaiting);
    this.audio.addEventListener('canplay', this.handleDebugCanPlay);
    this.audio.addEventListener('canplaythrough', this.handleDebugCanPlayThrough);
    this.audio.addEventListener('loadedmetadata', this.handleDebugLoadedMetadata);
  }

  private removeAudioEvents(): void {
    this.audio.removeEventListener('ended', this.handleEnded);
    this.audio.removeEventListener('error', this.handleErrorEvent);
    this.audio.removeEventListener('timeupdate', this.handleTimeUpdate);

    // Remove debug events
    this.audio.removeEventListener('play', this.handleDebugPlay);
    this.audio.removeEventListener('playing', this.handleDebugPlaying);
    this.audio.removeEventListener('pause', this.handleDebugPause);
    this.audio.removeEventListener('waiting', this.handleDebugWaiting);
    this.audio.removeEventListener('canplay', this.handleDebugCanPlay);
    this.audio.removeEventListener('canplaythrough', this.handleDebugCanPlayThrough);
    this.audio.removeEventListener('loadedmetadata', this.handleDebugLoadedMetadata);
  }

  private handleEnded = (): void => {
    if (this.endCallback) {
      this.endCallback();
    }
  };

  private handleErrorEvent = (event: Event): void => {
    const error = (event.target as HTMLAudioElement).error;
    const message = error?.message || 'An audio error occurred';
    this.handleError(PlayerErrorType.PLAYBACK_FAILED, message);
  };

  private handleTimeUpdate = (): void => {
    if (this.timeUpdateCallback) {
      const currentTime = this.audio.currentTime;
      const duration = this.audio.duration || 0;
      const progress = duration > 0 ? currentTime / duration : 0;

      this.timeUpdateCallback({
        currentTime,
        duration,
        progress,
      });
    }
  };

  // ========================================
  // Private Methods - Time Update Interval
  // ========================================

  private startTimeUpdateInterval(): void {
    // Use interval for more frequent time updates (60fps target)
    this.timeUpdateInterval = window.setInterval(() => {
      this.handleTimeUpdate();
    }, 1000 / 60);
  }

  private stopTimeUpdateInterval(): void {
    if (this.timeUpdateInterval !== null) {
      clearInterval(this.timeUpdateInterval);
      this.timeUpdateInterval = null;
    }
  }

  // ========================================
  // Private Methods - Error Handling
  // ========================================

  private handleError(type: PlayerErrorType, message: string): void {
    if (this.errorCallback) {
      this.errorCallback({ type, message });
    }
  }

  // ========================================
  // Private Methods - Cleanup
  // ========================================

  private cleanup(): void {
    this.stopTimeUpdateInterval();
    this.audio.pause();
    this.audio.currentTime = 0;

    // Only revoke object URLs we created ourselves (loadFromFile)
    if (this.objectUrlCreatedBySelf) {
      URL.revokeObjectURL(this.objectUrlCreatedBySelf);
      this.objectUrlCreatedBySelf = null;
    }

    this.audio.src = '';
    this._isLoaded = false;
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let audioServiceInstance: AudioService | null = null;

/**
 * Get the singleton audio service instance
 */
export function getAudioService(config?: AudioServiceConfig): AudioService {
  if (!audioServiceInstance) {
    audioServiceInstance = new AudioService(config);
  }
  return audioServiceInstance;
}

/**
 * Reset the audio service instance (useful for testing)
 */
export function resetAudioService(): void {
  if (audioServiceInstance) {
    audioServiceInstance.destroy();
    audioServiceInstance = null;
  }
}

/**
 * Tests for AudioService
 * Testing audio playback control, volume, and playback rate functionality
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AudioService, getAudioService, resetAudioService } from './audioService';

// Mock HTMLMediaElement methods
HTMLMediaElement.prototype.play = vi.fn(() => Promise.resolve());
HTMLMediaElement.prototype.pause = vi.fn();
HTMLMediaElement.prototype.load = vi.fn();

describe('AudioService', () => {
  let audioService: AudioService;

  beforeEach(() => {
    resetAudioService();
    audioService = new AudioService();
  });

  afterEach(() => {
    audioService.destroy();
  });

  describe('initialization', () => {
    it('should initialize with default config', () => {
      expect(audioService.getVolume()).toBe(80);
      expect(audioService.isMuted()).toBe(false);
      expect(audioService.getPlaybackRate()).toBe(1);
      expect(audioService.isLoaded).toBe(false);
    });

    it('should initialize with custom config', () => {
      const customService = new AudioService({
        volume: 50,
        muted: true,
        playbackRate: 2,
      });

      expect(customService.getVolume()).toBe(50);
      expect(customService.isMuted()).toBe(true);
      expect(customService.getPlaybackRate()).toBe(2);

      customService.destroy();
    });
  });

  describe('volume control', () => {
    it('should set volume within bounds (0-100)', () => {
      audioService.setVolume(50);
      expect(audioService.getVolume()).toBe(50);

      audioService.setVolume(150);
      expect(audioService.getVolume()).toBe(100);

      audioService.setVolume(-10);
      expect(audioService.getVolume()).toBe(0);
    });

    it('should toggle mute state', () => {
      expect(audioService.isMuted()).toBe(false);

      audioService.mute();
      expect(audioService.isMuted()).toBe(true);

      audioService.unmute();
      expect(audioService.isMuted()).toBe(false);

      audioService.toggleMute();
      expect(audioService.isMuted()).toBe(true);

      audioService.toggleMute();
      expect(audioService.isMuted()).toBe(false);
    });
  });

  describe('playback rate control', () => {
    it('should set playback rate', () => {
      audioService.setPlaybackRate(2);
      expect(audioService.getPlaybackRate()).toBe(2);
    });

    it('should enforce minimum playback rate of 0.25', () => {
      audioService.setPlaybackRate(0.1);
      expect(audioService.getPlaybackRate()).toBe(0.25);
    });

    it('should enable fast-forward mode (4x speed)', () => {
      audioService.enableFastForward();
      expect(audioService.getPlaybackRate()).toBe(4);
    });

    it('should enable rewind mode (4x speed)', () => {
      audioService.enableRewind();
      expect(audioService.getPlaybackRate()).toBe(4);
    });

    it('should reset to normal playback rate', () => {
      audioService.enableFastForward();
      expect(audioService.getPlaybackRate()).toBe(4);

      audioService.resetPlaybackRate();
      expect(audioService.getPlaybackRate()).toBe(1);
    });
  });

  describe('seeking', () => {
    it('should not seek when no audio is loaded', () => {
      // These should not throw
      expect(() => audioService.seekTo(10)).not.toThrow();
      expect(() => audioService.seekForward()).not.toThrow();
      expect(() => audioService.seekBackward()).not.toThrow();
    });

    it('should return 0 for current time and duration when not loaded', () => {
      expect(audioService.getCurrentTime()).toBe(0);
      expect(audioService.getDuration()).toBe(0);
    });
  });

  describe('event callbacks', () => {
    it('should register time update callback', () => {
      const callback = vi.fn();
      audioService.onTimeUpdate(callback);

      // Callback is stored, will be called during playback
      expect(callback).not.toHaveBeenCalled();
    });

    it('should register end callback', () => {
      const callback = vi.fn();
      audioService.onEnd(callback);

      expect(callback).not.toHaveBeenCalled();
    });

    it('should register error callback', () => {
      const callback = vi.fn();
      audioService.onError(callback);

      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('playback control', () => {
    it('should throw error when playing without loaded audio', async () => {
      await expect(audioService.play()).rejects.toThrow('No audio loaded');
    });

    it('should pause without error when not playing', () => {
      expect(() => audioService.pause()).not.toThrow();
    });

    it('should stop without error when not playing', () => {
      expect(() => audioService.stop()).not.toThrow();
    });
  });

  describe('cleanup', () => {
    it('should destroy service and clean up resources', () => {
      const service = new AudioService();
      service.destroy();

      // Service should be cleaned up without error
      expect(true).toBe(true);
    });
  });
});

describe('Singleton instance', () => {
  beforeEach(() => {
    resetAudioService();
  });

  it('should return the same instance', () => {
    const instance1 = getAudioService();
    const instance2 = getAudioService();

    expect(instance1).toBe(instance2);

    instance1.destroy();
  });

  it('should create new instance after reset', () => {
    const instance1 = getAudioService();
    resetAudioService();
    const instance2 = getAudioService();

    expect(instance1).not.toBe(instance2);

    instance2.destroy();
  });
});

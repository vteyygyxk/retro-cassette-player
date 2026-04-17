/**
 * useKeyboardShortcuts Hook Tests
 * Tests for keyboard shortcut functionality
 *
 * Validates: Requirements 11.1-11.5
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useKeyboardShortcuts, VOLUME_STEP } from './useKeyboardShortcuts';

describe('useKeyboardShortcuts', () => {
  const mockCallbacks = {
    onPlayPause: vi.fn(),
    onSeekForward: vi.fn(),
    onSeekBackward: vi.fn(),
    onSeekStop: vi.fn(),
    onVolumeUp: vi.fn(),
    onVolumeDown: vi.fn(),
    onMuteToggle: vi.fn(),
    onNextTrack: vi.fn(),
    onPrevTrack: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  function fireKeyDown(key: string, target?: HTMLElement) {
    const event = new KeyboardEvent('keydown', {
      key,
      bubbles: true,
    });
    Object.defineProperty(event, 'target', {
      value: target ?? document.body,
      writable: false,
    });
    window.dispatchEvent(event);
  }

  function fireKeyUp(key: string) {
    window.dispatchEvent(new KeyboardEvent('keyup', { key, bubbles: true }));
  }

  describe('Space key', () => {
    it('should call onPlayPause when Space is pressed', () => {
      renderHook(() => useKeyboardShortcuts(mockCallbacks));

      fireKeyDown(' ');

      expect(mockCallbacks.onPlayPause).toHaveBeenCalledTimes(1);
    });
  });

  describe('Arrow keys for seeking', () => {
    it('should call onSeekForward when ArrowRight is pressed', () => {
      renderHook(() => useKeyboardShortcuts(mockCallbacks));

      fireKeyDown('ArrowRight');

      expect(mockCallbacks.onSeekForward).toHaveBeenCalledTimes(1);
    });

    it('should call onSeekBackward when ArrowLeft is pressed', () => {
      renderHook(() => useKeyboardShortcuts(mockCallbacks));

      fireKeyDown('ArrowLeft');

      expect(mockCallbacks.onSeekBackward).toHaveBeenCalledTimes(1);
    });

    it('should call onSeekStop when ArrowRight is released', () => {
      renderHook(() => useKeyboardShortcuts(mockCallbacks));

      fireKeyDown('ArrowRight');
      fireKeyUp('ArrowRight');

      expect(mockCallbacks.onSeekStop).toHaveBeenCalledTimes(1);
    });

    it('should call onSeekStop when ArrowLeft is released', () => {
      renderHook(() => useKeyboardShortcuts(mockCallbacks));

      fireKeyDown('ArrowLeft');
      fireKeyUp('ArrowLeft');

      expect(mockCallbacks.onSeekStop).toHaveBeenCalledTimes(1);
    });

    it('should not start seek multiple times while key is held', () => {
      renderHook(() => useKeyboardShortcuts(mockCallbacks));

      fireKeyDown('ArrowRight');
      fireKeyDown('ArrowRight');
      fireKeyDown('ArrowRight');

      expect(mockCallbacks.onSeekForward).toHaveBeenCalledTimes(1);
    });
  });

  describe('Arrow keys for volume', () => {
    it('should call onVolumeUp when ArrowUp is pressed', () => {
      renderHook(() => useKeyboardShortcuts(mockCallbacks));

      fireKeyDown('ArrowUp');

      expect(mockCallbacks.onVolumeUp).toHaveBeenCalledTimes(1);
    });

    it('should call onVolumeDown when ArrowDown is pressed', () => {
      renderHook(() => useKeyboardShortcuts(mockCallbacks));

      fireKeyDown('ArrowDown');

      expect(mockCallbacks.onVolumeDown).toHaveBeenCalledTimes(1);
    });
  });

  describe('M key for mute', () => {
    it('should call onMuteToggle when M is pressed', () => {
      renderHook(() => useKeyboardShortcuts(mockCallbacks));

      fireKeyDown('m');

      expect(mockCallbacks.onMuteToggle).toHaveBeenCalledTimes(1);
    });

    it('should call onMuteToggle when Shift+M is pressed', () => {
      renderHook(() => useKeyboardShortcuts(mockCallbacks));

      fireKeyDown('M');

      expect(mockCallbacks.onMuteToggle).toHaveBeenCalledTimes(1);
    });
  });

  describe('Track navigation keys', () => {
    it('should call onNextTrack when N is pressed', () => {
      renderHook(() => useKeyboardShortcuts(mockCallbacks));

      fireKeyDown('n');

      expect(mockCallbacks.onNextTrack).toHaveBeenCalledTimes(1);
    });

    it('should call onPrevTrack when P is pressed', () => {
      renderHook(() => useKeyboardShortcuts(mockCallbacks));

      fireKeyDown('p');

      expect(mockCallbacks.onPrevTrack).toHaveBeenCalledTimes(1);
    });
  });

  describe('Disabled state', () => {
    it('should not handle shortcuts when disabled', () => {
      renderHook(() => useKeyboardShortcuts({ ...mockCallbacks, enabled: false }));

      fireKeyDown(' ');
      fireKeyDown('ArrowUp');

      expect(mockCallbacks.onPlayPause).not.toHaveBeenCalled();
      expect(mockCallbacks.onVolumeUp).not.toHaveBeenCalled();
    });
  });

  describe('Input focus exclusion', () => {
    it('should not trigger shortcuts when typing in an input', () => {
      renderHook(() => useKeyboardShortcuts(mockCallbacks));

      const input = document.createElement('input');
      fireKeyDown(' ', input);

      expect(mockCallbacks.onPlayPause).not.toHaveBeenCalled();
    });

    it('should not trigger shortcuts when typing in a textarea', () => {
      renderHook(() => useKeyboardShortcuts(mockCallbacks));

      const textarea = document.createElement('textarea');
      fireKeyDown(' ', textarea);

      expect(mockCallbacks.onPlayPause).not.toHaveBeenCalled();
    });
  });

  describe('Cleanup', () => {
    it('should remove event listeners on unmount', () => {
      const { unmount } = renderHook(() => useKeyboardShortcuts(mockCallbacks));

      unmount();

      fireKeyDown(' ');

      expect(mockCallbacks.onPlayPause).not.toHaveBeenCalled();
    });
  });

  describe('Volume step constant', () => {
    it('should export VOLUME_STEP as 5', () => {
      expect(VOLUME_STEP).toBe(5);
    });
  });
});

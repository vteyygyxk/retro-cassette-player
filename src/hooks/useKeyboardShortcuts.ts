/**
 * useKeyboardShortcuts Hook
 * Provides keyboard shortcuts for the cassette player
 *
 * Shortcuts:
 * - Space: Toggle play/pause
 * - Left Arrow: Seek backward (while playing)
 * - Right Arrow: Seek forward (while playing)
 * - Up Arrow: Increase volume
 * - Down Arrow: Decrease volume
 * - M: Toggle mute
 * - N: Next track
 * - P: Previous track
 *
 * Validates: Requirements 11.1-11.5
 */

import { useEffect, useCallback, useRef } from 'react';

/**
 * Options for the useKeyboardShortcuts hook
 */
export interface KeyboardShortcutsOptions {
  /** Toggle play/pause */
  onPlayPause: () => void;
  /** Start seeking forward */
  onSeekForward: () => void;
  /** Start seeking backward */
  onSeekBackward: () => void;
  /** Stop seeking */
  onSeekStop: () => void;
  /** Increase volume */
  onVolumeUp: () => void;
  /** Decrease volume */
  onVolumeDown: () => void;
  /** Toggle mute */
  onMuteToggle: () => void;
  /** Go to next track */
  onNextTrack: () => void;
  /** Go to previous track */
  onPrevTrack: () => void;
  /** Whether shortcuts are enabled */
  enabled?: boolean;
}

/** Volume step per key press */
const VOLUME_STEP = 5;

/**
 * useKeyboardShortcuts - Hook for keyboard shortcut handling
 *
 * Registers global keyboard event listeners and maps keys to player actions.
 * Uses keydown/keyup events for seek (hold to seek) and keydown for other actions.
 *
 * @param options - Keyboard shortcut options and callbacks
 */
export function useKeyboardShortcuts(options: KeyboardShortcutsOptions) {
  const {
    onPlayPause,
    onSeekForward,
    onSeekBackward,
    onSeekStop,
    onVolumeUp,
    onVolumeDown,
    onMuteToggle,
    onNextTrack,
    onPrevTrack,
    enabled = true,
  } = options;

  // Track active seek to prevent multiple seek starts
  const isSeekingRef = useRef(false);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!enabled) return;

    // Skip shortcuts when user is typing in an input/textarea
    const target = e.target as HTMLElement;
    if (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.tagName === 'SELECT' ||
      target.isContentEditable
    ) {
      return;
    }

    switch (e.key) {
      case ' ': {
        e.preventDefault();
        onPlayPause();
        break;
      }
      case 'ArrowRight': {
        e.preventDefault();
        if (!isSeekingRef.current) {
          isSeekingRef.current = true;
          onSeekForward();
        }
        break;
      }
      case 'ArrowLeft': {
        e.preventDefault();
        if (!isSeekingRef.current) {
          isSeekingRef.current = true;
          onSeekBackward();
        }
        break;
      }
      case 'ArrowUp': {
        e.preventDefault();
        onVolumeUp();
        break;
      }
      case 'ArrowDown': {
        e.preventDefault();
        onVolumeDown();
        break;
      }
      case 'm':
      case 'M': {
        onMuteToggle();
        break;
      }
      case 'n':
      case 'N': {
        onNextTrack();
        break;
      }
      case 'p':
      case 'P': {
        onPrevTrack();
        break;
      }
      default:
        break;
    }
  }, [enabled, onPlayPause, onSeekForward, onSeekBackward, onVolumeUp, onVolumeDown, onMuteToggle, onNextTrack, onPrevTrack]);

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    if (!enabled) return;

    if ((e.key === 'ArrowRight' || e.key === 'ArrowLeft') && isSeekingRef.current) {
      isSeekingRef.current = false;
      onSeekStop();
    }
  }, [enabled, onSeekStop]);

  useEffect(() => {
    if (!enabled) return;

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      // Clean up any active seek on unmount
      if (isSeekingRef.current) {
        onSeekStop();
        isSeekingRef.current = false;
      }
    };
  }, [enabled, handleKeyDown, handleKeyUp, onSeekStop]);
}

export { VOLUME_STEP };

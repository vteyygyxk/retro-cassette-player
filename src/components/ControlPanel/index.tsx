/**
 * ControlPanel Component - Main playback control panel
 * Displays all playback control buttons with proper disabled states
 */

import type { ControlPanelProps } from '../../types';
import { PlayButton } from './buttons/PlayButton';
import { PauseButton } from './buttons/PauseButton';
import { StopButton } from './buttons/StopButton';
import { FastForwardButton } from './buttons/FastForwardButton';
import { RewindButton } from './buttons/RewindButton';
import { PrevButton } from './buttons/PrevButton';
import { NextButton } from './buttons/NextButton';
import { EjectButton } from './buttons/EjectButton';
import { PlayModeButton } from './buttons/PlayModeButton';
import styles from './ControlPanel.module.css';

/**
 * ControlPanel - Main playback control panel
 * 
 * Displays all playback control buttons:
 * - Play/Pause/Stop for basic playback control
 * - Fast Forward/Rewind for seeking (hold to activate)
 * - Prev/Next for track navigation
 * - Eject for clearing the current track
 * 
 * Button disabled states:
 * - Play/Pause/Stop: disabled when no track is loaded
 * - Fast Forward/Rewind: disabled when no track or stopped
 * - Prev/Next: disabled when playlist has 0 or 1 tracks
 * - Eject: disabled when no track is loaded
 * 
 * @param props - Component props
 * @returns The ControlPanel component
 */
export function ControlPanel({
  playState,
  isSeeking,
  seekDirection,
  volume: _volume, // Reserved for volume control integration
  isMuted: _isMuted, // Reserved for mute state display
  playMode = 'sequence',
  onPlay,
  onPause,
  onStop,
  onSeekForward,
  onSeekBackward,
  onSeekStop,
  onVolumeChange: _onVolumeChange, // Reserved for volume control integration
  onMuteToggle: _onMuteToggle, // Reserved for mute toggle integration
  onEject,
  onNextTrack,
  onPrevTrack,
  onCyclePlayMode,
  disabled = false,
  className,
}: ControlPanelProps) {
  // Reserved variables for future volume control integration
  void _volume;
  void _isMuted;
  void _onVolumeChange;
  void _onMuteToggle;
  // Determine button disabled states based on player state
  // All playback buttons are disabled when:
  // 1. The entire panel is disabled (disabled prop)
  // 2. No track is loaded (we infer this from playState === 'stopped' and no seeking)
  
  // For now, we use the disabled prop as the primary control
  // The parent component (TapePlayer) will determine if a track is loaded
  
  // Basic playback buttons (Play, Pause, Stop)
  // Disabled when no track is loaded or panel is disabled
  const playbackDisabled = disabled;
  
  // Play button: enabled when track is loaded and not already playing
  const playDisabled = playbackDisabled || playState === 'playing';
  
  // Pause button: enabled only when playing
  const pauseDisabled = playbackDisabled || playState !== 'playing';
  
  // Stop button: enabled when playing or paused
  const stopDisabled = playbackDisabled || playState === 'stopped';
  
  // Seek buttons (Fast Forward, Rewind)
  // Disabled when no track, stopped, or panel is disabled
  const seekDisabled = playbackDisabled || playState === 'stopped';
  
  // Fast Forward button: active state
  const isFastForwardActive = isSeeking && seekDirection === 'forward';
  
  // Rewind button: active state
  const isRewindActive = isSeeking && seekDirection === 'backward';
  
  // Handle seek button mouse/touch events
  const handleFastForwardMouseDown = () => {
    if (!seekDisabled) {
      onSeekForward();
    }
  };
  
  const handleRewindMouseDown = () => {
    if (!seekDisabled) {
      onSeekBackward();
    }
  };
  
  const handleSeekMouseUp = () => {
    onSeekStop();
  };
  
  const handleSeekMouseLeave = () => {
    if (isSeeking) {
      onSeekStop();
    }
  };

  return (
    <div
      className={`${styles.controlPanel} ${className ?? ''}`}
      role="group"
      aria-label="播放控制"
      data-testid="control-panel"
    >
      {/* Main transport controls row - classic cassette deck layout */}
      <div className={styles.controlsRow}>
        {/* Rewind button (快退) */}
        <RewindButton
          disabled={seekDisabled}
          isActive={isRewindActive}
          onMouseDown={handleRewindMouseDown}
          onMouseUp={handleSeekMouseUp}
          onMouseLeave={handleSeekMouseLeave}
          onTouchStart={handleRewindMouseDown}
          onTouchEnd={handleSeekMouseUp}
        />

        {/* Play button (播放) - the most prominent control */}
        <PlayButton
          disabled={playDisabled}
          onClick={onPlay}
        />

        {/* Pause button (暂停) */}
        <PauseButton
          disabled={pauseDisabled}
          onClick={onPause}
        />

        {/* Stop button (停止) */}
        <StopButton
          disabled={stopDisabled}
          onClick={onStop}
        />

        {/* Fast forward button (快进) */}
        <FastForwardButton
          disabled={seekDisabled}
          isActive={isFastForwardActive}
          onMouseDown={handleFastForwardMouseDown}
          onMouseUp={handleSeekMouseUp}
          onMouseLeave={handleSeekMouseLeave}
          onTouchStart={handleFastForwardMouseDown}
          onTouchEnd={handleSeekMouseUp}
        />
      </div>

      {/* Secondary controls row - navigation and utility */}
      <div className={styles.secondaryRow}>
        {/* Previous track button */}
        <PrevButton
          disabled={disabled}
          onClick={onPrevTrack}
        />

        {/* Next track button */}
        <NextButton
          disabled={disabled}
          onClick={onNextTrack}
        />

        {/* Play mode button */}
        {onCyclePlayMode && (
          <PlayModeButton
            playMode={playMode}
            onClick={onCyclePlayMode}
            disabled={disabled}
          />
        )}

        {/* Eject button */}
        <EjectButton
          disabled={disabled}
          onClick={onEject}
        />
      </div>
    </div>
  );
}

// Re-export button components for individual use
export { PlayButton } from './buttons/PlayButton';
export { PauseButton } from './buttons/PauseButton';
export { StopButton } from './buttons/StopButton';
export { FastForwardButton } from './buttons/FastForwardButton';
export { RewindButton } from './buttons/RewindButton';
export { PrevButton } from './buttons/PrevButton';
export { NextButton } from './buttons/NextButton';
export { EjectButton } from './buttons/EjectButton';
export { PlayModeButton } from './buttons/PlayModeButton';

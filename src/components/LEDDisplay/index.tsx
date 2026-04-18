/**
 * LEDDisplay Component - Main retro LED display panel
 * Displays track info, time, and status indicators in a retro LED style
 */

import type { LEDDisplayProps, SeekDirection } from '../../types';
import { TrackInfo } from './TrackInfo';
import { TimeDisplay } from './TimeDisplay';
import { StatusIndicator } from './StatusIndicator';
import { Visualizer } from './Visualizer';
import styles from './LEDDisplay.module.css';

/**
 * Extended props for LEDDisplay with seek state
 */
export interface LEDDisplayExtendedProps extends LEDDisplayProps {
  /** Whether seeking is active */
  isSeeking?: boolean;
  /** Direction of seeking */
  seekDirection?: SeekDirection;
  /** Frequency band values for visualizer (0-255) */
  frequencyBands?: number[];
}

/**
 * LEDDisplay component - Main retro LED display panel
 *
 * Features:
 * - Retro green LED display style with glow effect
 * - Track name display with scrolling animation for long names
 * - Current time and duration in MM:SS format
 * - Volume display with priority (shows temporarily when adjusting)
 * - FF/REW status indicators when seeking
 * - "--:--" display when no track is loaded
 *
 * Display priority:
 * 1. Volume display (when showVolume is true)
 * 2. Time display (default)
 *
 * @param props - Component props
 * @returns The LEDDisplay component
 */
export function LEDDisplay({
  currentTime,
  duration,
  trackName,
  artist,
  playState,
  showVolume = false,
  volume = 0,
  isSeeking = false,
  seekDirection = null,
  frequencyBands = [],
  className,
}: LEDDisplayExtendedProps) {
  // Determine if a track is loaded
  const hasTrack = trackName !== undefined && trackName !== '';
  const isPlaying = playState === 'playing';

  return (
    <div
      className={`${styles.ledDisplay} ${!hasTrack ? styles.noTrack : ''} ${className ?? ''}`}
      data-testid="led-display"
      role="region"
      aria-label="LED display"
    >
      {/* Track info section */}
      <TrackInfo
        trackName={trackName}
        artist={artist}
        hasTrack={hasTrack}
        isPlaying={isPlaying}
      />

      {/* Time display section (with volume priority) */}
      <TimeDisplay
        currentTime={currentTime}
        duration={duration}
        showVolume={showVolume}
        volume={volume}
        hasTrack={hasTrack}
      />

      {/* Status indicator section */}
      <StatusIndicator
        playState={playState}
        isSeeking={isSeeking}
        seekDirection={seekDirection}
      />

      {/* Audio visualizer section */}
      {hasTrack && (
        <Visualizer
          frequencyBands={frequencyBands}
          isPlaying={isPlaying}
        />
      )}
    </div>
  );
}

// Re-export sub-components for individual use
export { TrackInfo } from './TrackInfo';
export { TimeDisplay } from './TimeDisplay';
export { StatusIndicator } from './StatusIndicator';
export { Visualizer } from './Visualizer';

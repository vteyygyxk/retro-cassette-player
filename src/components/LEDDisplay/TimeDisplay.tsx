/**
 * TimeDisplay Component - Displays current time and duration
 * Shows playback position in MM:SS format with volume display priority
 */

import { useMemo } from 'react';
import { formatTime } from '../../utils/formatTime';
import styles from './LEDDisplay.module.css';

/**
 * Props for TimeDisplay component
 */
export interface TimeDisplayProps {
  /** Current playback position in seconds */
  currentTime: number;
  /** Total duration in seconds */
  duration: number;
  /** Whether to show volume instead of time */
  showVolume?: boolean;
  /** Current volume level (0-100) */
  volume?: number;
  /** Whether a track is loaded */
  hasTrack: boolean;
  /** Additional CSS class */
  className?: string;
}

/**
 * TimeDisplay component - Displays current time and duration
 * 
 * Features:
 * - Shows current playback position in MM:SS format
 * - Shows total duration in MM:SS format
 * - Shows volume level temporarily when adjusting (priority display)
 * - Shows "--:--" when no track is loaded
 * - Volume display includes visual bar indicator
 * 
 * @param props - Component props
 * @returns The TimeDisplay component
 */
export function TimeDisplay({
  currentTime,
  duration,
  showVolume = false,
  volume = 0,
  hasTrack,
  className,
}: TimeDisplayProps) {
  // Format current time and duration
  const formattedCurrentTime = useMemo(() => {
    if (!hasTrack) {
      return '--:--';
    }
    return formatTime(currentTime);
  }, [currentTime, hasTrack]);
  
  const formattedDuration = useMemo(() => {
    if (!hasTrack) {
      return '--:--';
    }
    return formatTime(duration);
  }, [duration, hasTrack]);
  
  // Generate volume bar segments (10 segments)
  const volumeSegments = useMemo(() => {
    const segments: boolean[] = [];
    const activeSegments = Math.ceil((volume / 100) * 10);
    for (let i = 0; i < 10; i++) {
      segments.push(i < activeSegments);
    }
    return segments;
  }, [volume]);
  
  // Determine if we should show volume display (priority over time)
  const displayVolume = showVolume && hasTrack;
  
  return (
    <div 
      className={`${styles.timeDisplay} ${className ?? ''}`}
      data-testid="time-display"
      role="timer"
      aria-label={`Current time: ${formattedCurrentTime}, Duration: ${formattedDuration}`}
    >
      {displayVolume ? (
        // Volume display (priority)
        <div className={styles.volumeDisplay}>
          <span className={styles.volumeLabel}>VOL</span>
          {volume >= 100 ? (
            <span className={styles.volumeMax}>MAX</span>
          ) : (
            <span className={styles.volumeValue}>{Math.round(volume)}</span>
          )}
          <div className={styles.volumeBar} aria-hidden="true">
            {volumeSegments.map((isActive, index) => (
              <div
                key={index}
                className={`${styles.volumeSegment} ${isActive ? styles.active : ''}`}
              />
            ))}
          </div>
        </div>
      ) : (
        // Time display
        <>
          <span className={styles.currentTime} aria-label="Current time">
            {formattedCurrentTime}
          </span>
          <span className={styles.timeSeparator} aria-hidden="true">
            /
          </span>
          <span className={styles.totalTime} aria-label="Total duration">
            {formattedDuration}
          </span>
        </>
      )}
    </div>
  );
}

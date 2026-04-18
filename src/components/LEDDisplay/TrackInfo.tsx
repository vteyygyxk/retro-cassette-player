/**
 * TrackInfo Component - Displays track name with scrolling animation
 * Shows the current track name, scrolling when playing
 */

import styles from './LEDDisplay.module.css';

/**
 * Props for TrackInfo component
 */
export interface TrackInfoProps {
  /** Track name to display */
  trackName?: string;
  /** Artist name (optional, for future use) */
  artist?: string;
  /** Whether a track is loaded */
  hasTrack: boolean;
  /** Whether the track is currently playing */
  isPlaying?: boolean;
  /** Additional CSS class */
  className?: string;
}

/**
 * TrackInfo component - Displays track name with scrolling animation
 *
 * Features:
 * - Shows track name with scrolling animation when playing
 * - Shows placeholder text when no track is loaded
 * - Smooth scrolling animation with CSS
 * - Scrolls across the full width of the LED display
 *
 * @param props - Component props
 * @returns The TrackInfo component
 */
export function TrackInfo({
  trackName,
  artist: _artist,
  hasTrack,
  isPlaying = false,
  className,
}: TrackInfoProps) {
  // If no track is loaded, show placeholder
  if (!hasTrack || !trackName) {
    return (
      <div
        className={`${styles.trackInfo} ${className ?? ''}`}
        data-testid="track-info"
      >
        <span className={styles.noTrack}>No Track</span>
      </div>
    );
  }

  // Always scroll when playing
  const shouldScroll = isPlaying;

  return (
    <div
      className={`${styles.trackInfo} ${className ?? ''}`}
      data-testid="track-info"
      aria-label={`Now playing: ${trackName}`}
    >
      <div
        className={`${styles.trackName} ${shouldScroll ? styles.scrolling : ''}`}
      >
        {shouldScroll ? (
          <>
            <span className={styles.trackNameScroll}>{trackName}</span>
            <span className={styles.trackNameScroll}>{trackName}</span>
          </>
        ) : (
          <span className={styles.trackNameDisplay}>{trackName}</span>
        )}
      </div>
    </div>
  );
}

/**
 * TrackInfo Component - Displays track name with scrolling animation
 * Shows the current track name, scrolling if too long
 */

import { useState, useEffect, useRef } from 'react';
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
  /** Additional CSS class */
  className?: string;
}

/**
 * TrackInfo component - Displays track name with scrolling animation
 * 
 * Features:
 * - Shows track name, scrolling if too long for the display
 * - Shows placeholder text when no track is loaded
 * - Smooth scrolling animation with CSS
 * 
 * @param props - Component props
 * @returns The TrackInfo component
 */
export function TrackInfo({
  trackName,
  artist: _artist,
  hasTrack,
  className,
}: TrackInfoProps) {
  const trackNameRef = useRef<HTMLDivElement>(null);
  const [shouldScroll, setShouldScroll] = useState(false);

  // Check if text overflows and enable scrolling
  useEffect(() => {
    const element = trackNameRef.current;
    if (element && trackName) {
      // Check if the text width exceeds the container width
      const isOverflowing = element.scrollWidth > element.clientWidth;
      setShouldScroll(isOverflowing);
    } else {
      setShouldScroll(false);
    }
  }, [trackName]);

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

  return (
    <div 
      className={`${styles.trackInfo} ${className ?? ''}`}
      data-testid="track-info"
      aria-label={`Now playing: ${trackName}`}
    >
      <div
        ref={trackNameRef}
        className={`${styles.trackName} ${shouldScroll ? styles.scrolling : ''}`}
        title={trackName}
      >
        {shouldScroll ? (
          // Duplicate text for seamless scrolling
          <>
            <span className={styles.trackNameScroll}>{trackName}</span>
            <span className={styles.trackNameScroll}>{trackName}</span>
          </>
        ) : (
          trackName
        )}
      </div>
    </div>
  );
}

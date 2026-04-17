/**
 * Visualizer Component - LED frequency spectrum visualizer
 * Displays real-time audio frequency bands in a retro LED style
 */

import { useMemo } from 'react';
import { VISUALIZER_BANDS } from '../../services/audioService';
import styles from './Visualizer.module.css';

export interface VisualizerProps {
  /** Frequency band values (0-255) */
  frequencyBands: number[];
  /** Whether audio is currently playing */
  isPlaying: boolean;
  /** Optional className for styling */
  className?: string;
}

/**
 * Visualizer component - Renders LED-style frequency bars
 *
 * Features:
 * - 10 frequency bands displayed as vertical LED bars
 * - Smooth height transitions
 * - Retro green LED glow effect
 * - Responsive design
 *
 * @param props - Component props
 * @returns The Visualizer component
 */
export function Visualizer({
  frequencyBands,
  isPlaying,
  className,
}: VisualizerProps) {
  // Ensure we have the correct number of bands
  const bands = useMemo(() => {
    if (frequencyBands.length === 0) {
      return new Array(VISUALIZER_BANDS).fill(0);
    }
    return frequencyBands;
  }, [frequencyBands]);

  // Calculate total energy for glow intensity
  const totalEnergy = useMemo(() => {
    if (bands.length === 0) return 0;
    const sum = bands.reduce((acc, val) => acc + val, 0);
    return sum / (bands.length * 255);
  }, [bands]);

  return (
    <div
      className={`${styles.visualizer} ${className ?? ''}`}
      role="img"
      aria-label="Audio frequency visualizer"
      style={
        {
          '--glow-intensity': totalEnergy,
        } as React.CSSProperties
      }
    >
      <div className={styles.barsContainer}>
        {bands.map((value, index) => {
          // Convert 0-255 range to percentage (0-100)
          const heightPercent = Math.max(4, (value / 255) * 100);

          return (
            <div
              key={index}
              className={`${styles.bar} ${isPlaying && value > 10 ? styles.active : ''}`}
              style={
                {
                  '--bar-height': `${heightPercent}%`,
                } as React.CSSProperties
              }
              data-testid={`visualizer-bar-${index}`}
            />
          );
        })}
      </div>
    </div>
  );
}

export default Visualizer;

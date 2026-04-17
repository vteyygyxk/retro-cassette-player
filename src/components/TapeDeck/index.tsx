/**
 * TapeDeck Component - Main cassette tape visualization
 * Displays the complete cassette tape with reels, body, and album cover
 */

import { useCallback, useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { TapeDeckProps } from '../../types';
import { Reel } from './Reel';
import { CassetteBody } from './CassetteBody';
import { AlbumCover } from './AlbumCover';
import styles from './TapeDeck.module.css';

/**
 * Extended props for internal use with track info
 */
export interface TapeDeckExtendedProps extends TapeDeckProps {
  /** Current track for album cover display */
  currentTrack?: {
    albumCover?: string;
    name: string;
    album?: string;
  } | null;
}

/**
 * TapeDeck component - Main cassette tape visualization
 * 
 * Renders a complete cassette tape with:
 * - Left and right spinning reels
 * - Cassette body with skin-based styling
 * - Album cover in the center
 * - Tape change animation
 * 
 * @param props - Component props
 * @returns The TapeDeck component
 */
export function TapeDeck({
  skin,
  isPlaying,
  isSeeking,
  seekDirection,
  currentTime,
  duration,
  isChangingTape,
  currentTrack,
  onSeek,
  className,
}: TapeDeckExtendedProps) {
  // Determine if reels should be spinning
  const isSpinning = isPlaying || isSeeking;

  // Determine spin direction based on seek direction
  // Left reel: clockwise when playing, counter-clockwise when rewinding
  // Right reel: counter-clockwise when playing, clockwise when rewinding
  const leftReelDirection = seekDirection === 'backward' ? 'counter-clockwise' : 'clockwise';
  const rightReelDirection = seekDirection === 'backward' ? 'clockwise' : 'counter-clockwise';

  // Progress bar seek interaction
  const progressRef = useRef<HTMLDivElement>(null);
  const [isDraggingProgress, setIsDraggingProgress] = useState(false);
  const [previewProgress, setPreviewProgress] = useState<number | null>(null);

  const hasDuration = duration > 0;

  // Calculate seek time from clientX position
  const calculateSeekTime = useCallback((clientX: number): number => {
    if (!progressRef.current || !hasDuration) return 0;
    const rect = progressRef.current.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    return ratio * duration;
  }, [duration, hasDuration]);

  // Handle seek interaction (click or drag)
  const handleSeekInteraction = useCallback((clientX: number) => {
    if (!hasDuration || !onSeek) return;
    const time = calculateSeekTime(clientX);
    onSeek(time);
  }, [hasDuration, onSeek, calculateSeekTime]);

  // Mouse handlers
  const handleProgressMouseDown = useCallback((e: React.MouseEvent) => {
    if (!hasDuration || !onSeek) return;
    e.preventDefault();
    setIsDraggingProgress(true);
    const time = calculateSeekTime(e.clientX);
    setPreviewProgress(time / duration);
    onSeek(time);
  }, [hasDuration, onSeek, calculateSeekTime, duration]);

  // Touch handlers
  const handleProgressTouchStart = useCallback((e: React.TouchEvent) => {
    if (!hasDuration || !onSeek || e.touches.length !== 1) return;
    setIsDraggingProgress(true);
    const touch = e.touches[0];
    const time = calculateSeekTime(touch.clientX);
    setPreviewProgress(time / duration);
    onSeek(time);
  }, [hasDuration, onSeek, calculateSeekTime, duration]);

  // Global move/up handlers for dragging
  useEffect(() => {
    if (!isDraggingProgress) return;

    const handleMouseMove = (e: MouseEvent) => {
      const time = calculateSeekTime(e.clientX);
      setPreviewProgress(time / duration);
      onSeek?.(time);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      const touch = e.touches[0];
      const time = calculateSeekTime(touch.clientX);
      setPreviewProgress(time / duration);
      onSeek?.(time);
    };

    const handleEnd = () => {
      setIsDraggingProgress(false);
      setPreviewProgress(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleEnd);
    window.addEventListener('touchmove', handleTouchMove);
    window.addEventListener('touchend', handleEnd);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleEnd);
    };
  }, [isDraggingProgress, calculateSeekTime, duration, onSeek]);

  // Compute display progress: use preview during drag, actual time otherwise
  const displayProgress = previewProgress !== null
    ? previewProgress
    : (hasDuration ? currentTime / duration : 0);

  // Animation variants for tape change
  const tapeChangeVariants = {
    initial: {
      opacity: 0,
      y: -20,
      scale: 0.95,
    },
    animate: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.3,
        ease: 'easeOut' as const,
      },
    },
    exit: {
      opacity: 0,
      y: 20,
      scale: 0.95,
      transition: {
        duration: 0.2,
        ease: 'easeIn' as const,
      },
    },
  };

  return (
    <div
      className={`${styles.tapeDeck} ${className ?? ''}`}
      data-testid="tape-deck"
      data-skin={skin.id}
      role="img"
      aria-label="Cassette tape"
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={skin.id}
          variants={tapeChangeVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          className={styles.tapeDeckInner}
        >
          <CassetteBody
            skin={skin}
            isChanging={isChangingTape}
          >
            {/* Reels container */}
            <div className={styles.reelsContainer}>
              {/* Left reel */}
              <div className={styles.reelWrapper}>
                <Reel
                  color={skin.reelColor}
                  pattern={skin.reelPattern}
                  isSpinning={isSpinning}
                  spinDirection={leftReelDirection}
                  size={80}
                />
              </div>
              
              {/* Center album cover */}
              <AlbumCover
                track={currentTrack ?? null}
                isChanging={isChangingTape}
              />
              
              {/* Right reel */}
              <div className={styles.reelWrapper}>
                <Reel
                  color={skin.reelColor}
                  pattern={skin.reelPattern}
                  isSpinning={isSpinning}
                  spinDirection={rightReelDirection}
                  size={80}
                />
              </div>
            </div>
            
            {/* Progress indicator (tape position) — draggable */}
            <div
              ref={progressRef}
              className={`${styles.progressContainer} ${onSeek && hasDuration ? styles.progressInteractive : ''} ${isDraggingProgress ? styles.progressDragging : ''}`}
              onMouseDown={handleProgressMouseDown}
              onTouchStart={handleProgressTouchStart}
              role={onSeek && hasDuration ? 'slider' : undefined}
              aria-label={onSeek && hasDuration ? '播放进度' : undefined}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(displayProgress * 100)}
              aria-valuetext={hasDuration ? `${Math.floor(displayProgress * duration / 60)}:${String(Math.floor(displayProgress * duration) % 60).padStart(2, '0')} / ${Math.floor(duration / 60)}:${String(Math.floor(duration) % 60).padStart(2, '0')}` : undefined}
              tabIndex={onSeek && hasDuration ? 0 : undefined}
            >
              <div
                className={styles.progressBar}
                style={{
                  width: `${displayProgress * 100}%`,
                }}
              />
              {/* Drag handle — visible on hover/drag */}
              {(onSeek && hasDuration) && (
                <div
                  className={styles.progressHandle}
                  style={{ left: `${displayProgress * 100}%` }}
                />
              )}
            </div>
          </CassetteBody>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// Re-export sub-components for individual use
export { Reel } from './Reel';
export { CassetteBody } from './CassetteBody';
export { AlbumCover } from './AlbumCover';

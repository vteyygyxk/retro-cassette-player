/**
 * StatusIndicator Component - Displays FF/REW indicators
 * Shows fast-forward and rewind status indicators
 */

import { motion, AnimatePresence } from 'framer-motion';
import type { PlayState, SeekDirection } from '../../types';
import styles from './LEDDisplay.module.css';

/**
 * Props for StatusIndicator component
 */
export interface StatusIndicatorProps {
  /** Current play state */
  playState: PlayState;
  /** Whether seeking is active */
  isSeeking: boolean;
  /** Direction of seeking */
  seekDirection: SeekDirection;
  /** Additional CSS class */
  className?: string;
}

/**
 * StatusIndicator component - Displays FF/REW indicators
 * 
 * Features:
 * - Shows "FF" indicator when fast-forwarding
 * - Shows "REW" indicator when rewinding
 * - Shows playing indicator dots when playing
 * - Animated transitions between states
 * 
 * @param props - Component props
 * @returns The StatusIndicator component
 */
export function StatusIndicator({
  playState,
  isSeeking,
  seekDirection,
  className,
}: StatusIndicatorProps) {
  // Determine which status to show
  const showFF = isSeeking && seekDirection === 'forward';
  const showREW = isSeeking && seekDirection === 'backward';
  const isPlaying = playState === 'playing' && !isSeeking;
  
  // Animation variants for status badges
  const badgeVariants = {
    initial: {
      opacity: 0,
      scale: 0.8,
    },
    animate: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.15,
        ease: 'easeOut' as const,
      },
    },
    exit: {
      opacity: 0,
      scale: 0.8,
      transition: {
        duration: 0.1,
        ease: 'easeIn' as const,
      },
    },
  };
  
  return (
    <div 
      className={`${styles.statusIndicator} ${className ?? ''}`}
      data-testid="status-indicator"
      role="status"
      aria-live="polite"
      aria-label={
        showFF ? 'Fast forwarding' :
        showREW ? 'Rewinding' :
        isPlaying ? 'Playing' : ''
      }
    >
      <AnimatePresence mode="wait">
        {showFF && (
          <motion.span
            key="ff"
            variants={badgeVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className={`${styles.statusBadge} ${styles.ff} ${styles.visible}`}
          >
            FF
          </motion.span>
        )}
        
        {showREW && (
          <motion.span
            key="rew"
            variants={badgeVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className={`${styles.statusBadge} ${styles.rew} ${styles.visible}`}
          >
            REW
          </motion.span>
        )}
        
        {isPlaying && (
          <motion.div
            key="playing"
            variants={badgeVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className={styles.playingIndicator}
            aria-hidden="true"
          >
            <span className={styles.playingDot} />
            <span className={styles.playingDot} />
            <span className={styles.playingDot} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * RandomPlayButton Component - Button for "随心听" (Random Play) feature
 * Fetches and plays a random song from online music API
 */

import { motion } from 'framer-motion';
import styles from '../ControlPanel.module.css';

export interface RandomPlayButtonProps {
  /** Whether a random play operation is in progress */
  isLoading?: boolean;
  /** Click handler */
  onClick: () => void;
  /** Additional CSS class */
  className?: string;
}

/**
 * RandomPlayButton - Plays a random online song
 *
 * Visual design:
 * - Dice/music note hybrid icon
 * - Distinctive purple/pink gradient to stand out
 */
export function RandomPlayButton({
  isLoading = false,
  onClick,
  className,
}: RandomPlayButtonProps) {
  return (
    <motion.button
      type="button"
      className={`${styles.controlButton} ${styles.randomPlayButton} ${className ?? ''}`}
      onClick={onClick}
      disabled={isLoading}
      whileTap={isLoading ? {} : { scale: 0.97 }}
      aria-label={isLoading ? '正在获取随机歌曲...' : '随心听'}
      data-testid="random-play-button"
    >
      {isLoading ? (
        <svg
          className={`${styles.buttonIcon} ${styles.spinning}`}
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z" opacity="0.3"/>
          <path d="M12 4V2C6.48 2 2 6.48 2 12h2c0-4.42 3.58-8 8-8z"/>
        </svg>
      ) : (
        <svg
          className={styles.buttonIcon}
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
        >
          {/* Dice with music note - represents random music */}
          <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3z" opacity="0.3"/>
          <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14z"/>
          <circle cx="8" cy="8" r="1.5"/>
          <circle cx="16" cy="8" r="1.5"/>
          <path d="M12 11c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3zm0 4c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z"/>
        </svg>
      )}
      <span className={styles.tooltip} role="tooltip">
        {isLoading ? '加载中...' : '随心听'}
      </span>
    </motion.button>
  );
}

export default RandomPlayButton;

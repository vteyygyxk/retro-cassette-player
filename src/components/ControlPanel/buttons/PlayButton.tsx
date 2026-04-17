/**
 * PlayButton Component - Play control button
 * Starts playback when clicked
 */

import { motion } from 'framer-motion';
import styles from '../ControlPanel.module.css';

export interface PlayButtonProps {
  /** Whether the button is disabled */
  disabled?: boolean;
  /** Click handler */
  onClick: () => void;
  /** Additional CSS class */
  className?: string;
}

/**
 * PlayButton - Starts audio playback
 *
 * Visual design:
 * - Triangle pointing right (play icon)
 * - Metallic button style
 * - Disabled when no track is loaded
 */
export function PlayButton({ disabled = false, onClick, className }: PlayButtonProps) {
  return (
    <motion.button
      type="button"
      className={`${styles.controlButton} ${styles.playButton} ${className ?? ''}`}
      onClick={onClick}
      disabled={disabled}
      whileTap={disabled ? {} : { scale: 0.97 }}
      aria-label="播放"
      data-testid="play-button"
    >
      <svg
        className={styles.buttonIcon}
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M8 5v14l11-7z" />
      </svg>
      <span className={styles.tooltip} role="tooltip">播放</span>
    </motion.button>
  );
}

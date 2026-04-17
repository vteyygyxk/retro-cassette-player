/**
 * PauseButton Component - Pause control button
 * Pauses playback when clicked
 */

import { motion } from 'framer-motion';
import styles from '../ControlPanel.module.css';

export interface PauseButtonProps {
  /** Whether the button is disabled */
  disabled?: boolean;
  /** Click handler */
  onClick: () => void;
  /** Additional CSS class */
  className?: string;
}

/**
 * PauseButton - Pauses audio playback
 *
 * Visual design:
 * - Two vertical bars (pause icon)
 * - Metallic button style
 * - Disabled when no track is loaded or not playing
 */
export function PauseButton({ disabled = false, onClick, className }: PauseButtonProps) {
  return (
    <motion.button
      type="button"
      className={`${styles.controlButton} ${styles.pauseButton} ${className ?? ''}`}
      onClick={onClick}
      disabled={disabled}
      whileTap={disabled ? {} : { scale: 0.97 }}
      aria-label="暂停"
      data-testid="pause-button"
    >
      <svg
        className={styles.buttonIcon}
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
      </svg>
      <span className={styles.tooltip} role="tooltip">暂停</span>
    </motion.button>
  );
}

/**
 * PrevButton Component - Previous track button
 * Navigates to the previous track in the playlist
 */

import { motion } from 'framer-motion';
import styles from '../ControlPanel.module.css';

export interface PrevButtonProps {
  /** Whether the button is disabled */
  disabled?: boolean;
  /** Click handler */
  onClick: () => void;
  /** Additional CSS class */
  className?: string;
}

/**
 * PrevButton - Navigates to the previous track
 *
 * Visual design:
 * - Triangle pointing left with vertical bar (previous icon)
 * - Metallic button style
 * - Disabled when playlist has only one track or is empty
 */
export function PrevButton({ disabled = false, onClick, className }: PrevButtonProps) {
  return (
    <motion.button
      type="button"
      className={`${styles.controlButton} ${styles.prevButton} ${className ?? ''}`}
      onClick={onClick}
      disabled={disabled}
      whileTap={disabled ? {} : { scale: 0.97 }}
      aria-label="上一曲"
      data-testid="prev-button"
    >
      <svg
        className={styles.buttonIcon}
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
      </svg>
      <span className={styles.tooltip} role="tooltip">上一曲</span>
    </motion.button>
  );
}

/**
 * NextButton Component - Next track button
 * Navigates to the next track in the playlist
 */

import { motion } from 'framer-motion';
import styles from '../ControlPanel.module.css';

export interface NextButtonProps {
  /** Whether the button is disabled */
  disabled?: boolean;
  /** Click handler */
  onClick: () => void;
  /** Additional CSS class */
  className?: string;
}

/**
 * NextButton - Navigates to the next track
 *
 * Visual design:
 * - Triangle pointing right with vertical bar (next icon)
 * - Metallic button style
 * - Disabled when playlist has only one track or is empty
 */
export function NextButton({ disabled = false, onClick, className }: NextButtonProps) {
  return (
    <motion.button
      type="button"
      className={`${styles.controlButton} ${styles.nextButton} ${className ?? ''}`}
      onClick={onClick}
      disabled={disabled}
      whileTap={disabled ? {} : { scale: 0.97 }}
      aria-label="下一曲"
      data-testid="next-button"
    >
      <svg
        className={styles.buttonIcon}
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
      </svg>
      <span className={styles.tooltip} role="tooltip">下一曲</span>
    </motion.button>
  );
}

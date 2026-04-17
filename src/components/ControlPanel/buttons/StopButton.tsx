/**
 * StopButton Component - Stop control button
 * Stops playback and resets position when clicked
 */

import { motion } from 'framer-motion';
import styles from '../ControlPanel.module.css';

export interface StopButtonProps {
  /** Whether the button is disabled */
  disabled?: boolean;
  /** Click handler */
  onClick: () => void;
  /** Additional CSS class */
  className?: string;
}

/**
 * StopButton - Stops audio playback and resets position
 *
 * Visual design:
 * - Square (stop icon)
 * - Metallic button style
 * - Disabled when no track is loaded
 */
export function StopButton({ disabled = false, onClick, className }: StopButtonProps) {
  return (
    <motion.button
      type="button"
      className={`${styles.controlButton} ${styles.stopButton} ${className ?? ''}`}
      onClick={onClick}
      disabled={disabled}
      whileTap={disabled ? {} : { scale: 0.97 }}
      aria-label="停止"
      data-testid="stop-button"
    >
      <svg
        className={styles.buttonIcon}
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M6 6h12v12H6z" />
      </svg>
      <span className={styles.tooltip} role="tooltip">停止</span>
    </motion.button>
  );
}

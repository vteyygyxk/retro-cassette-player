/**
 * RewindButton Component - Rewind control button
 * Seeks backward at 4x speed when held
 */

import { motion } from 'framer-motion';
import styles from '../ControlPanel.module.css';

export interface RewindButtonProps {
  /** Whether the button is disabled */
  disabled?: boolean;
  /** Whether rewind is currently active */
  isActive?: boolean;
  /** Mouse down handler (start seeking) */
  onMouseDown: () => void;
  /** Mouse up handler (stop seeking) */
  onMouseUp: () => void;
  /** Mouse leave handler (stop seeking if active) */
  onMouseLeave: () => void;
  /** Touch start handler (start seeking) */
  onTouchStart: () => void;
  /** Touch end handler (stop seeking) */
  onTouchEnd: () => void;
  /** Additional CSS class */
  className?: string;
}

/**
 * RewindButton - Seeks backward at 4x speed when held
 *
 * Visual design:
 * - Two triangles pointing left (rewind icon)
 * - Metallic button style
 * - Highlights when active
 * - Disabled when no track is loaded or stopped
 */
export function RewindButton({
  disabled = false,
  isActive = false,
  onMouseDown,
  onMouseUp,
  onMouseLeave,
  onTouchStart,
  onTouchEnd,
  className,
}: RewindButtonProps) {
  return (
    <motion.button
      type="button"
      className={`${styles.controlButton} ${styles.rewindButton} ${isActive ? styles.pressed : ''} ${className ?? ''}`}
      disabled={disabled}
      onMouseDown={onMouseDown}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseLeave}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      whileTap={disabled ? {} : { scale: 0.97 }}
      aria-label="快退"
      aria-pressed={isActive}
      data-testid="rewind-button"
    >
      <svg
        className={styles.buttonIcon}
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M11 18V6l-8.5 6 8.5 6zm.5-6l8.5 6V6l-8.5 6z" />
      </svg>
      <span className={styles.tooltip} role="tooltip">快退</span>
    </motion.button>
  );
}

/**
 * FastForwardButton Component - Fast forward control button
 * Seeks forward at 4x speed when held
 */

import { motion } from 'framer-motion';
import styles from '../ControlPanel.module.css';

export interface FastForwardButtonProps {
  /** Whether the button is disabled */
  disabled?: boolean;
  /** Whether fast forward is currently active */
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
 * FastForwardButton - Seeks forward at 4x speed when held
 *
 * Visual design:
 * - Two triangles pointing right (fast forward icon)
 * - Metallic button style
 * - Highlights when active
 * - Disabled when no track is loaded or stopped
 */
export function FastForwardButton({
  disabled = false,
  isActive = false,
  onMouseDown,
  onMouseUp,
  onMouseLeave,
  onTouchStart,
  onTouchEnd,
  className,
}: FastForwardButtonProps) {
  return (
    <motion.button
      type="button"
      className={`${styles.controlButton} ${styles.fastForwardButton} ${isActive ? styles.pressed : ''} ${className ?? ''}`}
      disabled={disabled}
      onMouseDown={onMouseDown}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseLeave}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      whileTap={disabled ? {} : { scale: 0.97 }}
      aria-label="快进"
      aria-pressed={isActive}
      data-testid="fast-forward-button"
    >
      <svg
        className={styles.buttonIcon}
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M4 18l8.5-6L4 6v12zm9-12v12l8.5-6L13 6z" />
      </svg>
      <span className={styles.tooltip} role="tooltip">快进</span>
    </motion.button>
  );
}

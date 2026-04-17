/**
 * EjectButton Component - Eject button
 * Ejects the current tape (clears the current track)
 */

import { motion } from 'framer-motion';
import styles from '../ControlPanel.module.css';

export interface EjectButtonProps {
  /** Whether the button is disabled */
  disabled?: boolean;
  /** Click handler */
  onClick: () => void;
  /** Additional CSS class */
  className?: string;
}

/**
 * EjectButton - Ejects the current tape
 *
 * Visual design:
 * - Triangle pointing up with horizontal bar below (eject icon)
 * - Metallic button style
 * - Disabled when no track is loaded
 */
export function EjectButton({ disabled = false, onClick, className }: EjectButtonProps) {
  return (
    <motion.button
      type="button"
      className={`${styles.controlButton} ${styles.ejectButton} ${className ?? ''}`}
      onClick={onClick}
      disabled={disabled}
      whileTap={disabled ? {} : { scale: 0.97 }}
      aria-label="弹出"
      data-testid="eject-button"
    >
      <svg
        className={styles.buttonIcon}
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M12 4l-8 8h16l-8-8zm-8 12v2h16v-2H4z" />
      </svg>
      <span className={styles.tooltip} role="tooltip">弹出</span>
    </motion.button>
  );
}

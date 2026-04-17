/**
 * PlayModeButton Component - Button to cycle through play modes
 * Supports sequence, loop, single, and shuffle modes
 */

import { motion } from 'framer-motion';
import type { PlayMode } from '../../types';
import styles from '../ControlPanel.module.css';

export interface PlayModeButtonProps {
  /** Current play mode */
  playMode: PlayMode;
  /** Callback when button is clicked */
  onClick: () => void;
  /** Whether the button is disabled */
  disabled?: boolean;
  /** Optional className for styling */
  className?: string;
}

/** Mode display configuration with SVG icons */
const MODE_CONFIG: Record<PlayMode, { title: string; icon: JSX.Element }> = {
  sequence: {
    title: '顺序播放',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M4 18h4v-2H4v2zm0-5h10v-2H4v2zm0-5h16V6H4v2zm14 5l4 4-4 4v-3H9v-2h9v-3z" />
      </svg>
    ),
  },
  loop: {
    title: '列表循环',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z" />
      </svg>
    ),
  },
  single: {
    title: '单曲循环',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4zm-4-2V9h-1l-2 1v1h1.5v4H13z" />
      </svg>
    ),
  },
  shuffle: {
    title: '随机播放',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z" />
      </svg>
    ),
  },
};

/**
 * PlayModeButton - Button to toggle between play modes
 *
 * Modes cycle in order: sequence → loop → single → shuffle → sequence
 *
 * @param props - Component props
 * @returns The PlayModeButton component
 */
export function PlayModeButton({
  playMode,
  onClick,
  disabled = false,
  className,
}: PlayModeButtonProps) {
  const config = MODE_CONFIG[playMode];

  return (
    <motion.button
      type="button"
      className={`${styles.controlButton} ${styles.playModeButton} ${className ?? ''}`}
      onClick={onClick}
      disabled={disabled}
      whileTap={disabled ? {} : { scale: 0.97 }}
      aria-label={config.title}
      data-testid="play-mode-button"
      data-mode={playMode}
    >
      <svg
        className={styles.buttonIcon}
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden="true"
      >
        {config.icon.props.children}
      </svg>
      <span className={styles.tooltip} role="tooltip">{config.title}</span>
    </motion.button>
  );
}

export default PlayModeButton;

/**
 * Speaker Component - Retro speaker grille UI
 * Displays a vertical speaker with woofer and tweeter
 */

import type { PlayState } from '../../types';
import styles from './Speaker.module.css';

export interface SpeakerProps {
  /** Current play state for vibration animation */
  playState?: PlayState;
  /** Side position */
  side: 'left' | 'right';
}

export function Speaker({ playState = 'stopped', side }: SpeakerProps) {
  const isPlaying = playState === 'playing';

  return (
    <div
      className={`${styles.speaker} ${side === 'left' ? styles.speakerLeft : styles.speakerRight}`}
      aria-hidden="true"
    >
      {/* Speaker body */}
      <div className={styles.speakerBody}>
        {/* Top tweeter */}
        <div className={styles.tweeter}>
          <div className={styles.tweeterCone}>
            <div className={styles.tweeterDome} />
          </div>
          <div className={styles.tweeterRing} />
        </div>

        {/* Main woofer */}
        <div className={`${styles.woofer} ${isPlaying ? styles.wooferActive : ''}`}>
          <div className={styles.wooferSuspension} />
          <div className={styles.wooferCone}>
            <div className={styles.wooferCap} />
          </div>
          <div className={styles.wooferRing} />
        </div>

        {/* Bass port */}
        <div className={styles.bassPort} />

        {/* Grille overlay */}
        <div className={styles.grille} />
      </div>

      {/* Mounting screws */}
      <div className={`${styles.screw} ${styles.screwTL}`} />
      <div className={`${styles.screw} ${styles.screwTR}`} />
      <div className={`${styles.screw} ${styles.screwBL}`} />
      <div className={`${styles.screw} ${styles.screwBR}`} />
    </div>
  );
}

/**
 * CassetteBody Component - Main cassette tape body
 * Renders the outer shell and label area of the cassette with 3D details
 */

import type { TapeSkin } from '../../types';
import styles from './TapeDeck.module.css';

export interface CassetteBodyProps {
  /** Current skin for styling */
  skin: TapeSkin;
  /** Whether the tape is currently changing */
  isChanging: boolean;
  /** Additional CSS class */
  className?: string;
}

/**
 * CassetteBody component for the tape shell
 * Provides the outer container with skin-based styling and realistic details
 */
export function CassetteBody({ skin, isChanging, className, children }: React.PropsWithChildren<CassetteBodyProps>) {
  return (
    <div
      className={`${styles.cassetteBody} ${isChanging ? styles.cassetteBodyChanging : ''} ${className ?? ''}`}
      style={{
        backgroundColor: skin.bodyColor,
        background: skin.bodyGradient ?? skin.bodyColor,
      }}
      data-testid="cassette-body"
      data-skin={skin.id}
    >
      {/* Corner screws */}
      <div className={`${styles.screwHole} ${styles.screwHoleTopLeft}`} />
      <div className={`${styles.screwHole} ${styles.screwHoleTopRight}`} />
      <div className={`${styles.screwHole} ${styles.screwHoleBottomLeft}`} />
      <div className={`${styles.screwHole} ${styles.screwHoleBottomRight}`} />

      {/* Top label strip */}
      <div
        className={styles.labelStrip}
        style={{ backgroundColor: skin.labelColor }}
      />

      {/* Main content area */}
      <div className={styles.cassetteContent}>
        {children}
      </div>

      {/* Bottom label strip */}
      <div
        className={styles.labelStrip}
        style={{ backgroundColor: skin.labelColor }}
      />

      {/* Tape window */}
      <div className={styles.tapeWindow} />
    </div>
  );
}

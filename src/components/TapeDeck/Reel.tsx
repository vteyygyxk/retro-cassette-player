/**
 * Reel Component - Spinning cassette tape reel
 * Displays a rotating reel with 3D depth and mechanical detail
 */

import { motion } from 'framer-motion';
import type { ReelProps } from '../../types';
import styles from './TapeDeck.module.css';

/**
 * Reel component for cassette tape visualization
 * Renders a spinning reel with configurable direction and speed
 */
export function Reel({
  color,
  pattern,
  isSpinning,
  spinDirection,
  size = 80,
  className,
}: ReelProps) {
  // Calculate rotation direction
  const rotationMultiplier = spinDirection === 'clockwise' ? 1 : -1;

  // Determine tape thickness based on side
  // (left reel gets fatter as tape plays, right gets thinner)
  const isLeftReel = spinDirection === 'counter-clockwise';

  return (
    <motion.div
      className={`${styles.reel} ${className ?? ''}`}
      style={{
        width: size,
        height: size,
        backgroundColor: color,
        background: pattern ?? `repeating-conic-gradient(from 0deg, ${color}dd 0deg 30deg, ${color} 30deg 60deg)`,
      }}
      animate={{
        rotate: isSpinning ? 360 * rotationMultiplier : 0,
      }}
      transition={{
        rotate: {
          duration: isSpinning ? 2 : 0,
          repeat: isSpinning ? Infinity : 0,
          ease: 'linear',
        },
      }}
      data-testid="tape-reel"
      aria-hidden="true"
    >
      {/* Tape band - outer ring showing wound tape */}
      <div style={{
        position: 'absolute',
        top: '10%',
        left: '10%',
        right: '10%',
        bottom: '10%',
        borderRadius: '50%',
        background: `radial-gradient(circle, transparent 40%, rgba(80, 40, 20, 0.3) 41%, rgba(80, 40, 20, 0.3) 70%, transparent 71%)`,
        boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.3)',
        pointerEvents: 'none',
      }} />

      {/* Center hub */}
      <div className={styles.reelHub} />

      {/* Spokes pattern */}
      <div className={styles.reelSpokes}>
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className={styles.reelSpoke}
            style={{
              transform: `rotate(${i * 60}deg)`,
            }}
          />
        ))}
      </div>
    </motion.div>
  );
}

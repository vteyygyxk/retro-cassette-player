/**
 * VolumeKnob Component - Rotary volume control knob
 * Provides a realistic rotary knob interface for volume control
 * 
 * Features:
 * - Rotary knob visual with indicator
 * - Mouse drag rotation
 * - Touch rotation support
 * - Click to toggle mute
 * - Visual feedback for volume level
 * 
 * Validates: Requirements 9.1-9.5
 */

import { useCallback, useRef, useState, useEffect } from 'react';
import type { VolumeKnobProps } from '../../types';
import styles from './VolumeKnob.module.css';

/**
 * VolumeKnob - Rotary volume control component
 * 
 * The knob maps rotation angle to volume (0-100):
 * - Minimum angle: -135° (volume 0)
 * - Maximum angle: +135° (volume 100)
 * - Total rotation range: 270°
 * 
 * Interaction:
 * - Drag (mouse/touch) to rotate and adjust volume
 * - Click to toggle mute state
 * 
 * @param props - Component props
 * @returns The VolumeKnob component
 */
export function VolumeKnob({
  volume,
  isMuted,
  onChange,
  onMuteToggle,
  disabled = false,
  className,
}: VolumeKnobProps) {
  const knobRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startAngle, setStartAngle] = useState(0);
  const [startVolume, setStartVolume] = useState(volume);
  const didDragRef = useRef(false);

  // Constants for angle-to-volume mapping
  const MIN_ANGLE = -135; // degrees, corresponds to volume 0
  const MAX_ANGLE = 135;  // degrees, corresponds to volume 100
  const ANGLE_RANGE = MAX_ANGLE - MIN_ANGLE; // 270 degrees

  /**
   * Convert volume (0-100) to rotation angle (degrees)
   */
  const volumeToAngle = useCallback((vol: number): number => {
    const clampedVolume = Math.max(0, Math.min(100, vol));
    return MIN_ANGLE + (clampedVolume / 100) * ANGLE_RANGE;
    // MIN_ANGLE and ANGLE_RANGE are constants, no need to include in deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Convert rotation angle (degrees) to volume (0-100)
   */
  const angleToVolume = useCallback((angle: number): number => {
    const clampedAngle = Math.max(MIN_ANGLE, Math.min(MAX_ANGLE, angle));
    return ((clampedAngle - MIN_ANGLE) / ANGLE_RANGE) * 100;
    // MIN_ANGLE and ANGLE_RANGE are constants, no need to include in deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Calculate angle from center of knob to a point
   */
  const calculateAngle = useCallback((clientX: number, clientY: number): number => {
    if (!knobRef.current) return 0;

    const rect = knobRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const deltaX = clientX - centerX;
    const deltaY = clientY - centerY;

    // Calculate angle in degrees (0° is up, clockwise positive)
    const angle = Math.atan2(deltaX, -deltaY) * (180 / Math.PI);

    return angle;
  }, []);

  /**
   * Handle mouse/touch drag start
   */
  const handleDragStart = useCallback((
    clientX: number,
    clientY: number
  ) => {
    if (disabled) return;

    const currentAngle = calculateAngle(clientX, clientY);
    setIsDragging(true);
    setStartAngle(currentAngle);
    setStartVolume(volume);
    didDragRef.current = false;
  }, [disabled, calculateAngle, volume]);

  /**
   * Handle mouse/touch drag move
   */
  const handleDragMove = useCallback((
    clientX: number,
    clientY: number
  ) => {
    if (!isDragging || disabled) return;

    const currentAngle = calculateAngle(clientX, clientY);
    let angleDelta = currentAngle - startAngle;

    // Handle angle wrap-around (e.g., from 179° to -179°)
    if (angleDelta > 180) angleDelta -= 360;
    if (angleDelta < -180) angleDelta += 360;

    // Calculate new angle based on start volume
    const startAngleFromVolume = volumeToAngle(startVolume);
    let newAngle = startAngleFromVolume + angleDelta;

    // Clamp to valid range
    newAngle = Math.max(MIN_ANGLE, Math.min(MAX_ANGLE, newAngle));

    // Convert to volume and update
    const newVolume = Math.round(angleToVolume(newAngle));

    if (newVolume !== volume) {
      didDragRef.current = true;
      onChange(newVolume);
    }
    // MIN_ANGLE is a constant, no need to include in deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDragging, disabled, calculateAngle, startAngle, startVolume, volumeToAngle, angleToVolume, volume, onChange]);

  /**
   * Handle mouse/touch drag end
   */
  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  /**
   * Handle click for mute toggle
   * Only toggle mute if not dragging and no drag occurred
   */
  const handleClick = useCallback(() => {
    if (disabled || isDragging || didDragRef.current) return;
    onMuteToggle();
  }, [disabled, isDragging, onMuteToggle]);

  // Mouse event handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    handleDragStart(e.clientX, e.clientY);
  }, [handleDragStart]);

  // Touch event handlers
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      handleDragStart(touch.clientX, touch.clientY);
    }
  }, [handleDragStart]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      handleDragMove(touch.clientX, touch.clientY);
    }
  }, [handleDragMove]);

  const handleTouchEnd = useCallback(() => {
    handleDragEnd();
  }, [handleDragEnd]);

  // Global mouse event listeners for drag
  useEffect(() => {
    if (isDragging) {
      const handleGlobalMouseMove = (e: MouseEvent) => {
        handleDragMove(e.clientX, e.clientY);
      };

      const handleGlobalMouseUp = () => {
        handleDragEnd();
      };

      window.addEventListener('mousemove', handleGlobalMouseMove);
      window.addEventListener('mouseup', handleGlobalMouseUp);

      return () => {
        window.removeEventListener('mousemove', handleGlobalMouseMove);
        window.removeEventListener('mouseup', handleGlobalMouseUp);
      };
    }
  }, [isDragging, handleDragMove, handleDragEnd]);

  // Calculate current rotation angle
  const rotationAngle = volumeToAngle(isMuted ? 0 : volume);

  // Generate tick marks for volume level indicator
  const tickCount = 11; // 0, 10, 20, ..., 100
  const ticks = Array.from({ length: tickCount }, (_, i) => {
    const tickVolume = i * 10;
    const tickAngle = volumeToAngle(tickVolume);
    const isActive = tickVolume <= (isMuted ? 0 : volume);
    return { angle: tickAngle, isActive, volume: tickVolume };
  });

  return (
    <div
      className={`${styles.volumeKnob} ${className ?? ''} ${disabled ? styles.disabled : ''} ${isDragging ? styles.dragging : ''}`}
      role="slider"
      aria-label="音量控制"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={isMuted ? 0 : volume}
      aria-valuetext={isMuted ? '静音' : `音量 ${volume}%`}
      data-testid="volume-knob"
      data-volume={isMuted ? 0 : volume}
      data-muted={isMuted}
    >
      {/* Volume level label */}
      <div className={styles.volumeLabel}>
        {isMuted ? 'MUTE' : volume === 100 ? 'MAX' : `${volume}%`}
      </div>

      {/* Knob container with tick marks */}
      <div className={styles.knobContainer}>
        {/* Tick marks around the knob */}
        <div className={styles.tickMarks}>
          {ticks.map((tick, index) => (
            <div
              key={index}
              className={`${styles.tick} ${tick.isActive ? styles.tickActive : ''}`}
              style={{
                transform: `rotate(${tick.angle}deg)`,
              }}
            />
          ))}
        </div>

        {/* The actual knob */}
        <div
          ref={knobRef}
          className={styles.knob}
          style={{
            transform: `rotate(${rotationAngle}deg)`,
          }}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onClick={handleClick}
        >
          {/* Knob indicator line */}
          <div className={styles.indicator} />
          
          {/* Knob center dot */}
          <div className={styles.centerDot} />
        </div>
      </div>

      {/* Mute indicator */}
      {isMuted && (
        <div className={styles.muteIndicator} aria-hidden="true">
          🔇
        </div>
      )}
    </div>
  );
}

export default VolumeKnob;

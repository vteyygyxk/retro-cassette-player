/**
 * useResponsive Hook
 * Detects screen size and provides responsive breakpoint information
 *
 * Breakpoints:
 * - mobile: < 480px
 * - tablet: 480px - 768px
 * - desktop: > 768px
 *
 * Validates: Requirements 10.1-10.5
 */

import { useState, useEffect, useCallback } from 'react';

/**
 * Screen breakpoint types
 */
export type Breakpoint = 'mobile' | 'tablet' | 'desktop';

/**
 * Responsive state information
 */
export interface ResponsiveState {
  /** Current breakpoint */
  breakpoint: Breakpoint;
  /** Current window width in pixels */
  width: number;
  /** Current window height in pixels */
  height: number;
  /** Whether the screen is mobile-sized (< 480px) */
  isMobile: boolean;
  /** Whether the screen is tablet-sized (480px - 768px) */
  isTablet: boolean;
  /** Whether the screen is desktop-sized (> 768px) */
  isDesktop: boolean;
  /** Whether touch is likely the primary input */
  isTouchDevice: boolean;
}

/** Breakpoint thresholds */
const MOBILE_MAX = 480;
const TABLET_MAX = 768;

/**
 * Determine the current breakpoint based on width
 */
function getBreakpoint(width: number): Breakpoint {
  if (width < MOBILE_MAX) return 'mobile';
  if (width < TABLET_MAX) return 'tablet';
  return 'desktop';
}

/**
 * Detect if the device supports touch
 */
function detectTouch(): boolean {
  return (
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0
  );
}

/**
 * useResponsive - Hook for responsive screen detection
 *
 * Listens to window resize events and provides current breakpoint information.
 * Uses a debounce of 150ms to avoid excessive re-renders during resize.
 *
 * @returns Current responsive state
 */
export function useResponsive(): ResponsiveState {
  const [state, setState] = useState<ResponsiveState>(() => ({
    breakpoint: getBreakpoint(window.innerWidth),
    width: window.innerWidth,
    height: window.innerHeight,
    isMobile: window.innerWidth < MOBILE_MAX,
    isTablet: window.innerWidth >= MOBILE_MAX && window.innerWidth < TABLET_MAX,
    isDesktop: window.innerWidth >= TABLET_MAX,
    isTouchDevice: detectTouch(),
  }));

  const handleResize = useCallback(() => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const breakpoint = getBreakpoint(width);

    setState({
      breakpoint,
      width,
      height,
      isMobile: breakpoint === 'mobile',
      isTablet: breakpoint === 'tablet',
      isDesktop: breakpoint === 'desktop',
      isTouchDevice: detectTouch(),
    });
  }, []);

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;

    const debouncedResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(handleResize, 150);
    };

    window.addEventListener('resize', debouncedResize);

    return () => {
      window.removeEventListener('resize', debouncedResize);
      clearTimeout(timeoutId);
    };
  }, [handleResize]);

  return state;
}

export { MOBILE_MAX, TABLET_MAX };

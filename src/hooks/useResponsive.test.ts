/**
 * useResponsive Hook Tests
 * Tests for responsive breakpoint detection
 *
 * Validates: Requirements 10.1-10.5
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useResponsive, MOBILE_MAX, TABLET_MAX } from './useResponsive';

describe('useResponsive', () => {
  const originalInnerWidth = window.innerWidth;
  const originalInnerHeight = window.innerHeight;

  beforeEach(() => {
    // Default to desktop size
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    });
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 768,
    });
  });

  afterEach(() => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: originalInnerWidth,
    });
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: originalInnerHeight,
    });
  });

  describe('Initial state', () => {
    it('should return desktop breakpoint for wide screens', () => {
      const { result } = renderHook(() => useResponsive());

      expect(result.current.breakpoint).toBe('desktop');
      expect(result.current.isDesktop).toBe(true);
      expect(result.current.isMobile).toBe(false);
      expect(result.current.isTablet).toBe(false);
    });

    it('should return correct width and height', () => {
      const { result } = renderHook(() => useResponsive());

      expect(result.current.width).toBe(1024);
      expect(result.current.height).toBe(768);
    });
  });

  describe('Breakpoint thresholds', () => {
    it('should export correct MOBILE_MAX value', () => {
      expect(MOBILE_MAX).toBe(480);
    });

    it('should export correct TABLET_MAX value', () => {
      expect(TABLET_MAX).toBe(768);
    });
  });

  describe('Responsive state fields', () => {
    it('should include all expected fields', () => {
      const { result } = renderHook(() => useResponsive());

      expect(result.current).toHaveProperty('breakpoint');
      expect(result.current).toHaveProperty('width');
      expect(result.current).toHaveProperty('height');
      expect(result.current).toHaveProperty('isMobile');
      expect(result.current).toHaveProperty('isTablet');
      expect(result.current).toHaveProperty('isDesktop');
      expect(result.current).toHaveProperty('isTouchDevice');
    });
  });

  describe('Resize handling', () => {
    it('should update state on resize (debounced)', async () => {
      vi.useFakeTimers();

      const { result } = renderHook(() => useResponsive());

      // Simulate resize to mobile
      Object.defineProperty(window, 'innerWidth', { value: 320, writable: true, configurable: true });
      window.dispatchEvent(new Event('resize'));

      // Before debounce
      expect(result.current.breakpoint).toBe('desktop');

      // After debounce
      act(() => {
        vi.advanceTimersByTime(200);
      });

      expect(result.current.breakpoint).toBe('mobile');
      expect(result.current.isMobile).toBe(true);

      vi.useRealTimers();
    });

    it('should cleanup resize listener on unmount', () => {
      const removeSpy = vi.spyOn(window, 'removeEventListener');
      const { unmount } = renderHook(() => useResponsive());

      unmount();

      expect(removeSpy).toHaveBeenCalledWith('resize', expect.any(Function));
      removeSpy.mockRestore();
    });
  });
});

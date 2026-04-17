/**
 * LEDDisplay Component Tests
 * Tests for the retro LED display panel
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LEDDisplay } from './index';
import { formatTime } from '../../utils/formatTime';
import { TrackInfo } from './TrackInfo';
import { TimeDisplay } from './TimeDisplay';
import { StatusIndicator } from './StatusIndicator';
import type { PlayState, SeekDirection } from '../../types';

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
      <div className={className} {...props}>
        {children}
      </div>
    ),
    span: ({ children, className, ...props }: React.HTMLAttributes<HTMLSpanElement>) => (
      <span className={className} {...props}>
        {children}
      </span>
    ),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// ============================================================================
// formatTime Utility Tests
// ============================================================================

describe('formatTime', () => {
  it('should format 0 seconds as 00:00', () => {
    expect(formatTime(0)).toBe('00:00');
  });

  it('should format 65 seconds as 01:05', () => {
    expect(formatTime(65)).toBe('01:05');
  });

  it('should format 3600 seconds as 60:00', () => {
    expect(formatTime(3600)).toBe('60:00');
  });

  it('should format 59 seconds as 00:59', () => {
    expect(formatTime(59)).toBe('00:59');
  });

  it('should format 125 seconds as 02:05', () => {
    expect(formatTime(125)).toBe('02:05');
  });

  it('should handle negative values as --:--', () => {
    expect(formatTime(-1)).toBe('--:--');
  });

  it('should handle NaN as --:--', () => {
    expect(formatTime(NaN)).toBe('--:--');
  });

  it('should handle Infinity as --:--', () => {
    expect(formatTime(Infinity)).toBe('--:--');
  });

  it('should handle decimal values correctly', () => {
    expect(formatTime(65.7)).toBe('01:05');
    expect(formatTime(90.9)).toBe('01:30');
  });
});

// ============================================================================
// TrackInfo Component Tests
// ============================================================================

describe('TrackInfo', () => {
  it('should display "No Track" when no track is loaded', () => {
    render(<TrackInfo hasTrack={false} />);
    expect(screen.getByText('No Track')).toBeInTheDocument();
  });

  it('should display track name when track is loaded', () => {
    render(<TrackInfo trackName="Test Song" hasTrack={true} />);
    expect(screen.getByText('Test Song')).toBeInTheDocument();
  });

  it('should have correct aria-label for track name', () => {
    render(<TrackInfo trackName="My Song" hasTrack={true} />);
    expect(screen.getByLabelText('Now playing: My Song')).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    const { container } = render(
      <TrackInfo trackName="Test" hasTrack={true} className="custom-class" />
    );
    expect(container.querySelector('.custom-class')).toBeInTheDocument();
  });
});

// ============================================================================
// TimeDisplay Component Tests
// ============================================================================

describe('TimeDisplay', () => {
  it('should display "--:--" when no track is loaded', () => {
    render(<TimeDisplay currentTime={0} duration={0} hasTrack={false} />);
    expect(screen.getAllByText('--:--')).toHaveLength(2);
  });

  it('should display current time and duration when track is loaded', () => {
    render(<TimeDisplay currentTime={65} duration={180} hasTrack={true} />);
    expect(screen.getByText('01:05')).toBeInTheDocument();
    expect(screen.getByText('03:00')).toBeInTheDocument();
  });

  it('should display volume when showVolume is true', () => {
    render(
      <TimeDisplay
        currentTime={65}
        duration={180}
        showVolume={true}
        volume={75}
        hasTrack={true}
      />
    );
    expect(screen.getByText('VOL')).toBeInTheDocument();
    expect(screen.getByText('75')).toBeInTheDocument();
  });

  it('should display "MAX" when volume is 100', () => {
    render(
      <TimeDisplay
        currentTime={65}
        duration={180}
        showVolume={true}
        volume={100}
        hasTrack={true}
      />
    );
    expect(screen.getByText('MAX')).toBeInTheDocument();
  });

  it('should not show volume display when no track is loaded', () => {
    render(
      <TimeDisplay
        currentTime={0}
        duration={0}
        showVolume={true}
        volume={50}
        hasTrack={false}
      />
    );
    // Should show --:-- instead of volume
    expect(screen.getAllByText('--:--')).toHaveLength(2);
  });

  it('should have correct aria-label for time display', () => {
    render(<TimeDisplay currentTime={30} duration={120} hasTrack={true} />);
    expect(screen.getByLabelText('Current time: 00:30, Duration: 02:00')).toBeInTheDocument();
  });
});

// ============================================================================
// StatusIndicator Component Tests
// ============================================================================

describe('StatusIndicator', () => {
  const defaultProps = {
    playState: 'stopped' as PlayState,
    isSeeking: false,
    seekDirection: null as SeekDirection,
  };

  it('should not show any indicator when stopped and not seeking', () => {
    const { container } = render(<StatusIndicator {...defaultProps} />);
    expect(container.querySelector('.statusBadge')).not.toBeInTheDocument();
  });

  it('should show FF indicator when fast-forwarding', () => {
    render(
      <StatusIndicator
        playState="playing"
        isSeeking={true}
        seekDirection="forward"
      />
    );
    expect(screen.getByText('FF')).toBeInTheDocument();
  });

  it('should show REW indicator when rewinding', () => {
    render(
      <StatusIndicator
        playState="playing"
        isSeeking={true}
        seekDirection="backward"
      />
    );
    expect(screen.getByText('REW')).toBeInTheDocument();
  });

  it('should show playing indicator when playing and not seeking', () => {
    const { container } = render(
      <StatusIndicator
        playState="playing"
        isSeeking={false}
        seekDirection={null}
      />
    );
    // The playing indicator is rendered with 3 dots
    // Use a more flexible selector that matches the hashed class name
    const dots = container.querySelectorAll('[class*="playingDot"]');
    expect(dots.length).toBe(3);
  });

  it('should not show playing indicator when paused', () => {
    const { container } = render(
      <StatusIndicator
        playState="paused"
        isSeeking={false}
        seekDirection={null}
      />
    );
    expect(container.querySelector('.playingIndicator')).not.toBeInTheDocument();
  });

  it('should have correct aria-label for FF state', () => {
    render(
      <StatusIndicator
        playState="playing"
        isSeeking={true}
        seekDirection="forward"
      />
    );
    expect(screen.getByLabelText('Fast forwarding')).toBeInTheDocument();
  });

  it('should have correct aria-label for REW state', () => {
    render(
      <StatusIndicator
        playState="playing"
        isSeeking={true}
        seekDirection="backward"
      />
    );
    expect(screen.getByLabelText('Rewinding')).toBeInTheDocument();
  });
});

// ============================================================================
// LEDDisplay Integration Tests
// ============================================================================

describe('LEDDisplay', () => {
  const defaultProps = {
    currentTime: 65,
    duration: 180,
    playState: 'playing' as PlayState,
  };

  it('should render all sub-components', () => {
    render(
      <LEDDisplay
        {...defaultProps}
        trackName="Test Song"
      />
    );
    
    expect(screen.getByTestId('led-display')).toBeInTheDocument();
    expect(screen.getByTestId('track-info')).toBeInTheDocument();
    expect(screen.getByTestId('time-display')).toBeInTheDocument();
    expect(screen.getByTestId('status-indicator')).toBeInTheDocument();
  });

  it('should display track name correctly', () => {
    render(
      <LEDDisplay
        {...defaultProps}
        trackName="My Favorite Song"
      />
    );
    
    expect(screen.getByText('My Favorite Song')).toBeInTheDocument();
  });

  it('should display time correctly', () => {
    render(
      <LEDDisplay
        {...defaultProps}
        trackName="Test"
      />
    );
    
    expect(screen.getByText('01:05')).toBeInTheDocument();
    expect(screen.getByText('03:00')).toBeInTheDocument();
  });

  it('should show no track state when trackName is undefined', () => {
    render(<LEDDisplay {...defaultProps} />);
    
    expect(screen.getByText('No Track')).toBeInTheDocument();
    expect(screen.getAllByText('--:--')).toHaveLength(2);
  });

  it('should show no track state when trackName is empty string', () => {
    render(
      <LEDDisplay
        {...defaultProps}
        trackName=""
      />
    );
    
    expect(screen.getByText('No Track')).toBeInTheDocument();
  });

  it('should show volume display when showVolume is true', () => {
    render(
      <LEDDisplay
        {...defaultProps}
        trackName="Test"
        showVolume={true}
        volume={50}
      />
    );
    
    expect(screen.getByText('VOL')).toBeInTheDocument();
    expect(screen.getByText('50')).toBeInTheDocument();
  });

  it('should show FF indicator when seeking forward', () => {
    render(
      <LEDDisplay
        {...defaultProps}
        trackName="Test"
        isSeeking={true}
        seekDirection="forward"
      />
    );
    
    expect(screen.getByText('FF')).toBeInTheDocument();
  });

  it('should show REW indicator when seeking backward', () => {
    render(
      <LEDDisplay
        {...defaultProps}
        trackName="Test"
        isSeeking={true}
        seekDirection="backward"
      />
    );
    
    expect(screen.getByText('REW')).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    const { container } = render(
      <LEDDisplay
        {...defaultProps}
        trackName="Test"
        className="custom-display"
      />
    );
    
    expect(container.querySelector('.custom-display')).toBeInTheDocument();
  });

  it('should have correct accessibility attributes', () => {
    render(
      <LEDDisplay
        {...defaultProps}
        trackName="Test Song"
      />
    );
    
    const display = screen.getByRole('region', { name: 'LED display' });
    expect(display).toBeInTheDocument();
  });
});

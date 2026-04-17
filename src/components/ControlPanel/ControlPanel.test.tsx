/**
 * ControlPanel Component Tests
 * Tests for button disabled states and interactions
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ControlPanel } from './index';
import type { PlayState, SeekDirection } from '../../types';

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    button: ({
      children,
      onClick,
      onMouseDown,
      onMouseUp,
      onMouseLeave,
      onTouchStart,
      onTouchEnd,
      disabled,
      'aria-label': ariaLabel,
      'aria-pressed': ariaPressed,
      'data-testid': testId,
      className,
    }: React.ButtonHTMLAttributes<HTMLButtonElement> & {
      children: React.ReactNode;
      'aria-label'?: string;
      'aria-pressed'?: boolean;
      'data-testid'?: string;
    }) => (
      <button
        onClick={onClick}
        onMouseDown={onMouseDown}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseLeave}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        disabled={disabled}
        aria-label={ariaLabel}
        aria-pressed={ariaPressed}
        data-testid={testId}
        className={className as string}
      >
        {children}
      </button>
    ),
  },
}));

describe('ControlPanel', () => {
  // Default props for testing
  const defaultProps = {
    playState: 'stopped' as PlayState,
    isSeeking: false,
    seekDirection: null as SeekDirection,
    volume: 80,
    isMuted: false,
    onPlay: vi.fn(),
    onPause: vi.fn(),
    onStop: vi.fn(),
    onSeekForward: vi.fn(),
    onSeekBackward: vi.fn(),
    onSeekStop: vi.fn(),
    onVolumeChange: vi.fn(),
    onMuteToggle: vi.fn(),
    onEject: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render all control buttons', () => {
      render(<ControlPanel {...defaultProps} />);

      expect(screen.getByTestId('play-button')).toBeInTheDocument();
      expect(screen.getByTestId('pause-button')).toBeInTheDocument();
      expect(screen.getByTestId('stop-button')).toBeInTheDocument();
      expect(screen.getByTestId('fast-forward-button')).toBeInTheDocument();
      expect(screen.getByTestId('rewind-button')).toBeInTheDocument();
      expect(screen.getByTestId('prev-button')).toBeInTheDocument();
      expect(screen.getByTestId('next-button')).toBeInTheDocument();
      expect(screen.getByTestId('eject-button')).toBeInTheDocument();
    });

    it('should render with custom className', () => {
      const { container } = render(
        <ControlPanel {...defaultProps} className="custom-class" />
      );

      expect(container.firstChild).toHaveClass('custom-class');
    });

    it('should have correct ARIA attributes', () => {
      render(<ControlPanel {...defaultProps} />);

      const panel = screen.getByTestId('control-panel');
      expect(panel).toHaveAttribute('role', 'group');
      expect(panel).toHaveAttribute('aria-label', '播放控制');
    });
  });

  describe('Button Disabled States - No Track Loaded', () => {
    it('should disable all buttons when disabled prop is true', () => {
      render(<ControlPanel {...defaultProps} disabled={true} />);

      expect(screen.getByTestId('play-button')).toBeDisabled();
      expect(screen.getByTestId('pause-button')).toBeDisabled();
      expect(screen.getByTestId('stop-button')).toBeDisabled();
      expect(screen.getByTestId('fast-forward-button')).toBeDisabled();
      expect(screen.getByTestId('rewind-button')).toBeDisabled();
      expect(screen.getByTestId('prev-button')).toBeDisabled();
      expect(screen.getByTestId('next-button')).toBeDisabled();
      expect(screen.getByTestId('eject-button')).toBeDisabled();
    });

    it('should disable play button when playState is playing', () => {
      render(<ControlPanel {...defaultProps} playState="playing" />);

      expect(screen.getByTestId('play-button')).toBeDisabled();
    });

    it('should disable pause button when playState is not playing', () => {
      render(<ControlPanel {...defaultProps} playState="stopped" />);

      expect(screen.getByTestId('pause-button')).toBeDisabled();
    });

    it('should enable pause button when playState is playing', () => {
      render(<ControlPanel {...defaultProps} playState="playing" />);

      expect(screen.getByTestId('pause-button')).not.toBeDisabled();
    });

    it('should disable stop button when playState is stopped', () => {
      render(<ControlPanel {...defaultProps} playState="stopped" />);

      expect(screen.getByTestId('stop-button')).toBeDisabled();
    });

    it('should enable stop button when playState is playing', () => {
      render(<ControlPanel {...defaultProps} playState="playing" />);

      expect(screen.getByTestId('stop-button')).not.toBeDisabled();
    });

    it('should enable stop button when playState is paused', () => {
      render(<ControlPanel {...defaultProps} playState="paused" />);

      expect(screen.getByTestId('stop-button')).not.toBeDisabled();
    });

    it('should disable seek buttons when playState is stopped', () => {
      render(<ControlPanel {...defaultProps} playState="stopped" />);

      expect(screen.getByTestId('fast-forward-button')).toBeDisabled();
      expect(screen.getByTestId('rewind-button')).toBeDisabled();
    });

    it('should enable seek buttons when playState is playing', () => {
      render(<ControlPanel {...defaultProps} playState="playing" />);

      expect(screen.getByTestId('fast-forward-button')).not.toBeDisabled();
      expect(screen.getByTestId('rewind-button')).not.toBeDisabled();
    });

    it('should enable seek buttons when playState is paused', () => {
      render(<ControlPanel {...defaultProps} playState="paused" />);

      expect(screen.getByTestId('fast-forward-button')).not.toBeDisabled();
      expect(screen.getByTestId('rewind-button')).not.toBeDisabled();
    });
  });

  describe('Button Click Handlers', () => {
    it('should call onPlay when play button is clicked', () => {
      const onPlay = vi.fn();
      render(<ControlPanel {...defaultProps} onPlay={onPlay} />);

      fireEvent.click(screen.getByTestId('play-button'));

      expect(onPlay).toHaveBeenCalledTimes(1);
    });

    it('should call onPause when pause button is clicked', () => {
      const onPause = vi.fn();
      render(<ControlPanel {...defaultProps} playState="playing" onPause={onPause} />);

      fireEvent.click(screen.getByTestId('pause-button'));

      expect(onPause).toHaveBeenCalledTimes(1);
    });

    it('should call onStop when stop button is clicked', () => {
      const onStop = vi.fn();
      render(<ControlPanel {...defaultProps} playState="playing" onStop={onStop} />);

      fireEvent.click(screen.getByTestId('stop-button'));

      expect(onStop).toHaveBeenCalledTimes(1);
    });

    it('should call onEject when eject button is clicked', () => {
      const onEject = vi.fn();
      render(<ControlPanel {...defaultProps} onEject={onEject} />);

      fireEvent.click(screen.getByTestId('eject-button'));

      expect(onEject).toHaveBeenCalledTimes(1);
    });
  });

  describe('Seek Button Interactions', () => {
    it('should call onSeekForward on fast forward button mouse down', () => {
      const onSeekForward = vi.fn();
      render(<ControlPanel {...defaultProps} playState="playing" onSeekForward={onSeekForward} />);

      fireEvent.mouseDown(screen.getByTestId('fast-forward-button'));

      expect(onSeekForward).toHaveBeenCalledTimes(1);
    });

    it('should call onSeekStop on fast forward button mouse up', () => {
      const onSeekStop = vi.fn();
      render(<ControlPanel {...defaultProps} playState="playing" onSeekStop={onSeekStop} />);

      fireEvent.mouseUp(screen.getByTestId('fast-forward-button'));

      expect(onSeekStop).toHaveBeenCalledTimes(1);
    });

    it('should call onSeekBackward on rewind button mouse down', () => {
      const onSeekBackward = vi.fn();
      render(<ControlPanel {...defaultProps} playState="playing" onSeekBackward={onSeekBackward} />);

      fireEvent.mouseDown(screen.getByTestId('rewind-button'));

      expect(onSeekBackward).toHaveBeenCalledTimes(1);
    });

    it('should call onSeekStop on rewind button mouse up', () => {
      const onSeekStop = vi.fn();
      render(<ControlPanel {...defaultProps} playState="playing" onSeekStop={onSeekStop} />);

      fireEvent.mouseUp(screen.getByTestId('rewind-button'));

      expect(onSeekStop).toHaveBeenCalledTimes(1);
    });

    it('should call onSeekStop on mouse leave when seeking', () => {
      const onSeekStop = vi.fn();
      render(
        <ControlPanel
          {...defaultProps}
          playState="playing"
          isSeeking={true}
          seekDirection="forward"
          onSeekStop={onSeekStop}
        />
      );

      fireEvent.mouseLeave(screen.getByTestId('fast-forward-button'));

      expect(onSeekStop).toHaveBeenCalledTimes(1);
    });

    it('should call onSeekForward on touch start', () => {
      const onSeekForward = vi.fn();
      render(<ControlPanel {...defaultProps} playState="playing" onSeekForward={onSeekForward} />);

      fireEvent.touchStart(screen.getByTestId('fast-forward-button'));

      expect(onSeekForward).toHaveBeenCalledTimes(1);
    });

    it('should call onSeekStop on touch end', () => {
      const onSeekStop = vi.fn();
      render(<ControlPanel {...defaultProps} playState="playing" onSeekStop={onSeekStop} />);

      fireEvent.touchEnd(screen.getByTestId('fast-forward-button'));

      expect(onSeekStop).toHaveBeenCalledTimes(1);
    });
  });

  describe('Seek Button Active States', () => {
    it('should show active state on fast forward button when seeking forward', () => {
      render(
        <ControlPanel
          {...defaultProps}
          playState="playing"
          isSeeking={true}
          seekDirection="forward"
        />
      );

      const button = screen.getByTestId('fast-forward-button');
      expect(button).toHaveAttribute('aria-pressed', 'true');
    });

    it('should show active state on rewind button when seeking backward', () => {
      render(
        <ControlPanel
          {...defaultProps}
          playState="playing"
          isSeeking={true}
          seekDirection="backward"
        />
      );

      const button = screen.getByTestId('rewind-button');
      expect(button).toHaveAttribute('aria-pressed', 'true');
    });

    it('should not show active state when not seeking', () => {
      render(
        <ControlPanel
          {...defaultProps}
          playState="playing"
          isSeeking={false}
          seekDirection={null}
        />
      );

      const ffButton = screen.getByTestId('fast-forward-button');
      const rewButton = screen.getByTestId('rewind-button');

      expect(ffButton).toHaveAttribute('aria-pressed', 'false');
      expect(rewButton).toHaveAttribute('aria-pressed', 'false');
    });
  });

  describe('Accessibility', () => {
    it('should have correct aria-labels for all buttons', () => {
      render(<ControlPanel {...defaultProps} />);

      expect(screen.getByLabelText('播放')).toBeInTheDocument();
      expect(screen.getByLabelText('暂停')).toBeInTheDocument();
      expect(screen.getByLabelText('停止')).toBeInTheDocument();
      expect(screen.getByLabelText('快进')).toBeInTheDocument();
      expect(screen.getByLabelText('快退')).toBeInTheDocument();
      expect(screen.getByLabelText('上一曲')).toBeInTheDocument();
      expect(screen.getByLabelText('下一曲')).toBeInTheDocument();
      expect(screen.getByLabelText('弹出')).toBeInTheDocument();
    });

    it('should not trigger click events when buttons are disabled', () => {
      const onPlay = vi.fn();
      render(<ControlPanel {...defaultProps} disabled={true} onPlay={onPlay} />);

      const playButton = screen.getByTestId('play-button');
      expect(playButton).toBeDisabled();

      // Clicking a disabled button should not trigger the handler
      fireEvent.click(playButton);
      expect(onPlay).not.toHaveBeenCalled();
    });
  });
});

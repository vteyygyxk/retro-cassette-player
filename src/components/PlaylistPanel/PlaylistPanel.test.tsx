/**
 * PlaylistPanel Component Tests
 * Tests for expandable playlist panel functionality
 *
 * Validates: Requirements 12.1-12.5
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PlaylistPanel } from './index';

describe('PlaylistPanel', () => {
  const mockTracks = [
    {
      id: '1',
      name: 'Track One',
      artist: 'Artist A',
      album: 'Album X',
      duration: 180,
      audioUrl: 'url1',
    },
    {
      id: '2',
      name: 'Track Two',
      artist: 'Artist B',
      album: 'Album Y',
      duration: 240,
      audioUrl: 'url2',
    },
    {
      id: '3',
      name: 'Track Three',
      duration: 300,
      audioUrl: 'url3',
    },
  ];

  const defaultProps = {
    playlist: mockTracks,
    currentTrackIndex: 0,
    isExpanded: true,
    favoriteTrackIds: [],
    onTrackSelect: vi.fn(),
    onToggleExpand: vi.fn(),
    onToggleFavorite: vi.fn(),
    onRemoveTrack: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render the playlist panel', () => {
      render(<PlaylistPanel {...defaultProps} />);

      expect(screen.getByTestId('playlist-panel')).toBeInTheDocument();
    });

    it('should display track count in header', () => {
      render(<PlaylistPanel {...defaultProps} />);

      expect(screen.getByText(`播放列表 (${mockTracks.length})`)).toBeInTheDocument();
    });

    it('should render all tracks when expanded', () => {
      render(<PlaylistPanel {...defaultProps} />);

      expect(screen.getByText('Track One')).toBeInTheDocument();
      expect(screen.getByText('Track Two')).toBeInTheDocument();
      expect(screen.getByText('Track Three')).toBeInTheDocument();
    });

    it('should display artist name when available', () => {
      render(<PlaylistPanel {...defaultProps} />);

      expect(screen.getByText('Artist A')).toBeInTheDocument();
      expect(screen.getByText('Artist B')).toBeInTheDocument();
    });

    it('should display "未知艺术家" when no artist', () => {
      render(<PlaylistPanel {...defaultProps} />);

      expect(screen.getByText('未知艺术家')).toBeInTheDocument();
    });
  });

  describe('Expand/Collapse', () => {
    it('should call onToggleExpand when header is clicked', () => {
      render(<PlaylistPanel {...defaultProps} />);

      const toggle = screen.getByTestId('playlist-toggle');
      fireEvent.click(toggle);

      expect(defaultProps.onToggleExpand).toHaveBeenCalledTimes(1);
    });

    it('should have correct aria-expanded attribute', () => {
      render(<PlaylistPanel {...defaultProps} isExpanded={true} />);

      const toggle = screen.getByTestId('playlist-toggle');
      expect(toggle).toHaveAttribute('aria-expanded', 'true');
    });

    it('should show collapse icon when expanded', () => {
      render(<PlaylistPanel {...defaultProps} isExpanded={true} />);

      expect(screen.getByText('▼')).toBeInTheDocument();
    });

    it('should show expand icon when collapsed', () => {
      render(<PlaylistPanel {...defaultProps} isExpanded={false} />);

      expect(screen.getByText('▶')).toBeInTheDocument();
    });
  });

  describe('Track Selection', () => {
    it('should highlight the current track', () => {
      render(<PlaylistPanel {...defaultProps} currentTrackIndex={0} />);

      const activeItem = screen.getByTestId('playlist-panel-track-0');
      expect(activeItem).toHaveAttribute('data-active', 'true');
    });

    it('should not highlight non-active tracks', () => {
      render(<PlaylistPanel {...defaultProps} currentTrackIndex={0} />);

      const inactiveItem = screen.getByTestId('playlist-panel-track-1');
      expect(inactiveItem).toHaveAttribute('data-active', 'false');
    });

    it('should call onTrackSelect with correct index when track is clicked', () => {
      render(<PlaylistPanel {...defaultProps} />);

      const trackButton = screen.getByLabelText('播放 Track Two');
      fireEvent.click(trackButton);

      expect(defaultProps.onTrackSelect).toHaveBeenCalledWith(1);
    });

    it('should show playing icon on active track', () => {
      render(<PlaylistPanel {...defaultProps} currentTrackIndex={1} />);

      const activeItem = screen.getByTestId('playlist-panel-track-1');
      const playIcon = activeItem.querySelector('[aria-hidden="true"]');
      expect(playIcon).toBeInTheDocument();
    });

    it('should render 收藏 action for non-favorite tracks', () => {
      render(<PlaylistPanel {...defaultProps} favoriteTrackIds={[]} />);

      expect(screen.getAllByText('♡')).toHaveLength(3);
    });

    it('should render 取消收藏 action for favorite tracks', () => {
      render(<PlaylistPanel {...defaultProps} favoriteTrackIds={['2']} />);

      expect(screen.getByRole('button', { name: '取消收藏 Track Two' })).toBeInTheDocument();
      expect(screen.getByText('♥')).toBeInTheDocument();
    });

    it('should call onToggleFavorite without selecting the track', () => {
      render(<PlaylistPanel {...defaultProps} favoriteTrackIds={[]} />);

      fireEvent.click(screen.getByRole('button', { name: '收藏 Track Two' }));

      expect(defaultProps.onToggleFavorite).toHaveBeenCalledWith(mockTracks[1]);
      expect(defaultProps.onTrackSelect).not.toHaveBeenCalled();
    });

    it('reveals delete action after swiping left on a track', () => {
      render(<PlaylistPanel {...defaultProps} />);

      expect(screen.queryByRole('button', { name: '删除 Track Two' })).not.toBeInTheDocument();

      const trackItem = screen.getByTestId('playlist-panel-track-1');
      fireEvent.pointerDown(trackItem, { clientX: 120 });
      fireEvent.pointerMove(trackItem, { clientX: 60 });
      fireEvent.pointerUp(trackItem, { clientX: 60 });

      expect(trackItem).toHaveAttribute('data-swipe-open', 'true');
      expect(screen.getByRole('button', { name: '删除 Track Two' })).toBeInTheDocument();
    });

    it('calls onRemoveTrack without selecting the track when delete is pressed', () => {
      render(<PlaylistPanel {...defaultProps} />);

      const trackItem = screen.getByTestId('playlist-panel-track-1');
      fireEvent.pointerDown(trackItem, { clientX: 120 });
      fireEvent.pointerMove(trackItem, { clientX: 60 });
      fireEvent.pointerUp(trackItem, { clientX: 60 });
      fireEvent.click(screen.getByRole('button', { name: '删除 Track Two' }));

      expect(defaultProps.onRemoveTrack).toHaveBeenCalledWith(1);
      expect(defaultProps.onTrackSelect).not.toHaveBeenCalled();
    });
  });

  describe('Empty State', () => {
    it('should show empty message when playlist is empty', () => {
      render(<PlaylistPanel {...defaultProps} playlist={[]} isExpanded={true} />);

      expect(screen.getByTestId('playlist-panel-empty')).toBeInTheDocument();
      expect(screen.getByText('播放列表为空')).toBeInTheDocument();
    });

    it('should display track count as 0 when empty', () => {
      render(<PlaylistPanel {...defaultProps} playlist={[]} />);

      expect(screen.getByText('播放列表 (0)')).toBeInTheDocument();
    });
  });

  describe('Duration Display', () => {
    it('should display formatted duration for tracks', () => {
      render(<PlaylistPanel {...defaultProps} />);

      // 180s = 3:00
      expect(screen.getByText('3:00')).toBeInTheDocument();
      // 240s = 4:00
      expect(screen.getByText('4:00')).toBeInTheDocument();
      // 300s = 5:00
      expect(screen.getByText('5:00')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have correct ARIA roles', () => {
      render(<PlaylistPanel {...defaultProps} />);

      const panel = screen.getByTestId('playlist-panel');
      expect(panel).toHaveAttribute('role', 'region');
      expect(panel).toHaveAttribute('aria-label', '播放列表');
    });

    it('should have aria-controls on toggle button', () => {
      render(<PlaylistPanel {...defaultProps} />);

      const toggle = screen.getByTestId('playlist-toggle');
      expect(toggle).toHaveAttribute('aria-controls', 'playlist-toggle-content');
    });

    it('should have aria-current on active track', () => {
      render(<PlaylistPanel {...defaultProps} currentTrackIndex={0} />);

      const activeItem = screen.getByTestId('playlist-panel-track-0');
      expect(activeItem).toHaveAttribute('aria-current', 'true');
    });

    it('should have accessible track button labels', () => {
      render(<PlaylistPanel {...defaultProps} />);

      expect(screen.getByLabelText('播放 Track One')).toBeInTheDocument();
      expect(screen.getByLabelText('播放 Track Two')).toBeInTheDocument();
    });
  });

  describe('Custom ClassName', () => {
    it('should apply custom className', () => {
      render(<PlaylistPanel {...defaultProps} className="custom-class" />);

      const panel = screen.getByTestId('playlist-panel');
      expect(panel).toHaveClass('custom-class');
    });
  });
});

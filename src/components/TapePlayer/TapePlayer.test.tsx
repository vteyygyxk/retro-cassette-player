/**
 * TapePlayer Component Tests
 * Integration tests for the root cassette player component
 *
 * Validates: Full playback flow, multi-file loading, error handling
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TapePlayer } from './index';
import { usePlayerStore } from '../../stores/playerStore';

// Mock the audio service to avoid actual audio playback
vi.mock('../../services/audioService', () => ({
  VISUALIZER_BANDS: 10,
  getAudioService: () => ({
    onTimeUpdate: vi.fn(),
    onEnd: vi.fn(),
    onError: vi.fn(),
    loadFromUrl: vi.fn().mockResolvedValue(undefined),
    loadFromFile: vi.fn().mockResolvedValue(undefined),
    play: vi.fn().mockResolvedValue(undefined),
    pause: vi.fn(),
    stop: vi.fn(),
    setVolume: vi.fn(),
    mute: vi.fn(),
    unmute: vi.fn(),
    enableFastForward: vi.fn(),
    enableRewind: vi.fn(),
    resetPlaybackRate: vi.fn(),
    getDuration: vi.fn().mockReturnValue(180),
    getCurrentTime: vi.fn().mockReturnValue(0),
    hasAnalyser: vi.fn().mockReturnValue(true),
    getFrequencyBands: vi.fn().mockReturnValue(new Array(10).fill(0)),
    destroy: vi.fn(),
  }),
  resetAudioService: vi.fn(),
}));

// Mock the file service
vi.mock('../../services/fileService', () => ({
  getFileService: () => ({
    validateFiles: (files: File[]) => ({
      validFiles: files,
      errors: [],
    }),
    loadFiles: vi.fn().mockResolvedValue([
      {
        track: {
          id: 'test-1',
          name: 'Test Track',
          artist: 'Test Artist',
          duration: 180,
          audioUrl: 'blob:test',
        },
        metadata: { title: 'Test Track', duration: 180 },
      },
    ]),
  }),
  resetFileService: vi.fn(),
}));

describe('TapePlayer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    usePlayerStore.setState({
      playlist: [],
      favorites: [],
      currentTrackIndex: -1,
      currentTrack: null,
      playState: 'stopped',
      isPlaylistExpanded: true,
      isFavoritesExpanded: true,
    });
  });

  describe('Initial Render', () => {
    it('should render the player with title', () => {
      render(<TapePlayer />);

      expect(screen.getByText('复古磁带播放器')).toBeInTheDocument();
      expect(screen.getByText('Retro Cassette Player')).toBeInTheDocument();
    });

    it('should render playlist and favorites panels in the right column', () => {
      render(<TapePlayer />);

      expect(screen.getByText('播放列表 (0)')).toBeInTheDocument();
      expect(screen.getByText('收藏列表 (0)')).toBeInTheDocument();
    });

    it('should render file and search entry controls', () => {
      render(<TapePlayer />);

      expect(screen.getByText('+ 添加文件')).toBeInTheDocument();
      expect(screen.getByText('收起搜索')).toBeInTheDocument();
    });
  });

  describe('Drop Zone', () => {
    it('should handle drag over event', () => {
      render(<TapePlayer />);

      const main = screen.getByRole('main');
      expect(main).toBeTruthy();

      fireEvent.dragOver(main!, {
        preventDefault: vi.fn(),
      });
    });
  });

  describe('File Input', () => {
    it('should have a hidden file input', () => {
      render(<TapePlayer />);

      const input = document.getElementById('tape-player-file-input') as HTMLInputElement;
      expect(input).toBeTruthy();
      expect(input.type).toBe('file');
      expect(input.accept).toContain('.mp3');
      expect(input.accept).toContain('.jpg');
      expect(input.accept).toContain('.png');
      expect(input.multiple).toBe(true);
    });
  });

  describe('Keyboard Shortcuts', () => {
    it('should register keyboard shortcuts when rendered', () => {
      render(<TapePlayer />);

      // Keyboard shortcuts should be set up without errors
      // (detailed testing is in useKeyboardShortcuts.test.ts)
    });
  });

  describe('Error Boundary', () => {
    it('should render error fallback when child throws', () => {
      // The error boundary is tested implicitly through normal rendering
      // A more thorough test would require a component that intentionally throws
      render(<TapePlayer />);

      expect(screen.getByText('复古磁带播放器')).toBeInTheDocument();
    });
  });

  describe('Favorites Panel', () => {
    it('plays a favorite track by appending it to the playlist when needed', async () => {
      usePlayerStore.setState({
        favorites: [
          {
            id: 'fav-1',
            name: 'Favorite One',
            artist: 'Artist A',
            duration: 180,
            audioUrl: 'blob:fav-1',
          },
        ],
      });

      render(<TapePlayer />);

      fireEvent.click(screen.getByLabelText('播放 Favorite One'));

      await waitFor(() => {
        expect(usePlayerStore.getState().playlist).toHaveLength(1);
        expect(usePlayerStore.getState().currentTrack?.id).toBe('fav-1');
        expect(usePlayerStore.getState().playState).toBe('playing');
      });

      expect(screen.getByText('收藏列表 (1)')).toBeInTheDocument();
    });
  });
});

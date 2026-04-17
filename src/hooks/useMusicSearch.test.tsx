import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { usePlayerStore } from '../stores/playerStore';
import { useMusicSearch } from './useMusicSearch';

const mockService = {
  search: vi.fn(),
  searchResultToTrack: vi.fn(),
  ensureTrackAlbumCover: vi.fn(),
};

vi.mock('../services/musicSearchService', () => ({
  getMusicSearchService: () => mockService,
}));

describe('useMusicSearch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    usePlayerStore.setState({
      playlist: [],
      favorites: [],
      currentTrack: null,
      currentTrackIndex: -1,
      playState: 'stopped',
    });
  });

  it('ensures album cover before playing an online result', async () => {
    mockService.searchResultToTrack.mockResolvedValue({
      id: 'online-123',
      name: 'Online Song',
      artist: 'Artist',
      duration: 180,
      audioUrl: 'https://example.com/song.mp3',
    });
    mockService.ensureTrackAlbumCover.mockResolvedValue({
      id: 'online-123',
      name: 'Online Song',
      artist: 'Artist',
      duration: 180,
      audioUrl: 'https://example.com/song.mp3',
      albumCover: 'https://example.com/cover.jpg',
    });

    const { result } = renderHook(() => useMusicSearch());

    await act(async () => {
      await result.current.playNow({
        id: 123,
        name: 'Online Song',
        artist: 'Artist',
        album: 'Album',
        duration: 180000,
      });
    });

    await act(async () => {
      vi.advanceTimersByTime(100);
    });

    expect(mockService.ensureTrackAlbumCover).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'online-123' }),
      123
    );
    expect(usePlayerStore.getState().currentTrack?.albumCover).toBe('https://example.com/cover.jpg');
  });
});

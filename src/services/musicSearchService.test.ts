import { afterEach, describe, expect, it, vi } from 'vitest';
import { MusicSearchService } from './musicSearchService';

describe('MusicSearchService', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('requests song detail with encoded ids array and returns album cover', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        songs: [
          {
            album: {
              picUrl: 'https://example.com/cover.jpg',
            },
          },
        ],
      }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const service = new MusicSearchService();
    const detail = await service.getSongDetail(123);

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/netease/song/detail?ids=%5B123%5D',
      expect.objectContaining({
        signal: expect.any(AbortSignal),
      })
    );
    expect(detail).toEqual({
      albumCover: 'https://example.com/cover.jpg',
    });
  });

  it('fills online track album cover from song detail when missing', async () => {
    const service = new MusicSearchService();
    const detailSpy = vi.spyOn(service, 'getSongDetail').mockResolvedValue({
      albumCover: 'https://example.com/cover.jpg',
    });

    const track = await service.ensureTrackAlbumCover(
      {
        id: 'online-1',
        name: 'Online Song',
        artist: 'Artist',
        duration: 180,
        audioUrl: 'https://example.com/song.mp3',
      },
      123
    );

    expect(detailSpy).toHaveBeenCalledWith(123);
    expect(track.albumCover).toBe('https://example.com/cover.jpg');
  });

  it('keeps existing online track album cover without refetching detail', async () => {
    const service = new MusicSearchService();
    const detailSpy = vi.spyOn(service, 'getSongDetail');

    const track = await service.ensureTrackAlbumCover(
      {
        id: 'online-1',
        name: 'Online Song',
        artist: 'Artist',
        duration: 180,
        audioUrl: 'https://example.com/song.mp3',
        albumCover: 'https://example.com/existing-cover.jpg',
      },
      123
    );

    expect(detailSpy).not.toHaveBeenCalled();
    expect(track.albumCover).toBe('https://example.com/existing-cover.jpg');
  });
});

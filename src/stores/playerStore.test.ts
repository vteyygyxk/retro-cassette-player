import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('playerStore music search defaults', () => {
  beforeEach(() => {
    vi.resetModules();
    localStorage.clear();
    vi.mocked(localStorage.getItem).mockReset();
    vi.mocked(localStorage.setItem).mockReset();
    vi.mocked(localStorage.removeItem).mockReset();
    vi.mocked(localStorage.clear).mockReset();
    vi.mocked(localStorage.key).mockReset();
    Object.defineProperty(localStorage, 'length', {
      value: 0,
      configurable: true,
      writable: true,
    });
  });

  it('defaults showMusicSearch to expanded', async () => {
    const { usePlayerStore } = await import('./playerStore');

    expect(usePlayerStore.getState().showMusicSearch).toBe(true);
  });

  it('ignores persisted showMusicSearch and stays expanded after rehydrate', async () => {
    vi.mocked(localStorage.getItem).mockImplementation((key: string) => {
      if (key === 'retro-cassette-player-storage') {
        return JSON.stringify({
          state: {
            volume: 20,
            currentSkinId: 'classic-black',
            customSkinColors: {
              bodyColor: '#000000',
              reelColor: '#111111',
              labelColor: '#ffffff',
            },
            playMode: 'loop',
            showMusicSearch: false,
          },
          version: 0,
        });
      }

      return null;
    });

    const { usePlayerStore } = await import('./playerStore');
    const state = usePlayerStore.getState();

    expect(state.showMusicSearch).toBe(true);
    expect(state.volume).toBe(20);
    expect(state.playMode).toBe('loop');
  });
});

describe('playerStore favorites', () => {
  const sampleTrack = {
    id: 'track-1',
    name: 'Sample Track',
    artist: 'Artist',
    album: 'Album',
    duration: 180,
    audioUrl: 'sample-url',
  };

  beforeEach(() => {
    vi.resetModules();
    localStorage.clear();
    vi.mocked(localStorage.getItem).mockReset();
    vi.mocked(localStorage.setItem).mockReset();
    vi.mocked(localStorage.removeItem).mockReset();
    vi.mocked(localStorage.clear).mockReset();
    vi.mocked(localStorage.key).mockReset();
    Object.defineProperty(localStorage, 'length', {
      value: 0,
      configurable: true,
      writable: true,
    });
  });

  it('adds and removes favorites by track id', async () => {
    const { usePlayerStore } = await import('./playerStore');
    const store = usePlayerStore.getState();

    store.addToFavorites(sampleTrack);
    expect(usePlayerStore.getState().favorites).toEqual([sampleTrack]);
    expect(usePlayerStore.getState().isFavorite(sampleTrack.id)).toBe(true);

    usePlayerStore.getState().removeFromFavorites(sampleTrack.id);
    expect(usePlayerStore.getState().favorites).toEqual([]);
    expect(usePlayerStore.getState().isFavorite(sampleTrack.id)).toBe(false);
  });

  it('does not duplicate the same favorite track', async () => {
    const { usePlayerStore } = await import('./playerStore');

    usePlayerStore.getState().addToFavorites(sampleTrack);
    usePlayerStore.getState().addToFavorites(sampleTrack);

    expect(usePlayerStore.getState().favorites).toEqual([sampleTrack]);
  });

  it('rehydrates favorites from persisted storage', async () => {
    vi.mocked(localStorage.getItem).mockImplementation((key: string) => {
      if (key === 'retro-cassette-player-storage') {
        return JSON.stringify({
          state: {
            volume: 30,
            currentSkinId: 'classic-black',
            customSkinColors: {
              bodyColor: '#000000',
              reelColor: '#111111',
              labelColor: '#ffffff',
            },
            playMode: 'sequence',
            favorites: [sampleTrack],
          },
          version: 0,
        });
      }

      return null;
    });

    const { usePlayerStore } = await import('./playerStore');

    expect(usePlayerStore.getState().favorites).toEqual([sampleTrack]);
    expect(usePlayerStore.getState().isFavorite(sampleTrack.id)).toBe(true);
  });

  it('defaults favorites panel to expanded and toggles it', async () => {
    const { usePlayerStore } = await import('./playerStore');

    expect(usePlayerStore.getState().isFavoritesExpanded).toBe(true);

    usePlayerStore.getState().toggleFavoritesExpanded();
    expect(usePlayerStore.getState().isFavoritesExpanded).toBe(false);

    usePlayerStore.getState().setFavoritesExpanded(true);
    expect(usePlayerStore.getState().isFavoritesExpanded).toBe(true);
  });

  it('plays the next track when removing the currently playing track', async () => {
    const { usePlayerStore } = await import('./playerStore');
    const nextTrack = {
      id: 'track-2',
      name: 'Next Track',
      duration: 200,
      audioUrl: 'next-url',
    };

    usePlayerStore.getState().setPlaylist([sampleTrack, nextTrack]);
    usePlayerStore.getState().setCurrentTrack(sampleTrack, 0);
    usePlayerStore.getState().setPlayState('playing');

    usePlayerStore.getState().removeFromPlaylist(0);

    expect(usePlayerStore.getState().playlist).toEqual([nextTrack]);
    expect(usePlayerStore.getState().currentTrack).toEqual(nextTrack);
    expect(usePlayerStore.getState().currentTrackIndex).toBe(0);
    expect(usePlayerStore.getState().playState).toBe('playing');
  });

  it('stops playback when removing the only currently playing track', async () => {
    const { usePlayerStore } = await import('./playerStore');

    usePlayerStore.getState().setPlaylist([sampleTrack]);
    usePlayerStore.getState().setCurrentTrack(sampleTrack, 0);
    usePlayerStore.getState().setPlayState('playing');

    usePlayerStore.getState().removeFromPlaylist(0);

    expect(usePlayerStore.getState().playlist).toEqual([]);
    expect(usePlayerStore.getState().currentTrack).toBeNull();
    expect(usePlayerStore.getState().currentTrackIndex).toBe(-1);
    expect(usePlayerStore.getState().playState).toBe('stopped');
  });
});

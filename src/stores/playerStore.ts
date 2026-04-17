/**
 * Retro Cassette Player - Player Store
 * Zustand store for managing player state and actions
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Track, PlayState, PlayerState, PlayMode } from '../types';
import { VISUALIZER_BANDS } from '../services/audioService';

// ============================================================================
// Store State Interface
// ============================================================================

interface CustomSkinColors {
  bodyColor: string;
  reelColor: string;
  labelColor: string;
}

interface PlayerStore extends PlayerState {
  // Audio analysis state
  frequencyBands: number[];
  audioEnergy: number;

  // Playback actions
  play: () => void;
  pause: () => void;
  stop: () => void;
  setPlayState: (state: PlayState) => void;
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  setPlaybackRate: (rate: number) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  setMuted: (muted: boolean) => void;

  // Play mode actions
  setPlayMode: (mode: PlayMode) => void;
  cyclePlayMode: () => void;

  // Audio analysis actions
  setFrequencyBands: (bands: number[]) => void;
  setAudioEnergy: (energy: number) => void;
  resetAudioAnalysis: () => void;

  // Seek actions
  startSeekForward: () => void;
  startSeekBackward: () => void;
  stopSeek: () => void;

  // Track navigation actions
  nextTrack: () => void;
  prevTrack: () => void;
  selectTrack: (index: number) => void;
  setCurrentTrack: (track: Track | null, index: number) => void;

  // Playlist management actions
  setPlaylist: (tracks: Track[]) => void;
  addToPlaylist: (track: Track) => void;
  addToPlaylistBatch: (tracks: Track[]) => void;
  removeFromPlaylist: (index: number) => void;
  clearPlaylist: () => void;
  addToFavorites: (track: Track) => void;
  removeFromFavorites: (trackId: string) => void;
  toggleFavorite: (track: Track) => void;
  isFavorite: (trackId: string) => boolean;

  // UI state actions
  setCurrentSkinId: (skinId: string) => void;
  setCustomSkinColors: (colors: CustomSkinColors) => void;
  setChangingTape: (changing: boolean) => void;
  setShowVolumeDisplay: (show: boolean) => void;
  togglePlaylistExpanded: () => void;
  setPlaylistExpanded: (expanded: boolean) => void;
  toggleFavoritesExpanded: () => void;
  setFavoritesExpanded: (expanded: boolean) => void;
  setShowMusicSearch: (show: boolean) => void;
  toggleMusicSearch: () => void;
}

// ============================================================================
// Initial State
// ============================================================================

const initialState: PlayerState = {
  // Playback state
  playState: 'stopped',
  currentTime: 0,
  duration: 0,
  playbackRate: 1,
  volume: 80,
  isMuted: false,

  // Fast-forward/rewind state
  isSeeking: false,
  seekDirection: null,

  // Play mode
  playMode: 'sequence',

  // Track info
  currentTrackIndex: -1,
  currentTrack: null,

  // Playlist
  playlist: [],
  favorites: [],

  // UI state
  currentSkinId: 'classic-black',
  customSkinColors: {
    bodyColor: '#1a1a1a',
    reelColor: '#333333',
    labelColor: '#f5f5f5',
  },
  isChangingTape: false,
  showVolumeDisplay: false,
  isPlaylistExpanded: true,
  isFavoritesExpanded: true,
  showMusicSearch: true,
};

// Audio analysis initial state (not persisted)
const initialAudioAnalysisState = {
  frequencyBands: new Array(VISUALIZER_BANDS).fill(0) as number[],
  audioEnergy: 0,
};

// ============================================================================
// Store Implementation
// ============================================================================

export const usePlayerStore = create<PlayerStore>()(
  persist(
    (set, get) => ({
      // Initial state
      ...initialState,
      ...initialAudioAnalysisState,

      // ========================================
      // Playback Actions
      // ========================================

      play: () => {
        const { currentTrack } = get();
        if (currentTrack) {
          set({ playState: 'playing' });
        }
      },

      pause: () => {
        const { playState } = get();
        if (playState === 'playing') {
          set({ playState: 'paused' });
        }
      },

      stop: () => {
        set({
          playState: 'stopped',
          currentTime: 0,
          isSeeking: false,
          seekDirection: null,
          frequencyBands: new Array(VISUALIZER_BANDS).fill(0) as number[],
          audioEnergy: 0,
        });
      },

      setPlayState: (state) => {
        set({ playState: state });
      },

      setCurrentTime: (time) => {
        const { duration } = get();
        // Ensure time is within bounds [0, duration]
        const boundedTime = Math.max(0, Math.min(time, duration));
        set({ currentTime: boundedTime });
      },

      setDuration: (duration) => {
        set({ duration: Math.max(0, duration) });
      },

      setPlaybackRate: (rate) => {
        // Playback rate should be positive
        set({ playbackRate: Math.max(0.25, rate) });
      },

      setVolume: (volume) => {
        // Volume should be between 0 and 100
        const boundedVolume = Math.max(0, Math.min(100, volume));
        set({ volume: boundedVolume, showVolumeDisplay: true });
        
        // Auto-hide volume display after 2 seconds
        setTimeout(() => {
          const { showVolumeDisplay } = get();
          if (showVolumeDisplay) {
            set({ showVolumeDisplay: false });
          }
        }, 2000);
      },

      toggleMute: () => {
        set((state) => ({ isMuted: !state.isMuted }));
      },

      setMuted: (muted) => {
        set({ isMuted: muted });
      },

      // ========================================
      // Play Mode Actions
      // ========================================

      setPlayMode: (mode) => {
        set({ playMode: mode });
      },

      cyclePlayMode: () => {
        const { playMode } = get();
        const modes: PlayMode[] = ['sequence', 'loop', 'single', 'shuffle'];
        const currentIndex = modes.indexOf(playMode);
        const nextIndex = (currentIndex + 1) % modes.length;
        set({ playMode: modes[nextIndex] });
      },

      // ========================================
      // Audio Analysis Actions
      // ========================================

      setFrequencyBands: (bands) => {
        set({ frequencyBands: bands });
      },

      setAudioEnergy: (energy) => {
        set({ audioEnergy: energy });
      },

      resetAudioAnalysis: () => {
        set({
          frequencyBands: new Array(VISUALIZER_BANDS).fill(0) as number[],
          audioEnergy: 0,
        });
      },

      // ========================================
      // Seek Actions
      // ========================================

      startSeekForward: () => {
        const { playState, currentTrack } = get();
        if (currentTrack && playState !== 'stopped') {
          set({ isSeeking: true, seekDirection: 'forward' });
        }
      },

      startSeekBackward: () => {
        const { playState, currentTrack } = get();
        if (currentTrack && playState !== 'stopped') {
          set({ isSeeking: true, seekDirection: 'backward' });
        }
      },

      stopSeek: () => {
        set({ isSeeking: false, seekDirection: null });
      },

      // ========================================
      // Track Navigation Actions
      // ========================================

      nextTrack: () => {
        const { playlist, currentTrackIndex, playMode } = get();
        if (playlist.length === 0) return;

        let nextIndex: number;

        if (playMode === 'single') {
          // Single loop: stay on current track
          nextIndex = currentTrackIndex;
        } else if (playMode === 'shuffle') {
          // Shuffle: pick random track (avoid same track if possible)
          if (playlist.length === 1) {
            nextIndex = 0;
          } else {
            do {
              nextIndex = Math.floor(Math.random() * playlist.length);
            } while (nextIndex === currentTrackIndex);
          }
        } else {
          // Sequence or Loop: go to next track
          nextIndex = (currentTrackIndex + 1) % playlist.length;
        }

        const nextTrack = playlist[nextIndex];

        set({
          currentTrackIndex: nextIndex,
          currentTrack: nextTrack,
          currentTime: 0,
          isChangingTape: true,
        });

        // Reset changing tape animation after a delay
        setTimeout(() => {
          set({ isChangingTape: false });
        }, 500);
      },

      prevTrack: () => {
        const { playlist, currentTrackIndex, currentTime } = get();
        if (playlist.length === 0) return;

        // If more than 3 seconds into the song, restart current track
        if (currentTime > 3) {
          set({ currentTime: 0 });
          return;
        }

        const prevIndex = currentTrackIndex <= 0 
          ? playlist.length - 1 
          : currentTrackIndex - 1;
        const prevTrack = playlist[prevIndex];

        set({
          currentTrackIndex: prevIndex,
          currentTrack: prevTrack,
          currentTime: 0,
          isChangingTape: true,
        });

        // Reset changing tape animation after a delay
        setTimeout(() => {
          set({ isChangingTape: false });
        }, 500);
      },

      selectTrack: (index) => {
        const { playlist } = get();
        if (index < 0 || index >= playlist.length) return;

        const track = playlist[index];
        set({
          currentTrackIndex: index,
          currentTrack: track,
          currentTime: 0,
          isChangingTape: true,
          playState: 'playing',
        });

        // Reset changing tape animation after a delay
        setTimeout(() => {
          set({ isChangingTape: false });
        }, 500);
      },

      setCurrentTrack: (track, index) => {
        set({
          currentTrack: track,
          currentTrackIndex: index,
          currentTime: 0,
        });
      },

      // ========================================
      // Playlist Management Actions
      // ========================================

      setPlaylist: (tracks) => {
        const firstTrack = tracks.length > 0 ? tracks[0] : null;
        set({
          playlist: tracks,
          currentTrackIndex: tracks.length > 0 ? 0 : -1,
          currentTrack: firstTrack,
          currentTime: 0,
          playState: 'stopped',
        });
      },

      addToPlaylist: (track) => {
        const { playlist } = get();
        const newPlaylist = [...playlist, track];
        
        set({ playlist: newPlaylist });

        // If this is the first track, set it as current
        if (playlist.length === 0) {
          set({
            currentTrackIndex: 0,
            currentTrack: track,
          });
        }
      },

      addToPlaylistBatch: (tracks) => {
        const { playlist } = get();
        const newPlaylist = [...playlist, ...tracks];
        
        set({ playlist: newPlaylist });

        // If playlist was empty, set first track as current
        if (playlist.length === 0 && tracks.length > 0) {
          set({
            currentTrackIndex: 0,
            currentTrack: tracks[0],
          });
        }
      },

      removeFromPlaylist: (index) => {
        const { playlist, currentTrackIndex, currentTrack, playState } = get();
        
        if (index < 0 || index >= playlist.length) return;

        const newPlaylist = playlist.filter((_, i) => i !== index);
        let newCurrentIndex = currentTrackIndex;
        let newCurrentTrack = currentTrack;
        let nextPlayState = playState;

        // Adjust current track index if needed
        if (newPlaylist.length === 0) {
          // Playlist is now empty
          newCurrentIndex = -1;
          newCurrentTrack = null;
          nextPlayState = 'stopped';
        } else if (index === currentTrackIndex) {
          // Removed the current track
          newCurrentIndex = Math.min(currentTrackIndex, newPlaylist.length - 1);
          newCurrentTrack = newPlaylist[newCurrentIndex];
        } else if (index < currentTrackIndex) {
          // Removed a track before the current one
          newCurrentIndex = currentTrackIndex - 1;
        }

        set({
          playlist: newPlaylist,
          currentTrackIndex: newCurrentIndex,
          currentTrack: newCurrentTrack,
          playState: nextPlayState,
        });
      },

      clearPlaylist: () => {
        set({
          playlist: [],
          currentTrackIndex: -1,
          currentTrack: null,
          currentTime: 0,
          playState: 'stopped',
          isSeeking: false,
          seekDirection: null,
        });
      },

      addToFavorites: (track) => {
        const { favorites } = get();
        if (favorites.some((favorite) => favorite.id === track.id)) {
          return;
        }

        set({ favorites: [...favorites, track] });
      },

      removeFromFavorites: (trackId) => {
        set((state) => ({
          favorites: state.favorites.filter((track) => track.id !== trackId),
        }));
      },

      toggleFavorite: (track) => {
        const { favorites } = get();
        const exists = favorites.some((favorite) => favorite.id === track.id);

        if (exists) {
          set({
            favorites: favorites.filter((favorite) => favorite.id !== track.id),
          });
          return;
        }

        set({ favorites: [...favorites, track] });
      },

      isFavorite: (trackId) => {
        return get().favorites.some((track) => track.id === trackId);
      },

      // ========================================
      // UI State Actions
      // ========================================

      setCurrentSkinId: (skinId) => {
        set({ currentSkinId: skinId });
      },

      setCustomSkinColors: (colors) => {
        set((state) => ({
          customSkinColors: { ...state.customSkinColors, ...colors },
        }));
      },

      setChangingTape: (changing) => {
        set({ isChangingTape: changing });
      },

      setShowVolumeDisplay: (show) => {
        set({ showVolumeDisplay: show });
      },

      togglePlaylistExpanded: () => {
        set((state) => ({ isPlaylistExpanded: !state.isPlaylistExpanded }));
      },

      setPlaylistExpanded: (expanded) => {
        set({ isPlaylistExpanded: expanded });
      },

      toggleFavoritesExpanded: () => {
        set((state) => ({ isFavoritesExpanded: !state.isFavoritesExpanded }));
      },

      setFavoritesExpanded: (expanded) => {
        set({ isFavoritesExpanded: expanded });
      },

      setShowMusicSearch: (show) => {
        set({ showMusicSearch: show });
      },

      toggleMusicSearch: () => {
        set((state) => ({ showMusicSearch: !state.showMusicSearch }));
      },
    }),
    {
      name: 'retro-cassette-player-storage',
      // Only persist user preferences, not playback state
      partialize: (state) => ({
        volume: state.volume,
        currentSkinId: state.currentSkinId,
        customSkinColors: state.customSkinColors,
        playMode: state.playMode,
        favorites: state.favorites,
      }),
      merge: (persistedState, currentState) => ({
        ...currentState,
        ...(persistedState as Partial<PlayerState>),
        showMusicSearch: true,
      }),
    }
  )
);

// ============================================================================
// Selector Hooks (for performance optimization)
// ============================================================================

/** Select playback state */
export const usePlayState = () => usePlayerStore((state) => state.playState);

/** Select current track */
export const useCurrentTrack = () => usePlayerStore((state) => state.currentTrack);

/** Select playlist */
export const usePlaylist = () => usePlayerStore((state) => state.playlist);

/** Select volume */
export const useVolume = () => usePlayerStore((state) => state.volume);

/** Select current skin ID */
export const useCurrentSkinId = () => usePlayerStore((state) => state.currentSkinId);

/** Select if player has a track loaded */
export const useHasTrack = () => usePlayerStore((state) => state.currentTrack !== null);

/** Select if playlist has multiple tracks */
export const useHasMultipleTracks = () => usePlayerStore((state) => state.playlist.length > 1);

/** Select seek state */
export const useSeekState = () => usePlayerStore((state) => ({
  isSeeking: state.isSeeking,
  seekDirection: state.seekDirection,
}));

/** Select playback info */
export const usePlaybackInfo = () => usePlayerStore((state) => ({
  playState: state.playState,
  currentTime: state.currentTime,
  duration: state.duration,
  playbackRate: state.playbackRate,
}));

/** Select track info */
export const useTrackInfo = () => usePlayerStore((state) => ({
  currentTrack: state.currentTrack,
  currentTrackIndex: state.currentTrackIndex,
  playlistLength: state.playlist.length,
}));

/** Select UI state */
export const useUIState = () => usePlayerStore((state) => ({
  currentSkinId: state.currentSkinId,
  isChangingTape: state.isChangingTape,
  showVolumeDisplay: state.showVolumeDisplay,
  isPlaylistExpanded: state.isPlaylistExpanded,
}));

/** Select audio analysis state */
export const useAudioAnalysis = () => usePlayerStore((state) => ({
  frequencyBands: state.frequencyBands,
  audioEnergy: state.audioEnergy,
}));

/** Select play mode */
export const usePlayMode = () => usePlayerStore((state) => state.playMode);

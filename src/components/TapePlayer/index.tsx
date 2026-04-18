/**
 * TapePlayer Component - Root cassette player component
 * Integrates all sub-components into a complete cassette player experience
 *
 * Features:
 * - Complete playback flow (load -> play -> next track)
 * - Volume control with VolumeKnob
 * - Playlist management with PlaylistPanel
 * - Skin selection with SkinSelector
 * - Keyboard shortcuts via useKeyboardShortcuts
 * - Responsive layout via useResponsive
 * - Error boundary handling
 * - File drop zone
 *
 * Validates: All functional requirements
 */

import { useState, useCallback, useEffect, useRef, Component } from 'react';
import type { ReactNode, ErrorInfo } from 'react';
import { usePlayerStore } from '../../stores/playerStore';
import { getAudioService, resetAudioService } from '../../services/audioService';
import { getFileService } from '../../services/fileService';
import { getSkinById, DEFAULT_SKINS, getAllSkins, CUSTOM_SKIN_ID } from '../../data/skins';
import { TapeDeck } from '../TapeDeck';
import { ControlPanel } from '../ControlPanel';
import { LEDDisplay } from '../LEDDisplay';
import { VolumeKnob } from '../VolumeKnob';
import { PlaylistPanel } from '../PlaylistPanel';
import { FavoritesPanel } from '../FavoritesPanel';
import { SkinSelector } from '../SkinSelector';
import { MusicSearchPanel } from '../MusicSearchPanel';
import { TodayHitsPanel } from '../TodayHitsPanel';
import { useKeyboardShortcuts, VOLUME_STEP } from '../../hooks/useKeyboardShortcuts';
import { useResponsive } from '../../hooks/useResponsive';
import { useLyrics } from '../../hooks/useLyrics';
import type { Track } from '../../types';
import styles from './TapePlayer.module.css';

// ============================================================================
// Error Boundary
// ============================================================================

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class TapePlayerErrorBoundary extends Component<
  { children: ReactNode; onError?: (error: Error) => void },
  ErrorBoundaryState
> {
  constructor(props: { children: ReactNode; onError?: (error: Error) => void }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('TapePlayer Error:', error, errorInfo);
    this.props.onError?.(error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className={styles.errorFallback} role="alert">
          <p>播放器遇到了一个错误</p>
          <button
            className={styles.retryButton}
            onClick={() => this.setState({ hasError: false, error: null })}
          >
            重试
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// ============================================================================
// Main TapePlayer Component
// ============================================================================

/**
 * TapePlayer - Root cassette player component
 *
 * This is the main entry point that orchestrates all player functionality.
 * It connects the Zustand store, audio service, and file service together
 * with the visual components.
 */
export function TapePlayer() {
  // Store state and actions
  const {
    playState,
    currentTime,
    duration,
    volume,
    isMuted,
    isSeeking,
    seekDirection,
    currentTrack,
    currentTrackIndex,
    playlist,
    favorites,
    currentSkinId,
    showVolumeDisplay,
    isChangingTape,
    isPlaylistExpanded,
    isFavoritesExpanded,
    frequencyBands,
    playMode,
    play,
    pause,
    stop,
    setVolume,
    toggleMute,
    startSeekForward,
    startSeekBackward,
    stopSeek,
    nextTrack,
    prevTrack,
    selectTrack,
    playTrack,
    setPlaylist,
    addToPlaylistBatch,
    toggleFavorite,
    removeFromPlaylist,
    setCurrentTime,
    setDuration,
    setShowVolumeDisplay,
    setCurrentSkinId,
    customSkinColors,
    setCustomSkinColors,
    togglePlaylistExpanded,
    toggleFavoritesExpanded,
    clearPlaylist,
    showMusicSearch,
    toggleMusicSearch,
    setFrequencyBands,
    resetAudioAnalysis,
    cyclePlayMode,
  } = usePlayerStore();

  // Services
  const audioService = useRef(getAudioService({ volume }));
  const fileService = useRef(getFileService());

  // Local UI state
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Responsive
  const { isMobile } = useResponsive();

  // Lyrics
  const {
    lines: lyricsLines,
    currentLineIndex: currentLyricIndex,
    isSearching: isLyricsSearching,
    autoSearchFailed: lyricsAutoSearchFailed,
    loadLocalFile: loadLyricsFile,
    searchOnline: searchLyricsOnline,
  } = useLyrics(currentTrack, currentTime);

  // Get current skin
  const currentSkin = getSkinById(currentSkinId, customSkinColors);

  // Derived state
  const hasTrack = currentTrack !== null;
  const hasMultipleTracks = playlist.length > 1;
  const favoriteTrackIds = favorites.map((track) => track.id);

  const handleFavoriteTrackSelect = useCallback((track: Track) => {
    playTrack(track);
  }, [playTrack]);

  // ========================================
  // Audio Service Callbacks
  // ========================================

  useEffect(() => {
    const audio = audioService.current;

    audio.onTimeUpdate(({ currentTime: time, duration: dur }) => {
      setCurrentTime(time);
      setDuration(dur);
    });

    audio.onEnd(() => {
      // Auto play next track
      if (playlist.length > 0) {
        nextTrack();
      } else {
        stop();
      }
    });

    return () => {
      // Only clear callbacks, don't destroy the singleton audio service
      // (destroy closes AudioContext and createMediaElementSource can only be called once per element)
      audio.onTimeUpdate(() => {});
      audio.onEnd(() => {});
    };
  }, [setCurrentTime, setDuration, nextTrack, stop, playlist.length]);

  // Load track when current track changes
  useEffect(() => {
    let cancelled = false;

    const loadTrack = async () => {
      if (currentTrack?.audioUrl) {
        try {
          setError(null);

          console.log('[DEBUG] Loading audio URL:', currentTrack.audioUrl);
          await audioService.current.loadFromUrl(currentTrack.audioUrl);

          if (cancelled) return;

          setDuration(audioService.current.getDuration());
          console.log('[DEBUG] Audio loaded successfully, duration:', audioService.current.getDuration());

          // Get current playState from store to avoid stale closure
          const currentPlayState = usePlayerStore.getState().playState;
          console.log('[DEBUG] Current playState after load:', currentPlayState);

          // Auto-play after track is loaded (when playState is 'playing')
          if (currentPlayState === 'playing') {
            console.log('[DEBUG] Auto-playing after load');
            audioService.current.play().catch(console.error);
          }
        } catch (err) {
          if (cancelled) return;
          console.error('[DEBUG] Failed to load track:', err);
          console.error('[DEBUG] Track info:', currentTrack);
          setError(`曲目加载失败: ${err instanceof Error ? err.message : '未知错误'}`);
        }
      }
    };
    loadTrack();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTrack, setDuration]);

  // Sync play state with audio service (only when audio is already loaded)
  useEffect(() => {
    // Only sync if audio is loaded - otherwise loadTrack will handle playback
    if (!audioService.current.isLoaded) {
      console.log('[DEBUG] Audio not loaded yet, skipping playState sync');
      return;
    }

    if (playState === 'playing') {
      console.log('[DEBUG] Syncing playState to playing, calling audioService.play()');
      audioService.current.play().catch((err) => {
        console.error('[DEBUG] audioService.play() failed:', err);
      });
    } else if (playState === 'paused') {
      console.log('[DEBUG] Syncing playState to paused');
      audioService.current.pause();
    } else if (playState === 'stopped') {
      console.log('[DEBUG] Syncing playState to stopped');
      audioService.current.stop();
    }
  }, [playState]);

  // Sync volume with audio service
  useEffect(() => {
    audioService.current.setVolume(volume);
  }, [volume]);

  // Sync mute with audio service
  useEffect(() => {
    if (isMuted) {
      audioService.current.mute();
    } else {
      audioService.current.unmute();
    }
  }, [isMuted]);

  // Sync seeking with audio service
  useEffect(() => {
    if (isSeeking) {
      if (seekDirection === 'forward') {
        audioService.current.enableFastForward();
      } else if (seekDirection === 'backward') {
        audioService.current.enableRewind();
      }
    } else {
      audioService.current.resetPlaybackRate();
    }
  }, [isSeeking, seekDirection]);

  // ========================================
  // Audio Analysis (Frequency Visualization)
  // ========================================

  const animationFrameRef = useRef<number | null>(null);

  // Update frequency bands for visualizer
  useEffect(() => {
    const updateFrequencyData = () => {
      if (playState === 'playing' && audioService.current.hasAnalyser()) {
        const bands = audioService.current.getFrequencyBands();
        setFrequencyBands(bands);
      }
      animationFrameRef.current = requestAnimationFrame(updateFrequencyData);
    };

    if (playState === 'playing') {
      animationFrameRef.current = requestAnimationFrame(updateFrequencyData);
    }

    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [playState, setFrequencyBands]);

  // Reset audio analysis when stopped
  useEffect(() => {
    if (playState === 'stopped') {
      resetAudioAnalysis();
    }
  }, [playState, resetAudioAnalysis]);

  // ========================================
  // Keyboard Shortcuts
  // ========================================

  useKeyboardShortcuts({
    onPlayPause: () => {
      if (playState === 'playing') {
        pause();
      } else {
        play();
      }
    },
    onSeekForward: startSeekForward,
    onSeekBackward: startSeekBackward,
    onSeekStop: stopSeek,
    onVolumeUp: () => setVolume(Math.min(100, volume + VOLUME_STEP)),
    onVolumeDown: () => setVolume(Math.max(0, volume - VOLUME_STEP)),
    onMuteToggle: toggleMute,
    onNextTrack: nextTrack,
    onPrevTrack: prevTrack,
    enabled: hasTrack,
  });

  // ========================================
  // File Handling
  // ========================================

  const handleDrop = useCallback(async (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(false);

    try {
      const files = Array.from(event.dataTransfer.files);
      const validFiles = fileService.current.validateFiles(files);

      if (validFiles.validFiles.length > 0) {
        const results = await fileService.current.loadFiles(validFiles.validFiles);
        const tracks: Track[] = results.map((r) => r.track);

        if (playlist.length > 0) {
          addToPlaylistBatch(tracks);
        } else {
          setPlaylist(tracks);
        }
      }
    } catch (err) {
      console.error('File drop error:', err);
      setError('文件加载失败');
    }
  }, [playlist.length, setPlaylist, addToPlaylistBatch]);

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      try {
        const fileArray = Array.from(files);
        const validFiles = fileService.current.validateFiles(fileArray);

        if (validFiles.validFiles.length > 0) {
          const results = await fileService.current.loadFiles(validFiles.validFiles);
          const tracks: Track[] = results.map((r) => r.track);

          if (playlist.length > 0) {
            addToPlaylistBatch(tracks);
          } else {
            setPlaylist(tracks);
          }
        }
      } catch (err) {
        console.error('File select error:', err);
        setError('文件加载失败');
      }
    }
    event.target.value = '';
  }, [playlist.length, setPlaylist, addToPlaylistBatch]);

  const handleVolumeChange = useCallback((newVolume: number) => {
    setVolume(newVolume);
    setShowVolumeDisplay(true);
    setTimeout(() => setShowVolumeDisplay(false), 2000);
  }, [setVolume, setShowVolumeDisplay]);

  // ========================================
  // Lyrics File Handling
  // ========================================

  const lyricsFileInputRef = useRef<HTMLInputElement>(null);

  const handleLyricsFileSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.name.endsWith('.lrc')) {
      await loadLyricsFile(file);
    }
    event.target.value = '';
  }, [loadLyricsFile]);

  const handleLyricsLoadLocal = useCallback(() => {
    lyricsFileInputRef.current?.click();
  }, []);

  // ========================================
  // Render
  // ========================================

  return (
    <TapePlayerErrorBoundary>
      <div
        className={`${styles.tapePlayer} ${isMobile ? styles.mobile : ''}`}
        data-skin={currentSkinId}
      >
        {/* Header */}
        <header className={styles.header}>
          <h1 className={styles.title}>复古磁带播放器</h1>
          <p className={styles.subtitle}>Retro Cassette Player</p>
        </header>

        {/* Main content area */}
        <main
          className={`${styles.main} ${isDragging ? styles.dragging : ''}`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          {/* Hidden lyrics file input */}
          <input
            ref={lyricsFileInputRef}
            type="file"
            accept=".lrc"
            onChange={handleLyricsFileSelect}
            style={{ display: 'none' }}
          />

          {/* Error display */}
          {error && (
            <div className={styles.errorBanner} role="alert">
              <span>{error}</span>
              <button
                onClick={() => setError(null)}
                aria-label="关闭错误提示"
                className={styles.errorClose}
              >
                ×
              </button>
            </div>
          )}

          {/* Player components */}
          <div className={styles.playerContent}>
            {/* Today Hits Panel - 今日主打歌 */}
            <div className={styles.playerTodayHits}>
              <TodayHitsPanel
                onTrackSelect={playTrack}
                currentTrackId={currentTrack?.id}
              />
            </div>

            {/* Left column: integrated player module */}
            <div className={styles.playerLeft}>
              {/* LED Display */}
              <LEDDisplay
                currentTime={currentTime}
                duration={duration}
                trackName={currentTrack?.name}
                artist={currentTrack?.artist}
                playState={playState}
                showVolume={showVolumeDisplay}
                volume={volume}
                isSeeking={isSeeking}
                seekDirection={seekDirection}
                lyricsLines={lyricsLines}
                currentLyricIndex={currentLyricIndex}
                isLyricsSearching={isLyricsSearching}
                lyricsAutoSearchFailed={lyricsAutoSearchFailed}
                onLyricsSearch={searchLyricsOnline}
                onLyricsLoadLocal={handleLyricsLoadLocal}
                frequencyBands={frequencyBands}
              />

              {/* Tape Deck */}
              <div className={styles.playerTapeSection}>
                <TapeDeck
                  skin={currentSkin}
                  isPlaying={playState === 'playing'}
                  isSeeking={isSeeking}
                  seekDirection={seekDirection}
                  currentTime={currentTime}
                  duration={duration}
                  isChangingTape={isChangingTape}
                  currentTrack={currentTrack}
                  onSeek={(time) => {
                    audioService.current.seekTo(time);
                    setCurrentTime(time);
                  }}
                />
              </div>

              {/* Controls section */}
              <div className={styles.controlsSection}>
                {/* Control Panel */}
                <ControlPanel
                  playState={playState}
                  isSeeking={isSeeking}
                  seekDirection={seekDirection}
                  volume={volume}
                  isMuted={isMuted}
                  playMode={playMode}
                  onPlay={play}
                  onPause={pause}
                  onStop={stop}
                  onSeekForward={startSeekForward}
                  onSeekBackward={startSeekBackward}
                  onSeekStop={stopSeek}
                  onVolumeChange={handleVolumeChange}
                  onMuteToggle={toggleMute}
                  onEject={() => {
                    stop();
                    clearPlaylist();
                  }}
                  onNextTrack={nextTrack}
                  onPrevTrack={prevTrack}
                  onCyclePlayMode={cyclePlayMode}
                  disabled={!hasTrack}
                />

                {/* Volume Knob */}
                <VolumeKnob
                  volume={volume}
                  isMuted={isMuted}
                  onChange={handleVolumeChange}
                  onMuteToggle={toggleMute}
                  disabled={!hasTrack}
                />
              </div>

              {/* Skin Selector */}
              <div className={styles.playerBottomBar}>
                <SkinSelector
                  currentSkinId={currentSkinId}
                  onSkinChange={setCurrentSkinId}
                  customSkinColors={customSkinColors}
                  onCustomSkinColorsChange={setCustomSkinColors}
                />
              </div>
            </div>

            {/* Right column: playlist */}
            <div className={styles.playerRight}>
              {/* Playlist Panel */}
              <PlaylistPanel
                playlist={playlist}
                currentTrackIndex={currentTrackIndex}
                isExpanded={isPlaylistExpanded}
                favoriteTrackIds={favoriteTrackIds}
                onTrackSelect={selectTrack}
                onToggleFavorite={toggleFavorite}
                onRemoveTrack={removeFromPlaylist}
                onToggleExpand={togglePlaylistExpanded}
              />

              <FavoritesPanel
                favorites={favorites}
                isExpanded={isFavoritesExpanded}
                onToggleExpand={toggleFavoritesExpanded}
                onTrackSelect={handleFavoriteTrackSelect}
                onRemoveFavorite={(track) => toggleFavorite(track)}
              />

              {/* Online search toggle */}
              <button
                className={styles.searchToggleButton}
                onClick={toggleMusicSearch}
              >
                {showMusicSearch ? '收起搜索' : '在线搜索'}
              </button>

              {/* Music Search Panel */}
              {showMusicSearch && (
                <MusicSearchPanel />
              )}
            </div>

          </div>
        </main>
      </div>
    </TapePlayerErrorBoundary>
  );
}

export default TapePlayer;

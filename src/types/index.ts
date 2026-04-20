/**
 * Retro Cassette Player - Type Definitions
 * Core interfaces and types for the cassette player application
 */

// ============================================================================
// Track Types
// ============================================================================

/**
 * Represents a single audio track
 */
export interface Track {
  id: string;
  name: string;
  artist?: string;
  album?: string;
  duration: number;
  albumCover?: string;
  audioUrl: string;
  file?: File;
  /** 原始来源ID，如网易云歌曲ID，用于重新获取URL */
  sourceId?: number;
  /** 来源类型 */
  sourceType?: 'netease' | 'local';
  /** URL创建时间，用于判断是否过期 */
  urlCreatedAt?: number;
}

// ============================================================================
// Tape Skin Types
// ============================================================================

/**
 * Represents a visual skin/theme for the cassette tape
 */
export interface TapeSkin {
  id: string;
  name: string;
  displayName: string;
  bodyColor: string;
  bodyGradient?: string;
  reelColor: string;
  reelPattern?: string;
  labelColor: string;
  labelPattern?: string;
  texture?: string;
  thumbnail?: string;
}

// ============================================================================
// Player State Types
// ============================================================================

/**
 * Play state of the player
 */
export type PlayState = 'playing' | 'paused' | 'stopped';

/**
 * Seek direction for fast-forward/rewind
 */
export type SeekDirection = 'forward' | 'backward' | null;

/**
 * Play mode for playlist playback
 */
export type PlayMode = 'sequence' | 'loop' | 'single' | 'shuffle';

/**
 * Complete player state interface
 */
export interface PlayerState {
  // Playback state
  playState: PlayState;
  currentTime: number;
  duration: number;
  playbackRate: number;
  volume: number;
  isMuted: boolean;

  // Fast-forward/rewind state
  isSeeking: boolean;
  seekDirection: SeekDirection;

  // Play mode
  playMode: PlayMode;

  // Track info
  currentTrackIndex: number;
  currentTrack: Track | null;

  // Playlist
  playlist: Track[];
  favorites: Track[];

  // UI state
  currentSkinId: string;
  customSkinColors: {
    bodyColor: string;
    reelColor: string;
    labelColor: string;
  };
  isChangingTape: boolean;
  showVolumeDisplay: boolean;
  isPlaylistExpanded: boolean;
  isFavoritesExpanded: boolean;
  showMusicSearch: boolean;
}

// ============================================================================
// Error Types
// ============================================================================

/**
 * Player error types as const object (instead of enum for erasableSyntaxOnly)
 */
export const PlayerErrorType = {
  UNSUPPORTED_FORMAT: 'UNSUPPORTED_FORMAT',
  LOAD_FAILED: 'LOAD_FAILED',
  DECODE_FAILED: 'DECODE_FAILED',
  PLAYBACK_FAILED: 'PLAYBACK_FAILED',
  NETWORK_ERROR: 'NETWORK_ERROR',
} as const;

export type PlayerErrorType = typeof PlayerErrorType[keyof typeof PlayerErrorType];

/**
 * Represents a player error
 */
export interface PlayerError {
  type: PlayerErrorType;
  message: string;
  detail?: string;
  recoverable: boolean;
}

// ============================================================================
// Component Props Types
// ============================================================================

/**
 * Props for the main TapePlayer component
 */
export interface TapePlayerProps {
  playlist?: Track[];
  autoPlay?: boolean;
  initialVolume?: number;
  initialSkinId?: string;
  onTrackChange?: (track: Track | null, index: number) => void;
  onStateChange?: (state: PlayerState) => void;
  onError?: (error: PlayerError) => void;
  className?: string;
}

/**
 * Props for the TapeDeck component (visual cassette tape)
 */
export interface TapeDeckProps {
  skin: TapeSkin;
  isPlaying: boolean;
  isSeeking: boolean;
  seekDirection: SeekDirection;
  currentTime: number;
  duration: number;
  isChangingTape: boolean;
  className?: string;
  /** Callback when user seeks via progress bar drag/click */
  onSeek?: (time: number) => void;
}

/**
 * Props for the Reel component
 */
export interface ReelProps {
  color: string;
  pattern?: string;
  isSpinning: boolean;
  spinDirection: 'clockwise' | 'counter-clockwise';
  size?: number;
  className?: string;
}

/**
 * Props for the ControlPanel component
 */
export interface ControlPanelProps {
  playState: PlayState;
  isSeeking: boolean;
  seekDirection: SeekDirection;
  volume: number;
  isMuted: boolean;
  playMode?: PlayMode;
  onPlay: () => void;
  onPause: () => void;
  onStop: () => void;
  onSeekForward: () => void;
  onSeekBackward: () => void;
  onSeekStop: () => void;
  onVolumeChange: (volume: number) => void;
  onMuteToggle: () => void;
  onEject: () => void;
  onNextTrack: () => void;
  onPrevTrack: () => void;
  onCyclePlayMode?: () => void;
  disabled?: boolean;
  className?: string;
}

/**
 * Props for the LEDDisplay component
 */
export interface LEDDisplayProps {
  currentTime: number;
  duration: number;
  trackName?: string;
  artist?: string;
  playState: PlayState;
  showVolume?: boolean;
  volume?: number;
  className?: string;
}

/**
 * Props for the VolumeKnob component
 */
export interface VolumeKnobProps {
  volume: number;
  isMuted: boolean;
  onChange: (volume: number) => void;
  onMuteToggle: () => void;
  disabled?: boolean;
  className?: string;
}

/**
 * Props for the PlaylistPanel component
 */
export interface PlaylistPanelProps {
  playlist: Track[];
  currentTrackIndex: number;
  isExpanded: boolean;
  favoriteTrackIds: string[];
  onTrackSelect: (index: number) => void;
  onToggleFavorite: (track: Track) => void;
  onRemoveTrack: (index: number) => void;
  onToggleExpand: () => void;
  onReorder?: (startIndex: number, endIndex: number) => void;
  className?: string;
}

export interface FavoritesPanelProps {
  favorites: Track[];
  isExpanded: boolean;
  onToggleExpand: () => void;
  onTrackSelect: (track: Track) => void;
  onRemoveFavorite: (track: Track) => void;
  className?: string;
}

// ============================================================================
// Event Handler Types
// ============================================================================

/**
 * Handler for track change events
 */
export type TrackChangeHandler = (track: Track | null, index: number) => void;

/**
 * Handler for state change events
 */
export type StateChangeHandler = (state: PlayerState) => void;

/**
 * Handler for error events
 */
export type ErrorHandler = (error: PlayerError) => void;

/**
 * Handler for volume change events
 */
export type VolumeChangeHandler = (volume: number) => void;

// ============================================================================
// Lyrics Types
// ============================================================================

/**
 * A single parsed lyric line with timestamp
 */
export interface LyricLine {
  /** Time in seconds */
  time: number;
  /** Lyric text content */
  text: string;
}

/**
 * Parsed lyrics data associated with a track
 */
export interface LyricsData {
  /** ID of the track these lyrics belong to */
  trackId: string;
  /** Parsed lyric lines sorted by time */
  lines: LyricLine[];
  /** Where the lyrics came from */
  source: 'local' | 'online';
}

/**
 * Result from an online lyrics search
 */
export interface LyricsSearchResult {
  id: number;
  trackName: string;
  artistName: string;
  albumName?: string;
  duration?: number;
  syncedLyrics?: string;
  plainLyrics?: string;
}

// ============================================================================
// Music Search Types
// ============================================================================

/**
 * A single result from online music search
 */
export interface MusicSearchResult {
  id: number;
  name: string;
  artist: string;
  album: string;
  duration: number; // milliseconds
  /** Song fee type: 0=free, 1=VIP required, 8=free low quality */
  fee?: number;
}

/**
 * Play URL result from music API
 */
export interface MusicUrlResult {
  id: number;
  url: string;
  br: number; // bitrate in kbps
}

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Partial player state for updates
 */
export type PlayerStateUpdate = Partial<PlayerState>;

/**
 * Skin customization options
 */
export type SkinCustomization = Partial<Omit<TapeSkin, 'id'>>;

/**
 * Time format options for display
 */
export interface TimeFormatOptions {
  showHours?: boolean;
  showMilliseconds?: boolean;
  separator?: string;
}

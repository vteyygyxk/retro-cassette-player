/**
 * Retro Cassette Player - Storage Service
 * Handles LocalStorage operations for user preferences persistence
 */

// ============================================================================
// Types
// ============================================================================

/**
 * Track metadata for recent tracks history
 */
export interface TrackMetadata {
  name: string;
  artist?: string;
  lastPlayed: number;
}

/**
 * Storage data structure for user preferences
 */
export interface StorageData {
  /** User's preferred skin ID */
  preferredSkinId: string;
  /** Last volume setting (0-100) */
  lastVolume: number;
  /** Recently played tracks metadata */
  recentTracks: TrackMetadata[];
}

/**
 * Storage error type
 */
export interface StorageError {
  type: 'QUOTA_EXCEEDED' | 'NOT_AVAILABLE' | 'PARSE_ERROR' | 'UNKNOWN';
  message: string;
  originalError?: Error;
}

/**
 * Storage operation result
 */
export interface StorageResult<T> {
  success: boolean;
  data?: T;
  error?: StorageError;
}

// ============================================================================
// Constants
// ============================================================================

/**
 * LocalStorage key for player data
 */
const STORAGE_KEY = 'retro-cassette-player-data';

/**
 * Default storage data
 */
const DEFAULT_STORAGE_DATA: StorageData = {
  preferredSkinId: 'classic-black',
  lastVolume: 80,
  recentTracks: [],
};

/**
 * Maximum number of recent tracks to store
 */
const MAX_RECENT_TRACKS = 10;

// ============================================================================
// Storage Service Class
// ============================================================================

/**
 * StorageService provides type-safe LocalStorage operations for the cassette player.
 * It handles user preferences persistence with error handling.
 */
export class StorageService {
  private isAvailable: boolean | null = null;

  // ========================================
  // Public API - Availability Check
  // ========================================

  /**
   * Check if LocalStorage is available
   * This should be called before any storage operations
   */
  checkAvailability(): boolean {
    if (this.isAvailable !== null) {
      return this.isAvailable;
    }

    try {
      const testKey = '__storage_test__';
      localStorage.setItem(testKey, testKey);
      localStorage.removeItem(testKey);
      this.isAvailable = true;
      return true;
    } catch {
      this.isAvailable = false;
      return false;
    }
  }

  // ========================================
  // Public API - Read Operations
  // ========================================

  /**
   * Get all stored data
   */
  getAll(): StorageResult<StorageData> {
    if (!this.checkAvailability()) {
      return {
        success: false,
        error: {
          type: 'NOT_AVAILABLE',
          message: 'LocalStorage is not available',
        },
      };
    }

    try {
      const rawData = localStorage.getItem(STORAGE_KEY);

      if (!rawData) {
        // Return default data if nothing is stored
        return {
          success: true,
          data: { ...DEFAULT_STORAGE_DATA },
        };
      }

      const parsedData = JSON.parse(rawData) as Partial<StorageData>;

      // Merge with defaults to ensure all fields exist
      const data: StorageData = {
        ...DEFAULT_STORAGE_DATA,
        ...parsedData,
      };

      return {
        success: true,
        data,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          type: 'PARSE_ERROR',
          message: 'Failed to parse stored data',
          originalError: error instanceof Error ? error : undefined,
        },
      };
    }
  }

  /**
   * Get preferred skin ID
   */
  getPreferredSkinId(): string {
    const result = this.getAll();
    return result.success && result.data ? result.data.preferredSkinId : DEFAULT_STORAGE_DATA.preferredSkinId;
  }

  /**
   * Get last volume setting
   */
  getLastVolume(): number {
    const result = this.getAll();
    return result.success && result.data ? result.data.lastVolume : DEFAULT_STORAGE_DATA.lastVolume;
  }

  /**
   * Get recent tracks
   */
  getRecentTracks(): TrackMetadata[] {
    const result = this.getAll();
    return result.success && result.data ? result.data.recentTracks : [];
  }

  // ========================================
  // Public API - Write Operations
  // ========================================

  /**
   * Save all data to storage
   * @param data - The data to save
   */
  saveAll(data: Partial<StorageData>): StorageResult<void> {
    if (!this.checkAvailability()) {
      return {
        success: false,
        error: {
          type: 'NOT_AVAILABLE',
          message: 'LocalStorage is not available',
        },
      };
    }

    try {
      // Get existing data and merge with new data
      const existingResult = this.getAll();
      const existingData = existingResult.success && existingResult.data
        ? existingResult.data
        : { ...DEFAULT_STORAGE_DATA };

      const mergedData: StorageData = {
        ...existingData,
        ...data,
      };

      const serialized = JSON.stringify(mergedData);
      localStorage.setItem(STORAGE_KEY, serialized);

      return { success: true };
    } catch (error) {
      const storageError: StorageError = {
        type: 'UNKNOWN',
        message: 'Failed to save data to storage',
        originalError: error instanceof Error ? error : undefined,
      };

      // Check for quota exceeded error
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        storageError.type = 'QUOTA_EXCEEDED';
        storageError.message = 'Storage quota exceeded';
      }

      return {
        success: false,
        error: storageError,
      };
    }
  }

  /**
   * Save preferred skin ID
   * @param skinId - The skin ID to save
   */
  savePreferredSkinId(skinId: string): StorageResult<void> {
    return this.saveAll({ preferredSkinId: skinId });
  }

  /**
   * Save last volume setting
   * @param volume - The volume level (0-100)
   */
  saveLastVolume(volume: number): StorageResult<void> {
    // Clamp volume to valid range
    const clampedVolume = Math.max(0, Math.min(100, volume));
    return this.saveAll({ lastVolume: clampedVolume });
  }

  /**
   * Add a track to recent tracks
   * @param track - The track metadata to add
   */
  addRecentTrack(track: TrackMetadata): StorageResult<void> {
    const result = this.getAll();
    const recentTracks = result.success && result.data ? result.data.recentTracks : [];

    // Remove existing entry for the same track (by name and artist)
    const filteredTracks = recentTracks.filter(
      (t) => !(t.name === track.name && t.artist === track.artist)
    );

    // Add new track at the beginning
    const updatedTracks = [
      { ...track, lastPlayed: Date.now() },
      ...filteredTracks,
    ].slice(0, MAX_RECENT_TRACKS);

    return this.saveAll({ recentTracks: updatedTracks });
  }

  /**
   * Clear recent tracks history
   */
  clearRecentTracks(): StorageResult<void> {
    return this.saveAll({ recentTracks: [] });
  }

  // ========================================
  // Public API - Utility Operations
  // ========================================

  /**
   * Clear all stored data
   */
  clear(): StorageResult<void> {
    if (!this.checkAvailability()) {
      return {
        success: false,
        error: {
          type: 'NOT_AVAILABLE',
          message: 'LocalStorage is not available',
        },
      };
    }

    try {
      localStorage.removeItem(STORAGE_KEY);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: {
          type: 'UNKNOWN',
          message: 'Failed to clear storage',
          originalError: error instanceof Error ? error : undefined,
        },
      };
    }
  }

  /**
   * Reset to default values
   */
  resetToDefaults(): StorageResult<void> {
    return this.saveAll({ ...DEFAULT_STORAGE_DATA });
  }

  /**
   * Export stored data as JSON string
   * Useful for debugging or backup
   */
  exportData(): string {
    const result = this.getAll();
    return JSON.stringify(result.success && result.data ? result.data : DEFAULT_STORAGE_DATA, null, 2);
  }

  /**
   * Import data from JSON string
   * Useful for restoring from backup
   * @param jsonString - The JSON string to import
   */
  importData(jsonString: string): StorageResult<void> {
    try {
      const data = JSON.parse(jsonString) as Partial<StorageData>;
      return this.saveAll(data);
    } catch (error) {
      return {
        success: false,
        error: {
          type: 'PARSE_ERROR',
          message: 'Failed to parse import data',
          originalError: error instanceof Error ? error : undefined,
        },
      };
    }
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let storageServiceInstance: StorageService | null = null;

/**
 * Get the singleton storage service instance
 */
export function getStorageService(): StorageService {
  if (!storageServiceInstance) {
    storageServiceInstance = new StorageService();
  }
  return storageServiceInstance;
}

/**
 * Reset the storage service instance (useful for testing)
 */
export function resetStorageService(): void {
  storageServiceInstance = null;
}

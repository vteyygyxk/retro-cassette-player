/**
 * Retro Cassette Player - Storage Service Tests
 * Unit tests for the storage service
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  StorageService,
  getStorageService,
  resetStorageService,
} from './storageService';
import type { StorageData, TrackMetadata } from './storageService';

// ============================================================================
// Test Setup
// ============================================================================

describe('StorageService', () => {
  let storageService: StorageService;
  const STORAGE_KEY = 'retro-cassette-player-data';

  // Mock localStorage
  const localStorageMock = (() => {
    let store: Record<string, string> = {};
    return {
      getItem: vi.fn((key: string) => store[key] || null),
      setItem: vi.fn((key: string, value: string) => {
        store[key] = value;
      }),
      removeItem: vi.fn((key: string) => {
        delete store[key];
      }),
      clear: vi.fn(() => {
        store = {};
      }),
      get store() {
        return store;
      },
    };
  })();

  beforeEach(() => {
    // Reset singleton
    resetStorageService();
    storageService = getStorageService();

    // Clear mock storage
    localStorageMock.clear();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    localStorageMock.removeItem.mockClear();

    // Apply mock
    Object.defineProperty(globalThis, 'localStorage', {
      value: localStorageMock,
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    resetStorageService();
  });

  // ============================================================================
  // Availability Tests
  // ============================================================================

  describe('checkAvailability', () => {
    it('should return true when localStorage is available', () => {
      expect(storageService.checkAvailability()).toBe(true);
    });

    it('should cache the availability result', () => {
      storageService.checkAvailability();
      storageService.checkAvailability();
      // Should only call setItem once for the test
      expect(localStorageMock.setItem).toHaveBeenCalledTimes(1);
    });
  });

  // ============================================================================
  // Read Operations Tests
  // ============================================================================

  describe('getAll', () => {
    it('should return default data when nothing is stored', () => {
      const result = storageService.getAll();

      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        preferredSkinId: 'classic-black',
        lastVolume: 80,
        recentTracks: [],
      });
    });

    it('should return stored data', () => {
      const storedData: StorageData = {
        preferredSkinId: 'neon-pink',
        lastVolume: 50,
        recentTracks: [
          { name: 'Test Track', artist: 'Test Artist', lastPlayed: 1234567890 },
        ],
      };

      localStorageMock.store[STORAGE_KEY] = JSON.stringify(storedData);

      const result = storageService.getAll();

      expect(result.success).toBe(true);
      expect(result.data).toEqual(storedData);
    });

    it('should merge with defaults for partial data', () => {
      const partialData = { preferredSkinId: 'retro-brown' };
      localStorageMock.store[STORAGE_KEY] = JSON.stringify(partialData);

      const result = storageService.getAll();

      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        preferredSkinId: 'retro-brown',
        lastVolume: 80,
        recentTracks: [],
      });
    });

    it('should handle parse errors gracefully', () => {
      localStorageMock.store[STORAGE_KEY] = 'invalid json';

      const result = storageService.getAll();

      expect(result.success).toBe(false);
      expect(result.error?.type).toBe('PARSE_ERROR');
    });
  });

  describe('getPreferredSkinId', () => {
    it('should return default skin ID when nothing is stored', () => {
      expect(storageService.getPreferredSkinId()).toBe('classic-black');
    });

    it('should return stored skin ID', () => {
      const storedData = { preferredSkinId: 'neon-pink' };
      localStorageMock.store[STORAGE_KEY] = JSON.stringify(storedData);

      expect(storageService.getPreferredSkinId()).toBe('neon-pink');
    });
  });

  describe('getLastVolume', () => {
    it('should return default volume when nothing is stored', () => {
      expect(storageService.getLastVolume()).toBe(80);
    });

    it('should return stored volume', () => {
      const storedData = { lastVolume: 50 };
      localStorageMock.store[STORAGE_KEY] = JSON.stringify(storedData);

      expect(storageService.getLastVolume()).toBe(50);
    });
  });

  describe('getRecentTracks', () => {
    it('should return empty array when nothing is stored', () => {
      expect(storageService.getRecentTracks()).toEqual([]);
    });

    it('should return stored recent tracks', () => {
      const tracks: TrackMetadata[] = [
        { name: 'Track 1', artist: 'Artist 1', lastPlayed: 1234567890 },
        { name: 'Track 2', artist: 'Artist 2', lastPlayed: 1234567891 },
      ];
      localStorageMock.store[STORAGE_KEY] = JSON.stringify({ recentTracks: tracks });

      expect(storageService.getRecentTracks()).toEqual(tracks);
    });
  });

  // ============================================================================
  // Write Operations Tests
  // ============================================================================

  describe('saveAll', () => {
    it('should save data to localStorage', () => {
      const data: Partial<StorageData> = {
        preferredSkinId: 'neon-pink',
        lastVolume: 50,
      };

      const result = storageService.saveAll(data);

      expect(result.success).toBe(true);
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        STORAGE_KEY,
        expect.stringContaining('"preferredSkinId":"neon-pink"')
      );
    });

    it('should merge with existing data', () => {
      // Set initial data
      localStorageMock.store[STORAGE_KEY] = JSON.stringify({
        preferredSkinId: 'classic-black',
        lastVolume: 80,
      });

      // Update only skin
      const result = storageService.saveAll({ preferredSkinId: 'retro-brown' });

      expect(result.success).toBe(true);

      // Verify volume is preserved
      const savedData = JSON.parse(localStorageMock.store[STORAGE_KEY]);
      expect(savedData.preferredSkinId).toBe('retro-brown');
      expect(savedData.lastVolume).toBe(80);
    });
  });

  describe('savePreferredSkinId', () => {
    it('should save skin ID', () => {
      const result = storageService.savePreferredSkinId('neon-pink');

      expect(result.success).toBe(true);

      const savedData = JSON.parse(localStorageMock.store[STORAGE_KEY]);
      expect(savedData.preferredSkinId).toBe('neon-pink');
    });
  });

  describe('saveLastVolume', () => {
    it('should save volume', () => {
      const result = storageService.saveLastVolume(50);

      expect(result.success).toBe(true);

      const savedData = JSON.parse(localStorageMock.store[STORAGE_KEY]);
      expect(savedData.lastVolume).toBe(50);
    });

    it('should clamp volume to valid range', () => {
      // Test upper bound
      storageService.saveLastVolume(150);
      let savedData = JSON.parse(localStorageMock.store[STORAGE_KEY]);
      expect(savedData.lastVolume).toBe(100);

      // Test lower bound
      storageService.saveLastVolume(-10);
      savedData = JSON.parse(localStorageMock.store[STORAGE_KEY]);
      expect(savedData.lastVolume).toBe(0);
    });
  });

  describe('addRecentTrack', () => {
    it('should add track to recent tracks', () => {
      const track: TrackMetadata = {
        name: 'Test Track',
        artist: 'Test Artist',
        lastPlayed: 1234567890,
      };

      const result = storageService.addRecentTrack(track);

      expect(result.success).toBe(true);

      const savedData = JSON.parse(localStorageMock.store[STORAGE_KEY]);
      expect(savedData.recentTracks).toHaveLength(1);
      expect(savedData.recentTracks[0].name).toBe('Test Track');
    });

    it('should add track at the beginning', () => {
      // Add first track
      storageService.addRecentTrack({ name: 'Track 1', lastPlayed: 1000 });

      // Add second track
      storageService.addRecentTrack({ name: 'Track 2', lastPlayed: 2000 });

      const savedData = JSON.parse(localStorageMock.store[STORAGE_KEY]);
      expect(savedData.recentTracks[0].name).toBe('Track 2');
      expect(savedData.recentTracks[1].name).toBe('Track 1');
    });

    it('should update existing track position', () => {
      // Add track
      storageService.addRecentTrack({ name: 'Track 1', lastPlayed: 1000 });
      storageService.addRecentTrack({ name: 'Track 2', lastPlayed: 2000 });

      // Add Track 1 again
      storageService.addRecentTrack({ name: 'Track 1', lastPlayed: 3000 });

      const savedData = JSON.parse(localStorageMock.store[STORAGE_KEY]);
      expect(savedData.recentTracks).toHaveLength(2);
      expect(savedData.recentTracks[0].name).toBe('Track 1');
    });

    it('should limit recent tracks to 10', () => {
      // Add 15 tracks
      for (let i = 0; i < 15; i++) {
        storageService.addRecentTrack({ name: `Track ${i}`, lastPlayed: i });
      }

      const savedData = JSON.parse(localStorageMock.store[STORAGE_KEY]);
      expect(savedData.recentTracks).toHaveLength(10);
      // Most recent should be first
      expect(savedData.recentTracks[0].name).toBe('Track 14');
    });
  });

  describe('clearRecentTracks', () => {
    it('should clear recent tracks', () => {
      // Add some tracks
      localStorageMock.store[STORAGE_KEY] = JSON.stringify({
        recentTracks: [
          { name: 'Track 1', lastPlayed: 1000 },
          { name: 'Track 2', lastPlayed: 2000 },
        ],
      });

      const result = storageService.clearRecentTracks();

      expect(result.success).toBe(true);

      const savedData = JSON.parse(localStorageMock.store[STORAGE_KEY]);
      expect(savedData.recentTracks).toEqual([]);
    });
  });

  // ============================================================================
  // Utility Operations Tests
  // ============================================================================

  describe('clear', () => {
    it('should remove all data from localStorage', () => {
      // Set some data
      localStorageMock.store[STORAGE_KEY] = JSON.stringify({
        preferredSkinId: 'neon-pink',
      });

      const result = storageService.clear();

      expect(result.success).toBe(true);
      expect(localStorageMock.removeItem).toHaveBeenCalledWith(STORAGE_KEY);
    });
  });

  describe('resetToDefaults', () => {
    it('should reset all data to defaults', () => {
      // Set custom data
      localStorageMock.store[STORAGE_KEY] = JSON.stringify({
        preferredSkinId: 'neon-pink',
        lastVolume: 50,
        recentTracks: [{ name: 'Track', lastPlayed: 1000 }],
      });

      const result = storageService.resetToDefaults();

      expect(result.success).toBe(true);

      const savedData = JSON.parse(localStorageMock.store[STORAGE_KEY]);
      expect(savedData).toEqual({
        preferredSkinId: 'classic-black',
        lastVolume: 80,
        recentTracks: [],
      });
    });
  });

  describe('exportData', () => {
    it('should export data as formatted JSON string', () => {
      localStorageMock.store[STORAGE_KEY] = JSON.stringify({
        preferredSkinId: 'neon-pink',
        lastVolume: 50,
        recentTracks: [],
      });

      const exported = storageService.exportData();

      expect(exported).toContain('"preferredSkinId": "neon-pink"');
      expect(exported).toContain('"lastVolume": 50');
    });

    it('should export default data when nothing is stored', () => {
      const exported = storageService.exportData();

      expect(exported).toContain('"preferredSkinId": "classic-black"');
      expect(exported).toContain('"lastVolume": 80');
    });
  });

  describe('importData', () => {
    it('should import valid JSON data', () => {
      const importJson = JSON.stringify({
        preferredSkinId: 'retro-brown',
        lastVolume: 30,
      });

      const result = storageService.importData(importJson);

      expect(result.success).toBe(true);

      const savedData = JSON.parse(localStorageMock.store[STORAGE_KEY]);
      expect(savedData.preferredSkinId).toBe('retro-brown');
      expect(savedData.lastVolume).toBe(30);
    });

    it('should fail on invalid JSON', () => {
      const result = storageService.importData('invalid json');

      expect(result.success).toBe(false);
      expect(result.error?.type).toBe('PARSE_ERROR');
    });
  });

  // ============================================================================
  // Singleton Tests
  // ============================================================================

  describe('getStorageService', () => {
    it('should return the same instance', () => {
      const instance1 = getStorageService();
      const instance2 = getStorageService();

      expect(instance1).toBe(instance2);
    });

    it('should return new instance after reset', () => {
      const instance1 = getStorageService();
      resetStorageService();
      const instance2 = getStorageService();

      expect(instance1).not.toBe(instance2);
    });
  });
});

/**
 * Lyrics Service - LRC parser, local file loading, and online search
 * Handles all lyrics-related operations
 */

import type { LyricLine, LyricsData, LyricsSearchResult } from '../types';

// ============================================================================
// LRC Parser
// ============================================================================

/**
 * Parse a time tag like [mm:ss.xx] or [mm:ss] into seconds
 */
function parseTimeTag(tag: string): number | null {
  const match = tag.match(/(\d+):(\d+)(?:\.(\d+))?/);
  if (!match) return null;

  const minutes = parseInt(match[1], 10);
  const seconds = parseInt(match[2], 10);
  const centiseconds = match[3] ? parseInt(match[3].padEnd(2, '0').slice(0, 2), 10) : 0;

  return minutes * 60 + seconds + centiseconds / 100;
}

/**
 * Parse LRC format text into structured lyric lines
 * Supports:
 * - [mm:ss.xx] text
 * - [mm:ss] text
 * - Multiple time tags per line: [mm:ss.xx][mm:ss.xx] text
 * - Metadata tags: [ti:Title], [ar:Artist], etc. (ignored)
 */
export function parseLRC(lrcText: string): LyricLine[] {
  const lines = lrcText.split('\n');
  const result: LyricLine[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Extract all time tags from the line
    const timeTags: number[] = [];
    const tagRegex = /\[(\d+:\d+(?:\.\d+)?)\]/g;
    let match;

    while ((match = tagRegex.exec(trimmed)) !== null) {
      const time = parseTimeTag(match[1]);
      if (time !== null) {
        timeTags.push(time);
      }
    }

    // If no time tags found, skip (could be metadata like [ti:Title])
    if (timeTags.length === 0) continue;

    // Get the text content (everything after the last time tag)
    const textPart = trimmed.replace(/\[\d+:\d+(?:\.\d+)?\]/g, '').trim();

    // Each time tag creates a separate lyric line
    for (const time of timeTags) {
      result.push({ time, text: textPart });
    }
  }

  // Sort by time
  result.sort((a, b) => a.time - b.time);

  return result;
}

// ============================================================================
// Lyrics Service
// ============================================================================

const LRCLIB_BASE_URL = 'https://lrclib.net/api';

export class LyricsService {
  private cache: Map<string, LyricsData> = new Map();

  // ========================================
  // LRC Parsing
  // ========================================

  /**
   * Parse LRC text content into LyricsData
   */
  parseLRCContent(lrcText: string, trackId: string, source: 'local' | 'online'): LyricsData {
    const lines = parseLRC(lrcText);
    const data: LyricsData = { trackId, lines, source };
    this.cache.set(trackId, data);
    return data;
  }

  // ========================================
  // Local File Loading
  // ========================================

  /**
   * Load lyrics from a local .lrc file
   */
  async loadLocalLRC(file: File, trackId: string): Promise<LyricsData> {
    const text = await file.text();
    return this.parseLRCContent(text, trackId, 'local');
  }

  // ========================================
  // Online Search
  // ========================================

  /**
   * Search for lyrics online via LRCLib
   */
  async searchOnline(query: string): Promise<LyricsSearchResult[]> {
    try {
      const response = await fetch(
        `${LRCLIB_BASE_URL}/search?q=${encodeURIComponent(query)}`
      );

      if (!response.ok) {
        throw new Error(`Search failed: ${response.status}`);
      }

      const data = await response.json();
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('Lyrics search failed:', error);
      return [];
    }
  }

  /**
   * Get exact match lyrics from LRCLib
   */
  async getExactMatch(
    trackName: string,
    artistName?: string,
    duration?: number
  ): Promise<LyricsSearchResult | null> {
    try {
      const params = new URLSearchParams();
      if (artistName) params.set('artist_name', artistName);
      params.set('track_name', trackName);
      if (duration) params.set('duration', duration.toString());

      const response = await fetch(`${LRCLIB_BASE_URL}/get?${params}`);

      if (!response.ok) return null;

      return await response.json();
    } catch {
      return null;
    }
  }

  /**
   * Search and return the best synced lyrics match
   */
  async searchAndLoad(
    trackName: string,
    artistName?: string,
    trackId?: string,
    duration?: number
  ): Promise<LyricsData | null> {
    // Try exact match first
    const exact = await this.getExactMatch(trackName, artistName, duration);
    if (exact?.syncedLyrics) {
      const id = trackId ?? `online-${Date.now()}`;
      return this.parseLRCContent(exact.syncedLyrics, id, 'online');
    }

    // Fallback to search
    const query = artistName ? `${trackName} ${artistName}` : trackName;
    const results = await this.searchOnline(query);

    // Find first result with synced lyrics
    for (const result of results) {
      if (result.syncedLyrics) {
        const id = trackId ?? `online-${Date.now()}`;
        return this.parseLRCContent(result.syncedLyrics, id, 'online');
      }
    }

    return null;
  }

  // ========================================
  // Cache Management
  // ========================================

  /**
   * Get cached lyrics for a track
   */
  getCached(trackId: string): LyricsData | undefined {
    return this.cache.get(trackId);
  }

  /**
   * Clear cached lyrics for a specific track
   */
  clearCache(trackId: string): void {
    this.cache.delete(trackId);
  }

  /**
   * Clear all cached lyrics
   */
  clearAllCache(): void {
    this.cache.clear();
  }
}

// ============================================================================
// Singleton
// ============================================================================

let lyricsServiceInstance: LyricsService | null = null;

export function getLyricsService(): LyricsService {
  if (!lyricsServiceInstance) {
    lyricsServiceInstance = new LyricsService();
  }
  return lyricsServiceInstance;
}

export function resetLyricsService(): void {
  lyricsServiceInstance = null;
}

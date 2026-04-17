/**
 * useLyrics Hook - Manages lyrics loading, syncing, and search
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { getLyricsService } from '../services/lyricsService';
import type { Track, LyricLine, LyricsSearchResult } from '../types';

export interface UseLyricsReturn {
  /** Current lyrics lines */
  lines: LyricLine[];
  /** Index of the currently active line (-1 if none) */
  currentLineIndex: number;
  /** Whether lyrics are loaded for the current track */
  hasLyrics: boolean;
  /** Whether an online search is in progress */
  isSearching: boolean;
  /** Whether auto-search was attempted and failed */
  autoSearchFailed: boolean;
  /** Online search results */
  searchResults: LyricsSearchResult[];
  /** Load lyrics from a local .lrc file */
  loadLocalFile: (file: File) => Promise<void>;
  /** Search for lyrics online */
  searchOnline: () => Promise<void>;
  /** Load a specific search result */
  loadSearchResult: (result: LyricsSearchResult) => void;
  /** Clear current lyrics */
  clearLyrics: () => void;
}

/**
 * Find the current lyric line index for a given time
 */
function findCurrentLineIndex(lines: LyricLine[], currentTime: number): number {
  if (lines.length === 0) return -1;

  // Binary search for the last line whose time <= currentTime
  let low = 0;
  let high = lines.length - 1;
  let result = -1;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    if (lines[mid].time <= currentTime) {
      result = mid;
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  return result;
}

export function useLyrics(
  currentTrack: Track | null,
  currentTime: number
): UseLyricsReturn {
  const [lines, setLines] = useState<LyricLine[]>([]);
  const [currentLineIndex, setCurrentLineIndex] = useState(-1);
  const [isSearching, setIsSearching] = useState(false);
  const [autoSearchFailed, setAutoSearchFailed] = useState(false);
  const [searchResults, setSearchResults] = useState<LyricsSearchResult[]>([]);
  const lyricsService = useRef(getLyricsService());
  const currentTrackIdRef = useRef<string | null>(null);
  const autoSearchAttemptedRef = useRef<Set<string>>(new Set());

  // Reset lyrics when track changes + auto-search
  useEffect(() => {
    const trackId = currentTrack?.id ?? null;
    if (trackId !== currentTrackIdRef.current) {
      currentTrackIdRef.current = trackId;
      setAutoSearchFailed(false);

      if (trackId) {
        // Check cache first
        const cached = lyricsService.current.getCached(trackId);
        if (cached) {
          setLines(cached.lines);
        } else {
          setLines([]);

          // Auto-search online if not already attempted for this track
          if (!autoSearchAttemptedRef.current.has(trackId) && currentTrack) {
            autoSearchAttemptedRef.current.add(trackId);

            const doAutoSearch = async () => {
              setIsSearching(true);
              try {
                const result = await lyricsService.current.searchAndLoad(
                  currentTrack.name,
                  currentTrack.artist,
                  trackId,
                  currentTrack.duration > 0 ? currentTrack.duration : undefined
                );
                if (result) {
                  setLines(result.lines);
                } else {
                  setAutoSearchFailed(true);
                }
              } catch {
                setAutoSearchFailed(true);
              } finally {
                setIsSearching(false);
              }
            };
            doAutoSearch();
          }
        }
      } else {
        setLines([]);
      }

      setCurrentLineIndex(-1);
      setSearchResults([]);
    }
  }, [currentTrack]);

  // Sync current line index with playback time
  useEffect(() => {
    if (lines.length === 0) {
      setCurrentLineIndex(-1);
      return;
    }

    const newIndex = findCurrentLineIndex(lines, currentTime);
    setCurrentLineIndex(newIndex);
  }, [lines, currentTime]);

  const loadLocalFile = useCallback(async (file: File) => {
    if (!currentTrack) return;

    try {
      const data = await lyricsService.current.loadLocalLRC(file, currentTrack.id);
      setLines(data.lines);
      setSearchResults([]);
    } catch (err) {
      console.error('Failed to load LRC file:', err);
    }
  }, [currentTrack]);

  const searchOnline = useCallback(async () => {
    if (!currentTrack) return;

    setIsSearching(true);
    try {
      const query = currentTrack.artist
        ? `${currentTrack.name} ${currentTrack.artist}`
        : currentTrack.name;

      const results = await lyricsService.current.searchOnline(query);
      setSearchResults(results);

      // Auto-load first result with synced lyrics
      const firstSynced = results.find(r => r.syncedLyrics);
      if (firstSynced) {
        const data = lyricsService.current.parseLRCContent(
          firstSynced.syncedLyrics!,
          currentTrack.id,
          'online'
        );
        setLines(data.lines);
      }
    } catch (err) {
      console.error('Online lyrics search failed:', err);
    } finally {
      setIsSearching(false);
    }
  }, [currentTrack]);

  const loadSearchResult = useCallback((result: LyricsSearchResult) => {
    if (!currentTrack || !result.syncedLyrics) return;

    const data = lyricsService.current.parseLRCContent(
      result.syncedLyrics,
      currentTrack.id,
      'online'
    );
    setLines(data.lines);
    setSearchResults([]);
  }, [currentTrack]);

  const clearLyrics = useCallback(() => {
    setLines([]);
    setCurrentLineIndex(-1);
    setSearchResults([]);
    if (currentTrack) {
      lyricsService.current.clearCache(currentTrack.id);
    }
  }, [currentTrack]);

  return {
    lines,
    currentLineIndex,
    hasLyrics: lines.length > 0,
    isSearching,
    autoSearchFailed,
    searchResults,
    loadLocalFile,
    searchOnline,
    loadSearchResult,
    clearLyrics,
  };
}

/**
 * useMusicSearch Hook - Manages online music search state and actions
 * Handles keyword search, adding to playlist, and playing search results
 * Uses Netease public API directly — no configuration needed
 */

import { useState, useCallback, useRef } from 'react';
import { usePlayerStore } from '../stores/playerStore';
import { getMusicSearchService } from '../services/musicSearchService';
import type { MusicSearchResult } from '../types';

// ============================================================================
// Hook Return Type
// ============================================================================

export interface UseMusicSearchReturn {
  /** Current search keyword */
  keyword: string;
  /** Update search keyword */
  setKeyword: (keyword: string) => void;
  /** Search results */
  results: MusicSearchResult[];
  /** Whether a search is in progress */
  isSearching: boolean;
  /** Whether a random play is in progress */
  isRandomPlaying: boolean;
  /** Error message if search failed */
  error: string | null;
  /** Execute search with current keyword */
  search: (keyword?: string) => Promise<void>;
  /** Add a search result to the playlist */
  addToPlaylist: (result: MusicSearchResult) => Promise<void>;
  /** Add a search result and immediately play it */
  playNow: (result: MusicSearchResult) => Promise<void>;
  /** Clear search results and keyword */
  clearResults: () => void;
  /** Play a random song (随心听) */
  randomPlay: () => Promise<void>;
}

// ============================================================================
// Hook Implementation
// ============================================================================

export function useMusicSearch(): UseMusicSearchReturn {
  const addToPlaylistBatch = usePlayerStore((s) => s.addToPlaylistBatch);
  const setCurrentTrack = usePlayerStore((s) => s.setCurrentTrack);
  const play = usePlayerStore((s) => s.play);
  const playlist = usePlayerStore((s) => s.playlist);
  const setPlaylist = usePlayerStore((s) => s.setPlaylist);

  const [keyword, setKeyword] = useState('');
  const [results, setResults] = useState<MusicSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isRandomPlaying, setIsRandomPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Track ongoing operations to prevent duplicates
  const operationRef = useRef<Set<number>>(new Set());

  const getService = useCallback(() => {
    return getMusicSearchService();
  }, []);

  const search = useCallback(async (searchKeyword?: string) => {
    const kw = searchKeyword ?? keyword;
    if (!kw.trim()) return;

    setIsSearching(true);
    setError(null);

    try {
      const service = getService();
      const searchResults = await service.search(kw.trim());
      setResults(searchResults);
      if (searchResults.length === 0) {
        setError('未找到相关歌曲');
      }
    } catch (err: any) {
      setError(err.message || '搜索失败');
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [keyword, getService]);

  const addToPlaylist = useCallback(async (result: MusicSearchResult) => {
    // Prevent duplicate operations for the same song
    if (operationRef.current.has(result.id)) return;
    operationRef.current.add(result.id);

    try {
      const service = getService();
      const track = await service.searchResultToTrack(result);
      const trackWithCover = await service.ensureTrackAlbumCover(track, result.id);
      addToPlaylistBatch([trackWithCover]);
    } catch (err: any) {
      setError(err.message || '添加失败');
    } finally {
      operationRef.current.delete(result.id);
    }
  }, [getService, addToPlaylistBatch]);

  const playNow = useCallback(async (result: MusicSearchResult) => {
    if (operationRef.current.has(result.id)) return;
    operationRef.current.add(result.id);

    try {
      const service = getService();
      const track = await service.searchResultToTrack(result);
      const trackWithCover = await service.ensureTrackAlbumCover(track, result.id);

      // Add to playlist if not already there, then play
      const newPlaylist = [...playlist, trackWithCover];
      const newIndex = newPlaylist.length - 1;
      setPlaylist(newPlaylist);
      setCurrentTrack(trackWithCover, newIndex);

      // Small delay to ensure track is loaded before playing
      setTimeout(() => {
        play();
      }, 100);
    } catch (err: any) {
      setError(err.message || '播放失败');
    } finally {
      operationRef.current.delete(result.id);
    }
  }, [getService, playlist, setPlaylist, setCurrentTrack, play]);

  const clearResults = useCallback(() => {
    setKeyword('');
    setResults([]);
    setError(null);
  }, []);

  const randomPlay = useCallback(async () => {
    // Prevent duplicate random play operations
    if (isRandomPlaying) return;

    setIsRandomPlaying(true);
    setError(null);

    try {
      const service = getService();
      const track = await service.getRandomSong();

      // Add to playlist if not already there, then play
      const newPlaylist = [...playlist, track];
      const newIndex = newPlaylist.length - 1;
      setPlaylist(newPlaylist);
      setCurrentTrack(track, newIndex);

      // Small delay to ensure track is loaded before playing
      setTimeout(() => {
        play();
      }, 100);
    } catch (err: any) {
      setError(err.message || '随机播放失败');
    } finally {
      setIsRandomPlaying(false);
    }
  }, [isRandomPlaying, getService, playlist, setPlaylist, setCurrentTrack, play]);

  return {
    keyword,
    setKeyword,
    results,
    isSearching,
    isRandomPlaying,
    error,
    search,
    addToPlaylist,
    playNow,
    clearResults,
    randomPlay,
  };
}

/**
 * MusicSearchPanel Component - Online music search panel
 * Allows users to search for music online and add/play results
 * Uses Netease Music public API directly — no configuration needed
 */

import { useState, useCallback, type FormEvent, type KeyboardEvent } from 'react';
import { useMusicSearch } from '../../hooks/useMusicSearch';
import type { MusicSearchResult } from '../../types';
import styles from './MusicSearchPanel.module.css';

// ============================================================================
// Utility
// ============================================================================

function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Check if a song is VIP only
 * fee: 0=free, 1=VIP required, 8=free low quality
 */
function isVipSong(fee?: number): boolean {
  return fee === 1;
}

// ============================================================================
// Component
// ============================================================================

export interface MusicSearchPanelProps {
  className?: string;
}

export function MusicSearchPanel({ className }: MusicSearchPanelProps) {
  const {
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
  } = useMusicSearch();

  const [loadingId, setLoadingId] = useState<number | null>(null);

  const handleSearch = useCallback((e?: FormEvent) => {
    e?.preventDefault();
    if (keyword.trim()) {
      search();
    }
  }, [keyword, search]);

  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  }, [handleSearch]);

  const handleAdd = useCallback(async (result: MusicSearchResult) => {
    if (isVipSong(result.fee)) {
      return; // VIP歌曲不允许操作
    }
    setLoadingId(result.id);
    try {
      await addToPlaylist(result);
    } finally {
      setLoadingId(null);
    }
  }, [addToPlaylist]);

  const handlePlay = useCallback(async (result: MusicSearchResult) => {
    if (isVipSong(result.fee)) {
      return; // VIP歌曲不允许操作
    }
    setLoadingId(result.id);
    try {
      await playNow(result);
    } finally {
      setLoadingId(null);
    }
  }, [playNow]);

  return (
    <div className={`${styles.searchPanel} ${className ?? ''}`}>
      {/* Search Bar */}
      <form className={styles.searchBar} onSubmit={handleSearch}>
        <input
          type="text"
          className={styles.searchInput}
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="搜索歌曲、歌手..."
          disabled={isSearching}
        />
        <button
          type="submit"
          className={styles.searchButton}
          disabled={isSearching || !keyword.trim()}
        >
          {isSearching ? '...' : '搜索'}
        </button>
        <button
          type="button"
          className={styles.randomPlayButton}
          onClick={randomPlay}
          disabled={isRandomPlaying}
          title="随机播放一首在线歌曲"
        >
          <span className={styles.randomPlayIcon}>
            {isRandomPlaying ? (
              <svg viewBox="0 0 24 24" fill="currentColor" className={styles.spinIcon}>
                <path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z"/>
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
              </svg>
            )}
          </span>
          <span className={styles.randomPlayText}>随心听</span>
        </button>
        {results.length > 0 && (
          <button
            type="button"
            className={styles.clearButton}
            onClick={clearResults}
          >
            清除
          </button>
        )}
      </form>

      {/* Error Message */}
      {error && (
        <div className={styles.errorMessage}>{error}</div>
      )}

      {/* Results List */}
      {results.length > 0 && (
        <ul className={styles.resultsList}>
          {results.map((result) => {
            const isVip = isVipSong(result.fee);
            return (
              <li
                key={result.id}
                className={`${styles.resultItem} ${isVip ? styles.vipItem : ''}`}
              >
                <div className={styles.resultInfo}>
                  <span className={styles.resultName}>
                    {result.name}
                    {isVip && <span className={styles.vipTag}>VIP</span>}
                  </span>
                  <span className={styles.resultMeta}>
                    {result.artist}
                    {result.album ? ` · ${result.album}` : ''}
                    {result.duration > 0 ? ` · ${formatDuration(result.duration)}` : ''}
                  </span>
                </div>
                <div className={styles.resultActions}>
                  {isVip ? (
                    <span className={styles.vipHint}>会员专享</span>
                  ) : (
                    <>
                      <button
                        className={styles.actionButton}
                        onClick={() => handlePlay(result)}
                        disabled={loadingId === result.id}
                        title="立即播放"
                      >
                        ▶
                      </button>
                      <button
                        className={styles.actionButton}
                        onClick={() => handleAdd(result)}
                        disabled={loadingId === result.id}
                        title="添加到播放列表"
                      >
                        +
                      </button>
                    </>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {/* Loading indicator */}
      {isSearching && (
        <div className={styles.loading}>搜索中...</div>
      )}
    </div>
  );
}

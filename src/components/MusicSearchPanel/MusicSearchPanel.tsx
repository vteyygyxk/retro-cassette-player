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
    error,
    search,
    addToPlaylist,
    playNow,
    clearResults,
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

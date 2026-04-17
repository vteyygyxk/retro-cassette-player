/**
 * LyricsDisplay Component - Shows synced lyrics in LED style
 * Displays current and surrounding lyric lines with time-synced highlighting
 */

import { useRef, useEffect } from 'react';
import type { LyricLine } from '../../types';
import styles from './LyricsDisplay.module.css';

export interface LyricsDisplayProps {
  /** Parsed lyric lines */
  lines: LyricLine[];
  /** Index of the currently active line */
  currentLineIndex: number;
  /** Whether an online search is in progress */
  isSearching?: boolean;
  /** Whether auto-search was attempted and failed */
  autoSearchFailed?: boolean;
  /** Callback to trigger online search */
  onSearch?: () => void;
  /** Callback to load a local LRC file */
  onLoadLocal?: () => void;
  /** Additional CSS class */
  className?: string;
}

export function LyricsDisplay({
  lines,
  currentLineIndex,
  isSearching = false,
  autoSearchFailed = false,
  onSearch,
  onLoadLocal,
  className,
}: LyricsDisplayProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const activeLineRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to active line
  useEffect(() => {
    if (activeLineRef.current && containerRef.current) {
      const container = containerRef.current;
      const active = activeLineRef.current;
      const containerHeight = container.clientHeight;
      const activeTop = active.offsetTop;
      const activeHeight = active.clientHeight;

      container.scrollTop = activeTop - containerHeight / 2 + activeHeight / 2;
    }
  }, [currentLineIndex]);

  // No lyrics loaded
  if (lines.length === 0) {
    // Currently auto-searching
    if (isSearching) {
      return (
        <div className={`${styles.lyricsSection} ${className ?? ''}`} data-testid="lyrics-display">
          <div className={styles.noLyrics}>
            <span className={styles.noLyricsText}>♪ 搜索歌词中...</span>
          </div>
        </div>
      );
    }

    // Auto-search failed — show manual options
    if (autoSearchFailed) {
      return (
        <div className={`${styles.lyricsSection} ${className ?? ''}`} data-testid="lyrics-display">
          <div className={styles.noLyrics}>
            <span className={styles.noLyricsText}>♪ 未找到歌词</span>
            <div className={styles.lyricsActions}>
              {onLoadLocal && (
                <button
                  className={styles.lyricsAction}
                  onClick={onLoadLocal}
                  aria-label="加载本地歌词文件"
                  title="加载本地 .lrc 文件"
                >
                  文件
                </button>
              )}
              {onSearch && (
                <button
                  className={styles.lyricsAction}
                  onClick={onSearch}
                  aria-label="重新搜索歌词"
                  title="重新在线搜索歌词"
                >
                  搜索
                </button>
              )}
            </div>
          </div>
        </div>
      );
    }

    // Fallback (shouldn't normally reach here)
    return null;
  }

  // Determine visible window (show ~3 lines centered on current)
  const windowSize = 3;
  const halfWindow = Math.floor(windowSize / 2);
  const startIdx = Math.max(0, currentLineIndex - halfWindow);
  const endIdx = Math.min(lines.length, startIdx + windowSize);
  const adjustedStart = Math.max(0, endIdx - windowSize);
  const visibleLines = lines.slice(adjustedStart, adjustedStart + windowSize);

  return (
    <div
      className={`${styles.lyricsSection} ${className ?? ''}`}
      data-testid="lyrics-display"
      ref={containerRef}
    >
      <div className={styles.lyricsWindow}>
        {visibleLines.map((line, i) => {
          const globalIdx = adjustedStart + i;
          const isActive = globalIdx === currentLineIndex;
          const isPast = globalIdx < currentLineIndex;

          return (
            <div
              key={globalIdx}
              ref={isActive ? activeLineRef : undefined}
              className={`${styles.lyricLine} ${isActive ? styles.activeLine : ''} ${isPast ? styles.pastLine : ''}`}
            >
              {line.text || '···'}
            </div>
          );
        })}
      </div>
    </div>
  );
}

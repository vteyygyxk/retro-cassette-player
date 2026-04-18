/**
 * LyricsPanel Component - Full-width lyrics display panel
 * Displays synced lyrics in a desktop music player style (similar to Kugou Music)
 *
 * Features:
 * - Large, readable lyrics display
 * - Smooth scrolling to current line
 * - Current line highlighted and enlarged
 * - Past lines dimmed
 * - Empty state with search/load options
 */

import { useRef, useEffect } from 'react';
import type { LyricLine } from '../../types';
import styles from './LyricsPanel.module.css';

export interface LyricsPanelProps {
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
  /** Current track name for display */
  trackName?: string;
  /** Current artist for display */
  artist?: string;
  /** Additional CSS class */
  className?: string;
}

export function LyricsPanel({
  lines,
  currentLineIndex,
  isSearching = false,
  autoSearchFailed = false,
  onSearch,
  onLoadLocal,
  trackName,
  artist,
  className,
}: LyricsPanelProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const activeLineRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to active line with smooth animation
  useEffect(() => {
    if (activeLineRef.current && containerRef.current) {
      const container = containerRef.current;
      const active = activeLineRef.current;
      const containerHeight = container.clientHeight;
      const activeTop = active.offsetTop;
      const activeHeight = active.clientHeight;

      // Scroll to center the active line
      container.scrollTo({
        top: activeTop - containerHeight / 2 + activeHeight / 2,
        behavior: 'smooth',
      });
    }
  }, [currentLineIndex]);

  // Render empty state
  if (lines.length === 0) {
    return (
      <div className={`${styles.lyricsPanel} ${styles.empty} ${className ?? ''}`}>
        <div className={styles.emptyContent}>
          {isSearching ? (
            <>
              <div className={styles.searchingIcon}>
                <span className={styles.musicNote}>♪</span>
                <span className={styles.dots}>
                  <span>.</span><span>.</span><span>.</span>
                </span>
              </div>
              <p className={styles.emptyText}>正在搜索歌词...</p>
            </>
          ) : autoSearchFailed ? (
            <>
              <div className={styles.emptyIcon}>♪</div>
              <p className={styles.emptyText}>暂无歌词</p>
              <div className={styles.emptyActions}>
                {onLoadLocal && (
                  <button
                    className={styles.actionButton}
                    onClick={onLoadLocal}
                    aria-label="加载本地歌词文件"
                  >
                    本地歌词
                  </button>
                )}
                {onSearch && (
                  <button
                    className={styles.actionButton}
                    onClick={onSearch}
                    aria-label="在线搜索歌词"
                  >
                    在线搜索
                  </button>
                )}
              </div>
            </>
          ) : (
            <>
              <div className={styles.emptyIcon}>♪</div>
              <p className={styles.emptyText}>
                {trackName ? `${trackName}${artist ? ` - ${artist}` : ''}` : '等待播放...'}
              </p>
            </>
          )}
        </div>
      </div>
    );
  }

  // Calculate visible window - show up to 7 lines
  const windowSize = 7;
  const halfWindow = Math.floor(windowSize / 2);
  const startIdx = Math.max(0, currentLineIndex - halfWindow);
  const endIdx = Math.min(lines.length, startIdx + windowSize);
  const adjustedStart = Math.max(0, endIdx - windowSize);
  const visibleLines = lines.slice(adjustedStart, adjustedStart + windowSize);

  return (
    <div className={`${styles.lyricsPanel} ${className ?? ''}`}>
      <div className={styles.header}>
        <span className={styles.headerIcon}>♪</span>
        <span className={styles.headerText}>
          {trackName || '歌词'}
          {artist && <span className={styles.headerArtist}> - {artist}</span>}
        </span>
      </div>
      <div className={styles.lyricsContainer} ref={containerRef}>
        <div className={styles.lyricsContent}>
          {/* Top padding for first lines */}
          {adjustedStart === 0 && <div className={styles.topPadding} />}

          {visibleLines.map((line, i) => {
            const globalIdx = adjustedStart + i;
            const isActive = globalIdx === currentLineIndex;
            const isPast = globalIdx < currentLineIndex;
            const distance = Math.abs(globalIdx - currentLineIndex);

            return (
              <div
                key={globalIdx}
                ref={isActive ? activeLineRef : undefined}
                className={`${styles.lyricLine} ${isActive ? styles.active : ''} ${isPast ? styles.past : ''}`}
                style={{
                  opacity: isActive ? 1 : Math.max(0.2, 1 - distance * 0.15),
                  transform: isActive ? 'scale(1.1)' : 'scale(1)',
                }}
              >
                {line.text || '···'}
              </div>
            );
          })}

          {/* Bottom padding for last lines */}
          {endIdx >= lines.length && <div className={styles.bottomPadding} />}
        </div>
      </div>
    </div>
  );
}

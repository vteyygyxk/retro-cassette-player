/**
 * LyricsPanel Component - Full-width lyrics display panel
 * 左右切换式歌词显示，类似酷狗音乐风格
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

  // 只显示当前行和下一行（共2行）
  const visibleLines = [];
  const currentLine = currentLineIndex >= 0 && currentLineIndex < lines.length ? lines[currentLineIndex] : null;
  const nextLine = currentLineIndex >= 0 && currentLineIndex < lines.length - 1 ? lines[currentLineIndex + 1] : null;

  if (currentLine) {
    visibleLines.push({ ...currentLine, index: currentLineIndex });
  }
  if (nextLine) {
    visibleLines.push({ ...nextLine, index: currentLineIndex + 1 });
  }

  // 动画效果 - 当前歌词切换时添加动画
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.classList.remove(styles.animate);
      void containerRef.current.offsetWidth; // 触发重排
      containerRef.current.classList.add(styles.animate);
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
          {visibleLines.map((line, i) => {
            const isActive = i === 0;
            return (
              <div
                key={`${line.index}-${currentLineIndex}`}
                className={`${styles.lyricLine} ${isActive ? styles.active : ''} ${i === 0 ? styles.leftLine : styles.rightLine}`}
              >
                {line.text || '···'}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

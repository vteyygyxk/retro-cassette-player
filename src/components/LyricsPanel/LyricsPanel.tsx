/**
 * LyricsPanel Component - Full-width lyrics display panel
 * 支持普通模式和卡拉OK模式，支持自定义颜色
 */

import { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import type { KeyboardEvent as ReactKeyboardEvent } from 'react';
import type { LyricLine } from '../../types';
import styles from './LyricsPanel.module.css';

// 预设颜色方案
const COLOR_PRESETS = [
  { name: '翠绿', primary: '#00ff99', secondary: '#00ffcc', glow: 'rgba(0, 255, 153, 0.6)' },
  { name: '霓虹粉', primary: '#ff6b9d', secondary: '#ff8fab', glow: 'rgba(255, 107, 157, 0.6)' },
  { name: '电光蓝', primary: '#00bfff', secondary: '#5fd4ff', glow: 'rgba(0, 191, 255, 0.6)' },
  { name: '日落橙', primary: '#ff9500', secondary: '#ffb347', glow: 'rgba(255, 149, 0, 0.6)' },
  { name: '梦幻紫', primary: '#bf7fff', secondary: '#d4a5ff', glow: 'rgba(191, 127, 255, 0.6)' },
  { name: '青柠黄', primary: '#c8ff00', secondary: '#ddff44', glow: 'rgba(200, 255, 0, 0.6)' },
];

const STORAGE_KEY = 'retro-player-lyrics-color';

// 从本地存储读取颜色设置
function loadColorPreset(): number {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved !== null) {
      const index = parseInt(saved, 10);
      if (index >= 0 && index < COLOR_PRESETS.length) {
        return index;
      }
    }
  } catch {}
  return 0;
}

// 保存颜色设置到本地存储
function saveColorPreset(index: number) {
  try {
    localStorage.setItem(STORAGE_KEY, index.toString());
  } catch {}
}

export interface LyricsPanelProps {
  /** Parsed lyric lines */
  lines: LyricLine[];
  /** Index of the currently active line */
  currentLineIndex: number;
  /** Current playback time in seconds */
  currentTime?: number;
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
  currentTime = 0,
  isSearching = false,
  autoSearchFailed = false,
  onSearch,
  onLoadLocal,
  trackName,
  artist,
  className,
}: LyricsPanelProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const colorPickerRef = useRef<HTMLDivElement>(null);
  const [karaokeMode, setKaraokeMode] = useState(true);
  const [colorIndex, setColorIndex] = useState(loadColorPreset);
  const [showColorPicker, setShowColorPicker] = useState(false);

  const currentColor = COLOR_PRESETS[colorIndex];

  // 点击外部关闭颜色选择器
  useEffect(() => {
    if (!showColorPicker) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (colorPickerRef.current && !colorPickerRef.current.contains(event.target as Node)) {
        setShowColorPicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showColorPicker]);

  // ESC键关闭颜色选择器
  const handleKeyDown = useCallback((e: ReactKeyboardEvent) => {
    if (e.key === 'Escape') {
      setShowColorPicker(false);
    }
  }, []);

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

  // 计算卡拉OK进度
  const karaokeProgress = useMemo(() => {
    if (!karaokeMode || currentLineIndex < 0 || currentLineIndex >= lines.length) {
      return 0;
    }

    const current = lines[currentLineIndex];
    const next = lines[currentLineIndex + 1];

    if (!current) return 0;

    const lineStartTime = current.time;
    const lineEndTime = next ? next.time : lineStartTime + 5;

    const progress = (currentTime - lineStartTime) / (lineEndTime - lineStartTime);
    return Math.max(0, Math.min(1, progress));
  }, [karaokeMode, currentLineIndex, lines, currentTime]);

  // 动画效果 - 当前歌词切换时添加动画
  useEffect(() => {
    if (containerRef.current && !karaokeMode) {
      containerRef.current.classList.remove(styles.animate);
      void containerRef.current.offsetWidth;
      containerRef.current.classList.add(styles.animate);
    }
  }, [currentLineIndex, karaokeMode]);

  // 切换卡拉OK模式
  const toggleKaraokeMode = () => {
    setKaraokeMode(prev => !prev);
  };

  // 切换颜色
  const handleColorChange = useCallback((index: number) => {
    setColorIndex(index);
    saveColorPreset(index);
    setShowColorPicker(false);
  }, []);

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
    <div className={`${styles.lyricsPanel} ${karaokeMode ? styles.karaokeMode : ''} ${className ?? ''}`}>
      <div className={styles.header}>
        <span className={styles.headerIcon}>♪</span>
        <span className={styles.headerText}>
          {trackName || '歌词'}
          {artist && <span className={styles.headerArtist}> - {artist}</span>}
        </span>

        {/* 颜色选择器 */}
        <div className={styles.colorPickerWrapper} ref={colorPickerRef} onKeyDown={handleKeyDown}>
          <button
            className={styles.colorButton}
            onClick={() => setShowColorPicker(prev => !prev)}
            title="更换歌词颜色"
            aria-label="更换歌词颜色"
            aria-expanded={showColorPicker}
          >
            <span
              className={styles.colorPreview}
              style={{ background: `linear-gradient(135deg, ${currentColor.primary}, ${currentColor.secondary})` }}
            />
          </button>
          {showColorPicker && (
            <div className={styles.colorPicker} role="listbox" aria-label="选择歌词颜色">
              <div className={styles.colorPickerTitle}>歌词颜色</div>
              <div className={styles.colorOptions}>
                {COLOR_PRESETS.map((preset, index) => (
                  <button
                    key={preset.name}
                    className={`${styles.colorOption} ${index === colorIndex ? styles.active : ''}`}
                    onClick={() => handleColorChange(index)}
                    title={preset.name}
                    aria-label={preset.name}
                    aria-selected={index === colorIndex}
                    role="option"
                    style={{ background: `linear-gradient(135deg, ${preset.primary}, ${preset.secondary})` }}
                  >
                    {index === colorIndex && <span className={styles.checkMark}>✓</span>}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <button
          className={`${styles.modeToggle} ${karaokeMode ? styles.active : ''}`}
          onClick={toggleKaraokeMode}
          title={karaokeMode ? '切换到普通模式' : '切换到卡拉OK模式'}
          aria-label={karaokeMode ? '切换到普通模式' : '切换到卡拉OK模式'}
        >
          <svg viewBox="0 0 24 24" className={styles.micIcon}>
            {/* 麦克风头部 */}
            <rect x="9" y="2" width="6" height="11" rx="3" fill="currentColor"/>
            {/* 麦克风网格线 */}
            <line x1="9.5" y1="5" x2="14.5" y2="5" stroke="rgba(255,255,255,0.3)" strokeWidth="0.5"/>
            <line x1="9.5" y1="7" x2="14.5" y2="7" stroke="rgba(255,255,255,0.3)" strokeWidth="0.5"/>
            <line x1="9.5" y1="9" x2="14.5" y2="9" stroke="rgba(255,255,255,0.3)" strokeWidth="0.5"/>
            <line x1="9.5" y1="11" x2="14.5" y2="11" stroke="rgba(255,255,255,0.3)" strokeWidth="0.5"/>
            {/* 麦克风支架弧线 */}
            <path d="M6 10v1c0 3.31 2.69 6 6 6s6-2.69 6-6v-1" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            {/* 麦克风底座 */}
            <line x1="12" y1="17" x2="12" y2="21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <line x1="9" y1="21" x2="15" y2="21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>
      </div>

      {karaokeMode ? (
        <div className={styles.karaokeContainer}>
          <div className={styles.karaokeMain}>
            <div className={styles.karaokeLineWrapper}>
              <div className={styles.karaokeLine}>
                <span className={styles.karaokeTextBase}>{currentLine?.text || '···'}</span>
                <span
                  className={styles.karaokeTextFilled}
                  style={{
                    clipPath: `inset(0 ${100 - karaokeProgress * 100}% 0 0)`,
                    color: currentColor.primary,
                    textShadow: `0 0 10px ${currentColor.glow}, 0 0 20px ${currentColor.glow}`,
                  }}
                >
                  {currentLine?.text || '···'}
                </span>
              </div>
            </div>
            {/* 底部进度条 */}
            <div className={styles.progressBar}>
              <div
                className={styles.progressFill}
                style={{
                  width: `${karaokeProgress * 100}%`,
                  background: `linear-gradient(90deg, ${currentColor.primary}, ${currentColor.secondary})`,
                  boxShadow: `0 0 8px ${currentColor.glow}`,
                }}
              />
            </div>
          </div>
          {/* 下一行预览 */}
          {nextLine && (
            <div className={styles.nextLine}>
              <span className={styles.nextLineText}>{nextLine.text}</span>
            </div>
          )}
        </div>
      ) : (
        <div className={styles.lyricsContainer} ref={containerRef}>
          <div className={styles.lyricsContent}>
            {visibleLines.map((line, i) => {
              const isActive = i === 0;
              return (
                <div
                  key={`${line.index}-${currentLineIndex}`}
                  className={`${styles.lyricLine} ${isActive ? styles.active : ''} ${i === 0 ? styles.leftLine : styles.rightLine}`}
                  style={isActive ? {
                    color: currentColor.primary,
                    textShadow: `0 0 8px ${currentColor.glow}, 0 0 20px ${currentColor.glow}`,
                  } : undefined}
                >
                  {line.text || '···'}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * TodayHitsPanel Component - 今日主打歌模块
 * 随机抓取10首歌，复古磁带风格展示
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { getMusicSearchService } from '../../services/musicSearchService';
import type { Track } from '../../types';
import styles from './TodayHitsPanel.module.css';

interface TodayHitsPanelProps {
  onTrackSelect: (track: Track) => void;
  currentTrackId?: string | null;
}

export function TodayHitsPanel({ onTrackSelect, currentTrackId }: TodayHitsPanelProps) {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasAutoPlayedRef = useRef(false);

  // 获取10首随机歌曲
  const fetchTodayHits = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    hasAutoPlayedRef.current = false; // 重置自动播放标记

    try {
      const service = getMusicSearchService();
      const hits: Track[] = [];

      // 并行获取10首随机歌曲
      const promises = Array.from({ length: 10 }, () => service.getRandomSong());
      const results = await Promise.allSettled(promises);

      results.forEach((result) => {
        if (result.status === 'fulfilled' && result.value) {
          hits.push(result.value);
        }
      });

      if (hits.length === 0) {
        setError('获取歌曲失败，请稍后重试');
      } else {
        setTracks(hits);
      }
    } catch (err: any) {
      setError(err.message || '获取歌曲失败');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 初始化时获取歌曲
  useEffect(() => {
    fetchTodayHits();
  }, [fetchTodayHits]);

  // 自动播放第一首（仅首次加载时）
  useEffect(() => {
    if (tracks.length > 0 && !hasAutoPlayedRef.current) {
      hasAutoPlayedRef.current = true;
      // 延迟一下确保状态已更新
      setTimeout(() => {
        onTrackSelect(tracks[0]);
      }, 100);
    }
  }, [tracks, onTrackSelect]);

  if (isLoading) {
    return (
      <div className={styles.panel}>
        <div className={styles.header}>
          <div className={styles.headerIcon}>♫</div>
          <div className={styles.headerTitle}>今日主打歌</div>
        </div>
        <div className={styles.loading}>
          <div className={styles.loadingSpinner}></div>
          <span>正在加载今日主打...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.panel}>
        <div className={styles.header}>
          <div className={styles.headerIcon}>♫</div>
          <div className={styles.headerTitle}>今日主打歌</div>
        </div>
        <div className={styles.error}>
          <span>{error}</span>
          <button onClick={fetchTodayHits} className={styles.retryButton}>
            重试
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.panel}>
      {/* 标题区域 - 磁带标签风格 */}
      <div className={styles.header}>
        <div className={styles.headerIcon}>♫</div>
        <div className={styles.headerTitle}>今日主打歌</div>
        <div className={styles.headerDate}>
          {new Date().toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })}
        </div>
      </div>

      {/* 歌曲列表 */}
      <div className={styles.trackList}>
        {tracks.map((track, index) => {
          const isTop3 = index < 3;
          const isTop1 = index === 0;
          const isActive = currentTrackId === track.id;

          return (
            <div
              key={`${track.id}-${index}`}
              className={`${styles.trackItem} ${isTop1 ? styles.trackItemTop1 : ''} ${isTop3 ? styles.trackItemTop3 : ''} ${isActive ? styles.trackItemActive : ''}`}
              onClick={() => onTrackSelect(track)}
              role="button"
              tabIndex={0}
              aria-label={`播放 ${track.name} - ${track.artist}`}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  onTrackSelect(track);
                }
              }}
            >
              {/* 排名标识 */}
              <div className={`${styles.rankBadge} ${isTop1 ? styles.rankBadgeTop1 : ''}`}>
                {isTop3 ? (
                  <span className={styles.rankNumber}>TOP{index + 1}</span>
                ) : (
                  <span className={styles.rankIndex}>{index + 1}</span>
                )}
              </div>

              {/* 歌曲信息 */}
              <div className={styles.trackInfo}>
                <div className={styles.trackName}>{track.name}</div>
                <div className={styles.trackArtist}>{track.artist || '未知艺术家'}</div>
              </div>

              {/* TOP1 特殊装饰 */}
              {isTop1 && (
                <div className={styles.top1Decoration}>
                  <span className={styles.top1Crown}>👑</span>
                </div>
              )}

              {/* 播放指示器 */}
              {isActive && (
                <div className={styles.playingIndicator}>
                  <span className={styles.playingIcon}>▶</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 刷新按钮 */}
      <div className={styles.footer}>
        <button onClick={fetchTodayHits} className={styles.refreshButton}>
          <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
            <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
          </svg>
          <span>换一批</span>
        </button>
      </div>
    </div>
  );
}

export default TodayHitsPanel;

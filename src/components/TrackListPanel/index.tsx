import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import type { Track } from '../../types';
import styles from './TrackListPanel.module.css';

interface TrackAction {
  label: string;
  ariaLabel: string;
  onClick: (track: Track, index: number) => void;
  active?: boolean;
}

interface TrackListPanelProps {
  title: string;
  tracks: Track[];
  isExpanded: boolean;
  emptyMessage: string;
  emptyHint?: string;
  onToggleExpand: () => void;
  onTrackClick: (track: Track, index: number) => void;
  getAction?: (track: Track, index: number) => TrackAction | null;
  getSwipeAction?: (track: Track, index: number) => TrackAction | null;
  activeTrackId?: string | null;
  panelTestId?: string;
  toggleTestId?: string;
  className?: string;
}

export function TrackListPanel({
  title,
  tracks,
  isExpanded,
  emptyMessage,
  emptyHint,
  onToggleExpand,
  onTrackClick,
  getAction,
  getSwipeAction,
  activeTrackId,
  panelTestId = 'track-list-panel',
  toggleTestId = 'track-list-toggle',
  className,
}: TrackListPanelProps) {
  const [openSwipeIndex, setOpenSwipeIndex] = useState<number | null>(null);
  const [dragState, setDragState] = useState<{
    index: number;
    startX: number;
    offset: number;
  } | null>(null);
  const [showScrollHint, setShowScrollHint] = useState(false);
  const listRef = useRef<HTMLUListElement>(null);

  const MAX_VISIBLE_TRACKS = 5;

  // Check if scroll hint should be shown
  useEffect(() => {
    const listElement = listRef.current;
    if (!listElement) {
      setShowScrollHint(false);
      return;
    }

    const checkScroll = () => {
      if (tracks.length <= MAX_VISIBLE_TRACKS) {
        setShowScrollHint(false);
        return;
      }

      const { scrollTop, scrollHeight, clientHeight } = listElement;
      const isAtBottom = scrollTop + clientHeight >= scrollHeight - 10;
      setShowScrollHint(!isAtBottom);
    };

    // Initial check
    checkScroll();

    // Add scroll listener
    listElement.addEventListener('scroll', checkScroll);
    return () => listElement.removeEventListener('scroll', checkScroll);
  }, [tracks.length, isExpanded]);

  const remainingCount = Math.max(0, tracks.length - MAX_VISIBLE_TRACKS);

  return (
    <div
      className={`${styles.panel} ${className ?? ''}`}
      data-testid={panelTestId}
      role="region"
      aria-label={title}
    >
      <button
        className={styles.header}
        onClick={onToggleExpand}
        aria-expanded={isExpanded}
        aria-controls={`${toggleTestId}-content`}
        data-testid={toggleTestId}
      >
        <span className={styles.headerIcon}>{isExpanded ? '▼' : '▶'}</span>
        <span className={styles.headerTitle}>
          {title} ({tracks.length})
        </span>
      </button>

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            id={`${toggleTestId}-content`}
            className={styles.content}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            role="list"
            aria-label={`${title}曲目列表`}
          >
            {tracks.length === 0 ? (
              <div className={styles.empty} data-testid={`${panelTestId}-empty`}>
                <p>{emptyMessage}</p>
                {emptyHint ? <p className={styles.emptyHint}>{emptyHint}</p> : null}
              </div>
            ) : (
              <ul className={styles.trackList} ref={listRef}>
                {tracks.map((track, index) => {
                  const action = getAction?.(track, index) ?? null;
                  const swipeAction = getSwipeAction?.(track, index) ?? null;
                  const isActive = activeTrackId === track.id;
                  const displayArtist = track.artist || '未知艺术家';
                  const isSwipeOpen = openSwipeIndex === index;
                  const dragOffset = dragState?.index === index ? dragState.offset : null;
                  const swipeOffset = dragOffset ?? (isSwipeOpen ? -56 : 0);
                  const showSwipeAction = Boolean(
                    swipeAction && (isSwipeOpen || (dragOffset !== null && dragOffset < 0))
                  );

                  return (
                    <li
                      key={track.id}
                      className={`${styles.trackItem} ${isActive ? styles.trackItemActive : ''}`}
                      role="listitem"
                      aria-current={isActive ? 'true' : undefined}
                      data-testid={`${panelTestId}-track-${index}`}
                      data-active={isActive}
                      data-swipe-open={isSwipeOpen}
                      onPointerDown={(event) => {
                        if (!swipeAction) return;
                        if (event.pointerType === 'mouse' && event.button !== 0) return;
                        setDragState({
                          index,
                          startX: event.clientX,
                          offset: isSwipeOpen ? -56 : 0,
                        });
                      }}
                      onPointerMove={(event) => {
                        if (!swipeAction) return;
                        if (!dragState || dragState.index !== index) return;
                        const deltaX = event.clientX - dragState.startX;
                        const nextOffset = Math.max(-56, Math.min(0, (isSwipeOpen ? -56 : 0) + deltaX));
                        setDragState({
                          index,
                          startX: dragState.startX,
                          offset: nextOffset,
                        });
                      }}
                      onPointerUp={() => {
                        if (!swipeAction) return;
                        if (!dragState || dragState.index !== index) return;
                        // Swipe far enough to delete directly
                        if (dragState.offset <= -48) {
                          swipeAction.onClick(track, index);
                          setOpenSwipeIndex(null);
                        } else {
                          const shouldOpen = Math.abs(dragState.offset) >= 32;
                          setOpenSwipeIndex(shouldOpen ? index : null);
                        }
                        setDragState(null);
                      }}
                      onPointerLeave={() => {
                        if (!swipeAction) return;
                        if (!dragState || dragState.index !== index) return;
                        // Swipe far enough to delete directly
                        if (dragState.offset <= -48) {
                          swipeAction.onClick(track, index);
                          setOpenSwipeIndex(null);
                        } else {
                          const shouldOpen = Math.abs(dragState.offset) >= 32;
                          setOpenSwipeIndex(shouldOpen ? index : null);
                        }
                        setDragState(null);
                      }}
                    >
                      {showSwipeAction && swipeAction ? (
                        <button
                          type="button"
                          className={styles.swipeActionButton}
                          aria-label={swipeAction.ariaLabel}
                          onClick={(event) => {
                            event.stopPropagation();
                            swipeAction.onClick(track, index);
                            setOpenSwipeIndex(null);
                          }}
                        >
                          {swipeAction.label}
                        </button>
                      ) : null}

                      <div
                        className={styles.swipeForeground}
                        style={{ transform: `translateX(${swipeOffset}px)` }}
                      >
                        <button
                          className={styles.trackButton}
                          onClick={() => {
                            setOpenSwipeIndex(null);
                            onTrackClick(track, index);
                          }}
                          aria-label={`播放 ${track.name}`}
                          tabIndex={0}
                        >
                          <span className={styles.trackNumber}>
                            {isActive ? (
                              <span className={styles.playingIcon} aria-hidden="true">▶</span>
                            ) : (
                              index + 1
                            )}
                          </span>
                          <span className={styles.trackInfo}>
                            <span className={styles.trackName}>{track.name}</span>
                            <span className={styles.trackArtist}>{displayArtist}</span>
                          </span>
                          <span className={styles.trackDuration}>{formatDuration(track.duration)}</span>
                        </button>

                        {action ? (
                          <button
                            type="button"
                            className={`${styles.actionButton} ${action.active ? styles.actionButtonActive : ''}`}
                            aria-label={action.ariaLabel}
                            onClick={(event) => {
                              event.stopPropagation();
                              action.onClick(track, index);
                            }}
                          >
                            {action.label}
                          </button>
                        ) : null}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
            {showScrollHint && tracks.length > 0 && (
              <div className={styles.scrollHint} aria-hidden="true">
                <span className={styles.scrollHintIcon}>↓</span>
                <span className={styles.scrollHintText}>还有 {remainingCount} 首，滚动查看</span>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function formatDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return '--:--';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export default TrackListPanel;

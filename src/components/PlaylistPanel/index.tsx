import type { PlaylistPanelProps } from '../../types';
import { TrackListPanel } from '../TrackListPanel';

/**
 * PlaylistPanel - Expandable playlist panel component
 *
 * @param props - Component props
 * @returns The PlaylistPanel component
 */
export function PlaylistPanel({
  playlist,
  currentTrackIndex,
  isExpanded,
  favoriteTrackIds,
  onTrackSelect,
  onToggleFavorite,
  onRemoveTrack,
  onToggleExpand,
  className,
}: PlaylistPanelProps) {
  return (
    <TrackListPanel
      title="播放列表"
      tracks={playlist}
      isExpanded={isExpanded}
      emptyMessage="播放列表为空"
      emptyHint="拖放音频文件到播放器以添加曲目"
      onToggleExpand={onToggleExpand}
      onTrackClick={(_, index) => onTrackSelect(index)}
      getAction={(track) => {
        const isFavorite = favoriteTrackIds.includes(track.id);

        return {
          label: isFavorite ? '♥' : '♡',
          ariaLabel: `${isFavorite ? '取消收藏' : '收藏'} ${track.name}`,
          onClick: (selectedTrack) => onToggleFavorite(selectedTrack),
          active: isFavorite,
        };
      }}
      getSwipeAction={(track, index) => ({
        label: '🗑',
        ariaLabel: `删除 ${track.name}`,
        onClick: () => onRemoveTrack(index),
      })}
      activeTrackId={playlist[currentTrackIndex]?.id ?? null}
      panelTestId="playlist-panel"
      toggleTestId="playlist-toggle"
      className={className}
    />
  );
}

export default PlaylistPanel;

import type { FavoritesPanelProps } from '../../types';
import { TrackListPanel } from '../TrackListPanel';

export function FavoritesPanel({
  favorites,
  isExpanded,
  onToggleExpand,
  onTrackSelect,
  onRemoveFavorite,
  className,
}: FavoritesPanelProps) {
  return (
    <TrackListPanel
      title="收藏列表"
      tracks={favorites}
      isExpanded={isExpanded}
      emptyMessage="暂无收藏歌曲"
      emptyHint="在播放列表中点击收藏后会显示在这里"
      onToggleExpand={onToggleExpand}
      onTrackClick={(track) => onTrackSelect(track)}
      getAction={(track) => ({
        label: '♥',
        ariaLabel: `取消收藏 ${track.name}`,
        onClick: (selectedTrack) => onRemoveFavorite(selectedTrack),
        active: true,
      })}
      panelTestId="favorites-panel"
      toggleTestId="favorites-toggle"
      className={className}
    />
  );
}

export default FavoritesPanel;

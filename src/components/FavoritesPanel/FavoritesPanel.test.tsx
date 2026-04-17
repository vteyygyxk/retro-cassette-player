import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { FavoritesPanel } from './index';

const favorites = [
  {
    id: 'fav-1',
    name: 'Favorite One',
    artist: 'Artist A',
    duration: 200,
    audioUrl: 'fav-url-1',
  },
];

describe('FavoritesPanel', () => {
  it('renders favorites title and count', () => {
    render(
      <FavoritesPanel
        favorites={favorites}
        isExpanded={true}
        onToggleExpand={vi.fn()}
        onTrackSelect={vi.fn()}
        onRemoveFavorite={vi.fn()}
      />
    );

    expect(screen.getByText('收藏列表 (1)')).toBeInTheDocument();
  });

  it('renders an empty message when no favorites exist', () => {
    render(
      <FavoritesPanel
        favorites={[]}
        isExpanded={true}
        onToggleExpand={vi.fn()}
        onTrackSelect={vi.fn()}
        onRemoveFavorite={vi.fn()}
      />
    );

    expect(screen.getByText('暂无收藏歌曲')).toBeInTheDocument();
  });

  it('calls onTrackSelect when a favorite row is clicked', () => {
    const onTrackSelect = vi.fn();

    render(
      <FavoritesPanel
        favorites={favorites}
        isExpanded={true}
        onToggleExpand={vi.fn()}
        onTrackSelect={onTrackSelect}
        onRemoveFavorite={vi.fn()}
      />
    );

    fireEvent.click(screen.getByLabelText('播放 Favorite One'));
    expect(onTrackSelect).toHaveBeenCalledWith(favorites[0]);
  });

  it('calls onRemoveFavorite when the trailing action is clicked', () => {
    const onRemoveFavorite = vi.fn();

    render(
      <FavoritesPanel
        favorites={favorites}
        isExpanded={true}
        onToggleExpand={vi.fn()}
        onTrackSelect={vi.fn()}
        onRemoveFavorite={onRemoveFavorite}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: '取消收藏 Favorite One' }));
    expect(onRemoveFavorite).toHaveBeenCalledWith(favorites[0]);
    expect(screen.getByText('♥')).toBeInTheDocument();
  });
});

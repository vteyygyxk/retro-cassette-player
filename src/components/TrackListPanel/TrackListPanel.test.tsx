import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { TrackListPanel } from './index';

const tracks = [
  {
    id: '1',
    name: 'Track One',
    artist: 'Artist A',
    duration: 180,
    audioUrl: 'url-1',
  },
  {
    id: '2',
    name: 'Track Two',
    artist: 'Artist B',
    duration: 240,
    audioUrl: 'url-2',
  },
];

describe('TrackListPanel', () => {
  it('renders the title with count', () => {
    render(
      <TrackListPanel
        title="收藏列表"
        tracks={tracks}
        isExpanded={true}
        emptyMessage="empty"
        onToggleExpand={vi.fn()}
        onTrackClick={vi.fn()}
      />
    );

    expect(screen.getByText('收藏列表 (2)')).toBeInTheDocument();
  });

  it('calls onToggleExpand from the header button', () => {
    const onToggleExpand = vi.fn();

    render(
      <TrackListPanel
        title="收藏列表"
        tracks={tracks}
        isExpanded={true}
        emptyMessage="empty"
        onToggleExpand={onToggleExpand}
        onTrackClick={vi.fn()}
      />
    );

    fireEvent.click(screen.getByTestId('track-list-toggle'));
    expect(onToggleExpand).toHaveBeenCalledTimes(1);
  });

  it('renders empty state when no tracks exist', () => {
    render(
      <TrackListPanel
        title="收藏列表"
        tracks={[]}
        isExpanded={true}
        emptyMessage="暂无收藏歌曲"
        onToggleExpand={vi.fn()}
        onTrackClick={vi.fn()}
      />
    );

    expect(screen.getByText('暂无收藏歌曲')).toBeInTheDocument();
  });

  it('calls the primary track action when a row is clicked', () => {
    const onTrackClick = vi.fn();

    render(
      <TrackListPanel
        title="收藏列表"
        tracks={tracks}
        isExpanded={true}
        emptyMessage="empty"
        onToggleExpand={vi.fn()}
        onTrackClick={onTrackClick}
      />
    );

    fireEvent.click(screen.getByLabelText('播放 Track Two'));
    expect(onTrackClick).toHaveBeenCalledWith(tracks[1], 1);
  });

  it('calls trailing action without triggering the primary click action', () => {
    const onTrackClick = vi.fn();
    const onActionClick = vi.fn();

    render(
      <TrackListPanel
        title="收藏列表"
        tracks={tracks}
        isExpanded={true}
        emptyMessage="empty"
        onToggleExpand={vi.fn()}
        onTrackClick={onTrackClick}
        getAction={(track) => ({
          label: track.id === '2' ? '♥' : '♡',
          ariaLabel: `操作 ${track.name}`,
          onClick: onActionClick,
        })}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: '操作 Track Two' }));
    expect(onActionClick).toHaveBeenCalledWith(tracks[1], 1);
    expect(onTrackClick).not.toHaveBeenCalled();
  });
});

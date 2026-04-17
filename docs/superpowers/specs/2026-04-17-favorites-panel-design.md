# Favorites Panel Design

## Goal

Add a collapsible favorites list below the playlist so favorited tracks are visible, can be expanded or collapsed independently, and can be played directly from the favorites list.

## Scope

- Keep favorites as a standalone collection in the Zustand store.
- Render a favorites panel under the playlist in the right column.
- Make favorites list items playable:
  - If the track is already in the playlist, play that playlist entry.
  - If the track is not in the playlist, append it and then play it.
- Keep unfavorite behavior separate from playlist deletion.

## Architecture

Introduce a reusable `TrackListPanel` component that owns collapsible panel rendering, empty state rendering, and track item layout. `PlaylistPanel` and a new `FavoritesPanel` become thin wrappers that translate domain-specific behavior into the generic panel API.

`TapePlayer` remains the orchestration layer for cross-list behavior. It provides the playlist panel with favorite toggles and provides the favorites panel with "play-or-append-and-play" behavior so the generic panel does not need to know about playlist mutation rules.

## Components

### `TrackListPanel`

Responsibilities:

- Render panel header with title and count.
- Render expand/collapse animation.
- Render empty state copy.
- Render track rows with:
  - active state
  - primary click action
  - optional trailing action button

Non-responsibilities:

- Determining what a click means
- Determining whether a track is favorite
- Mutating playlist or favorites

### `PlaylistPanel`

Responsibilities:

- Adapt playlist data to `TrackListPanel`
- Highlight current track
- Show trailing favorite toggle button
- Keep existing playlist semantics unchanged

### `FavoritesPanel`

Responsibilities:

- Adapt favorites data to `TrackListPanel`
- Show trailing unfavorite button
- Surface item click events to `TapePlayer`

## Store Changes

Add UI state for the favorites panel:

- `isFavoritesExpanded: boolean`
- `toggleFavoritesExpanded(): void`
- `setFavoritesExpanded(expanded: boolean): void`

Keep `favorites: Track[]` persisted. Keep expand/collapse state as UI state only.

## Data Flow

### Favorite toggle from playlist

1. User clicks the trailing action in the playlist row.
2. `PlaylistPanel` emits `onToggleFavorite(track)`.
3. `TapePlayer` calls the existing store toggle.
4. `favorites` updates and the favorites panel re-renders.

### Play from favorites

1. User clicks a favorite row.
2. `FavoritesPanel` emits `onTrackSelect(track)`.
3. `TapePlayer` checks the current playlist for `track.id`.
4. If found, `selectTrack(existingIndex)` is called.
5. If missing, `setPlaylist([...playlist, track])` is called and then the new track is selected for playback.

## Error Handling

- Duplicate favorites remain ignored by store logic.
- Playing from favorites must not remove or reorder existing playlist entries.
- Unfavoriting the currently playing track must not stop playback.

## Testing

- Store tests for `isFavoritesExpanded` toggling and persisted favorites recovery.
- `TrackListPanel` tests for collapse, empty state, primary action, and trailing action.
- `FavoritesPanel` tests for title/count, empty state, and unfavorite action.
- `TapePlayer` integration test for clicking a favorite that is not yet in the playlist and verifying it becomes playable.

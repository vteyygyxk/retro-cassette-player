# Favorites Panel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a collapsible favorites list below the playlist and allow favorited tracks to be played directly from that list.

**Architecture:** Extract a generic collapsible track-list panel, then wrap it with playlist-specific and favorites-specific components. Keep cross-list playback rules inside `TapePlayer`, while the Zustand store continues owning favorites data and gains favorites-panel UI state.

**Tech Stack:** React 19, TypeScript, Zustand, Vitest, Testing Library, CSS Modules, Framer Motion

---

### Task 1: Favorites UI State

**Files:**
- Modify: `src/types/index.ts`
- Modify: `src/stores/playerStore.ts`
- Modify: `src/stores/playerStore.test.ts`

- [ ] **Step 1: Write the failing test**

Add tests asserting `isFavoritesExpanded` defaults to `true` and can be toggled.

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/stores/playerStore.test.ts`
Expected: FAIL because `isFavoritesExpanded` and toggle actions do not exist.

- [ ] **Step 3: Write minimal implementation**

Add the state and actions to `PlayerState`/store, wire default `true`, and expose the actions.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/stores/playerStore.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

Skip commit if repository metadata is unavailable in this workspace.

### Task 2: Generic Track List Panel

**Files:**
- Create: `src/components/TrackListPanel/index.tsx`
- Create: `src/components/TrackListPanel/TrackListPanel.module.css`
- Create: `src/components/TrackListPanel/TrackListPanel.test.tsx`

- [ ] **Step 1: Write the failing test**

Add tests for header count, collapse behavior, empty state rendering, primary click callback, and trailing action callback.

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/components/TrackListPanel/TrackListPanel.test.tsx`
Expected: FAIL because the component does not exist.

- [ ] **Step 3: Write minimal implementation**

Implement a reusable panel that renders a list of tracks with optional active state and optional trailing action button text/callback.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/components/TrackListPanel/TrackListPanel.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

Skip commit if repository metadata is unavailable in this workspace.

### Task 3: Playlist and Favorites Wrappers

**Files:**
- Modify: `src/types/index.ts`
- Modify: `src/components/PlaylistPanel/index.tsx`
- Modify: `src/components/PlaylistPanel/PlaylistPanel.test.tsx`
- Create: `src/components/FavoritesPanel/index.tsx`
- Create: `src/components/FavoritesPanel/FavoritesPanel.test.tsx`

- [ ] **Step 1: Write the failing test**

Add tests confirming `PlaylistPanel` still shows playlist-specific favorite actions and `FavoritesPanel` shows favorites-specific unfavorite actions and empty copy.

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/components/PlaylistPanel/PlaylistPanel.test.tsx src/components/FavoritesPanel/FavoritesPanel.test.tsx`
Expected: FAIL because wrappers are not wired to a shared panel and favorites panel does not exist.

- [ ] **Step 3: Write minimal implementation**

Refactor `PlaylistPanel` to use `TrackListPanel`, then add `FavoritesPanel` as another wrapper with `onTrackSelect(track)` and `onRemoveFavorite(track)`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/components/PlaylistPanel/PlaylistPanel.test.tsx src/components/FavoritesPanel/FavoritesPanel.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

Skip commit if repository metadata is unavailable in this workspace.

### Task 4: TapePlayer Integration

**Files:**
- Modify: `src/components/TapePlayer/index.tsx`
- Modify: `src/components/TapePlayer/TapePlayer.module.css`
- Modify: `src/components/TapePlayer/TapePlayer.test.tsx`

- [ ] **Step 1: Write the failing test**

Add a test that seeds a favorite not present in the playlist, clicks it from the favorites panel, and verifies the UI reflects that the track is now part of playback state.

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/components/TapePlayer/TapePlayer.test.tsx`
Expected: FAIL because favorites panel is not rendered and favorites playback bridge does not exist.

- [ ] **Step 3: Write minimal implementation**

Render `FavoritesPanel` below the playlist, wire expand/collapse state, and implement "play existing or append then play" handling in `TapePlayer`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/components/TapePlayer/TapePlayer.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

Skip commit if repository metadata is unavailable in this workspace.

### Task 5: Final Verification

**Files:**
- Modify: `src/components/TrackListPanel/index.tsx`
- Modify: `src/components/PlaylistPanel/index.tsx`
- Modify: `src/components/FavoritesPanel/index.tsx`
- Modify: `src/components/TapePlayer/index.tsx`

- [ ] **Step 1: Run focused component tests**

Run: `npm test -- src/stores/playerStore.test.ts src/components/TrackListPanel/TrackListPanel.test.tsx src/components/PlaylistPanel/PlaylistPanel.test.tsx src/components/FavoritesPanel/FavoritesPanel.test.tsx src/components/TapePlayer/TapePlayer.test.tsx`
Expected: PASS

- [ ] **Step 2: Run the broader suite if focused tests pass**

Run: `npm test`
Expected: PASS, or identify unrelated existing failures explicitly.

- [ ] **Step 3: Commit**

Skip commit if repository metadata is unavailable in this workspace.

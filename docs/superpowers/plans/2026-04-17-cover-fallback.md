# Cover Fallback Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Support automatic local cover loading by preferring embedded artwork and falling back to same-name image files selected with the audio files.

**Architecture:** Expand `FileService` batch loading to understand both audio and image helper files, keeping the fallback logic isolated in the service layer. `TapePlayer` only needs to accept the broader file selection set and continue rendering `track.albumCover`.

**Tech Stack:** React 19, TypeScript, Vitest, music-metadata

---

### Task 1: FileService Matching Logic

**Files:**
- Modify: `src/services/fileService.ts`
- Modify: `src/services/fileService.test.ts`

- [ ] **Step 1: Write the failing tests**
- [ ] **Step 2: Run `npm test -- src/services/fileService.test.ts` and verify failure**
- [ ] **Step 3: Implement image-aware validation and cover fallback matching**
- [ ] **Step 4: Run `npm test -- src/services/fileService.test.ts` and verify pass**
- [ ] **Step 5: Commit if git metadata is available**

### Task 2: TapePlayer Selection Wiring

**Files:**
- Modify: `src/components/TapePlayer/index.tsx`
- Modify: `src/components/TapePlayer/TapePlayer.test.tsx`

- [ ] **Step 1: Write the failing test for image-capable file selection**
- [ ] **Step 2: Run `npm test -- src/components/TapePlayer/TapePlayer.test.tsx` and verify failure**
- [ ] **Step 3: Expand file input accept list and keep batch loading flow intact**
- [ ] **Step 4: Run focused TapePlayer tests and verify pass**
- [ ] **Step 5: Commit if git metadata is available**

# Cover Fallback Design

## Goal

Automatically load album art for local tracks by preferring embedded audio artwork and falling back to a same-name image file selected in the same batch.

## Scope

- Keep existing embedded-cover extraction as first priority.
- Accept image files in the same selection/drop batch as helper assets.
- Match `song.mp3` to `song.jpg`, `song.jpeg`, `song.png`, or `song.webp` by case-insensitive basename.
- Do not add image files to the playlist.

## Architecture

Extend `FileService.loadFiles()` to split incoming files into audio files and cover candidate images. Each audio file continues through metadata parsing; if metadata has no picture, the service looks up a matched image file and converts it to a displayable URL for `track.albumCover`.

`TapePlayer` remains simple and continues mapping `FileLoadResult[]` to tracks. The only UI change is broadening file input acceptance so users can select both audio and image files together.

## Matching Rules

1. Embedded artwork wins.
2. Fallback only searches image files from the same selection/drop event.
3. Match by filename without extension, case-insensitive.
4. First matching image wins.

## Testing

- `FileService` tests for helper image validation, embedded-cover priority, same-name fallback, and image-only files not creating tracks.
- `TapePlayer` test for file input accepting image extensions.

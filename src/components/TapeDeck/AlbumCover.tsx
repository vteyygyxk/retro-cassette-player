/**
 * AlbumCover Component - Album artwork display
 * Shows album cover in the center of the cassette tape
 */

import { useState } from 'react';
import styles from './TapeDeck.module.css';

/**
 * Default placeholder image for missing album covers
 */
const DEFAULT_COVER = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4MCIgaGVpZ2h0PSI4MCIgdmlld0JveD0iMCAwIDgwIDgwIj48cmVjdCB3aWR0aD0iODAiIGhlaWdodD0iODAiIGZpbGw9IiMzMzMiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iIzY2NiIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTIiPk5vIENvdmVyPC90ZXh0Pjwvc3ZnPg==';

export interface AlbumCoverProps {
  /** Current track containing album cover info */
  track: {
    albumCover?: string;
    name: string;
    album?: string;
  } | null;
  /** Whether the tape is currently changing */
  isChanging: boolean;
  /** Additional CSS class */
  className?: string;
}

/**
 * AlbumCover component for displaying album artwork
 * Falls back to a default placeholder when no cover is available
 */
export function AlbumCover({ track, isChanging, className }: AlbumCoverProps) {
  const [imageError, setImageError] = useState(false);

  // Determine the image source
  const coverUrl = track?.albumCover && !imageError 
    ? track.albumCover 
    : DEFAULT_COVER;

  // Handle image load error
  const handleImageError = () => {
    setImageError(true);
  };

  // Reset error state when track changes
  const handleImageLoad = () => {
    setImageError(false);
  };

  return (
    <div
      className={`${styles.albumCover} ${isChanging ? styles.albumCoverChanging : ''} ${className ?? ''}`}
      data-testid="album-cover"
      aria-label={track ? `Album cover for ${track.name}` : 'No album cover'}
    >
      <img
        src={coverUrl}
        alt={track?.album ?? track?.name ?? 'Album cover'}
        className={styles.albumCoverImage}
        onError={handleImageError}
        onLoad={handleImageLoad}
        draggable={false}
      />
    </div>
  );
}

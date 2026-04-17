/**
 * TapeDeck Component Tests
 * Unit tests for the cassette tape visualization component
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TapeDeck, Reel, CassetteBody, AlbumCover } from './index';
import type { TapeSkin, Track } from '../../types';

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
      <div className={className} {...props}>
        {children}
      </div>
    ),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Test fixtures
const mockSkin: TapeSkin = {
  id: 'test-skin',
  name: 'test-skin',
  displayName: 'Test Skin',
  bodyColor: '#1a1a1a',
  reelColor: '#333333',
  labelColor: '#f5f5f5',
};

const mockTrack: Track = {
  id: 'test-track',
  name: 'Test Track',
  artist: 'Test Artist',
  album: 'Test Album',
  duration: 180,
  audioUrl: 'test.mp3',
  albumCover: 'data:image/png;base64,test',
};

describe('TapeDeck', () => {
  describe('Main Component', () => {
    it('should render with required props', () => {
      render(
        <TapeDeck
          skin={mockSkin}
          isPlaying={false}
          isSeeking={false}
          seekDirection={null}
          currentTime={0}
          duration={180}
          isChangingTape={false}
        />
      );

      expect(screen.getByTestId('tape-deck')).toBeInTheDocument();
      expect(screen.getByTestId('cassette-body')).toBeInTheDocument();
    });

    it('should apply skin data attribute', () => {
      render(
        <TapeDeck
          skin={mockSkin}
          isPlaying={false}
          isSeeking={false}
          seekDirection={null}
          currentTime={0}
          duration={180}
          isChangingTape={false}
        />
      );

      const tapeDeck = screen.getByTestId('tape-deck');
      expect(tapeDeck).toHaveAttribute('data-skin', 'test-skin');
    });

    it('should render both reels', () => {
      render(
        <TapeDeck
          skin={mockSkin}
          isPlaying={false}
          isSeeking={false}
          seekDirection={null}
          currentTime={0}
          duration={180}
          isChangingTape={false}
        />
      );

      const reels = screen.getAllByTestId('tape-reel');
      expect(reels).toHaveLength(2);
    });

    it('should render album cover', () => {
      render(
        <TapeDeck
          skin={mockSkin}
          isPlaying={false}
          isSeeking={false}
          seekDirection={null}
          currentTime={0}
          duration={180}
          isChangingTape={false}
          currentTrack={mockTrack}
        />
      );

      expect(screen.getByTestId('album-cover')).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      render(
        <TapeDeck
          skin={mockSkin}
          isPlaying={false}
          isSeeking={false}
          seekDirection={null}
          currentTime={0}
          duration={180}
          isChangingTape={false}
          className="custom-class"
        />
      );

      const tapeDeck = screen.getByTestId('tape-deck');
      expect(tapeDeck).toHaveClass('custom-class');
    });
  });

  describe('Reel Component', () => {
    it('should render with required props', () => {
      render(
        <Reel
          color="#333333"
          isSpinning={false}
          spinDirection="clockwise"
        />
      );

      expect(screen.getByTestId('tape-reel')).toBeInTheDocument();
    });

    it('should apply custom size', () => {
      render(
        <Reel
          color="#333333"
          isSpinning={false}
          spinDirection="clockwise"
          size={100}
        />
      );

      const reel = screen.getByTestId('tape-reel');
      expect(reel).toHaveStyle({ width: '100px', height: '100px' });
    });

    it('should apply custom className', () => {
      render(
        <Reel
          color="#333333"
          isSpinning={false}
          spinDirection="clockwise"
          className="custom-reel"
        />
      );

      const reel = screen.getByTestId('tape-reel');
      expect(reel).toHaveClass('custom-reel');
    });
  });

  describe('CassetteBody Component', () => {
    it('should render with required props', () => {
      render(
        <CassetteBody skin={mockSkin} isChanging={false}>
          <div>Content</div>
        </CassetteBody>
      );

      expect(screen.getByTestId('cassette-body')).toBeInTheDocument();
    });

    it('should apply skin background color', () => {
      render(
        <CassetteBody skin={mockSkin} isChanging={false}>
          <div>Content</div>
        </CassetteBody>
      );

      const body = screen.getByTestId('cassette-body');
      expect(body).toHaveStyle({ backgroundColor: '#1a1a1a' });
    });

    it('should apply skin data attribute', () => {
      render(
        <CassetteBody skin={mockSkin} isChanging={false}>
          <div>Content</div>
        </CassetteBody>
      );

      const body = screen.getByTestId('cassette-body');
      expect(body).toHaveAttribute('data-skin', 'test-skin');
    });

    it('should render children', () => {
      render(
        <CassetteBody skin={mockSkin} isChanging={false}>
          <div data-testid="child-content">Content</div>
        </CassetteBody>
      );

      expect(screen.getByTestId('child-content')).toBeInTheDocument();
    });
  });

  describe('AlbumCover Component', () => {
    it('should render with track', () => {
      render(
        <AlbumCover track={mockTrack} isChanging={false} />
      );

      expect(screen.getByTestId('album-cover')).toBeInTheDocument();
    });

    it('should render without track', () => {
      render(
        <AlbumCover track={null} isChanging={false} />
      );

      expect(screen.getByTestId('album-cover')).toBeInTheDocument();
    });

    it('should have accessible label with track', () => {
      render(
        <AlbumCover track={mockTrack} isChanging={false} />
      );

      const cover = screen.getByTestId('album-cover');
      expect(cover).toHaveAttribute('aria-label', 'Album cover for Test Track');
    });

    it('should have accessible label without track', () => {
      render(
        <AlbumCover track={null} isChanging={false} />
      );

      const cover = screen.getByTestId('album-cover');
      expect(cover).toHaveAttribute('aria-label', 'No album cover');
    });

    it('should apply custom className', () => {
      render(
        <AlbumCover track={mockTrack} isChanging={false} className="custom-cover" />
      );

      const cover = screen.getByTestId('album-cover');
      expect(cover).toHaveClass('custom-cover');
    });
  });
});

/**
 * SkinSelector Component Tests
 * Tests for tape skin selector functionality
 *
 * Validates: Requirements 4.1-4.5
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SkinSelector } from './index';
import type { TapeSkin } from '../../types';

const mockSkins: TapeSkin[] = [
  {
    id: 'classic-black',
    name: 'classic-black',
    displayName: '经典黑',
    bodyColor: '#1a1a1a',
    bodyGradient: 'linear-gradient(145deg, #2a2a2a, #1a1a1a)',
    reelColor: '#333333',
    labelColor: '#f5f5f5',
  },
  {
    id: 'retro-brown',
    name: 'retro-brown',
    displayName: '复古棕',
    bodyColor: '#8B4513',
    reelColor: '#654321',
    labelColor: '#f5deb3',
  },
  {
    id: 'neon-pink',
    name: 'neon-pink',
    displayName: '霓虹粉',
    bodyColor: '#ff1493',
    bodyGradient: 'linear-gradient(145deg, #ff69b4, #ff1493)',
    reelColor: '#ff69b4',
    labelColor: '#ffffff',
  },
];

describe('SkinSelector', () => {
  const defaultProps = {
    skins: mockSkins,
    currentSkinId: 'classic-black',
    onSkinChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render the skin selector', () => {
      render(<SkinSelector {...defaultProps} />);

      expect(screen.getByTestId('skin-selector')).toBeInTheDocument();
    });

    it('should render all skin options', () => {
      render(<SkinSelector {...defaultProps} />);

      mockSkins.forEach((skin) => {
        expect(screen.getByTestId(`skin-button-${skin.id}`)).toBeInTheDocument();
      });
    });

    it('should display skin display names', () => {
      render(<SkinSelector {...defaultProps} />);

      expect(screen.getByText('经典黑')).toBeInTheDocument();
      expect(screen.getByText('复古棕')).toBeInTheDocument();
      expect(screen.getByText('霓虹粉')).toBeInTheDocument();
    });

    it('should highlight the current skin', () => {
      render(<SkinSelector {...defaultProps} currentSkinId="retro-brown" />);

      const activeButton = screen.getByTestId('skin-button-retro-brown');
      expect(activeButton).toHaveAttribute('aria-checked', 'true');
    });

    it('should not highlight non-active skins', () => {
      render(<SkinSelector {...defaultProps} currentSkinId="classic-black" />);

      const inactiveButton = screen.getByTestId('skin-button-neon-pink');
      expect(inactiveButton).toHaveAttribute('aria-checked', 'false');
    });
  });

  describe('Selection', () => {
    it('should call onSkinChange when a skin is clicked', () => {
      render(<SkinSelector {...defaultProps} />);

      fireEvent.click(screen.getByTestId('skin-button-retro-brown'));

      expect(defaultProps.onSkinChange).toHaveBeenCalledWith('retro-brown');
    });

    it('should call onSkinChange for each skin', () => {
      render(<SkinSelector {...defaultProps} />);

      mockSkins.forEach((skin) => {
        fireEvent.click(screen.getByTestId(`skin-button-${skin.id}`));
      });

      expect(defaultProps.onSkinChange).toHaveBeenCalledTimes(mockSkins.length);
    });
  });

  describe('Accessibility', () => {
    it('should have radiogroup role', () => {
      render(<SkinSelector {...defaultProps} />);

      const selector = screen.getByTestId('skin-selector');
      expect(selector).toHaveAttribute('role', 'radiogroup');
    });

    it('should have radio role on each button', () => {
      render(<SkinSelector {...defaultProps} />);

      mockSkins.forEach((skin) => {
        expect(screen.getByTestId(`skin-button-${skin.id}`)).toHaveAttribute('role', 'radio');
      });
    });

    it('should have aria-label on each button', () => {
      render(<SkinSelector {...defaultProps} />);

      mockSkins.forEach((skin) => {
        expect(screen.getByLabelText(skin.displayName)).toBeInTheDocument();
      });
    });
  });

  describe('Custom ClassName', () => {
    it('should apply custom className', () => {
      render(<SkinSelector {...defaultProps} className="custom-class" />);

      const selector = screen.getByTestId('skin-selector');
      expect(selector).toHaveClass('custom-class');
    });
  });
});

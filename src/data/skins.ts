/**
 * Retro Cassette Player - Skin Data
 * Default tape skins for the cassette player
 */

import type { TapeSkin } from '../types';

/**
 * Custom skin colors stored by the user
 */
export interface CustomSkinColors {
  bodyColor: string;
  reelColor: string;
  labelColor: string;
}

/**
 * Default tape skins available in the player
 */
export const DEFAULT_SKINS: TapeSkin[] = [
  {
    id: 'classic-black',
    name: 'classic-black',
    displayName: '经典黑',
    bodyColor: '#1a1a1a',
    bodyGradient: 'linear-gradient(145deg, #2a2a2a, #1a1a1a)',
    reelColor: '#333333',
    reelPattern: 'repeating-conic-gradient(from 0deg, #444 0deg 30deg, #333 30deg 60deg)',
    labelColor: '#f5f5f5',
  },
  {
    id: 'retro-brown',
    name: 'retro-brown',
    displayName: '复古棕',
    bodyColor: '#8B4513',
    bodyGradient: 'linear-gradient(145deg, #a0522d, #8B4513)',
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

/** The special ID for the user-customizable skin */
export const CUSTOM_SKIN_ID = 'custom';

/**
 * Build a TapeSkin object from custom colors
 */
export function buildCustomSkin(colors: CustomSkinColors): TapeSkin {
  const darkerBody = darkenColor(colors.bodyColor, 0.15);
  return {
    id: CUSTOM_SKIN_ID,
    name: CUSTOM_SKIN_ID,
    displayName: '自定义',
    bodyColor: colors.bodyColor,
    bodyGradient: `linear-gradient(145deg, ${lightenColor(colors.bodyColor, 0.1)}, ${darkerBody})`,
    reelColor: colors.reelColor,
    labelColor: colors.labelColor,
  };
}

/**
 * Get a skin by its ID. For 'custom', uses provided custom colors.
 */
export function getSkinById(skinId: string, customColors?: CustomSkinColors): TapeSkin {
  if (skinId === CUSTOM_SKIN_ID && customColors) {
    return buildCustomSkin(customColors);
  }
  return DEFAULT_SKINS.find((skin) => skin.id === skinId) ?? DEFAULT_SKINS[0];
}

/**
 * Get all available skin IDs (including custom)
 */
export function getSkinIds(): string[] {
  return [...DEFAULT_SKINS.map((skin) => skin.id), CUSTOM_SKIN_ID];
}

/**
 * All skins including a placeholder custom skin
 */
export function getAllSkins(customColors?: CustomSkinColors): TapeSkin[] {
  return [...DEFAULT_SKINS, buildCustomSkin(customColors ?? { bodyColor: '#1a1a1a', reelColor: '#333333', labelColor: '#f5f5f5' })];
}

// --- Color helpers ---

function hexToRgb(hex: string): [number, number, number] {
  const cleaned = hex.replace('#', '');
  const num = parseInt(cleaned, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
}

function lightenColor(hex: string, amount: number): string {
  const [r, g, b] = hexToRgb(hex);
  return rgbToHex(r + (255 - r) * amount, g + (255 - g) * amount, b + (255 - b) * amount);
}

function darkenColor(hex: string, amount: number): string {
  const [r, g, b] = hexToRgb(hex);
  return rgbToHex(r * (1 - amount), g * (1 - amount), b * (1 - amount));
}

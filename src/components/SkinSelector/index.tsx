/**
 * SkinSelector Component - Tape skin/theme selector
 * Allows users to switch between different cassette tape visual skins
 * and customize colors for a custom skin
 *
 * Features:
 * - Visual skin preview thumbnails
 * - Active skin indicator
 * - Custom skin with color pickers
 * - Smooth transition between skins
 * - Persisted selection
 */

import { useState } from 'react';
import type { TapeSkin } from '../../types';
import { CUSTOM_SKIN_ID, getAllSkins } from '../../data/skins';
import styles from './SkinSelector.module.css';

interface CustomSkinColors {
  bodyColor: string;
  reelColor: string;
  labelColor: string;
}

/**
 * Props for the SkinSelector component
 */
export interface SkinSelectorProps {
  /** Currently selected skin ID */
  currentSkinId: string;
  /** Callback when skin is selected */
  onSkinChange: (skinId: string) => void;
  /** Custom skin colors */
  customSkinColors: CustomSkinColors;
  /** Callback to update custom skin colors */
  onCustomSkinColorsChange: (colors: CustomSkinColors) => void;
  /** Additional CSS class */
  className?: string;
}

/**
 * SkinSelector - Tape skin selection component
 *
 * Displays available skins as visual thumbnails that users can click to select.
 * Includes a "custom" option with color pickers for full customization.
 */
export function SkinSelector({
  currentSkinId,
  onSkinChange,
  customSkinColors,
  onCustomSkinColorsChange,
  className,
}: SkinSelectorProps) {
  const [showCustomPanel, setShowCustomPanel] = useState(false);

  const allSkins = getAllSkins(
    currentSkinId === CUSTOM_SKIN_ID ? customSkinColors : undefined
  );

  const handleCustomColorChange = (key: keyof CustomSkinColors, value: string) => {
    onCustomSkinColorsChange({ ...customSkinColors, [key]: value });
  };

  const handleSkinClick = (skinId: string) => {
    if (skinId === CUSTOM_SKIN_ID) {
      onSkinChange(CUSTOM_SKIN_ID);
      setShowCustomPanel(true);
    } else {
      onSkinChange(skinId);
      setShowCustomPanel(false);
    }
  };

  return (
    <div className={`${styles.skinSelector} ${className ?? ''}`}>
      <span className={styles.label}>皮肤</span>
      <div className={styles.skinList}>
        {allSkins.map((skin) => {
          const isActive = skin.id === currentSkinId;
          const skinColors =
            skin.id === CUSTOM_SKIN_ID
              ? customSkinColors
              : { bodyColor: skin.bodyColor, reelColor: skin.reelColor, labelColor: skin.labelColor };

          return (
            <button
              key={skin.id}
              className={`${styles.skinButton} ${isActive ? styles.skinButtonActive : ''}`}
              style={{
                '--skin-body-color': skinColors.bodyColor,
                '--skin-reel-color': skinColors.reelColor,
                '--skin-label-color': skinColors.labelColor,
              } as React.CSSProperties}
              onClick={() => handleSkinClick(skin.id)}
              role="radio"
              aria-checked={isActive}
              aria-label={skin.displayName}
              title={skin.displayName}
            >
              {/* Mini cassette preview */}
              <span className={styles.skinPreview}>
                <span
                  className={styles.skinReel}
                  style={{ background: skinColors.reelColor }}
                />
                <span
                  className={styles.skinBody}
                  style={{ background: skinColors.bodyColor }}
                >
                  <span
                    className={styles.skinLabel}
                    style={{ background: skinColors.labelColor }}
                  />
                </span>
                <span
                  className={styles.skinReel}
                  style={{ background: skinColors.reelColor }}
                />
              </span>
              <span className={styles.skinName}>{skin.displayName}</span>
            </button>
          );
        })}
      </div>

      {/* Custom color panel */}
      {currentSkinId === CUSTOM_SKIN_ID && (
        <div className={styles.customPanel}>
          <button
            className={styles.customToggle}
            onClick={() => setShowCustomPanel(!showCustomPanel)}
            aria-label={showCustomPanel ? '收起颜色设置' : '展开颜色设置'}
          >
            <span className={`${styles.customArrow} ${showCustomPanel ? styles.customArrowOpen : ''}`}>
              ▸
            </span>
            <span>调色板</span>
          </button>
          {showCustomPanel && (
            <div className={styles.customColors}>
              <label className={styles.colorField}>
                <span className={styles.colorLabel}>机身</span>
                <input
                  type="color"
                  value={customSkinColors.bodyColor}
                  onChange={(e) => handleCustomColorChange('bodyColor', e.target.value)}
                  className={styles.colorInput}
                />
              </label>
              <label className={styles.colorField}>
                <span className={styles.colorLabel}>转轮</span>
                <input
                  type="color"
                  value={customSkinColors.reelColor}
                  onChange={(e) => handleCustomColorChange('reelColor', e.target.value)}
                  className={styles.colorInput}
                />
              </label>
              <label className={styles.colorField}>
                <span className={styles.colorLabel}>标签</span>
                <input
                  type="color"
                  value={customSkinColors.labelColor}
                  onChange={(e) => handleCustomColorChange('labelColor', e.target.value)}
                  className={styles.colorInput}
                />
              </label>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default SkinSelector;

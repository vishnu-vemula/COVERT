import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { AccessibilityInfo, Platform } from 'react-native';

import { palette } from './tokens';

/**
 * Colours that respond to the system's increased-contrast setting. Secondary
 * text and borders darken; the layout never changes.
 */
export interface Colors {
  text: string;
  textSecondary: string;
  textTertiary: string;
  border: string;
  divider: string;
}

const standard: Colors = {
  text: palette.ink,
  textSecondary: palette.textSecondary,
  textTertiary: palette.muted,
  border: palette.border,
  divider: palette.border,
};

const highContrast: Colors = {
  text: palette.ink,
  textSecondary: palette.ink,
  textTertiary: palette.textSecondary,
  border: palette.borderStrong,
  divider: palette.borderStrong,
};

const ColorsContext = createContext<Colors>(standard);

export function ContrastProvider({ children }: { children: ReactNode }) {
  const [increased, setIncreased] = useState(false);

  useEffect(() => {
    let active = true;
    const query =
      Platform.OS === 'ios'
        ? AccessibilityInfo.isDarkerSystemColorsEnabled()
        : Platform.OS === 'android'
          ? AccessibilityInfo.isHighTextContrastEnabled()
          : Promise.resolve(false);
    query.then((value) => active && setIncreased(value)).catch(() => undefined);
    const subscription =
      Platform.OS === 'ios'
        ? AccessibilityInfo.addEventListener('darkerSystemColorsChanged', setIncreased)
        : Platform.OS === 'android'
          ? AccessibilityInfo.addEventListener('highTextContrastChanged', setIncreased)
          : null;
    return () => {
      active = false;
      subscription?.remove();
    };
  }, []);

  return (
    <ColorsContext.Provider value={increased ? highContrast : standard}>
      {children}
    </ColorsContext.Provider>
  );
}

export function useColors(): Colors {
  return useContext(ColorsContext);
}

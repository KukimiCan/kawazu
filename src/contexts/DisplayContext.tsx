'use client';

import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';

export type AppFont = 'klee' | 'system' | 'shippori' | 'zen' | 'kaisei' | 'notoSerif';
export type TextSize = 'small' | 'medium' | 'large';
export const FONT_OPTIONS: { id: AppFont; label: string }[] = [
  { id: 'klee', label: 'Klee One' }, { id: 'system', label: '標準ゴシック' },
  { id: 'shippori', label: 'しっぽり明朝' }, { id: 'zen', label: 'Zen Kurenaido' },
  { id: 'kaisei', label: '解星' }, { id: 'notoSerif', label: 'Noto Serif JP' },
];
const TEXT_SIZES: TextSize[] = ['small', 'medium', 'large'];
interface DisplayContextType {
  font: AppFont;
  textSize: TextSize;
  setFont: (font: AppFont) => void;
  setTextSize: (size: TextSize) => void;
  preferenceError: boolean;
}
const DisplayContext = createContext<DisplayContextType | undefined>(undefined);

export function DisplayProvider({ children }: { children: ReactNode }) {
  const [font, setFontState] = useState<AppFont>('klee');
  const [textSize, setTextSizeState] = useState<TextSize>('medium');
  const [preferenceError, setPreferenceError] = useState(false);
  useEffect(() => {
    try {
      const savedFont = localStorage.getItem('kawazuFont');
      const savedSize = localStorage.getItem('kawazuTextSize');
      if (FONT_OPTIONS.some((option) => option.id === savedFont)) setFontState(savedFont as AppFont);
      if (TEXT_SIZES.includes(savedSize as TextSize)) setTextSizeState(savedSize as TextSize);
    } catch { setPreferenceError(true); }
  }, []);
  useEffect(() => { document.documentElement.dataset.font = font; }, [font]);
  useEffect(() => { document.documentElement.dataset.textSize = textSize; }, [textSize]);
  const persist = useCallback((key: string, value: string) => {
    try { localStorage.setItem(key, value); setPreferenceError(false); }
    catch { setPreferenceError(true); }
  }, []);
  const setFont = useCallback((value: AppFont) => { setFontState(value); persist('kawazuFont', value); }, [persist]);
  const setTextSize = useCallback((value: TextSize) => { setTextSizeState(value); persist('kawazuTextSize', value); }, [persist]);
  const value = useMemo(() => ({ font, textSize, setFont, setTextSize, preferenceError }), [font, textSize, setFont, setTextSize, preferenceError]);
  return <DisplayContext.Provider value={value}>{children}</DisplayContext.Provider>;
}

export function useDisplay() {
  const context = useContext(DisplayContext);
  if (!context) throw new Error('useDisplay must be used within a DisplayProvider');
  return context;
}

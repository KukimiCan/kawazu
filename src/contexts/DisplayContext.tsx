"use client";

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type AppFont = "klee" | "system" | "shippori" | "zen" | "kaisei" | "notoSerif";

export const FONT_OPTIONS: Array<{ id: AppFont; label: string }> = [
  { id: "klee", label: "Klee One" },
  { id: "system", label: "標準ゴシック" },
  { id: "shippori", label: "しっぽり明朝" },
  { id: "zen", label: "Zen Kurenaido" },
  { id: "kaisei", label: "解星" },
  { id: "notoSerif", label: "Noto Serif JP" },
];

interface DisplayContextType {
  font: AppFont;
  setFont: (font: AppFont) => void;
}

const DisplayContext = createContext<DisplayContextType | undefined>(undefined);

function isAppFont(value: unknown): value is AppFont {
  return FONT_OPTIONS.some((option) => option.id === value);
}

export function DisplayProvider({ children }: { children: ReactNode }) {
  const [font, setFontState] = useState<AppFont>("klee");

  useEffect(() => {
    const storedFont = localStorage.getItem("kawazuFont");
    if (isAppFont(storedFont)) {
      setFontState(storedFont);
      document.documentElement.dataset.font = storedFont;
    } else {
      document.documentElement.dataset.font = "klee";
    }
  }, []);

  const setFont = useCallback((nextFont: AppFont) => {
    setFontState(nextFont);
    localStorage.setItem("kawazuFont", nextFont);
    document.documentElement.dataset.font = nextFont;
  }, []);

  const value = useMemo(() => ({
    font,
    setFont,
  }), [font, setFont]);

  return (
    <DisplayContext.Provider value={value}>
      {children}
    </DisplayContext.Provider>
  );
}

export function useDisplay() {
  const context = useContext(DisplayContext);
  if (context === undefined) {
    throw new Error("useDisplay must be used within a DisplayProvider");
  }

  return context;
}

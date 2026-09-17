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

const FONT_STYLESHEETS: Partial<Record<AppFont, string>> = {
  klee: "https://fonts.googleapis.com/css2?family=Klee+One:wght@400;600&display=swap",
  shippori: "https://fonts.googleapis.com/css2?family=Shippori+Mincho:wght@400;500&display=swap",
  zen: "https://fonts.googleapis.com/css2?family=Zen+Kurenaido&display=swap",
  kaisei: "https://fonts.googleapis.com/css2?family=Kaisei+Tokumin:wght@400;500&display=swap",
  notoSerif: "https://fonts.googleapis.com/css2?family=Noto+Serif+JP:wght@400;500&display=swap",
};

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

  useEffect(() => {
    const linkId = "kawazu-font-stylesheet";
    const href = FONT_STYLESHEETS[font];
    const existingLink = document.getElementById(linkId);

    if (!href) {
      existingLink?.remove();
      return;
    }

    const link = existingLink instanceof HTMLLinkElement
      ? existingLink
      : document.createElement("link");

    link.id = linkId;
    link.rel = "stylesheet";
    link.href = href;

    if (!existingLink) {
      document.head.appendChild(link);
    }
  }, [font]);

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

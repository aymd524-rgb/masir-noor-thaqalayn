import { useCallback, useEffect, useState } from "react";

const BOOKMARKS_KEY = "noor.mushaf.bookmarks.v1";
const PREFS_KEY = "noor.mushaf.prefs.v1";

export interface MushafBookmark {
  page: number;
  addedAt: string;
}

export interface MushafPrefs {
  scale: number;
  lastPage?: number;
}

const read = <T,>(key: string, fallback: T): T => {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};

const write = (key: string, value: unknown) => {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable */
  }
};

export function useMushafBookmarks() {
  const [items, setItems] = useState<MushafBookmark[]>([]);
  useEffect(() => setItems(read<MushafBookmark[]>(BOOKMARKS_KEY, [])), []);

  const toggle = useCallback((page: number) => {
    setItems((prev) => {
      const next = prev.some((b) => b.page === page)
        ? prev.filter((b) => b.page !== page)
        : [...prev, { page, addedAt: new Date().toISOString() }].sort((a, b) => a.page - b.page);
      write(BOOKMARKS_KEY, next);
      return next;
    });
  }, []);

  const has = useCallback((page: number) => items.some((b) => b.page === page), [items]);
  return { items, toggle, has };
}

export const SCALE_STEPS = [0.85, 1, 1.15, 1.3, 1.5] as const;

export function useMushafPrefs() {
  const [prefs, setPrefs] = useState<MushafPrefs>({ scale: 1 });
  useEffect(() => setPrefs(read<MushafPrefs>(PREFS_KEY, { scale: 1 })), []);
  const update = useCallback((patch: Partial<MushafPrefs>) => {
    setPrefs((prev) => {
      const next = { ...prev, ...patch };
      write(PREFS_KEY, next);
      return next;
    });
  }, []);
  return { prefs, update };
}
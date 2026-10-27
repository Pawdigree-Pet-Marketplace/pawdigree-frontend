import { useCallback, useState } from "react";

const FAV_KEY = "pawdigree:favourites";

/** Saved pet ids, persisted in localStorage. Swap for an API later without touching the UI. */
export function useFavourites() {
  const [ids, setIds] = useState<number[]>(() => {
    try {
      const raw = JSON.parse(localStorage.getItem(FAV_KEY) ?? "[]") as unknown;
      return Array.isArray(raw) ? raw.filter((x): x is number => typeof x === "number") : [];
    } catch {
      return [];
    }
  });

  const toggle = useCallback((id: number) => {
    setIds((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      try {
        localStorage.setItem(FAV_KEY, JSON.stringify(next));
      } catch {
        /* storage unavailable: keep in memory only */
      }
      return next;
    });
  }, []);

  return { ids, toggle };
}

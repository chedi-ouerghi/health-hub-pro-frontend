import { useCallback, useEffect, useState } from "react";

const KEY = "medicare-favorites";
const listeners = new Set<(ids: string[]) => void>();
let current: string[] = [];

function emit(next: string[]) {
  current = next;
  window.localStorage.setItem(KEY, JSON.stringify(next));
  listeners.forEach((l) => l(next));
}

export function useFavorites() {
  const [favorites, setFavorites] = useState<string[]>(current);

  useEffect(() => {
    const stored = window.localStorage.getItem(KEY);
    if (stored && current.length === 0) {
      try {
        current = JSON.parse(stored) as string[];
      } catch {
        current = [];
      }
    }
    setFavorites(current);
    listeners.add(setFavorites);
    return () => {
      listeners.delete(setFavorites);
    };
  }, []);

  const toggle = useCallback((id: string) => {
    emit(current.includes(id) ? current.filter((x) => x !== id) : [...current, id]);
  }, []);

  return { favorites, toggle, isFavorite: (id: string) => favorites.includes(id) };
}

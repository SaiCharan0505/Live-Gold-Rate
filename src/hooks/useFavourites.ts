import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'live_gold_india_favourites';
const DEFAULT_FAVOURITES = ['hyderabad', 'mumbai', 'delhi', 'bengaluru', 'chennai'];

export function useFavourites() {
  const [favourites, setFavourites] = useState<string[]>(() => {
    if (typeof window === 'undefined') return DEFAULT_FAVOURITES;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      // Ignore
    }
    return DEFAULT_FAVOURITES;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(favourites));
    } catch (e) {
      // Ignore
    }
  }, [favourites]);

  const toggleFavourite = useCallback((cityId: string) => {
    const id = cityId.toLowerCase();
    setFavourites((prev) => {
      if (prev.includes(id)) {
        // Keep at least one favourite
        if (prev.length <= 1) return prev;
        return prev.filter((item) => item !== id);
      } else {
        return [...prev, id];
      }
    });
  }, []);

  const isFavourite = useCallback(
    (cityId: string) => favourites.includes(cityId.toLowerCase()),
    [favourites]
  );

  return {
    favourites,
    toggleFavourite,
    isFavourite,
  };
}

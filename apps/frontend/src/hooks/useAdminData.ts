import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

export function useAdminData<T>(
  fetcher: (token: string) => Promise<T>,
  accessToken: string | null,
  reloadKey?: unknown, // ← replaces the spread deps — pass filter here
) {
  const [data, setData] = useState<T | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  // Update ref in useLayoutEffect (not during render — fixes react-hooks/refs error)
  const fetcherRef = useRef(fetcher);
  useLayoutEffect(() => {
    fetcherRef.current = fetcher;
  });

  const load = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      setData(await fetcherRef.current(accessToken));
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  }, [accessToken]); // ← plain literal array, no spread

  useEffect(() => {
     
    void load();
  }, [load, reloadKey]); // ← reloadKey re-fires when filter changes

  return { data, loading, reload: load };
}

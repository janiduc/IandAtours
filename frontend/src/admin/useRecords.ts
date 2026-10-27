import { useCallback, useEffect, useState } from "react";

// Loads a list for an admin page and lets the page reload it after saving.
export function useRecords<T>(load: () => Promise<T[]>, deps: unknown[] = []) {
  const [records, setRecords] = useState<T[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(() => {
    load()
      .then((items) => {
        setRecords(items);
        setError(null);
      })
      .catch((e: Error) => setError(e.message));
  }, deps);

  useEffect(reload, [reload]);
  return { records, error, reload };
}

import { useEffect, useState } from "react";

export function useFetch<T>(load: () => Promise<T>, deps: unknown[]) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setData(null);
    setError(null);
    load()
      .then((result) => active && setData(result))
      .catch(() => active && setError("Something went wrong loading this page. Please try again."));
    return () => {
      active = false;
    };
  }, deps);

  return { data, error, loading: data === null && error === null };
}

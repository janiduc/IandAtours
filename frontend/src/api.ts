import type { Tour, Vehicle } from "./types";

async function get<T>(path: string): Promise<T> {
  const response = await fetch(path);
  if (!response.ok) throw new Error(`Request failed: ${response.status}`);
  return response.json() as Promise<T>;
}

export const api = {
  tours: (params: Record<string, string> = {}) => {
    const query = new URLSearchParams(params).toString();
    return get<Tour[]>(`/api/tours${query ? `?${query}` : ""}`);
  },
  tour: (slug: string) => get<Tour>(`/api/tours/${encodeURIComponent(slug)}`),
  vehicles: () => get<Vehicle[]>("/api/vehicles"),
};

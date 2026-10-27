import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../api";
import TourCard from "../components/TourCard";
import { useFetch } from "../useFetch";

const DURATIONS = [
  { value: "", label: "Any length" },
  { value: "1", label: "Day trips" },
  { value: "3", label: "Up to 3 days" },
  { value: "5", label: "Up to 5 days" },
];

export default function Tours() {
  const [params, setParams] = useSearchParams();
  const region = params.get("region") ?? "";
  const maxDays = params.get("max_days") ?? "";

  // Load every tour once and filter here, so the region list stays complete.
  const { data: tours, error, loading } = useFetch(() => api.tours(), []);
  const regions = useMemo(() => [...new Set(tours?.map((t) => t.region))].sort(), [tours]);
  const visible = tours?.filter(
    (t) => (!region || t.region === region) && (!maxDays || t.duration_days <= Number(maxDays)),
  );

  const update = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  };

  return (
    <section className="container section">
      <h1>Tour packages</h1>
      <div className="filters">
        <label>
          Region
          <select value={region} onChange={(e) => update("region", e.target.value)}>
            <option value="">All regions</option>
            {regions.map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>
        </label>
        <label>
          Length
          <select value={maxDays} onChange={(e) => update("max_days", e.target.value)}>
            {DURATIONS.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      {loading && <p className="muted">Loading tours…</p>}
      {error && <p className="error">{error}</p>}
      {visible?.length === 0 && <p className="muted">No tours match these filters yet.</p>}
      <div className="grid">{visible?.map((tour) => <TourCard key={tour.id} tour={tour} />)}</div>
    </section>
  );
}

import { api } from "../api";
import SmartImage from "../components/SmartImage";
import WhatsAppButton from "../components/WhatsAppButton";
import { useFetch } from "../useFetch";

export default function Fleet() {
  const { data: vehicles, error, loading } = useFetch(() => api.vehicles(), []);

  return (
    <section className="container section">
      <h1>Our fleet</h1>
      <p className="muted lead">
        Every tour comes with a private vehicle and an experienced driver. Choose the size that suits your group.
      </p>
      {loading && <p className="muted">Loading vehicles…</p>}
      {error && <p className="error">{error}</p>}
      <div className="grid">
        {vehicles?.map((v) => (
          <article key={v.id} className="card">
            <SmartImage src={v.image_url} alt={v.name} className="card-img" />
            <div className="card-body">
              <p className="eyebrow">
                {v.category} · up to {v.seats} passengers{v.air_conditioned ? " · A/C" : ""}
              </p>
              <h3>{v.name}</h3>
              <p className="muted">{v.description}</p>
              <WhatsAppButton
                label="Ask about this vehicle"
                message={`Hi I&A Tours, I'd like to hire the ${v.name}. Is it available?`}
              />
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

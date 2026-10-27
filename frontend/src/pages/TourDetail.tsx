import { Link, useParams } from "react-router-dom";
import { api } from "../api";
import Price from "../components/Price";
import SmartImage from "../components/SmartImage";
import WhatsAppButton from "../components/WhatsAppButton";
import { useFetch } from "../useFetch";

export default function TourDetail() {
  const { slug = "" } = useParams();
  const { data: tour, error, loading } = useFetch(() => api.tour(slug), [slug]);

  if (loading) return <p className="container section muted">Loading…</p>;
  if (error || !tour) {
    return (
      <section className="container section">
        <h1>Tour not found</h1>
        <Link to="/tours">Back to all tours</Link>
      </section>
    );
  }

  return (
    <article className="container section tour-detail">
      <Link to="/tours" className="back">
        ← All tours
      </Link>
      <SmartImage src={tour.image_url} alt={tour.title} className="detail-img" />
      <div className="detail-layout">
        <div>
          <p className="eyebrow">
            {tour.region} · {tour.duration_days} {tour.duration_days === 1 ? "day" : "days"}
          </p>
          <h1>{tour.title}</h1>
          <p>{tour.description}</p>
          <h2>Highlights</h2>
          <ul className="highlights">
            {tour.highlights.map((h) => (
              <li key={h}>{h}</li>
            ))}
          </ul>
        </div>
        <aside className="booking-box">
          <Price tour={tour} />
          <p className="muted">Includes a private air-conditioned vehicle and driver-guide.</p>
          <Link to={`/book/${tour.slug}`} className="btn btn-primary">
            Book now
          </Link>
          <WhatsAppButton
            label="Enquire on WhatsApp"
            message={`Hi I&A Tours, I'm interested in the "${tour.title}" tour. Could you share more details?`}
          />
        </aside>
      </div>
    </article>
  );
}

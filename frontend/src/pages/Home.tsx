import { Link } from "react-router-dom";
import { api } from "../api";
import TourCard from "../components/TourCard";
import WhatsAppButton from "../components/WhatsAppButton";
import { useFetch } from "../useFetch";
import { usePageMeta } from "../usePageMeta";

const REASONS = [
  { title: "Private driver-guides", text: "Licensed, English-speaking guides who know every route on the island." },
  { title: "Your own vehicle", text: "Clean, air-conditioned cars, vans and coaches for any group size." },
  { title: "Tailor-made trips", text: "Every itinerary can be adjusted to your dates, pace and interests." },
];

export default function Home() {
  usePageMeta("I&A Tours");
  const { data: tours, error } = useFetch(() => api.tours({ featured: "true" }), []);

  return (
    <>
      <section className="hero">
        <div className="container hero-inner">
          <h1>Discover Sri Lanka with I&amp;A Tours</h1>
          <p>
            Ancient cities, misty tea country, wildlife safaris and golden beaches. Private tours for visitors from
            abroad and for Sri Lankans exploring their own island.
          </p>
          <div className="hero-actions">
            <Link to="/tours" className="btn btn-primary">
              Browse tours
            </Link>
            <WhatsAppButton label="Ask us on WhatsApp" />
          </div>
        </div>
      </section>

      <section className="container section">
        <div className="section-head">
          <h2>Popular tours</h2>
          <Link to="/tours">See all tours</Link>
        </div>
        {error && <p className="error">{error}</p>}
        <div className="grid">{tours?.map((tour) => <TourCard key={tour.id} tour={tour} />)}</div>
      </section>

      <section className="section alt">
        <div className="container">
          <h2>Why travel with us</h2>
          <div className="grid reasons">
            {REASONS.map((reason) => (
              <div key={reason.title} className="reason">
                <h3>{reason.title}</h3>
                <p className="muted">{reason.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

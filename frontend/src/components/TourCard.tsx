import { Link } from "react-router-dom";
import type { Tour } from "../types";
import Price from "./Price";
import SmartImage from "./SmartImage";

export default function TourCard({ tour }: { tour: Tour }) {
  return (
    <article className="card">
      <Link to={`/tours/${tour.slug}`} className="card-link">
        <SmartImage src={tour.image_url} alt={tour.title} className="card-img" />
        <div className="card-body">
          <p className="eyebrow">
            {tour.region} · {tour.duration_days} {tour.duration_days === 1 ? "day" : "days"}
          </p>
          <h3>{tour.title}</h3>
          <p className="muted">{tour.summary}</p>
          <Price tour={tour} />
        </div>
      </Link>
    </article>
  );
}

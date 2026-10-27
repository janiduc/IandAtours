import { useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../api";
import CurrencyToggle from "../components/CurrencyToggle";
import { formatPrice, useCurrency } from "../currency";
import { redirectToCheckout } from "../payhere";
import { useFetch } from "../useFetch";

function isoDate(daysFromToday: number) {
  const d = new Date();
  d.setDate(d.getDate() + daysFromToday);
  return d.toISOString().slice(0, 10);
}

export default function Book() {
  const { slug = "" } = useParams();
  const navigate = useNavigate();
  const { currency } = useCurrency();
  const { data: tour, error: loadError } = useFetch(() => api.tour(slug), [slug]);
  const { data: options } = useFetch(() => api.bookingOptions(), []);
  const onlinePayment = options?.online_payment ?? false;
  const [travellers, setTravellers] = useState(2);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (loadError) return <p className="container section error">{loadError}</p>;
  if (!tour) return <p className="container section muted">Loading…</p>;

  const unitPrice = currency === "USD" ? tour.price_usd : tour.price_lkr;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setSubmitting(true);
    setError(null);
    try {
      const booking = await api.createBooking({
        tour_slug: slug,
        customer_name: String(form.get("name")),
        customer_email: String(form.get("email")),
        customer_phone: String(form.get("phone")),
        country: String(form.get("country")),
        travel_date: String(form.get("date")),
        travellers,
        currency,
        special_requests: String(form.get("requests") ?? ""),
      });
      if (booking.payment) {
        redirectToCheckout(booking.payment.action, booking.payment.fields);
      } else {
        navigate(`/booking/${booking.reference}`);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <section className="container section narrow">
      <Link to={`/tours/${tour.slug}`} className="back">
        ← {tour.title}
      </Link>
      <h1>Book {tour.title}</h1>
      <form className="form" onSubmit={submit}>
        <fieldset>
          <legend>I am a</legend>
          <CurrencyToggle />
          <p className="muted small">
            Sri Lankan residents pay in LKR, visitors from abroad in USD. We may ask for ID when you travel.
          </p>
        </fieldset>
        <label>
          Full name
          <input name="name" required minLength={2} maxLength={120} autoComplete="name" />
        </label>
        <div className="form-row">
          <label>
            Email
            <input name="email" type="email" required autoComplete="email" />
          </label>
          <label>
            Phone / WhatsApp
            <input name="phone" type="tel" required minLength={6} maxLength={30} pattern={String.raw`[0-9+\(\)\- ]+`} autoComplete="tel" />
          </label>
        </div>
        <div className="form-row">
          <label>
            Country
            <input name="country" required defaultValue={currency === "LKR" ? "Sri Lanka" : ""} autoComplete="country-name" />
          </label>
          <label>
            Start date
            <input name="date" type="date" required min={isoDate(1)} defaultValue={isoDate(14)} />
          </label>
          <label>
            Travellers
            <input
              name="travellers"
              type="number"
              min={1}
              max={50}
              required
              value={travellers}
              onChange={(e) => setTravellers(Math.max(1, Number(e.target.value)))}
            />
          </label>
        </div>
        <label>
          Special requests (optional)
          <textarea name="requests" rows={3} maxLength={2000} placeholder="Pickup location, dietary needs, child seats…" />
        </label>

        <div className="total">
          <span>
            {formatPrice(unitPrice, currency)} × {travellers}
          </span>
          <strong>Total {formatPrice(unitPrice * travellers, currency)}</strong>
        </div>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        <button className="btn btn-primary" type="submit" disabled={submitting}>
          {submitting ? "Please wait…" : onlinePayment ? "Continue to payment" : "Send booking request"}
        </button>
        <p className="muted small">
          {onlinePayment
            ? "You'll pay securely on PayHere's payment page. We never see or store your card details."
            : "We'll confirm availability and send payment details within 24 hours."}
        </p>
      </form>
    </section>
  );
}

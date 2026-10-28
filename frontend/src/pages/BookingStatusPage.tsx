import { Link, useParams, useSearchParams } from "react-router-dom";
import { api } from "../api";
import { STATUS_LABELS } from "../bookingStatus";
import WhatsAppButton from "../components/WhatsAppButton";
import { formatPrice } from "../currency";
import { useFetch } from "../useFetch";
import { usePageMeta } from "../usePageMeta";

const MESSAGES: Partial<Record<string, string>> = {
  pending_payment:
    "We haven't received your payment yet. If you just paid, it can take a minute to confirm. Refresh this page shortly.",
  enquiry: "Thank you! We've received your booking request and will contact you within 24 hours to confirm.",
  paid: "Payment received, thank you! We'll be in touch to confirm your guide and vehicle.",
  confirmed: "Your tour is confirmed. We look forward to showing you Sri Lanka!",
  payment_failed: "Your payment didn't go through. Please contact us on WhatsApp and we'll help you complete it.",
  cancelled: "This booking has been cancelled.",
};

export default function BookingStatusPage() {
  const { reference = "" } = useParams();
  const [params] = useSearchParams();
  const { data: booking, error } = useFetch(() => api.booking(reference), [reference]);
  usePageMeta("Your booking");

  if (error) {
    return (
      <section className="container section narrow">
        <h1>Booking not found</h1>
        <p>Check the reference, or contact us on WhatsApp.</p>
        <WhatsAppButton />
      </section>
    );
  }
  if (!booking) return <p className="container section muted">Loading…</p>;

  return (
    <section className="container section narrow">
      <p className="eyebrow">Booking {booking.reference}</p>
      <h1>{booking.tour_title}</h1>
      {params.get("cancelled") && booking.status === "pending_payment" && (
        <p className="notice">Payment was cancelled. Your booking is saved, so you can contact us to pay later.</p>
      )}
      <p className="status-pill" data-status={booking.status}>
        {STATUS_LABELS[booking.status]}
      </p>
      <p>{MESSAGES[booking.status]}</p>
      <dl className="summary">
        <dt>Start date</dt>
        <dd>{new Date(booking.travel_date + "T00:00:00").toDateString()}</dd>
        <dt>Travellers</dt>
        <dd>{booking.travellers}</dd>
        <dt>Total</dt>
        <dd>{formatPrice(Number(booking.amount), booking.currency)}</dd>
      </dl>
      <p className="muted small">Keep your booking reference. You'll need it if you contact us.</p>
      <div className="hero-actions">
        <WhatsAppButton
          label="Message us about this booking"
          message={`Hi I&A Tours, I have a question about booking ${booking.reference}.`}
        />
        <Link to="/tours">Browse more tours</Link>
      </div>
    </section>
  );
}

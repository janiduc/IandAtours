import { Fragment, useState } from "react";
import { admin, api } from "../api";
import { STATUS_LABELS } from "../bookingStatus";
import { formatPrice } from "../currency";
import type { AdminBooking, AdminVehicle, BookingStatus, Guide } from "../types";
import { useFetch } from "../useFetch";
import AssistantPanel from "./AssistantPanel";
import { useRecords } from "./useRecords";

const STATUSES = Object.keys(STATUS_LABELS) as BookingStatus[];

function BookingDetail({
  booking,
  guides,
  vehicles,
  assistantEnabled,
  onSaved,
}: {
  booking: AdminBooking;
  guides: Guide[];
  vehicles: AdminVehicle[];
  assistantEnabled: boolean;
  onSaved: () => void;
}) {
  const [status, setStatus] = useState(booking.status);
  const [guideId, setGuideId] = useState(booking.guide_id ?? "");
  const [vehicleId, setVehicleId] = useState(booking.vehicle_id ?? "");
  const [notes, setNotes] = useState(booking.staff_notes);
  const [message, setMessage] = useState<string | null>(null);

  async function save() {
    try {
      await admin.updateBooking(booking.id, {
        status,
        guide_id: guideId === "" ? null : Number(guideId),
        vehicle_id: vehicleId === "" ? null : Number(vehicleId),
        staff_notes: notes,
      });
      setMessage("Saved");
      onSaved();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Couldn't save");
    }
  }

  return (
    <div className="booking-detail">
      <dl className="summary">
        <dt>Email</dt>
        <dd>
          <a href={`mailto:${booking.customer_email}`}>{booking.customer_email}</a>
        </dd>
        <dt>Phone</dt>
        <dd>{booking.customer_phone}</dd>
        <dt>Country</dt>
        <dd>{booking.country}</dd>
        <dt>Requests</dt>
        <dd>{booking.special_requests || "—"}</dd>
        <dt>Payments</dt>
        <dd>
          {booking.payments.length === 0
            ? "None yet"
            : booking.payments.map((p) => (
                <div key={p.id}>
                  {formatPrice(Number(p.amount), p.currency)} via {p.method || p.provider} (code {p.status_code},{" "}
                  {new Date(p.created_at).toLocaleString()})
                </div>
              ))}
        </dd>
      </dl>
      <div className="form-row">
        <label>
          Status
          <select value={status} onChange={(e) => setStatus(e.target.value as BookingStatus)}>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </label>
        <label>
          Guide
          <select value={guideId} onChange={(e) => setGuideId(e.target.value)}>
            <option value="">Not assigned</option>
            {guides
              .filter((g) => g.active || g.id === booking.guide_id)
              .map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name} ({g.languages.join(", ")})
                </option>
              ))}
          </select>
        </label>
        <label>
          Vehicle
          <select value={vehicleId} onChange={(e) => setVehicleId(e.target.value)}>
            <option value="">Not assigned</option>
            {vehicles
              .filter((v) => v.active || v.id === booking.vehicle_id)
              .map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name} ({v.seats} seats)
                </option>
              ))}
          </select>
        </label>
      </div>
      <label>
        Staff notes (not shown to the customer)
        <textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
      </label>
      <div className="form-actions">
        <button className="btn btn-primary" type="button" onClick={save}>
          Save changes
        </button>
        {message && <span className="muted">{message}</span>}
      </div>
      {assistantEnabled && (
        <AssistantPanel
          booking={booking}
          guides={guides}
          vehicles={vehicles}
          onUseSuggestion={(guide, vehicle) => {
            if (guide !== null) setGuideId(guide);
            if (vehicle !== null) setVehicleId(vehicle);
            setMessage("Suggestion filled in. Check it, then save.");
          }}
        />
      )}
    </div>
  );
}

export default function Bookings() {
  const [filter, setFilter] = useState("");
  const [openId, setOpenId] = useState<number | null>(null);
  const { records: bookings, error, reload } = useRecords(() => admin.bookings(filter || undefined), [filter]);
  const { records: guides } = useRecords(admin.guides);
  const { records: vehicles } = useRecords(admin.vehicles);
  const { data: assistant } = useFetch(() => api.assistantOptions(), []);

  return (
    <>
      <div className="section-head">
        <h1>Bookings</h1>
        <label className="inline">
          Show{" "}
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="">All bookings</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </label>
      </div>
      {error && <p className="error">{error}</p>}
      {bookings?.length === 0 && <p className="muted">No bookings yet.</p>}
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Reference</th>
              <th>Start date</th>
              <th>Tour</th>
              <th>Customer</th>
              <th>Pax</th>
              <th>Total</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {bookings?.map((b) => (
              <Fragment key={b.id}>
                <tr
                  className="clickable"
                  aria-expanded={openId === b.id}
                  onClick={() => setOpenId(openId === b.id ? null : b.id)}
                >
                  <td>{b.reference}</td>
                  <td>{b.travel_date}</td>
                  <td>{b.tour_title}</td>
                  <td>{b.customer_name}</td>
                  <td>{b.travellers}</td>
                  <td>{formatPrice(Number(b.amount), b.currency)}</td>
                  <td>
                    <span className="status-pill" data-status={b.status}>
                      {STATUS_LABELS[b.status]}
                    </span>
                  </td>
                </tr>
                {openId === b.id && guides && vehicles && (
                  <tr>
                    <td colSpan={7}>
                      <BookingDetail
                        booking={b}
                        guides={guides}
                        vehicles={vehicles}
                        assistantEnabled={Boolean(assistant?.enabled)}
                        onSaved={reload}
                      />
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

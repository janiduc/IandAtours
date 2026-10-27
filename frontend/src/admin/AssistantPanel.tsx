import { useState } from "react";
import { admin } from "../api";
import type { AdminBooking, AdminVehicle, AssistReply, Guide } from "../types";

// AI help for one booking. It only drafts and suggests; staff decide what to send and save.
export default function AssistantPanel({
  booking,
  guides,
  vehicles,
  onUseSuggestion,
}: {
  booking: AdminBooking;
  guides: Guide[];
  vehicles: AdminVehicle[];
  onUseSuggestion: (guideId: number | null, vehicleId: number | null) => void;
}) {
  const [instruction, setInstruction] = useState("");
  const [result, setResult] = useState<AssistReply | null>(null);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setBusy(true);
    setError(null);
    try {
      const reply = await admin.assist(booking.id, instruction);
      setResult(reply);
      setDraft(reply.draft_reply);
    } catch (e) {
      setError(e instanceof Error ? e.message : "The assistant couldn't help right now");
    } finally {
      setBusy(false);
    }
  }

  const proposal = result?.proposal;
  const guide = guides.find((g) => g.id === proposal?.guide_id);
  const vehicle = vehicles.find((v) => v.id === proposal?.vehicle_id);
  const phone = booking.customer_phone.replace(/\D/g, "");
  const subject = `Your I&A Tours booking ${booking.reference}`;

  return (
    <div className="assistant-panel">
      <h3>AI assistant</h3>
      <div className="form-row">
        <label>
          Anything to mention? (optional)
          <input
            value={instruction}
            maxLength={1000}
            onChange={(e) => setInstruction(e.target.value)}
            placeholder="e.g. They asked about airport pickup"
          />
        </label>
      </div>
      <div className="form-actions">
        <button type="button" className="btn btn-secondary" onClick={run} disabled={busy}>
          {busy ? "Thinking…" : result ? "Try again" : "Draft reply and suggest guide & vehicle"}
        </button>
      </div>
      {error && <p className="error">{error}</p>}
      {result && (
        <>
          {proposal && (guide || vehicle) && (
            <p className="suggestion">
              Suggested: {[guide?.name, vehicle?.name].filter(Boolean).join(" with the ")}
              {proposal.reason && <span className="muted"> ({proposal.reason})</span>}{" "}
              <button
                type="button"
                className="link-button"
                onClick={() => onUseSuggestion(proposal.guide_id, proposal.vehicle_id)}
              >
                Use suggestion
              </button>
            </p>
          )}
          <label>
            Draft message (edit before sending)
            <textarea rows={8} value={draft} onChange={(e) => setDraft(e.target.value)} />
          </label>
          <div className="form-actions">
            <a
              className="btn btn-whatsapp"
              href={`https://wa.me/${phone}?text=${encodeURIComponent(draft)}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Send on WhatsApp
            </a>
            <a
              className="btn btn-secondary"
              href={`mailto:${booking.customer_email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(draft)}`}
            >
              Send by email
            </a>
            <button type="button" className="link-button" onClick={() => navigator.clipboard?.writeText(draft)}>
              Copy
            </button>
          </div>
        </>
      )}
    </div>
  );
}

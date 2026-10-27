import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import WhatsAppButton from "../components/WhatsAppButton";
import type { ChatTurn, PlanReply } from "../types";
import { useFetch } from "../useFetch";

const STARTERS = [
  "10 days in August, family of 4, we love wildlife and beaches",
  "What can we do in one day from Colombo?",
  "Romantic 5-day trip for a couple, hill country and tea",
];

type Entry = ChatTurn & { tours?: PlanReply["tours"] };

export default function Plan() {
  const { data: options } = useFetch(() => api.assistantOptions(), []);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView?.({ behavior: "smooth", block: "end" });
  }, [entries, busy]);

  async function send(text: string) {
    const content = text.trim();
    if (!content || busy) return;
    const history: Entry[] = [...entries, { role: "user", content }];
    setEntries(history);
    setDraft("");
    setBusy(true);
    setError(null);
    try {
      // The API keeps no conversation state; send the recent turns each time.
      const turns = history.slice(-20).map(({ role, content }) => ({ role, content }));
      const reply = await api.plan(turns);
      setEntries([...history, { role: "assistant", content: reply.reply, tours: reply.tours }]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    send(draft);
  }

  if (options && !options.enabled) {
    return (
      <section className="container section narrow">
        <h1>Plan my trip</h1>
        <p>Our online trip planner is coming soon. In the meantime, tell us your dates and interests on WhatsApp and we'll plan it with you.</p>
        <WhatsAppButton />
      </section>
    );
  }

  return (
    <section className="container section narrow">
      <h1>Plan my trip</h1>
      <p className="muted">
        Tell our trip planner your dates, group and interests. It suggests I&amp;A Tours packages and prices. Our team
        confirms every booking.
      </p>

      <div className="chat" aria-live="polite">
        {entries.length === 0 && (
          <div className="starters">
            {STARTERS.map((s) => (
              <button key={s} type="button" className="chip" onClick={() => send(s)}>
                {s}
              </button>
            ))}
          </div>
        )}
        {entries.map((entry, i) => (
          <div key={i} className={`bubble ${entry.role}`}>
            <p>{entry.content}</p>
            {entry.tours && entry.tours.length > 0 && (
              <div className="bubble-tours">
                {entry.tours.map((t) => (
                  <Link key={t.slug} to={`/tours/${t.slug}`} className="tour-chip">
                    {t.title} · {t.duration_days} {t.duration_days === 1 ? "day" : "days"} →
                  </Link>
                ))}
              </div>
            )}
          </div>
        ))}
        {busy && <div className="bubble assistant muted">Planning…</div>}
        <div ref={endRef} />
      </div>

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <form className="chat-form" onSubmit={submit}>
        <label className="visually-hidden" htmlFor="plan-input">
          Your message
        </label>
        <input
          id="plan-input"
          value={draft}
          maxLength={2000}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="e.g. 7 days in March, 2 adults, culture and nature"
          disabled={busy}
        />
        <button className="btn btn-primary" type="submit" disabled={busy || !draft.trim()}>
          Send
        </button>
      </form>
      <p className="muted small">The planner can make mistakes. Prices and availability are confirmed when you book.</p>
    </section>
  );
}

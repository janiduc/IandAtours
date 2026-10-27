import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import App from "./App";
import { CurrencyProvider } from "./currency";

type Handler = (url: string, init?: RequestInit) => unknown;

function renderAt(path: string, handler: Handler) {
  const fetchMock = vi.fn(async (url: string, init?: RequestInit) => ({
    ok: true,
    status: 200,
    json: async () => handler(url, init),
  }));
  vi.stubGlobal("fetch", fetchMock);
  render(
    <MemoryRouter initialEntries={[path]}>
      <CurrencyProvider>
        <App />
      </CurrencyProvider>
    </MemoryRouter>,
  );
  return fetchMock;
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("trip planner", () => {
  it("chats and links to suggested tours", async () => {
    let call = 0;
    const fetchMock = renderAt("/plan", (url) => {
      if (url === "/api/assistant/options") return { enabled: true };
      if (url === "/api/assistant/plan") {
        call += 1;
        return call === 1
          ? { reply: "The Yala Wildlife Safari is perfect for leopards.", tours: [{ slug: "yala-safari", title: "Yala Wildlife Safari", duration_days: 2 }] }
          : { reply: "It costs $280 per person.", tours: [] };
      }
      return [];
    });

    expect(await screen.findByRole("link", { name: "Plan my trip" })).toBeInTheDocument();
    await userEvent.type(screen.getByLabelText("Your message"), "We want to see leopards");
    await userEvent.click(screen.getByRole("button", { name: "Send" }));
    expect(await screen.findByText(/perfect for leopards/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Yala Wildlife Safari · 2 days/ })).toHaveAttribute("href", "/tours/yala-safari");

    await userEvent.type(screen.getByLabelText("Your message"), "How much?");
    await userEvent.click(screen.getByRole("button", { name: "Send" }));
    await screen.findByText(/\$280 per person/);

    const planCalls = fetchMock.mock.calls.filter(([url]) => url === "/api/assistant/plan");
    const lastBody = JSON.parse(String(planCalls[1][1]!.body));
    expect(lastBody.messages.map((m: { role: string }) => m.role)).toEqual(["user", "assistant", "user"]);
  });

  it("offers WhatsApp when the planner is off", async () => {
    renderAt("/plan", (url) => (url === "/api/assistant/options" ? { enabled: false } : []));
    expect(await screen.findByText(/coming soon/)).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Plan my trip" })).not.toBeInTheDocument();
  });
});

describe("staff assistant", () => {
  it("fills in the suggested guide and vehicle without saving", async () => {
    const fetchMock = renderAt("/admin", (url) => {
      if (url === "/api/auth/me") return { id: 1, email: "a@x.lk", name: "Admin", role: "admin", active: true };
      if (url === "/api/assistant/options") return { enabled: true };
      if (url === "/api/admin/guides") return [{ id: 7, name: "Nimal", phone: "1", languages: ["German"], notes: "", active: true }];
      if (url === "/api/admin/vehicles")
        return [{ id: 2, name: "Toyota HiAce KDH", category: "Van", seats: 8, active: true, air_conditioned: true, description: "", image_url: "" }];
      if (url.startsWith("/api/admin/bookings/5/assist"))
        return { draft_reply: "Dear Anna, ... I&A Tours", proposal: { guide_id: 7, vehicle_id: 2, reason: "Speaks German" } };
      if (url.startsWith("/api/admin/bookings"))
        return [
          {
            id: 5, reference: "IA-AAAA2222", tour_id: 1, tour_title: "Yala Wildlife Safari", customer_name: "Anna Schmidt",
            customer_email: "anna@example.com", customer_phone: "+49 151 2345678", country: "Germany", travel_date: "2027-01-10",
            travellers: 4, currency: "USD", amount: "1120", status: "paid", special_requests: "", staff_notes: "",
            guide_id: null, vehicle_id: null, created_at: "2026-10-27T10:00:00Z", payments: [],
          },
        ];
      return [];
    });

    await userEvent.click(await screen.findByText("Anna Schmidt"));
    await userEvent.click(await screen.findByRole("button", { name: /Draft reply/ }));
    expect(await screen.findByDisplayValue(/Dear Anna/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Send on WhatsApp" }).getAttribute("href")).toMatch(/^https:\/\/wa\.me\/491512345678\?text=Dear%20Anna/);

    await userEvent.click(screen.getByRole("button", { name: "Use suggestion" }));
    const detail = screen.getByText("Staff notes (not shown to the customer)").closest(".booking-detail") as HTMLElement;
    expect(within(detail).getByLabelText("Guide")).toHaveValue("7");
    expect(within(detail).getByLabelText("Vehicle")).toHaveValue("2");
    expect(fetchMock.mock.calls.some(([, init]) => init?.method === "PATCH")).toBe(false);
  });
});

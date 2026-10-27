import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import App from "./App";
import { CurrencyProvider } from "./currency";

const tour = {
  id: 1,
  slug: "yala-safari",
  title: "Yala Wildlife Safari",
  summary: "",
  description: "",
  region: "South",
  duration_days: 2,
  price_usd: 280,
  price_lkr: 65000,
  highlights: [],
  image_url: "/x.jpg",
  featured: true,
};

type Handler = (url: string, init?: RequestInit) => { status?: number; body: unknown };

function renderAt(path: string, handler: Handler) {
  const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
    const { status = 200, body } = handler(url, init);
    return { ok: status < 400, status, json: async () => body };
  });
  vi.stubGlobal("fetch", fetchMock);
  render(
    <MemoryRouter initialEntries={[path]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
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
  vi.restoreAllMocks();
  localStorage.clear();
});

async function fillBookingForm() {
  await screen.findByRole("heading", { name: "Book Yala Wildlife Safari" });
  await userEvent.type(screen.getByLabelText("Full name"), "Anna Schmidt");
  await userEvent.type(screen.getByLabelText("Email"), "anna@example.com");
  await userEvent.type(screen.getByLabelText("Phone / WhatsApp"), "+49 151 2345678");
  await userEvent.type(screen.getByLabelText("Country"), "Germany");
}

describe("booking", () => {
  it("shows the total and sends the chosen currency", async () => {
    const fetchMock = renderAt("/book/yala-safari", (url, init) => {
      if (url === "/api/bookings/options") return { body: { online_payment: false } };
      if (url === "/api/bookings" && init?.method === "POST")
        return { status: 201, body: { reference: "IA-ABCD2345", status: "enquiry", amount: "560", currency: "USD", payment: null } };
      if (url.startsWith("/api/bookings/"))
        return {
          body: { reference: "IA-ABCD2345", status: "enquiry", tour_title: tour.title, travel_date: "2027-01-10", travellers: 2, amount: "560", currency: "USD" },
        };
      return { body: tour };
    });
    await fillBookingForm();
    expect(screen.getByText("Total $560")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Send booking request" }));
    expect(await screen.findByText("Enquiry received")).toBeInTheDocument();

    const [, init] = fetchMock.mock.calls.find(([url, init]) => url === "/api/bookings" && init?.method === "POST")!;
    expect(JSON.parse(String(init!.body))).toMatchObject({ tour_slug: "yala-safari", currency: "USD", travellers: 2 });
  });

  it("posts to PayHere when online payment is on", async () => {
    const submit = vi.spyOn(HTMLFormElement.prototype, "submit").mockImplementation(() => {});
    renderAt("/book/yala-safari", (url, init) => {
      if (url === "/api/bookings/options") return { body: { online_payment: true } };
      if (url === "/api/bookings" && init?.method === "POST")
        return {
          status: 201,
          body: {
            reference: "IA-ABCD2345",
            status: "pending_payment",
            amount: "560",
            currency: "USD",
            payment: { action: "https://sandbox.payhere.lk/pay/checkout", fields: { order_id: "IA-ABCD2345", hash: "X" } },
          },
        };
      return { body: tour };
    });
    await fillBookingForm();
    await userEvent.click(await screen.findByRole("button", { name: "Continue to payment" }));

    await waitFor(() => expect(submit).toHaveBeenCalled());
    const form = submit.mock.contexts[0] as HTMLFormElement;
    expect(form.action).toBe("https://sandbox.payhere.lk/pay/checkout");
    expect((form.elements.namedItem("order_id") as HTMLInputElement).value).toBe("IA-ABCD2345");
  });

  it("shows server validation errors", async () => {
    renderAt("/book/yala-safari", (url, init) => {
      if (url === "/api/bookings" && init?.method === "POST")
        return { status: 422, body: { detail: [{ loc: ["body", "travel_date"], msg: "Travel date can't be in the past" }] } };
      if (url === "/api/bookings/options") return { body: { online_payment: false } };
      return { body: tour };
    });
    await fillBookingForm();
    await userEvent.click(screen.getByRole("button", { name: "Send booking request" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("travel date: Travel date can't be in the past");
  });
});

describe("admin", () => {
  it("sends signed-out visitors to the sign-in page", async () => {
    renderAt("/admin", () => ({ status: 401, body: { detail: "Not signed in" } }));
    expect(await screen.findByRole("heading", { name: "Staff sign in" })).toBeInTheDocument();
  });

  it("hides staff management from non-admins", async () => {
    renderAt("/admin", (url) => {
      if (url === "/api/auth/me") return { body: { id: 2, email: "s@x.lk", name: "Sam", role: "staff", active: true } };
      return { body: [] };
    });
    expect(await screen.findByRole("heading", { name: "Bookings" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Staff" })).not.toBeInTheDocument();
  });
});

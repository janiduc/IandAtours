import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import App from "./App";
import { formatPhone, WHATSAPP_NUMBER, whatsappLink } from "./contact";
import { CurrencyProvider, formatPrice } from "./currency";
import type { Tour } from "./types";

const tour: Tour = {
  id: 1,
  slug: "yala-safari",
  title: "Yala Wildlife Safari",
  summary: "Leopards and elephants.",
  description: "Two days of safaris.",
  region: "South",
  duration_days: 2,
  price_usd: 280,
  price_lkr: 65000,
  highlights: ["Two jeep safaris"],
  image_url: "/images/tours/yala.jpg",
  featured: true,
};

function renderAt(path: string) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string) => ({
      ok: true,
      json: async () => (url.startsWith("/api/tours/") ? tour : url.startsWith("/api/tours") ? [tour] : []),
    })),
  );
  return render(
    <MemoryRouter initialEntries={[path]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <CurrencyProvider>
        <App />
      </CurrencyProvider>
    </MemoryRouter>,
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
  localStorage.clear();
});

describe("helpers", () => {
  it("formats prices in both currencies", () => {
    expect(formatPrice(280, "USD")).toBe("$280");
    expect(formatPrice(65000, "LKR")).toMatch(/LKR\s?65,000/);
  });

  it("builds a WhatsApp link with an encoded message", () => {
    expect(whatsappLink("Hi there", "+94 77 123 4567")).toBe("https://wa.me/94771234567?text=Hi%20there");
    expect(whatsappLink("Hi")).toBe(`https://wa.me/${WHATSAPP_NUMBER}?text=Hi`);
  });

  it("formats Sri Lankan numbers for display", () => {
    expect(formatPhone("94773974668")).toBe("+94 77 397 4668");
  });
});

describe("pages", () => {
  it("lists tours and switches prices to LKR for locals", async () => {
    renderAt("/tours");
    expect(await screen.findByText("Yala Wildlife Safari")).toBeInTheDocument();
    expect(screen.getByText(/\$280/)).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Sri Lankan (LKR)" }));
    expect(screen.getByText(/LKR\s?65,000/)).toBeInTheDocument();
  });

  it("shows a tour with a WhatsApp enquiry naming the tour", async () => {
    renderAt("/tours/yala-safari");
    const link = await screen.findByRole("link", { name: "Enquire on WhatsApp" });
    expect(decodeURIComponent(link.getAttribute("href")!)).toContain('"Yala Wildlife Safari"');
  });
});

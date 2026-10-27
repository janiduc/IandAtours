import { createContext, useContext, useState, type ReactNode } from "react";

// Foreign visitors pay in USD, Sri Lankan residents in LKR.
export type Currency = "USD" | "LKR";

const STORAGE_KEY = "iandatours.currency";

function initialCurrency(): Currency {
  try {
    return localStorage.getItem(STORAGE_KEY) === "LKR" ? "LKR" : "USD";
  } catch {
    return "USD";
  }
}

export function formatPrice(amount: number, currency: Currency): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

const CurrencyContext = createContext<{ currency: Currency; setCurrency: (c: Currency) => void }>({
  currency: "USD",
  setCurrency: () => {},
});

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setState] = useState<Currency>(initialCurrency);
  const setCurrency = (next: Currency) => {
    setState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Storage can be unavailable (private mode); the choice still applies for this visit.
    }
  };
  return <CurrencyContext.Provider value={{ currency, setCurrency }}>{children}</CurrencyContext.Provider>;
}

export const useCurrency = () => useContext(CurrencyContext);

import { formatPrice, useCurrency } from "../currency";
import type { Tour } from "../types";

export default function Price({ tour }: { tour: Pick<Tour, "price_usd" | "price_lkr"> }) {
  const { currency } = useCurrency();
  const amount = currency === "USD" ? tour.price_usd : tour.price_lkr;
  return (
    <span className="price">
      <small>from</small> {formatPrice(amount, currency)} <small>per person</small>
    </span>
  );
}

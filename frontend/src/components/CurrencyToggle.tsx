import { useCurrency, type Currency } from "../currency";

const OPTIONS: { value: Currency; label: string }[] = [
  { value: "USD", label: "Foreign visitor (USD)" },
  { value: "LKR", label: "Sri Lankan (LKR)" },
];

export default function CurrencyToggle() {
  const { currency, setCurrency } = useCurrency();
  return (
    <div className="currency-toggle" role="group" aria-label="Show prices for">
      {OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={currency === option.value}
          onClick={() => setCurrency(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

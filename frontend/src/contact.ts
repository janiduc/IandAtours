// Comma-separated, international format (e.g. 94773974668). The first number is used for chat buttons.
export const WHATSAPP_NUMBERS = (import.meta.env.VITE_WHATSAPP_NUMBERS ?? "94773974668,94773974669")
  .split(",")
  .map((n) => n.replace(/\D/g, ""))
  .filter(Boolean);

export const WHATSAPP_NUMBER = WHATSAPP_NUMBERS[0];

export function whatsappLink(message: string, number = WHATSAPP_NUMBER): string {
  return `https://wa.me/${number.replace(/\D/g, "")}?text=${encodeURIComponent(message)}`;
}

// 94773974668 -> +94 77 397 4668
export function formatPhone(number: string): string {
  const match = number.match(/^94(\d{2})(\d{3})(\d{4})$/);
  return match ? `+94 ${match[1]} ${match[2]} ${match[3]}` : `+${number}`;
}

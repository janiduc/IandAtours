export const WHATSAPP_NUMBER = import.meta.env.VITE_WHATSAPP_NUMBER ?? "94770000000";

export function whatsappLink(message: string, number = WHATSAPP_NUMBER): string {
  return `https://wa.me/${number.replace(/\D/g, "")}?text=${encodeURIComponent(message)}`;
}

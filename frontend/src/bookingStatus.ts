import type { BookingStatus } from "./types";

export const STATUS_LABELS: Record<BookingStatus, string> = {
  pending_payment: "Awaiting payment",
  enquiry: "Enquiry received",
  paid: "Paid",
  confirmed: "Confirmed",
  completed: "Completed",
  cancelled: "Cancelled",
  payment_failed: "Payment failed",
};

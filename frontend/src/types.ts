export interface Tour {
  id: number;
  slug: string;
  title: string;
  summary: string;
  description: string;
  region: string;
  duration_days: number;
  price_usd: number;
  price_lkr: number;
  highlights: string[];
  image_url: string;
  featured: boolean;
}

export interface Vehicle {
  id: number;
  name: string;
  category: string;
  seats: number;
  air_conditioned: boolean;
  description: string;
  image_url: string;
}

export type Currency = "USD" | "LKR";

export type BookingStatus =
  | "pending_payment"
  | "enquiry"
  | "paid"
  | "confirmed"
  | "completed"
  | "cancelled"
  | "payment_failed";

export interface BookingRequest {
  tour_slug: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  country: string;
  travel_date: string;
  travellers: number;
  currency: Currency;
  special_requests: string;
}

export interface BookingCreated {
  reference: string;
  status: BookingStatus;
  amount: string;
  currency: Currency;
  payment: { action: string; fields: Record<string, string> } | null;
}

export interface BookingPublic {
  reference: string;
  status: BookingStatus;
  tour_title: string;
  travel_date: string;
  travellers: number;
  amount: string;
  currency: Currency;
}

export interface AdminTour extends Tour {
  published: boolean;
}

export interface AdminVehicle extends Vehicle {
  active: boolean;
}

export interface Guide {
  id: number;
  name: string;
  phone: string;
  languages: string[];
  notes: string;
  active: boolean;
}

export interface Payment {
  id: number;
  provider: string;
  provider_payment_id: string;
  amount: string;
  currency: Currency;
  status_code: number;
  method: string;
  created_at: string;
}

export interface AdminBooking {
  id: number;
  reference: string;
  tour_id: number;
  tour_title: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  country: string;
  travel_date: string;
  travellers: number;
  currency: Currency;
  amount: string;
  status: BookingStatus;
  special_requests: string;
  staff_notes: string;
  guide_id: number | null;
  vehicle_id: number | null;
  created_at: string;
  payments: Payment[];
}

export type Role = "admin" | "staff";

export interface StaffUser {
  id: number;
  email: string;
  name: string;
  role: Role;
  active: boolean;
}

export interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

export interface PlanReply {
  reply: string;
  tours: { slug: string; title: string; duration_days: number }[];
}

export interface AssistReply {
  draft_reply: string;
  proposal: { guide_id: number | null; vehicle_id: number | null; reason: string } | null;
}

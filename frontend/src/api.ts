import type {
  AdminBooking,
  AssistReply,
  ChatTurn,
  PlanReply,
  AdminTour,
  AdminVehicle,
  BookingCreated,
  BookingPublic,
  BookingRequest,
  Guide,
  StaffUser,
  Tour,
  Vehicle,
} from "./types";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

function describe(detail: unknown): string {
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail) && detail.length > 0) {
    // FastAPI validation errors: [{ loc: [..., "field"], msg: "..." }]
    return detail
      .map((d: { loc?: unknown[]; msg?: string }) => {
        const field = String(d.loc?.[d.loc.length - 1] ?? "").replace(/_/g, " ");
        return field ? `${field}: ${d.msg}` : d.msg;
      })
      .join("; ");
  }
  return "Something went wrong. Please try again.";
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const response = await fetch(path, {
    method,
    credentials: "same-origin",
    headers: body === undefined ? undefined : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new ApiError(response.status, describe(data.detail));
  }
  return (response.status === 204 ? undefined : response.json()) as Promise<T>;
}

const get = <T>(path: string) => request<T>("GET", path);

export const api = {
  tours: (params: Record<string, string> = {}) => {
    const query = new URLSearchParams(params).toString();
    return get<Tour[]>(`/api/tours${query ? `?${query}` : ""}`);
  },
  tour: (slug: string) => get<Tour>(`/api/tours/${encodeURIComponent(slug)}`),
  vehicles: () => get<Vehicle[]>("/api/vehicles"),
  createBooking: (body: BookingRequest) => request<BookingCreated>("POST", "/api/bookings", body),
  assistantOptions: () => get<{ enabled: boolean }>("/api/assistant/options"),
  plan: (messages: ChatTurn[]) => request<PlanReply>("POST", "/api/assistant/plan", { messages }),
  bookingOptions: () => get<{ online_payment: boolean }>("/api/bookings/options"),
  booking: (reference: string) => get<BookingPublic>(`/api/bookings/${encodeURIComponent(reference)}`),
};

export const auth = {
  me: () => get<StaffUser>("/api/auth/me"),
  login: (email: string, password: string) => request<StaffUser>("POST", "/api/auth/login", { email, password }),
  logout: () => request<void>("POST", "/api/auth/logout"),
};

export const admin = {
  tours: () => get<AdminTour[]>("/api/admin/tours"),
  saveTour: ({ id, ...body }: Partial<AdminTour>) =>
    id ? request<AdminTour>("PUT", `/api/admin/tours/${id}`, body) : request<AdminTour>("POST", "/api/admin/tours", body),
  vehicles: () => get<AdminVehicle[]>("/api/admin/vehicles"),
  saveVehicle: ({ id, ...body }: Partial<AdminVehicle>) =>
    id
      ? request<AdminVehicle>("PUT", `/api/admin/vehicles/${id}`, body)
      : request<AdminVehicle>("POST", "/api/admin/vehicles", body),
  guides: () => get<Guide[]>("/api/admin/guides"),
  saveGuide: ({ id, ...body }: Partial<Guide>) =>
    id ? request<Guide>("PUT", `/api/admin/guides/${id}`, body) : request<Guide>("POST", "/api/admin/guides", body),
  bookings: (status?: string) => get<AdminBooking[]>(`/api/admin/bookings${status ? `?booking_status=${status}` : ""}`),
  updateBooking: (id: number, body: Partial<Pick<AdminBooking, "status" | "guide_id" | "vehicle_id" | "staff_notes">>) =>
    request<AdminBooking>("PATCH", `/api/admin/bookings/${id}`, body),
  assist: (bookingId: number, instruction: string) =>
    request<AssistReply>("POST", `/api/admin/bookings/${bookingId}/assist`, { instruction }),
  users: () => get<StaffUser[]>("/api/admin/users"),
  createUser: (body: { email: string; name: string; password: string; role: string }) =>
    request<StaffUser>("POST", "/api/admin/users", body),
  updateUser: (id: number, body: Partial<{ name: string; role: string; active: boolean; password: string }>) =>
    request<StaffUser>("PATCH", `/api/admin/users/${id}`, body),
};

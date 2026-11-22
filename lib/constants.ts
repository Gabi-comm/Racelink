// plain values, safe for client and server

export const ROLES = ["runner", "organizer", "admin"] as const;
export const GENDERS = ["Male", "Female", "Other"] as const;
export const TSHIRT_SIZES = ["XS", "S", "M", "L", "XL", "XXL", "XXXL"] as const;
export const EVENT_STATUSES = ["draft", "open", "closed", "cancelled"] as const;
export const BOOKING_STATUSES = ["pending", "approved", "rejected", "cancelled"] as const;
export const PAYMENT_STATUSES = ["pending", "approved", "rejected"] as const;
export const PAYMENT_METHODS = ["gcash", "bank"] as const;
export const REQUEST_STATUSES = ["pending", "approved", "rejected"] as const;

export type EventStatus = (typeof EVENT_STATUSES)[number];
export type TshirtSize = (typeof TSHIRT_SIZES)[number];
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];
export type RequestStatus = (typeof REQUEST_STATUSES)[number];

export const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  gcash: "GCash",
  bank: "Bank transfer",
};

export const EVENT_STATUS_LABEL: Record<EventStatus, string> = {
  draft: "Draft",
  open: "Open",
  closed: "Closed",
  cancelled: "Cancelled",
};

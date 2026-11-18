// plain values, safe for client and server

export const ROLES = ["runner", "organizer", "admin"] as const;
export const GENDERS = ["Male", "Female", "Other"] as const;
export const TSHIRT_SIZES = ["XS", "S", "M", "L", "XL", "XXL", "XXXL"] as const;
export const EVENT_STATUSES = ["draft", "open", "closed", "cancelled"] as const;
export const BOOKING_STATUSES = ["pending", "approved", "rejected", "cancelled"] as const;
export const PAYMENT_STATUSES = ["pending", "approved", "rejected"] as const;

export type EventStatus = (typeof EVENT_STATUSES)[number];
export type TshirtSize = (typeof TSHIRT_SIZES)[number];

export const EVENT_STATUS_LABEL: Record<EventStatus, string> = {
  draft: "Draft",
  open: "Open",
  closed: "Closed",
  cancelled: "Cancelled",
};

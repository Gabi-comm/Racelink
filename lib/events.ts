import type { EVENT_STATUSES, TSHIRT_SIZES } from "@/lib/constants";

export type PublicEvent = {
  id: number;
  title: string;
  description: string;
  location: string;
  eventDate: string;
  startTime: string | null;
  registrationCloses: string | null;
  capacity: number | null;
  status: (typeof EVENT_STATUSES)[number];
  registered: number;
  hasBanner: boolean;
  distances: { id: number; label: string; price: number }[];
  sizes: (typeof TSHIRT_SIZES)[number][];
  documents: { id: number; title: string }[];
};

const TZ = "Asia/Manila";
const toDate = (d: string) => new Date(`${d}T00:00:00+08:00`);

export function formatDate(d: string, style: "long" | "short" = "long") {
  return new Intl.DateTimeFormat("en-PH", {
    timeZone: TZ,
    weekday: style === "long" ? "short" : undefined,
    month: style === "long" ? "long" : "short",
    day: "numeric",
    year: "numeric",
  }).format(toDate(d));
}

export function dateParts(d: string) {
  const date = toDate(d);
  const part = (o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("en-PH", { timeZone: TZ, ...o }).format(date);
  return { day: part({ day: "numeric" }), month: part({ month: "short" }), weekday: part({ weekday: "short" }), year: part({ year: "numeric" }) };
}

export function monthKey(d: string) {
  return d.slice(0, 7);
}

export function monthLabel(key: string) {
  return new Intl.DateTimeFormat("en-PH", { timeZone: TZ, month: "long", year: "numeric" }).format(toDate(`${key}-01`));
}

export function formatTime(t: string | null) {
  if (!t) return null;
  const [h, m] = t.split(":").map(Number);
  return new Intl.DateTimeFormat("en-PH", { hour: "numeric", minute: "2-digit" }).format(new Date(2000, 0, 1, h, m));
}

export function formatPeso(n: number) {
  return new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", maximumFractionDigits: n % 1 ? 2 : 0 }).format(n);
}

export function priceFrom(e: Pick<PublicEvent, "distances">) {
  if (e.distances.length === 0) return null;
  return Math.min(...e.distances.map((d) => d.price));
}

export function distanceKm(label: string) {
  const n = parseFloat(label);
  return Number.isFinite(n) ? n : Infinity;
}

export function todayInManila() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(new Date());
}

export type Availability =
  | { open: true; slotsLeft: number | null }
  | { open: false; reason: string };

export function availability(e: PublicEvent, today = todayInManila()): Availability {
  if (e.status !== "open") return { open: false, reason: "Registration closed" };
  if (e.registrationCloses && e.registrationCloses < today) return { open: false, reason: "Registration closed" };
  if (e.capacity !== null) {
    const left = e.capacity - e.registered;
    if (left <= 0) return { open: false, reason: "Sold out" };
    return { open: true, slotsLeft: left };
  }
  return { open: true, slotsLeft: null };
}

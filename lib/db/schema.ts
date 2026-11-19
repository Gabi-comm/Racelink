import {
  boolean,
  check,
  date,
  decimal,
  index,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  time,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";
import { BOOKING_STATUSES, EVENT_STATUSES, GENDERS, PAYMENT_METHODS, PAYMENT_STATUSES, TSHIRT_SIZES } from "@/lib/constants";

export { BOOKING_STATUSES, EVENT_STATUSES, GENDERS, PAYMENT_STATUSES, ROLES, TSHIRT_SIZES } from "@/lib/constants";


const createdAt = () => timestamp("created_at", { fsp: 3 }).defaultNow().notNull();
const updatedAt = () =>
  timestamp("updated_at", { fsp: 3 })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull();

// auth (better auth + admin plugin)

export const user = mysqlTable("user", {
  id: varchar("id", { length: 36 }).primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  role: varchar("role", { length: 20 }).default("runner").notNull(),
  banned: boolean("banned").default(false),
  banReason: text("ban_reason"),
  banExpires: timestamp("ban_expires", { fsp: 3 }),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const session = mysqlTable(
  "session",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    expiresAt: timestamp("expires_at", { fsp: 3 }).notNull(),
    token: varchar("token", { length: 255 }).notNull().unique(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: varchar("user_id", { length: 36 })
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    impersonatedBy: text("impersonated_by"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("session_user_id_idx").on(t.userId)],
);

export const account = mysqlTable(
  "account",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: varchar("user_id", { length: 36 })
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at", { fsp: 3 }),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { fsp: 3 }),
    scope: text("scope"),
    password: text("password"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("account_user_id_idx").on(t.userId)],
);

export const verification = mysqlTable(
  "verification",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    identifier: varchar("identifier", { length: 255 }).notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at", { fsp: 3 }).notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("verification_identifier_idx").on(t.identifier)],
);

// racelink

export const runnerProfiles = mysqlTable("runner_profiles", {
  userId: varchar("user_id", { length: 36 })
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  phone: varchar("phone", { length: 30 }),
  address: varchar("address", { length: 255 }),
  gender: mysqlEnum("gender", GENDERS),
  birthdate: date("birthdate", { mode: "string" }),
  emergencyName: varchar("emergency_name", { length: 100 }),
  emergencyPhone: varchar("emergency_phone", { length: 30 }),
  updatedAt: updatedAt(),
});

export const events = mysqlTable(
  "events",
  {
    id: int("id").autoincrement().primaryKey(),
    title: varchar("title", { length: 150 }).notNull(),
    description: text("description").notNull(),
    location: varchar("location", { length: 255 }).notNull(),
    eventDate: date("event_date", { mode: "string" }).notNull(),
    startTime: time("start_time"),
    registrationCloses: date("registration_closes", { mode: "string" }),
    capacity: int("capacity"),
    paymentMethod: mysqlEnum("payment_method", PAYMENT_METHODS),
    paymentBank: varchar("payment_bank", { length: 100 }),
    paymentAccountName: varchar("payment_account_name", { length: 150 }),
    paymentAccountNumber: varchar("payment_account_number", { length: 50 }),
    paymentInstructions: text("payment_instructions"),
    bannerKey: varchar("banner_key", { length: 255 }),
    status: mysqlEnum("status", EVENT_STATUSES).default("open").notNull(),
    organizerId: varchar("organizer_id", { length: 36 })
      .notNull()
      .references(() => user.id, { onDelete: "restrict" }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index("events_date_idx").on(t.eventDate),
    index("events_organizer_idx").on(t.organizerId),
    check("events_capacity_check", sql`${t.capacity} IS NULL OR ${t.capacity} > 0`),
  ],
);

export const eventDistances = mysqlTable(
  "event_distances",
  {
    id: int("id").autoincrement().primaryKey(),
    eventId: int("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    label: varchar("label", { length: 20 }).notNull(),
    price: decimal("price", { precision: 10, scale: 2, mode: "number" }).notNull(),
    slots: int("slots"),
  },
  (t) => [
    uniqueIndex("event_distances_event_label_uq").on(t.eventId, t.label),
    check("event_distances_price_check", sql`${t.price} >= 0`),
  ],
);

export const eventSizes = mysqlTable(
  "event_sizes",
  {
    id: int("id").autoincrement().primaryKey(),
    eventId: int("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    size: mysqlEnum("size", TSHIRT_SIZES).notNull(),
  },
  (t) => [uniqueIndex("event_sizes_event_size_uq").on(t.eventId, t.size)],
);

export const bookings = mysqlTable(
  "bookings",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: varchar("user_id", { length: 36 })
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    eventId: int("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    distanceId: int("distance_id").references(() => eventDistances.id, { onDelete: "set null" }),
    distanceLabel: varchar("distance_label", { length: 20 }).notNull(),
    price: decimal("price", { precision: 10, scale: 2, mode: "number" }).notNull(),
    tshirtSize: mysqlEnum("tshirt_size", TSHIRT_SIZES).notNull(),
    status: mysqlEnum("status", BOOKING_STATUSES).default("pending").notNull(),
    bibNumber: int("bib_number"),
    attended: boolean("attended").default(false).notNull(),
    checkedInAt: timestamp("checked_in_at", { fsp: 3 }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    uniqueIndex("bookings_user_event_uq").on(t.userId, t.eventId),
    uniqueIndex("bookings_event_bib_uq").on(t.eventId, t.bibNumber),
    index("bookings_status_idx").on(t.status),
  ],
);

export const paymentProofs = mysqlTable(
  "payment_proofs",
  {
    id: int("id").autoincrement().primaryKey(),
    bookingId: int("booking_id")
      .notNull()
      .references(() => bookings.id, { onDelete: "cascade" }),
    fileKey: varchar("file_key", { length: 255 }).notNull(),
    amount: decimal("amount", { precision: 10, scale: 2, mode: "number" }).notNull(),
    referenceNo: varchar("reference_no", { length: 100 }),
    status: mysqlEnum("status", PAYMENT_STATUSES).default("pending").notNull(),
    reviewNote: varchar("review_note", { length: 255 }),
    reviewedBy: varchar("reviewed_by", { length: 36 }).references(() => user.id, { onDelete: "set null" }),
    reviewedAt: timestamp("reviewed_at", { fsp: 3 }),
    createdAt: createdAt(),
  },
  (t) => [
    index("payment_proofs_booking_idx").on(t.bookingId),
    index("payment_proofs_status_idx").on(t.status),
    check("payment_proofs_amount_check", sql`${t.amount} > 0`),
  ],
);

export const eventDocuments = mysqlTable(
  "event_documents",
  {
    id: int("id").autoincrement().primaryKey(),
    eventId: int("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 150 }).notNull(),
    fileKey: varchar("file_key", { length: 255 }).notNull(),
    uploadedBy: varchar("uploaded_by", { length: 36 }).references(() => user.id, { onDelete: "set null" }),
    createdAt: createdAt(),
  },
  (t) => [index("event_documents_event_idx").on(t.eventId)],
);

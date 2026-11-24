import "server-only";
import { desc, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { refundRequests } from "@/lib/db/schema";

export type Refund = Awaited<ReturnType<typeof selectRefunds>>[number];

function selectRefunds(bookingIds: number[]) {
  return db
    .select({
      id: refundRequests.id,
      bookingId: refundRequests.bookingId,
      reason: refundRequests.reason,
      email: refundRequests.email,
      phone: refundRequests.phone,
      amount: refundRequests.amount,
      status: refundRequests.status,
      processedAt: refundRequests.processedAt,
      createdAt: refundRequests.createdAt,
    })
    .from(refundRequests)
    .where(inArray(refundRequests.bookingId, bookingIds))
    .orderBy(desc(refundRequests.id));
}

// latest refund per booking. A re-registration resets the booking's createdAt,
// so refunds older than that belong to the previous sign-up and are skipped.
export async function currentRefunds(rows: { id: number; createdAt: Date }[]) {
  const map = new Map<number, Refund>();
  if (rows.length === 0) return map;
  const since = new Map(rows.map((r) => [r.id, r.createdAt.getTime()]));
  for (const r of await selectRefunds(rows.map((r) => r.id))) {
    if (!map.has(r.bookingId) && r.createdAt.getTime() >= (since.get(r.bookingId) ?? 0)) map.set(r.bookingId, r);
  }
  return map;
}

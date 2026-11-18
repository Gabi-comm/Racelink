import "server-only";
import { connection } from "next/server";
import { desc, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { user } from "@/lib/db/schema";

export async function getUsers() {
  await connection();
  return db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      banned: user.banned,
      banReason: user.banReason,
      createdAt: user.createdAt,
      bookings: sql<number>`(SELECT COUNT(*) FROM bookings AS b WHERE b.user_id = ${user}.id AND b.status <> 'cancelled')`.mapWith(Number),
      events: sql<number>`(SELECT COUNT(*) FROM events AS e WHERE e.organizer_id = ${user}.id)`.mapWith(Number),
    })
    .from(user)
    .orderBy(desc(user.createdAt));
}

export type AdminUser = Awaited<ReturnType<typeof getUsers>>[number];

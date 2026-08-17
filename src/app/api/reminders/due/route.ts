import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { reminders } from "@/db/schema";
import { eq, and, lte, sql } from "drizzle-orm";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = parseInt(session.user.id, 10);

    // Query active reminders where due_date - remind_before_days <= today
    const dueReminders = await db
      .select()
      .from(reminders)
      .where(
        and(
          eq(reminders.userId, userId),
          eq(reminders.status, "active"),
          sql`${reminders.dueDate} - (${reminders.remindBeforeDays} || ' days')::interval <= CURRENT_DATE`
        )
      )
      .orderBy(reminders.dueDate);

    return NextResponse.json(dueReminders);
  } catch (err: any) {
    console.error("GET /api/reminders/due error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

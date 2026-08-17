export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { reminders } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = parseInt(session.user.id, 10);

    const { searchParams } = new URL(req.url);
    const typeFilter = searchParams.get("type"); // 'bill' | 'manual'
    const statusFilter = searchParams.get("status"); // 'active' | 'paused' | 'done'

    const conditions = [eq(reminders.userId, userId)];

    if (typeFilter && (typeFilter === "bill" || typeFilter === "manual")) {
      conditions.push(eq(reminders.type, typeFilter));
    }

    if (statusFilter && (statusFilter === "active" || statusFilter === "paused" || statusFilter === "done")) {
      conditions.push(eq(reminders.status, statusFilter));
    }

    const reminderList = await db
      .select()
      .from(reminders)
      .where(and(...conditions))
      .orderBy(reminders.dueDate, desc(reminders.id));

    return NextResponse.json(reminderList);
  } catch (err: any) {
    console.error("GET /api/reminders error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

function parseOptionalInt(val: any): number | null {
  if (val === null || val === undefined || val === "" || val === "null") {
    return null;
  }
  const parsed = typeof val === "number" ? val : parseInt(String(val), 10);
  return isNaN(parsed) ? null : parsed;
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = parseInt(session.user.id, 10);

    const body = await req.json();
    const {
      type,
      title,
      notes,
      amount,
      categoryId,
      locationId,
      vehicleId,
      dueDate,
      recurrence,
      recurrenceDay,
      recurrenceIntervalDays,
      remindBeforeDays,
    } = body;

    if (!type || !title || !dueDate) {
      return NextResponse.json({ error: "Missing required fields (type, title, dueDate)" }, { status: 400 });
    }

    const inserted = await db
      .insert(reminders)
      .values({
        userId,
        type,
        title,
        notes: notes || null,
        amount: type === "bill" && amount ? String(amount) : null,
        categoryId: parseOptionalInt(categoryId),
        locationId: parseOptionalInt(locationId),
        vehicleId: parseOptionalInt(vehicleId),
        dueDate,
        recurrence: recurrence || "none",
        recurrenceDay: parseOptionalInt(recurrenceDay),
        recurrenceIntervalDays: parseOptionalInt(recurrenceIntervalDays),
        remindBeforeDays: parseOptionalInt(remindBeforeDays) ?? 1,
        status: "active",
      })
      .returning();

    return NextResponse.json(inserted[0]);
  } catch (err: any) {
    console.error("POST /api/reminders error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

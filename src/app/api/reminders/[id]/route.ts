import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { reminders, expenses } from "@/db/schema";
import { eq, and } from "drizzle-orm";

function parseOptionalInt(val: any): number | null {
  if (val === null || val === undefined || val === "" || val === "null") {
    return null;
  }
  const parsed = typeof val === "number" ? val : parseInt(String(val), 10);
  return isNaN(parsed) ? null : parsed;
}

// Calculate next due date based on recurrence pattern
function getNextDueDate(currentDueDateStr: string, recurrence: string, recurrenceDay?: number | null, intervalDays?: number | null): string {
  const dateObj = new Date(currentDueDateStr + "T00:00:00");
  
  if (recurrence === "weekly") {
    dateObj.setDate(dateObj.getDate() + 7);
  } else if (recurrence === "monthly") {
    dateObj.setMonth(dateObj.getMonth() + 1);
    if (recurrenceDay && recurrenceDay >= 1 && recurrenceDay <= 31) {
      const maxDaysInMonth = new Date(dateObj.getFullYear(), dateObj.getMonth() + 1, 0).getDate();
      dateObj.setDate(Math.min(recurrenceDay, maxDaysInMonth));
    }
  } else if (recurrence === "yearly") {
    dateObj.setFullYear(dateObj.getFullYear() + 1);
  } else if (recurrence === "custom_days" && intervalDays && intervalDays > 0) {
    dateObj.setDate(dateObj.getDate() + intervalDays);
  }

  const yyyy = dateObj.getFullYear();
  const mm = String(dateObj.getMonth() + 1).padStart(2, "0");
  const dd = String(dateObj.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = parseInt(session.user.id, 10);
    const reminderId = parseInt(params.id, 10);

    const existing = await db
      .select()
      .from(reminders)
      .where(and(eq(reminders.id, reminderId), eq(reminders.userId, userId)))
      .limit(1);

    if (!existing.length) {
      return NextResponse.json({ error: "Reminder not found" }, { status: 404 });
    }

    const currentReminder = existing[0];
    const body = await req.json();

    // Check if this action is marking as done / paid
    if (body.action === "mark_done") {
      // 1. If logExpense option is requested for bill
      if (body.logExpense && currentReminder.amount && body.locationId) {
        await db.insert(expenses).values({
          userId,
          amount: currentReminder.amount,
          rawText: currentReminder.title,
          note: body.expenseNote || currentReminder.notes || "",
          categoryId: currentReminder.categoryId,
          vehicleId: currentReminder.vehicleId,
          locationId: Number(body.locationId),
          date: body.paidDate || new Date().toISOString().split("T")[0],
          isPrepaid: Boolean(body.isPrepaid),
          coverageDays: parseOptionalInt(body.coverageDays) ?? currentReminder.recurrenceIntervalDays,
        });
      }

      // 2. Advance due date or mark completed permanently
      if (currentReminder.recurrence && currentReminder.recurrence !== "none") {
        const nextDueDate = getNextDueDate(
          currentReminder.dueDate,
          currentReminder.recurrence,
          currentReminder.recurrenceDay,
          currentReminder.recurrenceIntervalDays
        );

        const updated = await db
          .update(reminders)
          .set({
            dueDate: nextDueDate,
            status: "active",
            updatedAt: new Date(),
          })
          .where(eq(reminders.id, reminderId))
          .returning();

        return NextResponse.json(updated[0]);
      } else {
        const updated = await db
          .update(reminders)
          .set({
            status: "done",
            updatedAt: new Date(),
          })
          .where(eq(reminders.id, reminderId))
          .returning();

        return NextResponse.json(updated[0]);
      }
    }

    // General update path
    const updatePayload: any = {
      updatedAt: new Date(),
    };

    if (body.title !== undefined) updatePayload.title = body.title;
    if (body.notes !== undefined) updatePayload.notes = body.notes;
    if (body.amount !== undefined) updatePayload.amount = body.amount ? String(body.amount) : null;
    if (body.categoryId !== undefined) updatePayload.categoryId = parseOptionalInt(body.categoryId);
    if (body.locationId !== undefined) updatePayload.locationId = parseOptionalInt(body.locationId);
    if (body.vehicleId !== undefined) updatePayload.vehicleId = parseOptionalInt(body.vehicleId);
    if (body.dueDate !== undefined) updatePayload.dueDate = body.dueDate;
    if (body.recurrence !== undefined) updatePayload.recurrence = body.recurrence;
    if (body.recurrenceDay !== undefined) updatePayload.recurrenceDay = parseOptionalInt(body.recurrenceDay);
    if (body.recurrenceIntervalDays !== undefined) updatePayload.recurrenceIntervalDays = parseOptionalInt(body.recurrenceIntervalDays);
    if (body.remindBeforeDays !== undefined) updatePayload.remindBeforeDays = parseOptionalInt(body.remindBeforeDays) ?? 1;
    if (body.status !== undefined) updatePayload.status = body.status;

    const updated = await db
      .update(reminders)
      .set(updatePayload)
      .where(eq(reminders.id, reminderId))
      .returning();

    return NextResponse.json(updated[0]);
  } catch (err: any) {
    console.error("PATCH /api/reminders/:id error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = parseInt(session.user.id, 10);
    const reminderId = parseInt(params.id, 10);

    const deleted = await db
      .delete(reminders)
      .where(and(eq(reminders.id, reminderId), eq(reminders.userId, userId)))
      .returning();

    if (!deleted.length) {
      return NextResponse.json({ error: "Reminder not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, id: reminderId });
  } catch (err: any) {
    console.error("DELETE /api/reminders/:id error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

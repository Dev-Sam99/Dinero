import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { expenses } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = parseInt(session.user.id, 10);

    const { id } = await params;
    const body = await req.json();
    const expenseId = parseInt(id, 10);

    const updateData: any = {};
    if (body.amount !== undefined) updateData.amount = String(body.amount);
    if (body.rawText !== undefined) updateData.rawText = body.rawText;
    if (body.note !== undefined) updateData.note = body.note;
    if (body.categoryId !== undefined) updateData.categoryId = body.categoryId;
    if (body.vehicleId !== undefined) updateData.vehicleId = body.vehicleId;
    if (body.familyMemberId !== undefined) updateData.familyMemberId = body.familyMemberId;
    if (body.locationId !== undefined) updateData.locationId = Number(body.locationId);
    if (body.date !== undefined) updateData.date = body.date;

    const updated = await db
      .update(expenses)
      .set(updateData)
      .where(and(eq(expenses.id, expenseId), eq(expenses.userId, userId)))
      .returning();

    if (updated.length === 0) {
      return NextResponse.json({ error: "Expense not found or unauthorized" }, { status: 404 });
    }

    return NextResponse.json(updated[0]);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = parseInt(session.user.id, 10);

    const { id } = await params;
    const expenseId = parseInt(id, 10);

    const deleted = await db
      .delete(expenses)
      .where(and(eq(expenses.id, expenseId), eq(expenses.userId, userId)))
      .returning();

    if (deleted.length === 0) {
      return NextResponse.json({ error: "Expense not found or unauthorized" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

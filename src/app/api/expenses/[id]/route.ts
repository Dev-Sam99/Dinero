import { NextResponse } from "next/server";
import { db } from "../../../../db";
import { expenses } from "../../../../db/schema";
import { eq } from "drizzle-orm";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
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
      .where(eq(expenses.id, expenseId))
      .returning();

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
    const { id } = await params;
    const expenseId = parseInt(id, 10);

    await db.delete(expenses).where(eq(expenses.id, expenseId));
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

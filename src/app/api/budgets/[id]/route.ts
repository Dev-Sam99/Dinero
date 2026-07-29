import { NextResponse } from "next/server";
import { db } from "../../../../db";
import { categoryBudgets } from "../../../../db/schema";
import { eq } from "drizzle-orm";

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const budgetId = parseInt(params.id, 10);
    if (isNaN(budgetId)) {
      return NextResponse.json({ error: "Invalid budget ID" }, { status: 400 });
    }

    const body = await req.json();
    const { monthlyBudget, effectiveFrom, effectiveTo, note } = body;

    if (!monthlyBudget || !effectiveFrom) {
      return NextResponse.json(
        { error: "monthlyBudget and effectiveFrom are required" },
        { status: 400 }
      );
    }

    const updated = await db
      .update(categoryBudgets)
      .set({
        monthlyBudget: String(monthlyBudget),
        effectiveFrom: effectiveFrom,
        effectiveTo: effectiveTo || null,
        note: note !== undefined ? (note || null) : undefined,
      })
      .where(eq(categoryBudgets.id, budgetId))
      .returning();

    if (updated.length === 0) {
      return NextResponse.json({ error: "Budget row not found" }, { status: 404 });
    }

    return NextResponse.json(updated[0]);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

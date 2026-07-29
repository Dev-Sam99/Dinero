import { NextResponse } from "next/server";
import { db } from "../../../../../db";
import { categoryBudgets } from "../../../../../db/schema";
import { eq, and, isNull } from "drizzle-orm";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const categoryId = parseInt(params.id, 10);
    if (isNaN(categoryId)) {
      return NextResponse.json({ error: "Invalid category ID" }, { status: 400 });
    }
    const history = await db
      .select()
      .from(categoryBudgets)
      .where(eq(categoryBudgets.categoryId, categoryId));
    return NextResponse.json(history);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const categoryId = parseInt(params.id, 10);
    if (isNaN(categoryId)) {
      return NextResponse.json({ error: "Invalid category ID" }, { status: 400 });
    }

    const body = await req.json();
    const { monthlyBudget, effectiveFrom, effectiveTo, note } = body;

    if (!monthlyBudget || !effectiveFrom) {
      return NextResponse.json(
        { error: "monthlyBudget and effectiveFrom are required" },
        { status: 400 }
      );
    }

    // Business Logic: Only one row per category should have effectiveTo = null at a time.
    // Close current open row (set effectiveTo to day before new effectiveFrom)
    const openBudgets = await db
      .select()
      .from(categoryBudgets)
      .where(
        and(
          eq(categoryBudgets.categoryId, categoryId),
          isNull(categoryBudgets.effectiveTo)
        )
      );

    if (openBudgets.length > 0) {
      const prevOpen = openBudgets[0];
      const effFromDate = new Date(effectiveFrom);
      const dayBefore = new Date(effFromDate);
      dayBefore.setDate(dayBefore.getDate() - 1);
      const dayBeforeStr = dayBefore.toISOString().split("T")[0];

      await db
        .update(categoryBudgets)
        .set({ effectiveTo: dayBeforeStr })
        .where(eq(categoryBudgets.id, prevOpen.id));
    }

    const inserted = await db
      .insert(categoryBudgets)
      .values({
        categoryId: categoryId,
        monthlyBudget: String(monthlyBudget),
        effectiveFrom: effectiveFrom,
        effectiveTo: effectiveTo || null,
        note: note || null,
      })
      .returning();

    return NextResponse.json(inserted[0]);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

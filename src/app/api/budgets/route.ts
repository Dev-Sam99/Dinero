import { NextResponse } from "next/server";
import { db } from "../../../db";
import { categoryBudgets } from "../../../db/schema";
import { eq, and, isNull, lte, or, gte } from "drizzle-orm";

export async function GET(req: Request) {
  try {
    const allBudgets = await db.select().from(categoryBudgets);
    return NextResponse.json(allBudgets);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { categoryId, monthlyBudget, effectiveFrom, effectiveTo, note } = body;

    if (!categoryId || !monthlyBudget || !effectiveFrom) {
      return NextResponse.json({ error: "categoryId, monthlyBudget, effectiveFrom required" }, { status: 400 });
    }

    const catIdNum = Number(categoryId);

    // Business Logic: Only one row per category should have effectiveTo = null at a time.
    // Changing a budget: close current open row (set effectiveTo to day before new effectiveFrom), then insert new row.
    const openBudgets = await db
      .select()
      .from(categoryBudgets)
      .where(and(eq(categoryBudgets.categoryId, catIdNum), isNull(categoryBudgets.effectiveTo)));

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
        categoryId: catIdNum,
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

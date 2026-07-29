import { NextResponse } from "next/server";
import { db } from "../../../db";
import { categoryBudgets, budgetOverrides } from "../../../db/schema";
import { eq, and } from "drizzle-orm";

export async function GET(req: Request) {
  try {
    const overrides = await db.select().from(budgetOverrides);
    return NextResponse.json(overrides);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { categoryId, year, month, amount, note } = body;

    if (!categoryId || !year || !month || amount === undefined || amount === null) {
      return NextResponse.json(
        { error: "categoryId, year, month, and amount are required" },
        { status: 400 }
      );
    }

    const catIdNum = Number(categoryId);
    const yearNum = Number(year);
    const monthNum = Number(month);
    const parsedAmount = String(amount);

    // Upsert (Check if override exists for categoryId, year, month)
    const existing = await db
      .select()
      .from(budgetOverrides)
      .where(
        and(
          eq(budgetOverrides.categoryId, catIdNum),
          eq(budgetOverrides.year, yearNum),
          eq(budgetOverrides.month, monthNum)
        )
      );

    if (existing.length > 0) {
      const updated = await db
        .update(budgetOverrides)
        .set({
          amount: parsedAmount,
          note: note !== undefined ? (note || null) : undefined,
        })
        .where(eq(budgetOverrides.id, existing[0].id))
        .returning();

      return NextResponse.json(updated[0]);
    } else {
      const inserted = await db
        .insert(budgetOverrides)
        .values({
          categoryId: catIdNum,
          year: yearNum,
          month: monthNum,
          amount: parsedAmount,
          note: note || null,
        })
        .returning();

      return NextResponse.json(inserted[0]);
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const categoryId = searchParams.get("categoryId");
    const year = searchParams.get("year");
    const month = searchParams.get("month");

    if (id) {
      await db.delete(budgetOverrides).where(eq(budgetOverrides.id, Number(id)));
      return NextResponse.json({ success: true });
    }

    if (categoryId && year && month) {
      await db
        .delete(budgetOverrides)
        .where(
          and(
            eq(budgetOverrides.categoryId, Number(categoryId)),
            eq(budgetOverrides.year, Number(year)),
            eq(budgetOverrides.month, Number(month))
          )
        );
      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { error: "Provide either id or categoryId, year, and month" },
      { status: 400 }
    );
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { db } from "../../../db";
import { expenses, categories, locations, vehicles } from "../../../db/schema";
import { desc, eq, count } from "drizzle-orm";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const pageParam = searchParams.get("page");
    const pageSizeParam = searchParams.get("pageSize");
    const fetchAll = searchParams.get("all") === "true";

    if (fetchAll) {
      const allExpenses = await db
        .select({
          id: expenses.id,
          amount: expenses.amount,
          rawText: expenses.rawText,
          note: expenses.note,
          categoryId: expenses.categoryId,
          vehicleId: expenses.vehicleId,
          familyMemberId: expenses.familyMemberId,
          locationId: expenses.locationId,
          date: expenses.date,
          createdAt: expenses.createdAt,
        })
        .from(expenses)
        .orderBy(desc(expenses.date), desc(expenses.id));

      return NextResponse.json(allExpenses);
    }

    const page = Math.max(1, parseInt(pageParam || "1", 10) || 1);
    const pageSize = Math.max(1, parseInt(pageSizeParam || "10", 10) || 10);
    const offset = (page - 1) * pageSize;

    const [totalCountResult] = await db
      .select({ count: count() })
      .from(expenses);

    const totalCount = Number(totalCountResult?.count || 0);

    const fetchedExpenses = await db
      .select({
        id: expenses.id,
        amount: expenses.amount,
        rawText: expenses.rawText,
        note: expenses.note,
        categoryId: expenses.categoryId,
        vehicleId: expenses.vehicleId,
        familyMemberId: expenses.familyMemberId,
        locationId: expenses.locationId,
        date: expenses.date,
        createdAt: expenses.createdAt,
      })
      .from(expenses)
      .orderBy(desc(expenses.date), desc(expenses.id))
      .limit(pageSize)
      .offset(offset);

    return NextResponse.json({
      expenses: fetchedExpenses,
      totalCount,
      page,
      pageSize,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { amount, rawText, note, categoryId, vehicleId, familyMemberId, locationId, date } = body;

    if (!amount || !locationId || !date) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const inserted = await db
      .insert(expenses)
      .values({
        amount: String(amount),
        rawText: rawText || "",
        note: note || "",
        categoryId: categoryId || null,
        vehicleId: vehicleId || null,
        familyMemberId: familyMemberId || null,
        locationId: Number(locationId),
        date: date,
      })
      .returning();

    return NextResponse.json(inserted[0]);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { expenses } from "@/db/schema";
import { desc, eq, count } from "drizzle-orm";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = parseInt(session.user.id, 10);

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
        .where(eq(expenses.userId, userId))
        .orderBy(desc(expenses.date), desc(expenses.id));

      return NextResponse.json(allExpenses);
    }

    const page = Math.max(1, parseInt(pageParam || "1", 10) || 1);
    const pageSize = Math.max(1, parseInt(pageSizeParam || "10", 10) || 10);
    const offset = (page - 1) * pageSize;

    const [totalCountResult] = await db
      .select({ count: count() })
      .from(expenses)
      .where(eq(expenses.userId, userId));

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
      .where(eq(expenses.userId, userId))
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
    console.error("GET /api/expenses error:", err);
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
    console.log("POST /api/expenses incoming body:", JSON.stringify(body));

    const { amount, rawText, note, categoryId, vehicleId, familyMemberId, locationId, date } = body;

    if (!amount || !locationId || !date) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const cleanCategoryId = parseOptionalInt(categoryId);
    const cleanVehicleId = parseOptionalInt(vehicleId);
    const cleanFamilyMemberId = parseOptionalInt(familyMemberId);
    const cleanLocationId = Number(locationId);

    const inserted = await db
      .insert(expenses)
      .values({
        userId,
        amount: String(amount),
        rawText: rawText || "",
        note: note || "",
        categoryId: cleanCategoryId,
        vehicleId: cleanVehicleId,
        familyMemberId: cleanFamilyMemberId,
        locationId: cleanLocationId,
        date: date,
      })
      .returning();

    return NextResponse.json(inserted[0]);
  } catch (err: any) {
    console.error("POST /api/expenses FULL ERROR DETAILED LOG:");
    console.error("Message:", err.message);
    console.error("Code:", err.code);
    console.error("Detail:", err.detail);
    console.error("Hint:", err.hint);
    console.error("Cause:", err.cause);
    console.error("Stack:", err.stack);

    return NextResponse.json(
      { error: err.message, detail: err.detail || err.cause || null },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { db } from "../../../db";
import { categories } from "../../../db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    // Auto-rename any existing category named 'Cylinder' or 'cylinder' to 'Gas Cylinder Refill'
    await db
      .update(categories)
      .set({
        name: "Gas Cylinder Refill",
        keywords: ["gas cylinder refill", "gas cylinder", "cylinder", "lpg", "gas", "refill", "gas refill", "hp gas", "indane", "bharat gas"],
      })
      .where(eq(categories.name, "cylinder"))
      .execute()
      .catch(() => {});

    await db
      .update(categories)
      .set({
        name: "Gas Cylinder Refill",
        keywords: ["gas cylinder refill", "gas cylinder", "cylinder", "lpg", "gas", "refill", "gas refill", "hp gas", "indane", "bharat gas"],
      })
      .where(eq(categories.name, "Cylinder"))
      .execute()
      .catch(() => {});

    const allCategories = await db.select().from(categories).where(eq(categories.active, true));
    return NextResponse.json(allCategories);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, locationId, keywords } = body;
    if (!name || !locationId) {
      return NextResponse.json({ error: "Name and locationId required" }, { status: 400 });
    }

    const inserted = await db
      .insert(categories)
      .values({
        name,
        locationId: Number(locationId),
        keywords: Array.isArray(keywords) ? keywords : [name.toLowerCase()],
        active: true,
      })
      .returning();

    return NextResponse.json(inserted[0]);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id, name, keywords } = body;
    if (!id || !name) {
      return NextResponse.json({ error: "Category ID and name required" }, { status: 400 });
    }

    const updated = await db
      .update(categories)
      .set({
        name,
        keywords: Array.isArray(keywords) ? keywords : [name.toLowerCase(), "gas", "cylinder", "lpg", "refill"],
      })
      .where(eq(categories.id, Number(id)))
      .returning();

    return NextResponse.json(updated[0]);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

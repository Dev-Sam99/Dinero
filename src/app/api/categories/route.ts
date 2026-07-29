import { NextResponse } from "next/server";
import { db } from "../../../db";
import { categories } from "../../../db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
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

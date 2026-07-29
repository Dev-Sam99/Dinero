import { NextResponse } from "next/server";
import { db } from "../../../db";
import { locations, categories, expenses } from "../../../db/schema";
import { eq, count } from "drizzle-orm";
import { getNextLocationColor, capitalizeFirst } from "../../../lib/utils";

export async function GET() {
  try {
    const allLocations = await db.select().from(locations);
    return NextResponse.json(allLocations);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name } = body;
    if (!name) return NextResponse.json({ error: "Location name required" }, { status: 400 });

    const formattedName = capitalizeFirst(name.trim());
    const existing = await db.select().from(locations);
    const existingColors = existing.map((l) => l.color);
    const nextColor = getNextLocationColor(existingColors);

    const inserted = await db
      .insert(locations)
      .values({
        name: formattedName,
        color: nextColor,
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
    const { id, name, active, color } = body;
    if (!id) return NextResponse.json({ error: "Location ID required" }, { status: 400 });

    // Safety rule 9: Deactivating location with existing expenses/categories MUST BE BLOCKED
    if (active === false) {
      const expCount = await db.select({ value: count() }).from(expenses).where(eq(expenses.locationId, id));
      const catCount = await db.select({ value: count() }).from(categories).where(eq(categories.locationId, id));

      if (expCount[0].value > 0 || catCount[0].value > 0) {
        return NextResponse.json(
          { error: `Cannot deactivate location "${name || id}": it has ${expCount[0].value} linked expenses and ${catCount[0].value} categories.` },
          { status: 400 }
        );
      }
    }

    const updateObj: any = {};
    if (name !== undefined) updateObj.name = capitalizeFirst(name.trim());
    if (active !== undefined) updateObj.active = active;
    if (color !== undefined) updateObj.color = color;

    const updated = await db.update(locations).set(updateObj).where(eq(locations.id, id)).returning();
    return NextResponse.json(updated[0]);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

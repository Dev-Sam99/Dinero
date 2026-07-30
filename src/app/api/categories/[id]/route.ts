import { NextResponse } from "next/server";
import { db } from "../../../../db";
import { categories } from "../../../../db/schema";
import { eq } from "drizzle-orm";

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const categoryId = parseInt(params.id, 10);
    if (isNaN(categoryId)) {
      return NextResponse.json({ error: "Invalid category ID" }, { status: 400 });
    }

    const body = await req.json();
    const { name, keywords, locationId, iconOverride, active } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Category name is required" }, { status: 400 });
    }

    const updateData: any = {
      name: name.trim(),
    };

    if (Array.isArray(keywords)) {
      updateData.keywords = keywords.map((k: string) => k.trim()).filter(Boolean);
    }

    if (locationId) {
      updateData.locationId = Number(locationId);
    }

    if (iconOverride !== undefined) {
      updateData.iconOverride = iconOverride || null;
    }

    if (typeof active === "boolean") {
      updateData.active = active;
    }

    const updated = await db
      .update(categories)
      .set(updateData)
      .where(eq(categories.id, categoryId))
      .returning();

    if (updated.length === 0) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    return NextResponse.json(updated[0]);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const categoryId = parseInt(params.id, 10);
    if (isNaN(categoryId)) {
      return NextResponse.json({ error: "Invalid category ID" }, { status: 400 });
    }

    // Soft delete (active = false)
    const updated = await db
      .update(categories)
      .set({ active: false })
      .where(eq(categories.id, categoryId))
      .returning();

    if (updated.length === 0) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, category: updated[0] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

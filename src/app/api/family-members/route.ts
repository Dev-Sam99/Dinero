import { NextResponse } from "next/server";
import { db } from "../../../db";
import { familyMembers } from "../../../db/schema";
import { desc } from "drizzle-orm";

export async function GET() {
  try {
    const members = await db
      .select()
      .from(familyMembers)
      .orderBy(desc(familyMembers.id));

    return NextResponse.json(members);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, keywords } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const inserted = await db
      .insert(familyMembers)
      .values({
        name: name.trim(),
        keywords: Array.isArray(keywords) ? keywords : [],
      })
      .returning();

    return NextResponse.json(inserted[0]);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

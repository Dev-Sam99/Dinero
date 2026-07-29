import { NextResponse } from "next/server";
import { db } from "../../../db";
import { vehicles } from "../../../db/schema";

export async function GET() {
  try {
    const allVehicles = await db.select().from(vehicles);
    return NextResponse.json(allVehicles);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, type } = body;
    if (!name) return NextResponse.json({ error: "Vehicle name required" }, { status: 400 });

    const inserted = await db
      .insert(vehicles)
      .values({
        name,
        type: type || "bike",
      })
      .returning();

    return NextResponse.json(inserted[0]);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

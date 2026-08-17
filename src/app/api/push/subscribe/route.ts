import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { pushSubscriptions } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = parseInt(session.user.id, 10);
    const body = await req.json();

    const { endpoint, keys } = body;
    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return NextResponse.json({ error: "Invalid Web Push subscription payload" }, { status: 400 });
    }

    // Check if subscription already registered
    const existing = await db
      .select()
      .from(pushSubscriptions)
      .where(and(eq(pushSubscriptions.userId, userId), eq(pushSubscriptions.endpoint, endpoint)))
      .limit(1);

    if (existing.length) {
      return NextResponse.json(existing[0]);
    }

    const inserted = await db
      .insert(pushSubscriptions)
      .values({
        userId,
        endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
      })
      .returning();

    return NextResponse.json(inserted[0]);
  } catch (err: any) {
    console.error("POST /api/push/subscribe error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

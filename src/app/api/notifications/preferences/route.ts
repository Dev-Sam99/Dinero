import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { notificationPreferences } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = parseInt(session.user.id, 10);

    const prefs = await db
      .select()
      .from(notificationPreferences)
      .where(eq(notificationPreferences.userId, userId))
      .limit(1);

    if (!prefs.length) {
      return NextResponse.json({
        userId,
        inAppEnabled: true,
        pushEnabled: false,
        emailEnabled: false,
        email: session.user.email || "",
      });
    }

    return NextResponse.json(prefs[0]);
  } catch (err: any) {
    console.error("GET /api/notifications/preferences error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = parseInt(session.user.id, 10);
    const body = await req.json();

    const { inAppEnabled, pushEnabled, emailEnabled, email } = body;

    const existing = await db
      .select()
      .from(notificationPreferences)
      .where(eq(notificationPreferences.userId, userId))
      .limit(1);

    if (!existing.length) {
      const inserted = await db
        .insert(notificationPreferences)
        .values({
          userId,
          inAppEnabled: inAppEnabled ?? true,
          pushEnabled: pushEnabled ?? false,
          emailEnabled: emailEnabled ?? false,
          email: email || session.user.email || null,
        })
        .returning();
      return NextResponse.json(inserted[0]);
    }

    const updated = await db
      .update(notificationPreferences)
      .set({
        inAppEnabled: inAppEnabled !== undefined ? Boolean(inAppEnabled) : existing[0].inAppEnabled,
        pushEnabled: pushEnabled !== undefined ? Boolean(pushEnabled) : existing[0].pushEnabled,
        emailEnabled: emailEnabled !== undefined ? Boolean(emailEnabled) : existing[0].emailEnabled,
        email: email !== undefined ? email : existing[0].email,
      })
      .where(eq(notificationPreferences.userId, userId))
      .returning();

    return NextResponse.json(updated[0]);
  } catch (err: any) {
    console.error("PUT /api/notifications/preferences error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

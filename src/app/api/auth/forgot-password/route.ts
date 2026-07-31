import { NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/db";
import { users, passwordResetTokens } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { sendPasswordResetEmail } from "@/lib/mailer";

export async function POST(req: Request) {
  const genericResponse = NextResponse.json({
    message: "If that email is registered, a reset link has been sent.",
  });

  try {
    const { email } = await req.json();

    if (!email || typeof email !== "string") {
      return genericResponse;
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Look up user regardless of approval status
    const userList = await db
      .select()
      .from(users)
      .where(eq(users.email, normalizedEmail))
      .limit(1);

    const user = userList[0];

    // Always return same response regardless of user existence or status
    if (!user) {
      return genericResponse;
    }

    // Generate random secure token
    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

    // 30-minute expiry
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

    // Save to password_reset_tokens
    await db.insert(passwordResetTokens).values({
      userId: user.id,
      tokenHash,
      expiresAt,
      used: false,
    });

    // Build reset link with raw token
    const origin = req.headers.get("origin") || req.headers.get("referer") || "http://localhost:3000";
    const resetUrl = `${origin}/reset-password?token=${rawToken}`;

    await sendPasswordResetEmail(normalizedEmail, resetUrl);

    return genericResponse;
  } catch (error) {
    console.error("Error in forgot-password handler:", error);
    // Maintain generic message even on error to prevent leakage
    return genericResponse;
  }
}

import { NextResponse } from "next/server";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { db } from "@/db";
import { users, passwordResetTokens } from "@/db/schema";
import { eq, and, gt } from "drizzle-orm";

// Basic in-memory IP rate limiting table (max 5 attempts per IP per 15 mins)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 15 * 60 * 1000 });
    return false;
  }

  entry.count += 1;
  return entry.count > 5;
}

export async function POST(req: Request) {
  try {
    const clientIp =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "127.0.0.1";

    if (isRateLimited(clientIp)) {
      return NextResponse.json(
        { error: "Too many requests. Please wait a few minutes before trying again." },
        { status: 429 }
      );
    }

    const { token, newPassword } = await req.json();

    if (!token || !newPassword) {
      return NextResponse.json(
        { error: "Token and new password are required." },
        { status: 400 }
      );
    }

    if (typeof newPassword !== "string" || newPassword.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters long." },
        { status: 400 }
      );
    }

    // Hash incoming raw token for verification
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    // Query password_reset_tokens for matching, unused, non-expired record
    const recordList = await db
      .select()
      .from(passwordResetTokens)
      .where(
        and(
          eq(passwordResetTokens.tokenHash, tokenHash),
          eq(passwordResetTokens.used, false),
          gt(passwordResetTokens.expiresAt, new Date())
        )
      )
      .limit(1);

    const record = recordList[0];

    if (!record) {
      return NextResponse.json(
        { error: "Invalid or expired password reset token. Please request a new one." },
        { status: 400 }
      );
    }

    // Hash new password using bcrypt
    const passwordHash = await bcrypt.hash(newPassword, 10);

    // Update user password Hash
    await db
      .update(users)
      .set({ passwordHash })
      .where(eq(users.id, record.userId));

    // Mark token as used
    await db
      .update(passwordResetTokens)
      .set({ used: true })
      .where(eq(passwordResetTokens.id, record.id));

    return NextResponse.json({
      message: "Password updated successfully! You can now sign in with your new password.",
    });
  } catch (error) {
    console.error("Error executing password reset:", error);
    return NextResponse.json(
      { error: "An error occurred while resetting your password. Please try again." },
      { status: 500 }
    );
  }
}

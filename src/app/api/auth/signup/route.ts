import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: Request) {
  try {
    const { email, password, name } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters long" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if user matches admin email and prevent re-registering
    const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase().trim();
    if (adminEmail && normalizedEmail === adminEmail) {
      return NextResponse.json(
        { error: "This email belongs to the system administrator and cannot be registered again." },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, normalizedEmail))
      .limit(1);

    if (existingUser.length > 0) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 400 }
      );
    }

    // Hash password with 10 salt rounds
    const passwordHash = await bcrypt.hash(password, 10);

    // Determine if user is admin based on ADMIN_EMAIL env var or if they are the first user
    const allUsers = await db.select().from(users).limit(1);
    const isFirstUser = allUsers.length === 0;

    const isAdmin = adminEmail
      ? normalizedEmail === adminEmail
      : isFirstUser;

    await db.insert(users).values({
      email: normalizedEmail,
      passwordHash,
      name: name || null,
      status: isAdmin ? "approved" : "pending",
      role: isAdmin ? "admin" : "user",
    });

    return NextResponse.json(
      {
        message: isAdmin
          ? "Admin account created successfully! You can now log in."
          : "Account created successfully! Your request is pending admin approval.",
        status: isAdmin ? "approved" : "pending",
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred during signup." },
      { status: 500 }
    );
  }
}

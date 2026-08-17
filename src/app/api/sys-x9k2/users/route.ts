export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { isAdmin } from "@/lib/is-admin";
import { db } from "@/db";
import { users } from "@/db/schema";
import { desc, ne } from "drizzle-orm";

export async function GET() {
  try {
    const session = await auth();
    if (!session || !(await isAdmin(session))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const allUsers = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        status: users.status,
        role: users.role,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(ne(users.role, "admin"))
      .orderBy(desc(users.createdAt));

    return NextResponse.json({ users: allUsers });
  } catch (error) {
    console.error("Error fetching admin users list:", error);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { isAdmin } from "@/lib/is-admin";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session || !(await isAdmin(session))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const userId = parseInt(params.id, 10);
    if (isNaN(userId)) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
    }

    const { status } = await req.json();
    if (!["approved", "rejected", "pending"].includes(status)) {
      return NextResponse.json({ error: "Invalid status value" }, { status: 400 });
    }

    const updatedUser = await db
      .update(users)
      .set({ status })
      .where(eq(users.id, userId))
      .returning();

    if (updatedUser.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ user: updatedUser[0] });
  } catch (error) {
    console.error("Error updating user status:", error);
    return NextResponse.json(
      { error: "Failed to update user status" },
      { status: 500 }
    );
  }
}

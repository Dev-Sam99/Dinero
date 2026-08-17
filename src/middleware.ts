import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow static assets, public icons, manifest, sw.js, and auth routes
  if (
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/icons") ||
    pathname === "/manifest.json" ||
    pathname === "/sw.js" ||
    pathname === "/signin" ||
    pathname === "/signup" ||
    pathname === "/forgot-password" ||
    pathname === "/reset-password"
  ) {
    return NextResponse.next();
  }

  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "dinero-secret-key-change-in-production";
  const secureCookie = req.url.startsWith("https://");
  const token = await getToken({ req, secret, secureCookie });

  if (!token || !token.id) {
    const signinUrl = new URL("/signin", req.url);
    signinUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signinUrl);
  }

  // Re-verify user's current status from the database on every protected request
  try {
    const userId = parseInt(token.id as string, 10);
    if (!isNaN(userId)) {
      const userList = await db
        .select({ status: users.status })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      const dbUser = userList[0];

      // If user does not exist or status is no longer "approved", revoke session immediately and redirect to signin with error indicator
      if (!dbUser || dbUser.status !== "approved") {
        const signinUrl = new URL("/signin", req.url);
        const reason = dbUser?.status === "rejected" ? "ACCOUNT_REJECTED" : "PENDING_APPROVAL";
        signinUrl.searchParams.set("error", reason);

        const response = NextResponse.redirect(signinUrl);
        // Clear session cookies if revoked
        response.cookies.delete("next-auth.session-token");
        response.cookies.delete("__Secure-next-auth.session-token");
        return response;
      }
    }
  } catch (error) {
    console.error("Middleware DB session verification error:", error);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

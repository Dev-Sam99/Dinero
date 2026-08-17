import { auth } from "@/auth";

export async function isAdmin(sessionOrEmail?: any): Promise<boolean> {
  let email: string | null | undefined = null;

  if (typeof sessionOrEmail === "string") {
    email = sessionOrEmail;
  } else if (sessionOrEmail?.user?.email) {
    email = sessionOrEmail.user.email;
  } else {
    const session = await auth();
    email = session?.user?.email;
  }

  if (!email) return false;

  // Check if role is admin in session token
  if (sessionOrEmail?.user?.role === "admin") {
    return true;
  }

  const adminEnv = process.env.ADMIN_EMAIL;
  if (adminEnv) {
    const adminEmails = adminEnv
      .split(",")
      .map((e) => e.trim().toLowerCase());

    if (adminEmails.includes(email.toLowerCase())) {
      return true;
    }
  }

  return false;
}

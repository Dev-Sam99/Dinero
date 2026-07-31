import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("INVALID_CREDENTIALS");
        }

        const normalizedEmail = (credentials.email as string).toLowerCase().trim();
        const userList = await db
          .select()
          .from(users)
          .where(eq(users.email, normalizedEmail))
          .limit(1);

        const user = userList[0];
        if (!user) {
          throw new Error("INVALID_CREDENTIALS");
        }

        const passwordValid = await bcrypt.compare(
          credentials.password as string,
          user.passwordHash
        );

        if (!passwordValid) {
          throw new Error("INVALID_CREDENTIALS");
        }

        if (user.status === "pending") {
          throw new Error("PENDING_APPROVAL");
        }

        if (user.status === "rejected") {
          throw new Error("ACCOUNT_REJECTED");
        }

        if (user.status !== "approved") {
          throw new Error("ACCOUNT_DISABLED");
        }

        return {
          id: String(user.id),
          email: user.email,
          name: user.name,
          role: user.role,
          status: user.status,
        };
      },
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.status = (user as any).status;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        (session.user as any).role = token.role;
        (session.user as any).status = token.status;
      }
      return session;
    },
  },
  pages: {
    signIn: "/signin",
    error: "/signin",
  },
  secret: process.env.AUTH_SECRET || "dinero-secret-key-change-in-production",
});

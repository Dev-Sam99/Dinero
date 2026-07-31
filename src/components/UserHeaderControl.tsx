"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { LogOut, ShieldCheck, User } from "lucide-react";

export default function UserHeaderControl() {
  const { data: session } = useSession();

  if (!session?.user) return null;

  const isAdminUser = (session.user as any).role === "admin";

  return (
    <div className="flex items-center gap-2 sm:gap-3">
      {isAdminUser && (
        <Link
          href="/manage-x9k2"
          className="px-2.5 py-1.5 rounded-lg bg-[#b8912f]/20 border border-[#b8912f]/50 text-[#b8912f] hover:bg-[#b8912f]/30 text-xs font-semibold flex items-center gap-1.5 transition"
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Admin</span>
        </Link>
      )}

      <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#1a2e3d] border border-[#243b4d] text-xs text-[#f2ece0]">
        <User className="w-3.5 h-3.5 text-[#b8912f]" />
        <span className="max-w-[100px] sm:max-w-[140px] truncate font-medium">
          {session.user.name || session.user.email}
        </span>
      </div>

      <button
        onClick={() => signOut({ callbackUrl: "/signin" })}
        className="p-2 rounded-lg bg-[#1a2e3d] text-gray-400 hover:text-red-400 hover:bg-[#243b4d] border border-[#243b4d] transition"
        title="Sign Out"
      >
        <LogOut className="w-4 h-4" />
      </button>
    </div>
  );
}

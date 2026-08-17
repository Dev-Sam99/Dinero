"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Wallet, AlertCircle } from "lucide-react";

function SigninForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const urlError = searchParams.get("error") || "";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState(() => {
    if (urlError.includes("ACCOUNT_REJECTED")) {
      return "Your account access was not approved. Contact the admin if you believe this is a mistake.";
    }
    if (urlError.includes("PENDING_APPROVAL")) {
      return "Your account is awaiting admin approval. You'll be able to sign in once approved.";
    }
    return "";
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    try {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
        callbackUrl,
      });

      if (res?.error) {
        if (res.error.includes("PENDING_APPROVAL")) {
          setErrorMsg("Your account is awaiting admin approval. You'll be able to sign in once approved.");
        } else if (res.error.includes("ACCOUNT_REJECTED")) {
          setErrorMsg("Your account access was not approved. Contact the admin if you believe this is a mistake.");
        } else if (res.error.includes("ACCOUNT_DISABLED")) {
          setErrorMsg("Your account is currently disabled. Please contact an administrator.");
        } else {
          setErrorMsg("Incorrect email or password.");
        }
      } else if (res?.ok) {
        // Fetch current session to check role and redirect accordingly
        const sessionRes = await fetch("/api/auth/session");
        const sessionData = await sessionRes.json();
        const targetUrl = sessionData?.user?.role === "admin" ? "/manage-x9k2" : callbackUrl;
        window.location.href = targetUrl;
      }
    } catch (err) {
      setErrorMsg("An unexpected error occurred during sign in.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-10 px-4">
      <div className="w-full max-w-md bg-[#162736] border border-[#243b4d] rounded-2xl shadow-2xl p-6 sm:p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#1b3447] text-[#b8912f] border border-[#2a455a] mb-3">
            <Wallet className="w-6 h-6" />
          </div>
          <h1 className="font-serif text-2xl font-bold text-[#f2ece0]">Sign In to Dinero</h1>
          <p className="text-xs text-[#a0b0be] mt-1">Enter your credentials to access your ledger</p>
        </div>

        {errorMsg && (
          <div className="mb-6 p-4 rounded-xl bg-red-950/50 border border-red-800/60 text-red-200 text-sm flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div>{errorMsg}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-[#a0b0be] uppercase tracking-wider mb-2">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className="w-full px-4 py-3 rounded-xl bg-[#10202b] border border-[#243b4d] text-[#f2ece0] placeholder-gray-500 focus:outline-none focus:border-[#b8912f] transition text-sm"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-semibold text-[#a0b0be] uppercase tracking-wider">
                Password
              </label>
              <Link href="/forgot-password" className="text-xs text-[#b8912f] hover:underline font-medium">
                Forgot password?
              </Link>
            </div>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 rounded-xl bg-[#10202b] border border-[#243b4d] text-[#f2ece0] placeholder-gray-500 focus:outline-none focus:border-[#b8912f] transition text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 rounded-xl bg-[#b8912f] hover:bg-[#a37f26] text-white font-semibold text-sm transition shadow-lg disabled:opacity-50"
          >
            {loading ? "Signing In..." : "Sign In"}
          </button>
        </form>

        <div className="mt-8 text-center text-xs text-[#a0b0be]">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="text-[#b8912f] hover:underline font-medium">
            Sign up
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function SigninPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[80vh] flex items-center justify-center py-10 px-4 text-[#f2ece0] text-sm">
        Loading...
      </div>
    }>
      <SigninForm />
    </Suspense>
  );
}

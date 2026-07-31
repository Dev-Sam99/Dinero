"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Lock, CheckCircle2, AlertCircle, ArrowLeft } from "lucide-react";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Immediate check for missing or obviously malformed token (e.g. invalid length/format)
  const isTokenMalformed = !token || token.trim().length < 16;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (isTokenMalformed) {
      setError("Invalid or malformed reset token.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to reset password.");
      } else {
        setMessage(data.message);
        setTimeout(() => {
          router.push("/signin");
        }, 2000);
      }
    } catch (err) {
      setError("An unexpected network error occurred.");
    } finally {
      setLoading(false);
    }
  };

  if (isTokenMalformed) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center py-10 px-4">
        <div className="w-full max-w-md bg-[#162736] border border-[#243b4d] rounded-2xl shadow-2xl p-6 sm:p-8 text-center">
          <div className="inline-flex p-3 rounded-full bg-red-950/60 border border-red-800 text-red-400 mb-4">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h1 className="font-serif text-xl font-bold text-[#f2ece0] mb-2">Invalid or Missing Link</h1>
          <p className="text-xs text-[#a0b0be] mb-6">
            The password reset link is invalid or malformed. Please request a new link.
          </p>
          <Link
            href="/forgot-password"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#b8912f] text-white text-xs font-semibold hover:bg-[#a37f26] transition"
          >
            Request Password Reset
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-10 px-4">
      <div className="w-full max-w-md bg-[#162736] border border-[#243b4d] rounded-2xl shadow-2xl p-6 sm:p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#1b3447] text-[#b8912f] border border-[#2a455a] mb-3">
            <Lock className="w-6 h-6" />
          </div>
          <h1 className="font-serif text-2xl font-bold text-[#f2ece0]">Reset Password</h1>
          <p className="text-xs text-[#a0b0be] mt-1">Please enter your new password below</p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-950/50 border border-red-800/60 text-red-200 text-sm flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div>{error}</div>
          </div>
        )}

        {message && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-950/50 border border-emerald-800/60 text-emerald-200 text-sm flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              {message}
              <p className="text-xs text-emerald-300/80 mt-1">Redirecting to Sign In...</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-[#a0b0be] uppercase tracking-wider mb-2">
              New Password
            </label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 rounded-xl bg-[#10202b] border border-[#243b4d] text-[#f2ece0] placeholder-gray-500 focus:outline-none focus:border-[#b8912f] transition text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#a0b0be] uppercase tracking-wider mb-2">
              Confirm Password
            </label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 rounded-xl bg-[#10202b] border border-[#243b4d] text-[#f2ece0] placeholder-gray-500 focus:outline-none focus:border-[#b8912f] transition text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 rounded-xl bg-[#b8912f] hover:bg-[#a37f26] text-white font-semibold text-sm transition shadow-lg disabled:opacity-50"
          >
            {loading ? "Updating Password..." : "Update Password"}
          </button>
        </form>

        <div className="mt-8 text-center">
          <Link
            href="/signin"
            className="inline-flex items-center gap-1.5 text-xs text-[#a0b0be] hover:text-[#f2ece0] font-medium transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Return to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[80vh] flex items-center justify-center py-10 px-4 text-[#f2ece0] text-sm">
          Loading...
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { KeyRound, CheckCircle2, AlertCircle, ArrowLeft } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [devHintUrl, setDevHintUrl] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setDevHintUrl("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to process request.");
      } else {
        setMessage(data.message);
        if (data.devHint) {
          setDevHintUrl(data.devHint);
        }
      }
    } catch (err) {
      setError("Network error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-10 px-4">
      <div className="w-full max-w-md bg-[#162736] border border-[#243b4d] rounded-2xl shadow-2xl p-6 sm:p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#1b3447] text-[#b8912f] border border-[#2a455a] mb-3">
            <KeyRound className="w-6 h-6" />
          </div>
          <h1 className="font-serif text-2xl font-bold text-[#f2ece0]">Forgot Password</h1>
          <p className="text-xs text-[#a0b0be] mt-1">
            Enter your registered email to receive a password reset link
          </p>
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
              <p>{message}</p>
              {devHintUrl && (
                <div className="mt-3 p-3 rounded-lg bg-[#10202b] border border-[#243b4d] text-xs text-[#f2ece0] break-all">
                  <span className="font-bold text-[#b8912f] block mb-1">Development Reset Link:</span>
                  <a href={devHintUrl} className="text-emerald-400 hover:underline">
                    {devHintUrl}
                  </a>
                </div>
              )}
            </div>
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

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 rounded-xl bg-[#b8912f] hover:bg-[#a37f26] text-white font-semibold text-sm transition shadow-lg disabled:opacity-50"
          >
            {loading ? "Sending Link..." : "Send Reset Link"}
          </button>
        </form>

        <div className="mt-8 text-center">
          <Link
            href="/signin"
            className="inline-flex items-center gap-1.5 text-xs text-[#a0b0be] hover:text-[#f2ece0] font-medium transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}

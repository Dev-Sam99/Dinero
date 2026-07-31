"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Wallet, CheckCircle2, AlertCircle } from "lucide-react";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to create account.");
        setLoading(false);
        return;
      }

      setSuccess(data.message);
      if (data.status === "approved") {
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

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-10 px-4">
      <div className="w-full max-w-md bg-[#162736] border border-[#243b4d] rounded-2xl shadow-2xl p-6 sm:p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#1b3447] text-[#b8912f] border border-[#2a455a] mb-3">
            <Wallet className="w-6 h-6" />
          </div>
          <h1 className="font-serif text-2xl font-bold text-[#f2ece0]">Create Dinero Account</h1>
          <p className="text-xs text-[#a0b0be] mt-1">Sign up for personal expense tracking</p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-950/50 border border-red-800/60 text-red-200 text-sm flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div>{error}</div>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-950/50 border border-emerald-800/60 text-emerald-200 text-sm flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>{success}</div>
          </div>
        )}

        {!success && (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-[#a0b0be] uppercase tracking-wider mb-2">
                Full Name (Optional)
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                className="w-full px-4 py-3 rounded-xl bg-[#10202b] border border-[#243b4d] text-[#f2ece0] placeholder-gray-500 focus:outline-none focus:border-[#b8912f] transition text-sm"
              />
            </div>

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
              <label className="block text-xs font-semibold text-[#a0b0be] uppercase tracking-wider mb-2">
                Password
              </label>
              <input
                type="password"
                required
                minLength={6}
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
              {loading ? "Creating Account..." : "Sign Up"}
            </button>
          </form>
        )}

        <div className="mt-8 text-center text-xs text-[#a0b0be]">
          Already have an account?{" "}
          <Link href="/signin" className="text-[#b8912f] hover:underline font-medium">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}

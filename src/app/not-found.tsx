import Link from "next/link";
import { AlertCircle, Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 space-y-6">
      <div className="w-16 h-16 rounded-full bg-[#1a2e3d] border border-[#243b4d] flex items-center justify-center text-[#b8912f]">
        <AlertCircle className="w-8 h-8" />
      </div>
      <div>
        <h2 className="font-serif text-3xl font-bold text-[#f2ece0] mb-2">404 - Page Not Found</h2>
        <p className="text-sm text-gray-400 max-w-md">
          The page or resource you are looking for does not exist in Dinero.
        </p>
      </div>
      <Link
        href="/"
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#b8912f] text-white font-medium hover:bg-[#a37f26] transition shadow"
      >
        <Home className="w-4 h-4" />
        Return to Ledger
      </Link>
    </div>
  );
}

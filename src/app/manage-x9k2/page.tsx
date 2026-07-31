"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import {
  Shield,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  LogOut,
  Sparkles,
  Search,
  UserCheck,
  UserX,
  LayoutDashboard,
  ShieldAlert,
  ArrowLeft
} from "lucide-react";

interface User {
  id: number;
  email: string;
  name: string | null;
  status: "pending" | "approved" | "rejected";
  role: string;
  createdAt: string;
}

export default function AdminPage() {
  const { data: session } = useSession();
  const [usersList, setUsersList] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "pending" | "approved" | "rejected">("all");

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/sys-x9k2/users");
      if (!res.ok) {
        if (res.status === 403) {
          setError("Access Denied: You must have Administrator privileges to access the Admin Panel.");
        } else {
          setError("Failed to load user management records.");
        }
        setLoading(false);
        return;
      }
      const data = await res.json();
      // Ensure admin users are excluded from approval listing
      setUsersList((data.users || []).filter((u: User) => u.role !== "admin"));
    } catch (err) {
      setError("Unable to connect to administration server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleUpdateStatus = async (id: number, newStatus: "approved" | "rejected") => {
    setUpdatingId(id);
    try {
      const res = await fetch(`/api/sys-x9k2/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        setUsersList((prev) =>
          prev.map((u) => (u.id === id ? { ...u, status: newStatus } : u))
        );
      } else {
        alert("Action failed. Could not update user status.");
      }
    } catch (err) {
      alert("Network error while updating user status.");
    } finally {
      setUpdatingId(null);
    }
  };

  const adminName = session?.user?.name || session?.user?.email?.split("@")[0] || "Admin";

  const filteredUsers = usersList.filter((user) => {
    const matchesSearch =
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.name && user.name.toLowerCase().includes(searchQuery.toLowerCase()));

    if (activeTab === "all") return matchesSearch;
    return matchesSearch && user.status === activeTab;
  });

  const pendingCount = usersList.filter((u) => u.status === "pending").length;
  const approvedCount = usersList.filter((u) => u.status === "approved").length;
  const rejectedCount = usersList.filter((u) => u.status === "rejected").length;

  if (loading) {
    return (
      <div className="-mx-3 -my-4 sm:-mx-6 sm:-my-8 min-h-screen bg-[#0e1726] text-[#e2e8f0] flex flex-col items-center justify-center p-6">
        <div className="w-12 h-12 rounded-2xl bg-[#b8912f]/20 border border-[#b8912f]/40 flex items-center justify-center text-[#d4a944] animate-pulse mb-4">
          <Shield className="w-6 h-6" />
        </div>
        <div className="text-sm font-medium text-[#94a3b8]">Loading Admin Console...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="-mx-3 -my-4 sm:-mx-6 sm:-my-8 min-h-screen bg-[#0e1726] text-[#e2e8f0] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-[#172338] border border-rose-500/20 rounded-2xl p-8 text-center backdrop-blur-xl shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-100 mb-2">Access Control Violation</h2>
          <p className="text-sm text-slate-400 mb-6">{error}</p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#1e2d4a] hover:bg-[#253759] text-slate-200 text-sm font-semibold transition border border-[#2b3e63]"
          >
            <ArrowLeft className="w-4 h-4" /> Return to Application
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="-mx-3 -my-4 sm:-mx-6 sm:-my-8 min-h-screen bg-[#0e1726] text-[#e2e8f0] font-sans selection:bg-[#b8912f] selection:text-white">
      {/* Top Admin Navigation Header - Warm Gold & Deep Bronze scheme complementary to #10202b & #b8912f */}
      <header className="sticky top-0 z-40 bg-[#142035]/90 backdrop-blur-md border-b border-[#21324e] px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#b8912f] to-[#d4a944] p-0.5 shadow-md shadow-[#b8912f]/20">
            <div className="w-full h-full bg-[#142035] rounded-[10px] flex items-center justify-center text-[#d4a944]">
              <Shield className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-extrabold tracking-tight text-[#f2ece0]">
                Admin Panel
              </span>
              <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-[#b8912f]/15 text-[#d4a944] border border-[#b8912f]/30">
                Control Console
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#1e2d4a] hover:bg-[#253759] text-slate-300 hover:text-white text-xs font-semibold border border-[#2b3e63] transition"
          >
            <LayoutDashboard className="w-3.5 h-3.5" /> App Dashboard
          </Link>

          <div className="h-4 w-[1px] bg-[#21324e] hidden sm:block" />

          <button
            onClick={() => signOut({ callbackUrl: "/signin" })}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-semibold border border-rose-500/20 transition"
          >
            <LogOut className="w-3.5 h-3.5" /> Sign Out
          </button>
        </div>
      </header>

      {/* Main Admin Content Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-8 py-8 space-y-8">
        {/* Welcome Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#17243c] via-[#1a2944] to-[#17243c] border border-[#263a5d] p-6 sm:p-8 shadow-2xl">
          <div className="absolute top-0 right-0 -mt-12 -mr-12 w-64 h-64 bg-[#b8912f]/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#b8912f]/15 border border-[#b8912f]/30 text-[#d4a944] text-xs font-semibold mb-3">
                <Sparkles className="w-3.5 h-3.5" /> System Administration
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#f2ece0]">
                Welcome Admin <span className="text-[#d4a944]">({adminName})</span>
              </h1>
              <p className="text-xs sm:text-sm text-[#94a3b8] mt-2 max-w-xl">
                Review registration requests, approve new accounts, and grant user platform access.
              </p>
            </div>
            
            <Link
              href="/"
              className="sm:hidden self-start inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1e2d4a] text-slate-200 text-xs font-semibold border border-[#2b3e63]"
            >
              <LayoutDashboard className="w-4 h-4" /> Go to App Dashboard
            </Link>
          </div>
        </div>

        {/* Stats Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-[#142035]/90 border border-[#21324e] rounded-2xl p-5 shadow-lg">
            <div className="flex items-center justify-between text-[#94a3b8] mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Total User Requests</span>
              <Users className="w-4 h-4 text-[#d4a944]" />
            </div>
            <div className="text-3xl font-bold text-[#f2ece0]">{usersList.length}</div>
            <p className="text-[11px] text-[#64748b] mt-1">Non-admin accounts</p>
          </div>

          <div className="bg-[#142035]/90 border border-amber-500/25 rounded-2xl p-5 shadow-lg">
            <div className="flex items-center justify-between text-amber-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Pending Action</span>
              <Clock className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-3xl font-bold text-amber-300">{pendingCount}</div>
            <p className="text-[11px] text-amber-400/70 mt-1">Awaiting admin review</p>
          </div>

          <div className="bg-[#142035]/90 border border-emerald-500/25 rounded-2xl p-5 shadow-lg">
            <div className="flex items-center justify-between text-emerald-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Approved Access</span>
              <UserCheck className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-3xl font-bold text-emerald-300">{approvedCount}</div>
            <p className="text-[11px] text-emerald-400/70 mt-1">Active platform users</p>
          </div>

          <div className="bg-[#142035]/90 border border-rose-500/25 rounded-2xl p-5 shadow-lg">
            <div className="flex items-center justify-between text-rose-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Rejected Requests</span>
              <UserX className="w-4 h-4 text-rose-400" />
            </div>
            <div className="text-3xl font-bold text-rose-300">{rejectedCount}</div>
            <p className="text-[11px] text-rose-400/70 mt-1">Access denied</p>
          </div>
        </div>

        {/* User Approvals Management Card */}
        <div className="bg-[#142035]/90 border border-[#21324e] rounded-3xl p-6 sm:p-8 shadow-2xl">
          {/* Section Header with Search and Filter */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-6 border-b border-[#21324e]">
            <div>
              <h2 className="text-xl font-bold text-[#f2ece0] flex items-center gap-2">
                User Access Approvals
              </h2>
              <p className="text-xs text-[#94a3b8] mt-1">
                Approve or reject pending registration requests for application access
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              {/* Search Bar */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search user or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full sm:w-60 pl-10 pr-4 py-2 rounded-xl bg-[#0c1424] border border-[#21324e] text-slate-200 placeholder-slate-500 text-xs focus:outline-none focus:border-[#b8912f] transition"
                />
              </div>

              {/* Status Filter Tabs */}
              <div className="flex items-center p-1 rounded-xl bg-[#0c1424] border border-[#21324e] text-xs">
                {(["all", "pending", "approved", "rejected"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-3 py-1.5 rounded-lg capitalize font-semibold transition ${
                      activeTab === tab
                        ? "bg-[#b8912f] text-white shadow-md"
                        : "text-[#94a3b8] hover:text-slate-200"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* User Request Listing */}
          {filteredUsers.length === 0 ? (
            <div className="py-12 text-center text-[#64748b] text-xs italic">
              No registration requests found matching the current search criteria.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead>
                  <tr className="border-b border-[#21324e] text-[#94a3b8] font-semibold uppercase tracking-wider">
                    <th className="py-3 px-4">Applicant</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Requested On</th>
                    <th className="py-3 px-4 text-right">Approval Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#21324e]/60">
                  {filteredUsers.map((user) => {
                    const isPending = user.status === "pending";
                    const isApproved = user.status === "approved";
                    const isRejected = user.status === "rejected";

                    return (
                      <tr key={user.id} className="hover:bg-[#1a2944]/40 transition">
                        <td className="py-4 px-4">
                          <div className="font-semibold text-[#f2ece0]">{user.name || "No name specified"}</div>
                          <div className="text-[#94a3b8] font-mono text-[11px] mt-0.5">{user.email}</div>
                        </td>
                        <td className="py-4 px-4">
                          {isPending && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/20">
                              <Clock className="w-3 h-3 animate-spin" /> Pending Approval
                            </span>
                          )}
                          {isApproved && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                              <CheckCircle2 className="w-3 h-3" /> Approved
                            </span>
                          )}
                          {isRejected && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-500/10 text-rose-300 border border-rose-500/20">
                              <XCircle className="w-3 h-3" /> Rejected
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-4 text-[#94a3b8] font-mono">
                          {new Date(user.createdAt).toLocaleDateString(undefined, {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </td>
                        <td className="py-4 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              disabled={updatingId === user.id || isApproved}
                              onClick={() => handleUpdateStatus(user.id, "approved")}
                              className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1 transition text-xs ${
                                isApproved
                                  ? "bg-slate-800/40 text-slate-600 cursor-not-allowed"
                                  : "bg-emerald-700 hover:bg-emerald-600 text-white shadow-sm disabled:opacity-50"
                              }`}
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                            </button>
                            <button
                              disabled={updatingId === user.id || isRejected}
                              onClick={() => handleUpdateStatus(user.id, "rejected")}
                              className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1 transition text-xs ${
                                isRejected
                                  ? "bg-slate-800/40 text-slate-600 cursor-not-allowed"
                                  : "bg-rose-700 hover:bg-rose-600 text-white shadow-sm disabled:opacity-50"
                              }`}
                            >
                              <XCircle className="w-3.5 h-3.5" /> Reject
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

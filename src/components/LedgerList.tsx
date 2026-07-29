"use client";

import { useState } from "react";
import { getCategoryIcon, capitalizeFirst } from "../lib/utils";
import CategoryPicker from "./CategoryPicker";
import EditExpenseModal from "./EditExpenseModal";
import { Edit2, Trash2, Tag, MapPin, Bike, Users } from "lucide-react";

interface ExpenseItem {
  id: number;
  amount: string;
  rawText: string;
  note: string | null;
  categoryId: number | null;
  vehicleId: number | null;
  familyMemberId: number | null;
  locationId: number;
  date: string;
  createdAt: string;
}

interface LedgerListProps {
  expenses: ExpenseItem[];
  totalCount?: number;
  page?: number;
  pageSize?: number;
  onPageChange?: (newPage: number) => void;
  categories: { id: number; name: string; keywords: string[]; locationId: number }[];
  locations: { id: number; name: string; color: string; active: boolean }[];
  vehicles: { id: number; name: string; type: string }[];
  familyMembers?: { id: number; name: string; keywords: string[] }[];
  onRefresh: () => void;
  onCategoryCreated: (c: any) => void;
  onVehicleCreated: (v: any) => void;
  onFamilyMemberCreated?: (fm: any) => void;
}

export default function LedgerList({
  expenses,
  totalCount = expenses.length,
  page = 1,
  pageSize = 10,
  onPageChange,
  categories,
  locations,
  vehicles,
  familyMembers = [],
  onRefresh,
  onCategoryCreated,
  onVehicleCreated,
  onFamilyMemberCreated,
}: LedgerListProps) {
  const [editingCategoryExpense, setEditingCategoryExpense] = useState<ExpenseItem | null>(null);
  const [editingFullExpense, setEditingFullExpense] = useState<ExpenseItem | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const [showPagePicker, setShowPagePicker] = useState(false);
  const [jumpPageInput, setJumpPageInput] = useState(String(page));

  const totalPages = Math.ceil(totalCount / pageSize) || 1;
  const startCount = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
  const endCount = Math.min(page * pageSize, totalCount);

  const getCategoryObj = (catId: number | null) =>
    categories.find((c) => c.id === catId);

  const getLocationObj = (locId: number) =>
    locations.find((l) => l.id === locId);

  const getVehicleObj = (vehId: number | null) =>
    vehicles.find((v) => v.id === vehId);

  const getFamilyMemberObj = (fmId: number | null) =>
    familyMembers.find((fm) => fm.id === fmId);

  const handleJumpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const target = parseInt(jumpPageInput, 10);
    if (!isNaN(target) && target >= 1 && target <= totalPages && onPageChange) {
      onPageChange(target);
      setShowPagePicker(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this expense?")) return;
    setDeletingId(id);
    try {
      await fetch(`/api/expenses/${id}`, { method: "DELETE" });
      onRefresh();
    } catch (err) {
      console.error("Failed to delete", err);
    } finally {
      setDeletingId(null);
    }
  };

  const handleUpdateCategory = async (expenseId: number, catId: number | null) => {
    try {
      await fetch(`/api/expenses/${expenseId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categoryId: catId }),
      });
      onRefresh();
    } catch (err) {
      console.error("Failed to update category", err);
    }
  };

  const handleUpdateVehicle = async (expenseId: number, vehId: number | null) => {
    try {
      await fetch(`/api/expenses/${expenseId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vehicleId: vehId }),
      });
      onRefresh();
    } catch (err) {
      console.error("Failed to update vehicle", err);
    }
  };

  const handleUpdateFamilyMember = async (expenseId: number, fmId: number | null) => {
    try {
      await fetch(`/api/expenses/${expenseId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ familyMemberId: fmId }),
      });
      onRefresh();
    } catch (err) {
      console.error("Failed to update family member", err);
    }
  };

  return (
    <div className="bg-[#f2ece0] border-2 border-[#b8912f] rounded-xl p-4 sm:p-5 shadow-lg text-[#10202b]">
      {/* Ledger Header */}
      <div className="flex items-center justify-between border-b-2 border-[#b8912f] pb-3 mb-4">
        <div>
          <h2 className="font-serif text-lg font-bold text-[#10202b]">Expense Ledger</h2>
          <p className="text-xs text-gray-600 font-sans">
            Showing <strong className="font-mono">{startCount}-{endCount}</strong> of <strong className="font-mono">{totalCount}</strong> recorded transactions
          </p>
        </div>
      </div>

      {expenses.length === 0 ? (
        <div className="text-center py-10 border-2 border-dashed border-[#d8ceba] rounded-lg">
          <p className="font-serif text-sm text-gray-500">No expenses recorded yet.</p>
        </div>
      ) : (
        <div className="divide-y divide-[#d8ceba]">
          {expenses.map((item) => {
            const cat = getCategoryObj(item.categoryId);
            const loc = getLocationObj(item.locationId);
            const veh = getVehicleObj(item.vehicleId);
            const fm = getFamilyMemberObj(item.familyMemberId);
            const IconComponent = cat ? getCategoryIcon(cat.name, cat.keywords) : Tag;
            const locColor = loc?.color || "#2f7d76";

            return (
              <div
                key={item.id}
                className="py-3.5 px-3 hover:bg-[#fbf8f3] transition duration-150 flex items-center justify-between gap-3 rounded-lg"
              >
                {/* Left: Category Icon + Note/Category Name */}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  {/* Category Pill / Icon Badge */}
                  <button
                    type="button"
                    title="Tap to change category"
                    onClick={() => setEditingCategoryExpense(item)}
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white shrink-0 shadow border border-white/20 hover:scale-105 transition"
                    style={{ backgroundColor: locColor }}
                  >
                    <IconComponent className="w-5 h-5" />
                  </button>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={() => setEditingCategoryExpense(item)}
                        className="font-serif font-bold text-sm hover:underline text-[#10202b] text-left truncate"
                      >
                        {cat ? cat.name : <span className="italic text-gray-500 font-normal">Uncategorized</span>}
                      </button>

                      {/* Location Badge */}
                      <span
                        className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white tracking-wide"
                        style={{ backgroundColor: locColor }}
                      >
                        {loc ? capitalizeFirst(loc.name) : "Unknown"}
                      </span>

                      {/* Vehicle Badge */}
                      {veh && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#10202b] text-white flex items-center gap-1">
                          <Bike className="w-3 h-3" />
                          <span>{veh.name}</span>
                        </span>
                      )}

                      {/* Family Member Badge */}
                      {fm && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#b8912f] text-white flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          <span>{fm.name}</span>
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-gray-700 truncate mt-0.5 font-sans">
                      {item.note || item.rawText}
                    </p>
                    <span className="text-[10px] font-mono text-gray-500">
                      {item.date}
                    </span>
                  </div>
                </div>

                {/* Right: Amount & Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <span className="font-mono font-bold text-base text-[#10202b] tracking-tight">
                    ₹{parseFloat(item.amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </span>

                  <button
                    type="button"
                    onClick={() => setEditingFullExpense(item)}
                    className="p-1.5 rounded hover:bg-[#e4dbca] text-gray-600 hover:text-[#10202b] transition"
                    title="Edit Expense"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    disabled={deletingId === item.id}
                    onClick={() => handleDelete(item.id)}
                    className="p-1.5 rounded hover:bg-red-100 text-gray-400 hover:text-red-600 transition"
                    title="Delete Expense"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Controls */}
      {totalCount > 0 && onPageChange && (
        <div className="flex items-center justify-between pt-4 mt-4 border-t border-[#d8ceba] relative">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            className="px-3 py-1.5 rounded-lg border border-[#b8912f] bg-[#fbf8f3] text-[#10202b] font-serif font-bold text-xs hover:bg-[#e4dbca] disabled:opacity-40 disabled:cursor-not-allowed transition shadow-sm"
          >
            ← Previous
          </button>

          {/* Page Jump Control Button */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setJumpPageInput(String(page));
                setShowPagePicker(!showPagePicker);
              }}
              className="px-3 py-1.5 rounded-lg border border-[#d8ceba] bg-[#fbf8f3] hover:border-[#b8912f] text-xs font-mono text-gray-700 transition"
              title="Click to jump to specific page"
            >
              Page <strong className="text-[#10202b]">{page}</strong> of <strong className="text-[#10202b]">{totalPages}</strong>
            </button>

            {/* Page Jump Popup */}
            {showPagePicker && (
              <div className="absolute left-1/2 -translate-x-1/2 bottom-10 z-50 bg-[#f2ece0] border-2 border-[#b8912f] rounded-xl p-3 shadow-2xl w-48 text-[#10202b]">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#d8ceba]">
                  <span className="font-serif font-bold text-xs">Jump to Page</span>
                  <button
                    type="button"
                    onClick={() => setShowPagePicker(false)}
                    className="text-gray-500 hover:text-black text-xs"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleJumpSubmit} className="space-y-2">
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min="1"
                      max={totalPages}
                      value={jumpPageInput}
                      onChange={(e) => setJumpPageInput(e.target.value)}
                      className="w-full px-2 py-1 border border-[#d8ceba] bg-[#fbf8f3] rounded font-mono font-bold text-xs text-[#10202b] focus:outline-none focus:border-[#b8912f]"
                      placeholder="Page #"
                      autoFocus
                    />
                    <button
                      type="submit"
                      className="px-2.5 py-1 rounded bg-[#b8912f] text-white text-xs font-serif font-bold hover:bg-[#a07c24]"
                    >
                      Go
                    </button>
                  </div>
                </form>

                {/* Quick list preview for direct tapping */}
                {totalPages <= 30 && (
                  <div className="mt-2.5 pt-2 border-t border-[#d8ceba] max-h-32 overflow-y-auto grid grid-cols-5 gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => {
                          onPageChange(p);
                          setShowPagePicker(false);
                        }}
                        className={`p-1 text-[11px] font-mono rounded text-center transition ${
                          p === page
                            ? "bg-[#10202b] text-white font-bold"
                            : "bg-[#fbf8f3] hover:bg-[#e4dbca] text-[#10202b]"
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
            className="px-3 py-1.5 rounded-lg border border-[#b8912f] bg-[#fbf8f3] text-[#10202b] font-serif font-bold text-xs hover:bg-[#e4dbca] disabled:opacity-40 disabled:cursor-not-allowed transition shadow-sm"
          >
            Next →
          </button>
        </div>
      )}

      {/* Category Quick Picker Modal */}
      {editingCategoryExpense && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <CategoryPicker
            categories={categories}
            locations={locations}
            vehicles={vehicles}
            familyMembers={familyMembers}
            selectedCategoryId={editingCategoryExpense.categoryId}
            selectedVehicleId={editingCategoryExpense.vehicleId}
            selectedFamilyMemberId={editingCategoryExpense.familyMemberId}
            onSelectCategory={(catId) => handleUpdateCategory(editingCategoryExpense.id, catId)}
            onVehicleAssigned={(vehId) => handleUpdateVehicle(editingCategoryExpense.id, vehId)}
            onFamilyMemberAssigned={(fmId) => handleUpdateFamilyMember(editingCategoryExpense.id, fmId)}
            onCategoryCreated={onCategoryCreated}
            onVehicleCreated={onVehicleCreated}
            onFamilyMemberCreated={onFamilyMemberCreated}
            onClose={() => setEditingCategoryExpense(null)}
          />
        </div>
      )}

      {/* Full Edit Modal */}
      {editingFullExpense && (
        <EditExpenseModal
          expense={editingFullExpense}
          locations={locations}
          onSave={() => {
            setEditingFullExpense(null);
            onRefresh();
          }}
          onClose={() => setEditingFullExpense(null)}
        />
      )}
    </div>
  );
}

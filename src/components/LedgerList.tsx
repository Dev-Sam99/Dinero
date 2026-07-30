"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { getCategoryIcon, capitalizeFirst } from "../lib/utils";
import CategoryPicker from "./CategoryPicker";
import EditExpenseModal from "./EditExpenseModal";
import ConfirmModal from "./ConfirmModal";
import { Edit2, Trash2, Tag, MapPin, Bike, Users, Search, Filter, X, ChevronDown } from "lucide-react";
import { useToast } from "./ToastProvider";

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
  const { showToast, showUndoToast } = useToast();
  const [mounted, setMounted] = useState(false);
  const [editingCategoryExpense, setEditingCategoryExpense] = useState<ExpenseItem | null>(null);
  const [editingFullExpense, setEditingFullExpense] = useState<ExpenseItem | null>(null);
  const [editingLocationExpense, setEditingLocationExpense] = useState<ExpenseItem | null>(null);
  const [confirmDeleteItem, setConfirmDeleteItem] = useState<ExpenseItem | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategoryId, setFilterCategoryId] = useState<number | "all">("all");
  const [filterDate, setFilterDate] = useState("");

  const [showCatFilterDropdown, setShowCatFilterDropdown] = useState(false);
  const [catDropdownSearch, setCatDropdownSearch] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (showCatFilterDropdown) {
      document.body.classList.add("modal-open");
    } else {
      document.body.classList.remove("modal-open");
    }
    return () => {
      document.body.classList.remove("modal-open");
    };
  }, [showCatFilterDropdown]);

  const [showPagePicker, setShowPagePicker] = useState(false);
  const [jumpPageInput, setJumpPageInput] = useState(String(page));

  // Client-side filtering logic
  const filteredExpenses = expenses.filter((item) => {
    const matchesSearch = searchQuery.trim() === "" ||
      item.rawText.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.note && item.note.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = filterCategoryId === "all" || item.categoryId === filterCategoryId;
    const matchesDate = !filterDate || item.date === filterDate;

    return matchesSearch && matchesCategory && matchesDate;
  });

  const activeTotalCount = (searchQuery || filterCategoryId !== "all" || filterDate) ? filteredExpenses.length : totalCount;
  const totalPages = Math.ceil(activeTotalCount / pageSize) || 1;
  const startCount = activeTotalCount === 0 ? 0 : (page - 1) * pageSize + 1;
  const endCount = Math.min(page * pageSize, activeTotalCount);

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

  const handleDeleteWithUndo = async (item: ExpenseItem) => {
    // Optimistically remove / notify with undo
    setDeletingId(item.id);

    try {
      await fetch(`/api/expenses/${item.id}`, { method: "DELETE" });
      onRefresh();

      showUndoToast(`Deleted ₹${item.amount} entry`, async () => {
        // Reverse deletion by re-posting
        await fetch("/api/expenses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: parseFloat(item.amount),
            rawText: item.rawText,
            note: item.note,
            categoryId: item.categoryId,
            vehicleId: item.vehicleId,
            familyMemberId: item.familyMemberId,
            locationId: item.locationId,
            date: item.date,
          }),
        });
        showToast("Restored entry to ledger");
        onRefresh();
      });
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

  const handleUpdateLocation = async (expenseId: number, locId: number) => {
    try {
      await fetch(`/api/expenses/${expenseId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locationId: locId }),
      });
      onRefresh();
    } catch (err) {
      console.error("Failed to update location", err);
    }
  };

  return (
    <div className="bg-[#f2ece0] border-2 border-[#b8912f] rounded-xl p-4 sm:p-5 shadow-lg text-[#10202b]">
      {/* Ledger Header & Search/Filter Controls */}
      <div className="border-b-2 border-[#b8912f] pb-3 mb-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-serif text-lg font-bold text-[#10202b]">Expense Ledger</h2>
            <p className="text-xs text-gray-600 font-sans">
              Showing <strong className="font-mono">{startCount}-{endCount}</strong> of <strong className="font-mono">{activeTotalCount}</strong> recorded transactions
            </p>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <div className="relative flex items-center">
            <Search className="w-3.5 h-3.5 absolute left-2.5 text-gray-500 pointer-events-none" />
            <input
              type="text"
              placeholder="Search expenses..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (onPageChange) onPageChange(1);
              }}
              className="w-full pl-8 pr-7 py-1.5 rounded-lg border border-[#d8ceba] bg-white text-xs text-[#10202b] placeholder-gray-400 focus:outline-none focus:border-[#b8912f]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2 text-gray-400 hover:text-black p-1"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Custom Styled Popout Category Selector */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowCatFilterDropdown(!showCatFilterDropdown)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-[#d8ceba] bg-white text-xs font-serif text-[#10202b] flex items-center justify-between hover:border-[#b8912f] transition shadow-sm"
            >
              <div className="flex items-center gap-1.5 truncate">
                <Tag className="w-3.5 h-3.5 text-[#b8912f] shrink-0" />
                <span className="truncate">
                  {filterCategoryId === "all"
                    ? "All Categories"
                    : categories.find((c) => c.id === filterCategoryId)?.name || "All Categories"}
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-gray-500 shrink-0" />
            </button>

            {showCatFilterDropdown && mounted && createPortal(
              <div
                onClick={() => setShowCatFilterDropdown(false)}
                className="fixed inset-0 z-[99999] bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-backdrop-in"
              >
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="bg-[#f2ece0] border-2 border-[#b8912f] rounded-xl p-4 sm:p-5 shadow-2xl w-full max-w-md text-[#10202b] animate-modal-in space-y-3 max-h-[85vh] flex flex-col my-auto"
                >
                  <div className="flex items-center justify-between border-b-2 border-[#b8912f] pb-2">
                    <div className="flex items-center gap-2">
                      <Tag className="w-4 h-4 text-[#b8912f]" />
                      <span className="font-serif font-bold text-sm text-[#10202b] uppercase tracking-wider">
                        Filter by Category
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowCatFilterDropdown(false)}
                      className="p-1 rounded-md text-gray-500 hover:text-black hover:bg-[#e4dbca] font-mono transition"
                    >
                      ✕ CLOSE
                    </button>
                  </div>

                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search category name or location..."
                      value={catDropdownSearch}
                      onChange={(e) => setCatDropdownSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-1.5 bg-white border border-[#d8ceba] text-xs font-sans text-[#10202b] rounded-lg focus:outline-none focus:border-[#b8912f] shadow-inner"
                      autoFocus
                    />
                  </div>

                  <div className="overflow-y-auto space-y-3 flex-1 pr-1">
                    <button
                      type="button"
                      onClick={() => {
                        setFilterCategoryId("all");
                        setShowCatFilterDropdown(false);
                        if (onPageChange) onPageChange(1);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold flex items-center justify-between pill-hover transition border ${
                        filterCategoryId === "all"
                          ? "bg-[#b8912f] text-white border-[#b8912f] shadow"
                          : "bg-[#fbf8f3] text-gray-800 border-[#d8ceba]"
                      }`}
                    >
                      <span>Show All Categories</span>
                      {filterCategoryId === "all" && <span>✓</span>}
                    </button>

                    {locations.map((loc) => {
                      const locCats = categories.filter(
                        (c) =>
                          c.locationId === loc.id &&
                          (!catDropdownSearch.trim() ||
                            c.name.toLowerCase().includes(catDropdownSearch.toLowerCase()) ||
                            loc.name.toLowerCase().includes(catDropdownSearch.toLowerCase()))
                      );
                      if (locCats.length === 0) return null;

                      return (
                        <div key={loc.id} className="space-y-1.5 pt-1">
                          <div className="text-xs font-serif font-bold uppercase tracking-wider text-gray-700 px-1 flex items-center gap-1.5">
                            <span
                              className="w-2.5 h-2.5 rounded-full inline-block pill-hover shadow-xs"
                              style={{ backgroundColor: loc.color }}
                            />
                            <span>{loc.name}</span>
                          </div>

                          <div className="grid grid-cols-2 gap-1.5">
                            {locCats.map((c) => {
                              const isSelected = filterCategoryId === c.id;
                              const IconComp = getCategoryIcon(c.name, c.keywords);
                              return (
                                <button
                                  key={c.id}
                                  type="button"
                                  onClick={() => {
                                    setFilterCategoryId(c.id);
                                    setShowCatFilterDropdown(false);
                                    if (onPageChange) onPageChange(1);
                                  }}
                                  className={`px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-2 pill-hover transition border group ${
                                    isSelected
                                      ? "bg-[#b8912f] text-white border-[#b8912f] shadow font-bold"
                                      : "bg-[#fbf8f3] text-[#10202b] border-[#d8ceba]"
                                  }`}
                                >
                                  <div
                                    className="w-6 h-6 rounded flex items-center justify-center text-white shrink-0 cat-icon-hover shadow-xs"
                                    style={{ backgroundColor: loc.color }}
                                  >
                                    <IconComp className="w-3.5 h-3.5 transition-transform duration-180 group-hover:scale-115" />
                                  </div>
                                  <span className="truncate">{c.name}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>,
              document.body
            )}
          </div>

          <div>
            <input
              type="date"
              value={filterDate}
              onChange={(e) => {
                setFilterDate(e.target.value);
                if (onPageChange) onPageChange(1);
              }}
              className="w-full px-2.5 py-1.5 rounded-lg border border-[#d8ceba] bg-white text-xs font-mono text-[#10202b] focus:outline-none focus:border-[#b8912f]"
            />
          </div>
        </div>
      </div>

      {filteredExpenses.length === 0 ? (
        <div className="text-center py-10 border-2 border-dashed border-[#d8ceba] rounded-lg">
          <p className="font-serif text-sm text-gray-500">No expenses found matching filter criteria.</p>
        </div>
      ) : (
        <div className="divide-y divide-[#d8ceba]">
          {filteredExpenses.map((item) => {
            const cat = getCategoryObj(item.categoryId);
            const loc = getLocationObj(item.locationId);
            const veh = getVehicleObj(item.vehicleId);
            const fm = getFamilyMemberObj(item.familyMemberId);
            const IconComponent = cat ? getCategoryIcon(cat.name, cat.keywords) : Tag;
            const locColor = loc?.color || "#2f7d76";

            return (
              <div
                key={item.id}
                className="py-3.5 px-3 ledger-row-hover transition-colors duration-180 flex items-center justify-between gap-3 rounded-lg"
              >
                {/* Left: Category Icon + Note/Category Name */}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  {/* Category Pill / Icon Badge (Min 44x44 touch target) */}
                  <button
                    type="button"
                    title="Tap to change category"
                    onClick={() => setEditingCategoryExpense(item)}
                    className="w-11 h-11 rounded-full flex items-center justify-center text-white shrink-0 shadow border border-white/20 cat-icon-hover pill-hover"
                    style={{ backgroundColor: locColor }}
                  >
                    <IconComponent className="w-5 h-5 transition-transform duration-180" />
                  </button>

                  <div className="min-w-0 flex-1">
                    {/* Line 1: Category Name + Clickable Location Badge (Mumbai/Satara/Pune) + Vehicle/Family Badges */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={() => setEditingCategoryExpense(item)}
                        className="font-serif font-bold text-sm hover:underline text-[#10202b] text-left truncate"
                      >
                        {cat ? cat.name : <span className="italic text-gray-500 font-normal">Uncategorized</span>}
                      </button>

                      {/* Location Badge (Clickable Popout Trigger, without pin icon) */}
                      <button
                        type="button"
                        onClick={() => setEditingLocationExpense(item)}
                        title="Click to switch location (e.g. Mumbai, Satara, Pune)"
                        className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white tracking-wide pill-hover cursor-pointer"
                        style={{ backgroundColor: locColor }}
                      >
                        {loc ? capitalizeFirst(loc.name) : "Unknown"}
                      </button>

                      {/* Vehicle Badge */}
                      {veh && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#10202b] text-white flex items-center gap-1 pill-hover">
                          <Bike className="w-3 h-3" />
                          <span>{veh.name}</span>
                        </span>
                      )}

                      {/* Family Member Badge */}
                      {fm && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#b8912f] text-white flex items-center gap-1 pill-hover">
                          <Users className="w-3 h-3" />
                          <span>{fm.name}</span>
                        </span>
                      )}
                    </div>

                    {/* Line 2: Note / Text and Date directly inline next to each other */}
                    <div className="flex items-center gap-2 mt-0.5 min-w-0">
                      <span className="text-xs text-gray-700 truncate font-sans font-medium">
                        {item.note || item.rawText}
                      </span>
                      <span className="text-[10px] text-gray-400 font-mono shrink-0">•</span>
                      <span className="text-[10px] font-mono text-gray-500 shrink-0">
                        {item.date}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: Amount & Actions (Min 44x44 touch targets) */}
                <div className="flex items-center gap-1 shrink-0">
                  <span className="font-mono font-bold text-base text-[#10202b] tracking-tight mr-1">
                    ₹{parseFloat(item.amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </span>

                  <button
                    type="button"
                    onClick={() => setEditingFullExpense(item)}
                    className="p-2.5 rounded-lg hover:bg-[#e4dbca] text-gray-600 hover:text-[#10202b] action-icon-hover flex items-center justify-center min-w-[40px] min-h-[40px]"
                    title="Edit Expense"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    disabled={deletingId === item.id}
                    onClick={() => setConfirmDeleteItem(item)}
                    className="p-2.5 rounded-lg hover:bg-red-100 text-gray-500 hover:text-red-600 action-icon-hover flex items-center justify-center min-w-[40px] min-h-[40px]"
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
            className="px-3 py-1.5 rounded-lg border border-[#b8912f] bg-[#fbf8f3] text-[#10202b] font-serif font-bold text-xs btn-secondary-hover disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
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
              className="px-3 py-1.5 rounded-lg border border-[#d8ceba] bg-[#fbf8f3] btn-secondary-hover text-xs font-mono text-gray-700"
              title="Click to jump to specific page"
            >
              Page <strong className="text-[#10202b]">{page}</strong> of <strong className="text-[#10202b]">{totalPages}</strong>
            </button>

            {/* Page Jump Popup */}
            {showPagePicker && (
              <div className="absolute left-1/2 -translate-x-1/2 bottom-10 z-50 bg-[#f2ece0] border-2 border-[#b8912f] rounded-xl p-3 shadow-2xl w-48 text-[#10202b] animate-modal-in">
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
        <div
          onClick={() => setEditingCategoryExpense(null)}
          className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-4 animate-backdrop-in"
        >
          <div onClick={(e) => e.stopPropagation()}>
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

      {/* Delete Confirmation Dialog */}
      <ConfirmModal
        isOpen={!!confirmDeleteItem}
        title="Delete Expense Entry?"
        message={`Are you sure you want to delete the entry "${confirmDeleteItem?.note || confirmDeleteItem?.rawText || 'expense'}" (₹${confirmDeleteItem?.amount})?`}
        confirmText="Delete Entry"
        onConfirm={() => {
          if (confirmDeleteItem) {
            handleDeleteWithUndo(confirmDeleteItem);
            setConfirmDeleteItem(null);
          }
        }}
        onClose={() => setConfirmDeleteItem(null)}
      />

      {/* Location Picker Popout Modal */}
      {editingLocationExpense && mounted && createPortal(
        <div
          onClick={() => setEditingLocationExpense(null)}
          className="fixed inset-0 z-[99999] bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-backdrop-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#f2ece0] border-2 border-[#b8912f] rounded-xl p-4 sm:p-5 shadow-2xl w-full max-w-xs text-[#10202b] animate-modal-in space-y-3"
          >
            <div className="flex items-center justify-between border-b-2 border-[#b8912f] pb-2">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#b8912f]" />
                <span className="font-serif font-bold text-sm text-[#10202b] uppercase tracking-wider">
                  Select Location
                </span>
              </div>
              <button
                type="button"
                onClick={() => setEditingLocationExpense(null)}
                className="text-xs font-mono font-bold text-gray-500 hover:text-black p-1 rounded hover:bg-[#e4dbca] transition"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-gray-600 font-sans">
              Switch location for entry <strong className="font-mono text-[#10202b]">&quot;{editingLocationExpense.note || editingLocationExpense.rawText}&quot;</strong>:
            </p>

            <div className="space-y-1.5 pt-1">
              {locations.filter((l) => l.active).map((loc) => {
                const isSelected = editingLocationExpense.locationId === loc.id;
                return (
                  <button
                    key={loc.id}
                    type="button"
                    onClick={() => {
                      handleUpdateLocation(editingLocationExpense.id, loc.id);
                      setEditingLocationExpense(null);
                    }}
                    className={`w-full px-3 py-2 rounded-lg text-xs font-serif font-bold flex items-center justify-between pill-hover transition border ${
                      isSelected
                        ? "text-white border-transparent shadow"
                        : "bg-[#fbf8f3] text-[#10202b] border-[#d8ceba]"
                    }`}
                    style={{
                      backgroundColor: isSelected ? loc.color : undefined,
                      borderColor: isSelected ? loc.color : undefined,
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full inline-block shrink-0 shadow-xs"
                        style={{ backgroundColor: loc.color }}
                      />
                      <span>{capitalizeFirst(loc.name)}</span>
                    </div>
                    {isSelected && <span>✓</span>}
                  </button>
                );
              })}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

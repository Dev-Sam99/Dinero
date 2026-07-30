"use client";

import { useState, useEffect } from "react";
import { X, Calendar, Settings, History, ChevronDown, ChevronUp, Plus, Edit2, AlertCircle, Clock, Trash2 } from "lucide-react";
import SharedDatePicker from "./SharedDatePicker";
import { getCategoryIcon, capitalizeFirst } from "../lib/utils";
import { BudgetOverrideRow } from "../lib/budget-resolver";
import Modal from "./Modal";

interface Category {
  id: number;
  name: string;
  keywords: string[];
  locationId: number;
  active?: boolean;
}

interface Location {
  id: number;
  name: string;
  color: string;
  active: boolean;
}

interface BudgetRow {
  id: number;
  categoryId: number;
  monthlyBudget: string;
  effectiveFrom: string;
  effectiveTo: string | null;
  note?: string | null;
}

interface ManageBudgetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  locations: Location[];
  budgets: BudgetRow[];
  overrides?: BudgetOverrideRow[];
  selectedMonth?: string; // YYYY-MM
  initialCategoryToEdit?: Category | null;
  onRefresh: () => Promise<void> | void;
}

export default function ManageBudgetsModal({
  isOpen,
  onClose,
  categories,
  locations,
  budgets,
  overrides = [],
  selectedMonth,
  initialCategoryToEdit,
  onRefresh,
}: ManageBudgetsModalProps) {
  // Mode for forms: "new" (set new budget), "correct" (UPDATE existing budget row in place), "override" (single-month override)
  const [formMode, setFormMode] = useState<"new" | "correct" | "override" | null>(null);

  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [correctingRow, setCorrectingRow] = useState<BudgetRow | null>(null);

  const [amount, setAmount] = useState<string>("");
  const [effectiveFrom, setEffectiveFrom] = useState<string>("");
  const [effectiveTo, setEffectiveTo] = useState<string>("");
  const [note, setNote] = useState<string>("");
  const [showFromPicker, setShowFromPicker] = useState<boolean>(false);
  const [showToPicker, setShowToPicker] = useState<boolean>(false);

  // For Override form
  const [overrideMonth, setOverrideMonth] = useState<string>(selectedMonth || "");
  const [showOverrideMonthPicker, setShowOverrideMonthPicker] = useState<boolean>(false);

  const [expandedHistory, setExpandedHistory] = useState<{ [catId: number]: boolean }>({});
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [todayStr, setTodayStr] = useState<string>("");

  useEffect(() => {
    const t = new Date();
    setTodayStr(t.toISOString().split("T")[0]);
    if (!selectedMonth) {
      setOverrideMonth(t.toISOString().slice(0, 7));
    }
  }, [selectedMonth]);

  useEffect(() => {
    if (isOpen) {
      document.body.classList.add("modal-open");
      if (initialCategoryToEdit) {
        handleOpenNewBudget(initialCategoryToEdit);
      }
    } else {
      document.body.classList.remove("modal-open");
    }
    return () => {
      document.body.classList.remove("modal-open");
    };
  }, [isOpen, initialCategoryToEdit]);

  if (!isOpen) return null;

  const activeCategories = categories.filter((c) => c.active !== false);
  const activeLocations = locations.filter((l) => l.active !== false);

  const toggleHistory = (catId: number) => {
    setExpandedHistory((prev) => ({ ...prev, [catId]: !prev[catId] }));
  };

  // 1. Open form for setting NEW budget range
  const handleOpenNewBudget = (cat: Category) => {
    const catBudgets = budgets
      .filter((b) => b.categoryId === cat.id)
      .sort((a, b) => b.effectiveFrom.localeCompare(a.effectiveFrom));
    
    const activeBudget = catBudgets.find((b) => !b.effectiveTo || b.effectiveTo >= todayStr);

    setEditingCategory(cat);
    setCorrectingRow(null);
    setFormMode("new");
    setAmount(activeBudget ? activeBudget.monthlyBudget : "");
    setEffectiveFrom(todayStr);
    setEffectiveTo("");
    setNote("");
    setErrorMessage(null);
    setShowFromPicker(false);
    setShowToPicker(false);
  };

  // 2. Direct correction of an EXACT budget row in place
  const handleOpenCorrection = (cat: Category, row: BudgetRow) => {
    setEditingCategory(cat);
    setCorrectingRow(row);
    setFormMode("correct");
    setAmount(row.monthlyBudget);
    setEffectiveFrom(row.effectiveFrom);
    setEffectiveTo(row.effectiveTo || "");
    setNote(row.note || "");
    setErrorMessage(null);
    setShowFromPicker(false);
    setShowToPicker(false);
  };

  // 3. Open single-month override form
  const handleOpenOverride = (cat: Category) => {
    const targetMonth = selectedMonth || overrideMonth || new Date().toISOString().slice(0, 7);
    const [yStr, mStr] = targetMonth.split("-");
    const existingOv = overrides.find(
      (o) => o.categoryId === cat.id && o.year === parseInt(yStr, 10) && o.month === parseInt(mStr, 10)
    );

    setEditingCategory(cat);
    setFormMode("override");
    setOverrideMonth(targetMonth);
    setAmount(existingOv ? existingOv.amount : "");
    setNote(existingOv?.note || "");
    setErrorMessage(null);
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory) return;

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setErrorMessage("Please enter a valid budget amount.");
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);

    try {
      if (formMode === "correct" && correctingRow) {
        // Direct UPDATE of exact row in place
        const res = await fetch(`/api/budgets/${correctingRow.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            monthlyBudget: parsedAmount,
            effectiveFrom,
            effectiveTo: effectiveTo || null,
            note: note.trim() || null,
          }),
        });
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || "Failed to update budget row");
        }
      } else if (formMode === "override") {
        // One-off month override
        const [yStr, mStr] = overrideMonth.split("-");
        const year = parseInt(yStr, 10);
        const month = parseInt(mStr, 10);

        const res = await fetch("/api/budget-overrides", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            categoryId: editingCategory.id,
            year,
            month,
            amount: parsedAmount,
            note: note.trim() || null,
          }),
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || "Failed to save override");
        }
      } else {
        // Default "new" budget (inserts new row & closes open row)
        const res = await fetch(`/api/categories/${editingCategory.id}/budget`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            monthlyBudget: parsedAmount,
            effectiveFrom,
            effectiveTo: effectiveTo || null,
            note: note.trim() || null,
          }),
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || "Failed to save budget");
        }
      }

      await onRefresh();
      setEditingCategory(null);
      setFormMode(null);
    } catch (err: any) {
      setErrorMessage(err.message || "An unexpected error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveOverride = async (overrideId: number) => {
    try {
      const res = await fetch(`/api/budget-overrides?id=${overrideId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        throw new Error("Failed to delete override");
      }
      await onRefresh();
    } catch (err: any) {
      alert(err.message || "Failed to remove override");
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidthClass="max-w-3xl" zIndexClass="z-[100]">
      {/* Header */}
      <div className="flex items-center justify-between border-b-2 border-[#b8912f] p-4 bg-[#e8decb]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-[#10202b] text-[#b8912f] flex items-center justify-center">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-serif text-lg font-bold text-[#10202b]">
                Manage Category Budgets
              </h2>
              <p className="text-xs text-gray-600">
                Configure monthly budgets, history, and single-month overrides
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-[#d8ceba] text-gray-700 hover:text-black transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body: Categories Grouped by Location */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-6 flex-1">
          {activeLocations.map((loc) => {
            const locCategories = activeCategories.filter((c) => c.locationId === loc.id);
            if (locCategories.length === 0) return null;

            return (
              <div key={loc.id} className="space-y-3">
                <div className="flex items-center gap-2 border-b border-[#d8ceba] pb-1.5">
                  <span
                    className="w-3.5 h-3.5 rounded-full inline-block shrink-0"
                    style={{ backgroundColor: loc.color }}
                  />
                  <h3 className="font-serif text-sm font-bold uppercase tracking-wider text-[#10202b]">
                    {capitalizeFirst(loc.name)}
                  </h3>
                  <span className="text-xs font-mono font-medium text-gray-500">
                    ({locCategories.length} categories)
                  </span>
                </div>

                <div className="space-y-2.5">
                  {locCategories.map((cat) => {
                    const catBudgets = budgets
                      .filter((b) => b.categoryId === cat.id)
                      .sort((a, b) => b.effectiveFrom.localeCompare(a.effectiveFrom));

                    // Current active budget row
                    const activeBudgetRow = catBudgets.find(
                      (b) => !b.effectiveTo || b.effectiveTo >= todayStr
                    );

                    // Check active override for selected month
                    const targetMonth = selectedMonth || overrideMonth || "";
                    const [yStr, mStr] = targetMonth.split("-");
                    const activeOverride = overrides.find(
                      (o) => o.categoryId === cat.id && o.year === parseInt(yStr, 10) && o.month === parseInt(mStr, 10)
                    );

                    const IconComp = getCategoryIcon(cat.name, cat.keywords);
                    const isHistoryOpen = !!expandedHistory[cat.id];

                    return (
                      <div
                        key={cat.id}
                        className="bg-[#fbf8f3] border border-[#d8ceba] rounded-lg p-3 shadow-sm hover:border-[#b8912f] transition"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <div
                              className="w-8 h-8 rounded-lg flex items-center justify-center text-white shrink-0"
                              style={{ backgroundColor: loc.color }}
                            >
                              <IconComp className="w-4 h-4" />
                            </div>

                            <div>
                              <span className="font-serif font-bold text-sm text-[#10202b] block truncate">
                                {cat.name}
                              </span>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 shrink-0">
                            {catBudgets.length > 0 && (
                              <button
                                type="button"
                                onClick={() => toggleHistory(cat.id)}
                                className="px-2.5 py-1.5 rounded-lg border border-[#d8ceba] bg-[#f2ece0] hover:bg-[#e4dbca] text-xs font-medium text-gray-700 flex items-center gap-1 transition"
                              >
                                <History className="w-3.5 h-3.5 text-gray-600" />
                                <span>History ({catBudgets.length})</span>
                                {isHistoryOpen ? (
                                  <ChevronUp className="w-3.5 h-3.5" />
                                ) : (
                                  <ChevronDown className="w-3.5 h-3.5" />
                                )}
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => handleOpenOverride(cat)}
                              className="px-2.5 py-1.5 rounded-lg border border-[#b8912f] bg-[#fbf8f3] hover:bg-[#e8decb] text-[#10202b] text-xs font-bold font-serif flex items-center gap-1 transition"
                              title="Set one-off single-month adjustment (higher or lower)"
                            >
                              <Clock className="w-3.5 h-3.5 text-[#b8912f]" />
                              <span>Budget add-on</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleOpenNewBudget(cat)}
                              className="px-3 py-1.5 rounded-lg bg-[#b8912f] hover:bg-[#a07c24] text-white text-xs font-bold font-serif flex items-center gap-1.5 shadow transition"
                            >
                              {activeBudgetRow ? (
                                <>
                                  <Plus className="w-3.5 h-3.5" />
                                  <span>Set New Budget</span>
                                </>
                              ) : (
                                <>
                                  <Plus className="w-3.5 h-3.5" />
                                  <span>Set Budget</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>

                        {/* Current Active Row & Override Badge */}
                        <div className="mt-2 pt-2 border-t border-[#e4dbca]/60 flex flex-wrap items-center justify-between gap-2 text-xs">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-[11px] font-serif font-bold uppercase tracking-wider text-gray-500">
                              Current Budget:
                            </span>
                            {activeBudgetRow ? (
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-[#2f7d76] flex items-center gap-1.5">
                                  ₹{parseFloat(activeBudgetRow.monthlyBudget).toLocaleString("en-IN")} / mo
                                  <span className="text-[10px] text-gray-500 font-sans font-normal">
                                    (Effective: {activeBudgetRow.effectiveFrom} {activeBudgetRow.effectiveTo ? `to ${activeBudgetRow.effectiveTo}` : "onwards"})
                                  </span>
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleOpenCorrection(cat, activeBudgetRow)}
                                  className="text-[11px] text-[#b8912f] hover:underline font-serif font-semibold flex items-center gap-0.5 ml-1"
                                  title="Correct typo in this exact budget entry without inserting new row"
                                >
                                  <Edit2 className="w-3 h-3" />
                                  <span>Correct entry</span>
                                </button>
                              </div>
                            ) : (
                              <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-100 text-amber-800 border border-amber-300">
                                No active budget
                              </span>
                            )}
                          </div>

                          {activeOverride && (
                            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-amber-100 border border-amber-300 rounded text-amber-900 text-[11px] font-medium">
                              <span className="font-bold">Budget add-on applied ({targetMonth}):</span>
                              <span className="font-mono font-bold">₹{parseFloat(activeOverride.amount).toLocaleString("en-IN")}</span>
                              <button
                                type="button"
                                onClick={() => handleRemoveOverride(activeOverride.id)}
                                className="p-0.5 hover:bg-amber-200 rounded text-amber-800 transition"
                                title="Remove add-on and revert to normal budget"
                              >
                                <Trash2 className="w-3 h-3 text-red-600" />
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Collapsible History Section with Direct Edit for Each Row */}
                        {isHistoryOpen && catBudgets.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-[#e4dbca] space-y-2 bg-[#f2ece0] p-3 rounded-lg">
                            <h4 className="font-serif text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                              Budget History (Click 'Correct entry' to edit in place)
                            </h4>
                            <div className="space-y-1.5 font-mono text-xs">
                              {catBudgets.map((b) => (
                                <div
                                  key={b.id}
                                  className="flex flex-wrap items-center justify-between gap-2 p-2 bg-[#fbf8f3] border border-[#d8ceba] rounded text-[#10202b]"
                                >
                                  <div className="flex items-center gap-3">
                                    <div>
                                      <span className="font-bold text-[#10202b] mr-2">
                                        ₹{parseFloat(b.monthlyBudget).toLocaleString("en-IN")}
                                      </span>
                                      <span className="text-gray-600 text-[11px] font-sans">
                                        {b.effectiveFrom} to {b.effectiveTo || "Present"}
                                      </span>
                                    </div>
                                    {b.note && (
                                      <span className="text-[11px] font-sans text-gray-500 italic max-w-xs truncate">
                                        Note: {b.note}
                                      </span>
                                    )}
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => handleOpenCorrection(cat, b)}
                                    className="px-2 py-0.5 rounded border border-[#d8ceba] bg-[#f2ece0] hover:bg-[#e4dbca] text-[11px] font-serif font-bold text-[#10202b] flex items-center gap-1 transition"
                                  >
                                    <Edit2 className="w-3 h-3 text-[#b8912f]" />
                                    <span>Correct entry</span>
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Modal Form Dialog */}
        <Modal
          isOpen={!!(editingCategory && formMode)}
          onClose={() => {
            setEditingCategory(null);
            setFormMode(null);
          }}
          maxWidthClass="max-w-md"
          zIndexClass="z-[110]"
        >
          <div className="flex items-center justify-between border-b border-[#b8912f] pb-3 p-5 bg-[#e8decb]">
            <div className="flex items-center gap-2">
              <span className="font-serif font-bold text-base text-[#10202b]">
                {formMode === "correct"
                  ? `Correct Entry for ${editingCategory?.name}`
                  : formMode === "override"
                  ? `One-Off Month Override (${editingCategory?.name})`
                  : `Set New Budget for ${editingCategory?.name}`}
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                setEditingCategory(null);
                setFormMode(null);
              }}
              className="p-1 rounded hover:bg-[#d8ceba] text-gray-700"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-5 overflow-y-auto">
            {errorMessage && (
              <div className="mb-4 p-3 rounded-lg bg-red-100 border border-red-300 text-red-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {formMode === "override" ? (
                <>
                  {/* Override Month Selector */}
                  <div className="relative">
                    <label className="block text-xs font-serif font-bold uppercase tracking-wider text-gray-700 mb-1">
                      Override Target Month *
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowOverrideMonthPicker(!showOverrideMonthPicker)}
                      className="w-full px-3 py-2 border border-[#d8ceba] bg-[#fbf8f3] rounded-lg font-mono text-xs text-[#10202b] flex items-center justify-between hover:border-[#b8912f]"
                    >
                      <span>{overrideMonth}</span>
                      <Calendar className="w-4 h-4 text-[#b8912f]" />
                    </button>

                    {showOverrideMonthPicker && (
                      <SharedDatePicker
                        mode="month"
                        value={overrideMonth}
                        onChange={(m) => setOverrideMonth(m)}
                        onClose={() => setShowOverrideMonthPicker(false)}
                      />
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-serif font-bold uppercase tracking-wider text-gray-700 mb-1">
                      One-Time Override Amount (₹) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      placeholder="e.g. 12000"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full px-3 py-2 border border-[#d8ceba] bg-[#fbf8f3] rounded-lg font-mono font-bold text-sm text-[#10202b] focus:outline-none focus:border-[#b8912f]"
                      autoFocus
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-xs font-serif font-bold uppercase tracking-wider text-gray-700 mb-1">
                      Monthly Budget Amount (₹) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      placeholder="e.g. 5000"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full px-3 py-2 border border-[#d8ceba] bg-[#fbf8f3] rounded-lg font-mono font-bold text-sm text-[#10202b] focus:outline-none focus:border-[#b8912f]"
                      autoFocus
                    />
                  </div>

                  {/* Effective From Date */}
                  <div className="relative">
                    <label className="block text-xs font-serif font-bold uppercase tracking-wider text-gray-700 mb-1">
                      Effective From Date *
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setShowFromPicker(!showFromPicker);
                        setShowToPicker(false);
                      }}
                      className="w-full px-3 py-2 border border-[#d8ceba] bg-[#fbf8f3] rounded-lg font-mono text-xs text-[#10202b] flex items-center justify-between hover:border-[#b8912f]"
                    >
                      <span>{effectiveFrom || "Select date"}</span>
                      <Calendar className="w-4 h-4 text-[#b8912f]" />
                    </button>

                    {showFromPicker && (
                      <SharedDatePicker
                        mode="day"
                        value={effectiveFrom}
                        allowFuture={true}
                        onChange={(d) => setEffectiveFrom(d)}
                        onClose={() => setShowFromPicker(false)}
                      />
                    )}
                  </div>

                  {/* Effective To Date (Optional) */}
                  <div className="relative">
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-serif font-bold uppercase tracking-wider text-gray-700">
                        Effective To Date (Optional)
                      </label>
                      {effectiveTo && (
                        <button
                          type="button"
                          onClick={() => setEffectiveTo("")}
                          className="text-[10px] text-red-600 hover:underline font-serif"
                        >
                          Clear (Open-ended)
                        </button>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setShowToPicker(!showToPicker);
                        setShowFromPicker(false);
                      }}
                      className="w-full px-3 py-2 border border-[#d8ceba] bg-[#fbf8f3] rounded-lg font-mono text-xs text-[#10202b] flex items-center justify-between hover:border-[#b8912f]"
                    >
                      <span>{effectiveTo || "Open-ended (No end date)"}</span>
                      <Calendar className="w-4 h-4 text-[#b8912f]" />
                    </button>

                    {showToPicker && (
                      <SharedDatePicker
                        mode="day"
                        value={effectiveTo || todayStr}
                        allowFuture={true}
                        onChange={(d) => setEffectiveTo(d)}
                        onClose={() => setShowToPicker(false)}
                      />
                    )}
                  </div>
                </>
              )}

              {/* Optional Note */}
              <div>
                <label className="block text-xs font-serif font-bold uppercase tracking-wider text-gray-700 mb-1">
                  Note (Optional)
                </label>
                <input
                  type="text"
                  placeholder={formMode === "override" ? "e.g. Host family dinner" : "e.g. Corrected typo / updated rate"}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full px-3 py-2 border border-[#d8ceba] bg-[#fbf8f3] rounded-lg text-xs text-[#10202b] focus:outline-none focus:border-[#b8912f]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#d8ceba]">
                <button
                  type="button"
                  onClick={() => {
                    setEditingCategory(null);
                    setFormMode(null);
                  }}
                  className="px-4 py-2 rounded-lg border border-[#d8ceba] bg-[#fbf8f3] hover:bg-[#e4dbca] text-xs font-serif font-bold text-[#10202b]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-lg bg-[#b8912f] hover:bg-[#a07c24] text-white text-xs font-serif font-bold flex items-center gap-1.5 shadow"
                >
                  {submitting
                    ? "Saving..."
                    : formMode === "correct"
                    ? "Update Row In-Place"
                    : formMode === "override"
                    ? "Save Override"
                    : "Save New Budget"}
                </button>
              </div>
            </form>
          </div>
        </Modal>
    </Modal>
  );
}

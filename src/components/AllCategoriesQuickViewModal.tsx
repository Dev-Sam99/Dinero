import { useState, useEffect } from "react";
import { X, Search, Edit2, Plus, Tag, AlertTriangle, Check, Trash2, Power } from "lucide-react";
import { getCategoryIcon, capitalizeFirst, AVAILABLE_ICONS } from "../lib/utils";
import Modal from "./Modal";

interface Category {
  id: number;
  name: string;
  keywords: string[];
  locationId: number;
  iconOverride?: string | null;
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

interface AllCategoriesQuickViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  locations: Location[];
  budgets: BudgetRow[];
  expenses?: { id: number; categoryId: number | null }[];
  onSelectCategoryToEdit: (cat: Category) => void;
  onRefresh?: () => Promise<void> | void;
}

export default function AllCategoriesQuickViewModal({
  isOpen,
  onClose,
  categories,
  locations,
  budgets,
  expenses = [],
  onSelectCategoryToEdit,
  onRefresh,
}: AllCategoriesQuickViewModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editName, setEditName] = useState("");
  const [editKeywords, setEditKeywords] = useState<string[]>([]);
  const [newKeywordInput, setNewKeywordInput] = useState("");
  const [editLocationId, setEditLocationId] = useState<number>(1);
  const [selectedIconName, setSelectedIconName] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Warnings
  const [showLocationWarning, setShowLocationWarning] = useState(false);
  const [showDeactivateWarning, setShowDeactivateWarning] = useState(false);
  const [deactivateDetails, setDeactivateDetails] = useState<{ expenseCount: number; hasActiveBudget: boolean }>({
    expenseCount: 0,
    hasActiveBudget: false,
  });

  useEffect(() => {
    if (isOpen) {
      document.body.classList.add("modal-open");
    } else {
      document.body.classList.remove("modal-open");
    }
    return () => {
      document.body.classList.remove("modal-open");
    };
  }, [isOpen]);

  const [todayStr, setTodayStr] = useState<string>("");

  useEffect(() => {
    setTodayStr(new Date().toISOString().split("T")[0]);
  }, []);

  if (!isOpen) return null;

  const activeLocations = locations.filter((l) => l.active !== false);

  const filteredCategories = categories.filter((cat) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    const nameMatch = cat.name.toLowerCase().includes(q);
    const keywordMatch = cat.keywords?.some((k) => k.toLowerCase().includes(q));
    return nameMatch || keywordMatch;
  });

  const handleOpenEdit = (cat: Category, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingCategory(cat);
    setEditName(cat.name);
    setEditKeywords(cat.keywords || []);
    setNewKeywordInput("");
    setEditLocationId(cat.locationId);
    setSelectedIconName(cat.iconOverride || null);
    setShowLocationWarning(false);
    setShowDeactivateWarning(false);
    setError(null);
  };

  const handleAddKeyword = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = newKeywordInput.trim().toLowerCase();
    if (trimmed && !editKeywords.includes(trimmed)) {
      setEditKeywords([...editKeywords, trimmed]);
      setNewKeywordInput("");
    }
  };

  const handleRemoveKeyword = (kwToRemove: string) => {
    setEditKeywords(editKeywords.filter((k) => k !== kwToRemove));
  };

  const executeSaveCategory = async (overrideLocationCheck = false) => {
    if (!editingCategory || !editName.trim()) return;

    if (!overrideLocationCheck && editLocationId !== editingCategory.locationId) {
      setShowLocationWarning(true);
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const res = await fetch(`/api/categories/${editingCategory.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName.trim(),
          keywords: editKeywords,
          locationId: editLocationId,
          iconOverride: selectedIconName,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update category");
      }

      if (onRefresh) await onRefresh();
      setEditingCategory(null);
      setShowLocationWarning(false);
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setSaving(false);
    }
  };

  const handlePromptDeactivate = () => {
    if (!editingCategory) return;
    const catExpenses = expenses.filter((e) => e.categoryId === editingCategory.id);
    const catBudgets = budgets.filter((b) => b.categoryId === editingCategory.id);
    const hasActiveBudget = catBudgets.some((b) => !b.effectiveTo || b.effectiveTo >= todayStr);

    setDeactivateDetails({
      expenseCount: catExpenses.length,
      hasActiveBudget,
    });
    setShowDeactivateWarning(true);
  };

  const executeToggleActive = async (newActiveState: boolean) => {
    if (!editingCategory) return;

    setSaving(true);
    setError(null);

    try {
      const res = await fetch(`/api/categories/${editingCategory.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editingCategory.name,
          active: newActiveState,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to toggle category active status");
      }

      if (onRefresh) await onRefresh();
      setEditingCategory(null);
      setShowDeactivateWarning(false);
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidthClass="max-w-2xl" zIndexClass="z-[100]">
      {/* Header */}
      <div className="flex items-center justify-between border-b-2 border-[#b8912f] p-4 bg-[#e8decb]">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-[#10202b] text-[#b8912f] flex items-center justify-center font-serif font-bold text-lg">
            <Tag className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-serif text-lg font-bold text-[#10202b]">
              All Categories Quick-View
            </h2>
            <p className="text-xs text-gray-600">
              Full list of all {categories.length} categories (active & inactive)
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

      {/* Search Input Bar */}
      <div className="p-3 bg-[#e8decb]/50 border-b border-[#d8ceba]">
        <div className="relative">
          <Search className="w-4 h-4 text-[#b8912f] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search categories by name or keyword..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-[#d8ceba] bg-[#fbf8f3] rounded-lg font-sans text-xs text-[#10202b] focus:outline-none focus:border-[#b8912f]"
            autoFocus
          />
        </div>
      </div>

      {/* Categories Grouped by Location */}
      <div className="p-4 sm:p-5 overflow-y-auto space-y-5 flex-1">
        {activeLocations.map((loc) => {
          const locCats = filteredCategories.filter((c) => c.locationId === loc.id);
          if (locCats.length === 0) return null;

          return (
            <div key={loc.id} className="space-y-2.5">
              <div className="flex items-center gap-2 border-b border-[#d8ceba] pb-1">
                <span
                  className="w-3.5 h-3.5 rounded-full inline-block shrink-0"
                  style={{ backgroundColor: loc.color }}
                />
                <h3 className="font-serif text-xs font-bold uppercase tracking-wider text-[#10202b]">
                  {capitalizeFirst(loc.name)}
                </h3>
                <span className="text-[11px] font-mono text-gray-500">
                  ({locCats.length})
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {locCats.map((cat) => {
                  const catBudgets = budgets
                    .filter((b) => b.categoryId === cat.id)
                    .sort((a, b) => b.effectiveFrom.localeCompare(a.effectiveFrom));

                  const activeBudget = catBudgets.find(
                    (b) => !b.effectiveTo || b.effectiveTo >= todayStr
                  );

                  const IconComp = getCategoryIcon(cat.name, cat.keywords, cat.iconOverride);
                  const isInactive = cat.active === false;

                  return (
                    <div
                      key={cat.id}
                      className={`border rounded-lg p-2.5 flex items-center justify-between text-left transition hover:shadow-sm group cursor-pointer ${
                        isInactive
                          ? "bg-gray-200/70 border-gray-300 opacity-65"
                          : "bg-[#fbf8f3] border-[#d8ceba] hover:border-[#b8912f]"
                      }`}
                      onClick={() => {
                        if (!isInactive) {
                          onSelectCategoryToEdit(cat);
                          onClose();
                        }
                      }}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className="w-7 h-7 rounded flex items-center justify-center text-white shrink-0"
                          style={{ backgroundColor: isInactive ? "#6b7280" : loc.color }}
                        >
                          <IconComp className="w-3.5 h-3.5" />
                        </div>
                        <div className="truncate">
                          <div className="flex items-center gap-1.5">
                            <span className="font-serif font-bold text-xs text-[#10202b] truncate group-hover:underline">
                              {cat.name}
                            </span>
                            {isInactive && (
                              <span className="px-1.5 py-0.2 text-[9px] font-bold rounded bg-gray-300 text-gray-700 uppercase">
                                Inactive
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] font-mono block">
                            {activeBudget ? (
                              <span className="text-[#2f7d76] font-bold">
                                ₹{parseFloat(activeBudget.monthlyBudget).toLocaleString("en-IN")}/mo
                              </span>
                            ) : (
                              <span className="text-amber-700 italic">No budget set</span>
                            )}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0 ml-2">
                        <button
                          type="button"
                          onClick={(e) => handleOpenEdit(cat, e)}
                          className="p-1.5 rounded bg-[#e4dbca] text-gray-700 hover:bg-[#b8912f] hover:text-white transition"
                          title="Edit category details"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        {!isInactive && (
                          <div className="p-1.5 rounded bg-[#e4dbca] text-gray-700 group-hover:bg-[#b8912f] group-hover:text-white transition">
                            <Plus className="w-3.5 h-3.5" />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {filteredCategories.length === 0 && (
          <div className="text-center py-8 text-gray-500 font-serif text-sm border-2 border-dashed border-[#d8ceba] rounded-lg">
            No categories match &quot;{searchQuery}&quot;
          </div>
        )}
      </div>

      {/* Category Edit Sub-Modal */}
      {editingCategory && (
        <Modal
          isOpen={!!editingCategory}
          onClose={() => setEditingCategory(null)}
          maxWidthClass="max-w-md"
          zIndexClass="z-[110]"
        >
          <div className="flex items-center justify-between border-b border-[#b8912f] p-4 bg-[#e8decb]">
            <h3 className="font-serif font-bold text-base text-[#10202b]">
              Edit Category Details
            </h3>
            <button
              type="button"
              onClick={() => setEditingCategory(null)}
              className="p-1 rounded hover:bg-[#d8ceba] text-gray-700"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              executeSaveCategory(false);
            }}
            className="p-4 space-y-4 max-h-[75vh] overflow-y-auto"
          >
            {error && (
              <div className="p-2.5 rounded bg-red-100 border border-red-300 text-red-800 text-xs">
                {error}
              </div>
            )}

            {/* Name */}
            <div>
              <label className="block text-xs font-serif font-bold uppercase tracking-wider text-gray-700 mb-1">
                Category Name *
              </label>
              <input
                type="text"
                required
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full px-3 py-2 border border-[#d8ceba] bg-[#fbf8f3] rounded-lg text-xs font-bold text-[#10202b] focus:outline-none focus:border-[#b8912f]"
              />
            </div>

            {/* Location */}
            <div>
              <label className="block text-xs font-serif font-bold uppercase tracking-wider text-gray-700 mb-1">
                Assigned Location *
              </label>
              <select
                value={editLocationId}
                onChange={(e) => setEditLocationId(Number(e.target.value))}
                className="w-full px-3 py-2 border border-[#d8ceba] bg-[#fbf8f3] rounded-lg text-xs font-bold text-[#10202b] focus:outline-none focus:border-[#b8912f]"
              >
                {activeLocations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {capitalizeFirst(loc.name)}
                  </option>
                ))}
              </select>
            </div>

            {/* Location Change Confirmation Dialog */}
            {showLocationWarning && (
              <div className="p-3 bg-amber-50 border-2 border-amber-400 rounded-lg text-amber-900 text-xs space-y-2 animate-fade-scale">
                <div className="flex items-center gap-2 font-bold font-serif">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Location Transfer Warning</span>
                </div>
                <p className="text-[11px]">
                  Changing location will move this category&apos;s spend into a different location&apos;s totals in the Budget Dashboard. Continue?
                </p>
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowLocationWarning(false)}
                    className="px-2.5 py-1 text-[11px] font-bold rounded border border-amber-300 bg-white hover:bg-amber-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => executeSaveCategory(true)}
                    className="px-2.5 py-1 text-[11px] font-bold rounded bg-amber-600 text-white hover:bg-amber-700"
                  >
                    Confirm & Move Location
                  </button>
                </div>
              </div>
            )}

            {/* Keywords */}
            <div>
              <label className="block text-xs font-serif font-bold uppercase tracking-wider text-gray-700 mb-1">
                Auto-Categorization Keywords
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={newKeywordInput}
                  onChange={(e) => setNewKeywordInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddKeyword();
                    }
                  }}
                  placeholder="Add a keyword..."
                  className="flex-1 px-3 py-1.5 border border-[#d8ceba] bg-[#fbf8f3] rounded-lg text-xs text-[#10202b] focus:outline-none focus:border-[#b8912f]"
                />
                <button
                  type="button"
                  onClick={() => handleAddKeyword()}
                  className="px-3 py-1.5 bg-[#b8912f] text-white text-xs font-bold font-serif rounded-lg hover:bg-[#a07c24]"
                >
                  Add
                </button>
              </div>

              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1 bg-[#f2ece0] rounded border border-[#d8ceba]">
                {editKeywords.map((kw) => (
                  <span
                    key={kw}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono bg-[#fbf8f3] border border-[#d8ceba] text-[#10202b]"
                  >
                    <span>{kw}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveKeyword(kw)}
                      className="text-gray-400 hover:text-red-600 font-bold ml-0.5"
                    >
                      ✕
                    </button>
                  </span>
                ))}
                {editKeywords.length === 0 && (
                  <span className="text-[10px] text-gray-400 italic p-1">No keywords set</span>
                )}
              </div>
            </div>

            {/* Icon Picker */}
            <div>
              <label className="block text-xs font-serif font-bold uppercase tracking-wider text-gray-700 mb-1">
                Category Icon Override
              </label>
              <div className="grid grid-cols-8 gap-1.5 p-2 bg-[#f2ece0] border border-[#d8ceba] rounded-lg max-h-32 overflow-y-auto">
                <button
                  type="button"
                  onClick={() => setSelectedIconName(null)}
                  className={`p-1.5 rounded flex items-center justify-center transition border ${
                    selectedIconName === null
                      ? "bg-[#10202b] text-white border-[#10202b] font-bold"
                      : "bg-[#fbf8f3] text-gray-600 border-[#d8ceba] hover:border-[#b8912f]"
                  }`}
                  title="Auto-mapping based on keywords"
                >
                  <span className="text-[9px] font-mono">Auto</span>
                </button>
                {Object.entries(AVAILABLE_ICONS).map(([iconKey, IconComponent]) => {
                  const isSelected = selectedIconName === iconKey;
                  return (
                    <button
                      key={iconKey}
                      type="button"
                      onClick={() => setSelectedIconName(iconKey)}
                      className={`p-1.5 rounded flex items-center justify-center transition border ${
                        isSelected
                          ? "bg-[#b8912f] text-white border-[#b8912f] shadow"
                          : "bg-[#fbf8f3] text-[#10202b] border-[#d8ceba] hover:border-[#b8912f]"
                      }`}
                      title={iconKey}
                    >
                      <IconComponent className="w-4 h-4" />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Deactivation Section */}
            <div className="pt-3 border-t border-[#d8ceba]">
              {showDeactivateWarning ? (
                <div className="p-3 bg-red-50 border-2 border-red-300 rounded-lg text-red-900 text-xs space-y-2 animate-fade-scale">
                  <div className="flex items-center gap-2 font-bold font-serif text-red-700">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>Confirm Category Deactivation</span>
                  </div>
                  <p className="text-[11px]">
                    This category has <strong className="font-mono">{deactivateDetails.expenseCount}</strong> expenses
                    {deactivateDetails.hasActiveBudget ? " and an active budget" : ""}. It will be hidden from pickers and the dashboard but its historical data will be preserved.
                  </p>
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowDeactivateWarning(false)}
                      className="px-2.5 py-1 text-[11px] font-bold rounded border border-gray-300 bg-white hover:bg-gray-100"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => executeToggleActive(false)}
                      className="px-2.5 py-1 text-[11px] font-bold rounded bg-red-600 text-white hover:bg-red-700"
                    >
                      Deactivate Category
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500 font-sans">
                    Category status: <strong className="font-mono">{editingCategory.active === false ? "Inactive" : "Active"}</strong>
                  </span>
                  {editingCategory.active === false ? (
                    <button
                      type="button"
                      onClick={() => executeToggleActive(true)}
                      className="px-2.5 py-1 text-xs font-serif font-bold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 rounded-lg transition"
                    >
                      Reactivate Category
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handlePromptDeactivate}
                      className="px-2.5 py-1 text-xs font-serif font-bold text-red-700 hover:bg-red-100 border border-red-300 rounded-lg transition"
                    >
                      Deactivate Category
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#d8ceba]">
              <button
                type="button"
                onClick={() => setEditingCategory(null)}
                className="px-3.5 py-1.5 rounded-lg border border-[#d8ceba] bg-[#fbf8f3] text-xs font-serif font-bold text-[#10202b]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-1.5 rounded-lg bg-[#b8912f] hover:bg-[#a07c24] text-white text-xs font-serif font-bold shadow"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </Modal>
  );
}

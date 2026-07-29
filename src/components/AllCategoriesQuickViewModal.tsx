"use client";

import { useState } from "react";
import { X, Search, Edit2, Plus, Tag } from "lucide-react";
import { getCategoryIcon, capitalizeFirst } from "../lib/utils";

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

interface AllCategoriesQuickViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  locations: Location[];
  budgets: BudgetRow[];
  onSelectCategoryToEdit: (cat: Category) => void;
}

export default function AllCategoriesQuickViewModal({
  isOpen,
  onClose,
  categories,
  locations,
  budgets,
  onSelectCategoryToEdit,
}: AllCategoriesQuickViewModalProps) {
  const [searchQuery, setSearchQuery] = useState("");

  if (!isOpen) return null;

  const todayStr = new Date().toISOString().split("T")[0];
  const activeCategories = categories.filter((c) => c.active !== false);
  const activeLocations = locations.filter((l) => l.active !== false);

  const filteredCategories = activeCategories.filter((cat) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    const nameMatch = cat.name.toLowerCase().includes(q);
    const keywordMatch = cat.keywords?.some((k) => k.toLowerCase().includes(q));
    return nameMatch || keywordMatch;
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-[#f2ece0] border-2 border-[#b8912f] rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col text-[#10202b] relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
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
                Full list of all {activeCategories.length} categories grouped by location
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

                    const IconComp = getCategoryIcon(cat.name, cat.keywords);

                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => {
                          onSelectCategoryToEdit(cat);
                          onClose();
                        }}
                        className="bg-[#fbf8f3] border border-[#d8ceba] hover:border-[#b8912f] rounded-lg p-2.5 flex items-center justify-between text-left transition hover:shadow-sm group"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className="w-7 h-7 rounded flex items-center justify-center text-white shrink-0"
                            style={{ backgroundColor: loc.color }}
                          >
                            <IconComp className="w-3.5 h-3.5" />
                          </div>
                          <div className="truncate">
                            <span className="font-serif font-bold text-xs text-[#10202b] block truncate group-hover:underline">
                              {cat.name}
                            </span>
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

                        <div className="p-1 rounded bg-[#e4dbca] text-gray-700 group-hover:bg-[#b8912f] group-hover:text-white transition shrink-0 ml-2">
                          {activeBudget ? <Edit2 className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                        </div>
                      </button>
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
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import SharedDatePicker from "./SharedDatePicker";
import ManageBudgetsModal from "./ManageBudgetsModal";
import AllCategoriesQuickViewModal from "./AllCategoriesQuickViewModal";
import { getBudgetForMonth, BudgetOverrideRow, ResolvedBudgetResult } from "../lib/budget-resolver";
import { getCategoryIcon, capitalizeFirst } from "../lib/utils";
import { Clock, Trash2, Calendar, Filter, PieChart, AlertCircle, Settings, List, ChevronDown, ChevronUp } from "lucide-react";

interface BudgetVsActualProps {
  expenses: {
    id: number;
    amount: string;
    categoryId: number | null;
    locationId: number;
    date: string;
  }[];
  categories: { id: number; name: string; keywords: string[]; locationId: number; active?: boolean }[];
  locations: { id: number; name: string; color: string; active: boolean }[];
  budgets: {
    id: number;
    categoryId: number;
    monthlyBudget: string;
    effectiveFrom: string;
    effectiveTo: string | null;
    note?: string | null;
  }[];
  overrides?: BudgetOverrideRow[];
  onRefresh?: () => Promise<void> | void;
}

export default function BudgetVsActual({
  expenses,
  categories,
  locations,
  budgets,
  overrides = [],
  onRefresh,
}: BudgetVsActualProps) {
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [selectedLocationId, setSelectedLocationId] = useState<number | null>(null);
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [showManageModal, setShowManageModal] = useState(false);
  const [showQuickViewModal, setShowQuickViewModal] = useState(false);

  useEffect(() => {
    const today = new Date();
    const currentMonthStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
    setSelectedMonth(currentMonthStr);
  }, []);
  const [selectedCategoryForManage, setSelectedCategoryForManage] = useState<any>(null);

  const [catPage, setCatPage] = useState(1);
  const [showCatPagePicker, setShowCatPagePicker] = useState(false);
  const [catJumpInput, setCatJumpInput] = useState("1");
  const CAT_PAGE_SIZE = 10;

  const [yearStr, monthStr] = selectedMonth.split("-");
  const numYear = parseInt(yearStr, 10);
  const numMonth = parseInt(monthStr, 10);

  // Month range boundaries
  const monthStart = `${selectedMonth}-01`;
  const lastDay = new Date(numYear, numMonth, 0).getDate();
  const monthEnd = `${selectedMonth}-${String(lastDay).padStart(2, "0")}`;

  // Filter expenses for selected month
  const monthExpenses = expenses.filter((e) => {
    const isMonth = e.date >= monthStart && e.date <= monthEnd;
    const isLoc = selectedLocationId ? e.locationId === selectedLocationId : true;
    return isMonth && isLoc;
  });

  // Calculate actual total spend
  const totalActual = monthExpenses.reduce((acc, e) => acc + parseFloat(e.amount), 0);

  // Filter locations to consider
  const activeLocations = locations.filter((l) =>
    selectedLocationId ? l.id === selectedLocationId && l.active : l.active
  );

  // Resolve category budgets for selected month using getBudgetForMonth (checks override first)
  const resolvedCategoryBudgetInfo: { [catId: number]: ResolvedBudgetResult } = {};
  const resolvedCategoryBudgets: { [catId: number]: number } = {};

  categories.forEach((cat) => {
    const res = getBudgetForMonth(cat.id, numYear, numMonth, budgets, overrides);
    resolvedCategoryBudgetInfo[cat.id] = res;
    if (res.amount > 0) {
      resolvedCategoryBudgets[cat.id] = res.amount;
    }
  });

  // Total resolved budget for selected scope
  const totalBudget = categories
    .filter((c) => (selectedLocationId ? c.locationId === selectedLocationId : true))
    .reduce((acc, c) => acc + (resolvedCategoryBudgets[c.id] || 0), 0);

  const remaining = totalBudget - totalActual;
  const overallPct = totalBudget > 0 ? (totalActual / totalBudget) * 100 : 0;

  // Helper for progress bar colors (<80% normal/teal, 80-100% amber, >100% red)
  const getBarColorClass = (pct: number) => {
    if (pct > 100) return "bg-red-600";
    if (pct >= 80) return "bg-amber-500";
    return "bg-[#2f7d76]";
  };

  const [showAllCategories, setShowAllCategories] = useState(false);

  const filteredCategories = categories.filter((c) =>
    c.active !== false && (selectedLocationId ? c.locationId === selectedLocationId : true)
  );

  const totalCatPages = Math.ceil(filteredCategories.length / CAT_PAGE_SIZE) || 1;
  const paginatedCategories = showAllCategories
    ? filteredCategories
    : filteredCategories.slice((catPage - 1) * CAT_PAGE_SIZE, catPage * CAT_PAGE_SIZE);

  const handleCatJumpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const target = parseInt(catJumpInput, 10);
    if (!isNaN(target) && target >= 1 && target <= totalCatPages) {
      setCatPage(target);
      setShowCatPagePicker(false);
    }
  };

  const [expandedLocations, setExpandedLocations] = useState<{ [locId: number]: boolean }>({});

  const toggleLocationExpand = (locId: number) => {
    setExpandedLocations((prev) => ({ ...prev, [locId]: !prev[locId] }));
  };

  return (
    <div className="bg-[#f2ece0] border-2 border-[#b8912f] rounded-xl p-4 sm:p-5 shadow-lg text-[#10202b]">
      {/* Header & Controls */}
      <div className="flex flex-wrap items-center justify-between border-b-2 border-[#b8912f] pb-3 mb-5 gap-3">
        <div className="flex items-center gap-2">
          <PieChart className="w-6 h-6 text-[#b8912f]" />
          <div>
            <h2 className="font-serif text-lg font-bold text-[#10202b]">
              Budget vs Actual Overview
            </h2>
            <p className="text-xs text-gray-600">
              Resolved budget performance for selected month
            </p>
          </div>
        </div>

        {/* Month Selector & Location Filter Pills & Manage Budgets */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowManageModal(true)}
            className="px-3 py-1.5 rounded-lg border border-[#b8912f] bg-[#10202b] hover:bg-[#1a2e3d] text-[#b8912f] hover:text-white text-xs font-serif font-bold flex items-center gap-1.5 shadow transition"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Manage Budgets</span>
          </button>

          <div className="relative">
            <button
              type="button"
              onClick={() => setShowMonthPicker(!showMonthPicker)}
              className="px-3 py-1.5 rounded-lg border border-[#d8ceba] bg-[#fbf8f3] hover:border-[#b8912f] text-xs font-mono font-bold text-[#10202b] flex items-center gap-1.5"
            >
              <Calendar className="w-3.5 h-3.5 text-[#b8912f]" />
              <span>{selectedMonth}</span>
            </button>

            {showMonthPicker && (
              <SharedDatePicker
                mode="month"
                value={selectedMonth}
                onChange={(m) => {
                  setSelectedMonth(m);
                  setCatPage(1);
                }}
                onClose={() => setShowMonthPicker(false)}
              />
            )}
          </div>

          <div className="flex gap-1 bg-[#e4dbca] p-1 rounded-lg">
            <button
              type="button"
              onClick={() => {
                setSelectedLocationId(null);
                setCatPage(1);
              }}
              className={`px-2.5 py-1 rounded text-xs font-semibold transition ${
                selectedLocationId === null
                  ? "bg-[#10202b] text-white"
                  : "text-gray-700 hover:text-black"
              }`}
            >
              All
            </button>
            {locations.map((loc) => (
              <button
                key={loc.id}
                type="button"
                onClick={() => {
                  setSelectedLocationId(loc.id);
                  setCatPage(1);
                }}
                className={`px-2.5 py-1 rounded text-xs font-semibold transition ${
                  selectedLocationId === loc.id
                    ? "bg-[#10202b] text-white"
                    : "text-gray-700 hover:text-black"
                }`}
              >
                {capitalizeFirst(loc.name)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Overall Summary Card */}
      <div className="bg-[#fbf8f3] border-2 border-[#b8912f] rounded-lg p-4 mb-6 shadow-md">
        <div className="grid grid-cols-3 gap-2 text-center mb-3">
          <div>
            <span className="text-[10px] font-serif font-bold uppercase tracking-wider text-gray-500 block">
              Total Budget
            </span>
            <span className="font-mono font-bold text-base text-[#10202b]">
              ₹{totalBudget.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </span>
          </div>

          <div>
            <span className="text-[10px] font-serif font-bold uppercase tracking-wider text-gray-500 block">
              Total Actual
            </span>
            <span className="font-mono font-bold text-base text-[#10202b]">
              ₹{totalActual.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </span>
          </div>

          <div>
            <span className="text-[10px] font-serif font-bold uppercase tracking-wider text-gray-500 block">
              {remaining >= 0 ? "Remaining" : "Over Budget"}
            </span>
            <span
              className={`font-mono font-bold text-base ${
                remaining >= 0 ? "text-emerald-700" : "text-red-600"
              }`}
            >
              ₹{Math.abs(remaining).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {totalBudget > 0 && (
          <div>
            <div className="flex justify-between text-xs font-mono text-gray-600 mb-1">
              <span>Overall Utilization</span>
              <span className="font-bold">{overallPct.toFixed(1)}%</span>
            </div>
            <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ease-out ${getBarColorClass(overallPct)}`}
                style={{ width: `${Math.min(overallPct, 100)}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Per-Location Breakdown */}
      <div className="mb-6 space-y-3">
        <h3 className="font-serif text-sm font-bold text-gray-700 uppercase tracking-wider">
          Per-Location Breakdown
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {activeLocations.map((loc) => {
            const locExpenses = monthExpenses.filter((e) => e.locationId === loc.id);
            const locActual = locExpenses.reduce((acc, e) => acc + parseFloat(e.amount), 0);

            const locCategories = categories.filter((c) => c.locationId === loc.id);
            const locBudget = locCategories.reduce((acc, c) => acc + (resolvedCategoryBudgets[c.id] || 0), 0);
            const locPct = locBudget > 0 ? (locActual / locBudget) * 100 : 0;
            const isExpanded = !!expandedLocations[loc.id];

            return (
              <div
                key={loc.id}
                className="bg-[#fbf8f3] border border-[#d8ceba] rounded-lg p-3 shadow-sm card-expand-hover"
              >
                <button
                  type="button"
                  onClick={() => toggleLocationExpand(loc.id)}
                  className="w-full text-left cursor-pointer group"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full inline-block shrink-0 pill-hover"
                        style={{ backgroundColor: loc.color }}
                      />
                      <span className="font-serif font-bold text-sm text-[#10202b]">
                        {capitalizeFirst(loc.name)}
                      </span>
                      <span className="text-[11px] text-gray-500 font-mono">
                        ({locCategories.length} cats)
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-xs font-bold text-[#10202b]">
                        ₹{locActual.toLocaleString("en-IN")} / ₹{locBudget.toLocaleString("en-IN")}
                      </span>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-gray-500 shrink-0 chevron-nudge transition-transform duration-180" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-gray-500 shrink-0 chevron-nudge transition-transform duration-180" />
                      )}
                    </div>
                  </div>

                  {locBudget > 0 ? (
                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${getBarColorClass(locPct)}`}
                        style={{ width: `${Math.min(locPct, 100)}%` }}
                      />
                    </div>
                  ) : (
                    <span className="text-[10px] text-gray-500 italic">No budget set</span>
                  )}
                </button>

                {/* Collapsible Location Categories */}
                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-[#e4dbca] space-y-2 animate-fade-scale">
                    <h4 className="font-serif text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-1">
                      Categories in {capitalizeFirst(loc.name)}
                    </h4>
                    {locCategories.length === 0 ? (
                      <p className="text-xs text-gray-500 italic">No categories created yet.</p>
                    ) : (
                      <div className="space-y-1.5">
                        {locCategories.map((cat) => {
                          const catExp = locExpenses.filter((e) => e.categoryId === cat.id);
                          const catAct = catExp.reduce((acc, e) => acc + parseFloat(e.amount), 0);
                          const catBud = resolvedCategoryBudgets[cat.id];
                          const hasBud = catBud !== undefined && catBud > 0;
                          const cPct = hasBud ? (catAct / catBud) * 100 : 0;
                          const IconComp = getCategoryIcon(cat.name, cat.keywords);

                          return (
                            <div
                              key={cat.id}
                              className="flex items-center justify-between p-2 rounded bg-[#f2ece0] border border-[#d8ceba] text-xs"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <div
                                  className="w-6 h-6 rounded flex items-center justify-center text-white shrink-0"
                                  style={{ backgroundColor: loc.color }}
                                >
                                  <IconComp className="w-3.5 h-3.5" />
                                </div>
                                <span className="font-serif font-semibold text-[#10202b] truncate">
                                  {cat.name}
                                </span>
                              </div>
                              <div className="font-mono text-right shrink-0">
                                <span className="font-bold text-[#10202b]">
                                  ₹{catAct.toLocaleString("en-IN")}
                                </span>
                                {hasBud && (
                                  <span className="text-gray-500 font-normal"> / ₹{catBud.toLocaleString("en-IN")}</span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Per-Category Rows */}
      <div>
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <h3 className="font-serif text-sm font-bold text-gray-700 uppercase tracking-wider">
            Category Performance
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-600 font-sans mr-1">
              {showAllCategories ? (
                <>Showing all <strong className="font-mono">{filteredCategories.length}</strong> categories</>
              ) : (
                <>Showing <strong className="font-mono">{filteredCategories.length === 0 ? 0 : (catPage - 1) * CAT_PAGE_SIZE + 1}-{Math.min(catPage * CAT_PAGE_SIZE, filteredCategories.length)}</strong> of <strong className="font-mono">{filteredCategories.length}</strong> categories</>
              )}
            </span>

            <button
              type="button"
              onClick={() => setShowQuickViewModal(true)}
              className="px-2.5 py-1.5 rounded-lg border border-[#b8912f] bg-[#10202b] hover:bg-[#1a2e3d] text-[#b8912f] hover:text-white text-xs font-serif font-bold flex items-center gap-1 shadow transition"
              title="Quick-view all categories at a glance"
            >
              <List className="w-3.5 h-3.5" />
              <span>Show all categories</span>
            </button>

            <button
              type="button"
              onClick={() => setShowAllCategories(!showAllCategories)}
              className="px-2.5 py-1.5 rounded-lg border border-[#d8ceba] bg-[#fbf8f3] hover:bg-[#e4dbca] text-xs font-serif font-bold text-[#10202b] transition shadow-sm"
            >
              {showAllCategories ? "Paginate View" : "Expand inline"}
            </button>
          </div>
        </div>

        <div className="space-y-2.5">
          {paginatedCategories.map((cat) => {
            const catExpenses = monthExpenses.filter((e) => e.categoryId === cat.id);
            const catActual = catExpenses.reduce((acc, e) => acc + parseFloat(e.amount), 0);
            const catBudget = resolvedCategoryBudgets[cat.id];
            const IconComp = getCategoryIcon(cat.name, cat.keywords);
            const loc = locations.find((l) => l.id === cat.locationId);

            const hasBudget = catBudget !== undefined && catBudget > 0;
            const catPct = hasBudget ? (catActual / catBudget) * 100 : 0;

            const budgetInfo = resolvedCategoryBudgetInfo[cat.id];
            const isOverride = budgetInfo?.isOverride;

            return (
              <div
                key={cat.id}
                className="bg-[#fbf8f3] border border-[#d8ceba] rounded-lg p-3 shadow-sm hover:border-[#b8912f] transition"
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className="w-7 h-7 rounded flex items-center justify-center text-white shrink-0"
                      style={{ backgroundColor: loc?.color || "#2f7d76" }}
                    >
                      <IconComp className="w-4 h-4" />
                    </div>
                    <div className="truncate">
                      <div className="flex items-center gap-1.5">
                        <span className="font-serif font-bold text-sm text-[#10202b] truncate">
                          {cat.name}
                        </span>
                        {isOverride && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 border border-amber-300 text-amber-900">
                            <Clock className="w-2.5 h-2.5 text-amber-700" />
                            <span>Budget add-on applied</span>
                            {budgetInfo.overrideRow && (
                              <button
                                type="button"
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  try {
                                    const res = await fetch(`/api/budget-overrides?id=${budgetInfo.overrideRow!.id}`, { method: "DELETE" });
                                    if (res.ok && onRefresh) await onRefresh();
                                  } catch (err) {
                                    console.error(err);
                                  }
                                }}
                                className="p-0.5 hover:bg-amber-200 rounded text-red-600 ml-0.5"
                                title="Remove override and revert to normal budget"
                              >
                                <Trash2 className="w-2.5 h-2.5" />
                              </button>
                            )}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-gray-500 font-sans">
                        {loc ? capitalizeFirst(loc.name) : ""}
                      </span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="font-mono text-xs font-bold text-[#10202b] block">
                      ₹{catActual.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      {hasBudget && (
                        <span className="text-gray-500 font-normal"> / ₹{catBudget.toLocaleString("en-IN")}</span>
                      )}
                    </span>
                    {hasBudget && (
                      <span className={`text-[10px] font-mono font-bold ${
                        catPct > 100 ? "text-red-600" : catPct >= 80 ? "text-amber-600" : "text-emerald-700"
                      }`}>
                        {catPct.toFixed(0)}%
                      </span>
                    )}
                  </div>
                </div>

                {/* Progress Bar */}
                {hasBudget ? (
                  <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden mt-1">
                    <div
                      className={`h-full transition-all duration-300 ${getBarColorClass(catPct)}`}
                      style={{ width: `${Math.min(catPct, 100)}%` }}
                    />
                  </div>
                ) : (
                  <span className="text-[10px] text-gray-400 italic block mt-0.5">
                    Raw actual spend (no budget configured for this month)
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Category Pagination Controls */}
        {!showAllCategories && filteredCategories.length > CAT_PAGE_SIZE && (
          <div className="flex items-center justify-between pt-4 mt-4 border-t border-[#d8ceba] relative">
            <button
              type="button"
              disabled={catPage <= 1}
              onClick={() => setCatPage(catPage - 1)}
              className="px-3 py-1.5 rounded-lg border border-[#b8912f] bg-[#fbf8f3] text-[#10202b] font-serif font-bold text-xs hover:bg-[#e4dbca] disabled:opacity-40 disabled:cursor-not-allowed transition shadow-sm"
            >
              ← Previous
            </button>

            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setCatJumpInput(String(catPage));
                  setShowCatPagePicker(!showCatPagePicker);
                }}
                className="px-3 py-1.5 rounded-lg border border-[#d8ceba] bg-[#fbf8f3] hover:border-[#b8912f] text-xs font-mono text-gray-700 transition"
                title="Click to jump to specific page"
              >
                Page <strong className="text-[#10202b]">{catPage}</strong> of <strong className="text-[#10202b]">{totalCatPages}</strong>
              </button>

              {showCatPagePicker && (
                <div
                  className="fixed inset-0 z-[100] bg-black/65 backdrop-blur-xs flex items-center justify-center p-4 animate-backdrop-in"
                  onClick={() => setShowCatPagePicker(false)}
                >
                  <div
                    className="bg-[#f2ece0] border-2 border-[#b8912f] rounded-xl p-4 shadow-2xl w-64 max-w-[90vw] text-[#10202b] animate-modal-in my-auto"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#d8ceba]">
                      <span className="font-serif font-bold text-sm">Jump to Page</span>
                      <button
                        type="button"
                        onClick={() => setShowCatPagePicker(false)}
                        className="text-gray-500 hover:text-black text-sm p-1"
                      >
                        ✕
                      </button>
                    </div>

                    <form onSubmit={handleCatJumpSubmit} className="space-y-3">
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="1"
                          max={totalCatPages}
                          value={catJumpInput}
                          onChange={(e) => setCatJumpInput(e.target.value)}
                          className="w-full px-3 py-1.5 border border-[#d8ceba] bg-[#fbf8f3] rounded font-mono font-bold text-sm text-[#10202b] focus:outline-none focus:border-[#b8912f]"
                          placeholder="Page #"
                          autoFocus
                        />
                        <button
                          type="submit"
                          className="px-3 py-1.5 rounded bg-[#b8912f] text-white text-xs font-serif font-bold hover:bg-[#a07c24]"
                        >
                          Go
                        </button>
                      </div>
                    </form>

                    {totalCatPages <= 30 && (
                      <div className="mt-3 pt-2.5 border-t border-[#d8ceba] max-h-36 overflow-y-auto grid grid-cols-5 gap-1.5">
                        {Array.from({ length: totalCatPages }, (_, i) => i + 1).map((p) => (
                          <button
                            key={p}
                            type="button"
                            onClick={() => {
                              setCatPage(p);
                              setShowCatPagePicker(false);
                            }}
                            className={`p-1.5 text-xs font-mono rounded text-center transition ${
                              p === catPage
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
                </div>
              )}
            </div>

            <button
              type="button"
              disabled={catPage >= totalCatPages}
              onClick={() => setCatPage(catPage + 1)}
              className="px-3 py-1.5 rounded-lg border border-[#b8912f] bg-[#fbf8f3] text-[#10202b] font-serif font-bold text-xs hover:bg-[#e4dbca] disabled:opacity-40 disabled:cursor-not-allowed transition shadow-sm"
            >
              Next →
            </button>
          </div>
        )}
      </div>

      {/* Manage Budgets Modal */}
      <ManageBudgetsModal
        isOpen={showManageModal}
        onClose={() => {
          setShowManageModal(false);
          setSelectedCategoryForManage(null);
        }}
        categories={categories}
        locations={locations}
        budgets={budgets}
        overrides={overrides}
        selectedMonth={selectedMonth}
        initialCategoryToEdit={selectedCategoryForManage}
        onRefresh={onRefresh || (() => {})}
      />

      {/* All Categories Quick View Modal */}
      <AllCategoriesQuickViewModal
        isOpen={showQuickViewModal}
        onClose={() => setShowQuickViewModal(false)}
        categories={categories}
        locations={locations}
        budgets={budgets}
        expenses={expenses}
        onSelectCategoryToEdit={(cat) => {
          setSelectedCategoryForManage(cat);
          setShowManageModal(true);
        }}
        onRefresh={onRefresh}
      />
    </div>
  );
}

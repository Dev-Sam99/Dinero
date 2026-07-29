"use client";

import { useEffect, useState } from "react";
import QuickEntry from "../components/QuickEntry";
import LedgerList from "../components/LedgerList";
import BudgetVsActual from "../components/BudgetVsActual";
import LocationsManagement from "../components/LocationsManagement";
import { BookOpen, PieChart, MapPin, RefreshCw } from "lucide-react";

const DEFAULT_PAGE_SIZE = 10;

export default function Home() {
  const [activeTab, setActiveTab] = useState<"ledger" | "budget" | "locations">("ledger");

  const [expenses, setExpenses] = useState<any[]>([]);
  const [allExpensesForBudget, setAllExpensesForBudget] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);

  const [categories, setCategories] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [familyMembers, setFamilyMembers] = useState<any[]>([]);
  const [budgets, setBudgets] = useState<any[]>([]);
  const [overrides, setOverrides] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);

  const fetchExpensesPage = async (pageNum: number) => {
    try {
      const expRes = await fetch(`/api/expenses?page=${pageNum}&pageSize=${DEFAULT_PAGE_SIZE}`);
      const expData = await expRes.json();

      if (expData && Array.isArray(expData.expenses)) {
        setExpenses(expData.expenses);
        setTotalCount(expData.totalCount ?? 0);
        setPage(expData.page ?? pageNum);
      } else if (Array.isArray(expData)) {
        setExpenses(expData);
        setTotalCount(expData.length);
      }
    } catch (err) {
      console.error("Failed to fetch expenses page", err);
    }
  };

  const fetchAllData = async (resetPage: boolean = false) => {
    const targetPage = resetPage ? 1 : page;
    if (resetPage) {
      setPage(1);
    }
    try {
      const [expRes, allExpRes, catRes, locRes, vehRes, famRes, budRes, ovRes] = await Promise.all([
        fetch(`/api/expenses?page=${targetPage}&pageSize=${DEFAULT_PAGE_SIZE}`),
        fetch("/api/expenses?all=true"),
        fetch("/api/categories"),
        fetch("/api/locations"),
        fetch("/api/vehicles"),
        fetch("/api/family-members"),
        fetch("/api/budgets"),
        fetch("/api/budget-overrides"),
      ]);

      const [expData, allExpData, catData, locData, vehData, famData, budData, ovData] = await Promise.all([
        expRes.json(),
        allExpRes.json(),
        catRes.json(),
        locRes.json(),
        vehRes.json(),
        famRes.json(),
        budRes.json(),
        ovRes.json(),
      ]);

      if (expData && Array.isArray(expData.expenses)) {
        setExpenses(expData.expenses);
        setTotalCount(expData.totalCount ?? 0);
        setPage(expData.page ?? targetPage);
      } else if (Array.isArray(expData)) {
        setExpenses(expData);
        setTotalCount(expData.length);
      }

      setAllExpensesForBudget(Array.isArray(allExpData) ? allExpData : (expData.expenses || []));
      setCategories(Array.isArray(catData) ? catData : []);
      setLocations(Array.isArray(locData) ? locData : []);
      setVehicles(Array.isArray(vehData) ? vehData : []);
      setFamilyMembers(Array.isArray(famData) ? famData : []);
      setBudgets(Array.isArray(budData) ? budData : []);
      setOverrides(Array.isArray(ovData) ? ovData : []);
    } catch (err) {
      console.error("Failed to load initial data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    fetchExpensesPage(newPage);
  };

  return (
    <div className="space-y-6">
      {/* Top Header Bar */}
      <header className="flex items-center justify-between border-b border-[#243b4d] pb-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full border-2 border-dashed border-[#b8912f] flex items-center justify-center bg-[#10202b] shadow">
            <span className="font-serif font-extrabold text-xl text-[#b8912f]">D</span>
          </div>
          <div>
            <h1 className="font-serif text-2xl font-bold tracking-tight text-[#f2ece0]">
              DINERO
            </h1>
            <p className="text-xs text-gray-400 font-sans">
              Household Passbook & Expense Tracker
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => fetchAllData(false)}
          className="p-2 rounded-lg bg-[#1a2e3d] text-gray-300 hover:text-white border border-[#243b4d] transition"
          title="Refresh Data"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </header>

      {/* Navigation Tabs (Persistent directly under header) */}
      <nav className="flex overflow-x-auto rounded-xl bg-[#1a2e3d] p-1 border border-[#243b4d] text-xs font-serif font-bold no-scrollbar">
        <button
          type="button"
          onClick={() => setActiveTab("ledger")}
          className={`flex-1 min-w-[120px] py-2.5 rounded-lg flex items-center justify-center gap-2 transition shrink-0 ${
            activeTab === "ledger"
              ? "bg-[#b8912f] text-white shadow"
              : "text-gray-400 hover:text-white"
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>LEDGER VIEW</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("budget")}
          className={`flex-1 min-w-[150px] py-2.5 rounded-lg flex items-center justify-center gap-2 transition shrink-0 ${
            activeTab === "budget"
              ? "bg-[#b8912f] text-white shadow"
              : "text-gray-400 hover:text-white"
          }`}
        >
          <PieChart className="w-4 h-4" />
          <span>BUDGET DASHBOARD</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("locations")}
          className={`flex-1 min-w-[120px] py-2.5 rounded-lg flex items-center justify-center gap-2 transition shrink-0 ${
            activeTab === "locations"
              ? "bg-[#b8912f] text-[#10202b] shadow"
              : "text-gray-400 hover:text-white"
          }`}
        >
          <MapPin className="w-4 h-4" />
          <span>LOCATIONS</span>
        </button>
      </nav>

      {/* Quick Entry Form (Primary core workflow) */}
      {!loading && (
        <QuickEntry
          locations={locations}
          categories={categories}
          vehicles={vehicles}
          familyMembers={familyMembers}
          onExpenseAdded={() => fetchAllData(true)}
          onVehicleCreated={(v) => setVehicles((prev) => [...prev, v])}
          onFamilyMemberCreated={(fm) => setFamilyMembers((prev) => [...prev, fm])}
        />
      )}

      {/* View Content */}
      {loading ? (
        <div className="text-center py-12 text-gray-400 font-serif">
          Loading Dinero ledger records...
        </div>
      ) : (
        <div>
          {activeTab === "ledger" && (
            <LedgerList
              expenses={expenses}
              totalCount={totalCount}
              page={page}
              pageSize={DEFAULT_PAGE_SIZE}
              onPageChange={handlePageChange}
              categories={categories}
              locations={locations}
              vehicles={vehicles}
              familyMembers={familyMembers}
              onRefresh={() => fetchAllData(true)}
              onCategoryCreated={(c) => setCategories((prev) => [...prev, c])}
              onVehicleCreated={(v) => setVehicles((prev) => [...prev, v])}
              onFamilyMemberCreated={(fm) => setFamilyMembers((prev) => [...prev, fm])}
            />
          )}

          {activeTab === "budget" && (
            <BudgetVsActual
              expenses={allExpensesForBudget}
              categories={categories}
              locations={locations}
              budgets={budgets}
              overrides={overrides}
              onRefresh={fetchAllData}
            />
          )}

          {activeTab === "locations" && (
            <LocationsManagement
              locations={locations}
              onRefresh={fetchAllData}
            />
          )}
        </div>
      )}
    </div>
  );
}

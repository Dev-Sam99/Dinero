"use client";

import { useState, useEffect, useRef } from "react";
import SharedDatePicker from "./SharedDatePicker";
import VehiclePicker from "./VehiclePicker";
import FamilyMemberPicker from "./FamilyMemberPicker";
import {
  parseRawExpenseInput,
  autoCategorizeExpense,
  autoMatchVehicle,
  isVehicleRelevantCategory,
  autoMatchFamilyMember,
  isFamilyRelevantCategory,
} from "../lib/categorizer";
import { capitalizeFirst } from "../lib/utils";
import { Calendar, Sparkles } from "lucide-react";

import { useToast } from "./ToastProvider";

interface QuickEntryProps {
  locations: { id: number; name: string; color: string; active: boolean }[];
  categories: { id: number; name: string; keywords: string[]; locationId: number }[];
  vehicles: { id: number; name: string; type: string }[];
  familyMembers?: { id: number; name: string; keywords: string[] }[];
  recentShortcuts?: string[];
  onExpenseAdded: () => void;
  onVehicleCreated?: (v: { id: number; name: string; type: string }) => void;
  onFamilyMemberCreated?: (fm: { id: number; name: string; keywords: string[] }) => void;
}

export default function QuickEntry({
  locations,
  categories,
  vehicles,
  familyMembers = [],
  recentShortcuts = [],
  onExpenseAdded,
  onVehicleCreated,
  onFamilyMemberCreated,
}: QuickEntryProps) {
  const { showToast } = useToast();
  const containerRef = useRef<HTMLDivElement>(null);
  const [rawInput, setRawInput] = useState("");
  const [selectedLocationId, setSelectedLocationId] = useState<number>(
    locations.length > 0 ? locations[0].id : 1
  );
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setSelectedDate(new Date().toISOString().split("T")[0]);
  }, []);

  // Post-submit inline prompt state
  const [lastLoggedExpense, setLastLoggedExpense] = useState<{
    id: number;
    amount: string;
    note: string;
    categoryId: number | null;
    categoryName?: string;
    promptType?: "vehicle" | "family";
  } | null>(null);
  const [promptVehicleId, setPromptVehicleId] = useState<number | null>(null);
  const [promptFamilyMemberId, setPromptFamilyMemberId] = useState<number | null>(null);

  const parsed = parseRawExpenseInput(rawInput);
  const activeLocations = locations.filter((l) => l.active);

  const [isExpanded, setIsExpanded] = useState(false);

  // Click outside to collapse Quick Entry
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsExpanded(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!parsed.amount || parsed.amount <= 0) return;

    setSubmitting(true);
    try {
      const autoCatId = autoCategorizeExpense(parsed.note, categories, selectedLocationId);
      const autoVehId = autoMatchVehicle(parsed.note, vehicles);
      const autoFamilyId = autoMatchFamilyMember(parsed.note, familyMembers);

      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: parsed.amount,
          rawText: rawInput,
          note: parsed.note,
          categoryId: autoCatId,
          vehicleId: autoVehId,
          familyMemberId: autoFamilyId,
          locationId: selectedLocationId,
          date: selectedDate,
        }),
      });

      if (res.ok) {
        const createdExpense = await res.json();
        const catObj = categories.find((c) => c.id === autoCatId);
        
        // Check vehicle relevance vs family relevance
        const isVehRelevant = isVehicleRelevantCategory(catObj?.name, parsed.note);
        const isFamRelevant = isFamilyRelevantCategory(catObj?.name, parsed.note);

        if (isVehRelevant && !autoVehId) {
          setLastLoggedExpense({
            id: createdExpense.id,
            amount: createdExpense.amount,
            note: createdExpense.note,
            categoryId: autoCatId,
            categoryName: catObj?.name,
            promptType: "vehicle",
          });
        } else if (isFamRelevant && !autoFamilyId) {
          setLastLoggedExpense({
            id: createdExpense.id,
            amount: createdExpense.amount,
            note: createdExpense.note,
            categoryId: autoCatId,
            categoryName: catObj?.name,
            promptType: "family",
          });
        } else {
          setLastLoggedExpense(null);
        }

        setRawInput("");
        setIsExpanded(false);
        showToast("Entry added to ledger");
        onExpenseAdded();
      }
    } catch (err) {
      console.error("Failed to add expense", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAssignVehicle = async (vehId: number | null) => {
    if (!lastLoggedExpense) return;
    try {
      await fetch(`/api/expenses/${lastLoggedExpense.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vehicleId: vehId }),
      });
      setLastLoggedExpense(null);
      onExpenseAdded();
    } catch (err) {
      console.error("Failed to set vehicle on expense", err);
    }
  };

  const handleAssignFamilyMember = async (fmId: number | null) => {
    if (!lastLoggedExpense) return;
    try {
      await fetch(`/api/expenses/${lastLoggedExpense.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ familyMemberId: fmId }),
      });
      setLastLoggedExpense(null);
      onExpenseAdded();
    } catch (err) {
      console.error("Failed to set family member on expense", err);
    }
  };

  return (
    <div
      ref={containerRef}
      className="bg-[#f2ece0] border-2 border-[#b8912f] rounded-xl p-3 sm:p-4 shadow-lg mb-6 text-[#10202b]"
    >
      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Single-line bar when collapsed vs header when expanded */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full border border-dashed border-[#b8912f] flex items-center justify-center bg-[#fbf8f3] shrink-0 shadow-sm">
            <span className="font-serif font-extrabold text-sm text-[#b8912f]">D</span>
          </div>

          <div className="flex-1 min-w-0">
            <input
              type="text"
              placeholder="Quick Add (e.g. 100 rs nashta, 450 Groceries)..."
              value={rawInput}
              onFocus={() => setIsExpanded(true)}
              onChange={(e) => {
                setRawInput(e.target.value);
                if (!isExpanded && e.target.value.trim().length > 0) {
                  setIsExpanded(true);
                }
              }}
              className="w-full px-3 py-1.5 rounded-lg border-2 border-[#d8ceba] focus:border-[#b8912f] bg-white font-sans text-sm text-[#10202b] placeholder-gray-400 focus:outline-none transition shadow-inner"
            />
          </div>

          {/* Quick Submit button or expand toggle */}
          <button
            type="submit"
            disabled={submitting || !parsed.amount}
            className={`px-3 py-1.5 rounded-lg font-serif font-bold text-xs shrink-0 tracking-wide transition shadow ${
              parsed.amount && !submitting
                ? "bg-[#b8912f] text-white btn-primary-hover active:scale-[0.99]"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            {submitting ? "Logging..." : "ADD"}
          </button>
        </div>

        {/* Quick-tap Shortcuts (Top 3-5 distinct recent/frequent entries) */}
        {!rawInput && recentShortcuts.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
            <span className="text-[11px] font-serif font-bold text-gray-500 shrink-0">Quick:</span>
            {recentShortcuts.map((sc, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setRawInput(sc);
                  setIsExpanded(true);
                }}
                className="px-2 py-0.5 rounded-full bg-[#fbf8f3] border border-[#d8ceba] text-gray-700 pill-hover shrink-0 font-sans text-[11px]"
              >
                {sc}
              </button>
            ))}
          </div>
        )}

        {/* Expanded Options with Smooth Fade/Height Transition */}
        {isExpanded && (
          <div className="pt-2 border-t border-[#d8ceba] space-y-3 animate-fade-scale">
            {parsed.amount !== null && (
              <div className="text-xs flex items-center gap-2 text-gray-700 bg-[#fbf8f3] px-3 py-1.5 rounded border border-[#d8ceba]">
                <Sparkles className="w-3.5 h-3.5 text-[#b8912f]" />
                <span>Parsed Amount: <strong className="font-mono text-[#b8912f]">₹{parsed.amount}</strong></span>
                {parsed.note && <span>• Note: <strong className="italic">&quot;{parsed.note}&quot;</strong></span>}
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-2">
              {/* Location Pills */}
              <div className="flex flex-wrap gap-1.5 items-center">
                <span className="text-[11px] font-serif font-bold uppercase tracking-wider text-gray-600 mr-1">
                  Location:
                </span>
                {activeLocations.map((loc) => {
                  const isSelected = selectedLocationId === loc.id;
                  return (
                    <button
                      key={loc.id}
                      type="button"
                      onClick={() => setSelectedLocationId(loc.id)}
                      className={`px-2.5 py-1 rounded-full text-xs font-semibold pill-hover transition border ${
                        isSelected
                          ? "text-white border-transparent shadow"
                          : "bg-[#fbf8f3] text-[#10202b] border-[#d8ceba]"
                      }`}
                      style={{
                        backgroundColor: isSelected ? loc.color : undefined,
                        borderColor: isSelected ? loc.color : undefined,
                      }}
                    >
                      {capitalizeFirst(loc.name)}
                    </button>
                  );
                })}
              </div>

              {/* Date Selector Pill */}
              <div>
                <button
                  type="button"
                  onClick={() => setShowDatePicker(!showDatePicker)}
                  className="px-2.5 py-1.5 rounded-lg border border-[#d8ceba] bg-[#fbf8f3] hover:border-[#b8912f] transition flex items-center gap-1.5 text-xs font-mono font-semibold min-h-[36px]"
                >
                  <Calendar className="w-3.5 h-3.5 text-[#b8912f]" />
                  <span>{selectedDate === new Date().toISOString().split("T")[0] ? "Today" : selectedDate}</span>
                </button>

                {showDatePicker && (
                  <SharedDatePicker
                    mode="day"
                    value={selectedDate}
                    onChange={(d) => setSelectedDate(d)}
                    onClose={() => setShowDatePicker(false)}
                  />
                )}
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={() => setIsExpanded(false)}
                className="text-[11px] font-serif text-gray-500 hover:text-black hover:underline"
              >
                Hide options
              </button>
            </div>
          </div>
        )}
      </form>

      {/* Optional Vehicle or Family Member Follow-up Prompt */}
      {lastLoggedExpense && lastLoggedExpense.promptType === "vehicle" && (
        <div className="mt-4 pt-3 border-t border-dashed border-[#b8912f]">
          <VehiclePicker
            vehicles={vehicles}
            selectedVehicleId={promptVehicleId}
            onSelect={handleAssignVehicle}
            onVehicleAdded={onVehicleCreated}
            showSkip={true}
          />
        </div>
      )}

      {lastLoggedExpense && lastLoggedExpense.promptType === "family" && (
        <div className="mt-4 pt-3 border-t border-dashed border-[#b8912f]">
          <FamilyMemberPicker
            familyMembers={familyMembers}
            selectedFamilyMemberId={promptFamilyMemberId}
            onSelect={handleAssignFamilyMember}
            onFamilyMemberAdded={onFamilyMemberCreated}
            showSkip={true}
          />
        </div>
      )}
    </div>
  );
}

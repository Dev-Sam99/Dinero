"use client";

import { useState } from "react";
import SharedDatePicker from "./SharedDatePicker";
import { Calendar } from "lucide-react";

interface EditExpenseModalProps {
  expense: {
    id: number;
    amount: string;
    note: string | null;
    date: string;
    locationId: number;
    categoryId: number | null;
    vehicleId: number | null;
  };
  locations: { id: number; name: string; color: string; active: boolean }[];
  onSave: (updated: any) => void;
  onClose: () => void;
}

export default function EditExpenseModal({
  expense,
  locations,
  onSave,
  onClose,
}: EditExpenseModalProps) {
  const [amount, setAmount] = useState(expense.amount);
  const [note, setNote] = useState(expense.note || "");
  const [date, setDate] = useState(expense.date);
  const [locationId, setLocationId] = useState(expense.locationId);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [saving, setSaving] = useState(false);

  const activeLocations = locations.filter((l) => l.active);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/expenses/${expense.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: numAmount,
          note,
          date,
          locationId,
        }),
      });
      if (res.ok) {
        const updated = await res.json();
        onSave(updated);
        onClose();
      }
    } catch (err) {
      console.error("Failed to edit expense", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#f2ece0] border-2 border-[#b8912f] rounded-xl p-5 shadow-2xl text-[#10202b] max-w-sm w-full animate-in fade-in zoom-in duration-150">
        <div className="flex items-center justify-between border-b border-[#d8ceba] pb-3 mb-4">
          <h3 className="font-serif font-bold text-base text-[#10202b]">
            Edit Expense #{expense.id}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-xs text-gray-500 font-mono font-bold hover:text-black"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          {/* Amount */}
          <div>
            <label className="block text-xs font-serif font-bold uppercase tracking-wider text-gray-600 mb-1">
              Amount (₹)
            </label>
            <input
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-[#d8ceba] bg-white font-mono text-base text-[#10202b] focus:outline-none focus:border-[#b8912f]"
              required
            />
          </div>

          {/* Note */}
          <div>
            <label className="block text-xs font-serif font-bold uppercase tracking-wider text-gray-600 mb-1">
              Note
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-[#d8ceba] bg-white font-sans text-sm text-[#10202b] focus:outline-none focus:border-[#b8912f]"
            />
          </div>

          {/* Date Picker */}
          <div>
            <label className="block text-xs font-serif font-bold uppercase tracking-wider text-gray-600 mb-1">
              Date
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowDatePicker(!showDatePicker)}
                className="w-full px-3 py-2 rounded-lg border border-[#d8ceba] bg-[#fbf8f3] hover:border-[#b8912f] text-left flex items-center justify-between font-mono text-xs text-[#10202b]"
              >
                <span>{date}</span>
                <Calendar className="w-4 h-4 text-[#b8912f]" />
              </button>

              {showDatePicker && (
                <div className="absolute left-0 top-11 z-50">
                  <SharedDatePicker
                    mode="day"
                    value={date}
                    onChange={(d) => setDate(d)}
                    onClose={() => setShowDatePicker(false)}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Location Pills */}
          <div>
            <label className="block text-xs font-serif font-bold uppercase tracking-wider text-gray-600 mb-1">
              Location
            </label>
            <div className="flex flex-wrap gap-2">
              {activeLocations.map((loc) => {
                const isSelected = locationId === loc.id;
                return (
                  <button
                    key={loc.id}
                    type="button"
                    onClick={() => setLocationId(loc.id)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition border ${
                      isSelected
                        ? "text-white border-transparent shadow"
                        : "bg-[#fbf8f3] text-[#10202b] border-[#d8ceba]"
                    }`}
                    style={{
                      backgroundColor: isSelected ? loc.color : undefined,
                    }}
                  >
                    {loc.name}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex gap-2 pt-2 border-t border-[#d8ceba]">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2 rounded-lg bg-[#b8912f] text-white font-serif font-bold text-xs hover:bg-[#967321] transition"
            >
              {saving ? "Saving..." : "SAVE CHANGES"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-[#d8ceba] bg-[#fbf8f3] text-gray-700 text-xs font-semibold hover:bg-[#e4dbca]"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

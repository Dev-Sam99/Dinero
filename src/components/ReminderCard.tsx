"use client";

import { useState } from "react";
import { Bell, Check, Edit2, Trash2, Calendar, Tag, MapPin, Truck, AlertCircle, RefreshCw } from "lucide-react";

interface ReminderCardProps {
  reminder: any;
  categories: any[];
  locations: any[];
  vehicles: any[];
  onEdit: (reminder: any) => void;
  onDelete: (id: number) => void;
  onRefresh: () => void;
}

export default function ReminderCard({
  reminder,
  categories,
  locations,
  vehicles,
  onEdit,
  onDelete,
  onRefresh,
}: ReminderCardProps) {
  const [showMarkDoneModal, setShowMarkDoneModal] = useState(false);
  const [logExpense, setLogExpense] = useState(reminder.type === "bill");
  const [paidLocationId, setPaidLocationId] = useState<number>(
    reminder.locationId || (locations.length > 0 ? locations[0].id : 1)
  );
  const [isPrepaid, setIsPrepaid] = useState(reminder.recurrence === "custom_days");
  const [coverageDays, setCoverageDays] = useState<number | "">(
    reminder.recurrenceIntervalDays || ""
  );
  const [submitting, setSubmitting] = useState(false);

  const category = categories.find((c) => c.id === reminder.categoryId);
  const location = locations.find((l) => l.id === reminder.locationId);
  const vehicle = vehicles.find((v) => v.id === reminder.vehicleId);

  // Client-side date check to avoid SSR hydration mismatches
  const todayStr = new Date().toISOString().split("T")[0];
  const isOverdue = reminder.dueDate < todayStr && reminder.status === "active";
  const isDueToday = reminder.dueDate === todayStr && reminder.status === "active";

  const handleConfirmDone = async () => {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/reminders/${reminder.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "mark_done",
          logExpense,
          locationId: paidLocationId,
          isPrepaid,
          coverageDays: coverageDays || undefined,
          paidDate: todayStr,
        }),
      });

      if (res.ok) {
        setShowMarkDoneModal(false);
        onRefresh();
      }
    } catch (err) {
      console.error("Failed to mark done", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className={`p-4 rounded-xl border transition shadow-sm ${
        reminder.status === "done"
          ? "bg-[#142330]/50 border-[#243b4d] opacity-60"
          : isOverdue
          ? "bg-[#251818] border-red-500/50 shadow-red-950/20"
          : isDueToday
          ? "bg-[#272115] border-[#b8912f] shadow-[#b8912f]/10"
          : "bg-[#162736] border-[#243b4d] hover:border-[#385872]"
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Title & Metadata */}
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-serif font-bold uppercase tracking-wider ${
                reminder.type === "bill"
                  ? "bg-[#b8912f]/20 text-[#d4a944] border border-[#b8912f]/30"
                  : "bg-blue-900/30 text-blue-300 border border-blue-800/40"
              }`}
            >
              {reminder.type}
            </span>

            {isOverdue && (
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/30 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> OVERDUE
              </span>
            )}

            {isDueToday && (
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#b8912f]/20 text-[#b8912f] border border-[#b8912f]/30">
                DUE TODAY
              </span>
            )}

            {reminder.recurrence !== "none" && (
              <span className="px-2 py-0.5 rounded text-[10px] bg-[#1f3547] text-gray-300 border border-[#2d4b63] flex items-center gap-1">
                <RefreshCw className="w-2.5 h-2.5" />
                {reminder.recurrence === "custom_days"
                  ? `${reminder.recurrenceIntervalDays}d cycle`
                  : reminder.recurrence}
              </span>
            )}
          </div>

          <h4 className="font-serif font-bold text-base text-[#f2ece0] flex items-center gap-2">
            {reminder.title}
            {reminder.amount && (
              <span className="font-mono text-[#b8912f]">
                ₹{parseFloat(reminder.amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </span>
            )}
          </h4>

          {reminder.notes && <p className="text-xs text-gray-400 italic">&quot;{reminder.notes}&quot;</p>}

          <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400 pt-1 font-mono">
            <span className="flex items-center gap-1 text-[#d8ceba]">
              <Calendar className="w-3.5 h-3.5 text-[#b8912f]" /> Due: {reminder.dueDate}
            </span>
            {category && (
              <span className="flex items-center gap-1 text-gray-300">
                <Tag className="w-3.5 h-3.5 text-[#b8912f]" /> {category.name}
              </span>
            )}
            {location && (
              <span className="flex items-center gap-1 text-gray-300">
                <MapPin className="w-3.5 h-3.5 text-[#b8912f]" /> {location.name}
              </span>
            )}
            {vehicle && (
              <span className="flex items-center gap-1 text-gray-300">
                <Truck className="w-3.5 h-3.5 text-[#b8912f]" /> {vehicle.name}
              </span>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-2 self-end sm:self-center">
          {reminder.status === "active" && (
            <button
              type="button"
              onClick={() => setShowMarkDoneModal(true)}
              className="px-3 py-1.5 rounded-lg bg-[#b8912f] text-white hover:bg-[#c9a13b] font-serif font-bold text-xs flex items-center gap-1.5 transition shadow"
            >
              <Check className="w-3.5 h-3.5" /> MARK DONE
            </button>
          )}

          <button
            type="button"
            onClick={() => onEdit(reminder)}
            className="p-2 rounded-lg bg-[#1f3547] text-gray-300 hover:text-white hover:bg-[#2d4b63] transition"
            title="Edit"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => onDelete(reminder.id)}
            className="p-2 rounded-lg bg-[#1f3547] text-gray-400 hover:text-red-400 hover:bg-[#2d4b63] transition"
            title="Delete"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Mark Done Confirmation Modal */}
      {showMarkDoneModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-[#162736] border-2 border-[#b8912f] rounded-2xl p-5 shadow-2xl space-y-4 animate-scale-up text-[#f2ece0]">
            <h3 className="font-serif font-bold text-base border-b border-[#243b4d] pb-2">
              Mark &quot;{reminder.title}&quot; Done
            </h3>

            {reminder.type === "bill" && (
              <div className="space-y-3 bg-[#10202b] p-3 rounded-xl border border-[#243b4d]">
                <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={logExpense}
                    onChange={(e) => setLogExpense(e.target.checked)}
                    className="accent-[#b8912f] rounded"
                  />
                  <span>Automatically log as expense in Ledger</span>
                </label>

                {logExpense && (
                  <div className="space-y-3 pt-2 text-xs">
                    <div>
                      <label className="block text-gray-400 mb-1">Target Location</label>
                      <select
                        value={paidLocationId}
                        onChange={(e) => setPaidLocationId(Number(e.target.value))}
                        className="w-full px-3 py-1.5 rounded border border-[#243b4d] bg-[#162736] text-white"
                      >
                        {locations.map((l) => (
                          <option key={l.id} value={l.id}>
                            {l.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer pt-1">
                      <input
                        type="checkbox"
                        checked={isPrepaid}
                        onChange={(e) => setIsPrepaid(e.target.checked)}
                        className="accent-[#b8912f] rounded"
                      />
                      <span>Is Prepaid Expense (Exclude from monthly budget)</span>
                    </label>

                    {isPrepaid && (
                      <div>
                        <label className="block text-gray-400 mb-1">Coverage Days (e.g. 84)</label>
                        <input
                          type="number"
                          placeholder="Coverage days..."
                          value={coverageDays}
                          onChange={(e) => setCoverageDays(e.target.value ? Number(e.target.value) : "")}
                          className="w-full px-3 py-1 rounded border border-[#243b4d] bg-[#162736] text-white font-mono"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowMarkDoneModal(false)}
                className="px-3 py-1.5 rounded-lg bg-[#1f3547] text-gray-300 hover:text-white text-xs font-serif font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDone}
                disabled={submitting}
                className="px-4 py-1.5 rounded-lg bg-[#b8912f] text-white hover:bg-[#c9a13b] text-xs font-serif font-bold disabled:opacity-50"
              >
                {submitting ? "Processing..." : "Confirm Done"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

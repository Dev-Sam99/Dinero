"use client";

import { useState, useEffect } from "react";
import { X, Calendar, DollarSign, Tag, MapPin, Truck, Bell, Clock } from "lucide-react";

interface ReminderFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: any;
  categories: any[];
  locations: any[];
  vehicles: any[];
  onSave: () => void;
}

export default function ReminderFormModal({
  isOpen,
  onClose,
  initialData,
  categories,
  locations,
  vehicles,
  onSave,
}: ReminderFormModalProps) {
  const [type, setType] = useState<"bill" | "manual">("bill");
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState<number | "">("");
  const [locationId, setLocationId] = useState<number | "">("");
  const [vehicleId, setVehicleId] = useState<number | "">("");
  const [dueDate, setDueDate] = useState("");
  const [recurrence, setRecurrence] = useState("none");
  const [recurrenceDay, setRecurrenceDay] = useState<number | "">("");
  const [recurrenceIntervalDays, setRecurrenceIntervalDays] = useState<number | "">("");
  const [remindBeforeDays, setRemindBeforeDays] = useState<number>(1);
  const [status, setStatus] = useState("active");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setType(initialData.type || "bill");
      setTitle(initialData.title || "");
      setNotes(initialData.notes || "");
      setAmount(initialData.amount || "");
      setCategoryId(initialData.categoryId || "");
      setLocationId(initialData.locationId || "");
      setVehicleId(initialData.vehicleId || "");
      setDueDate(initialData.dueDate || "");
      setRecurrence(initialData.recurrence || "none");
      setRecurrenceDay(initialData.recurrenceDay || "");
      setRecurrenceIntervalDays(initialData.recurrenceIntervalDays || "");
      setRemindBeforeDays(initialData.remindBeforeDays ?? 1);
      setStatus(initialData.status || "active");
    } else {
      setType("bill");
      setTitle("");
      setNotes("");
      setAmount("");
      setCategoryId("");
      setLocationId(locations.length > 0 ? locations[0].id : "");
      setVehicleId("");
      setDueDate(new Date().toISOString().split("T")[0]);
      setRecurrence("none");
      setRecurrenceDay("");
      setRecurrenceIntervalDays("");
      setRemindBeforeDays(1);
      setStatus("active");
    }
  }, [initialData, isOpen, locations]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !dueDate) return;

    setSubmitting(true);
    try {
      const payload = {
        type,
        title,
        notes: notes || null,
        amount: type === "bill" && amount ? amount : null,
        categoryId: categoryId || null,
        locationId: locationId || null,
        vehicleId: vehicleId || null,
        dueDate,
        recurrence,
        recurrenceDay: recurrence === "monthly" && recurrenceDay ? Number(recurrenceDay) : null,
        recurrenceIntervalDays: recurrence === "custom_days" && recurrenceIntervalDays ? Number(recurrenceIntervalDays) : null,
        remindBeforeDays: Number(remindBeforeDays) || 1,
        status,
      };

      const url = initialData ? `/api/reminders/${initialData.id}` : "/api/reminders";
      const method = initialData ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        onSave();
        onClose();
      }
    } catch (err) {
      console.error("Failed to save reminder", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg bg-[#162736] border-2 border-[#b8912f] rounded-2xl shadow-2xl overflow-hidden animate-scale-up text-[#f2ece0]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#243b4d] px-6 py-4 bg-[#10202b]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full border border-dashed border-[#b8912f] flex items-center justify-center bg-[#162736] text-[#b8912f] font-serif font-bold text-sm">
              D
            </div>
            <h3 className="font-serif text-lg font-bold">
              {initialData ? "Edit Reminder" : "Create New Reminder"}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-[#1f3547] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Type Toggle */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-[#10202b] rounded-xl border border-[#243b4d] text-xs font-serif font-bold">
            <button
              type="button"
              onClick={() => setType("bill")}
              className={`py-2 px-3 rounded-lg transition ${
                type === "bill" ? "bg-[#b8912f] text-white shadow" : "text-gray-400 hover:text-white"
              }`}
            >
              BILL REMINDER (WITH AMOUNT)
            </button>
            <button
              type="button"
              onClick={() => setType("manual")}
              className={`py-2 px-3 rounded-lg transition ${
                type === "manual" ? "bg-[#b8912f] text-white shadow" : "text-gray-400 hover:text-white"
              }`}
            >
              MANUAL REMINDER (FREE TEXT)
            </button>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-serif font-bold text-gray-300 uppercase mb-1">
              Title / Name *
            </label>
            <input
              type="text"
              required
              placeholder={type === "bill" ? "e.g. House Rent, Netflix Subscription" : "e.g. Renew Vehicle License"}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg border border-[#243b4d] bg-[#10202b] text-white text-sm focus:border-[#b8912f] focus:outline-none"
            />
          </div>

          {/* Amount if Bill */}
          {type === "bill" && (
            <div>
              <label className="block text-xs font-serif font-bold text-gray-300 uppercase mb-1">
                Amount (₹)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-gray-400 font-mono text-sm">₹</span>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full pl-8 pr-3.5 py-2.5 rounded-lg border border-[#243b4d] bg-[#10202b] text-white font-mono text-sm focus:border-[#b8912f] focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* Due Date & Remind Before */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-serif font-bold text-gray-300 uppercase mb-1">
                Due Date *
              </label>
              <input
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-[#243b4d] bg-[#10202b] text-white font-mono text-sm focus:border-[#b8912f] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-serif font-bold text-gray-300 uppercase mb-1">
                Remind Days Before
              </label>
              <select
                value={remindBeforeDays}
                onChange={(e) => setRemindBeforeDays(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-lg border border-[#243b4d] bg-[#10202b] text-white text-sm focus:border-[#b8912f] focus:outline-none"
              >
                <option value={0}>Same day</option>
                <option value={1}>1 day before</option>
                <option value={2}>2 days before</option>
                <option value={3}>3 days before</option>
                <option value={7}>1 week before</option>
              </select>
            </div>
          </div>

          {/* Recurrence */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-serif font-bold text-gray-300 uppercase mb-1">
                Recurrence
              </label>
              <select
                value={recurrence}
                onChange={(e) => setRecurrence(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-[#243b4d] bg-[#10202b] text-white text-sm focus:border-[#b8912f] focus:outline-none"
              >
                <option value="none">One-time</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
                <option value="custom_days">Custom Days Cycle (e.g. 84 days)</option>
              </select>
            </div>

            {recurrence === "monthly" && (
              <div>
                <label className="block text-xs font-serif font-bold text-gray-300 uppercase mb-1">
                  Day of Month (1-31)
                </label>
                <input
                  type="number"
                  min="1"
                  max="31"
                  placeholder="e.g. 5"
                  value={recurrenceDay}
                  onChange={(e) => setRecurrenceDay(e.target.value ? Number(e.target.value) : "")}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[#243b4d] bg-[#10202b] text-white font-mono text-sm focus:border-[#b8912f] focus:outline-none"
                />
              </div>
            )}

            {recurrence === "custom_days" && (
              <div>
                <label className="block text-xs font-serif font-bold text-gray-300 uppercase mb-1">
                  Days Interval (e.g. 84)
                </label>
                <input
                  type="number"
                  min="1"
                  placeholder="e.g. 84"
                  value={recurrenceIntervalDays}
                  onChange={(e) => setRecurrenceIntervalDays(e.target.value ? Number(e.target.value) : "")}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[#243b4d] bg-[#10202b] text-white font-mono text-sm focus:border-[#b8912f] focus:outline-none"
                />
              </div>
            )}
          </div>

          {/* Optional Category, Location, Vehicle */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-serif font-bold text-gray-300 uppercase mb-1">
                Category
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : "")}
                className="w-full px-3 py-2 rounded-lg border border-[#243b4d] bg-[#10202b] text-white text-xs focus:border-[#b8912f] focus:outline-none"
              >
                <option value="">(None)</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-serif font-bold text-gray-300 uppercase mb-1">
                Location
              </label>
              <select
                value={locationId}
                onChange={(e) => setLocationId(e.target.value ? Number(e.target.value) : "")}
                className="w-full px-3 py-2 rounded-lg border border-[#243b4d] bg-[#10202b] text-white text-xs focus:border-[#b8912f] focus:outline-none"
              >
                <option value="">(None)</option>
                {locations.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-serif font-bold text-gray-300 uppercase mb-1">
                Vehicle
              </label>
              <select
                value={vehicleId}
                onChange={(e) => setVehicleId(e.target.value ? Number(e.target.value) : "")}
                className="w-full px-3 py-2 rounded-lg border border-[#243b4d] bg-[#10202b] text-white text-xs focus:border-[#b8912f] focus:outline-none"
              >
                <option value="">(None)</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-serif font-bold text-gray-300 uppercase mb-1">
              Notes
            </label>
            <textarea
              rows={2}
              placeholder="Optional notes or instructions..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2 rounded-lg border border-[#243b4d] bg-[#10202b] text-white text-xs focus:border-[#b8912f] focus:outline-none"
            />
          </div>

          {/* Submit */}
          <div className="pt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-[#1f3547] text-gray-300 hover:text-white font-serif text-xs font-bold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-lg bg-[#b8912f] text-white font-serif text-xs font-bold hover:bg-[#c9a13b] disabled:opacity-50 transition shadow-md"
            >
              {submitting ? "Saving..." : initialData ? "Update Reminder" : "Create Reminder"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

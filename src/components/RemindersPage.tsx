"use client";

import { useState, useEffect } from "react";
import ReminderCard from "./ReminderCard";
import ReminderFormModal from "./ReminderFormModal";
import NotificationSettingsPanel from "./NotificationSettingsPanel";
import { Plus, Bell, Settings, Filter, RefreshCw, AlertCircle, Clock, CheckCircle, Calendar } from "lucide-react";

interface RemindersPageProps {
  categories: any[];
  locations: any[];
  vehicles: any[];
  onRefreshParent?: () => void;
}

export default function RemindersPage({
  categories,
  locations,
  vehicles,
  onRefreshParent,
}: RemindersPageProps) {
  const [reminders, setReminders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<"all" | "bill" | "manual">("all");
  const [statusFilter, setStatusFilter] = useState<"active" | "done">("active");
  const [showModal, setShowModal] = useState(false);
  const [editingReminder, setEditingReminder] = useState<any>(null);
  const [showSettings, setShowSettings] = useState(false);

  // Client-side date check state for rendering overdue vs due soon
  const [todayStr, setTodayStr] = useState<string>("");

  useEffect(() => {
    setTodayStr(new Date().toISOString().split("T")[0]);
    fetchReminders();
  }, [statusFilter]);

  const fetchReminders = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/reminders?status=${statusFilter}`);
      if (res.ok) {
        const data = await res.json();
        setReminders(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Failed to fetch reminders", err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (reminder: any) => {
    setEditingReminder(reminder);
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this reminder?")) return;
    try {
      const res = await fetch(`/api/reminders/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchReminders();
        if (onRefreshParent) onRefreshParent();
      }
    } catch (err) {
      console.error("Failed to delete reminder", err);
    }
  };

  const filteredReminders = reminders.filter((r) => {
    if (typeFilter !== "all" && r.type !== typeFilter) return false;
    return true;
  });

  // Group by Overdue, Due Soon (within 7 days), and Upcoming
  const overdueList = filteredReminders.filter(
    (r) => r.status === "active" && todayStr && r.dueDate < todayStr
  );

  const dueSoonList = filteredReminders.filter(
    (r) =>
      r.status === "active" &&
      todayStr &&
      r.dueDate >= todayStr &&
      r.dueDate <=
        new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0]
  );

  const upcomingList = filteredReminders.filter(
    (r) =>
      r.status === "active" &&
      todayStr &&
      r.dueDate >
        new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0]
  );

  const completedList = filteredReminders.filter((r) => r.status === "done");

  return (
    <div className="space-y-6 text-[#f2ece0]">
      {/* Top Header Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#162736] p-4 rounded-xl border border-[#243b4d] shadow">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full border border-dashed border-[#b8912f] bg-[#10202b] flex items-center justify-center text-[#b8912f]">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-serif font-bold text-lg text-[#f2ece0]">
              Reminders & Recurring Bills
            </h2>
            <p className="text-xs text-gray-400">
              Track upcoming payments, subscriptions, and manual tasks.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setShowSettings(!showSettings)}
            className={`p-2 rounded-lg border text-xs font-serif font-bold flex items-center gap-1.5 transition ${
              showSettings
                ? "bg-[#b8912f] text-white border-[#b8912f]"
                : "bg-[#10202b] border-[#243b4d] text-gray-300 hover:text-white"
            }`}
          >
            <Settings className="w-4 h-4" />
            <span className="hidden sm:inline">Settings</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setEditingReminder(null);
              setShowModal(true);
            }}
            className="px-3 py-2 rounded-lg bg-[#b8912f] text-white hover:bg-[#c9a13b] font-serif font-bold text-xs flex items-center gap-1.5 transition shadow"
          >
            <Plus className="w-4 h-4" />
            <span>Add Reminder</span>
          </button>
        </div>
      </div>

      {/* Settings Panel if toggled */}
      {showSettings && (
        <div className="animate-fade-scale">
          <NotificationSettingsPanel />
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#243b4d] pb-3 text-xs font-serif font-bold">
        {/* Status Filter */}
        <div className="flex items-center gap-1 bg-[#10202b] p-1 rounded-lg border border-[#243b4d]">
          <button
            type="button"
            onClick={() => setStatusFilter("active")}
            className={`px-3 py-1.5 rounded transition ${
              statusFilter === "active" ? "bg-[#b8912f] text-white" : "text-gray-400 hover:text-white"
            }`}
          >
            ACTIVE REMINDERS
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("done")}
            className={`px-3 py-1.5 rounded transition ${
              statusFilter === "done" ? "bg-[#b8912f] text-white" : "text-gray-400 hover:text-white"
            }`}
          >
            COMPLETED
          </button>
        </div>

        {/* Type Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-gray-400" />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as any)}
            className="px-3 py-1.5 rounded-lg bg-[#10202b] border border-[#243b4d] text-white text-xs font-serif focus:outline-none"
          >
            <option value="all">All Types</option>
            <option value="bill">Bills Only</option>
            <option value="manual">Manual Only</option>
          </select>
        </div>
      </div>

      {/* Reminders Lists */}
      {loading ? (
        <div className="py-8 text-center text-xs text-gray-400">Loading reminders...</div>
      ) : statusFilter === "done" ? (
        <div className="space-y-3">
          {completedList.length === 0 ? (
            <div className="p-8 text-center bg-[#162736] rounded-xl border border-[#243b4d] text-xs text-gray-400">
              No completed reminders found.
            </div>
          ) : (
            completedList.map((r) => (
              <ReminderCard
                key={r.id}
                reminder={r}
                categories={categories}
                locations={locations}
                vehicles={vehicles}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onRefresh={fetchReminders}
              />
            ))
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Overdue Section */}
          {overdueList.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-red-400 font-serif font-bold text-sm">
                <AlertCircle className="w-4 h-4" />
                <h3>OVERDUE ({overdueList.length})</h3>
              </div>
              <div className="space-y-3">
                {overdueList.map((r) => (
                  <ReminderCard
                    key={r.id}
                    reminder={r}
                    categories={categories}
                    locations={locations}
                    vehicles={vehicles}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onRefresh={fetchReminders}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Due Soon Section */}
          {dueSoonList.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-[#b8912f] font-serif font-bold text-sm">
                <Clock className="w-4 h-4" />
                <h3>DUE SOON (NEXT 7 DAYS) ({dueSoonList.length})</h3>
              </div>
              <div className="space-y-3">
                {dueSoonList.map((r) => (
                  <ReminderCard
                    key={r.id}
                    reminder={r}
                    categories={categories}
                    locations={locations}
                    vehicles={vehicles}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onRefresh={fetchReminders}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Upcoming Section */}
          {upcomingList.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-gray-300 font-serif font-bold text-sm">
                <Calendar className="w-4 h-4" />
                <h3>UPCOMING ({upcomingList.length})</h3>
              </div>
              <div className="space-y-3">
                {upcomingList.map((r) => (
                  <ReminderCard
                    key={r.id}
                    reminder={r}
                    categories={categories}
                    locations={locations}
                    vehicles={vehicles}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onRefresh={fetchReminders}
                  />
                ))}
              </div>
            </div>
          )}

          {filteredReminders.length === 0 && (
            <div className="p-12 text-center bg-[#162736] rounded-xl border border-[#243b4d] space-y-3">
              <Bell className="w-8 h-8 text-gray-500 mx-auto" />
              <p className="font-serif font-bold text-sm text-[#f2ece0]">No active reminders found</p>
              <p className="text-xs text-gray-400">
                Click &quot;Add Reminder&quot; above to create a bill or manual task schedule.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Reminder Form Modal */}
      <ReminderFormModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingReminder(null);
        }}
        initialData={editingReminder}
        categories={categories}
        locations={locations}
        vehicles={vehicles}
        onSave={() => {
          fetchReminders();
          if (onRefreshParent) onRefreshParent();
        }}
      />
    </div>
  );
}

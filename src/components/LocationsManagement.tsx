"use client";

import { useState } from "react";
import { MapPin, Plus, Edit2, AlertCircle } from "lucide-react";
import { capitalizeFirst } from "../lib/utils";

interface LocationsManagementProps {
  locations: { id: number; name: string; color: string; active: boolean }[];
  onRefresh: () => void;
}

export default function LocationsManagement({
  locations,
  onRefresh,
}: LocationsManagementProps) {
  const [newLocName, setNewLocName] = useState("");
  const [editingLoc, setEditingLoc] = useState<{ id: number; name: string } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAddLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLocName.trim()) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/locations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newLocName.trim() }),
      });
      if (res.ok) {
        setNewLocName("");
        onRefresh();
      } else {
        const err = await res.json();
        setErrorMsg(err.error || "Failed to add location");
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (loc: { id: number; name: string; active: boolean }) => {
    setErrorMsg(null);
    try {
      const res = await fetch("/api/locations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: loc.id, name: loc.name, active: !loc.active }),
      });
      if (res.ok) {
        onRefresh();
      } else {
        const err = await res.json();
        setErrorMsg(err.error);
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const handleRename = async (id: number, newName: string) => {
    if (!newName.trim()) return;
    setErrorMsg(null);
    try {
      const res = await fetch("/api/locations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, name: newName.trim() }),
      });
      if (res.ok) {
        setEditingLoc(null);
        onRefresh();
      } else {
        const err = await res.json();
        setErrorMsg(err.error);
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  return (
    <div className="bg-[#f2ece0] border-2 border-[#b8912f] rounded-xl p-4 sm:p-5 shadow-lg text-[#10202b]">
      <div className="flex items-center gap-2 border-b-2 border-[#b8912f] pb-3 mb-4">
        <MapPin className="w-5 h-5 text-[#b8912f]" />
        <div>
          <h2 className="font-serif text-lg font-bold text-[#10202b]">
            Manage Locations
          </h2>
          <p className="text-xs text-gray-600">
            Household expense locations & auto-assigned color tags
          </p>
        </div>
      </div>

      {errorMsg && (
        <div className="mb-4 p-3 rounded-lg bg-red-100 border border-red-300 text-red-800 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Add New Location Form */}
      <form onSubmit={handleAddLocation} className="flex gap-2 mb-5">
        <input
          type="text"
          placeholder="New Location Name (e.g. Goa)"
          value={newLocName}
          onChange={(e) => setNewLocName(e.target.value)}
          className="flex-1 px-3 py-2 text-xs rounded-lg border border-[#d8ceba] bg-white text-[#10202b] focus:outline-none focus:border-[#b8912f]"
        />
        <button
          type="submit"
          disabled={loading || !newLocName.trim()}
          className="px-4 py-2 bg-[#b8912f] text-white rounded-lg text-xs font-serif font-bold hover:bg-[#967321] transition flex items-center gap-1"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add</span>
        </button>
      </form>

      {/* Locations List */}
      <div className="space-y-2">
        {locations.map((loc) => {
          const isEditing = editingLoc?.id === loc.id;

          return (
            <div
              key={loc.id}
              className="bg-[#fbf8f3] border border-[#d8ceba] rounded-lg p-3 flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <span
                  className="w-4 h-4 rounded-full inline-block shrink-0 shadow border border-white"
                  style={{ backgroundColor: loc.color }}
                />

                {isEditing ? (
                  <input
                    type="text"
                    value={editingLoc.name}
                    onChange={(e) => setEditingLoc({ id: loc.id, name: e.target.value })}
                    className="px-2 py-1 text-xs rounded border border-[#b8912f] bg-white text-[#10202b] focus:outline-none"
                    autoFocus
                  />
                ) : (
                  <span className="font-serif font-bold text-sm text-[#10202b] truncate">
                    {capitalizeFirst(loc.name)}
                  </span>
                )}

                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                    loc.active ? "bg-emerald-100 text-emerald-800" : "bg-gray-200 text-gray-600"
                  }`}
                >
                  {loc.active ? "Active" : "Inactive"}
                </span>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {isEditing ? (
                  <>
                    <button
                      type="button"
                      onClick={() => handleRename(loc.id, editingLoc.name)}
                      className="text-xs font-bold bg-[#b8912f] text-white px-2 py-1 rounded"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingLoc(null)}
                      className="text-xs text-gray-500 hover:text-black"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => setEditingLoc({ id: loc.id, name: loc.name })}
                      className="p-1 text-gray-500 hover:text-[#10202b]"
                      title="Rename"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleToggleActive(loc)}
                      className={`text-xs font-semibold px-2 py-1 rounded border ${
                        loc.active
                          ? "border-red-300 text-red-600 hover:bg-red-50"
                          : "border-emerald-300 text-emerald-600 hover:bg-emerald-50"
                      }`}
                    >
                      {loc.active ? "Deactivate" : "Activate"}
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

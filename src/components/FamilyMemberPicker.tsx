"use client";

import { useState } from "react";
import { Plus, Check } from "lucide-react";

interface FamilyMemberPickerProps {
  familyMembers: { id: number; name: string; keywords?: string[] }[];
  selectedFamilyMemberId: number | null;
  onSelect: (id: number | null) => void;
  onFamilyMemberAdded?: (newMember: { id: number; name: string; keywords: string[] }) => void;
  showSkip?: boolean;
}

export default function FamilyMemberPicker({
  familyMembers,
  selectedFamilyMemberId,
  onSelect,
  onFamilyMemberAdded,
  showSkip = true,
}: FamilyMemberPickerProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newKeywords, setNewKeywords] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setLoading(true);
    try {
      const keywordsArray = newKeywords
        .split(",")
        .map((k) => k.trim())
        .filter(Boolean);

      const res = await fetch("/api/family-members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim(), keywords: keywordsArray }),
      });
      if (res.ok) {
        const created = await res.json();
        onFamilyMemberAdded?.(created);
        onSelect(created.id);
        setNewName("");
        setNewKeywords("");
        setIsAdding(false);
      }
    } catch (err) {
      console.error("Failed to add family member", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#fbf8f3] border border-[#b8912f] rounded-lg p-3 my-2 shadow-sm text-[#10202b]">
      <div className="text-xs font-serif font-bold text-[#b8912f] uppercase tracking-wider mb-2 flex items-center justify-between">
        <span>Who was this for?</span>
        {showSkip && (
          <button
            type="button"
            onClick={() => onSelect(null)}
            className="text-[11px] font-sans font-normal text-gray-500 hover:text-[#10202b] underline"
          >
            Skip
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        {familyMembers.map((fm) => {
          const isSelected = selectedFamilyMemberId === fm.id;
          return (
            <button
              key={fm.id}
              type="button"
              onClick={() => onSelect(isSelected ? null : fm.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition flex items-center gap-1.5 border ${
                isSelected
                  ? "bg-[#b8912f] text-white border-[#b8912f] shadow"
                  : "bg-[#f2ece0] text-[#10202b] border-[#d8ceba] hover:border-[#b8912f]"
              }`}
            >
              {isSelected && <Check className="w-3 h-3" />}
              <span>{fm.name}</span>
            </button>
          );
        })}

        {!isAdding ? (
          <button
            type="button"
            onClick={() => setIsAdding(true)}
            className="px-3 py-1.5 rounded-full text-xs font-semibold border border-dashed border-[#b8912f] text-[#b8912f] hover:bg-[#f2ece0] transition flex items-center gap-1"
          >
            <Plus className="w-3 h-3" />
            <span>New Family Member</span>
          </button>
        ) : (
          <div className="flex flex-wrap items-center gap-2 bg-[#f2ece0] p-1.5 rounded-lg border border-[#b8912f]">
            <input
              type="text"
              placeholder="Name (e.g. Aaji, Rohit)"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="px-2 py-1 text-xs rounded border border-[#d8ceba] bg-white text-[#10202b] focus:outline-none focus:border-[#b8912f]"
            />
            <input
              type="text"
              placeholder="Keywords (e.g. aaji, grandma)"
              value={newKeywords}
              onChange={(e) => setNewKeywords(e.target.value)}
              className="px-2 py-1 text-xs rounded border border-[#d8ceba] bg-white text-[#10202b] focus:outline-none focus:border-[#b8912f]"
            />
            <button
              type="button"
              disabled={loading}
              onClick={handleCreate}
              className="px-2 py-1 text-xs font-semibold bg-[#b8912f] text-white rounded hover:bg-[#967321]"
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

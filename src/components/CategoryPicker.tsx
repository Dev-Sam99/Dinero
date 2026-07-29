"use client";

import { useState } from "react";
import { getCategoryIcon, capitalizeFirst } from "../lib/utils";
import VehiclePicker from "./VehiclePicker";
import FamilyMemberPicker from "./FamilyMemberPicker";
import { isFamilyRelevantCategory } from "../lib/categorizer";
import { Plus } from "lucide-react";

interface CategoryPickerProps {
  categories: { id: number; name: string; keywords: string[]; locationId: number }[];
  locations: { id: number; name: string; color: string }[];
  vehicles: { id: number; name: string; type: string }[];
  familyMembers?: { id: number; name: string; keywords: string[] }[];
  selectedCategoryId: number | null;
  onSelectCategory: (catId: number | null) => void;
  onCategoryCreated: (newCat: any) => void;
  onVehicleCreated: (newVeh: any) => void;
  onFamilyMemberCreated?: (newFm: any) => void;
  onVehicleAssigned?: (vehId: number | null) => void;
  onFamilyMemberAssigned?: (fmId: number | null) => void;
  selectedVehicleId?: number | null;
  selectedFamilyMemberId?: number | null;
  onClose?: () => void;
}

export default function CategoryPicker({
  categories,
  locations,
  vehicles,
  familyMembers = [],
  selectedCategoryId,
  onSelectCategory,
  onCategoryCreated,
  onVehicleCreated,
  onFamilyMemberCreated,
  onVehicleAssigned,
  onFamilyMemberAssigned,
  selectedVehicleId = null,
  selectedFamilyMemberId = null,
  onClose,
}: CategoryPickerProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [newCatLocId, setNewCatLocId] = useState<number>(
    locations.length > 0 ? locations[0].id : 1
  );
  const [showVehiclePicker, setShowVehiclePicker] = useState(false);
  const [showFamilyPicker, setShowFamilyPicker] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSelect = (cat: { id: number; name: string; keywords: string[] }) => {
    onSelectCategory(cat.id);
    const catNameLower = cat.name.toLowerCase();
    const isVehRelevant = ["petrol", "fuel", "insurance", "maintenance", "puc", "service"].some(
      (kw) => catNameLower.includes(kw)
    );
    const isFamRelevant = isFamilyRelevantCategory(cat.name);

    if (isVehRelevant && onVehicleAssigned) {
      setShowVehiclePicker(true);
    } else if (isFamRelevant && onFamilyMemberAssigned) {
      setShowFamilyPicker(true);
    } else {
      onClose?.();
    }
  };

  const handleCreateCategory = async () => {
    if (!newCatName.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newCatName.trim(),
          locationId: newCatLocId,
          keywords: [newCatName.trim().toLowerCase()],
        }),
      });
      if (res.ok) {
        const created = await res.json();
        onCategoryCreated(created);
        handleSelect(created);
        setNewCatName("");
        setIsAdding(false);
      }
    } catch (err) {
      console.error("Failed to create category", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-[#f2ece0] border-2 border-[#b8912f] rounded-xl p-4 shadow-2xl text-[#10202b] max-w-md w-full">
      <div className="flex items-center justify-between border-b border-[#d8ceba] pb-2 mb-3">
        <h3 className="font-serif font-bold text-sm text-[#10202b] uppercase tracking-wider">
          Select Category
        </h3>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="text-xs text-gray-500 hover:text-black font-mono font-bold"
          >
            ✕ CLOSE
          </button>
        )}
      </div>

      {showVehiclePicker && onVehicleAssigned ? (
        <div>
          <VehiclePicker
            vehicles={vehicles}
            selectedVehicleId={selectedVehicleId}
            onSelect={(vehId) => {
              onVehicleAssigned(vehId);
              onClose?.();
            }}
            onVehicleAdded={onVehicleCreated}
            showSkip={true}
          />
        </div>
      ) : showFamilyPicker && onFamilyMemberAssigned ? (
        <div>
          <FamilyMemberPicker
            familyMembers={familyMembers}
            selectedFamilyMemberId={selectedFamilyMemberId}
            onSelect={(fmId) => {
              onFamilyMemberAssigned(fmId);
              onClose?.();
            }}
            onFamilyMemberAdded={onFamilyMemberCreated}
            showSkip={true}
          />
        </div>
      ) : (
        <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1">
          {/* Uncategorized Option */}
          <button
            type="button"
            onClick={() => {
              onSelectCategory(null);
              onClose?.();
            }}
            className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold flex items-center justify-between transition border ${
              selectedCategoryId === null
                ? "bg-[#b8912f] text-white border-[#b8912f]"
                : "bg-[#fbf8f3] text-gray-600 border-[#d8ceba] hover:border-[#b8912f]"
            }`}
          >
            <span className="italic">Uncategorized</span>
            {selectedCategoryId === null && <span>✓</span>}
          </button>

          {/* Grouped by Location */}
          {locations.map((loc) => {
            const locCategories = categories.filter(
              (c: any) => c.locationId === loc.id && c.active !== false
            );
            if (locCategories.length === 0) return null;

            return (
              <div key={loc.id} className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full inline-block"
                    style={{ backgroundColor: loc.color }}
                  />
                  <span className="font-serif text-xs font-bold text-gray-700 uppercase tracking-wide">
                    {loc.name}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-1.5">
                  {locCategories.map((cat) => {
                    const IconComp = getCategoryIcon(cat.name, cat.keywords);
                    const isSelected = selectedCategoryId === cat.id;

                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => handleSelect(cat)}
                        className={`px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-2 transition border ${
                          isSelected
                            ? "bg-[#b8912f] text-white border-[#b8912f] shadow font-bold"
                            : "bg-[#fbf8f3] text-[#10202b] border-[#d8ceba] hover:border-[#b8912f]"
                        }`}
                      >
                        <div
                          className="w-6 h-6 rounded flex items-center justify-center text-white shrink-0"
                          style={{ backgroundColor: loc.color }}
                        >
                          <IconComp className="w-3.5 h-3.5" />
                        </div>
                        <span className="truncate">{cat.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Inline + New Category */}
          {!isAdding ? (
            <button
              type="button"
              onClick={() => setIsAdding(true)}
              className="w-full py-2 rounded-lg text-xs font-semibold border-2 border-dashed border-[#b8912f] text-[#b8912f] hover:bg-[#fbf8f3] transition flex items-center justify-center gap-1 mt-2"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ New Category</span>
            </button>
          ) : (
            <div className="bg-[#fbf8f3] p-3 rounded-lg border border-[#b8912f] space-y-2">
              <span className="text-xs font-serif font-bold text-[#b8912f]">
                Add New Category
              </span>
              <input
                type="text"
                placeholder="Category Name"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs rounded border border-[#d8ceba] bg-white text-[#10202b] focus:outline-none"
              />
              <select
                value={newCatLocId}
                onChange={(e) => setNewCatLocId(Number(e.target.value))}
                className="w-full px-2.5 py-1.5 text-xs rounded border border-[#d8ceba] bg-white text-[#10202b]"
              >
                {locations.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  disabled={saving}
                  onClick={handleCreateCategory}
                  className="flex-1 py-1.5 text-xs font-bold bg-[#b8912f] text-white rounded hover:bg-[#967321]"
                >
                  Save Category
                </button>
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-3 py-1.5 text-xs font-semibold border border-gray-300 rounded text-gray-600 hover:bg-gray-100"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

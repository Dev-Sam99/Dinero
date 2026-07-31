export interface RawParsedInput {
  amount: number | null;
  note: string;
}

export function parseRawExpenseInput(text: string): RawParsedInput {
  const trimmed = text.trim();
  if (!trimmed) return { amount: null, note: "" };

  // Match numbers optionally preceded/followed by rs, in, ₹, etc.
  // Examples: "30 rs nashta", "nashta 30", "450 kirana", "rs 200 fuel"
  const regex = /(?:(?:rs|₹|in)\.?\s*)?(\d+(?:\.\d{1,2})?)(?:\s*(?:rs|₹|in)\.?)?/i;
  const match = trimmed.match(regex);

  if (!match) {
    return { amount: null, note: trimmed };
  }

  const amount = parseFloat(match[1]);
  const note = trimmed.replace(match[0], "").trim();

  return { amount, note };
}

export function autoCategorizeExpense(
  note: string,
  categories: { id: number; name: string; keywords: string[]; locationId: number }[],
  selectedLocationId?: number
) {
  const normalizedNote = note.toLowerCase();
  if (!normalizedNote) return null;

  // Primary search: Filter by selected location if specified
  const primaryCategories = selectedLocationId
    ? categories.filter((c) => c.locationId === selectedLocationId)
    : categories;

  let bestMatch: { id: number; keywordLength: number } | null = null;

  for (const cat of primaryCategories) {
    for (const kw of cat.keywords) {
      const normalizedKw = kw.trim().toLowerCase();
      if (normalizedKw && normalizedNote.includes(normalizedKw)) {
        if (!bestMatch || normalizedKw.length > bestMatch.keywordLength) {
          bestMatch = { id: cat.id, keywordLength: normalizedKw.length };
        }
      }
    }
  }

  // Fallback search: If no match found in primary location categories, search all remaining categories (e.g. Common)
  if (!bestMatch && selectedLocationId) {
    for (const cat of categories) {
      for (const kw of cat.keywords) {
        const normalizedKw = kw.trim().toLowerCase();
        if (normalizedKw && normalizedNote.includes(normalizedKw)) {
          if (!bestMatch || normalizedKw.length > bestMatch.keywordLength) {
            bestMatch = { id: cat.id, keywordLength: normalizedKw.length };
          }
        }
      }
    }
  }

  return bestMatch ? bestMatch.id : null;
}

export function autoMatchVehicle(
  note: string,
  vehicles: { id: number; name: string; type: string }[]
) {
  const normalizedNote = note.toLowerCase();
  if (!normalizedNote) return null;

  // Real bug safeguard: NEVER default to a vehicle if no keyword/vehicle name matches note!
  let matchedVehicleId: number | null = null;
  let maxMatchLen = 0;

  for (const v of vehicles) {
    const vName = v.name.toLowerCase();
    if (vName && normalizedNote.includes(vName)) {
      if (vName.length > maxMatchLen) {
        maxMatchLen = vName.length;
        matchedVehicleId = v.id;
      }
    }
  }

  return matchedVehicleId;
}

export function isVehicleRelevantCategory(categoryName?: string, note?: string) {
  const keywords = ["petrol", "fuel", "diesel", "insurance", "maintenance", "service", "puc", "repair", "servicing"];
  const combined = `${categoryName || ""} ${note || ""}`.toLowerCase();
  return keywords.some((kw) => combined.includes(kw));
}

export const FAMILY_RELEVANT_CATEGORY_KEYWORDS = [
  "recharge",
  "mobile",
  "phone",
  "medicine",
  "medical",
  "personal care",
  "gift",
  "health",
  "doctor",
];

export function isFamilyRelevantCategory(categoryName?: string, note?: string) {
  const combined = `${categoryName || ""} ${note || ""}`.toLowerCase();
  return FAMILY_RELEVANT_CATEGORY_KEYWORDS.some((kw) => combined.includes(kw));
}

export function autoMatchFamilyMember(
  note: string,
  familyMembers: { id: number; name: string; keywords: string[] }[]
) {
  const normalizedNote = note.toLowerCase();
  if (!normalizedNote) return null;

  // Safeguard: NEVER default to any family member if no keyword matches!
  let matchedId: number | null = null;
  let maxMatchLen = 0;

  for (const fm of familyMembers) {
    const fmName = fm.name.toLowerCase();
    const allTerms = [fmName, ...(fm.keywords || []).map((k) => k.trim().toLowerCase())];

    for (const term of allTerms) {
      if (term && normalizedNote.includes(term)) {
        if (term.length > maxMatchLen) {
          maxMatchLen = term.length;
          matchedId = fm.id;
        }
      }
    }
  }

  return matchedId;
}

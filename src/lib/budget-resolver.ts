export interface CategoryBudgetRow {
  id: number;
  categoryId: number;
  monthlyBudget: string;
  effectiveFrom: string;
  effectiveTo: string | null;
  note?: string | null;
}

export interface BudgetOverrideRow {
  id: number;
  categoryId: number;
  year: number;
  month: number;
  amount: string;
  note?: string | null;
}

export interface ResolvedBudgetResult {
  amount: number;
  isOverride: boolean;
  overrideRow?: BudgetOverrideRow;
  budgetRow?: CategoryBudgetRow;
}

/**
 * Resolves the monthly budget for a specific category and year/month.
 * 1. Checks budget_overrides FIRST for exact categoryId + year + month match.
 * 2. If found, returns that amount with isOverride: true.
 * 3. If not found, falls back to category_budgets effective-date range logic.
 */
export function getBudgetForMonth(
  categoryId: number,
  year: number,
  month: number,
  budgets: CategoryBudgetRow[],
  overrides: BudgetOverrideRow[] = []
): ResolvedBudgetResult {
  // 1. Check budget_overrides FIRST
  const override = overrides.find(
    (o) => o.categoryId === categoryId && o.year === year && o.month === month
  );

  if (override) {
    return {
      amount: parseFloat(override.amount),
      isOverride: true,
      overrideRow: override,
    };
  }

  // 2. Fall back to effective-date range logic in category_budgets
  const monthStr = String(month).padStart(2, "0");
  const monthStart = `${year}-${monthStr}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const monthEnd = `${year}-${monthStr}-${String(lastDay).padStart(2, "0")}`;

  const matchingBudgets = budgets.filter((b) => {
    if (b.categoryId !== categoryId) return false;
    const startValid = b.effectiveFrom <= monthEnd;
    const endValid = !b.effectiveTo || b.effectiveTo >= monthStart;
    return startValid && endValid;
  });

  if (matchingBudgets.length > 0) {
    matchingBudgets.sort((a, b) => b.effectiveFrom.localeCompare(a.effectiveFrom));
    const selected = matchingBudgets[0];
    return {
      amount: parseFloat(selected.monthlyBudget),
      isOverride: false,
      budgetRow: selected,
    };
  }

  return {
    amount: 0,
    isOverride: false,
  };
}

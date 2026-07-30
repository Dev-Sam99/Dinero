export function SkeletonCard() {
  return (
    <div className="bg-[#fbf8f3] border border-[#d8ceba] rounded-lg p-3 shadow-sm animate-pulse flex items-center justify-between gap-3">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="w-10 h-10 rounded-full bg-[#d8ceba]/60 shrink-0" />
        <div className="space-y-1.5 flex-1 min-w-0">
          <div className="h-4 bg-[#d8ceba]/60 rounded w-1/3" />
          <div className="h-3 bg-[#d8ceba]/40 rounded w-2/3" />
        </div>
      </div>
      <div className="h-5 bg-[#d8ceba]/60 rounded w-16 shrink-0" />
    </div>
  );
}

export function SkeletonBudgetCard() {
  return (
    <div className="bg-[#fbf8f3] border border-[#d8ceba] rounded-lg p-3 shadow-sm animate-pulse space-y-2">
      <div className="flex justify-between items-center">
        <div className="h-4 bg-[#d8ceba]/60 rounded w-1/4" />
        <div className="h-4 bg-[#d8ceba]/60 rounded w-1/5" />
      </div>
      <div className="h-2 bg-[#d8ceba]/40 rounded-full w-full" />
    </div>
  );
}

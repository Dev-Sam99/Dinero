"use client";

import { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface SharedDatePickerProps {
  mode: "day" | "month";
  value: string; // YYYY-MM-DD for day, YYYY-MM for month
  onChange: (val: string) => void;
  onClose?: () => void;
  allowFuture?: boolean;
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export default function SharedDatePicker({
  mode,
  value,
  onChange,
  onClose,
  allowFuture = false,
}: SharedDatePickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const today = new Date();
  const todayYear = today.getFullYear();
  const todayMonth = today.getMonth();
  const todayDateStr = today.toISOString().split("T")[0];
  const currentMonthStr = `${todayYear}-${String(todayMonth + 1).padStart(2, "0")}`;

  // Parse initial view state
  const initialDate = value ? new Date(value.length === 7 ? `${value}-01` : value) : today;
  const [viewYear, setViewYear] = useState<number>(
    isNaN(initialDate.getTime()) ? todayYear : initialDate.getFullYear()
  );
  const [viewMonth, setViewMonth] = useState<number>(
    isNaN(initialDate.getTime()) ? todayMonth : initialDate.getMonth()
  );

  // Year selection modal view state
  const [showYearSelectView, setShowYearSelectView] = useState(false);
  const [customYearInput, setCustomYearInput] = useState("");

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        onClose?.();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose]);

  const handlePrevYear = () => setViewYear((y) => y - 1);
  const handleNextYear = () => {
    if (allowFuture || viewYear < todayYear) setViewYear((y) => y + 1);
  };

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (!allowFuture && viewYear === todayYear && viewMonth >= todayMonth) return;
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const handleSelectToday = () => {
    setViewYear(todayYear);
    setViewMonth(todayMonth);
    onChange(todayDateStr);
    onClose?.();
  };

  const handleSelectYesterday = () => {
    const y = new Date();
    y.setDate(y.getDate() - 1);
    setViewYear(y.getFullYear());
    setViewMonth(y.getMonth());
    onChange(y.toISOString().split("T")[0]);
    onClose?.();
  };

  const handleSelectYear = (y: number) => {
    if (!allowFuture && y > todayYear) return;
    setViewYear(y);
    setShowYearSelectView(false);
  };

  const handleCustomYearSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const y = parseInt(customYearInput.trim(), 10);
    if (!isNaN(y) && y >= 1900 && (allowFuture || y <= todayYear)) {
      setViewYear(y);
      setCustomYearInput("");
      setShowYearSelectView(false);
    }
  };

  // 6 years array (current year and 5 before it)
  const last6Years = Array.from({ length: 6 }, (_, i) => todayYear - i);

  if (showYearSelectView) {
    return (
      <div
        ref={containerRef}
        className="bg-[#162734] border-2 border-[#b8912f] rounded-xl p-4 shadow-2xl text-[#f2ece0] w-72 max-w-[90vw] z-50 animate-in fade-in zoom-in-95 duration-150"
      >
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#243b4d]">
          <h4 className="font-serif text-sm font-bold text-[#b8912f]">Select Year</h4>
          <button
            type="button"
            onClick={() => setShowYearSelectView(false)}
            className="text-xs text-gray-400 hover:text-white font-mono"
          >
            Back
          </button>
        </div>

        {/* Grid of last 6 years */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {last6Years.map((y) => {
            const isSelected = viewYear === y;
            const isDisabled = !allowFuture && y > todayYear;
            return (
              <button
                key={y}
                type="button"
                disabled={isDisabled}
                onClick={() => handleSelectYear(y)}
                className={`py-2 px-1 text-xs font-mono font-bold rounded-md transition ${
                  isSelected
                    ? "bg-[#b8912f] text-white shadow"
                    : isDisabled
                    ? "opacity-30 cursor-not-allowed bg-[#10202b] text-gray-500 border border-[#243b4d]"
                    : "bg-[#10202b] border border-[#243b4d] text-gray-200 hover:border-[#b8912f] hover:text-white"
                }`}
              >
                {y}
              </button>
            );
          })}
        </div>

        {/* Custom year input */}
        <form onSubmit={handleCustomYearSubmit} className="pt-3 border-t border-[#243b4d]">
          <label className="block text-[11px] font-sans font-semibold text-gray-300 mb-1">
            Other year:
          </label>
          <div className="flex gap-2">
            <input
              type="number"
              placeholder="e.g. 2020"
              value={customYearInput}
              onChange={(e) => setCustomYearInput(e.target.value)}
              className="flex-1 px-2.5 py-1.5 bg-[#10202b] border border-[#243b4d] focus:border-[#b8912f] text-xs font-mono text-white rounded focus:outline-none placeholder-gray-500"
              min="1900"
              max={allowFuture ? "2100" : todayYear}
            />
            <button
              type="submit"
              disabled={!customYearInput || (!allowFuture && parseInt(customYearInput, 10) > todayYear)}
              className="px-3 py-1.5 bg-[#b8912f] text-white text-xs font-bold font-serif rounded hover:bg-[#967321] transition disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Set
            </button>
          </div>
        </form>
      </div>
    );
  }

  if (mode === "month") {
    const isThisYear = viewYear === todayYear;

    return (
      <div
        ref={containerRef}
        className="bg-[#162734] border-2 border-[#b8912f] rounded-xl p-4 shadow-2xl text-[#f2ece0] w-72 max-w-[90vw] z-50 animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header with single-step < > arrows + tappable year label */}
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#243b4d]">
          <button
            type="button"
            onClick={handlePrevYear}
            className="p-1 hover:bg-[#243b4d] rounded-md text-gray-300 hover:text-white transition"
            title="Previous Year"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          <button
            type="button"
            onClick={() => setShowYearSelectView(true)}
            className="px-2 py-0.5 rounded border border-[#b8912f] bg-[#10202b] hover:bg-[#1a2e3d] text-[#b8912f] font-serif text-sm font-bold tracking-wide transition cursor-pointer"
            title="Tap to select year"
          >
            {viewYear}
          </button>

          <button
            type="button"
            onClick={handleNextYear}
            disabled={!allowFuture && viewYear >= todayYear}
            className={`p-1 rounded-md transition ${
              !allowFuture && viewYear >= todayYear
                ? "opacity-30 cursor-not-allowed text-gray-500"
                : "hover:bg-[#243b4d] text-gray-300 hover:text-white"
            }`}
            title="Next Year"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Shortcuts */}
        <div className="flex gap-2 mb-3">
          <button
            type="button"
            onClick={() => {
              setViewYear(todayYear);
              setViewMonth(todayMonth);
              onChange(currentMonthStr);
              onClose?.();
            }}
            className="flex-1 py-1.5 text-xs font-semibold rounded-md border border-[#b8912f] bg-[#1a2e3d] text-[#b8912f] hover:bg-[#b8912f] hover:text-white transition"
          >
            This Month
          </button>
          <button
            type="button"
            onClick={() => {
              const lm = new Date(todayYear, todayMonth - 1, 1);
              setViewYear(lm.getFullYear());
              setViewMonth(lm.getMonth());
              const lmStr = `${lm.getFullYear()}-${String(lm.getMonth() + 1).padStart(2, "0")}`;
              onChange(lmStr);
              onClose?.();
            }}
            className="flex-1 py-1.5 text-xs font-semibold rounded-md border border-[#243b4d] bg-[#10202b] text-gray-300 hover:bg-[#243b4d] hover:text-white transition"
          >
            Last Month
          </button>
        </div>

        {/* 12-Month Grid */}
        <div className="grid grid-cols-3 gap-2">
          {MONTH_NAMES.map((mName, idx) => {
            const monthValStr = `${viewYear}-${String(idx + 1).padStart(2, "0")}`;
            const isDisabled = !allowFuture && (viewYear > todayYear || (isThisYear && idx > todayMonth));
            const isSelected = value === monthValStr;

            return (
              <button
                key={mName}
                type="button"
                disabled={isDisabled}
                onClick={() => {
                  onChange(monthValStr);
                  onClose?.();
                }}
                className={`py-2 px-1 text-xs font-medium rounded-md text-center transition ${
                  isSelected
                    ? "bg-[#b8912f] text-white font-bold shadow"
                    : isDisabled
                    ? "opacity-25 cursor-not-allowed bg-[#10202b] text-gray-500 border border-[#243b4d]"
                    : "bg-[#10202b] border border-[#243b4d] text-gray-200 hover:border-[#b8912f] hover:text-white"
                }`}
              >
                {mName.substring(0, 3)}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // Day picker mode
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();

  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const leadingBlanks = Array.from({ length: firstDayOfWeek }, (_, i) => i);

  return (
    <div
      ref={containerRef}
      className="bg-[#162734] border-2 border-[#b8912f] rounded-xl p-4 shadow-2xl text-[#f2ece0] w-72 max-w-[90vw] z-50 animate-in fade-in zoom-in-95 duration-150"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#243b4d]">
        <button
          type="button"
          onClick={handlePrevMonth}
          className="p-1 hover:bg-[#243b4d] rounded-md text-gray-300 hover:text-white transition"
          title="Previous Month"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-1.5 font-serif text-sm font-bold text-[#b8912f]">
          <span>{MONTH_NAMES[viewMonth]}</span>
          <button
            type="button"
            onClick={() => setShowYearSelectView(true)}
            className="px-1.5 py-0.5 rounded border border-[#b8912f] bg-[#10202b] hover:bg-[#1a2e3d] text-[#b8912f] text-xs font-serif font-bold tracking-wide transition cursor-pointer"
            title="Tap to select year"
          >
            {viewYear}
          </button>
        </div>

        <button
          type="button"
          onClick={handleNextMonth}
          disabled={!allowFuture && viewYear === todayYear && viewMonth >= todayMonth}
          className={`p-1 rounded-md transition ${
            !allowFuture && viewYear === todayYear && viewMonth >= todayMonth
              ? "opacity-30 cursor-not-allowed text-gray-500"
              : "hover:bg-[#243b4d] text-gray-300 hover:text-white"
          }`}
          title="Next Month"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Quick Shortcuts */}
      <div className="flex gap-2 mb-3">
        <button
          type="button"
          onClick={handleSelectToday}
          className="flex-1 py-1.5 text-xs font-semibold rounded-md border border-[#b8912f] bg-[#1a2e3d] text-[#b8912f] hover:bg-[#b8912f] hover:text-white transition"
        >
          Today
        </button>
        <button
          type="button"
          onClick={handleSelectYesterday}
          className="flex-1 py-1.5 text-xs font-semibold rounded-md border border-[#243b4d] bg-[#10202b] text-gray-300 hover:bg-[#243b4d] hover:text-white transition"
        >
          Yesterday
        </button>
      </div>

      {/* Day Labels */}
      <div className="grid grid-cols-7 text-center font-mono text-[10px] text-gray-400 mb-1 font-bold">
        <span>SU</span><span>MO</span><span>TU</span><span>WE</span><span>TH</span><span>FR</span><span>SA</span>
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-1">
        {leadingBlanks.map((b) => (
          <div key={`blank-${b}`} />
        ))}
        {daysArray.map((d) => {
          const formattedDateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
          const isFuture = allowFuture ? false : formattedDateStr > todayDateStr;
          const isSelected = value === formattedDateStr;
          const isToday = formattedDateStr === todayDateStr;

          return (
            <button
              key={d}
              type="button"
              disabled={isFuture}
              onClick={() => {
                onChange(formattedDateStr);
                onClose?.();
              }}
              className={`h-8 text-xs font-mono rounded-md flex items-center justify-center transition ${
                isSelected
                  ? "bg-[#b8912f] text-white font-bold shadow"
                  : isFuture
                  ? "opacity-25 cursor-not-allowed bg-[#10202b] text-gray-600 border border-[#243b4d]"
                  : isToday
                  ? "bg-[#1a2e3d] border border-[#b8912f] text-[#b8912f] font-bold hover:bg-[#b8912f] hover:text-white"
                  : "bg-[#10202b] border border-[#243b4d] text-gray-200 hover:border-[#b8912f] hover:text-white"
              }`}
            >
              {d}
            </button>
          );
        })}
      </div>
    </div>
  );
}

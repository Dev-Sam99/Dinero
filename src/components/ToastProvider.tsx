"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import { CheckCircle2, AlertTriangle, X } from "lucide-react";

export interface ToastMessage {
  id: string;
  type: "success" | "info" | "undo";
  message: string;
  onUndo?: () => void;
}

interface ToastContextType {
  showToast: (message: string, type?: "success" | "info") => void;
  showUndoToast: (message: string, onUndo: () => void) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const showToast = (message: string, type: "success" | "info" = "success") => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: ToastMessage = { id, type, message };
    setToasts((prev) => [...prev, newToast]);

    setTimeout(() => {
      removeToast(id);
    }, 3500);
  };

  const showUndoToast = (message: string, onUndo: () => void) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: ToastMessage = { id, type: "undo", message, onUndo };
    setToasts((prev) => [...prev, newToast]);

    setTimeout(() => {
      removeToast(id);
    }, 5500);
  };

  return (
    <ToastContext.Provider value={{ showToast, showUndoToast }}>
      {children}
      {/* Toast Render Container */}
      <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 max-w-sm w-full px-4 sm:px-0 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="pointer-events-auto flex items-center justify-between gap-3 p-3 rounded-xl bg-[#162734] border-2 border-[#b8912f] shadow-2xl text-[#f2ece0] animate-fade-scale text-xs font-serif font-semibold"
          >
            <div className="flex items-center gap-2 min-w-0">
              {toast.type === "undo" ? (
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-[#b8912f] shrink-0" />
              )}
              <span className="truncate">{toast.message}</span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {toast.type === "undo" && toast.onUndo && (
                <button
                  type="button"
                  onClick={() => {
                    toast.onUndo?.();
                    removeToast(toast.id);
                  }}
                  className="px-2 py-1 rounded bg-[#b8912f] text-white font-mono font-bold hover:bg-[#a07c24] active:scale-95 transition text-[11px]"
                >
                  UNDO
                </button>
              )}
              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                className="p-1 text-gray-400 hover:text-white transition"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

const dummyToastContext: ToastContextType = {
  showToast: () => {},
  showUndoToast: () => {},
};

export function useToast() {
  const context = useContext(ToastContext);
  return context || dummyToastContext;
}

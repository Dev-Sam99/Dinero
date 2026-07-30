"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle } from "lucide-react";

interface ConfirmModalProps {
  isOpen: boolean;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDanger?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export default function ConfirmModal({
  isOpen,
  title = "Confirm Action",
  message,
  confirmText = "Delete",
  cancelText = "Cancel",
  isDanger = true,
  onConfirm,
  onClose,
}: ConfirmModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.classList.add("modal-open");
    } else {
      document.body.classList.remove("modal-open");
    }
    return () => {
      document.body.classList.remove("modal-open");
    };
  }, [isOpen]);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div
      onClick={onClose}
      className="fixed inset-0 z-[99999] bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-backdrop-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-[#f2ece0] border-2 border-[#b8912f] rounded-xl p-5 shadow-2xl text-[#10202b] max-w-sm w-full animate-modal-in"
      >
        <div className="flex items-center gap-3 mb-3 border-b border-[#d8ceba] pb-3">
          <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-serif font-bold text-base text-[#10202b]">
              {title}
            </h3>
            <p className="text-xs text-gray-600 font-sans">
              Confirmation requested
            </p>
          </div>
        </div>

        <p className="text-xs font-sans text-gray-800 mb-5 leading-relaxed">
          {message}
        </p>

        <div className="flex gap-2 justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg border border-[#d8ceba] bg-[#fbf8f3] text-gray-700 text-xs font-semibold hover:bg-[#e4dbca] transition"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`px-4 py-1.5 rounded-lg text-white font-serif font-bold text-xs shadow transition ${
              isDanger
                ? "bg-red-600 hover:bg-red-700"
                : "bg-[#b8912f] hover:bg-[#967321]"
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

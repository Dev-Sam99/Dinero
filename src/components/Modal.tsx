"use client";

import { useEffect, useState, ReactNode } from "react";
import { createPortal } from "react-dom";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  maxWidthClass?: string; // e.g. "max-w-2xl", "max-w-3xl", "max-w-md"
  zIndexClass?: string; // e.g. "z-[100]", "z-[110]"
}

export default function Modal({
  isOpen,
  onClose,
  children,
  maxWidthClass = "max-w-2xl",
  zIndexClass = "z-[100]",
}: ModalProps) {
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
      className={`fixed inset-0 ${zIndexClass} flex items-center justify-center bg-black/65 backdrop-blur-xs p-3 sm:p-4 animate-backdrop-in overflow-y-auto`}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`bg-[#f2ece0] border-2 border-[#b8912f] rounded-xl shadow-2xl w-full ${maxWidthClass} max-h-[85vh] flex flex-col text-[#10202b] relative overflow-hidden animate-modal-in my-auto`}
      >
        {children}
      </div>
    </div>,
    document.body
  );
}

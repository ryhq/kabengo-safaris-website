"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Check } from "lucide-react";

export interface GlassSelectOption {
  value: string;
  label: string;
}

interface GlassSelectProps {
  options: GlassSelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  icon?: React.ReactNode;
}

export default function GlassSelect({
  options,
  value,
  onChange,
  placeholder = "Select…",
  icon,
}: GlassSelectProps) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0 });

  const selected = options.find((o) => o.value === value);

  useEffect(() => setMounted(true), []);

  const updatePosition = useCallback(() => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setPos({
        top: rect.bottom + 8,
        left: rect.left,
        width: rect.width,
      });
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    updatePosition();
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);
    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [open, updatePosition]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        triggerRef.current && !triggerRef.current.contains(target) &&
        dropdownRef.current && !dropdownRef.current.contains(target)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const dropdown = open && mounted
    ? createPortal(
        <AnimatePresence>
          <motion.div
            ref={dropdownRef}
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="fixed rounded-xl shadow-[0_8px_40px_rgba(0,0,0,0.12)] border border-stone-200/60"
            style={{
              top: pos.top,
              left: pos.left,
              width: pos.width,
              zIndex: 9999,
              backdropFilter: "blur(20px) saturate(180%)",
              WebkitBackdropFilter: "blur(20px) saturate(180%)",
              background: "rgba(255, 255, 255, 0.95)",
            }}
          >
            <div className="max-h-60 overflow-y-auto py-1">
              {options.map((opt) => {
                const isSelected = opt.value === value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      onChange(opt.value);
                      setOpen(false);
                    }}
                    className={`w-full px-4 py-2.5 text-left flex items-center justify-between transition-colors text-sm ${
                      isSelected
                        ? "bg-brand-green/10 text-brand-green font-medium"
                        : "text-stone-700 hover:bg-brand-green/5"
                    }`}
                  >
                    <span className="truncate">{opt.label}</span>
                    {isSelected && <Check className="w-4 h-4 text-brand-green flex-shrink-0" />}
                  </button>
                );
              })}
            </div>
          </motion.div>
        </AnimatePresence>,
        document.body
      )
    : null;

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`w-full flex items-center gap-2 px-4 py-3.5 rounded-xl border transition-all cursor-pointer text-left text-sm ${
          open
            ? "border-brand-green ring-2 ring-brand-green/30"
            : "border-stone-200 hover:border-stone-300"
        } bg-white text-stone-800`}
      >
        {icon && <span className="text-stone-400 flex-shrink-0">{icon}</span>}
        <span className={`flex-1 truncate ${!selected || selected.value === "" ? "text-stone-400" : ""}`}>
          {selected && selected.value !== "" ? selected.label : placeholder}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-stone-400 transition-transform duration-200 flex-shrink-0 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>
      {dropdown}
    </div>
  );
}

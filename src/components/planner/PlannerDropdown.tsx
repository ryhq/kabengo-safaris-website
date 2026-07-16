"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Search, Check } from "lucide-react";

interface Option {
  value: string;
  label: string;
}

interface PlannerDropdownProps {
  value: string;
  options: Option[];
  onChange: (value: string) => void;
  placeholder?: string;
  searchable?: boolean;
}

/** Light, brand-styled select used inside the planner (matches the .kplanner tokens). */
export default function PlannerDropdown({ value, options, onChange, placeholder = "Select", searchable = false }: PlannerDropdownProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) {
      setQuery("");
      return;
    }
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    if (searchable) setTimeout(() => searchRef.current?.focus(), 30);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open, searchable]);

  const cur = options.find((o) => o.value === value);
  const q = query.trim().toLowerCase();
  const filtered = q ? options.filter((o) => o.label.toLowerCase().includes(q)) : options;

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, border: `1.5px solid ${open ? "#c48f2b" : "var(--border)"}`, background: "var(--card)", borderRadius: 9, padding: "12px 14px", fontSize: 15, color: cur ? "var(--ink)" : "var(--muted)", cursor: "pointer", textAlign: "left", boxShadow: open ? "0 0 0 3px var(--accent-gold-soft)" : "none", transition: "border-color .18s,box-shadow .18s" }}
      >
        <span>{cur ? cur.label : placeholder}</span>
        <ChevronDown size={16} color="var(--muted)" style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform .2s", flexShrink: 0 }} />
      </button>
      {open && (
        <div role="listbox" style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0, background: "#fff", border: "1px solid var(--border)", borderRadius: 10, boxShadow: "0 16px 44px rgba(62,21,2,.2)", padding: 6, zIndex: 50, animation: "kp-floatUp .16s ease" }}>
          {searchable && (
            <div style={{ position: "relative", marginBottom: 4 }}>
              <Search size={15} style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: "var(--muted)" }} />
              <input
                ref={searchRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search…"
                aria-label="Search options"
                style={{ width: "100%", border: "1px solid var(--border)", borderRadius: 7, padding: "8px 10px 8px 32px", fontSize: 14, color: "var(--ink)", outline: "none" }}
              />
            </div>
          )}
          <div style={{ maxHeight: 220, overflowY: "auto" }}>
            {filtered.length === 0 ? (
              <div style={{ padding: "10px 12px", fontSize: 14, color: "var(--muted)" }}>No matches</div>
            ) : (
              filtered.map((o) => {
                const sel = o.value === value;
                return (
                  <button
                    key={o.value}
                    type="button"
                    role="option"
                    aria-selected={sel}
                    onClick={() => { onChange(o.value); setOpen(false); }}
                    style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", textAlign: "left", background: sel ? "var(--accent-gold-soft)" : "transparent", border: "none", borderRadius: 6, padding: "10px 12px", fontSize: 14, fontWeight: sel ? 600 : 500, color: sel ? "var(--accent-gold-deep)" : "var(--ink)", cursor: "pointer" }}
                  >
                    {o.label}
                    {sel && <Check size={15} color="#c48f2b" strokeWidth={2.5} />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";

interface DateRangePickerProps {
  startDate: string;
  endDate: string;
  onChangeStart: (val: string) => void;
  onChangeEnd: (val: string) => void;
  placeholder?: string;
}

const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function fmt(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function displayDate(iso: string): string {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

export default function DateRangePicker({
  startDate,
  endDate,
  onChangeStart,
  onChangeEnd,
  placeholder = "Select dates",
}: DateRangePickerProps) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [selecting, setSelecting] = useState<"start" | "end">("start");
  const [hoveredDate, setHoveredDate] = useState<string | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0 });

  const today = useMemo(() => fmt(new Date()), []);

  const initialMonth = startDate
    ? new Date(startDate + "T00:00:00")
    : new Date();
  const [viewYear, setViewYear] = useState(initialMonth.getFullYear());
  const [viewMonth, setViewMonth] = useState(initialMonth.getMonth());

  useEffect(() => setMounted(true), []);

  const updatePosition = useCallback(() => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setPos({
        top: rect.bottom + 8,
        left: rect.left,
        width: Math.max(rect.width, 300),
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
        panelRef.current && !panelRef.current.contains(target)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const monthName = new Date(viewYear, viewMonth).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const cells: (string | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(fmt(new Date(viewYear, viewMonth, d)));
  }

  const handleDayClick = (dateStr: string) => {
    if (dateStr < today) return;

    if (selecting === "start") {
      onChangeStart(dateStr);
      if (endDate && dateStr > endDate) {
        onChangeEnd("");
      }
      setSelecting("end");
    } else {
      if (dateStr < startDate) {
        onChangeStart(dateStr);
        onChangeEnd("");
        setSelecting("end");
      } else {
        onChangeEnd(dateStr);
        setSelecting("start");
        setOpen(false);
      }
    }
  };

  const isInRange = (dateStr: string) => {
    if (!startDate) return false;
    const end = selecting === "end" && hoveredDate ? hoveredDate : endDate;
    if (!end) return false;
    return dateStr > startDate && dateStr < end;
  };

  const isStart = (dateStr: string) => dateStr === startDate;
  const isEnd = (dateStr: string) => dateStr === endDate || (selecting === "end" && dateStr === hoveredDate && dateStr >= startDate);
  const isPast = (dateStr: string) => dateStr < today;

  const displayValue =
    startDate && endDate
      ? `${displayDate(startDate)}  —  ${displayDate(endDate)}`
      : startDate
        ? `${displayDate(startDate)}  —  …`
        : "";

  const panel = open && mounted
    ? createPortal(
        <AnimatePresence>
          <motion.div
            ref={panelRef}
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="fixed w-[300px] rounded-xl shadow-[0_8px_40px_rgba(0,0,0,0.12)] border border-stone-200/60 p-4 select-none"
            style={{
              top: pos.top,
              left: pos.left,
              zIndex: 9999,
              backdropFilter: "blur(20px) saturate(180%)",
              WebkitBackdropFilter: "blur(20px) saturate(180%)",
              background: "rgba(255, 255, 255, 0.97)",
            }}
          >
            {/* Selecting indicator */}
            <p className="text-xs text-stone-500 mb-3 text-center">
              {selecting === "start" ? "Select start date" : "Select end date"}
            </p>

            {/* Month nav */}
            <div className="flex items-center justify-between mb-3">
              <button
                type="button"
                onClick={prevMonth}
                className="p-1.5 rounded-lg hover:bg-stone-100 transition-colors"
              >
                <ChevronLeft className="w-4 h-4 text-stone-600" />
              </button>
              <span className="text-sm font-semibold text-stone-800">
                {monthName}
              </span>
              <button
                type="button"
                onClick={nextMonth}
                className="p-1.5 rounded-lg hover:bg-stone-100 transition-colors"
              >
                <ChevronRight className="w-4 h-4 text-stone-600" />
              </button>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 gap-0 mb-1">
              {DAYS.map((d) => (
                <div
                  key={d}
                  className="text-center text-[11px] font-medium text-stone-400 py-1"
                >
                  {d}
                </div>
              ))}
            </div>

            {/* Day cells */}
            <div className="grid grid-cols-7 gap-0">
              {cells.map((dateStr, i) => {
                if (!dateStr) {
                  return <div key={`empty-${i}`} className="h-9" />;
                }
                const past = isPast(dateStr);
                const start = isStart(dateStr);
                const end = isEnd(dateStr);
                const inRange = isInRange(dateStr);
                const dayNum = parseInt(dateStr.split("-")[2]);

                return (
                  <button
                    key={dateStr}
                    type="button"
                    disabled={past}
                    onClick={() => handleDayClick(dateStr)}
                    onMouseEnter={() => setHoveredDate(dateStr)}
                    onMouseLeave={() => setHoveredDate(null)}
                    className={`h-9 text-sm rounded-lg transition-colors relative ${
                      past
                        ? "text-stone-300 cursor-not-allowed"
                        : start || end
                          ? "bg-brand-green text-white font-semibold"
                          : inRange
                            ? "bg-brand-green/10 text-brand-green"
                            : "text-stone-700 hover:bg-brand-green/10"
                    }`}
                  >
                    {dayNum}
                  </button>
                );
              })}
            </div>

            {/* Selected range display + Clear */}
            {startDate && (
              <div className="mt-3 pt-3 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
                <span>
                  {displayDate(startDate)}
                  {endDate ? ` — ${displayDate(endDate)}` : ""}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    onChangeStart("");
                    onChangeEnd("");
                    setSelecting("start");
                  }}
                  className="text-red-400 hover:text-red-500 transition-colors font-medium"
                >
                  Clear
                </button>
              </div>
            )}
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
        onClick={() => {
          setOpen((o) => !o);
          if (!open) setSelecting(startDate && !endDate ? "end" : "start");
        }}
        className={`w-full flex items-center gap-2 px-4 py-3.5 rounded-xl border transition-all cursor-pointer text-left text-sm ${
          open
            ? "border-brand-green ring-2 ring-brand-green/30"
            : "border-stone-200 hover:border-stone-300"
        } bg-white text-stone-800`}
      >
        <Calendar className="w-4 h-4 text-stone-400 flex-shrink-0" />
        <span className={`flex-1 truncate ${!displayValue ? "text-stone-400" : ""}`}>
          {displayValue || placeholder}
        </span>
      </button>
      {panel}
    </div>
  );
}

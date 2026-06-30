"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { ChevronDown, Search } from "lucide-react";

interface Country {
  name: string;
  iso: string;
  dial: string;
}

// Tanzania first, then East Africa, then major safari source-markets, then the rest.
const COUNTRIES: Country[] = [
  { name: "Tanzania", iso: "TZ", dial: "+255" },
  { name: "Kenya", iso: "KE", dial: "+254" },
  { name: "Uganda", iso: "UG", dial: "+256" },
  { name: "Rwanda", iso: "RW", dial: "+250" },
  { name: "Burundi", iso: "BI", dial: "+257" },
  { name: "United States", iso: "US", dial: "+1" },
  { name: "United Kingdom", iso: "GB", dial: "+44" },
  { name: "Germany", iso: "DE", dial: "+49" },
  { name: "France", iso: "FR", dial: "+33" },
  { name: "Netherlands", iso: "NL", dial: "+31" },
  { name: "Italy", iso: "IT", dial: "+39" },
  { name: "Spain", iso: "ES", dial: "+34" },
  { name: "Switzerland", iso: "CH", dial: "+41" },
  { name: "Belgium", iso: "BE", dial: "+32" },
  { name: "Austria", iso: "AT", dial: "+43" },
  { name: "Denmark", iso: "DK", dial: "+45" },
  { name: "Sweden", iso: "SE", dial: "+46" },
  { name: "Norway", iso: "NO", dial: "+47" },
  { name: "Finland", iso: "FI", dial: "+358" },
  { name: "Ireland", iso: "IE", dial: "+353" },
  { name: "Poland", iso: "PL", dial: "+48" },
  { name: "Portugal", iso: "PT", dial: "+351" },
  { name: "Canada", iso: "CA", dial: "+1" },
  { name: "Australia", iso: "AU", dial: "+61" },
  { name: "New Zealand", iso: "NZ", dial: "+64" },
  { name: "China", iso: "CN", dial: "+86" },
  { name: "Japan", iso: "JP", dial: "+81" },
  { name: "South Korea", iso: "KR", dial: "+82" },
  { name: "India", iso: "IN", dial: "+91" },
  { name: "United Arab Emirates", iso: "AE", dial: "+971" },
  { name: "Saudi Arabia", iso: "SA", dial: "+966" },
  { name: "Qatar", iso: "QA", dial: "+974" },
  { name: "Israel", iso: "IL", dial: "+972" },
  { name: "South Africa", iso: "ZA", dial: "+27" },
  { name: "Nigeria", iso: "NG", dial: "+234" },
  { name: "Ghana", iso: "GH", dial: "+233" },
  { name: "Ethiopia", iso: "ET", dial: "+251" },
  { name: "Egypt", iso: "EG", dial: "+20" },
  { name: "Morocco", iso: "MA", dial: "+212" },
  { name: "Zambia", iso: "ZM", dial: "+260" },
  { name: "Zimbabwe", iso: "ZW", dial: "+263" },
  { name: "Malawi", iso: "MW", dial: "+265" },
  { name: "Mozambique", iso: "MZ", dial: "+258" },
  { name: "Brazil", iso: "BR", dial: "+55" },
  { name: "Mexico", iso: "MX", dial: "+52" },
  { name: "Argentina", iso: "AR", dial: "+54" },
  { name: "Russia", iso: "RU", dial: "+7" },
  { name: "Turkey", iso: "TR", dial: "+90" },
  { name: "Greece", iso: "GR", dial: "+30" },
  { name: "Czech Republic", iso: "CZ", dial: "+420" },
  { name: "Hungary", iso: "HU", dial: "+36" },
  { name: "Romania", iso: "RO", dial: "+40" },
  { name: "Singapore", iso: "SG", dial: "+65" },
  { name: "Malaysia", iso: "MY", dial: "+60" },
  { name: "Thailand", iso: "TH", dial: "+66" },
  { name: "Hong Kong", iso: "HK", dial: "+852" },
  { name: "Indonesia", iso: "ID", dial: "+62" },
  { name: "Philippines", iso: "PH", dial: "+63" },
];

function flagEmoji(iso: string): string {
  return iso
    .toUpperCase()
    .replace(/./g, (c) => String.fromCodePoint(127397 + c.charCodeAt(0)));
}

type Accent = "brown" | "green";

const ACCENT: Record<Accent, { ring: string; border: string; itemActive: string }> = {
  brown: { ring: "focus-within:ring-brand-brown/30 focus-within:border-brand-brown", border: "border-stone-200", itemActive: "bg-brand-brown/10 text-brand-brown" },
  green: { ring: "focus-within:ring-brand-green/30 focus-within:border-brand-green", border: "border-stone-200", itemActive: "bg-brand-green/10 text-brand-green" },
};

interface Props {
  /** Full phone value including dial code, e.g. "+255 786 345 408" */
  value: string;
  /** Called with the combined value (dial code + national number) */
  onChange: (full: string) => void;
  accent?: Accent;
  placeholder?: string;
  name?: string;
  id?: string;
  required?: boolean;
  /** Tailwind sizing classes to match the host form's inputs */
  sizeClass?: string;
  /** Outer radius to match the host form's inputs */
  radiusClass?: string;
}

export default function CountryPhoneInput({
  value,
  onChange,
  accent = "brown",
  placeholder = "786 345 408",
  name,
  id,
  required,
  sizeClass = "px-4 py-3 text-sm",
  radiusClass = "rounded-lg",
}: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [country, setCountry] = useState<Country>(COUNTRIES[0]); // Tanzania default
  const [num, setNum] = useState("");
  const wrapRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // Initialise from an incoming value once (e.g. edit / prefill).
  useEffect(() => {
    if (!value) return;
    const match = [...COUNTRIES]
      .sort((a, b) => b.dial.length - a.dial.length)
      .find((c) => value.replace(/\s/g, "").startsWith(c.dial));
    if (match) {
      setCountry(match);
      setNum(value.replace(/\s/g, "").slice(match.dial.length));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Close dropdown on outside click / Escape.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => searchRef.current?.focus(), 30);
  }, [open]);

  const emit = (c: Country, n: string) => {
    const cleaned = n.replace(/[^\d\s]/g, "").trim();
    onChange(cleaned ? `${c.dial} ${cleaned}` : "");
  };

  const selectCountry = (c: Country) => {
    setCountry(c);
    setOpen(false);
    setSearch("");
    emit(c, num);
  };

  const onNum = (e: React.ChangeEvent<HTMLInputElement>) => {
    const n = e.target.value.replace(/[^\d\s]/g, "");
    setNum(n);
    emit(country, n);
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return COUNTRIES;
    return COUNTRIES.filter(
      (c) => c.name.toLowerCase().includes(q) || c.dial.includes(q) || c.iso.toLowerCase() === q
    );
  }, [search]);

  const a = ACCENT[accent];

  return (
    <div ref={wrapRef} className="relative">
      <div
        className={`flex items-stretch w-full bg-white border ${a.border} ${a.ring} ${radiusClass} focus-within:ring-2 transition-all overflow-hidden`}
      >
        {/* Country selector */}
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex items-center gap-1.5 pl-3 pr-2.5 border-r border-stone-200 hover:bg-stone-50 transition-colors flex-shrink-0"
          aria-label="Select country code"
          aria-haspopup="listbox"
          aria-expanded={open}
        >
          <span className="text-lg leading-none">{flagEmoji(country.iso)}</span>
          <span className="text-sm font-medium text-stone-700">{country.dial}</span>
          <ChevronDown size={14} className={`text-stone-400 transition-transform ${open ? "rotate-180" : ""}`} />
        </button>

        {/* National number */}
        <input
          type="tel"
          name={name}
          id={id}
          required={required}
          value={num}
          onChange={onNum}
          placeholder={placeholder}
          className={`flex-1 min-w-0 bg-transparent outline-none text-stone-800 placeholder:text-stone-400 ${sizeClass}`}
        />
      </div>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 mt-1.5 w-full sm:w-80 bg-white rounded-xl border border-stone-200 shadow-xl overflow-hidden">
          <div className="p-2 border-b border-stone-100">
            <div className="flex items-center gap-2 px-2.5 py-2 bg-stone-50 rounded-lg">
              <Search size={15} className="text-stone-400 flex-shrink-0" />
              <input
                ref={searchRef}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search country or code…"
                className="flex-1 bg-transparent outline-none text-sm text-stone-700 placeholder:text-stone-400"
              />
            </div>
          </div>
          <ul role="listbox" className="max-h-60 overflow-y-auto py-1">
            {filtered.map((c) => {
              const active = c.iso === country.iso;
              return (
                <li key={c.iso + c.dial}>
                  <button
                    type="button"
                    onClick={() => selectCountry(c)}
                    className={`w-full flex items-center gap-3 px-3 py-2 text-left text-sm hover:bg-stone-50 transition-colors ${active ? a.itemActive : "text-stone-700"}`}
                  >
                    <span className="text-lg leading-none flex-shrink-0">{flagEmoji(c.iso)}</span>
                    <span className="flex-1 truncate">{c.name}</span>
                    <span className="text-stone-400 text-xs font-medium">{c.dial}</span>
                  </button>
                </li>
              );
            })}
            {filtered.length === 0 && (
              <li className="px-3 py-4 text-center text-sm text-stone-400">No match</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

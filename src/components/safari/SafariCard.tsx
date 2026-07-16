"use client";

import { Link } from "@/i18n/navigation";
import { MapPin, ArrowRight } from "lucide-react";

export interface SafariCardData {
  code: string;
  name: string;
  primaryImageUrl?: string;
  totalDays?: number;
  totalNights?: number;
  tripTypeDisplayName?: string;
  budgetCategoryDisplayName?: string;
  startLocation?: string;
  endLocation?: string;
  highlights?: string;
  description?: string;
  totalPaxCount?: number;
  costSummary?: { grandTotalRack?: number; currency?: string }[];
}

const SERIF = "var(--font-source-serif), Georgia, serif";
const HIGHLIGHT_CAP = 3;
const FALLBACK_GRADIENTS = [
  "linear-gradient(150deg,#5a7a3a 0%,#274e22 55%,#12280f 100%)",
  "linear-gradient(150deg,#9a6a2a 0%,#5a1e03 60%,#2a1204 100%)",
  "linear-gradient(150deg,#6b6535 0%,#3e3117 60%,#241c0c 100%)",
  "linear-gradient(150deg,#3a6a3e 0%,#1b3717 65%,#0e2410 100%)",
];
const CURRENCY_SYMBOLS: Record<string, string> = { USD: "$", EUR: "€", GBP: "£" };

const ArrowIcon = ({ size = 15, sw = 2.4 }: { size?: number; sw?: number }) => <ArrowRight size={size} strokeWidth={sw} />;

/** Highlights may arrive as a JSON-array-ish string; return clean labels (no [ ] " ' \\). */
function parseHighlights(raw?: string): string[] {
  if (!raw) return [];
  const s = raw.trim();
  if (s.startsWith("[")) {
    try {
      const arr = JSON.parse(s);
      if (Array.isArray(arr)) return arr.map((x) => String(x).trim()).filter(Boolean);
    } catch {
      /* fall through to manual strip */
    }
  }
  return s
    .split(",")
    .map((x) => x.replace(/[[\]"'\\]/g, "").trim())
    .filter(Boolean);
}

export default function SafariCard({ safari }: { safari: SafariCardData }) {
  const {
    code, name, primaryImageUrl, totalDays, tripTypeDisplayName, budgetCategoryDisplayName,
    startLocation, endLocation, highlights, description, totalPaxCount, costSummary,
  } = safari;

  // Honest per-person "from" price — no fabricated "was" price.
  const grandTotal = costSummary?.[0]?.grandTotalRack;
  const pax = totalPaxCount && totalPaxCount > 0 ? totalPaxCount : 1;
  const perPerson = grandTotal && grandTotal > 0 ? Math.round(grandTotal / pax) : null;
  const currency = costSummary?.[0]?.currency;
  const symbol = currency ? CURRENCY_SYMBOLS[currency] ?? `${currency} ` : "$";
  const priceNum = perPerson ? `${symbol}${perPerson.toLocaleString()}` : null;
  const pillText = priceNum ? `From ${priceNum}*` : "Enquire";
  const priceFull = priceNum ? `${priceNum}* pp` : "";

  const route = startLocation && endLocation ? `${startLocation}  →  ${endLocation}` : null;
  const chips = parseHighlights(highlights);
  const shownChips = chips.slice(0, HIGHLIGHT_CAP);
  const extra = chips.length - HIGHLIGHT_CAP;
  const badges = [tripTypeDisplayName, budgetCategoryDisplayName].filter(Boolean) as string[];
  const tagline = chips[0] || description || "";
  const bg = primaryImageUrl ? `center/cover no-repeat url('${primaryImageUrl}')` : FALLBACK_GRADIENTS[code.length % FALLBACK_GRADIENTS.length];

  return (
    <article className="ksafari relative flex flex-col bg-white border border-[#e4ddd1] rounded-[14px] overflow-hidden cursor-pointer">
      {/* full-card link — click anywhere navigates to the safari */}
      <Link href={`/safaris/${code}`} aria-label={name} className="absolute inset-0 z-[5]" />
      <div className="ksafari-media relative aspect-[4/3] overflow-hidden">
        <div className="ksafari-img absolute inset-0" style={{ background: bg }} />
        <div className="ksafari-rest absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(20,12,4,0) 28%, rgba(20,12,4,.5) 60%, rgba(20,12,4,.95) 100%)" }} />

        {/* price pill — dark, high-contrast so it reads on any photo */}
        <div className="ksafari-rest absolute top-3.5 right-3.5" style={{ fontFamily: SERIF, background: "rgba(20,12,4,.82)", color: "#f3e6c8", fontSize: 14, fontWeight: 700, padding: "7px 13px", borderRadius: 6, border: "1px solid rgba(196,143,43,.55)", boxShadow: "0 2px 12px rgba(20,12,4,.45)" }}>{pillText}</div>

        {/* rest: kicker + title + tagline */}
        <div className="ksafari-rest absolute left-0 bottom-0" style={{ right: 56, padding: 18 }}>
          {!!totalDays && <div style={{ color: "#f3e6c8", fontSize: 11, fontWeight: 700, letterSpacing: ".16em", textTransform: "uppercase", marginBottom: 6 }}>{totalDays} {totalDays === 1 ? "Day" : "Days"}</div>}
          <h3 className="ksafari-clamp" style={{ fontFamily: SERIF, fontWeight: 600, color: "#fff", fontSize: 20, lineHeight: 1.18, margin: 0, textShadow: "0 1px 12px rgba(20,12,4,.5)" }}>{name}</h3>
          {tagline && <p className="ksafari-clamp" style={{ color: "rgba(250,248,245,.85)", fontSize: 13, lineHeight: 1.4, margin: "6px 0 0", textShadow: "0 1px 10px rgba(20,12,4,.5)" }}>{tagline}</p>}
        </div>

        {/* rest: circular arrow */}
        <span className="ksafari-rest absolute flex items-center justify-center" style={{ bottom: 16, right: 14, width: 40, height: 40, borderRadius: "50%", background: "#fff", color: "#2a2018" }}><ArrowIcon size={17} /></span>

        {/* hover overlay — green fill spreads up from the ground, content reveals above it */}
        <div className="ksafari-sweep absolute inset-0">
          <div className="ksafari-fill absolute inset-0" style={{ background: "linear-gradient(160deg, rgba(53,107,46,.78) 0%, rgba(31,67,25,.9) 52%, rgba(18,40,15,.96) 100%)" }} />
          <div className="relative flex flex-col" style={{ height: "100%", padding: 22, zIndex: 1 }}>
          {badges.length > 0 && (
            <div className="ksafari-reveal" style={{ transitionDelay: ".04s" }}>
              <div className="flex flex-wrap gap-1.5 mb-3">
                {badges.map((b) => (
                  <span key={b} style={{ background: "rgba(242,236,224,.14)", color: "#faf8f5", fontSize: 11, fontWeight: 600, padding: "5px 10px", borderRadius: 5 }}>{b}</span>
                ))}
              </div>
            </div>
          )}
          <h4 className="ksafari-reveal ksafari-clamp" style={{ fontFamily: SERIF, fontWeight: 700, color: "#fff", fontSize: 19, lineHeight: 1.18, margin: 0, transitionDelay: ".08s" }}>{name}</h4>
          {route && (
            <div className="ksafari-reveal flex items-center gap-1.5" style={{ marginTop: 10, color: "#f3e6c8", fontSize: 12.5, transitionDelay: ".12s" }}>
              <MapPin size={13} style={{ flexShrink: 0 }} />{route}
            </div>
          )}
          {chips.length > 0 && (
            <div className="ksafari-reveal flex flex-wrap gap-1.5" style={{ marginTop: 12, transitionDelay: ".16s" }}>
              {shownChips.map((h) => (
                <span key={h} style={{ background: "rgba(242,236,224,.1)", border: "1px solid rgba(242,236,224,.2)", color: "#faf8f5", fontSize: 11.5, padding: "4px 9px", borderRadius: 20 }}>{h}</span>
              ))}
              {extra > 0 && <span style={{ background: "#c48f2b", color: "#3d1402", fontSize: 11.5, fontWeight: 600, padding: "4px 9px", borderRadius: 20 }}>+{extra} more</span>}
            </div>
          )}
          {description && <p className="ksafari-reveal ksafari-clamp" style={{ color: "rgba(242,236,224,.85)", fontSize: 13, lineHeight: 1.5, margin: "12px 0 0", transitionDelay: ".2s" }}>{description}</p>}
          <div className="ksafari-reveal flex items-center justify-between gap-3" style={{ marginTop: "auto", paddingTop: 16, transitionDelay: ".24s" }}>
            <div style={{ minWidth: 0 }}>
              {priceNum ? (
                <>
                  <div style={{ color: "rgba(242,236,224,.75)", fontSize: 11 }}>From</div>
                  <div style={{ fontFamily: SERIF, fontWeight: 700, color: "#c48f2b", fontSize: 21, lineHeight: 1 }}>{priceFull}</div>
                </>
              ) : (
                <div style={{ fontFamily: SERIF, fontWeight: 600, color: "#fff", fontSize: 16 }}>Enquire for pricing</div>
              )}
            </div>
            <span className="inline-flex items-center gap-1.5 whitespace-nowrap" style={{ background: "#c48f2b", color: "#3d1402", fontWeight: 600, fontSize: 13.5, borderRadius: 7, padding: "10px 15px" }}>View &amp; Book <ArrowIcon size={14} sw={2.5} /></span>
          </div>
          </div>
        </div>
      </div>

    </article>
  );
}

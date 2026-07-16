"use client";

import { useState, useEffect } from "react";
import { Link } from "@/i18n/navigation";
import { User, Users, UsersRound, Heart, Baby, HelpCircle, ArrowRight, Check, Search, MapPin, Binoculars, Footprints, Waves, MountainSnow, Drum } from "lucide-react";
import { submitBookingInquiry, fetchPublicParks, type PublicParkOption } from "@/lib/api";
import DateRangePicker from "@/components/ui/DateRangePicker";
import PlannerDropdown from "@/components/planner/PlannerDropdown";

/* Scoped brand tokens + planner-only CSS (kept here so globals.css isn't touched). */
const PLANNER_CSS = `
.kplanner{--brand-green:#274e22;--brand-green-dark:#1b3717;--brand-green-pale:#e6ece2;--brand-choc:#5a1e03;--brand-choc-dark:#3d1402;--brand-olive:#3e3117;--accent-gold:#c48f2b;--accent-gold-deep:#96631a;--accent-gold-soft:#f3e6c8;--cream:#faf8f5;--sand:#f1ece3;--card:#fff;--border:#e4ddd1;--ink:#2a2018;--body:#4a3f34;--muted:#7a6f61;font-family:'Inter',system-ui,sans-serif;color:var(--body)}
@keyframes kp-stepIn{from{opacity:0;transform:translateX(26px)}to{opacity:1;transform:none}}
@keyframes kp-pop{0%{transform:scale(0)}60%{transform:scale(1.15)}100%{transform:scale(1)}}
@keyframes kp-floatUp{from{opacity:0;transform:translateY(20px) scale(.9)}to{opacity:1;transform:none}}
.kplanner input[type=range].krange{-webkit-appearance:none;appearance:none;width:100%;height:6px;border-radius:6px;cursor:pointer}
.kplanner input[type=range].krange:disabled{opacity:.5;cursor:not-allowed}
.kplanner input[type=range].krange::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;width:28px;height:28px;border-radius:50%;background:var(--accent-gold);border:4px solid #fff;box-shadow:0 2px 10px rgba(150,99,26,.5);cursor:pointer;margin-top:-11px}
.kplanner input[type=range].krange::-moz-range-thumb{width:28px;height:28px;border-radius:50%;background:var(--accent-gold);border:4px solid #fff;box-shadow:0 2px 10px rgba(150,99,26,.5);cursor:pointer}
.kplanner .kfield{width:100%;border:1.5px solid var(--border);background:var(--card);border-radius:9px;padding:14px 16px;font-size:15px;color:var(--ink);outline:none;transition:border-color .18s,box-shadow .18s}
.kplanner .kfield:focus{border-color:var(--accent-gold);box-shadow:0 0 0 3px var(--accent-gold-soft)}
`;

const ACTIVITIES = [
  { key: "safari", enum: "SAFARI", name: "Safari", Icon: Binoculars },
  { key: "migration", enum: "GREAT_MIGRATION", name: "Great Migration", Icon: Footprints },
  { key: "beach", enum: "ZANZIBAR_BEACH", name: "Beach & Zanzibar", Icon: Waves },
  { key: "kili", enum: "KILIMANJARO", name: "Climb Kilimanjaro", Icon: MountainSnow },
  { key: "culture", enum: "CULTURE", name: "Culture & People", Icon: Drum },
] as const;

// Brand-only gradients for park-image fallbacks (greens / browns / olive / muted gold).
const PARK_GRADIENTS = [
  "linear-gradient(140deg,#4a6b39,#274e22)", "linear-gradient(140deg,#8a5a2a,#5a1e03)",
  "linear-gradient(140deg,#6b6535,#3e3117)", "linear-gradient(140deg,#3a5a2e,#1b3717)",
  "linear-gradient(140deg,#b0812e,#5a1e03)", "linear-gradient(140deg,#5a4a2a,#3d1402)",
];

const PARTIES = [
  { key: "solo", name: "Solo", trip: "PRIVATE", Icon: User },
  { key: "couple", name: "Couple", trip: "PRIVATE", Icon: Users },
  { key: "family", name: "Family", trip: "FAMILY", Icon: Baby },
  { key: "honeymoon", name: "Honeymoon", trip: "HONEYMOON", Icon: Heart },
  { key: "friends", name: "Group of friends", trip: "GROUP", Icon: UsersRound },
  { key: "other", name: "Other", trip: "CUSTOM", Icon: HelpCircle },
] as const;

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const COUNTRY_OPTIONS = [
  "United Kingdom", "United States", "Germany", "Netherlands", "France", "Italy", "Spain", "Belgium",
  "Switzerland", "Austria", "Ireland", "Denmark", "Sweden", "Norway", "Finland", "Poland", "Portugal",
  "Czech Republic", "Greece", "Australia", "New Zealand", "Canada", "Brazil", "Argentina", "Mexico",
  "South Africa", "Kenya", "Tanzania", "United Arab Emirates", "Saudi Arabia", "India", "China", "Japan",
  "South Korea", "Singapore", "Israel", "Russia", "Ukraine", "Other",
].map((c) => ({ value: c, label: c }));
const PHONE_OPTIONS = [
  ["+255", "Tanzania"], ["+44", "UK"], ["+1", "US / Canada"], ["+49", "Germany"], ["+31", "Netherlands"],
  ["+33", "France"], ["+39", "Italy"], ["+34", "Spain"], ["+32", "Belgium"], ["+41", "Switzerland"],
  ["+353", "Ireland"], ["+45", "Denmark"], ["+46", "Sweden"], ["+47", "Norway"], ["+61", "Australia"],
  ["+64", "New Zealand"], ["+27", "South Africa"], ["+254", "Kenya"], ["+971", "UAE"], ["+91", "India"],
  ["+81", "Japan"], ["+86", "China"],
].map(([code, c]) => ({ value: code, label: `${code} · ${c}` }));

const TRUST = ["Tailor-made & private", "No obligation", "Local expert guides", "Reply within 24 hours"];

const STEPS = ["interests", "where", "days", "who", "when", "travellers", "budget", "notes", "details", "review"] as const;
const LAST = STEPS.length - 1; // index of the final step ("Review" — submits)
const DONE = STEPS.length; // success screen
const gold = "#c48f2b";
const AGE_OPTIONS = Array.from({ length: 16 }, (_, n) => ({ value: String(n), label: n === 0 ? "Under 1" : `${n} ${n === 1 ? "yr" : "yrs"}` }));

function budgetToCategory(b: number): string {
  if (b < 2500) return "BUDGET";
  if (b < 4000) return "MID_RANGE";
  if (b < 6000) return "LUXURY";
  return "ULTRA_LUXURY";
}

export default function SafariPlanner({ embedded = false }: { embedded?: boolean }) {
  const [step, setStep] = useState(0);
  const [acts, setActs] = useState<Record<string, boolean>>({});
  const [dests, setDests] = useState<Record<string, boolean>>({});
  const [parks, setParks] = useState<PublicParkOption[]>([]);
  const [parksLoading, setParksLoading] = useState(true);
  const [parkSearch, setParkSearch] = useState("");
  const [party, setParty] = useState<string | null>(null);
  const [days, setDays] = useState(12);
  const [daysUnsure, setDaysUnsure] = useState(false);
  const [months, setMonths] = useState<Record<number, boolean>>({});
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [whenFlexible, setWhenFlexible] = useState(false);
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [childAges, setChildAges] = useState<string[]>([]);
  const [budget, setBudget] = useState(3500);
  const [budgetUnsure, setBudgetUnsure] = useState(false);
  const [notes, setNotes] = useState("");
  const [consent, setConsent] = useState(true);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneCode, setPhoneCode] = useState("+255");
  const [phone, setPhone] = useState("");
  const [country, setCountry] = useState("United Kingdom");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const current = STEPS[step];
  const inFlow = step <= LAST;
  const progressPct = `${((step / LAST) * 100).toFixed(1)}%`;

  useEffect(() => {
    let alive = true;
    fetchPublicParks().then((p) => {
      if (alive) {
        setParks(p);
        setParksLoading(false);
      }
    });
    return () => { alive = false; };
  }, []);

  const filteredParks = parks.filter((p) => {
    const q = parkSearch.trim().toLowerCase();
    if (!q) return true;
    return p.name.toLowerCase().includes(q) || (p.region || "").toLowerCase().includes(q);
  });

  const setChildCount = (n: number) => {
    setChildren(n);
    setChildAges((prev) => {
      const a = prev.slice();
      if (n > a.length) while (a.length < n) a.push("5");
      else a.length = n;
      return a;
    });
  };

  const buildSpecialRequests = (): string => {
    const parts: string[] = [];
    const selMonths = MONTHS.filter((_, i) => months[i]);
    if (!whenFlexible && selMonths.length) parts.push(`Preferred months: ${selMonths.join(", ")}`);
    if (whenFlexible) parts.push("Flexible on travel dates");
    if (daysUnsure) parts.push("Trip length: help me decide");
    if (budgetUnsure) parts.push("Budget: help me decide");
    if (children > 0 && childAges.length) parts.push(`Children ages: ${childAges.join(", ")}`);
    return parts.join(". ");
  };

  const contactError = (): string => {
    if (!firstName.trim() || !lastName.trim()) return "Please enter your first and last name.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return "Please enter a valid email address.";
    if (!consent) return "Please confirm we may contact you about your proposal.";
    return "";
  };

  const submit = async () => {
    const err = contactError();
    if (err) return setError(err);
    setError("");
    setSubmitting(true);
    const interests = ACTIVITIES.filter((a) => acts[a.key]).map((a) => a.enum);
    const destinationParkIds = parks.filter((p) => dests[p.slug]).map((p) => p.slug);
    const result = await submitBookingInquiry({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim(),
      phone: phone.trim() ? `${phoneCode} ${phone.trim()}` : undefined,
      country,
      adults,
      children,
      preferredStartDate: !whenFlexible && startDate ? startDate : undefined,
      preferredEndDate: !whenFlexible && endDate ? endDate : undefined,
      budgetCategory: budgetUnsure ? undefined : budgetToCategory(budget),
      tripType: party ? PARTIES.find((p) => p.key === party)?.trip : undefined,
      interests: interests.length ? interests : undefined,
      destinationParkIds: destinationParkIds.length ? destinationParkIds : undefined,
      preferredDurationDays: daysUnsure ? undefined : days,
      message: notes.trim() || undefined,
      specialRequests: buildSpecialRequests() || undefined,
    });
    setSubmitting(false);
    if (result.status === "received") setStep(DONE);
    else setError(result.message || "Something went wrong. Please try again.");
  };

  const next = () => {
    if (current === "details") {
      const err = contactError();
      if (err) return setError(err);
      setError("");
    }
    if (step < LAST) {
      setStep(step + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      submit();
    }
  };
  const back = () => setStep((s) => Math.max(0, s - 1));

  const daysPct = ((days - 3) / (21 - 3)) * 100;
  const budgetPct = ((budget - 1500) / (7500 - 1500)) * 100;

  const fmtDate = (iso: string) => {
    if (!iso) return "";
    const [y, m, d] = iso.split("-");
    return `${+d} ${MONTHS[+m - 1]} ${y}`;
  };
  const selMonthNames = MONTHS.filter((_, i) => months[i]);
  const whenSummary = whenFlexible
    ? "Flexible / not sure"
    : startDate
      ? `${fmtDate(startDate)}${endDate ? " – " + fmtDate(endDate) : ""}`
      : selMonthNames.length
        ? selMonthNames.join(", ")
        : "Not specified";
  const reviewRows = [
    { label: "Experiences", value: ACTIVITIES.filter((a) => acts[a.key]).map((a) => a.name).join(", ") || "—" },
    { label: "Destinations", value: parks.filter((p) => dests[p.slug]).map((p) => p.name).join(", ") || "Open to suggestions" },
    { label: "Trip length", value: daysUnsure ? "Flexible" : days >= 21 ? "21+ days" : `${days} days` },
    { label: "Travelling as", value: party ? PARTIES.find((p) => p.key === party)?.name ?? "—" : "—" },
    { label: "When", value: whenSummary },
    { label: "Travellers", value: `${adults} adult${adults > 1 ? "s" : ""}, ${children} ${children === 1 ? "child" : "children"}${children > 0 ? ` (ages ${childAges.join(", ")})` : ""}` },
    { label: "Budget", value: budgetUnsure ? "Flexible" : `${budget >= 7500 ? "$7,500+" : "$" + budget.toLocaleString()} / person` },
    { label: "Notes", value: notes.trim() || "—" },
    { label: "Contact", value: `${firstName} ${lastName}`.trim() || "—" },
    { label: "Email", value: email.trim() || "—" },
    { label: "Phone", value: phone.trim() ? `${phoneCode} ${phone.trim()}` : "—" },
    { label: "Country", value: country },
  ];

  const eyebrow = (t: string) => (
    <div style={{ color: "var(--accent-gold-deep)", fontSize: 12, fontWeight: 600, letterSpacing: ".16em", textTransform: "uppercase", marginBottom: 10 }}>{t}</div>
  );
  const heading = (t: string) => (
    <h2 style={{ fontFamily: "var(--font-source-serif), Georgia, serif", fontWeight: 700, color: "var(--ink)", fontSize: "clamp(26px,3.6vw,36px)", lineHeight: 1.1, margin: "0 0 6px" }}>{t}</h2>
  );
  const sub = (t: string) => <p style={{ color: "var(--muted)", fontSize: 15, margin: "0 0 24px" }}>{t}</p>;

  const cardStyle = (sel: boolean): React.CSSProperties => ({
    border: `2px solid ${sel ? gold : "var(--border)"}`,
    background: sel ? "var(--accent-gold-soft)" : "var(--card)",
    boxShadow: sel ? "0 8px 22px rgba(196,143,43,.22)" : "0 1px 2px rgba(62,21,2,.04)",
  });

  return (
    <div className="kplanner" style={embedded ? { height: "100%" } : { background: "linear-gradient(160deg,var(--sand),var(--cream))", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "clamp(16px,4vw,48px)" }}>
      <style>{PLANNER_CSS}</style>
      <div style={{ width: "100%", maxWidth: embedded ? "none" : 720, margin: "0 auto", ...(embedded ? { height: "100%" } : {}) }}>
        <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 18, boxShadow: "0 30px 80px rgba(62,21,2,.14)", overflow: "hidden", ...(embedded ? { display: "flex", flexDirection: "column", height: "100%" } : {}) }}>
          {/* header */}
          <div style={{ padding: "clamp(20px,3vw,28px) clamp(22px,4vw,40px) 0" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, marginBottom: 18 }}>
              <span style={{ fontFamily: "var(--font-source-serif), Georgia, serif", fontWeight: 700, fontSize: 15, letterSpacing: ".06em", color: "var(--brand-choc)" }}>
                KABENGO <span style={{ color: "var(--brand-olive)" }}>SAFARIS</span>
              </span>
              {inFlow && <span style={{ fontSize: 13, fontWeight: 600, color: "var(--muted)" }} aria-live="polite">Step {Math.min(step + 1, LAST + 1)} of {LAST + 1}</span>}
            </div>
            {inFlow && (
              <div role="progressbar" aria-label="Planner progress" style={{ height: 6, borderRadius: 6, background: "var(--sand)", overflow: "hidden" }}>
                <div style={{ height: "100%", width: progressPct, background: "linear-gradient(90deg,var(--accent-gold),var(--accent-gold-deep))", borderRadius: 6, transition: "width .5s cubic-bezier(.4,0,.2,1)" }} />
              </div>
            )}
          </div>

          {/* body */}
          <div style={{ padding: "clamp(24px,4vw,40px)", ...(embedded ? { flex: 1, overflowY: "auto", minHeight: 0 } : { minHeight: 380 }) }}>
            <div key={step} style={{ animation: "kp-stepIn .42s cubic-bezier(.2,.7,.2,1) both" }}>

              {/* STEP — interests */}
              {current === "interests" && (
                <>
                  {eyebrow("What excites you")}
                  {heading("What excites you?")}
                  {sub("Pick one or more — we'll weave them into one trip.")}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(155px,1fr))", gap: 12 }}>
                    {ACTIVITIES.map((a) => {
                      const sel = !!acts[a.key];
                      const { Icon } = a;
                      return (
                        <button key={a.key} onClick={() => setActs((s) => ({ ...s, [a.key]: !s[a.key] }))} aria-pressed={sel} style={{ position: "relative", display: "flex", alignItems: "center", gap: 12, textAlign: "left", borderRadius: 12, cursor: "pointer", padding: "16px", transition: "transform .2s,border-color .2s,box-shadow .2s", ...cardStyle(sel) }}>
                          <span style={{ width: 40, height: 40, borderRadius: "50%", background: sel ? gold : "var(--brand-green-pale)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: sel ? "#fff" : "var(--brand-green)" }}>
                            <Icon size={20} strokeWidth={1.8} />
                          </span>
                          <span style={{ fontWeight: 600, fontSize: 15, color: "var(--ink)" }}>{a.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </>
              )}

              {/* STEP — where (destinations, real parks + search) */}
              {current === "where" && (
                <>
                  {eyebrow("Destinations")}
                  {heading("Where do you want to go?")}
                  {sub("Search and pick the parks calling you — or skip, and we'll suggest a route.")}
                  <div style={{ position: "relative", marginBottom: 16 }}>
                    <Search size={18} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--muted)" }} />
                    <input className="kfield" value={parkSearch} onChange={(e) => setParkSearch(e.target.value)} placeholder="Search parks…" aria-label="Search parks" style={{ paddingLeft: 42 }} />
                  </div>
                  {parksLoading ? (
                    <div style={{ textAlign: "center", color: "var(--muted)", padding: "48px 0", fontSize: 14 }}>Loading destinations…</div>
                  ) : filteredParks.length === 0 ? (
                    <div style={{ textAlign: "center", color: "var(--muted)", padding: "48px 0", fontSize: 14 }}>No parks match “{parkSearch}”.</div>
                  ) : (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 12, maxHeight: 344, overflowY: "auto", paddingRight: 4 }}>
                      {filteredParks.map((p, idx) => {
                        const sel = !!dests[p.slug];
                        return (
                          <button key={p.slug} onClick={() => setDests((s) => ({ ...s, [p.slug]: !s[p.slug] }))} aria-pressed={sel} style={{ position: "relative", textAlign: "left", borderRadius: 12, overflow: "hidden", cursor: "pointer", padding: 0, transition: "transform .2s,border-color .2s,box-shadow .2s", ...cardStyle(sel) }}>
                            <div style={{ position: "relative", height: 82, background: p.primaryImageUrl ? `center/cover no-repeat url('${p.primaryImageUrl}')` : PARK_GRADIENTS[idx % PARK_GRADIENTS.length] }}>
                              {!p.primaryImageUrl && <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(250,248,245,.4)" }}><MapPin size={22} /></div>}
                              <div style={{ position: "absolute", top: 8, right: 8, width: 24, height: 24, borderRadius: "50%", background: sel ? gold : "rgba(255,255,255,.85)", border: `2px solid ${sel ? gold : "rgba(255,255,255,.9)"}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                {sel && <Check size={13} color="#fff" strokeWidth={3.2} style={{ animation: "kp-pop .3s ease" }} />}
                              </div>
                            </div>
                            <div style={{ padding: "10px 12px" }}>
                              <div style={{ fontWeight: 600, fontSize: 13.5, color: "var(--ink)", lineHeight: 1.25 }}>{p.name}</div>
                              {p.region && <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 2 }}>{p.region}</div>}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </>
              )}

              {/* STEP — days */}
              {current === "days" && (
                <>
                  {eyebrow("Trip length")}
                  {heading("How many days?")}
                  {sub("A rough idea is perfect — we'll fine-tune it together.")}
                  <div style={{ textAlign: "center", marginBottom: 8 }}>
                    <span style={{ fontFamily: "var(--font-source-serif), Georgia, serif", fontWeight: 700, color: "var(--accent-gold-deep)", fontSize: "clamp(44px,7vw,64px)", lineHeight: 1, opacity: daysUnsure ? 0.4 : 1 }}>
                      {daysUnsure ? "Not sure" : days >= 21 ? "21+ days" : `${days} days`}
                    </span>
                  </div>
                  <div style={{ padding: "20px 6px 0" }}>
                    <input type="range" min={3} max={21} value={days} onChange={(e) => setDays(+e.target.value)} className="krange" disabled={daysUnsure} aria-label="Number of days" style={{ background: `linear-gradient(90deg, ${gold} ${daysPct}%, var(--sand) ${daysPct}%)` }} />
                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10, color: "var(--muted)", fontSize: 12 }}><span>3 days</span><span>21+ days</span></div>
                  </div>
                  <label style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 9, marginTop: 26, cursor: "pointer" }}>
                    <input type="checkbox" checked={daysUnsure} onChange={() => setDaysUnsure((v) => !v)} style={{ width: 18, height: 18, accentColor: gold, cursor: "pointer" }} />
                    <span style={{ fontSize: 14, fontWeight: 500, color: "var(--body)" }}>Not sure yet — help me decide</span>
                  </label>
                </>
              )}

              {/* STEP — party */}
              {current === "who" && (
                <>
                  {eyebrow("Your party")}
                  {heading("Who's travelling?")}
                  {sub("Choose the closest match.")}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(155px,1fr))", gap: 12 }}>
                    {PARTIES.map((p) => {
                      const sel = party === p.key;
                      const { Icon } = p;
                      return (
                        <button key={p.key} onClick={() => setParty(p.key)} aria-pressed={sel} style={{ position: "relative", display: "flex", alignItems: "center", gap: 12, textAlign: "left", borderRadius: 12, cursor: "pointer", padding: "16px", transition: "transform .2s,border-color .2s,box-shadow .2s", ...cardStyle(sel) }}>
                          <span style={{ width: 40, height: 40, borderRadius: "50%", background: sel ? gold : "var(--brand-green-pale)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: sel ? "#fff" : "var(--brand-green)" }}>
                            <Icon size={20} strokeWidth={1.8} />
                          </span>
                          <span style={{ fontWeight: 600, fontSize: 15, color: "var(--ink)" }}>{p.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </>
              )}

              {/* STEP — when */}
              {current === "when" && (
                <>
                  {eyebrow("Timing")}
                  {heading("When do you want to travel?")}
                  {sub("Peak wildlife season runs June–October — but every month has its magic.")}
                  <div style={{ opacity: whenFlexible ? 0.35 : 1, pointerEvents: whenFlexible ? "none" : "auto", transition: "opacity .2s" }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--body)", marginBottom: 12 }}>Pick a month (or a few)</div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(84px,1fr))", gap: 9 }}>
                      {MONTHS.map((m, idx) => {
                        const sel = !!months[idx];
                        return (
                          <button key={m} onClick={() => setMonths((s) => ({ ...s, [idx]: !s[idx] }))} aria-pressed={sel} style={{ border: `2px solid ${sel ? gold : "var(--border)"}`, background: sel ? "var(--accent-gold-soft)" : "var(--card)", color: sel ? "var(--accent-gold-deep)" : "var(--body)", fontWeight: 600, fontSize: 14, borderRadius: 9, padding: "12px 4px", cursor: "pointer", transition: "all .18s" }}>{m}</button>
                        );
                      })}
                    </div>
                    <div style={{ marginTop: 16 }}>
                      <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "var(--body)", marginBottom: 7 }}>Or exact travel dates</label>
                      <DateRangePicker startDate={startDate} endDate={endDate} onChangeStart={setStartDate} onChangeEnd={setEndDate} placeholder="Select your travel dates" />
                    </div>
                  </div>
                  <label style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 9, marginTop: 24, cursor: "pointer" }}>
                    <input type="checkbox" checked={whenFlexible} onChange={() => setWhenFlexible((v) => !v)} style={{ width: 18, height: 18, accentColor: gold, cursor: "pointer" }} />
                    <span style={{ fontSize: 14, fontWeight: 500, color: "var(--body)" }}>I'm flexible / not sure yet</span>
                  </label>
                </>
              )}

              {/* STEP — travellers */}
              {current === "travellers" && (
                <>
                  {eyebrow("Group size")}
                  {heading("Travellers & ages")}
                  {sub("Who's coming along?")}
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    {([["Adults", "Aged 16+", adults, (n: number) => setAdults(n), 1, 20],
                       ["Children", "Aged 0–15", children, setChildCount, 0, 12]] as const).map(([label, hint, val, setter, min, max]) => (
                      <div key={label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, background: "var(--sand)", borderRadius: 12, padding: "18px 20px" }}>
                        <div><div style={{ fontWeight: 600, fontSize: 16, color: "var(--ink)" }}>{label}</div><div style={{ fontSize: 13, color: "var(--muted)" }}>{hint}</div></div>
                        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                          <button onClick={() => setter(Math.max(min, val - 1))} aria-label={`Fewer ${label.toLowerCase()}`} style={{ width: 40, height: 40, borderRadius: "50%", border: "none", background: val <= min ? "#cbb" : "var(--brand-olive)", color: "#fff", fontSize: 22, lineHeight: 1, cursor: "pointer" }}>−</button>
                          <span style={{ fontFamily: "var(--font-source-serif), Georgia, serif", fontWeight: 700, fontSize: 26, color: "var(--ink)", minWidth: 28, textAlign: "center" }}>{val}</span>
                          <button onClick={() => setter(Math.min(max, val + 1))} aria-label={`More ${label.toLowerCase()}`} style={{ width: 40, height: 40, borderRadius: "50%", border: "none", background: gold, color: "var(--brand-choc-dark)", fontSize: 22, lineHeight: 1, cursor: "pointer" }}>+</button>
                        </div>
                      </div>
                    ))}
                    {children > 0 && (
                      <div style={{ animation: "kp-floatUp .35s ease both", background: "var(--brand-green-pale)", borderRadius: 12, padding: "18px 20px" }}>
                        <div style={{ fontWeight: 600, fontSize: 14, color: "var(--brand-green)", marginBottom: 12 }}>Age of each child at travel</div>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(88px,1fr))", gap: 10 }}>
                          {Array.from({ length: children }, (_, i) => (
                            <label key={i} style={{ display: "block" }}>
                              <span style={{ display: "block", fontSize: 11, color: "var(--muted)", marginBottom: 4 }}>Child {i + 1}</span>
                              <PlannerDropdown value={childAges[i] ?? "5"} options={AGE_OPTIONS} onChange={(v) => setChildAges((a) => { const n = a.slice(); n[i] = v; return n; })} />
                            </label>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* STEP — budget */}
              {current === "budget" && (
                <>
                  {eyebrow("Budget")}
                  {heading("Your budget per person")}
                  {sub("A guide price, excluding international flights.")}
                  <div style={{ textAlign: "center", marginBottom: 8 }}>
                    <span style={{ fontFamily: "var(--font-source-serif), Georgia, serif", fontWeight: 700, color: "var(--accent-gold-deep)", fontSize: "clamp(40px,6.5vw,58px)", lineHeight: 1, opacity: budgetUnsure ? 0.4 : 1 }}>
                      {budgetUnsure ? "Flexible" : budget >= 7500 ? "$7,500+" : `$${budget.toLocaleString()}`}
                    </span>
                  </div>
                  <div style={{ padding: "20px 6px 0" }}>
                    <input type="range" min={1500} max={7500} step={250} value={budget} onChange={(e) => setBudget(+e.target.value)} className="krange" disabled={budgetUnsure} aria-label="Budget per person" style={{ background: `linear-gradient(90deg, ${gold} ${budgetPct}%, var(--sand) ${budgetPct}%)` }} />
                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10, color: "var(--muted)", fontSize: 12 }}><span>$1,500</span><span>$7,500+</span></div>
                  </div>
                  <label style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 9, marginTop: 26, cursor: "pointer" }}>
                    <input type="checkbox" checked={budgetUnsure} onChange={() => setBudgetUnsure((v) => !v)} style={{ width: 18, height: 18, accentColor: gold, cursor: "pointer" }} />
                    <span style={{ fontSize: 14, fontWeight: 500, color: "var(--body)" }}>Help me decide</span>
                  </label>
                </>
              )}

              {/* STEP — notes */}
              {current === "notes" && (
                <>
                  {eyebrow("Wishlist")}
                  {heading("Anything else?")}
                  {sub("The more you share, the more tailored your proposal.")}
                  <textarea rows={6} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Specific lodges, must-see animals, room type, combining safari + beach…" className="kfield" style={{ resize: "vertical", lineHeight: 1.6 }} />
                </>
              )}

              {/* STEP — details */}
              {current === "details" && (
                <>
                  {eyebrow("Almost there")}
                  {heading("Your details")}
                  {sub("So a specialist can reach you with your proposal.")}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                    <label><span style={{ display: "block", fontSize: 13, fontWeight: 600, color: "var(--body)", marginBottom: 7 }}>First name</span><input className="kfield" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Amani" /></label>
                    <label><span style={{ display: "block", fontSize: 13, fontWeight: 600, color: "var(--body)", marginBottom: 7 }}>Last name</span><input className="kfield" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Mushi" /></label>
                    <label style={{ gridColumn: "1/-1" }}><span style={{ display: "block", fontSize: 13, fontWeight: 600, color: "var(--body)", marginBottom: 7 }}>Email</span><input type="email" className="kfield" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" /></label>
                    <label style={{ gridColumn: "1/-1" }}>
                      <span style={{ display: "block", fontSize: 13, fontWeight: 600, color: "var(--body)", marginBottom: 7 }}>Phone</span>
                      <div style={{ display: "flex", gap: 10 }}>
                        <div style={{ width: 176, flexShrink: 0 }}>
                          <PlannerDropdown value={phoneCode} onChange={setPhoneCode} options={PHONE_OPTIONS} searchable />
                        </div>
                        <input type="tel" className="kfield" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="712 345 678" />
                      </div>
                    </label>
                    <label style={{ gridColumn: "1/-1" }}>
                      <span style={{ display: "block", fontSize: 13, fontWeight: 600, color: "var(--body)", marginBottom: 7 }}>Country of residence</span>
                      <PlannerDropdown value={country} onChange={setCountry} options={COUNTRY_OPTIONS} searchable placeholder="Select your country" />
                    </label>
                  </div>
                  <label style={{ display: "flex", alignItems: "flex-start", gap: 10, marginTop: 18, cursor: "pointer" }}>
                    <input type="checkbox" checked={consent} onChange={() => setConsent((v) => !v)} style={{ width: 18, height: 18, accentColor: gold, cursor: "pointer", marginTop: 2, flexShrink: 0 }} />
                    <span style={{ fontSize: 13.5, lineHeight: 1.5, color: "var(--body)" }}>I'd like Kabengo to contact me about my safari proposal. No spam, ever.</span>
                  </label>
                  {error && <p style={{ color: "#9a3412", fontSize: 13.5, fontWeight: 500, marginTop: 14 }}>{error}</p>}
                </>
              )}

              {/* STEP — review */}
              {current === "review" && (
                <>
                  {eyebrow("Almost done")}
                  {heading("Review your plan")}
                  {sub("A quick check — go Back to change anything, then send it to us.")}
                  <div style={{ border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden" }}>
                    {reviewRows.map((r, idx) => (
                      <div key={r.label} style={{ display: "flex", justifyContent: "space-between", gap: 16, padding: "12px 16px", background: idx % 2 ? "var(--cream)" : "var(--card)" }}>
                        <span style={{ fontSize: 13, color: "var(--muted)", fontWeight: 500, flexShrink: 0 }}>{r.label}</span>
                        <span style={{ fontSize: 13.5, color: "var(--ink)", fontWeight: 600, textAlign: "right", wordBreak: "break-word" }}>{r.value}</span>
                      </div>
                    ))}
                  </div>
                  {error && <p style={{ color: "#9a3412", fontSize: 13.5, fontWeight: 500, marginTop: 14 }}>{error}</p>}
                </>
              )}

              {/* SUCCESS */}
              {step === DONE && (
                <div style={{ textAlign: "center", padding: "14px 0 10px" }}>
                  <div style={{ position: "relative", width: 96, height: 96, margin: "0 auto 26px" }}>
                    <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "var(--brand-green-pale)", animation: "kp-pop .45s ease both" }} />
                    <svg viewBox="0 0 96 96" fill="none" style={{ position: "absolute", inset: 0 }}><path d="M30 50l12 12 24-26" stroke="var(--brand-green)" strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" style={{ animation: "kp-pop .5s .1s ease both" }} /></svg>
                  </div>
                  <h2 style={{ fontFamily: "var(--font-source-serif), Georgia, serif", fontWeight: 700, color: "var(--ink)", fontSize: "clamp(28px,4vw,40px)", lineHeight: 1.08, margin: "0 0 14px" }}>Asante sana — request received!</h2>
                  <p style={{ color: "var(--body)", fontSize: 17, lineHeight: 1.6, maxWidth: 440, margin: "0 auto 30px" }}>We'll craft your tailor-made itinerary and a personal safari specialist will reply <strong style={{ color: "var(--ink)" }}>within 24 hours</strong>. Keep an eye on your inbox.</p>
                  <Link href="/" style={{ display: "inline-block", background: "var(--brand-green)", color: "var(--cream)", fontWeight: 600, fontSize: 15, borderRadius: 8, padding: "14px 28px", transition: "background .2s" }}>Back to home</Link>
                </div>
              )}
            </div>
          </div>

          {/* footer nav */}
          {inFlow && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, padding: "20px clamp(22px,4vw,40px)", borderTop: "1px solid var(--border)", background: "var(--cream)" }}>
              <button onClick={back} style={{ background: "none", color: "var(--brand-green)", fontWeight: 600, fontSize: 15, border: "1.5px solid var(--brand-green)", borderRadius: 8, padding: "12px 22px", cursor: "pointer", visibility: step === 0 ? "hidden" : "visible" }}>Back</button>
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                {step !== LAST && <span style={{ fontSize: 12.5, color: "var(--muted)" }}>takes ~1 minute · no obligation</span>}
                <button onClick={next} disabled={submitting} style={{ display: "inline-flex", alignItems: "center", gap: 9, background: gold, color: "var(--brand-choc-dark)", fontWeight: 600, fontSize: 15, border: "none", borderRadius: 8, padding: "13px 26px", cursor: submitting ? "wait" : "pointer", opacity: submitting ? 0.7 : 1, boxShadow: "0 6px 18px rgba(196,143,43,.4)" }}>
                  {step === LAST ? (submitting ? "Sending…" : "Get My Safari Proposal") : "Next"}
                  <ArrowRight size={16} strokeWidth={2.4} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* trust strip (standalone only — the /plan rail carries trust when embedded) */}
        {!embedded && (
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "center", gap: "10px 22px", marginTop: 22, color: "var(--muted)", fontSize: 13 }}>
            {TRUST.map((t) => (
              <span key={t} style={{ display: "inline-flex", alignItems: "center", gap: 7 }}><Check size={15} color="var(--accent-gold-deep)" strokeWidth={2} />{t}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

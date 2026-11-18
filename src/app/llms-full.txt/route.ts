// /llms-full.txt - the whole catalogue as plain text, for a model that was asked what a
// Tanzanian safari costs. The short map is /llms.txt; this is everything behind it.

const BASE = "https://kabengosafaris.com";
const BRAND = "Kabengo Safaris";

import {
  fetchCorpus,
  type Corpus,
  type CorpusPark,
  type CorpusParkFee,
  type CorpusAccommodation,
  type CorpusActivity,
  type CorpusSafari,
  type CorpusArticle,
} from "@/lib/server-api";

export const revalidate = 86400; // 1 day

/* ------------------------------------------------------------------ helpers */

/** A field is printed only when it has something in it. Blank lines teach a model nothing. */
function line(label: string, value: unknown): string {
  if (value === null || value === undefined) return "";
  const text = String(value).trim();
  if (!text) return "";
  return `${label}: ${text}\n`;
}

/** Prose, as its own paragraph. Markup is stripped: this file is read as plain text. */
function para(value?: string | null): string {
  if (!value) return "";
  const text = String(value)
    .replace(/<[^>]*>/g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return text ? `${text}\n\n` : "";
}

/**
 * Tags are stored either as a JSON array or as a comma-separated string, depending on how the
 * record was written. Both are read rather than one being declared correct, because a file that
 * silently drops half the tags is worse than one that prints them untidily.
 */
function tagList(raw?: string | string[] | null): string {
  if (!raw) return "";
  if (Array.isArray(raw)) return raw.filter(Boolean).join(", ");
  const text = raw.trim();
  if (!text) return "";
  if (text.startsWith("[")) {
    try {
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed)) return parsed.filter(Boolean).join(", ");
    } catch {
      /* not JSON after all; fall through and print it as written */
    }
  }
  return text;
}

function money(amount?: number, currency?: string): string {
  if (typeof amount !== "number" || !Number.isFinite(amount)) return "";
  /* Grouped, and to the cent unless it is a round figure: a park fee is 70.80, not 70.8. */
  const n = amount
    .toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    .replace(/\.00$/, "");
  return `${currency || "USD"} ${n}`;
}

/* ------------------------------------------------------------------ sections */

function parksSection(parks: CorpusPark[], fees: CorpusParkFee[], base: string): string {
  if (!parks.length) return "";
  const feesBySlug = new Map<string, CorpusParkFee[]>();
  for (const fee of fees) {
    if (!fee.parkSlug) continue;
    const list = feesBySlug.get(fee.parkSlug) || [];
    list.push(fee);
    feesBySlug.set(fee.parkSlug, list);
  }

  let out = `## National parks and reserves (${parks.length})\n\n`;
  for (const p of parks) {
    out += `### ${p.name || p.slug}\n`;
    out += line("URL", p.slug ? `${base}/en/parks/${p.slug}` : "");
    out += line("Type", p.parkType);
    out += line("Region", p.region);
    out += line("District", p.district);
    out += line("Size", p.size);
    out += line("Elevation", p.elevation);
    out += line("Best time to visit", p.bestTimeToVisit);
    out += line("Opening hours", p.openingHours);
    out += line("Tags", tagList(p.tags));

    const parkFees = p.slug ? feesBySlug.get(p.slug) : undefined;
    if (parkFees && parkFees.length) {
      const seasons = parkFees
        .map((f) => `${f.season || "All year"} ${money(f.amount, f.currency)}`)
        .join(", ");
      /* Said in full every time. A number without who pays it and for how long is a number
       * somebody will quote wrongly. */
      out += line(
        "Conservation fee (non-resident adult, per person per 24 hours, paid to the park authority)",
        seasons,
      );
    }
    out += "\n";
    out += para(p.shortDescription);
    out += para(p.fullDescription);
    if (p.ecosystem) out += `Ecosystem. ${para(p.ecosystem)}`;
    if (p.wildlife) out += `Wildlife. ${para(p.wildlife)}`;
    if (p.vegetation) out += `Vegetation. ${para(p.vegetation)}`;
    if (p.history) out += `History. ${para(p.history)}`;
    if (p.accessInformation) out += `Getting there. ${para(p.accessInformation)}`;
  }
  return out;
}

function accommodationsSection(items: CorpusAccommodation[], base: string): string {
  if (!items.length) return "";
  let out = `## Lodges and camps (${items.length})\n\n`;
  for (const a of items) {
    out += `### ${a.name || a.slug}\n`;
    out += line("URL", a.slug ? `${base}/en/accommodations/${a.slug}` : "");
    out += line("Type", a.accommodationTypeDisplayName || a.accommodationType);
    out += line("Category", a.categoryDisplayName || a.category);
    out += line("Stars", a.starRating || a.categoryApproximateStars);
    out += line("Region", a.region);
    out += line("District", a.district);
    out += line("Location", a.location);
    out += line("Rooms", a.totalRooms);
    out += line("Room types", a.roomTypeCount);
    out += line("Maximum guests", a.maxGuests);
    out += line("Price range", a.priceRange);
    out += line("Best season", a.bestSeason);
    out += line("Operating season", a.operatingSeason);
    out += line("Tags", tagList(a.tags));
    out += "\n";
    out += para(a.shortDescription);
    out += para(a.details);
    if (a.amenities) out += `Amenities. ${para(a.amenities)}`;
    if (a.services) out += `Services. ${para(a.services)}`;
    if (a.nearbyAttractions) out += `Nearby. ${para(a.nearbyAttractions)}`;
    if (a.childPolicy) out += `Children. ${para(a.childPolicy)}`;
  }
  return out;
}

function activitiesSection(items: CorpusActivity[], base: string): string {
  if (!items.length) return "";
  let out = `## Activities (${items.length})\n\n`;
  for (const a of items) {
    out += `### ${a.name || a.slug}\n`;
    out += line("URL", a.slug ? `${base}/en/activities/${a.slug}` : "");
    out += line("Minimum age", a.minimumAge);
    out += line("Maximum participants", a.maximumParticipants);
    out += line("When", a.seasonAvailability);
    out += line("Tags", tagList(a.tags));
    out += "\n";
    out += para(a.description);
    out += para(a.detailedDescription);
    if (a.equipmentRequired) out += `What to bring. ${para(a.equipmentRequired)}`;
    if (a.safetyInformation) out += `Safety. ${para(a.safetyInformation)}`;
  }
  return out;
}

function safarisSection(items: CorpusSafari[], base: string): string {
  if (!items.length) return "";
  let out = `## Safari itineraries (${items.length})\n\n`;
  for (const s of items) {
    out += `### ${s.name || s.code}\n`;
    out += line("URL", s.code ? `${base}/en/safaris/${s.code}` : "");
    out += line("Reference", s.code);
    out += line(
      "Duration",
      s.totalDays ? `${s.totalDays} days, ${s.totalNights ?? Math.max(s.totalDays - 1, 0)} nights` : "",
    );
    out += line("Trip type", s.tripTypeDisplayName || s.tripType);
    out += line("Comfort level", s.budgetCategoryDisplayName || s.budgetCategory);
    out += line("Starts", s.startLocation);
    out += line("Ends", s.endLocation);

    /*
     * The price, said as exactly what it is.
     *
     * grandTotalRack is the total for the PARTY this trip is costed for, and the party size is
     * not in the same object - it is totalPaxCount, with the make-up in paxBreakdown. A model
     * that reads the number alone will quote it as a per-person "from" rate, which on a trip
     * costed for two is half the real figure.
     *
     * Every row is printed, not just the first. A trip can carry two rows in two currencies
     * (an East African resident priced in TZS alongside a non-resident priced in USD), and
     * there is no exchange rate anywhere in this system by deliberate decision, so the rows
     * must never be summed or merged. Printing them separately is the only honest rendering.
     */
    const pax = s.totalPaxCount;
    const party = (s.paxBreakdown || [])
      .map((b) => [b.count, b.nationCategoryName, b.ageCategoryName].filter(Boolean).join(" "))
      .filter(Boolean)
      .join(", ");
    if (pax) out += line("Priced for", party ? `${pax} travellers (${party})` : `${pax} travellers`);

    for (const cost of s.costSummary || []) {
      if (typeof cost.grandTotalRack !== "number") continue;
      const total = money(cost.grandTotalRack, cost.currency);
      out += line(
        pax ? `Published total for the ${pax} travellers above` : "Published total",
        total,
      );
      if (pax && pax > 0) {
        out += line("Which is per person", money(cost.grandTotalRack / pax, cost.currency));
      }
      const parts = [
        cost.accommodationRack !== undefined ? `accommodation ${money(cost.accommodationRack, cost.currency)}` : "",
        cost.parkFeesRack !== undefined ? `park fees ${money(cost.parkFeesRack, cost.currency)}` : "",
        cost.activitiesRack !== undefined ? `activities ${money(cost.activitiesRack, cost.currency)}` : "",
      ].filter(Boolean);
      if (parts.length) out += line("Of which", parts.join(", "));
    }
    out += "\n";
    out += para(s.description);
    if (s.highlights) out += `Highlights. ${para(s.highlights)}`;
    if (s.inclusions?.length) out += `Included: ${s.inclusions.join("; ")}\n\n`;
    if (s.exclusions?.length) out += `Not included: ${s.exclusions.join("; ")}\n\n`;

    for (const d of s.days || []) {
      out += `#### Day ${d.dayNumber ?? "?"}${d.title ? `: ${d.title}` : ""}\n`;
      const route = [d.startLocation, d.endLocation].filter(Boolean).join(" to ");
      out += line("Route", route);
      const parkNames = (d.parks || []).map((p) => p.parkName).filter(Boolean).join(", ");
      out += line("Parks", parkNames);
      const actNames = (d.activities || [])
        .map((a) => (a.isOptional ? `${a.activityName} (optional)` : a.activityName))
        .filter(Boolean)
        .join(", ");
      out += line("Activities", actNames);
      const stays = (d.accommodations || [])
        .map((a) => {
          const bits = [a.accommodationName, a.roomType, a.board].filter(Boolean).join(", ");
          return a.isAlternative ? `${bits} (alternative)` : bits;
        })
        .filter(Boolean)
        .join(" | ");
      out += line("Overnight", stays);
      out += line("Meals", d.mealsIncluded);
      out += "\n";
      out += para(d.description);
      if (d.wildlifeHighlights) out += `Wildlife. ${para(d.wildlifeHighlights)}`;
      if (d.scenicHighlights) out += `Scenery. ${para(d.scenicHighlights)}`;
      if (d.specialNotes) out += `Note. ${para(d.specialNotes)}`;
    }
  }
  return out;
}

function articlesSection(items: CorpusArticle[], base: string): string {
  if (!items.length) return "";
  let out = `## Articles (${items.length})\n\n`;
  for (const a of items) {
    out += `### ${a.title || a.slug}\n`;
    out += line("URL", a.slug ? `${base}/en/blog/${a.slug}` : "");
    out += line("Published", a.date);
    out += line("Author", a.author);
    out += line("Tags", tagList(a.tags));
    out += "\n";
    out += para(a.excerpt);
    for (const block of a.body || []) {
      if (block.type === "h2" || block.type === "h3") out += `${block.text}\n\n`;
      else if (block.type === "ul") out += (block.items || []).map((i) => `- ${i}`).join("\n") + "\n\n";
      else if (block.type === "image") out += block.caption ? `${para(block.caption)}` : "";
      else out += para(block.text);
    }
    for (const faq of a.faqs || []) {
      const q = faq.question ?? faq.q;
      const ans = faq.answer ?? faq.a;
      if (q) out += `Q. ${q}\n`;
      if (ans) out += `A. ${String(ans).replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim()}\n\n`;
    }
  }
  return out;
}

/* ------------------------------------------------------------------ the route */

export async function GET() {
  const corpus: Corpus | null = await fetchCorpus();

  /*
   * Degrade, never 500.
   *
   * A crawler that gets a 500 may not come back for a while, and a short file is still a true
   * file. So a failed fetch produces the header and nothing else, and says so, rather than an
   * error page a model would happily quote.
   */
  const parks = corpus?.parks ?? [];
  const fees = corpus?.parkFees ?? [];
  const accommodations = corpus?.accommodations ?? [];
  const activities = corpus?.activities ?? [];
  const safaris = corpus?.safaris ?? [];
  const articles = corpus?.articles ?? [];

  const header = `# ${BRAND} - full content

> Every park, lodge, activity, safari itinerary and article this site publishes, in full, in
> English. Generated ${corpus?.generatedAt ?? new Date().toISOString()}. The short version of
> this file is at ${BASE}/llms.txt and the complete list of URLs is at ${BASE}/sitemap.xml.
>
> Prices are quoted in the currency stated beside them. Park conservation fees are what the park
> authority charges and are collected on the traveller's behalf; itinerary prices are this
> company's published rates for the party size stated. Nothing here is a live availability feed,
> so confirm dates and current rates before relying on them.

`;

  const body =
    parksSection(parks, fees, BASE) +
    accommodationsSection(accommodations, BASE) +
    activitiesSection(activities, BASE) +
    safarisSection(safaris, BASE) +
    articlesSection(articles, BASE);

  const content = body
    ? header + body
    : `${header}This file is temporarily empty because the catalogue could not be read. Try ${BASE}/sitemap.xml.\n`;

  return new Response(content, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=86400",
    },
  });
}

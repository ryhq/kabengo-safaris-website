// /llms.txt - a concise, LLM-friendly map of the site (emerging GEO convention).
//
// Every number in this file is read from the API, never typed. The hand-written version
// advertised ten languages, two of which did not exist and one of which was missing, and named
// not one of the 194 parks, lodges, activities and itineraries the site actually publishes.
// The full text of all of them is at /llms-full.txt; this is the map to it.

import { getAllPosts } from "@/content/blog";
import { fetchCorpus, type CorpusParkFee } from "@/lib/server-api";
import { routing } from "@/i18n/routing";

const BASE = "https://kabengosafaris.com";
const BRAND = "Kabengo Safaris";

const SUMMARY =
  "Kabengo Safaris is a Tanzania-based, family-run tour operator in Arusha that designs private, " +
  "tailor-made safaris across northern Tanzania (Serengeti, Ngorongoro Crater, Tarangire, Lake " +
  "Manyara) and Zanzibar beach holidays. TATO/TALA licensed, guides who speak your language, " +
  "rated 5.0 on Tripadvisor. Every trip is custom-built: there is no fixed booking cart; " +
  "travellers request a free, no-obligation proposal and a local specialist replies within 24 hours.";

const ABOUT = `
## About
- Founder-led by Enock Fabian, a lifelong local guide based in Arusha, Tanzania.
- Private, custom itineraries only, with no shared-bus group tours.
- Fully licensed and bonded operator (TATO / TALA). Reply within 24 hours.
- Contact: info@kabengosafaris.com | phone/WhatsApp +255 786 345 408.
- Find us: Tripadvisor 5.0/5 (https://www.tripadvisor.com/Attraction_Review-g297913-d34283345-Reviews-Kabengo_Safaris-Arusha_Arusha_Region.html) | Instagram @kabengosafaris (https://www.instagram.com/kabengosafaris/).`;

const REVIEWS = "Verified Tripadvisor reviews.";


export const revalidate = 86400; // 1 day

/**
 * A section is printed only when it has something in it.
 *
 * The old file printed a "Guides & articles" heading over nothing on the site that has no blog
 * posts, which tells a reader the site is broken rather than that it has no blog yet.
 */
function section(heading: string, body: string): string {
  const text = body.trim();
  return text ? `\n## ${heading}\n${text}\n` : "";
}

/**
 * The conservation fees, as a traveller would ask about them.
 *
 * This is the single most citable thing on the site: it is the question behind the best-ranking
 * search term, and it is a figure almost no competitor publishes plainly. It is read from the
 * API's rate table, never typed here, because a number typed into a template is a number nobody
 * updates when the park authority raises it.
 */
function feesBlock(fees: CorpusParkFee[]): string {
  if (!fees.length) return "";

  /* One line per park, with the seasons it actually prices differently. */
  const byPark = new Map<string, CorpusParkFee[]>();
  for (const fee of fees) {
    const key = fee.parkName || fee.parkSlug || "";
    if (!key) continue;
    byPark.set(key, [...(byPark.get(key) || []), fee]);
  }

  const lines: string[] = [];
  for (const [park, list] of byPark) {
    const amounts = new Map<string, string[]>();
    for (const f of list) {
      if (typeof f.amount !== "number") continue;
      /* To the cent unless it is round: the Ngorongoro fee is 70.80, not 70.8. */
      const label = `${f.currency || "USD"} ${f.amount
        .toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
        .replace(/\.00$/, "")}`;
      amounts.set(label, [...(amounts.get(label) || []), f.season || "all year"]);
    }
    if (!amounts.size) continue;
    /* One price in every season is stated once, not three times. */
    const parts = [...amounts.entries()].map(([amount, seasons]) =>
      amounts.size === 1 ? amount : `${amount} (${seasons.join(", ").toLowerCase()})`,
    );
    lines.push(`- ${park}: ${parts.join(", ")}`);
  }
  if (!lines.length) return "";

  return [
    "Park conservation fees, per person per 24 hours, non-resident adult. These are set by the",
    "park authority and collected on the traveller's behalf; they are not an operator charge and",
    "are the largest fixed part of any Tanzania safari price.",
    "",
    ...lines,
  ].join("\n");
}

export async function GET() {
  const corpus = await fetchCorpus();

  const parks = corpus?.parks ?? [];
  const accommodations = corpus?.accommodations ?? [];
  const activities = corpus?.activities ?? [];
  const safaris = corpus?.safaris ?? [];

  /*
   * Counts are read, never typed, and a count of zero is simply not claimed. The old file said
   * "10 languages" and listed two that do not exist while omitting one that does, because
   * somebody wrote the list by hand - and a model quoting the file repeats the error.
   */
  const count = (n: number, one: string, many: string) => (n ? `${n} ${n === 1 ? one : many}` : "");

  const dayRange = (() => {
    const lengths = safaris.map((s) => s.totalDays || 0).filter((d) => d > 0);
    if (!lengths.length) return "";
    const min = Math.min(...lengths);
    const max = Math.max(...lengths);
    return min === max ? `${min} days` : `${min} to ${max} days`;
  })();

  const catalogue = [
    count(safaris.length, "safari itinerary", "safari itineraries") + (dayRange ? ` from ${dayRange}` : ""),
    count(parks.length, "national park or reserve", "national parks and reserves"),
    count(accommodations.length, "lodge and camp", "lodges and camps"),
    count(activities.length, "activity", "activities"),
  ]
    .filter(Boolean)
    .join(", ");

  const parkLines = parks
    .filter((p) => p.slug && p.name)
    .map((p) => {
      const summary = (p.shortDescription || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
      return `- [${p.name}](${BASE}/en/parks/${p.slug})${summary ? `: ${summary}` : ""}`;
    })
    .join("\n");

  const posts = await getAllPosts();
  const articles = posts
    .map((p) => `- [${p.title}](${BASE}/en/blog/${p.slug}): ${p.excerpt}`)
    .join("\n");

  const locales = [...routing.locales];

  const content = `# ${BRAND}

> ${SUMMARY}${catalogue ? ` The site publishes ${catalogue}.` : ""}
${ABOUT}
${section("What a Tanzania safari costs", feesBlock(corpus?.parkFees ?? []))}
## Start here
- [Plan your safari](${BASE}/en/plan): Tailor-made trip planner: share your dates, interests and budget for a free, no-obligation proposal.
- [Contact](${BASE}/en/contact): Talk to a real specialist in Arusha.

## Explore
- [Safaris & itineraries](${BASE}/en/safaris): ${count(safaris.length, "itinerary", "itineraries") || "Itineraries"} with day-by-day plans, maps, lodges and per-person pricing.
- [National parks](${BASE}/en/parks): Wildlife, best time to visit, entry fees and how to get there.
- [Accommodations](${BASE}/en/accommodations): ${count(accommodations.length, "lodge and camp", "lodges and camps") || "Lodges and tented camps"} built into trips.
- [Activities](${BASE}/en/activities): Walking safaris, cultural visits, balloon safaris and more.
- [Guest reviews](${BASE}/en/reviews): ${REVIEWS}
- [FAQ](${BASE}/en/faq): Planning, cost, best time to visit, safety and what's included.
- [Gallery](${BASE}/en/gallery): Photos from Tanzania and Zanzibar.
${section(`National parks and reserves${parks.length ? ` (${parks.length})` : ""}`, parkLines)}${section("Guides & articles (Safari Journal)", articles)}
## Notes
- Available in ${locales.length} language${locales.length === 1 ? "" : "s"} (${locales.join(", ")}) via /{locale}/ paths; English is the default.
- Full text of everything above, including every lodge and every day of every itinerary: ${BASE}/llms-full.txt
- Complete list of URLs: ${BASE}/sitemap.xml
`;

  return new Response(content, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=86400",
    },
  });
}

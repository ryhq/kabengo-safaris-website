import type { CatalogueItem } from "@/lib/server-api";

/**
 * What the hub pages agree on, so the server half and the client half cannot drift.
 *
 * Both sides build the same request now: the server renders the first page, the client takes
 * over from the first filter change. If they disagreed about what "sort by popular" means, the
 * list would visibly reorder a moment after the page appeared, which is worse than the empty
 * grid this refactor replaced.
 */

export const PAGE_SIZE = 9;

export const VALID_SORTS = ["popular", "az", "za"] as const;
export type SortKey = (typeof VALID_SORTS)[number];

export function parseSort(raw: unknown, fallback: SortKey = "popular"): SortKey {
  return typeof raw === "string" && (VALID_SORTS as readonly string[]).includes(raw)
    ? (raw as SortKey)
    : fallback;
}

export function parseText(raw: unknown): string {
  return typeof raw === "string" ? raw : "";
}

/** The sort the API is actually asked for. "popular" is ranked by itinerary usage. */
export function sortParams(sort: SortKey): { sortBy: string; sortDirection: string } {
  if (sort === "az") return { sortBy: "name", sortDirection: "asc" };
  if (sort === "za") return { sortBy: "name", sortDirection: "desc" };
  return { sortBy: "visited", sortDirection: "desc" };
}

/**
 * A row the cards can render.
 *
 * The catalogue type makes every field optional, because it describes what the API may send.
 * A card needs a slug to link to and a name to show, so anything without both is dropped here
 * rather than rendered as an empty tile linking to nowhere.
 */
export function namedItems<T extends CatalogueItem>(rows: T[]): Array<T & { slug: string; name: string }> {
  return rows.filter((r): r is T & { slug: string; name: string } => Boolean(r.slug && r.name));
}

/**
 * Tags, which are stored either as a JSON array or as a comma-separated string.
 *
 * Both are read rather than one being declared correct: the records were written by different
 * routes over time and a page that understands only one shape silently shows half the tags.
 *
 * Lives here because the parks hub now parses them on the SERVER, to derive its tag facets from
 * the whole catalogue instead of a 60-row sample, and the client half must agree with it.
 * (Three detail pages still carry their own copy; folding those in is a separate tidy-up.)
 */
export function parseTags(raw?: string): string[] {
  if (!raw) return [];
  const s = raw.trim();
  if (s.startsWith("[")) {
    try {
      const a = JSON.parse(s);
      if (Array.isArray(a)) return a.map((x) => String(x).trim()).filter(Boolean);
    } catch {
      /* fall through */
    }
  }
  return s.split(",").map((x) => x.replace(/[[\]"'\\]/g, "").trim()).filter(Boolean);
}

/** The park types the hub's dropdown offers; anything else in the URL is ignored. */
export const VALID_PARK_TYPES = new Set([
  "NATIONAL_PARK", "GAME_RESERVE", "MARINE_PARK", "CONSERVATION_AREA",
  "WILDLIFE_RESERVE", "FOREST_RESERVE", "NATURE_RESERVE",
]);

/** The most-used tags across a catalogue, most frequent first. */
export function topTags(rows: Array<{ tags?: string }>, limit = 6): string[] {
  const freq: Record<string, number> = {};
  for (const r of rows) for (const tg of parseTags(r.tags)) freq[tg] = (freq[tg] || 0) + 1;
  return Object.keys(freq).sort((a, b) => freq[b] - freq[a]).slice(0, limit);
}

/**
 * The order the accommodation dropdowns list their options in, and what the URL may say.
 *
 * Here rather than in the hub component because the SERVER half validates `?type=` and
 * `?category=` now, and a value the two halves disagreed about would be accepted by one and
 * dropped by the other.
 */
export const TYPE_ORDER = [
  "LODGE", "TENTED_CAMP", "MOBILE_CAMP", "RESORT", "HOTEL", "BOUTIQUE_HOTEL", "ECO_LODGE",
  "VILLA", "COTTAGE", "GUESTHOUSE", "CAMPSITE", "BANDA", "TREE_HOUSE", "APARTMENT", "HOSTEL", "OTHER",
];

export const CAT_ORDER = [
  "ULTRA_LUXURY", "LUXURY", "PREMIUM", "MID_RANGE", "BUDGET", "BACKPACKER",
];

export const VALID_STAY_TYPES = new Set(TYPE_ORDER);
export const VALID_STAY_CATS = new Set(CAT_ORDER);

/**
 * Server-side API fetch utilities for generateMetadata() and sitemap generation.
 * These use native fetch (no axios) so they work in server components.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4450/api";

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

/**
 * Fetch a single entity from the public API (server-side).
 */
/**
 * How long a page may keep showing something after the office changed it.
 *
 * An hour is fine for a park description. It is not fine for anything that answers "is this trip
 * for sale", because unpublishing a trip is a decision that should take effect while somebody is
 * still watching - an hour of a withdrawn trip still being quotable is an hour too long.
 */
const DEFAULT_REVALIDATE = 3600;
export const SALEABILITY_REVALIDATE = 300;

/**
 * The labels a cached answer wears, so the office can throw it away before its timer expires.
 *
 * Every answer also wears "site", which is how one call empties the whole shelf. The names are
 * shared by agreement with the API (WebsiteCacheTags there, KNOWN_TAGS in the revalidate route
 * here) - a name that exists in only one of the three does nothing at all.
 *
 * They are collections, not records. A tag per record would be more precise and does not work:
 * the API's ids are obfuscated and the obfuscation changes on every restart, so a per-record tag
 * would stop matching after a deploy and fail silently, which is the one failure mode a cache
 * must not have. Clearing all twenty park pages because one park changed is cheap and honest.
 */
export const CACHE_TAGS = {
  all: "site",
  safaris: "safaris",
  parks: "parks",
  accommodations: "accommodations",
  activities: "activities",
  testimonies: "testimonies",
  heroes: "heroes",
  blog: "blog",
  faqs: "faqs",
} as const;

async function serverFetch<T>(
  path: string,
  locale = "en",
  revalidate: number = DEFAULT_REVALIDATE,
  tags: string[] = [],
): Promise<T | null> {
  try {
    /*
     * The locale MUST be in the URL, not only in the Accept-Language header.
     *
     * Next.js keys its Data Cache on the request URL (plus method and body) and ignores request
     * headers. With the locale living only in Accept-Language, all 10 locales collided on a single
     * cache entry per path: whichever language warmed the cache first was then served to every
     * other locale - the English page rendered German, the French page rendered German, and so on.
     * The `hl` query param gives each locale its own cache key. The backend resolves translations
     * from Accept-Language and ignores unknown query params, so `hl` is purely a cache discriminator.
     */
    const sep = path.includes("?") ? "&" : "?";
    const res = await fetch(`${API_BASE_URL}${path}${sep}hl=${encodeURIComponent(locale)}`, {
      headers: { "Accept-Language": locale },
      // "site" on everything: one label the office can pull to empty the lot.
      next: { revalidate, tags: [CACHE_TAGS.all, ...tags] },
    });
    if (!res.ok) return null;
    const json: ApiResponse<T> = await res.json();
    return json.success ? json.data : null;
  } catch {
    return null;
  }
}

// Safari/Itinerary
interface SafariDayMeta {
  dayNumber?: number;
  title?: string;
  description?: string;
  startLocation?: string;
  endLocation?: string;
}
interface SafariMeta {
  id: string;
  name: string;
  code?: string;
  description?: string;
  primaryImageUrl?: string;
  totalDays?: number;
  totalNights?: number;
  startLocation?: string;
  endLocation?: string;
  days?: SafariDayMeta[];
  // Public API returns an array of cost summaries (rack figures); JSON-LD reads [0].
  costSummary?: Array<{ grandTotalRack?: number; currency?: string }>;
}

export async function fetchSafariMeta(id: string, locale = "en"): Promise<SafariMeta | null> {
  return serverFetch<SafariMeta>(`/public/safaris/${id}`, locale, SALEABILITY_REVALIDATE, [CACHE_TAGS.safaris]);
}

// Park
interface ParkMeta {
  id: string;
  name: string;
  slug?: string;
  shortDescription?: string;
  fullDescription?: string;
  primaryImageUrl?: string;
  region?: string;
  latitude?: number;
  longitude?: number;
  openingHours?: string;
  bestTimeToVisit?: string;
  wildlife?: string;
}

export async function fetchParkMeta(id: string, locale = "en"): Promise<ParkMeta | null> {
  // The single-park endpoint wraps the entity as { park, images, totalImages }.
  const data = await serverFetch<{ park?: ParkMeta } & ParkMeta>(`/public/parks/${id}`, locale, DEFAULT_REVALIDATE, [CACHE_TAGS.parks]);
  return data ? (data.park ?? data) : null;
}

// Accommodation
interface AccommodationMeta {
  id: string;
  name: string;
  slug?: string;
  shortDescription?: string;
  details?: string;
  primaryImageUrl?: string;
  region?: string;
  district?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  starRating?: number;
  categoryApproximateStars?: number;
  categoryDisplayName?: string;
  priceRange?: string;
  accommodationType?: string;
  amenities?: string;
  website?: string;
  maxGuests?: number;
}

export async function fetchAccommodationMeta(id: string, locale = "en"): Promise<AccommodationMeta | null> {
  // The single-accommodation endpoint wraps the entity as { accommodation, images, totalImages }.
  const data = await serverFetch<{ accommodation?: AccommodationMeta } & AccommodationMeta>(
    `/public/accommodations/${id}`,
    locale,
    DEFAULT_REVALIDATE,
    [CACHE_TAGS.accommodations],
  );
  return data ? (data.accommodation ?? data) : null;
}

// Activity
interface ActivityMeta {
  id: string;
  name: string;
  slug?: string;
  description?: string;
  detailedDescription?: string;
  primaryImageUrl?: string;
}

export async function fetchActivityMeta(id: string, locale = "en"): Promise<ActivityMeta | null> {
  // The single-activity endpoint wraps the entity as { activity, images, totalImages }.
  const data = await serverFetch<{ activity?: ActivityMeta } & ActivityMeta>(`/public/activities/${id}`, locale, DEFAULT_REVALIDATE, [CACHE_TAGS.activities]);
  return data ? (data.activity ?? data) : null;
}

// === Full detail payloads (for server-rendering the detail page bodies) ======
// These return the raw wrapper the public API sends so the server page can seed
// the client component's initial state (content lands in the SSR HTML for SEO/GEO).
export type DetailPayload = Record<string, unknown> | null;

export async function fetchParkDetail(id: string, locale = "en"): Promise<DetailPayload> {
  return serverFetch<Record<string, unknown>>(`/public/parks/${id}`, locale, DEFAULT_REVALIDATE, [CACHE_TAGS.parks]);
}
export async function fetchAccommodationDetail(id: string, locale = "en"): Promise<DetailPayload> {
  return serverFetch<Record<string, unknown>>(`/public/accommodations/${id}`, locale, DEFAULT_REVALIDATE, [CACHE_TAGS.accommodations]);
}
export async function fetchActivityDetail(id: string, locale = "en"): Promise<DetailPayload> {
  return serverFetch<Record<string, unknown>>(`/public/activities/${id}`, locale, DEFAULT_REVALIDATE, [CACHE_TAGS.activities]);
}
export async function fetchSafariDetail(code: string, locale = "en"): Promise<DetailPayload> {
  /* Five minutes, not an hour: this page is what says a trip is for sale. */
  return serverFetch<Record<string, unknown>>(
    `/public/safaris/${code}`, locale, SALEABILITY_REVALIDATE, [CACHE_TAGS.safaris]);
}

// Testimony rating summary (for AggregateRating schema).
// Returns null until the backend /public/testimonies/summary endpoint is deployed,
// so schema simply omits ratings rather than breaking.
export interface TestimonySummary {
  ratingValue: number;
  reviewCount: number;
  bestRating: number;
  worstRating: number;
}

export interface TestimonyReview {
  authorName: string;
  authorCountry?: string;
  rating?: number;
  message?: string;
  reviewDate?: string;
}

/** Featured approved testimonies (for Review JSON-LD on the reviews page). */
export async function fetchFeaturedTestimonies(locale = "en"): Promise<TestimonyReview[]> {
  const data = await serverFetch<TestimonyReview[]>(`/public/testimonies/featured`, locale, DEFAULT_REVALIDATE, [CACHE_TAGS.testimonies]);
  return Array.isArray(data) ? data.filter((t) => t.authorName && t.rating) : [];
}

export async function fetchTestimonySummary(): Promise<TestimonySummary | null> {
  const data = await serverFetch<{
    averageRating?: number;
    reviewCount?: number;
    bestRating?: number;
    worstRating?: number;
  }>(`/public/testimonies/summary`, "en", DEFAULT_REVALIDATE, [CACHE_TAGS.testimonies]);
  if (!data || !data.averageRating || !data.reviewCount) return null;
  return {
    ratingValue: data.averageRating,
    reviewCount: data.reviewCount,
    bestRating: data.bestRating ?? 5,
    worstRating: data.worstRating ?? 1,
  };
}

// Sitemap: fetch all published entity IDs
interface SitemapItem { slug?: string; code?: string }

interface PaginatedResponse<T> {
  [key: string]: T[] | number;
  currentPage: number;
  totalPages: number;
  totalItems: number;
}

async function fetchAllIds(endpoint: string, itemsKey: string, tag: string): Promise<SitemapItem[]> {
  const items: SitemapItem[] = [];
  try {
    // Fetch first page to get total
    const res = await fetch(`${API_BASE_URL}${endpoint}?page=0&size=100`, {
      next: { revalidate: 3600, tags: [CACHE_TAGS.all, tag] },
    });
    if (!res.ok) return items;
    const json: ApiResponse<PaginatedResponse<SitemapItem>> = await res.json();
    if (!json.success) return items;
    const data = json.data;
    const pageItems = (data[itemsKey] as SitemapItem[]) || [];
    items.push(...pageItems);

    // Fetch remaining pages if any
    const totalPages = data.totalPages as number;
    for (let page = 1; page < totalPages; page++) {
      const pageRes = await fetch(`${API_BASE_URL}${endpoint}?page=${page}&size=100`, {
        next: { revalidate: 3600, tags: [CACHE_TAGS.all, tag] },
      });
      if (!pageRes.ok) break;
      const pageJson: ApiResponse<PaginatedResponse<SitemapItem>> = await pageRes.json();
      if (pageJson.success) {
        const moreItems = (pageJson.data[itemsKey] as SitemapItem[]) || [];
        items.push(...moreItems);
      }
    }
  } catch {
    // Silently fail - sitemap will just have static pages
  }
  return items;
}

export async function fetchAllSafariIds(): Promise<SitemapItem[]> {
  return fetchAllIds("/public/safaris", "safaris", CACHE_TAGS.safaris);
}

export async function fetchAllParkIds(): Promise<SitemapItem[]> {
  return fetchAllIds("/public/parks", "parks", CACHE_TAGS.parks);
}

export async function fetchAllAccommodationIds(): Promise<SitemapItem[]> {
  return fetchAllIds("/public/accommodations", "accommodations", CACHE_TAGS.accommodations);
}

export async function fetchAllActivityIds(): Promise<SitemapItem[]> {
  return fetchAllIds("/public/activities", "activities", CACHE_TAGS.activities);
}

/**
 * A legal notice, written once in the panel and read by both sites.
 *
 * The privacy policy used to be markup in this repo, which meant two copies of one text in two
 * near-identical repositories and a deploy to change a sentence. It also meant the page could
 * say things that stopped being true elsewhere: it promised no cookies and no automatic
 * collection, which the client portal's session makes false the day it ships.
 *
 * `html` comes back already rendered and escaped by the API, from a small plain-text markup.
 * Nothing here parses it, and nothing here may be given markup a person typed.
 */
export interface LegalNotice {
  type: string;
  slug: string;
  title: string;
  version: string;
  effectiveFrom: string;
  html: string;
}

export async function fetchLegalNotice(slug: string, locale = "en"): Promise<LegalNotice | null> {
  /*
   * A short window, not the hour the rest of the site uses. A privacy notice is republished
   * precisely when something about it has changed and somebody needs the new text to be the one
   * people read.
   */
  return serverFetch<LegalNotice>(`/public/legal/${slug}`, locale, 300, []);
}

// === The whole catalogue, for /llms-full.txt ================================
/*
 * One request instead of 194.
 *
 * The list endpoints omit the prose on purpose - a park list carries no fullDescription or
 * wildlife, a lodge list no details or priceRange, a safari list no days - so a corpus built
 * from them needs a detail request per record. The API answers all of it at
 * /public/llms-corpus, always in English, because the llms.txt convention is a single file and
 * translating 300 KB on demand would be a provider call per deploy.
 *
 * Tagged with every collection label, so an edit anywhere in the panel throws this away.
 */

export interface CorpusPark {
  slug?: string;
  name?: string;
  parkType?: string;
  region?: string;
  district?: string;
  location?: string;
  elevation?: string;
  size?: string;
  shortDescription?: string;
  fullDescription?: string;
  history?: string;
  ecosystem?: string;
  wildlife?: string;
  vegetation?: string;
  bestTimeToVisit?: string;
  openingHours?: string;
  accessInformation?: string;
  tags?: string;
}

export interface CorpusParkFee {
  parkSlug?: string;
  parkName?: string;
  tariff?: string;
  chargingBasis?: string;
  nationCategory?: string;
  ageCategory?: string;
  season?: string;
  amount?: number;
  currency?: string;
}

export interface CorpusAccommodation {
  slug?: string;
  name?: string;
  accommodationType?: string;
  accommodationTypeDisplayName?: string;
  category?: string;
  categoryDisplayName?: string;
  categoryApproximateStars?: number;
  starRating?: number;
  region?: string;
  district?: string;
  location?: string;
  address?: string;
  elevation?: string;
  totalRooms?: number;
  maxGuests?: number;
  shortDescription?: string;
  details?: string;
  amenities?: string;
  services?: string;
  nearbyAttractions?: string;
  childPolicy?: string;
  priceRange?: string;
  currency?: string;
  bestSeason?: string;
  operatingSeason?: string;
  roomTypeCount?: number;
  tags?: string;
  website?: string;
}

export interface CorpusActivity {
  slug?: string;
  name?: string;
  description?: string;
  detailedDescription?: string;
  minimumAge?: number;
  maximumParticipants?: number;
  equipmentRequired?: string;
  seasonAvailability?: string;
  safetyInformation?: string;
  tags?: string;
}

export interface CorpusSafariDay {
  dayNumber?: number;
  title?: string;
  description?: string;
  morningActivities?: string;
  afternoonActivities?: string;
  eveningActivities?: string;
  wildlifeHighlights?: string;
  scenicHighlights?: string;
  specialNotes?: string;
  startLocation?: string;
  endLocation?: string;
  mealsIncluded?: string;
  isOvernight?: boolean;
  parks?: Array<{ parkName?: string; parkSlug?: string }>;
  activities?: Array<{ activityName?: string; isOptional?: boolean }>;
  accommodations?: Array<{
    accommodationName?: string;
    accommodationSlug?: string;
    board?: string;
    roomType?: string;
    nights?: number;
    isAlternative?: boolean;
  }>;
}

export interface CorpusSafari {
  code?: string;
  name?: string;
  tripType?: string;
  tripTypeDisplayName?: string;
  budgetCategory?: string;
  budgetCategoryDisplayName?: string;
  totalDays?: number;
  totalNights?: number;
  description?: string;
  highlights?: string;
  startLocation?: string;
  endLocation?: string;
  inclusions?: string[];
  exclusions?: string[];
  /** How many travellers the costSummary totals below are for. */
  totalPaxCount?: number;
  paxBreakdown?: Array<{ nationCategoryName?: string; ageCategoryName?: string; count?: number }>;
  /*
   * One row per currency. There is no exchange rate anywhere in this system, by decision, so
   * rows are never summed or merged - a trip can price an East African in TZS beside a
   * non-resident in USD, and adding those together once tripled a quote.
   */
  costSummary?: Array<{
    currency?: string;
    grandTotalRack?: number;
    accommodationRack?: number;
    parkFeesRack?: number;
    activitiesRack?: number;
  }>;
  days?: CorpusSafariDay[];
}

export interface CorpusArticle {
  slug?: string;
  title?: string;
  excerpt?: string;
  date?: string;
  author?: string;
  readMinutes?: number;
  tags?: string[];
  body?: Array<{ type?: string; text?: string; items?: string[]; caption?: string }>;
  faqs?: Array<{ question?: string; answer?: string; q?: string; a?: string }>;
}

export interface Corpus {
  generatedAt?: string;
  language?: string;
  parks?: CorpusPark[];
  parkFees?: CorpusParkFee[];
  accommodations?: CorpusAccommodation[];
  activities?: CorpusActivity[];
  safaris?: CorpusSafari[];
  articles?: CorpusArticle[];
}

export async function fetchCorpus(): Promise<Corpus | null> {
  return serverFetch<Corpus>("/public/llms-corpus", "en", DEFAULT_REVALIDATE, [
    CACHE_TAGS.parks,
    CACHE_TAGS.accommodations,
    CACHE_TAGS.activities,
    CACHE_TAGS.safaris,
    CACHE_TAGS.blog,
  ]);
}

// === Hub catalogues, server-side ===========================================
/*
 * What a hub page renders on the server for its first paint.
 *
 * fetchAllIds below already RECEIVES names, regions and short descriptions and throws them away
 * at the type level, because a sitemap only wants slugs. It also calls fetch directly with no
 * `hl`, which is right for a sitemap (a slug is the same in every language) and wrong for
 * anything that renders a name. So these are separate rather than a widening of it: the sitemap
 * depends on its narrow shape and its locale-free cache key.
 */

export interface CatalogueItem {
  slug?: string;
  code?: string;
  name?: string;
  region?: string;
  district?: string;
  shortDescription?: string;
  description?: string;
  primaryImageUrl?: string;
  tags?: string;
  safariCount?: number;
  parkType?: string;
  accommodationType?: string;
  accommodationTypeDisplayName?: string;
  category?: string;
  categoryDisplayName?: string;
  categoryApproximateStars?: number;
  priceRange?: string;
  seasonAvailability?: string;
  starRating?: number;
}

export interface Catalogue {
  items: CatalogueItem[];
  totalItems: number;
}

/** Above this, a hub stops listing and the index truncates. Revisit if the catalogue grows. */
const CATALOGUE_CAP = 200;

/** The only fields a hub card or the catalogue index reads. See the projection below. */
const CATALOGUE_FIELDS = [
  "slug", "code", "name", "region", "district", "shortDescription", "description",
  "primaryImageUrl", "tags", "safariCount", "parkType", "accommodationType",
  "accommodationTypeDisplayName", "category", "categoryDisplayName",
  "categoryApproximateStars", "priceRange", "seasonAvailability", "starRating",
] as const;

/*
 * A free-text search gets its own short-lived cache entry.
 *
 * Every distinct ?q= is a distinct URL and therefore a distinct Data Cache key, so a crawler
 * walking random query strings would otherwise fill the cache with hour-long entries nobody
 * reads again.
 */
const KEYWORD_REVALIDATE = 60;

async function fetchCatalogue(
  endpoint: string,
  itemsKey: string,
  tag: string,
  locale: string,
  params: Record<string, string | number | string[] | undefined> = {},
): Promise<Catalogue> {
  const qs = new URLSearchParams();
  let keyworded = false;
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === "") continue;
    if (Array.isArray(value)) {
      for (const v of value) if (v) qs.append(key, v);
    } else {
      qs.append(key, String(value));
    }
    if (key === "keyword") keyworded = true;
  }
  if (!qs.has("size")) qs.set("size", String(CATALOGUE_CAP));
  if (!qs.has("page")) qs.set("page", "0");

  const data = await serverFetch<Record<string, unknown>>(
    `${endpoint}?${qs.toString()}`,
    locale,
    keyworded ? KEYWORD_REVALIDATE : DEFAULT_REVALIDATE,
    [tag],
  );
  if (!data) return { items: [], totalItems: 0 };

  const raw = Array.isArray(data[itemsKey]) ? (data[itemsKey] as Record<string, unknown>[]) : [];
  /*
   * Projected at RUNTIME, not just in the type.
   *
   * Everything here is handed to a client component, which means it is serialised into the RSC
   * payload as well as rendered into the HTML - twice, for up to 200 records. A TypeScript
   * interface narrows nothing at runtime, so without this the whole list DTO travelled, fields
   * no card reads included.
   */
  const items: CatalogueItem[] = raw.map((r) => {
    const out: Record<string, unknown> = {};
    for (const key of CATALOGUE_FIELDS) if (r[key] !== undefined && r[key] !== null) out[key] = r[key];
    return out as CatalogueItem;
  });
  const totalItems = typeof data.totalItems === "number" ? data.totalItems : items.length;
  return { items, totalItems };
}

export async function fetchParksCatalogue(
  locale = "en",
  params: Record<string, string | number | string[] | undefined> = {},
): Promise<Catalogue> {
  return fetchCatalogue("/public/parks", "parks", CACHE_TAGS.parks, locale, params);
}

export async function fetchAccommodationsCatalogue(
  locale = "en",
  params: Record<string, string | number | string[] | undefined> = {},
): Promise<Catalogue> {
  return fetchCatalogue("/public/accommodations", "accommodations", CACHE_TAGS.accommodations, locale, params);
}

export async function fetchActivitiesCatalogue(
  locale = "en",
  params: Record<string, string | number | string[] | undefined> = {},
): Promise<Catalogue> {
  return fetchCatalogue("/public/activities", "activities", CACHE_TAGS.activities, locale, params);
}

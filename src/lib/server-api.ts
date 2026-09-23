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
 * still watching — an hour of a withdrawn trip still being quotable is an hour too long.
 */
const DEFAULT_REVALIDATE = 3600;
export const SALEABILITY_REVALIDATE = 300;

/**
 * The labels a cached answer wears, so the office can throw it away before its timer expires.
 *
 * Every answer also wears "site", which is how one call empties the whole shelf. The names are
 * shared by agreement with the API (WebsiteCacheTags there, KNOWN_TAGS in the revalidate route
 * here) — a name that exists in only one of the three does nothing at all.
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
  brand: "brand",
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
     * other locale — the English page rendered German, the French page rendered German, and so on.
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

// ─── Full detail payloads (for server-rendering the detail page bodies) ──────
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

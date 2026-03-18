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
async function serverFetch<T>(path: string, locale = "en"): Promise<T | null> {
  try {
    const res = await fetch(`${API_BASE_URL}${path}`, {
      headers: { "Accept-Language": locale },
      next: { revalidate: 3600 }, // Cache for 1 hour
    });
    if (!res.ok) return null;
    const json: ApiResponse<T> = await res.json();
    return json.success ? json.data : null;
  } catch {
    return null;
  }
}

// Safari/Itinerary
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
  costSummary?: { totalRackPriceUSD?: number };
}

export async function fetchSafariMeta(id: string, locale = "en"): Promise<SafariMeta | null> {
  return serverFetch<SafariMeta>(`/public/safaris/${id}`, locale);
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
}

export async function fetchParkMeta(id: string, locale = "en"): Promise<ParkMeta | null> {
  return serverFetch<ParkMeta>(`/public/parks/${id}`, locale);
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
  latitude?: number;
  longitude?: number;
  starRating?: number;
  categoryApproximateStars?: number;
  categoryDisplayName?: string;
  priceRange?: string;
}

export async function fetchAccommodationMeta(id: string, locale = "en"): Promise<AccommodationMeta | null> {
  return serverFetch<AccommodationMeta>(`/public/accommodations/${id}`, locale);
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
  return serverFetch<ActivityMeta>(`/public/activities/${id}`, locale);
}

// Sitemap: fetch all published entity IDs
interface SitemapItem { id: string; slug?: string; code?: string }

interface PaginatedResponse<T> {
  [key: string]: T[] | number;
  currentPage: number;
  totalPages: number;
  totalItems: number;
}

async function fetchAllIds(endpoint: string, itemsKey: string): Promise<SitemapItem[]> {
  const items: SitemapItem[] = [];
  try {
    // Fetch first page to get total
    const res = await fetch(`${API_BASE_URL}${endpoint}?page=0&size=100`, {
      next: { revalidate: 3600 },
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
        next: { revalidate: 3600 },
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
  return fetchAllIds("/public/safaris", "safaris");
}

export async function fetchAllParkIds(): Promise<SitemapItem[]> {
  return fetchAllIds("/public/parks", "parks");
}

export async function fetchAllAccommodationIds(): Promise<SitemapItem[]> {
  return fetchAllIds("/public/accommodations", "accommodations");
}

export async function fetchAllActivityIds(): Promise<SitemapItem[]> {
  return fetchAllIds("/public/activities", "activities");
}

// API-backed FAQ content (ISR). The management panel is the source of truth;
// this reads the public backend at /api/public/faqs and caches for ~10 minutes.
// Server-only: imported by the FAQ page (server) and its layout (JSON-LD).

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4450/api";
const REVALIDATE = 600; // 10 minutes

export interface FaqItem {
  q: string;
  a: string;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

/** Active global FAQs, ordered. Empty array on API failure. */
export async function getFaqs(locale = "en"): Promise<FaqItem[]> {
  try {
    // Locale must be in the URL: Next.js keys its Data Cache on the URL and ignores headers, so
    // header-only locale made all 10 locales share one cache entry. `hl` is a per-locale cache
    // discriminator; the backend translates off Accept-Language and ignores unknown query params.
    const res = await fetch(`${API_BASE_URL}/public/faqs?hl=${encodeURIComponent(locale)}`, {
      headers: { "Accept-Language": locale },
      next: { revalidate: REVALIDATE },
    });
    if (!res.ok) return [];
    const json: ApiResponse<FaqItem[]> = await res.json();
    return json.success ? json.data ?? [] : [];
  } catch {
    return [];
  }
}

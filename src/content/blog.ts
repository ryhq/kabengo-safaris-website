// API-backed blog content (ISR). The management panel is the source of truth;
// this reads the public backend at /api/public/blogs and caches for ~10 minutes
// (revalidate 600), so edits go near-live while staying resilient to blips.
// Server-only: imported by server components, the sitemap and /llms.txt.

import { CACHE_TAGS } from "@/lib/server-api";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4450/api";
const REVALIDATE = 600; // 10 minutes

export type Block =
  | { type: "p"; text: string }
  | { type: "h2"; text: string }
  | { type: "h3"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "image"; url: string; alt?: string; caption?: string };

export interface BlogImage {
  url: string;
  alt?: string;
  caption?: string;
}

export interface BlogPostMeta {
  slug: string;
  title: string;
  excerpt: string;
  date: string; // ISO (YYYY-MM-DD)
  author: string;
  readMinutes: number;
  tags: string[];
  coverImageUrl?: string;
}

export interface BlogPost extends BlogPostMeta {
  body: Block[];
  faqs: { q: string; a: string }[];
  images?: BlogImage[];
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

async function api<T>(path: string, locale = "en"): Promise<T | null> {
  try {
    // Locale must be in the URL: Next.js keys its Data Cache on the URL and ignores headers, so
    // header-only locale made all 10 locales share one cache entry (English pages served German,
    // etc.). `hl` is a per-locale cache discriminator; the backend translates off Accept-Language.
    const sep = path.includes("?") ? "&" : "?";
    const res = await fetch(`${API_BASE_URL}${path}${sep}hl=${encodeURIComponent(locale)}`, {
      headers: { "Accept-Language": locale },
      next: { revalidate: REVALIDATE, tags: [CACHE_TAGS.all, CACHE_TAGS.blog] },
    });
    if (!res.ok) return null;
    const json: ApiResponse<T> = await res.json();
    return json.success ? json.data : null;
  } catch {
    return null;
  }
}

/** All published posts (index/meta only — no body). Empty array on API failure. */
export async function getAllPosts(locale = "en"): Promise<BlogPostMeta[]> {
  const data = await api<{ blogs: BlogPostMeta[] }>("/public/blogs?page=0&size=100", locale);
  return data?.blogs ?? [];
}

/** A single post by slug (full body + FAQs + images), or null if not found. */
export async function getPost(slug: string, locale = "en"): Promise<BlogPost | null> {
  const data = await api<BlogPost>(`/public/blogs/${encodeURIComponent(slug)}`, locale);
  if (!data) return null;
  return { ...data, body: data.body ?? [], faqs: data.faqs ?? [], tags: data.tags ?? [] };
}

// Deterministic gradient cover for posts that have no uploaded image.
const GRADS = [
  "linear-gradient(150deg,#5a7a3a,#274e22)",
  "linear-gradient(150deg,#8a6a2a,#5a3410)",
  "linear-gradient(150deg,#c9962f,#7a2f14)",
  "linear-gradient(150deg,#3a8a7a,#134a42)",
];
export function coverGrad(slug: string): string {
  let h = 0;
  for (let i = 0; i < slug.length; i++) h = (h * 31 + slug.charCodeAt(i)) >>> 0;
  return GRADS[h % GRADS.length];
}

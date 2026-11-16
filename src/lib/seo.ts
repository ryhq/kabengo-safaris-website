import { routing } from "@/i18n/routing";

const BASE_URL = "https://kabengosafaris.com";

/**
 * Generate hreflang alternate links for a given locale and path.
 * Used in generateMetadata() across all page layouts.
 */
export function buildAlternates(locale: string, path: string = "") {
  const languages: Record<string, string> = {};
  for (const loc of routing.locales) {
    languages[loc] = `${BASE_URL}/${loc}${path}`;
  }
  languages["x-default"] = `${BASE_URL}/en${path}`;

  return {
    canonical: `${BASE_URL}/${locale}${path}`,
    languages,
  };
}

/** Map an app locale to an Open Graph locale (e.g. "fr" to "fr_FR"). */
const OG_LOCALE: Record<string, string> = {
  en: "en_US",
  sw: "sw_TZ",
  fr: "fr_FR",
  de: "de_DE",
  es: "es_ES",
  it: "it_IT",
  pt: "pt_PT",
  af: "af_ZA",
  uk: "uk_UA",
};

export function ogLocale(locale: string): string {
  return OG_LOCALE[locale] ?? "en_US";
}

/**
 * The picture a link shows when somebody shares it.
 *
 * Every page needs one. Without it WhatsApp, Slack, Facebook and iMessage render a bare card
 * with the domain repeated three times and nothing to look at - which is what sharing
 * kabengosafaris.com did until this existed, while a safari page three clicks deeper looked
 * fine, because the detail pages set an image from the API and the homepage set none.
 *
 * Kept as a static file rather than generated. A crawler fetches it once, with no session and
 * no patience: it must not depend on the API being up, and it must not be the first thing to
 * time out when the API is slow.
 *
 * 1200x630 is the size every platform crops from. Under 300 KB because WhatsApp quietly
 * declines to show a preview for images much past that, with no error anywhere.
 */
export const DEFAULT_OG_IMAGE = `${BASE_URL}/images/og-default.jpg`;

const SITE_NAME = "Kabengo Safaris";

type OgInput = {
  title: string;
  description: string;
  url: string;
  locale?: string;
  /** A page's own picture - a safari's photograph, a lodge, a blog header. */
  image?: string | null;
  imageAlt?: string;
};

/**
 * Build the Open Graph block for a page.
 *
 * Use this rather than writing `openGraph: {...}` by hand. Next.js merges metadata SHALLOWLY:
 * the moment a page defines its own `openGraph`, the parent layout's is replaced outright, not
 * merged into. That is not obvious, and it had already cost us `og:type` and `og:site_name` on
 * every page that set a title - they were declared once in the root layout and silently
 * dropped everywhere below it. A helper is the only way the defaults actually survive.
 */
export function buildOpenGraph({ title, description, url, locale, image, imageAlt }: OgInput) {
  const picture = image || DEFAULT_OG_IMAGE;
  return {
    type: "website" as const,
    siteName: SITE_NAME,
    title,
    description,
    url,
    ...(locale ? { locale: ogLocale(locale) } : {}),
    images: [{ url: picture, width: 1200, height: 630, alt: imageAlt || title }],
  };
}

/** The same card for Twitter/X, which reads its own tags and ignores Open Graph. */
export function buildTwitter({ title, description, image, imageAlt }: Omit<OgInput, "url">) {
  return {
    card: "summary_large_image" as const,
    title,
    description,
    images: [image || DEFAULT_OG_IMAGE],
    ...(imageAlt ? { imageAlt } : {}),
  };
}

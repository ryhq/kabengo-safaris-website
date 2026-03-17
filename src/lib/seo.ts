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

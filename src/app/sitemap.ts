import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";
import {
  fetchAllSafariIds,
  fetchAllParkIds,
  fetchAllAccommodationIds,
  fetchAllActivityIds,
} from "@/lib/server-api";

const BASE_URL = "https://kabengosafaris.com";

function buildAlternates(locales: readonly string[], path: string) {
  const languages: Record<string, string> = {};
  for (const alt of locales) {
    languages[alt] = `${BASE_URL}/${alt}${path}`;
  }
  languages["x-default"] = `${BASE_URL}/en${path}`;
  return { languages };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const locales = routing.locales;

  const staticPages = [
    "",
    "/about",
    "/safaris",
    "/parks",
    "/accommodations",
    "/activities",
    "/reviews",
    "/contact",
    "/book",
    "/faq",
    "/gallery",
  ];

  const entries: MetadataRoute.Sitemap = [];

  // Static pages
  for (const locale of locales) {
    for (const page of staticPages) {
      entries.push({
        url: `${BASE_URL}/${locale}${page}`,
        lastModified: new Date(),
        changeFrequency: page === "" ? "weekly" : "monthly",
        priority: page === "" ? 1.0 : 0.8,
        alternates: buildAlternates(locales, page),
      });
    }
  }

  // Dynamic pages — fetch all entity IDs from the API
  const [safaris, parks, accommodations, activities] = await Promise.all([
    fetchAllSafariIds(),
    fetchAllParkIds(),
    fetchAllAccommodationIds(),
    fetchAllActivityIds(),
  ]);

  // Safari detail pages
  for (const safari of safaris) {
    const identifier = safari.code || safari.id;
    const path = `/safaris/${identifier}`;
    for (const locale of locales) {
      entries.push({
        url: `${BASE_URL}/${locale}${path}`,
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: 0.9,
        alternates: buildAlternates(locales, path),
      });
    }
  }

  // Park detail pages
  for (const park of parks) {
    const identifier = park.slug || park.id;
    const path = `/parks/${identifier}`;
    for (const locale of locales) {
      entries.push({
        url: `${BASE_URL}/${locale}${path}`,
        lastModified: new Date(),
        changeFrequency: "monthly",
        priority: 0.7,
        alternates: buildAlternates(locales, path),
      });
    }
  }

  // Accommodation detail pages
  for (const acc of accommodations) {
    const identifier = acc.slug || acc.id;
    const path = `/accommodations/${identifier}`;
    for (const locale of locales) {
      entries.push({
        url: `${BASE_URL}/${locale}${path}`,
        lastModified: new Date(),
        changeFrequency: "monthly",
        priority: 0.7,
        alternates: buildAlternates(locales, path),
      });
    }
  }

  // Activity detail pages
  for (const activity of activities) {
    const identifier = activity.slug || activity.id;
    const path = `/activities/${identifier}`;
    for (const locale of locales) {
      entries.push({
        url: `${BASE_URL}/${locale}${path}`,
        lastModified: new Date(),
        changeFrequency: "monthly",
        priority: 0.7,
        alternates: buildAlternates(locales, path),
      });
    }
  }

  return entries;
}

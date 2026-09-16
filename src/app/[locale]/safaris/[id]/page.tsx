import { notFound } from "next/navigation";
import { fetchSafariDetail } from "@/lib/server-api";
import SafariDetailClient, { type Itin } from "./SafariDetailClient";

// Server component: fetch the itinerary so its content is in the SSR HTML (SEO/GEO).
export default async function SafariDetailPage({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params;
  const data = await fetchSafariDetail(id, locale);
  const itin = (data?.itinerary ?? data ?? null) as Itin | null;

  /*
   * No trip, no page.
   *
   * This used to render the client shell with null and answer 200, which meant a code the API
   * refuses — an unpublished trip, a deleted one, a typo — still looked like a real address to a
   * browser and to Google. Three DRAFT itineraries were reachable that way: the API had started
   * refusing them and this page went on serving them from its cache and from its own willingness
   * to render nothing at all.
   *
   * notFound() is what makes a withdrawn trip actually withdrawn.
   */
  if (!itin) notFound();

  return <SafariDetailClient initialItin={itin} />;
}

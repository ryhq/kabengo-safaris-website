import { fetchSafariDetail } from "@/lib/server-api";
import SafariDetailClient, { type Itin } from "./SafariDetailClient";

// Server component: fetch the itinerary so its content is in the SSR HTML (SEO/GEO).
export default async function SafariDetailPage({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params;
  const data = await fetchSafariDetail(id, locale);
  const itin = (data?.itinerary ?? data ?? null) as Itin | null;
  return <SafariDetailClient initialItin={itin} />;
}

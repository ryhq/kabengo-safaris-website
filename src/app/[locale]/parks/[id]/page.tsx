import { fetchParkDetail } from "@/lib/server-api";
import ParkDetailClient, { type ParkDetail, type ParkImage } from "./ParkDetailClient";

// Server component: fetch the park so its content is in the SSR HTML (SEO/GEO),
// then hand it to the interactive client component as initial state.
export default async function ParkDetailPage({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params;
  const data = await fetchParkDetail(id, locale);
  const park = (data?.park ?? data ?? null) as ParkDetail | null;
  const images = Array.isArray(data?.images) ? (data.images as ParkImage[]) : [];
  return <ParkDetailClient initialPark={park} initialImages={images} />;
}

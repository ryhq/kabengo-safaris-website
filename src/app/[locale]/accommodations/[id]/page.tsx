import { fetchAccommodationDetail } from "@/lib/server-api";
import AccommodationDetailClient, { type AccommodationDetail, type AccImage } from "./AccommodationDetailClient";

// Server component: fetch the lodge so its content is in the SSR HTML (SEO/GEO).
export default async function AccommodationDetailPage({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params;
  const data = await fetchAccommodationDetail(id, locale);
  const acc = (data?.accommodation ?? data ?? null) as AccommodationDetail | null;
  const images = Array.isArray(data?.images) ? (data.images as AccImage[]) : [];
  const totalImages = typeof data?.totalImages === "number" ? (data.totalImages as number) : images.length;
  return <AccommodationDetailClient initialAcc={acc} initialImages={images} initialTotalImages={totalImages} />;
}

import { fetchActivityDetail } from "@/lib/server-api";
import ActivityDetailClient, { type ActivityDetail, type ActivityImage } from "./ActivityDetailClient";

// Server component: fetch the activity so its content is in the SSR HTML (SEO/GEO).
export default async function ActivityDetailPage({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params;
  const data = await fetchActivityDetail(id, locale);
  const activity = (data?.activity ?? data ?? null) as ActivityDetail | null;
  const images = Array.isArray(data?.images) ? (data.images as ActivityImage[]) : [];
  return <ActivityDetailClient initialActivity={activity} initialImages={images} />;
}

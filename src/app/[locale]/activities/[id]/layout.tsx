import type { Metadata } from "next";
import { fetchActivityMeta } from "@/lib/server-api";
import { buildAlternates } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}): Promise<Metadata> {
  const { locale, id } = await params;
  const activity = await fetchActivityMeta(id, locale);

  if (!activity) {
    return { title: "Activity Not Found" };
  }

  const description = (activity.description || activity.detailedDescription || "")
    .replace(/<[^>]+>/g, "")
    .slice(0, 160) || `${activity.name} - Safari activity in Tanzania`;

  return {
    title: activity.name,
    description,
    alternates: buildAlternates(locale, `/activities/${activity.slug || id}`),
    openGraph: {
      title: activity.name,
      description,
      type: "website",
      url: `https://kabengosafaris.com/${locale}/activities/${activity.slug || id}`,
      ...(activity.primaryImageUrl && {
        images: [{ url: activity.primaryImageUrl, width: 1200, height: 630, alt: activity.name }],
      }),
    },
    twitter: {
      card: "summary_large_image",
      title: activity.name,
      description,
      ...(activity.primaryImageUrl && { images: [activity.primaryImageUrl] }),
    },
  };
}

export default function ActivityDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

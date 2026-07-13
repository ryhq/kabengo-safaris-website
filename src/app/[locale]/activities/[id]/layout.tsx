import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { fetchActivityMeta } from "@/lib/server-api";
import { buildAlternates } from "@/lib/seo";
import { JsonLd, getActivityJsonLd, getBreadcrumbJsonLd, localeUrl } from "@/lib/jsonld";

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
    alternates: buildAlternates(locale, `/activities/${activity.slug}`),
    openGraph: {
      title: activity.name,
      description,
      type: "website",
      url: `https://kabengosafaris.com/${locale}/activities/${activity.slug}`,
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

export default async function ActivityDetailLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const [activity, nav] = await Promise.all([
    fetchActivityMeta(id, locale),
    getTranslations({ locale, namespace: "nav" }),
  ]);

  const breadcrumb = activity
    ? getBreadcrumbJsonLd([
        { name: nav("home"), url: localeUrl(locale) },
        { name: nav("activities"), url: localeUrl(locale, "/activities") },
        { name: activity.name, url: localeUrl(locale, `/activities/${activity.slug || id}`) },
      ])
    : null;

  return (
    <>
      {activity && <JsonLd data={getActivityJsonLd(activity, { locale })} />}
      {breadcrumb && <JsonLd data={breadcrumb} />}
      {children}
    </>
  );
}

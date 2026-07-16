import { getTranslations } from "next-intl/server";
import { buildAlternates } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  return {
    title: t("activitiesTitle"),
    description: t("activitiesDescription"),
    alternates: buildAlternates(locale, "/activities"),
  };
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

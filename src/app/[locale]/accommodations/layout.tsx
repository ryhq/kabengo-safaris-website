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
    title: t("accommodationsTitle"),
    description: t("accommodationsDescription"),
    alternates: buildAlternates(locale, "/accommodations"),
  };
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

import { getTranslations } from "next-intl/server";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  return {
    title: t("galleryTitle"),
    description: t("galleryDescription"),
  };
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

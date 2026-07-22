import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { buildAlternates } from "@/lib/seo";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "bookingInquiry" });
  return {
    title: t("title"),
    description: t("subtitle"),
    alternates: buildAlternates(locale, "/book"),
    openGraph: {
      title: t("title"),
      description: t("subtitle"),
      type: "website",
      url: `https://kabengosafaris.com/${locale}/book`,
    },
  };
}

export default function BookLayout({ children }: { children: React.ReactNode }) {
  return children;
}

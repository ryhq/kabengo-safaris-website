import { getTranslations } from "next-intl/server";
import { buildAlternates } from "@/lib/seo";
import { JsonLd, getFAQJsonLd } from "@/lib/jsonld";
import { getFaqs } from "@/content/faq";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  return {
    title: t("faqTitle"),
    description: t("faqDescription"),
    alternates: buildAlternates(locale, "/faq"),
  };
}

export default async function Layout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const faqs = await getFaqs(locale);
  return (
    <>
      {faqs.length > 0 && <JsonLd data={getFAQJsonLd(faqs)} />}
      {children}
    </>
  );
}

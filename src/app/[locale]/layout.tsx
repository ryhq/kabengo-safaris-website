import Script from "next/script";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { GOOGLE_ADS_ID } from "@/lib/gtag";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { Source_Serif_4, Inter } from "next/font/google";
import type { Metadata } from "next";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ApiLocaleSync from "@/lib/ApiLocaleSync";
import AttributionCapture from "@/components/analytics/AttributionCapture";
import ImageProtection from "@/components/ui/ImageProtection";
import { buildAlternates, buildOpenGraph, buildTwitter } from "@/lib/seo";
import { JsonLd, getWebSiteJsonLd } from "@/lib/jsonld";
import WhatsAppButton from "@/components/ui/WhatsAppButton";
import BackToTopButton from "@/components/ui/BackToTopButton";
import PrivacyBanner from "@/components/ui/PrivacyBanner";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  /*
   * Only the locale belongs here -- but `openGraph: { locale }` alone REPLACED the root
   * layout's whole block, taking og:type, og:site_name and the picture with it. Spelling the
   * defaults out again is the only way they survive the merge.
   */
  return {
    alternates: buildAlternates(locale),
    openGraph: buildOpenGraph({
      title: "Kabengo Safaris - Tailor-made safaris in Tanzania, planned in Arusha",
      description:
        "Private, tailor-made Tanzania safaris to the Serengeti, Ngorongoro, Tarangire and Zanzibar. Planned in Arusha, guided by Tanzanians, priced honestly.",
      url: `https://kabengosafaris.com/${locale}`,
      locale,
    }),
    twitter: buildTwitter({
      title: "Kabengo Safaris - Tailor-made safaris in Tanzania, planned in Arusha",
      description:
        "Private, tailor-made Tanzania safaris to the Serengeti, Ngorongoro, Tarangire and Zanzibar. Planned in Arusha, guided by Tanzanians, priced honestly.",
    }),
  };
}

const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  variable: "--font-source-serif",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <html lang={locale} className={`${sourceSerif.variable} ${inter.variable}`}>
      <body className="min-h-screen flex flex-col">
        {/*
          The Google tag, which has to be present on every page for a conversion fired on any one
          of them to be attributed to the ad click that brought the visitor. afterInteractive, so
          it never sits in front of the page rendering - nobody waits on an advertising script.
        */}
        <Script
          id="google-tag"
          src={`https://www.googletagmanager.com/gtag/js?id=${GOOGLE_ADS_ID}`}
          strategy="afterInteractive"
        />
        <Script id="google-tag-init" strategy="afterInteractive">
          {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${GOOGLE_ADS_ID}');`}
        </Script>
        <JsonLd data={getWebSiteJsonLd(locale)} />
        <NextIntlClientProvider messages={messages}>
          <ApiLocaleSync />
          <AttributionCapture />
          <ImageProtection />
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
          <WhatsAppButton />
          <BackToTopButton />
          <PrivacyBanner />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

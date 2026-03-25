import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { Playfair_Display, Inter } from "next/font/google";
import type { Metadata } from "next";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ApiLocaleSync from "@/lib/ApiLocaleSync";
import ImageProtection from "@/components/ui/ImageProtection";
import { buildAlternates } from "@/lib/seo";
import WhatsAppButton from "@/components/ui/WhatsAppButton";
import BackToTopButton from "@/components/ui/BackToTopButton";
import PrivacyBanner from "@/components/ui/PrivacyBanner";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return {
    alternates: buildAlternates(locale),
  };
}

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
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
    <html lang={locale} className={`${playfair.variable} ${inter.variable}`}>
      <body className="min-h-screen flex flex-col">
        <NextIntlClientProvider messages={messages}>
          <ApiLocaleSync />
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

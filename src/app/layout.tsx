import type { Metadata } from "next";
import { JsonLd, getOrganizationJsonLd } from "@/lib/jsonld";
import { fetchTestimonySummary } from "@/lib/server-api";
import { buildOpenGraph, buildTwitter } from "@/lib/seo";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://kabengosafaris.com"),
  title: {
    template: "%s | Kabengo Safaris",
    default: "Kabengo Safaris - Tailor-made safaris in Tanzania, planned in Arusha",
  },
  description:
    "Private, tailor-made Tanzania safaris to the Serengeti, Ngorongoro, Tarangire and Zanzibar. Planned in Arusha, guided by Tanzanians, priced honestly.",
  keywords: [
    "safari",
    "Tanzania safari",
    "African safari",
    "Serengeti",
    "Ngorongoro",
    "Kilimanjaro",
    "wildlife tours",
    "East Africa tours",
    "Kabengo Safaris",
    "Arusha",
  ],
  icons: {
    icon: "/images/favicon.svg",
    shortcut: "/images/favicon.svg",
    apple: "/images/favicon.svg",
  },
  manifest: "/manifest.json",
  openGraph: buildOpenGraph({
    title: "Kabengo Safaris - Tailor-made safaris in Tanzania, planned in Arusha",
    description:
      "Private, tailor-made Tanzania safaris to the Serengeti, Ngorongoro, Tarangire and Zanzibar. Planned in Arusha, guided by Tanzanians, priced honestly.",
    url: "https://kabengosafaris.com",
  }),
  twitter: buildTwitter({
    title: "Kabengo Safaris - Tailor-made safaris in Tanzania, planned in Arusha",
    description:
      "Private, tailor-made Tanzania safaris to the Serengeti, Ngorongoro, Tarangire and Zanzibar. Planned in Arusha, guided by Tanzanians, priced honestly.",
  }),
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const aggregate = await fetchTestimonySummary();
  return (
    <>
      <JsonLd data={getOrganizationJsonLd({ aggregate })} />
      {children}
    </>
  );
}

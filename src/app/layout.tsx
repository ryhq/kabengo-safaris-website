import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://kabengosafaris.com"),
  title: {
    template: "%s | Kabengo Safaris",
    default: "Kabengo Safaris - Unforgettable African Safari Experiences",
  },
  description:
    "Discover the magic of Africa with Kabengo Safaris. Premium safari tours, breathtaking destinations, and unforgettable wildlife experiences across East Africa.",
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
  openGraph: {
    type: "website",
    siteName: "Kabengo Safaris",
    title: "Kabengo Safaris - Unforgettable African Safari Experiences",
    description:
      "Premium safari tours, breathtaking destinations, and unforgettable wildlife experiences across East Africa.",
    url: "https://kabengosafaris.com",
  },
  twitter: {
    card: "summary_large_image",
    title: "Kabengo Safaris - Unforgettable African Safari Experiences",
    description:
      "Premium safari tours, breathtaking destinations, and unforgettable wildlife experiences across East Africa.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}

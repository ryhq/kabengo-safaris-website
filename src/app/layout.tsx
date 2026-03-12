import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    template: "%s | Kabengo Safaris",
    default: "Kabengo Safaris - Unforgettable African Safari Experiences",
  },
  description: "Discover the magic of Africa with Kabengo Safaris. Premium safari tours, breathtaking destinations, and unforgettable wildlife experiences across East Africa.",
  icons: {
    icon: "/images/favicon.svg",
    shortcut: "/images/favicon.svg",
    apple: "/images/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}

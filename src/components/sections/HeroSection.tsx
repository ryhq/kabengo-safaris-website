"use client";

import { useTranslations } from "next-intl";
import HeroCarousel from "@/components/ui/HeroCarousel";
import type { Hero } from "@/types";

interface HeroSectionProps {
  heroes: Hero[];
}

export default function HeroSection({ heroes }: HeroSectionProps) {
  const t = useTranslations("hero");

  return (
    <HeroCarousel
      heroes={heroes}
      variant="full"
      fallbackTitle={t("title")}
      fallbackSubtitle={t("subtitle")}
      fallbackCtaText={t("cta")}
      fallbackCtaLink="/contact"
      showScrollIndicator
    />
  );
}

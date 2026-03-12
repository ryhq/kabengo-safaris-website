"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import HeroCarousel from "@/components/ui/HeroCarousel";
import { apiClient } from "@/lib/api";
import type { Hero, ApiResponse } from "@/types";

interface PageHeroProps {
  heroPage: string;
  fallbackTitle: string;
  fallbackSubtitle?: string;
}

export default function PageHero({ heroPage, fallbackTitle, fallbackSubtitle }: PageHeroProps) {
  const locale = useLocale();
  const [heroes, setHeroes] = useState<Hero[]>([]);

  useEffect(() => {
    const fetchHeroes = async () => {
      try {
        const res = await apiClient.get<ApiResponse<Hero[]>>(`/public/heroes`, {
          params: { heroPage },
          headers: { "Accept-Language": locale },
        });
        if (res.data.success && res.data.data?.length > 0) {
          setHeroes(res.data.data);
        }
      } catch {
        // Heroes unavailable — fallback text will show
      }
    };
    fetchHeroes();
  }, [heroPage, locale]);

  return (
    <HeroCarousel
      heroes={heroes}
      variant="page"
      fallbackTitle={fallbackTitle}
      fallbackSubtitle={fallbackSubtitle}
    />
  );
}

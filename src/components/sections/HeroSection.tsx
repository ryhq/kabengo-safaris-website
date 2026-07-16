"use client";

import HomeHero from "@/components/sections/HomeHero";
import type { Hero } from "@/types";

interface HeroSectionProps {
  heroes: Hero[];
}

export default function HeroSection({ heroes }: HeroSectionProps) {
  return <HomeHero heroes={heroes} />;
}

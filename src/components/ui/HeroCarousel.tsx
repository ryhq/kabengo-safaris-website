"use client";

import { useState, useEffect, useCallback } from "react";
import { Link } from "@/i18n/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import type { Hero } from "@/types";

const SLIDE_DURATION = 6000;

const kenBurnsVariants = [
  { initial: { scale: 1.0 }, animate: { scale: 1.15 } },
  { initial: { scale: 1.15 }, animate: { scale: 1.0 } },
  { initial: { scale: 1.0 }, animate: { scale: 1.12 } },
];

interface HeroCarouselProps {
  heroes: Hero[];
  variant?: "full" | "page";
  fallbackTitle: string;
  fallbackSubtitle?: string;
  fallbackCtaText?: string;
  fallbackCtaLink?: string;
  showScrollIndicator?: boolean;
}

export default function HeroCarousel({
  heroes,
  variant = "full",
  fallbackTitle,
  fallbackSubtitle,
  fallbackCtaText,
  fallbackCtaLink,
  showScrollIndicator = false,
}: HeroCarouselProps) {
  const [current, setCurrent] = useState(0);

  const goTo = useCallback(
    (index: number) => {
      setCurrent(index);
    },
    []
  );

  useEffect(() => {
    if (heroes.length <= 1) return;
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % heroes.length);
    }, SLIDE_DURATION);
    return () => clearInterval(interval);
  }, [heroes.length]);

  const hero = heroes[current];
  const title = hero?.title || fallbackTitle;
  const subtitle = hero?.subtitle || fallbackSubtitle;
  const description = hero?.description;
  const ctaText = hero?.ctaText || fallbackCtaText;
  const ctaLink = hero?.ctaLink || fallbackCtaLink;
  const overlayColor = hero?.overlayColor || "#000000";
  const overlayOpacity = hero?.overlayOpacity ?? 0.4;
  const textAlignment = hero?.textAlignment || "center";
  const cssClasses = hero?.cssClasses || "";

  const textAlignClass =
    textAlignment === "left"
      ? "text-left"
      : textAlignment === "right"
        ? "text-right"
        : "text-center";

  const contentAlignClass =
    textAlignment === "left"
      ? "items-start"
      : textAlignment === "right"
        ? "items-end"
        : "items-center";

  const kb = kenBurnsVariants[current % kenBurnsVariants.length];

  return (
    <section className={`relative flex ${
      variant === "page" ? "h-[50vh] sm:h-[60vh] min-h-[300px] sm:min-h-[400px] items-end" : "h-screen min-h-[600px] items-center"
    } justify-center overflow-hidden`}>
      {/* Background with crossfade + Ken Burns */}
      <AnimatePresence initial={false}>
        <motion.div
          key={hero?.id || "fallback"}
          initial={{ opacity: 0, scale: kb.initial.scale }}
          animate={{
            opacity: 1,
            scale: kb.animate.scale,
            transition: {
              opacity: { duration: 1.2, ease: "easeInOut" },
              scale: { duration: SLIDE_DURATION / 1000, ease: "linear" },
            },
          }}
          exit={{
            opacity: 0,
            transition: { duration: 1.2, ease: "easeInOut" },
          }}
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: hero?.primaryImageUrl
              ? `url('${hero.primaryImageUrl}')`
              : "url('https://images.unsplash.com/photo-1516426122078-c23e76319801?w=1920&q=80')",
          }}
        >
          <div
            className="absolute inset-0"
            style={{ backgroundColor: overlayColor, opacity: overlayOpacity }}
          />
        </motion.div>
      </AnimatePresence>

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`content-${current}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
          className={`relative z-10 flex flex-col ${contentAlignClass} ${textAlignClass} gap-4 sm:gap-6 px-4 sm:px-6 lg:px-8 w-full max-w-4xl mx-auto ${
            variant === "page" ? "pb-16 sm:pb-24" : ""
          } ${cssClasses}`}
        >
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="font-bold text-white font-serif leading-tight text-4xl sm:text-5xl lg:text-7xl"
          >
            {title}
          </motion.h1>

          {subtitle && (
            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.5 }}
              className={`text-white/85 leading-relaxed text-lg sm:text-xl max-w-2xl ${
                textAlignment === "center" ? "mx-auto" : ""
              }`}
            >
              {subtitle}
            </motion.p>
          )}

          {description && (
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.6 }}
              className={`hidden sm:block text-base sm:text-lg text-white/70 max-w-2xl leading-relaxed ${
                textAlignment === "center" ? "mx-auto" : ""
              }`}
            >
              {description}
            </motion.p>
          )}

          {ctaText && ctaLink && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.7 }}
              className="mt-2"
            >
              <Link
                href={ctaLink}
                className="inline-flex items-center px-8 py-4 bg-brand-brown text-white text-lg font-semibold rounded-lg hover:bg-brand-brown-light transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                {ctaText}
              </Link>
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Carousel dots */}
      {heroes.length > 1 && (
        <div className={`absolute left-1/2 -translate-x-1/2 flex space-x-2 z-10 ${
          showScrollIndicator ? "bottom-16" : "bottom-6"
        }`}>
          {heroes.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className="relative h-2.5 rounded-full cursor-pointer transition-all duration-300 overflow-hidden"
              style={{ width: i === current ? 32 : 10 }}
            >
              <span className="absolute inset-0 bg-white/40 rounded-full" />
              {i === current && (
                <motion.span
                  className="absolute inset-0 bg-white rounded-full origin-left"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: SLIDE_DURATION / 1000, ease: "linear" }}
                />
              )}
            </button>
          ))}
        </div>
      )}

      {/* Scroll indicator */}
      {showScrollIndicator && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ repeat: Infinity, duration: 2 }}
          >
            <ChevronDown size={32} className="text-white/60" />
          </motion.div>
        </motion.div>
      )}
    </section>
  );
}

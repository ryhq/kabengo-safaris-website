"use client";

import { Link } from "@/i18n/navigation";
import { motion } from "framer-motion";
import { MapPin, ArrowLeft } from "lucide-react";

interface ParkDetailHeroProps {
  name: string;
  location?: string;
  region?: string;
  district?: string;
  heroImage: string | null;
}

const kenBurnsVariants = [
  { initial: { scale: 1.0 }, animate: { scale: 1.15 } },
  { initial: { scale: 1.15 }, animate: { scale: 1.0 } },
];

export default function ParkDetailHero({ name, location, region, district, heroImage }: ParkDetailHeroProps) {
  const kb = kenBurnsVariants[0];
  const locationText = location || [region, district].filter(Boolean).join(", ");

  return (
    <section className="relative h-[70vh] min-h-[500px] flex items-end overflow-hidden">
      {/* Background with Ken Burns */}
      {heroImage ? (
        <motion.div
          initial={{ opacity: 0, scale: kb.initial.scale }}
          animate={{
            opacity: 1,
            scale: kb.animate.scale,
            transition: {
              opacity: { duration: 1.2, ease: "easeInOut" },
              scale: { duration: 12, ease: "linear" },
            },
          }}
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url('${heroImage}')` }}
        />
      ) : (
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('/images/placeholders/park.svg')" }} />
      )}

      {/* Gradient overlay — deeper for readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/10" />

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full pb-12">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.3 }}>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white font-serif mb-4 leading-tight">
            {name}
          </h1>

          <div className="flex items-center gap-3">
            <Link
              href="/parks"
              className="w-9 h-9 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/30 transition-colors"
            >
              <ArrowLeft size={16} />
            </Link>
            {locationText && (
              <div className="flex items-center text-white/80 text-lg">
                <MapPin size={20} className="mr-2 flex-shrink-0" />
                <span>{locationText}</span>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

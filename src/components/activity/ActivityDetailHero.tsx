"use client";

import { Link } from "@/i18n/navigation";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";

interface ActivityDetailHeroProps {
  name: string;
  heroImage: string | null;
}

export default function ActivityDetailHero({ name, heroImage }: ActivityDetailHeroProps) {
  return (
    <section className="relative h-[70vh] min-h-[500px] flex items-end overflow-hidden">
      {heroImage ? (
        <motion.div
          initial={{ opacity: 0, scale: 1.0 }}
          animate={{
            opacity: 1,
            scale: 1.15,
            transition: {
              opacity: { duration: 1.2, ease: "easeInOut" },
              scale: { duration: 12, ease: "linear" },
            },
          }}
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url('${heroImage}')` }}
        />
      ) : (
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('/images/placeholders/activity.svg')" }} />
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/10" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full pb-12">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.3 }}>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white font-serif mb-4 leading-tight">
            {name}
          </h1>
          <Link
            href="/activities"
            className="w-9 h-9 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/30 transition-colors"
          >
            <ArrowLeft size={16} />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

"use client";

import { motion } from "framer-motion";
import { ChevronDown, Loader2, ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";

interface LoadMoreFadeProps {
  loading: boolean;
  loaded: number;
  total: number;
  label: string;
  onLoadMore: () => void;
  fadeColor?: string;
  viewAllHref?: string;
}

export default function LoadMoreFade({
  loading,
  loaded,
  total,
  onLoadMore,
  fadeColor = "white",
  viewAllHref,
}: LoadMoreFadeProps) {
  const gradientMap: Record<string, string> = {
    white: "from-transparent via-white/70 to-white",
    warm: "from-transparent via-[#FAF8F5]/70 to-[#FAF8F5]",
  };

  const gradient = gradientMap[fadeColor] || gradientMap.white;

  return (
    <div className="relative">
      {/* Gradient fade overlay */}
      <div
        className={`absolute -top-32 left-0 right-0 h-32 bg-gradient-to-b ${gradient} pointer-events-none z-10`}
      />

      {/* Compact load more row */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="relative z-20 flex items-center justify-center gap-3 pt-1"
      >
        <button
          onClick={onLoadMore}
          disabled={loading}
          className="group w-9 h-9 rounded-full border border-stone-200 bg-white flex items-center justify-center shadow-sm hover:shadow-md hover:border-stone-300 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          title="Load more"
        >
          {loading ? (
            <Loader2 size={16} className="animate-spin text-stone-400" />
          ) : (
            <motion.div
              animate={{ y: [0, 2, 0] }}
              transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
            >
              <ChevronDown size={16} className="text-stone-500 group-hover:text-brand-green transition-colors" />
            </motion.div>
          )}
        </button>

        {/* Slim progress pill */}
        <div className="flex items-center gap-2">
          <div className="w-20 h-1 bg-stone-200 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-brand-brown to-brand-green rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${(loaded / total) * 100}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
          <span className="text-xs text-stone-400 font-medium tabular-nums">
            {loaded}/{total}
          </span>
        </div>

        {/* View All icon button */}
        {viewAllHref && (
          <Link
            href={viewAllHref}
            className="group w-9 h-9 rounded-full border border-stone-200 bg-white flex items-center justify-center shadow-sm hover:shadow-md hover:border-brand-green transition-all duration-200"
            title="View all"
          >
            <ArrowRight size={16} className="text-stone-500 group-hover:text-brand-green transition-colors" />
          </Link>
        )}
      </motion.div>
    </div>
  );
}

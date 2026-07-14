"use client";

import { Link } from "@/i18n/navigation";
import { ChevronRight, Home } from "lucide-react";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export default function Breadcrumbs({ items }: BreadcrumbsProps) {
  // Visual navigation only. Breadcrumb structured data (BreadcrumbList JSON-LD)
  // is emitted server-side from each detail route's layout via getBreadcrumbJsonLd,
  // so we intentionally do NOT duplicate it as microdata here.
  return (
    <nav aria-label="Breadcrumb" className="bg-white/90 backdrop-blur-sm border-b border-stone-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <ol className="flex items-center flex-wrap gap-1 text-sm">
          {items.map((item, i) => {
            const isLast = i === items.length - 1;
            return (
              <li key={i} className="flex items-center gap-1">
                {i > 0 && <ChevronRight size={14} className="text-stone-400 flex-shrink-0" />}
                {isLast ? (
                  <span className="text-stone-800 font-medium line-clamp-1">{item.label}</span>
                ) : item.href ? (
                  <Link
                    href={item.href}
                    className="text-stone-500 hover:text-brand-brown transition-colors flex items-center gap-1"
                  >
                    {i === 0 && <Home size={14} className="flex-shrink-0" />}
                    <span>{item.label}</span>
                  </Link>
                ) : (
                  <span className="text-stone-500">{item.label}</span>
                )}
              </li>
            );
          })}
        </ol>
      </div>
    </nav>
  );
}

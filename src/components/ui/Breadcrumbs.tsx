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
  return (
    <nav aria-label="Breadcrumb" className="bg-white/90 backdrop-blur-sm border-b border-stone-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
      <ol className="flex items-center flex-wrap gap-1 text-sm" itemScope itemType="https://schema.org/BreadcrumbList">
        {items.map((item, i) => {
          const isLast = i === items.length - 1;
          return (
            <li
              key={i}
              className="flex items-center gap-1"
              itemProp="itemListElement"
              itemScope
              itemType="https://schema.org/ListItem"
            >
              {i > 0 && <ChevronRight size={14} className="text-stone-400 flex-shrink-0" />}
              {isLast ? (
                <span className="text-stone-800 font-medium line-clamp-1" itemProp="name">
                  {item.label}
                </span>
              ) : item.href ? (
                <Link
                  href={item.href}
                  className="text-stone-500 hover:text-brand-brown transition-colors flex items-center gap-1"
                  itemProp="item"
                >
                  {i === 0 && <Home size={14} className="flex-shrink-0" />}
                  <span itemProp="name">{item.label}</span>
                </Link>
              ) : (
                <span className="text-stone-500" itemProp="name">{item.label}</span>
              )}
              <meta itemProp="position" content={String(i + 1)} />
            </li>
          );
        })}
      </ol>
      </div>
    </nav>
  );
}

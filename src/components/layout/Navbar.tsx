"use client";

import { useState, useEffect, useRef } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { Menu, X, Globe, ChevronDown, TreePine, Tent, Map, Compass, Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import KabengoIcon from "@/components/ui/KabengoIcon";
import SearchModal from "@/components/search/SearchModal";
import { apiClient } from "@/lib/api";

const LOCALES = [
  { code: "en", label: "English", flag: "EN" },
  { code: "sw", label: "Kiswahili", flag: "SW" },
  { code: "fr", label: "Français", flag: "FR" },
  { code: "de", label: "Deutsch", flag: "DE" },
  { code: "es", label: "Español", flag: "ES" },
  { code: "it", label: "Italiano", flag: "IT" },
  { code: "pt", label: "Português", flag: "PT" },
];

interface NavItem {
  id: string;
  name: string;
  region?: string;
}

interface NavigationData {
  parks: NavItem[];
  activities: NavItem[];
  accommodations: NavItem[];
  itineraries: NavItem[];
  testimoniesCount: number;
  translationEnabled: boolean;
  supportedLanguages: string[];
}

export default function Navbar() {
  const t = useTranslations("nav");
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [navData, setNavData] = useState<NavigationData | null>(null);
  const menuTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const langRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Fetch navigation data
  useEffect(() => {
    const fetchNav = async () => {
      try {
        const res = await apiClient.get("/public/navigation", {
          headers: { "Accept-Language": locale },
        });
        if (res.data.success) setNavData(res.data.data);
      } catch (err) {
        console.error("Failed to fetch navigation:", err);
      }
    };
    fetchNav();
  }, [locale]);

  // Close lang dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setLangOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleMenuEnter = (menu: string) => {
    clearTimeout(menuTimeout.current);
    setActiveMenu(menu);
  };

  const handleMenuLeave = () => {
    menuTimeout.current = setTimeout(() => setActiveMenu(null), 200);
  };

  const switchLocale = (locale: string) => {
    router.replace(pathname, { locale });
    setLangOpen(false);
  };

  const textColor = scrolled ? "text-stone-700" : "text-white/90";
  const textColorActive = scrolled ? "text-brand-brown" : "text-white";
  const textColorHover = scrolled ? "hover:text-brand-brown" : "hover:text-white";

  // Filter locales to only those supported by the backend
  const availableLocales = navData?.supportedLanguages
    ? LOCALES.filter((l) => navData.supportedLanguages.includes(l.code))
    : LOCALES;

  // Build nav links based on API data
  const staticLinks = [
    { href: "/", label: t("home"), key: "home" },
  ];

  const megaMenuGroups = [
    {
      key: "safaris",
      label: t("safaris"),
      href: "/safaris",
      icon: Map,
      items: navData?.itineraries || [],
      itemHref: (item: NavItem) => `/safaris/${item.id}`,
    },
    {
      key: "parks",
      label: t("parks"),
      href: "/parks",
      icon: TreePine,
      items: navData?.parks || [],
      itemHref: (item: NavItem) => `/parks/${item.id}`,
    },
    {
      key: "accommodations",
      label: t("accommodations"),
      href: "/accommodations",
      icon: Tent,
      items: navData?.accommodations || [],
      itemHref: (item: NavItem) => `/accommodations/${item.id}`,
    },
    {
      key: "activities",
      label: t("activities"),
      href: "/activities",
      icon: Compass,
      items: navData?.activities || [],
      itemHref: (item: NavItem) => `/activities/${item.id}`,
    },
  ];

  const trailingLinks = [
    { href: "/reviews", label: t("testimonials"), key: "testimonials" },
    { href: "/gallery", label: t("gallery"), key: "gallery" },
    { href: "/about", label: t("about"), key: "about" },
    { href: "/contact", label: t("contact"), key: "contact" },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "bg-white shadow-md" : "bg-black/30"
      }`}
    >
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 flex-shrink-0">
            <KabengoIcon
              width={36}
              height={36}
              color={scrolled ? "#5a1e03" : "#ffffff"}
            />
            <span className={`hidden lg:inline text-lg font-bold font-serif tracking-wider ${scrolled ? "text-brand-brown" : "text-white"}`}>
              KABENGO SAFARIS
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center space-x-0.5">
            {/* Home */}
            {staticLinks.map((link) => (
              <Link
                key={link.key}
                href={link.href}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  pathname === link.href ? textColorActive : `${textColor} ${textColorHover}`
                }`}
              >
                {link.label}
              </Link>
            ))}

            {/* Mega menu groups */}
            {megaMenuGroups.map((group) => {
              if (group.items.length === 0) return null;
              return (
                <div
                  key={group.key}
                  className="relative"
                  onMouseEnter={() => handleMenuEnter(group.key)}
                  onMouseLeave={handleMenuLeave}
                >
                  <Link
                    href={group.href}
                    className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      pathname.startsWith(group.href) ? textColorActive : `${textColor} ${textColorHover}`
                    }`}
                  >
                    <span>{group.label}</span>
                    <ChevronDown size={14} className={`transition-transform ${activeMenu === group.key ? "rotate-180" : ""}`} />
                  </Link>

                  {/* Mega menu dropdown */}
                  <AnimatePresence>
                    {activeMenu === group.key && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 8 }}
                        transition={{ duration: 0.15 }}
                        className="absolute left-1/2 -translate-x-1/2 mt-2 w-[480px] rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.18)] overflow-hidden z-50 glass-card"
                        style={{ backdropFilter: "blur(12px) saturate(150%)" }}
                        onMouseEnter={() => handleMenuEnter(group.key)}
                        onMouseLeave={handleMenuLeave}
                      >
                        <div className="p-4">
                          <div className="flex items-center space-x-2 mb-3 pb-2 border-b border-white/15">
                            <group.icon size={18} className="text-white/70" />
                            <Link
                              href={group.href}
                              className="text-sm font-semibold text-white hover:text-white/80"
                              onClick={() => setActiveMenu(null)}
                            >
                              {t("viewAll", { label: group.label })}
                            </Link>
                          </div>
                          <div className="grid grid-cols-2 gap-1 max-h-[320px] overflow-y-auto">
                            {group.items.map((item) => (
                              <Link
                                key={item.id}
                                href={group.itemHref(item)}
                                onClick={() => setActiveMenu(null)}
                                className="flex items-start px-3 py-2 rounded-xl text-sm text-white/80 hover:bg-white/20 hover:text-white transition-colors group"
                              >
                                <div>
                                  <span className="font-medium">{item.name}</span>
                                  {item.region && (
                                    <span className="block text-xs text-white/50 group-hover:text-white/70">
                                      {item.region}
                                    </span>
                                  )}
                                </div>
                              </Link>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}

            {/* Trailing static links */}
            {trailingLinks.map((link) => (
              <Link
                key={link.key}
                href={link.href}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  pathname === link.href || pathname.startsWith(link.href + "/")
                    ? textColorActive
                    : `${textColor} ${textColorHover}`
                }`}
              >
                {link.label}
              </Link>
            ))}

            {/* Book Now CTA */}
            <Link
              href="/book"
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                scrolled
                  ? "bg-brand-green text-white hover:bg-brand-green/90"
                  : "bg-white/15 text-white hover:bg-white/25 border border-white/30"
              }`}
            >
              {t("bookNow")}
            </Link>

            {/* Search Button */}
            <button
              onClick={() => setSearchOpen(true)}
              className={`p-2 rounded-md transition-colors cursor-pointer ${
                scrolled ? "text-stone-700 hover:text-brand-brown" : "text-white/90 hover:text-white"
              }`}
              title="Search"
            >
              <Search size={18} />
            </button>

            {/* Language Switcher — only shown when translation service is enabled */}
            {navData?.translationEnabled && (
              <div className="relative ml-2" ref={langRef}>
                <button
                  onClick={() => setLangOpen(!langOpen)}
                  className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer ${
                    scrolled ? "text-stone-700 hover:text-brand-brown" : "text-white/90 hover:text-white"
                  }`}
                >
                  <Globe size={16} />
                  <ChevronDown size={14} />
                </button>
                <AnimatePresence>
                  {langOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 4, scale: 0.9 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 4, scale: 0.9 }}
                      transition={{ type: "spring", stiffness: 400, damping: 25 }}
                      className="absolute right-0 mt-2 w-40 rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.18)] overflow-hidden py-2 z-50 origin-top-right glass-card"
                      style={{ backdropFilter: "blur(12px) saturate(150%)" }}
                    >
                      {availableLocales.map((locale, i) => (
                        <motion.button
                          key={locale.code}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.04, duration: 0.2 }}
                          onClick={() => switchLocale(locale.code)}
                          className="flex items-center w-full text-left px-4 py-2.5 text-sm text-white/80 hover:bg-white/20 hover:text-white transition-all duration-200 cursor-pointer rounded-xl mx-1 hover:pl-5"
                        >
                          <span className="w-8 text-xs font-bold text-white/50">{locale.flag}</span>
                          {locale.label}
                        </motion.button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>

          {/* Mobile Search + Menu Buttons */}
          <div className="flex items-center gap-1 lg:hidden">
            <button
              onClick={() => setSearchOpen(true)}
              className={`p-2 rounded-md cursor-pointer ${scrolled ? "text-stone-700" : "text-white"}`}
            >
              <Search size={22} />
            </button>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className={`p-2 rounded-md cursor-pointer ${scrolled ? "text-stone-700" : "text-white"}`}
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden glass-card-dark border-t border-white/20 shadow-[0_8px_40px_rgba(0,0,0,0.18)] max-h-[80vh] overflow-y-auto"
            style={{ backdropFilter: "blur(12px) saturate(150%)" }}
          >
            <div className="px-4 py-4 space-y-1">
              <Link href="/" onClick={() => setIsOpen(false)} className="block px-4 py-3 rounded-xl text-base font-medium text-white/90 hover:text-white hover:bg-white/20">
                {t("home")}
              </Link>

              {megaMenuGroups.map((group) => {
                if (group.items.length === 0) return null;
                return (
                  <div key={group.key}>
                    <Link
                      href={group.href}
                      onClick={() => setIsOpen(false)}
                      className="block px-4 py-3 rounded-xl text-base font-semibold text-white"
                    >
                      {group.label}
                    </Link>
                    <div className="pl-6 space-y-0.5">
                      {group.items.slice(0, 8).map((item) => (
                        <Link
                          key={item.id}
                          href={group.itemHref(item)}
                          onClick={() => setIsOpen(false)}
                          className="block px-4 py-2 text-sm text-white/70 hover:text-white hover:bg-white/20 rounded-xl"
                        >
                          {item.name}
                        </Link>
                      ))}
                      {group.items.length > 8 && (
                        <Link
                          href={group.href}
                          onClick={() => setIsOpen(false)}
                          className="block px-4 py-2 text-sm font-medium text-white/60"
                        >
                          {t("viewAllCount", { count: group.items.length, label: group.label.toLowerCase() })}
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}

              {trailingLinks.map((link) => (
                <Link
                  key={link.key}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className="block px-4 py-3 rounded-xl text-base font-medium text-white/90 hover:text-white hover:bg-white/20"
                >
                  {link.label}
                </Link>
              ))}

              {/* Book Now CTA — Mobile */}
              <Link
                href="/book"
                onClick={() => setIsOpen(false)}
                className="block mx-2 mt-2 px-4 py-3 rounded-xl text-base font-semibold text-center bg-brand-green text-white hover:bg-brand-green/90 transition-all"
              >
                {t("bookNow")}
              </Link>

              {navData?.translationEnabled && (
                <div className="pt-2 border-t border-white/15">
                  <p className="px-4 py-2 text-xs font-semibold text-white/40 uppercase tracking-wider">{t("language")}</p>
                  {availableLocales.map((l) => (
                    <button
                      key={l.code}
                      onClick={() => { switchLocale(l.code); setIsOpen(false); }}
                      className="block w-full text-left px-4 py-2 text-sm text-white/80 hover:bg-white/20 hover:text-white cursor-pointer rounded-xl"
                    >
                      {l.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search Modal */}
      <SearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </header>
  );
}

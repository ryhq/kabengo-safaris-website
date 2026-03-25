"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Mail, Phone, MapPin, Instagram, Facebook, Youtube } from "lucide-react";
import KabengoIcon from "@/components/ui/KabengoIcon";
import { subscribeToNewsletter } from "@/lib/api";
import { TripAdvisorIcon } from "@/components/ui/TripAdvisorBadge";

/* Obfuscated contact — assembled client-side so bots can't scrape from HTML */
function ObfuscatedEmail() {
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  if (!ready) return <span className="text-stone-300 text-sm">Loading…</span>;
  const user = "info";
  const domain = "kabengosafaris.com";
  const full = `${user}@${domain}`;
  return (
    <a href={`mailto:${full}`} className="text-stone-300 hover:text-white transition-colors text-sm">
      {full}
    </a>
  );
}

function ObfuscatedPhone() {
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  if (!ready) return <span className="text-stone-300 text-sm">Loading…</span>;
  const parts = ["+255", "786", "345", "408"];
  const num = parts.join("");
  const display = parts.join(" ");
  return (
    <a href={`tel:${num}`} className="text-stone-300 hover:text-white transition-colors text-sm">
      {display}
    </a>
  );
}

function FooterNewsletter() {
  const t = useTranslations("footer");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done">("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus("loading");
    await subscribeToNewsletter(email.trim());
    setStatus("done");
    setEmail("");
    setTimeout(() => setStatus("idle"), 3000);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder={t("emailPlaceholder")}
        required
        className="w-full px-4 py-2.5 rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-stone-400 text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent/50 transition-all"
      />
      <button
        type="submit"
        disabled={status === "loading"}
        className="w-full px-4 py-2.5 bg-brand-accent hover:bg-brand-accent/90 text-white text-sm font-semibold rounded-lg transition-all disabled:opacity-50"
      >
        {status === "done" ? "✓" : status === "loading" ? "..." : t("subscribeBtn")}
      </button>
    </form>
  );
}

export default function Footer() {
  const t = useTranslations("footer");
  const nav = useTranslations("nav");

  const quickLinks = [
    { href: "/safaris", label: nav("safaris") },
    { href: "/parks", label: nav("parks") },
    { href: "/accommodations", label: nav("accommodations") },
    { href: "/activities", label: nav("activities") },
    { href: "/gallery", label: nav("gallery") },
    { href: "/reviews", label: nav("testimonials") },
    { href: "/about", label: nav("about") },
    { href: "/contact", label: nav("contact") },
    { href: "/faq", label: nav("faq") },
  ];

  return (
    <footer className="bg-brand-secondary text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* About */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <KabengoIcon width={32} height={32} color="#f5f0eb" />
              <h3 className="text-xl font-bold font-serif text-brand-warm">
                KABENGO SAFARIS
              </h3>
            </div>
            <p className="text-stone-300 text-sm leading-relaxed">
              {t("about")}
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold mb-4 text-brand-warm">
              {t("quickLinks")}
            </h4>
            <ul className="space-y-2">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-stone-300 hover:text-white transition-colors text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-lg font-semibold mb-4 text-brand-warm">
              {t("contactInfo")}
            </h4>
            <ul className="space-y-3">
              <li className="flex items-center space-x-3">
                <Mail size={16} className="text-brand-accent flex-shrink-0" />
                <ObfuscatedEmail />
              </li>
              <li className="flex items-center space-x-3">
                <Phone size={16} className="text-brand-accent flex-shrink-0" />
                <ObfuscatedPhone />
              </li>
              <li className="flex items-start space-x-3 text-stone-300 text-sm">
                <MapPin size={16} className="text-brand-accent flex-shrink-0 mt-0.5" />
                <span>Arusha, Tanzania</span>
              </li>
            </ul>
          </div>

          {/* Newsletter & Social */}
          <div>
            <h4 className="text-lg font-semibold mb-4 text-brand-warm">
              {t("newsletter")}
            </h4>
            <FooterNewsletter />
            <div className="mt-6">
              <h4 className="text-sm font-semibold mb-3 text-brand-warm">
                {t("followUs")}
              </h4>
              <div className="flex space-x-3">
                <a href="https://www.instagram.com/kabengosafaris" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-brand-accent transition-colors" aria-label="Instagram"><Instagram size={18} /></a>
                <a href="https://www.facebook.com/kabengosafaris" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-brand-accent transition-colors" aria-label="Facebook"><Facebook size={18} /></a>
                <a href="https://www.youtube.com/@kabengosafaris" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-brand-accent transition-colors" aria-label="YouTube"><Youtube size={18} /></a>
                <a href="https://x.com/kabengosafaris" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-brand-accent transition-colors" aria-label="X">
                  <svg width={16} height={16} viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                </a>
                <TripAdvisorIcon />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-stone-400 text-sm">
            {t("copyright", { year: new Date().getFullYear() })}
          </p>
          <div className="flex items-center gap-4">
            <Link href="/privacy-policy" className="text-stone-400 hover:text-white text-sm transition-colors">
              Privacy Policy
            </Link>
            <span className="text-stone-600">·</span>
            <Link href="/terms" className="text-stone-400 hover:text-white text-sm transition-colors">
              Terms & Conditions
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

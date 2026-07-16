"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Mail, Phone, MapPin, Instagram, ArrowRight } from "lucide-react";
import KabengoIcon from "@/components/ui/KabengoIcon";
import { subscribeToNewsletter } from "@/lib/api";
import { TripAdvisorIcon, TripAdvisorWidget } from "@/components/ui/TripAdvisorBadge";

/* Obfuscated contact — assembled client-side so bots can't scrape from HTML */
function ObfuscatedEmail() {
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  if (!ready) return <span className="text-stone-300 text-sm">…</span>;
  const full = `${"info"}@${"kabengosafaris.com"}`;
  return (
    <a href={`mailto:${full}`} className="text-stone-300 hover:text-white transition-colors text-sm">{full}</a>
  );
}

function ObfuscatedPhone() {
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  if (!ready) return <span className="text-stone-300 text-sm">…</span>;
  const parts = ["+255", "786", "345", "408"];
  return (
    <a href={`tel:${parts.join("")}`} className="text-stone-300 hover:text-white transition-colors text-sm">{parts.join(" ")}</a>
  );
}

function WhatsAppIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38c1.45.79 3.08 1.21 4.79 1.21 5.46 0 9.91-4.45 9.91-9.91C21.95 6.45 17.5 2 12.04 2m0 18.15c-1.48 0-2.93-.4-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.2 8.2 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.25-8.24 2.2 0 4.27.86 5.82 2.42a8.18 8.18 0 0 1 2.41 5.83c0 4.54-3.7 8.24-8.24 8.24m4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.12-.16.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.12-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.02-.38.11-.51.11-.11.25-.29.37-.43.13-.14.17-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.4-.42-.56-.43h-.48c-.17 0-.43.06-.66.31-.22.25-.86.85-.86 2.07 0 1.22.89 2.4 1.01 2.56.12.17 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.14-1.18-.06-.11-.22-.17-.47-.29" />
    </svg>
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
        className="w-full px-4 py-2.5 rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-stone-400 text-sm focus:outline-none focus:ring-2 focus:ring-accent-gold/50 transition-all"
      />
      <button
        type="submit"
        disabled={status === "loading"}
        className="w-full px-4 py-2.5 bg-accent-gold hover:bg-accent-gold/90 text-brand-brown-dark text-sm font-semibold rounded-lg transition-all disabled:opacity-50"
      >
        {status === "done" ? "✓" : status === "loading" ? "..." : t("subscribeBtn")}
      </button>
    </form>
  );
}

export default function Footer() {
  const t = useTranslations("footer");
  const nav = useTranslations("nav");
  const home = useTranslations("home");

  const explore = [
    { href: "/safaris", label: nav("safaris") },
    { href: "/parks", label: nav("parks") },
    { href: "/accommodations", label: nav("accommodations") },
    { href: "/activities", label: nav("activities") },
    { href: "/gallery", label: nav("gallery") },
  ];
  const company = [
    { href: "/about", label: nav("about") },
    { href: "/reviews", label: nav("testimonials") },
    { href: "/contact", label: nav("contact") },
    { href: "/faq", label: nav("faq") },
  ];

  return (
    <footer className="relative overflow-hidden text-white" style={{ background: "linear-gradient(180deg,#274e22 0%,#17300f 100%)" }}>
      {/* gold hairline + faint acacia to tie into the redesigned sections */}
      <div aria-hidden="true" className="absolute top-0 left-0 right-0 h-px" style={{ background: "linear-gradient(90deg,transparent,rgba(196,143,43,.5) 20%,rgba(196,143,43,.5) 80%,transparent)" }} />
      <svg aria-hidden="true" viewBox="0 0 240 200" fill="none" stroke="#f5f0eb" strokeWidth={2.2} strokeLinecap="round" className="pointer-events-none absolute" style={{ right: -10, bottom: -14, width: "min(280px,30vw)", opacity: 0.04 }}>
        <path d="M120 200v-92" />
        <path d="M120 112c-26-6-52-24-70-30 16 14 42 28 62 32M120 112c26-6 54-22 72-28-18 14-46 26-66 30M120 96c-18-6-34-20-44-28 12 14 30 26 44 32M120 96c18-6 36-18 48-26-14 14-34 24-48 30" />
        <path d="M44 82c22-16 44-16 76-14 30 2 52-2 76 10-20-16-46-18-76-18-32 0-56 6-76 22Z" />
      </svg>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* About + Plan CTA */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <KabengoIcon width={32} height={32} color="#f5f0eb" />
              <h3 className="text-xl font-bold font-serif text-brand-warm">KABENGO SAFARIS</h3>
            </div>
            <p className="text-stone-300 text-sm leading-relaxed">{t("about")}</p>
            <Link href="/plan" className="inline-flex items-center gap-2 mt-5 rounded-full font-semibold text-sm transition-colors" style={{ background: "#c48f2b", color: "#3d1402", padding: "10px 20px" }}>
              {home("ctaCta")}
              <ArrowRight size={15} strokeWidth={2.4} />
            </Link>
          </div>

          {/* Quick Links — Explore + Company */}
          <div>
            <h4 className="text-lg font-semibold mb-4 text-brand-warm">{t("quickLinks")}</h4>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
              <ul className="space-y-2">
                {explore.map((link) => (
                  <li key={link.href}><Link href={link.href} className="text-stone-300 hover:text-white transition-colors text-sm">{link.label}</Link></li>
                ))}
              </ul>
              <ul className="space-y-2">
                {company.map((link) => (
                  <li key={link.href}><Link href={link.href} className="text-stone-300 hover:text-white transition-colors text-sm">{link.label}</Link></li>
                ))}
              </ul>
            </div>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-lg font-semibold mb-4 text-brand-warm">{t("contactInfo")}</h4>
            <ul className="space-y-3">
              <li className="flex items-center space-x-3">
                <Mail size={16} className="text-accent-gold flex-shrink-0" />
                <ObfuscatedEmail />
              </li>
              <li className="flex items-center space-x-3">
                <Phone size={16} className="text-accent-gold flex-shrink-0" />
                <ObfuscatedPhone />
              </li>
              <li className="flex items-center space-x-3">
                <span className="text-accent-gold flex-shrink-0"><WhatsAppIcon size={16} /></span>
                <a href="https://wa.me/255786345408" target="_blank" rel="noopener noreferrer" className="text-stone-300 hover:text-white transition-colors text-sm">{t("whatsapp")}</a>
              </li>
              <li className="flex items-start space-x-3 text-stone-300 text-sm">
                <MapPin size={16} className="text-accent-gold flex-shrink-0 mt-0.5" />
                <span>Arusha, Tanzania</span>
              </li>
            </ul>
          </div>

          {/* Newsletter & Social */}
          <div>
            <h4 className="text-lg font-semibold mb-4 text-brand-warm">{t("newsletter")}</h4>
            <FooterNewsletter />
            <div className="mt-6">
              <h4 className="text-sm font-semibold mb-3 text-brand-warm">{t("followUs")}</h4>
              {/* Confirmed profiles only; add Facebook/YouTube/X here once live */}
              <div className="flex space-x-3">
                <a href="https://www.instagram.com/kabengosafaris" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-accent-gold transition-colors" aria-label="Instagram"><Instagram size={18} /></a>
                <TripAdvisorIcon />
              </div>
              <div className="mt-4 w-full bg-white rounded-xl p-4 flex items-center justify-center">
                <TripAdvisorWidget />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="relative border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-stone-400 text-sm">{t("copyright", { year: new Date().getFullYear() })}</p>
          <div className="flex items-center gap-4">
            <Link href="/privacy-policy" className="text-stone-400 hover:text-white text-sm transition-colors">{t("privacy")}</Link>
            <span className="text-stone-600">·</span>
            <Link href="/terms" className="text-stone-400 hover:text-white text-sm transition-colors">{t("terms")}</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

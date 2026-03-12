"use client";

import { useState, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { motion } from "framer-motion";
import {
  Mail,
  Phone,
  MapPin,
  Send,
  CheckCircle,
  XCircle,
  MessageSquare,
  Clock,
  Globe,
  Sparkles,
} from "lucide-react";
import PageHero from "@/components/ui/PageHero";
import { apiClient } from "@/lib/api";

/* Client-side only contact details — not in static HTML for bot protection */
function useObfuscatedContact() {
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  const email = ready ? `${"info"}@${"kabengosafaris"}.com` : "…";
  const phone = ready ? ["+255", "786", "345", "408"].join(" ") : "…";
  const emailHref = ready ? `mailto:${email}` : "#";
  const phoneHref = ready ? `tel:${phone.replace(/\s/g, "")}` : "#";
  return { email, phone, emailHref, phoneHref, ready };
}

export default function ContactPage() {
  const t = useTranslations("contact");
  const locale = useLocale();
  const contact = useObfuscatedContact();
  const [form, setForm] = useState({ name: "", email: "", phone: "", subject: "", message: "" });
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setStatus("idle");
    try {
      const res = await apiClient.post("/public/contact", form, {
        headers: { "Accept-Language": locale },
      });
      if (res.data) {
        setStatus("success");
        setForm({ name: "", email: "", phone: "", subject: "", message: "" });
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    } finally {
      setSending(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const inputClass =
    "w-full px-4 py-3 rounded-lg border border-stone-200 bg-white focus:border-brand-brown focus:ring-1 focus:ring-brand-brown outline-none transition-colors text-sm";

  return (
    <>
      <PageHero heroPage="CONTACT" fallbackTitle={t("title")} fallbackSubtitle={t("subtitle")} />

      <section className="py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="grid grid-cols-1 lg:grid-cols-5 gap-0 rounded-2xl overflow-hidden shadow-lg"
          >
            {/* Left — Inspirational panel */}
            <div className="lg:col-span-2 bg-brand-brown p-10 lg:p-12 flex flex-col justify-between relative overflow-hidden">
              {/* Decorative circles */}
              <div className="absolute inset-0 opacity-10 pointer-events-none">
                <div className="absolute top-8 -left-4 w-40 h-40 border border-white/30 rounded-full" />
                <div className="absolute bottom-12 -right-8 w-56 h-56 border border-white/20 rounded-full" />
                <div className="absolute top-1/2 left-1/3 w-24 h-24 border border-white/20 rounded-full" />
              </div>

              <div className="relative z-10">
                <div className="w-14 h-14 bg-white/15 rounded-2xl flex items-center justify-center mb-8">
                  <MessageSquare size={24} className="text-white" />
                </div>
                <h2 className="text-3xl lg:text-4xl font-bold text-white font-serif leading-tight mb-4">
                  {t("formTitle")}
                </h2>
                <p className="text-white/75 leading-relaxed text-base">
                  {t("formSubtitle")}
                </p>
              </div>

              {/* Features */}
              <div className="relative z-10 mt-12 space-y-4">
                {[
                  { icon: Clock, text: t("featureResponse") },
                  { icon: Globe, text: t("featureMultilingual") },
                  { icon: Sparkles, text: t("featurePersonalized") },
                ].map((f, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-white/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <f.icon size={16} className="text-white/70" />
                    </div>
                    <span className="text-white/60 text-sm">{f.text}</span>
                  </div>
                ))}
              </div>

              {/* Contact info */}
              <div className="relative z-10 mt-10 pt-8 border-t border-white/15 space-y-3">
                <div className="flex items-center gap-3">
                  <Mail size={15} className="text-white/50 flex-shrink-0" />
                  {contact.ready ? (
                    <a href={contact.emailHref} className="text-white/60 hover:text-white text-sm transition-colors">
                      {contact.email}
                    </a>
                  ) : (
                    <span className="text-white/40 text-sm">…</span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <Phone size={15} className="text-white/50 flex-shrink-0" />
                  {contact.ready ? (
                    <a href={contact.phoneHref} className="text-white/60 hover:text-white text-sm transition-colors">
                      {contact.phone}
                    </a>
                  ) : (
                    <span className="text-white/40 text-sm">…</span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <MapPin size={15} className="text-white/50 flex-shrink-0" />
                  <span className="text-white/60 text-sm">{t("addressValue")}</span>
                </div>
              </div>
            </div>

            {/* Right — Form */}
            <div className="lg:col-span-3 bg-white p-8 lg:p-12">
              {status === "success" ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center justify-center h-full text-center py-12"
                >
                  <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mb-5">
                    <CheckCircle size={32} className="text-emerald-500" />
                  </div>
                  <h3 className="text-xl font-semibold text-stone-800 font-serif mb-2">
                    {t("thankYouTitle")}
                  </h3>
                  <p className="text-stone-500 text-sm max-w-sm">{t("success")}</p>
                  <button
                    onClick={() => setStatus("idle")}
                    className="mt-6 text-sm text-brand-brown font-medium hover:underline cursor-pointer"
                  >
                    {t("sendAnother")}
                  </button>
                </motion.div>
              ) : (
                <>
                  {status === "error" && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-700 text-sm"
                    >
                      <XCircle size={18} className="flex-shrink-0" /> {t("errorMessage")}
                    </motion.div>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-stone-700 mb-1.5">
                          {t("name")} *
                        </label>
                        <input
                          type="text"
                          name="name"
                          required
                          value={form.name}
                          onChange={handleChange}
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-stone-700 mb-1.5">
                          {t("email")} *
                        </label>
                        <input
                          type="email"
                          name="email"
                          required
                          value={form.email}
                          onChange={handleChange}
                          className={inputClass}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-stone-700 mb-1.5">
                          {t("phone")}
                        </label>
                        <input
                          type="tel"
                          name="phone"
                          value={form.phone}
                          onChange={handleChange}
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-stone-700 mb-1.5">
                          {t("subject")}
                        </label>
                        <input
                          type="text"
                          name="subject"
                          value={form.subject}
                          onChange={handleChange}
                          className={inputClass}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-stone-700 mb-1.5">
                        {t("message")} *
                      </label>
                      <textarea
                        name="message"
                        required
                        rows={5}
                        value={form.message}
                        onChange={handleChange}
                        className={`${inputClass} resize-none`}
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={sending}
                      className="w-full flex items-center justify-center px-8 py-3.5 bg-brand-brown text-white font-semibold rounded-lg hover:bg-brand-brown-light transition-all disabled:opacity-50 cursor-pointer text-sm"
                    >
                      <Send size={16} className="mr-2" />
                      {sending ? t("sending") : t("submit")}
                    </button>
                  </form>
                </>
              )}
            </div>
          </motion.div>
        </div>
      </section>
    </>
  );
}

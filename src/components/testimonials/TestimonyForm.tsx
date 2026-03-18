"use client";

import { useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { motion } from "framer-motion";
import { Send, CheckCircle, XCircle, Star, Quote, Pen, Compass } from "lucide-react";
import { apiClient } from "@/lib/api";
import GlassCombobox from "@/components/ui/GlassCombobox";

interface SafariOption {
  id: string;
  name: string;
  totalDays?: number;
}

export default function TestimonyForm() {
  const t = useTranslations("testimonials");
  const locale = useLocale();
  const [form, setForm] = useState({
    authorName: "",
    authorEmail: "",
    authorTitle: "",
    authorCountry: "",
    message: "",
    rating: 0,
    safariId: "",
  });
  const [hoverRating, setHoverRating] = useState(0);
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [safaris, setSafaris] = useState<SafariOption[]>([]);

  useEffect(() => {
    const fetchSafaris = async () => {
      try {
        const res = await apiClient.get("/public/safaris", {
          headers: { "Accept-Language": locale },
        });
        if (res.data.success) {
          const data = Array.isArray(res.data.data) ? res.data.data : res.data.data?.safaris || [];
          setSafaris(data.map((s: SafariOption & { totalDays?: number }) => ({ id: s.id, name: s.name, totalDays: s.totalDays })));
        }
      } catch {
        // Silently fail — safari dropdown is optional
      }
    };
    fetchSafaris();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.rating === 0) return;
    setSending(true);
    setStatus("idle");
    try {
      const res = await apiClient.post("/public/testimonies", form, {
        headers: { "Accept-Language": locale },
      });
      if (res.data) {
        setStatus("success");
        setForm({ authorName: "", authorEmail: "", authorTitle: "", authorCountry: "", message: "", rating: 0, safariId: "" });
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    } finally {
      setSending(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const inputClass = "w-full px-4 py-3 rounded-lg border border-stone-200 bg-white focus:border-brand-brown focus:ring-1 focus:ring-brand-brown outline-none transition-colors text-sm";

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="grid grid-cols-1 lg:grid-cols-5 gap-0 rounded-2xl overflow-hidden shadow-lg"
    >
      {/* Left — Inspirational panel */}
      <div className="lg:col-span-2 bg-brand-brown p-10 lg:p-12 flex flex-col justify-between relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-8 -left-4 w-40 h-40 border border-white/30 rounded-full" />
          <div className="absolute bottom-12 -right-8 w-56 h-56 border border-white/20 rounded-full" />
          <div className="absolute top-1/2 left-1/3 w-24 h-24 border border-white/20 rounded-full" />
        </div>

        <div className="relative z-10">
          <div className="w-14 h-14 bg-white/15 rounded-2xl flex items-center justify-center mb-8">
            <Pen size={24} className="text-white" />
          </div>
          <h2 className="text-3xl lg:text-4xl font-bold text-white font-serif leading-tight mb-4">
            {t("formTitle")}
          </h2>
          <p className="text-white/75 leading-relaxed text-base">
            {t("formSubtitle")}
          </p>
        </div>

        <div className="relative z-10 mt-12">
          <Quote size={28} className="text-white/30 mb-3" />
          <p className="text-white/60 text-sm italic font-serif leading-relaxed">
            {t("formInspiration")}
          </p>
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
            <h3 className="text-xl font-semibold text-stone-800 font-serif mb-2">{t("thankYouTitle")}</h3>
            <p className="text-stone-500 text-sm max-w-sm">{t("submitSuccess")}</p>
            <button
              onClick={() => setStatus("idle")}
              className="mt-6 text-sm text-brand-brown font-medium hover:underline cursor-pointer"
            >
              {t("writeAnother")}
            </button>
          </motion.div>
        ) : (
          <>
            {status === "error" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-700 text-sm">
                <XCircle size={18} className="flex-shrink-0" /> {t("submitError")}
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Rating */}
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-3">{t("yourRating")} *</label>
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setForm({ ...form, rating: star })}
                      className="p-1 transition-transform hover:scale-125 cursor-pointer"
                    >
                      <Star
                        size={32}
                        className={`transition-colors ${
                          star <= (hoverRating || form.rating)
                            ? "text-amber-400 fill-amber-400"
                            : "text-stone-200 hover:text-amber-200"
                        }`}
                      />
                    </button>
                  ))}
                  {form.rating > 0 && (
                    <span className="text-sm text-stone-400 ml-2 font-medium">{form.rating}/5</span>
                  )}
                </div>
                {form.rating === 0 && status === "error" && (
                  <p className="text-xs text-red-500 mt-1.5">{t("ratingRequired")}</p>
                )}
              </div>

              {/* Name & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1.5">{t("yourName")} *</label>
                  <input type="text" name="authorName" required value={form.authorName} onChange={handleChange} className={inputClass} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1.5">{t("yourEmail")} *</label>
                  <input type="email" name="authorEmail" required value={form.authorEmail} onChange={handleChange} placeholder={t("emailPlaceholder")} className={inputClass} />
                </div>
              </div>

              {/* Country */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1.5">{t("yourCountry")}</label>
                  <input type="text" name="authorCountry" value={form.authorCountry} onChange={handleChange} className={inputClass} />
                </div>
              </div>

              {/* Title & Safari */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1.5">{t("yourTitle")}</label>
                  <input type="text" name="authorTitle" value={form.authorTitle} onChange={handleChange} placeholder={t("titlePlaceholder")} className={inputClass} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1.5">{t("safariExperience")}</label>
                  <GlassCombobox
                    options={[
                      { value: "", label: t("selectSafari") },
                      ...safaris.map((s) => ({
                        value: s.id,
                        label: `${s.name}${s.totalDays ? ` (${s.totalDays} days)` : ""}`,
                      })),
                    ]}
                    value={form.safariId}
                    onChange={(value) => setForm({ ...form, safariId: value })}
                    placeholder={t("selectSafari")}
                    searchPlaceholder={t("selectSafari")}
                    icon={<Compass size={16} />}
                  />
                </div>
              </div>

              {/* Message */}
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1.5">{t("yourMessage")} *</label>
                <textarea
                  name="message"
                  required
                  rows={5}
                  value={form.message}
                  onChange={handleChange}
                  placeholder={t("messagePlaceholder")}
                  className={`${inputClass} resize-none`}
                />
              </div>

              <button
                type="submit"
                disabled={sending || form.rating === 0}
                className="w-full flex items-center justify-center px-8 py-3.5 bg-brand-brown text-white font-semibold rounded-lg hover:bg-brand-brown-light transition-all disabled:opacity-40 cursor-pointer text-sm"
              >
                <Send size={16} className="mr-2" />
                {sending ? t("submitting") : t("submitReview")}
              </button>
            </form>
          </>
        )}
      </div>
    </motion.div>
  );
}

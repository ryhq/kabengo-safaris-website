"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  CheckCircle,
  Users,
  Calendar,
  Loader2,
  Globe,
  Compass,
  MapPin,
  Binoculars,
  TreePine,
  ArrowRight,
  ArrowLeft,
  Sparkles,
} from "lucide-react";
import { submitBookingInquiry, fetchSafarisPaginated } from "@/lib/api";
import GlassSelect from "@/components/ui/GlassSelect";
import GlassCombobox from "@/components/ui/GlassCombobox";
import DateRangePicker from "@/components/ui/DateRangePicker";
import type { Itinerary, BookingInquiryPayload } from "@/types";

interface BookingInquiryFormProps {
  safariId?: string;
  safariName?: string;
}

const BUDGET_OPTIONS = [
  { value: "ULTRA_LUXURY", label: "Ultra Luxury" },
  { value: "LUXURY", label: "Luxury" },
  { value: "MID_RANGE", label: "Mid-Range" },
  { value: "BUDGET", label: "Budget" },
  { value: "BACKPACKER", label: "Backpacker" },
];

const TRIP_TYPE_OPTIONS = [
  { value: "PRIVATE", label: "Private" },
  { value: "GROUP", label: "Group" },
  { value: "CUSTOM", label: "Custom" },
  { value: "HONEYMOON", label: "Honeymoon" },
  { value: "FAMILY", label: "Family" },
  { value: "PHOTOGRAPHY", label: "Photography" },
  { value: "ADVENTURE", label: "Adventure" },
];

const STEPS = ["safari", "contact", "trip", "message"] as const;
type Step = (typeof STEPS)[number];

const STEP_ICONS: Record<Step, React.ElementType> = {
  safari: Compass,
  contact: Users,
  trip: Calendar,
  message: Send,
};

export default function BookingInquiryForm({ safariId }: BookingInquiryFormProps) {
  const t = useTranslations("bookingInquiry");
  const [step, setStep] = useState<Step>("safari");

  // Safari options
  const [safaris, setSafaris] = useState<Itinerary[]>([]);
  const [selectedSafari, setSelectedSafari] = useState(safariId || "");

  // Contact
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [country, setCountry] = useState("");

  // Trip
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [budgetCategory, setBudgetCategory] = useState("");
  const [tripType, setTripType] = useState("");

  // Message
  const [message, setMessage] = useState("");
  const [specialRequests, setSpecialRequests] = useState("");

  // Status
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");

  const safariOptions = useMemo(() => {
    const opts = [{ value: "", label: t("customSafari") }];
    safaris.forEach((s) => {
      opts.push({
        value: s.id,
        label: `${s.name}${s.totalDays ? ` (${s.totalDays} days)` : ""}`,
      });
    });
    return opts;
  }, [safaris, t]);

  const budgetOpts = useMemo(
    () => [{ value: "", label: t("selectBudget") }, ...BUDGET_OPTIONS],
    [t]
  );
  const tripTypeOpts = useMemo(
    () => [{ value: "", label: t("selectTripType") }, ...TRIP_TYPE_OPTIONS],
    [t]
  );

  const autoPopulateFromSafari = useCallback((id: string, list: Itinerary[]) => {
    const safari = list.find((s) => s.id === id);
    if (safari) {
      if (safari.tripType) setTripType(safari.tripType);
      if (safari.budgetCategory) setBudgetCategory(safari.budgetCategory);
    }
  }, []);

  useEffect(() => {
    fetchSafarisPaginated(0, 100, {}).then((data) => {
      const list = data?.safaris || (data?.content as Itinerary[]) || [];
      setSafaris(list);
      if (safariId && list.length > 0) {
        const match = list.find(
          (s: Itinerary) => s.id === safariId || s.code === safariId
        );
        if (match) {
          setSelectedSafari(match.id);
          autoPopulateFromSafari(match.id, list);
        }
      }
    }).catch(() => {});
  }, [safariId, autoPopulateFromSafari]);

  const handleSafariChange = useCallback((id: string) => {
    setSelectedSafari(id);
    if (id) {
      autoPopulateFromSafari(id, safaris);
    } else {
      setTripType("");
      setBudgetCategory("");
    }
  }, [safaris, autoPopulateFromSafari]);

  const currentIdx = STEPS.indexOf(step);
  const isFirst = currentIdx === 0;
  const isLast = currentIdx === STEPS.length - 1;

  const goNext = () => {
    if (!isLast) setStep(STEPS[currentIdx + 1]);
  };
  const goPrev = () => {
    if (!isFirst) setStep(STEPS[currentIdx - 1]);
  };

  // Simple validation per step
  const canProceed = (): boolean => {
    if (step === "contact") {
      return firstName.trim() !== "" && lastName.trim() !== "" && email.trim() !== "";
    }
    return true;
  };

  const handleSubmit = async () => {
    setStatus("sending");

    const payload: BookingInquiryPayload = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim(),
      phone: phone.trim() || undefined,
      country: country.trim() || undefined,
      adults,
      children,
      preferredStartDate: startDate || undefined,
      preferredEndDate: endDate || undefined,
      budgetCategory: budgetCategory || undefined,
      tripType: tripType || undefined,
      specialRequests: specialRequests.trim() || undefined,
      message: message.trim() || undefined,
      safariIdentifier: selectedSafari || undefined,
    };

    const result = await submitBookingInquiry(payload);

    if (result.status === "received") {
      setStatus("success");
    } else {
      setStatus("error");
      setTimeout(() => setStatus("idle"), 5000);
    }
  };

  const inputClass =
    "w-full px-4 py-3.5 rounded-xl border border-stone-200 bg-white text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green transition-all text-sm";
  const labelClass = "block text-sm font-medium text-stone-600 mb-1.5";

  // Left panel content per step
  const stepMeta: Record<Step, { title: string; desc: string; icon: React.ElementType; features: { icon: React.ElementType; text: string }[] }> = {
    safari: {
      title: t("safariSelection"),
      desc: t("selectSafari"),
      icon: Compass,
      features: [
        { icon: MapPin, text: "Serengeti, Ngorongoro, Zanzibar" },
        { icon: Binoculars, text: "Big Five wildlife encounters" },
        { icon: TreePine, text: "Pristine national parks" },
      ],
    },
    contact: {
      title: t("contactInfo"),
      desc: t("subtitle"),
      icon: Users,
      features: [
        { icon: Sparkles, text: "Personalized itinerary" },
        { icon: Globe, text: "24/7 expert support" },
        { icon: CheckCircle, text: "Free consultation" },
      ],
    },
    trip: {
      title: t("tripDetails"),
      desc: t("preferences"),
      icon: Calendar,
      features: [
        { icon: Users, text: "Private & group safaris" },
        { icon: Globe, text: "Flexible budgets" },
        { icon: Calendar, text: "Year-round departures" },
      ],
    },
    message: {
      title: t("message"),
      desc: t("specialRequests"),
      icon: Send,
      features: [
        { icon: CheckCircle, text: "Response within 24 hours" },
        { icon: Sparkles, text: "Tailor-made proposals" },
        { icon: MapPin, text: "Local expert guides" },
      ],
    },
  };

  const meta = stepMeta[step];

  if (status === "success") {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="rounded-2xl overflow-hidden shadow-xl"
      >
        <div className="bg-gradient-to-br from-brand-green via-brand-green-dark to-brand-green p-12 text-center text-white">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
          >
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10" />
            </div>
          </motion.div>
          <h3 className="text-3xl font-bold font-serif mb-3">
            {t("successTitle")}
          </h3>
          <p className="text-white/80 text-lg max-w-md mx-auto">{t("success")}</p>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-0 rounded-2xl overflow-hidden shadow-xl bg-white">
      {/* Left — Inspirational panel */}
      <div className="lg:col-span-2 bg-gradient-to-br from-brand-green via-brand-green-dark to-brand-secondary p-8 lg:p-10 flex flex-col justify-between relative overflow-hidden min-h-[200px] lg:min-h-0">
        {/* Decorative circles */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute top-8 -left-4 w-40 h-40 border border-white/30 rounded-full" />
          <div className="absolute bottom-12 -right-8 w-56 h-56 border border-white/20 rounded-full" />
          <div className="absolute top-1/2 left-1/3 w-24 h-24 border border-white/20 rounded-full" />
        </div>

        <div className="relative z-10">
          {/* Step indicator */}
          <div className="flex items-center gap-2 mb-8">
            {STEPS.map((s, i) => {
              const Icon = STEP_ICONS[s];
              const isActive = i === currentIdx;
              const isDone = i < currentIdx;
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStep(s)}
                  className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                    isActive
                      ? "bg-white text-brand-green scale-110"
                      : isDone
                        ? "bg-white/30 text-white"
                        : "bg-white/10 text-white/40"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </button>
              );
            })}
            <span className="text-white/40 text-xs ml-2">
              {currentIdx + 1}/{STEPS.length}
            </span>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.2 }}
            >
              <div className="w-14 h-14 bg-white/15 rounded-2xl flex items-center justify-center mb-6">
                <meta.icon className="w-7 h-7 text-white" />
              </div>
              <h2 className="text-2xl lg:text-3xl font-bold text-white font-serif leading-tight mb-3">
                {meta.title}
              </h2>
              <p className="text-white/70 leading-relaxed text-sm">
                {meta.desc}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Features */}
        <div className="relative z-10 mt-8 space-y-3">
          {meta.features.map((f, i) => (
            <motion.div
              key={`${step}-${i}`}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="flex items-center gap-3"
            >
              <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <f.icon className="w-4 h-4 text-white/70" />
              </div>
              <span className="text-white/60 text-sm">{f.text}</span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Right — Form */}
      <div className="lg:col-span-3 p-6 lg:p-10">
        <div>
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="min-h-[380px]"
            >
              {/* Step: Safari */}
              {step === "safari" && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-semibold text-stone-800 font-serif mb-1">
                      {t("safariSelection")}
                    </h3>
                    <p className="text-sm text-stone-500 mb-6">
                      {t("selectSafari")}
                    </p>
                  </div>
                  <div>
                    <label className={labelClass}>{t("selectSafari")}</label>
                    <GlassCombobox
                      options={safariOptions}
                      value={selectedSafari}
                      onChange={handleSafariChange}
                      placeholder={t("customSafari")}
                      searchPlaceholder={t("selectSafari")}
                      icon={<Compass className="w-4 h-4" />}
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}>{t("tripType")}</label>
                      <GlassSelect
                        options={tripTypeOpts}
                        value={tripType}
                        onChange={setTripType}
                        placeholder={t("selectTripType")}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>{t("budgetCategory")}</label>
                      <GlassSelect
                        options={budgetOpts}
                        value={budgetCategory}
                        onChange={setBudgetCategory}
                        placeholder={t("selectBudget")}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step: Contact */}
              {step === "contact" && (
                <div className="space-y-5">
                  <div>
                    <h3 className="text-xl font-semibold text-stone-800 font-serif mb-1">
                      {t("contactInfo")}
                    </h3>
                    <p className="text-sm text-stone-500 mb-6">
                      {t("subtitle")}
                    </p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}>{t("firstName")} *</label>
                      <input
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        required
                        className={inputClass}
                        placeholder={t("firstNamePlaceholder")}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>{t("lastName")} *</label>
                      <input
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        required
                        className={inputClass}
                        placeholder={t("lastNamePlaceholder")}
                      />
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>{t("email")} *</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className={inputClass}
                      placeholder={t("emailPlaceholder")}
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}>{t("phone")}</label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className={inputClass}
                        placeholder={t("phonePlaceholder")}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>{t("country")}</label>
                      <input
                        type="text"
                        value={country}
                        onChange={(e) => setCountry(e.target.value)}
                        className={inputClass}
                        placeholder={t("countryPlaceholder")}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step: Trip */}
              {step === "trip" && (
                <div className="space-y-5">
                  <div>
                    <h3 className="text-xl font-semibold text-stone-800 font-serif mb-1">
                      {t("tripDetails")}
                    </h3>
                    <p className="text-sm text-stone-500 mb-6">
                      {t("preferences")}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}>{t("adults")} *</label>
                      <input
                        type="number"
                        min={1}
                        value={adults}
                        onChange={(e) => setAdults(parseInt(e.target.value) || 1)}
                        required
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>{t("children")}</label>
                      <input
                        type="number"
                        min={0}
                        value={children}
                        onChange={(e) => setChildren(parseInt(e.target.value) || 0)}
                        className={inputClass}
                      />
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>{t("travelDates")}</label>
                    <DateRangePicker
                      startDate={startDate}
                      endDate={endDate}
                      onChangeStart={setStartDate}
                      onChangeEnd={setEndDate}
                      placeholder={t("selectDates")}
                    />
                  </div>
                </div>
              )}

              {/* Step: Message */}
              {step === "message" && (
                <div className="space-y-5">
                  <div>
                    <h3 className="text-xl font-semibold text-stone-800 font-serif mb-1">
                      {t("message")}
                    </h3>
                    <p className="text-sm text-stone-500 mb-6">
                      {t("specialRequests")}
                    </p>
                  </div>
                  <div>
                    <label className={labelClass}>{t("messagePlaceholder")}</label>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      rows={4}
                      className={`${inputClass} resize-none`}
                      placeholder={t("messagePlaceholder")}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>{t("specialRequests")}</label>
                    <textarea
                      value={specialRequests}
                      onChange={(e) => setSpecialRequests(e.target.value)}
                      rows={2}
                      className={`${inputClass} resize-none`}
                      placeholder={t("specialRequestsPlaceholder")}
                    />
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Error */}
          {status === "error" && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-red-600 text-sm mb-4"
            >
              {t("errorMessage")}
            </motion.p>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-6 pt-6 border-t border-stone-100">
            {!isFirst ? (
              <button
                type="button"
                onClick={goPrev}
                className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-stone-600 hover:text-stone-800 transition-colors rounded-xl hover:bg-stone-50 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                {t("back")}
              </button>
            ) : (
              <div />
            )}

            {isLast ? (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={status === "sending" || !canProceed()}
                className="flex items-center justify-center gap-2 px-8 py-3 bg-brand-green hover:bg-brand-green/90 text-white font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer text-sm"
              >
                {status === "sending" ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {t("sending")}
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    {t("submit")}
                  </>
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={goNext}
                disabled={!canProceed()}
                className="flex items-center gap-2 px-6 py-3 bg-brand-green hover:bg-brand-green/90 text-white font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer text-sm"
              >
                {t("next")}
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

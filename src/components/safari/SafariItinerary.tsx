"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import {
  Sun,
  Sunset,
  Moon,
  TreePine,
  Tent,
  Binoculars,
  PawPrint,
  Mountain,
  ArrowRight,
  BedDouble,
} from "lucide-react";
import type { ItineraryDay } from "@/types";

interface SafariItineraryProps {
  days: ItineraryDay[];
}

export default function SafariItinerary({ days }: SafariItineraryProps) {
  const t = useTranslations("safaris");
  const common = useTranslations("common");
  if (!days || days.length === 0) return null;

  return (
    <div>
      {/* Section header */}
      <div className="text-center mb-14">
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-sm font-semibold tracking-[0.2em] uppercase text-brand-green mb-3"
        >
          {t("detail.yourJourney")}
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-3xl sm:text-4xl font-bold text-stone-800 font-serif"
        >
          {t("detail.itinerary")}
        </motion.h2>
        <motion.div
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="w-16 h-0.5 bg-brand-green mx-auto mt-5"
        />
      </div>

      <div className="space-y-0">
        {days.map((day, index) => {
          const dayImage = day.dayImageUrl;
          const isEven = index % 2 === 0;

          return (
            <motion.article
              key={day.dayNumber}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="group"
            >
              {/* Day divider */}
              {index > 0 && (
                <div className="mb-8 mt-4">
                  <div className="h-px bg-gradient-to-r from-transparent via-stone-200 to-transparent" />
                </div>
              )}

              {/* Main card */}
              <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-stone-100 hover:shadow-md transition-shadow duration-500">
                {/* Hero section with day image */}
                {dayImage ? (
                  <div className={`grid ${isEven ? "lg:grid-cols-[1fr_1.2fr]" : "lg:grid-cols-[1.2fr_1fr]"}`}>
                    {/* Image side */}
                    <div className={`relative h-64 lg:h-auto lg:min-h-[340px] overflow-hidden ${!isEven ? "lg:order-2" : ""}`}>
                      <Image
                        src={dayImage}
                        alt={day.title || `${t("detail.day")} ${day.dayNumber}`}
                        fill
                        sizes="(max-width: 1024px) 100vw, 55vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent lg:bg-gradient-to-r lg:from-transparent lg:via-transparent lg:to-black/5" />

                      {/* Floating day number on image */}
                      <div className="absolute top-5 left-5">
                        <div className="w-14 h-14 rounded-2xl bg-white/95 backdrop-blur-sm flex flex-col items-center justify-center shadow-lg">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-brand-green leading-none">{t("detail.day")}</span>
                          <span className="text-xl font-bold text-stone-800 font-serif leading-none mt-0.5">{day.dayNumber}</span>
                        </div>
                      </div>

                      {/* Park names on image */}
                      {day.parks && day.parks.length > 0 && (
                        <div className="absolute bottom-4 left-5 right-5">
                          <div className="flex flex-wrap gap-2">
                            {day.parks.map((park) => (
                              <Link
                                key={park.parkSlug}
                                href={`/parks/${park.parkSlug}`}
                                className="text-xs font-medium bg-white/90 backdrop-blur-sm text-stone-700 px-3 py-1.5 rounded-full hover:bg-white transition-colors"
                              >
                                <TreePine size={11} className="inline mr-1.5 text-brand-green" />
                                {park.parkName}
                              </Link>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Content side */}
                    <div className={`p-7 lg:p-10 ${!isEven ? "lg:order-1" : ""}`}>
                      <DayContent day={day} showDayNumber={false} />
                    </div>
                  </div>
                ) : (
                  /* No image — full-width content */
                  <div className="p-7 lg:p-10">
                    <DayContent day={day} showDayNumber={true} />
                  </div>
                )}
              </div>

              {/* Spacer between cards */}
              <div className="h-8" />
            </motion.article>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Day Content Block ─── */

function DayContent({ day, showDayNumber }: { day: ItineraryDay; showDayNumber: boolean }) {
  const t = useTranslations("safaris");
  const common = useTranslations("common");
  return (
    <div className="space-y-6">
      {/* Title area */}
      <div>
        {showDayNumber && (
          <div className="flex items-center gap-4 mb-3">
            <div className="w-14 h-14 rounded-2xl bg-brand-green/5 border border-brand-green/10 flex flex-col items-center justify-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-brand-green leading-none">{t("detail.day")}</span>
              <span className="text-xl font-bold text-stone-800 font-serif leading-none mt-0.5">{day.dayNumber}</span>
            </div>
            {day.title && (
              <h3 className="text-xl lg:text-2xl font-bold text-stone-800 font-serif leading-snug">
                {day.title}
              </h3>
            )}
          </div>
        )}
        {!showDayNumber && day.title && (
          <h3 className="text-xl lg:text-2xl font-bold text-stone-800 font-serif leading-snug">
            {day.title}
          </h3>
        )}
      </div>

      {/* Description */}
      {day.description && (
        <p className="text-stone-600 leading-relaxed text-[15px]">
          <span className="text-2xl font-serif font-bold text-brand-green leading-none mr-[2px]">
            {day.description.charAt(0)}
          </span>
          {day.description.slice(1)}
        </p>
      )}

      {/* Time-of-day schedule — magazine column layout */}
      {(day.morningActivities || day.afternoonActivities || day.eveningActivities) && (() => {
        const count = [day.morningActivities, day.afternoonActivities, day.eveningActivities].filter(Boolean).length;
        const gridCols = count === 3 ? "sm:grid-cols-3" : count === 2 ? "sm:grid-cols-2" : "";
        return (
          <div className={`grid ${gridCols} gap-4`}>
            {day.morningActivities && (
              <TimeBlock
                icon={Sun}
                label={t("detail.morning")}
                text={day.morningActivities}
                gradient="from-amber-50 to-orange-50/50"
                accent="text-amber-500"
                border="border-amber-100"
              />
            )}
            {day.afternoonActivities && (
              <TimeBlock
                icon={Sunset}
                label={t("detail.afternoon")}
                text={day.afternoonActivities}
                gradient="from-orange-50 to-rose-50/50"
                accent="text-orange-500"
                border="border-orange-100"
              />
            )}
            {day.eveningActivities && (
              <TimeBlock
                icon={Moon}
                label={t("detail.evening")}
                text={day.eveningActivities}
                gradient="from-indigo-50 to-violet-50/50"
                accent="text-indigo-400"
                border="border-indigo-100"
              />
            )}
          </div>
        );
      })()}

      {/* Wildlife & Scenic as pull-quote style */}
      {(day.wildlifeHighlights || day.scenicHighlights) && (
        <div className={`grid ${day.wildlifeHighlights && day.scenicHighlights ? "sm:grid-cols-2" : ""} gap-4`}>
          {day.wildlifeHighlights && (
            <div className="relative pl-4 border-l-2 border-brand-green/30">
              <PawPrint size={14} className="text-brand-green mb-1.5" />
              <p className="text-sm text-stone-600 italic leading-relaxed">{day.wildlifeHighlights}</p>
            </div>
          )}
          {day.scenicHighlights && (
            <div className="relative pl-4 border-l-2 border-brand-brown/30">
              <Mountain size={14} className="text-brand-brown mb-1.5" />
              <p className="text-sm text-stone-600 italic leading-relaxed">{day.scenicHighlights}</p>
            </div>
          )}
        </div>
      )}

      {/* Activities */}
      {day.activities && day.activities.length > 0 && (
        <div>
          <h4 className="text-[11px] font-bold tracking-[0.2em] uppercase text-stone-400 mb-3 flex items-center gap-2">
            <Binoculars size={13} />
            {t("detail.experiences")}
          </h4>
          <div className="flex flex-wrap gap-2">
            {day.activities.map((activity) => (
              <Link
                key={activity.activitySlug}
                href={`/activities/${activity.activitySlug}`}
                className="group/act inline-flex items-center gap-2 bg-stone-50 hover:bg-brand-green/5 text-stone-700 pl-3 pr-4 py-2 rounded-full text-sm transition-all border border-stone-100 hover:border-brand-green/20"
              >
                <span className="w-5 h-5 rounded-full bg-brand-green/10 flex items-center justify-center flex-shrink-0">
                  <Binoculars size={10} className="text-brand-green" />
                </span>
                {activity.activityName}
                {activity.durationHours && (
                  <span className="text-[11px] text-stone-400">{String(activity.durationHours)}h</span>
                )}
                {activity.isOptional && (
                  <span className="text-[10px] font-semibold tracking-wider uppercase text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                    Optional
                  </span>
                )}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Accommodation — feature card */}
      {day.accommodations && day.accommodations.length > 0 && (
        <div>
          <h4 className="text-[11px] font-bold tracking-[0.2em] uppercase text-stone-400 mb-3 flex items-center gap-2">
            <BedDouble size={13} />
            {t("detail.whereYouStay")}
          </h4>
          <div className="flex flex-wrap gap-3">
            {day.accommodations.map((acc) => (
              <Link
                key={acc.accommodationSlug}
                href={`/accommodations/${acc.accommodationSlug}`}
                className="group/acc flex items-center gap-3 bg-gradient-to-r from-brand-brown/5 to-brand-cream hover:from-brand-brown/10 rounded-2xl pl-1.5 pr-5 py-1.5 transition-all border border-brand-brown/10 hover:border-brand-brown/20"
              >
                {acc.primaryImageUrl ? (
                  <Image
                    src={acc.primaryImageUrl}
                    alt={acc.accommodationName}
                    width={48}
                    height={48}
                    sizes="48px"
                    className="w-12 h-12 rounded-xl object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-brand-brown/10 flex items-center justify-center">
                    <Tent size={16} className="text-brand-brown/40" />
                  </div>
                )}
                <div>
                  <p className="text-sm font-semibold text-stone-700 group-hover/acc:text-brand-brown transition-colors">
                    {acc.accommodationName}
                  </p>
                  <p className="text-[11px] text-stone-400">{common("viewDetails")}</p>
                </div>
                <ArrowRight size={14} className="text-stone-300 group-hover/acc:text-brand-brown group-hover/acc:translate-x-0.5 transition-all ml-1" />
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Time Block (Morning / Afternoon / Evening) ─── */

function TimeBlock({
  icon: Icon,
  label,
  text,
  gradient,
  accent,
  border,
}: {
  icon: React.ElementType;
  label: string;
  text: string;
  gradient: string;
  accent: string;
  border: string;
}) {
  return (
    <div className={`bg-gradient-to-br ${gradient} rounded-xl p-4 border ${border}`}>
      <div className="flex items-center gap-2 mb-2">
        <Icon size={14} className={accent} />
        <span className={`text-[10px] font-bold tracking-[0.2em] uppercase ${accent}`}>
          {label}
        </span>
      </div>
      <p className="text-sm text-stone-600 leading-relaxed">{text}</p>
    </div>
  );
}

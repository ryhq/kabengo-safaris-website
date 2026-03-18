"use client";

import { useEffect, useState } from "react";
import { useParams, notFound } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import SafariDetailHero from "@/components/safari/SafariDetailHero";
import SafariInfoCards from "@/components/safari/SafariInfoCards";
import SafariDescription from "@/components/safari/SafariDescription";
import SafariItinerary from "@/components/safari/SafariItinerary";
import SafariDetailSkeleton from "@/components/safari/SafariDetailSkeleton";
import BookingSidebar, { MobileBookingBar } from "@/components/safari/BookingSidebar";
import SimilarSafaris from "@/components/safari/SimilarSafaris";
import { apiClient } from "@/lib/api";
import type { Itinerary } from "@/types";

export default function SafariDetailPage() {
  const params = useParams();
  const t = useTranslations("safaris");
  const locale = useLocale();
  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await apiClient.get(`/public/safaris/${params.id}`, {
          headers: { "Accept-Language": locale },
        });
        if (res.data.success) {
          setItinerary(res.data.data);
        }
      } catch (err) {
        console.error("Failed to fetch safari:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [params.id]);

  if (loading) return <SafariDetailSkeleton />;

  if (!itinerary) {
    notFound();
  }

  const heroImage = itinerary.primaryImageUrl || null;

  const allDayImages = (itinerary.days || [])
    .map((d) => d.dayImageUrl)
    .filter(Boolean) as string[];
  const featuredImage = allDayImages.find((img) => img !== heroImage) || allDayImages[0] || undefined;

  const getPriceInfo = () => {
    if (!itinerary.costSummary || itinerary.costSummary.length === 0) return null;
    const cost = itinerary.costSummary[0];
    if (!cost.grandTotalRack) return null;
    const totalPax = itinerary.totalPaxCount || 1;
    const perPerson = cost.grandTotalRack / totalPax;
    const currency = cost.currency || "USD";
    const wasPrice = Math.ceil(perPerson * 1.3);
    const paxLabel = itinerary.paxBreakdown && itinerary.paxBreakdown.length > 0
      ? itinerary.paxBreakdown.map(p => `${p.nationCategoryName || ""} ${p.ageCategoryName || ""}`.trim()).join(", ")
      : null;
    return { currency, perPerson, wasPrice, totalPax, paxLabel, formatted: `${currency} ${Math.ceil(perPerson).toLocaleString()}` };
  };

  const safariCode = (params.id as string) || itinerary.code || itinerary.id;
  const priceInfo = getPriceInfo();
  const price = priceInfo?.formatted || null;

  return (
    <div className="pb-20 lg:pb-0">
      <SafariDetailHero
        name={itinerary.name}
        startLocation={itinerary.startLocation}
        endLocation={itinerary.endLocation}
        tripTypeDisplayName={itinerary.tripTypeDisplayName}
        budgetCategoryDisplayName={itinerary.budgetCategoryDisplayName}
        heroImage={heroImage}
      />

      {/* Info Cards */}
      <section className="bg-brand-warm py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SafariInfoCards
            totalDays={itinerary.totalDays}
            totalNights={itinerary.totalNights}
            totalPaxCount={itinerary.totalPaxCount}
            startLocation={itinerary.startLocation}
            endLocation={itinerary.endLocation}
            price={price}
            wasPrice={priceInfo ? `${priceInfo.currency} ${priceInfo.wasPrice.toLocaleString()}` : undefined}
            paxLabel={priceInfo?.paxLabel || undefined}
          />
        </div>
      </section>

      {/* Description + Booking — featured image background, single joined card */}
      <section className="relative overflow-hidden">
        {/* Background image */}
        {featuredImage ? (
          <>
            <div
              className="absolute inset-0 bg-cover bg-center bg-no-repeat"
              style={{ backgroundImage: `url(${featuredImage})` }}
            />
            <div className="absolute inset-0 bg-black/50" />
          </>
        ) : (
          <div className="absolute inset-0 bg-brand-secondary" />
        )}

        <div className="relative z-10 py-14">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Single joined card: description left + booking right */}
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
              <div className="lg:grid lg:grid-cols-[1fr_300px]">
                {/* Left — description */}
                <div className="p-8 lg:p-10">
                  <SafariDescription
                    description={itinerary.description}
                    highlights={itinerary.highlights}
                    safariName={itinerary.name}
                  />
                </div>

                {/* Right — booking panel */}
                <div className="border-t lg:border-t-0 lg:border-l border-stone-100">
                  <BookingSidebar
                    safariCode={safariCode}
                    safariName={itinerary.name}
                    totalDays={itinerary.totalDays}
                    totalNights={itinerary.totalNights}
                    totalPaxCount={itinerary.totalPaxCount}
                    startLocation={itinerary.startLocation}
                    endLocation={itinerary.endLocation}
                    price={price}
                    wasPrice={priceInfo ? `${priceInfo.currency} ${priceInfo.wasPrice.toLocaleString()}` : undefined}
                    paxLabel={priceInfo?.paxLabel || undefined}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Day-by-Day Itinerary */}
      {itinerary.days && itinerary.days.length > 0 && (
        <section className="bg-brand-cream py-14">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <SafariItinerary days={itinerary.days} />
          </div>
        </section>
      )}

      {/* Similar Safaris */}
      <SimilarSafaris
        currentId={params.id as string}
        tripType={itinerary.tripType}
        budgetCategory={itinerary.budgetCategory}
      />

      {/* Mobile sticky bottom bar */}
      <MobileBookingBar
        safariCode={safariCode}
        safariName={itinerary.name}
        price={price}
        wasPrice={priceInfo ? `${priceInfo.currency} ${priceInfo.wasPrice.toLocaleString()}` : undefined}
      />
    </div>
  );
}

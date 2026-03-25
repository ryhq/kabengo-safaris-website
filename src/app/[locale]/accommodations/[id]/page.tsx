"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, notFound } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import AccommodationDetailHero from "@/components/accommodation/AccommodationDetailHero";
import AccommodationInfoCards from "@/components/accommodation/AccommodationInfoCards";
import AccommodationDescription from "@/components/accommodation/AccommodationDescription";
import AccommodationDetailSkeleton from "@/components/accommodation/AccommodationDetailSkeleton";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import NearbyAccommodations from "@/components/accommodation/NearbyAccommodations";
import ParkGallery from "@/components/park/ParkGallery";
import ParkLocationMap from "@/components/park/ParkLocationMap";
import { apiClient } from "@/lib/api";
const IMAGES_PAGE_SIZE = 6;

interface AccommodationImage {
  imageUrl: string;
  altText?: string;
  caption?: string;
  imageType?: string;
}

interface AccommodationDetail {
  name: string;
  slug: string;
  accommodationType?: string;
  accommodationTypeDisplayName?: string;
  category?: string;
  categoryDisplayName?: string;
  categoryApproximateStars?: number;
  region?: string;
  district?: string;
  location?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  totalRooms?: number;
  totalBeds?: number;
  maxGuests?: number;
  starRating?: number;
  shortDescription?: string;
  details?: string;
  amenities?: string;
  services?: string;
  nearbyAttractions?: string;
  checkInPolicy?: string;
  checkOutPolicy?: string;
  cancellationPolicy?: string;
  childPolicy?: string;
  petPolicy?: string;
  priceRange?: string;
  currency?: string;
  bestSeason?: string;
  operatingSeason?: string;
  tags?: string;
  website?: string;
  primaryImageUrl?: string;
}

export default function AccommodationDetailPage() {
  const params = useParams();
  const common = useTranslations("common");
  const t = useTranslations("accommodations");
  const nav = useTranslations("nav");
  const locale = useLocale();

  const [accommodation, setAccommodation] = useState<AccommodationDetail | null>(null);
  const [images, setImages] = useState<AccommodationImage[]>([]);
  const [totalImages, setTotalImages] = useState(0);
  const [imagesPage, setImagesPage] = useState(0);
  const [loadingMoreImages, setLoadingMoreImages] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await apiClient.get(`/public/accommodations/${params.id}`, {
          headers: { "Accept-Language": locale },
        });
        if (res.data.success) {
          setAccommodation(res.data.data?.accommodation || res.data.data);
          setImages(res.data.data?.images || []);
          setTotalImages(res.data.data?.totalImages || 0);
        }
      } catch (err) {
        console.error("Failed to fetch accommodation:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [params.id]);

  const loadMoreImages = useCallback(async () => {
    setLoadingMoreImages(true);
    try {
      const nextPage = imagesPage + 1;
      const res = await apiClient.get(`/public/accommodations/${params.id}/images?page=${nextPage}&size=${IMAGES_PAGE_SIZE}`, {
        headers: { "Accept-Language": locale },
      });
      if (res.data.success) {
        const newImages = res.data.data?.images || [];
        setImages((prev) => {
          const existingUrls = new Set(prev.map((img) => img.imageUrl));
          const unique = newImages.filter((img: AccommodationImage) => !existingUrls.has(img.imageUrl));
          return [...prev, ...unique];
        });
        setImagesPage(nextPage);
      }
    } catch (err) {
      console.error("Failed to load more images:", err);
    } finally {
      setLoadingMoreImages(false);
    }
  }, [imagesPage, params.id]);

  const heroImage = accommodation?.primaryImageUrl
    || (images.length > 0 ? images[0].imageUrl : null);

  const featuredImage = images.length > 1
    ? images[1].imageUrl
    : images.length > 0
      ? images[0].imageUrl
      : undefined;

  if (loading) return <AccommodationDetailSkeleton />;

  if (!accommodation) {
    notFound();
  }

  const hasCoordinates = accommodation.latitude != null && accommodation.longitude != null
    && accommodation.latitude !== 0 && accommodation.longitude !== 0;

  return (
    <div>
      <AccommodationDetailHero
        name={accommodation.name}
        heroImage={heroImage}
        typeDisplayName={accommodation.accommodationTypeDisplayName}
        region={[accommodation.region, accommodation.district].filter(Boolean).join(", ")}
      />

      <Breadcrumbs items={[
        { label: nav("home"), href: "/" },
        { label: nav("accommodations"), href: "/accommodations" },
        { label: accommodation.name },
      ]} />

      {/* Info Cards */}
      <section className="bg-brand-warm py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AccommodationInfoCards
            starRating={accommodation.starRating}
            totalRooms={accommodation.totalRooms}
            maxGuests={accommodation.maxGuests}
            priceRange={accommodation.priceRange}
            bestSeason={accommodation.bestSeason}
            checkInPolicy={accommodation.checkInPolicy}
            checkOutPolicy={accommodation.checkOutPolicy}
            categoryDisplayName={accommodation.categoryDisplayName}
          />
        </div>
      </section>

      {/* Description */}
      <section className="bg-white py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AccommodationDescription
            shortDescription={accommodation.shortDescription}
            details={accommodation.details}
            amenities={accommodation.amenities}
            services={accommodation.services}
            nearbyAttractions={accommodation.nearbyAttractions}
            tags={accommodation.tags}
            featuredImage={featuredImage}
            accommodationName={accommodation.name}
          />
        </div>
      </section>

      {/* Gallery */}
      {images.length > 0 && (
        <section className="bg-brand-cream py-14">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <ParkGallery
              images={images}
              parkName={accommodation.name}
              totalImages={totalImages}
              loadingMore={loadingMoreImages}
              onLoadMore={loadMoreImages}
            />
          </div>
        </section>
      )}

      {/* Policies */}
      {(accommodation.cancellationPolicy || accommodation.childPolicy || accommodation.petPolicy) && (
        <section className="bg-brand-warm py-14">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-stone-800 font-serif mb-6">{t("detail.policies")}</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {accommodation.cancellationPolicy && (
                <div className="bg-white rounded-xl p-5 border border-stone-100">
                  <h3 className="text-sm font-semibold text-stone-700 mb-2">{t("detail.cancellationPolicy")}</h3>
                  <p className="text-sm text-stone-500 whitespace-pre-line">{accommodation.cancellationPolicy}</p>
                </div>
              )}
              {accommodation.childPolicy && (
                <div className="bg-white rounded-xl p-5 border border-stone-100">
                  <h3 className="text-sm font-semibold text-stone-700 mb-2">{t("detail.childPolicy")}</h3>
                  <p className="text-sm text-stone-500 whitespace-pre-line">{accommodation.childPolicy}</p>
                </div>
              )}
              {accommodation.petPolicy && (
                <div className="bg-white rounded-xl p-5 border border-stone-100">
                  <h3 className="text-sm font-semibold text-stone-700 mb-2">{t("detail.petPolicy")}</h3>
                  <p className="text-sm text-stone-500 whitespace-pre-line">{accommodation.petPolicy}</p>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Map */}
      {hasCoordinates && (
        <section className="bg-white py-14">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <ParkLocationMap
              latitude={accommodation.latitude!}
              longitude={accommodation.longitude!}
              name={accommodation.name}
            />
          </div>
        </section>
      )}

      {/* Nearby Accommodations */}
      <NearbyAccommodations currentSlug={accommodation.slug} region={accommodation.region} />

      {/* CTA */}
      <section className="bg-brand-brown py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-white font-serif mb-4">
            Interested in {accommodation.name}?
          </h2>
          <p className="text-white/70 mb-6">Contact us to book your stay or learn more about availability.</p>
          <Link
            href="/contact"
            className="inline-flex items-center px-8 py-4 bg-white text-brand-brown font-semibold rounded-lg hover:bg-brand-cream transition-all"
          >
            {common("contactUs")}
          </Link>
        </div>
      </section>
    </div>
  );
}

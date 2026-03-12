"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, notFound } from "next/navigation";
import { useLocale } from "next-intl";
import ActivityDetailHero from "@/components/activity/ActivityDetailHero";
import ActivityInfoCards from "@/components/activity/ActivityInfoCards";
import ActivityDescription from "@/components/activity/ActivityDescription";
import ActivityDetailSkeleton from "@/components/activity/ActivityDetailSkeleton";
import ActivityParks from "@/components/activity/ActivityParks";
import ParkGallery from "@/components/park/ParkGallery";
import { apiClient } from "@/lib/api";
const IMAGES_PAGE_SIZE = 6;
const PARKS_PAGE_SIZE = 3;

interface ActivityImage {
  id: string;
  imageUrl: string;
  altText?: string;
  caption?: string;
  imageType?: string;
}

interface ActivityDetail {
  id: string;
  name: string;
  slug?: string;
  description?: string;
  detailedDescription?: string;
  primaryImageUrl?: string;
  tags?: string;
  seasonAvailability?: string;
  minimumAge?: number;
  maximumParticipants?: number;
  equipmentRequired?: string;
  safetyInformation?: string;
}

interface ParkItem {
  id: string;
  slug?: string;
  name: string;
  shortDescription?: string;
  region?: string;
  primaryImageUrl?: string;
}

export default function ActivityDetailPage() {
  const params = useParams();
  const locale = useLocale();

  const [activity, setActivity] = useState<ActivityDetail | null>(null);
  const [images, setImages] = useState<ActivityImage[]>([]);
  const [totalImages, setTotalImages] = useState(0);
  const [imagesPage, setImagesPage] = useState(0);
  const [loadingMoreImages, setLoadingMoreImages] = useState(false);

  const [parks, setParks] = useState<ParkItem[]>([]);
  const [totalParks, setTotalParks] = useState(0);
  const [parksPage, setParksPage] = useState(0);
  const [loadingMoreParks, setLoadingMoreParks] = useState(false);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await apiClient.get(`/public/activities/${params.id}`, {
          headers: { "Accept-Language": locale },
        });
        if (res.data.success) {
          setActivity(res.data.data?.activity || res.data.data);
          setImages(res.data.data?.images || []);
          setTotalImages(res.data.data?.totalImages || 0);
        }
      } catch (err) {
        console.error("Failed to fetch activity:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [params.id]);

  useEffect(() => {
    const fetchParks = async () => {
      try {
        const res = await apiClient.get(`/public/activities/${params.id}/parks?page=0&size=${PARKS_PAGE_SIZE}`, {
          headers: { "Accept-Language": locale },
        });
        if (res.data.success) {
          setParks(res.data.data?.parks || []);
          setTotalParks(res.data.data?.totalItems || 0);
        }
      } catch (err) {
        console.error("Failed to fetch activity parks:", err);
      }
    };
    fetchParks();
  }, [params.id]);

  const loadMoreImages = useCallback(async () => {
    setLoadingMoreImages(true);
    try {
      const nextPage = imagesPage + 1;
      const res = await apiClient.get(`/public/activities/${params.id}/images?page=${nextPage}&size=${IMAGES_PAGE_SIZE}`, {
        headers: { "Accept-Language": locale },
      });
      if (res.data.success) {
        const newImages = res.data.data?.images || [];
        setImages((prev) => {
          const existingIds = new Set(prev.map((img) => img.id));
          const unique = newImages.filter((img: ActivityImage) => !existingIds.has(img.id));
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

  const loadMoreParks = useCallback(async () => {
    setLoadingMoreParks(true);
    try {
      const nextPage = parksPage + 1;
      const res = await apiClient.get(`/public/activities/${params.id}/parks?page=${nextPage}&size=${PARKS_PAGE_SIZE}`, {
        headers: { "Accept-Language": locale },
      });
      if (res.data.success) {
        const newParks = res.data.data?.parks || [];
        setParks((prev) => {
          const existingIds = new Set(prev.map((p) => p.id));
          const unique = newParks.filter((p: ParkItem) => !existingIds.has(p.id));
          return [...prev, ...unique];
        });
        setParksPage(nextPage);
      }
    } catch (err) {
      console.error("Failed to load more parks:", err);
    } finally {
      setLoadingMoreParks(false);
    }
  }, [parksPage, params.id]);

  const heroImage = activity?.primaryImageUrl
    || (images.length > 0 ? images[0].imageUrl : null);

  const featuredImage = images.length > 1
    ? images[1].imageUrl
    : images.length > 0
      ? images[0].imageUrl
      : undefined;

  if (loading) return <ActivityDetailSkeleton />;

  if (!activity) {
    notFound();
  }

  return (
    <div>
      <ActivityDetailHero
        name={activity.name}
        heroImage={heroImage}
      />

      {/* Info Cards */}
      <section className="bg-brand-warm py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ActivityInfoCards
            seasonAvailability={activity.seasonAvailability}
            minimumAge={activity.minimumAge}
            maximumParticipants={activity.maximumParticipants}
            equipmentRequired={activity.equipmentRequired}
          />
        </div>
      </section>

      {/* Description */}
      <section className="bg-white py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ActivityDescription
            description={activity.description}
            detailedDescription={activity.detailedDescription}
            safetyInformation={activity.safetyInformation}
            tags={activity.tags}
            featuredImage={featuredImage}
            activityName={activity.name}
          />
        </div>
      </section>

      {/* Gallery — paginated */}
      {images.length > 0 && (
        <section className="bg-brand-cream py-14">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <ParkGallery
              images={images}
              parkName={activity.name}
              totalImages={totalImages}
              loadingMore={loadingMoreImages}
              onLoadMore={loadMoreImages}
            />
          </div>
        </section>
      )}

      {/* Parks Offering This Activity */}
      {parks.length > 0 && (
        <section className="bg-brand-warm py-14">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <ActivityParks
              parks={parks}
              totalParks={totalParks}
              loadingMore={loadingMoreParks}
              onLoadMore={loadMoreParks}
              pageSize={PARKS_PAGE_SIZE}
            />
          </div>
        </section>
      )}
    </div>
  );
}

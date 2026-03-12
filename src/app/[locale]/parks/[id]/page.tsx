"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, notFound } from "next/navigation";
import { useLocale } from "next-intl";
import ParkDetailHero from "@/components/park/ParkDetailHero";
import ParkInfoCards from "@/components/park/ParkInfoCards";
import ParkDescription from "@/components/park/ParkDescription";
import ParkGallery from "@/components/park/ParkGallery";
import ParkActivities from "@/components/park/ParkActivities";
import ParkLocationMap from "@/components/park/ParkLocationMap";
import ParkDetailSkeleton from "@/components/park/ParkDetailSkeleton";
import { apiClient } from "@/lib/api";
const IMAGES_PAGE_SIZE = 6;
const ACTIVITIES_PAGE_SIZE = 3;

interface ParkImage {
  id: string;
  imageUrl: string;
  altText?: string;
  caption?: string;
  imageType?: string;
}

interface ParkDetail {
  id: string;
  name: string;
  slug?: string;
  parkType?: string;
  region?: string;
  district?: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  elevation?: string;
  size?: string;
  shortDescription?: string;
  fullDescription?: string;
  history?: string;
  ecosystem?: string;
  wildlife?: string;
  vegetation?: string;
  bestTimeToVisit?: string;
  openingHours?: string;
  accessInformation?: string;
  tags?: string;
  primaryImageUrl?: string;
}

interface ActivityItem {
  id: string;
  name: string;
  description?: string;
  primaryImage?: string;
}

export default function ParkDetailPage() {
  const params = useParams();
  const locale = useLocale();

  const [park, setPark] = useState<ParkDetail | null>(null);
  const [images, setImages] = useState<ParkImage[]>([]);
  const [totalImages, setTotalImages] = useState(0);
  const [imagesPage, setImagesPage] = useState(0);
  const [loadingMoreImages, setLoadingMoreImages] = useState(false);

  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [totalActivities, setTotalActivities] = useState(0);
  const [activitiesPage, setActivitiesPage] = useState(0);
  const [loadingMoreActivities, setLoadingMoreActivities] = useState(false);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await apiClient.get(`/public/parks/${params.id}`, {
          headers: { "Accept-Language": locale },
        });
        if (res.data.success) {
          setPark(res.data.data?.park || res.data.data);
          setImages(res.data.data?.images || []);
          setTotalImages(res.data.data?.totalImages || 0);
        }
      } catch (err) {
        console.error("Failed to fetch park:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [params.id]);

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const res = await apiClient.get(`/public/parks/${params.id}/activities?page=0&size=${ACTIVITIES_PAGE_SIZE}`, {
          headers: { "Accept-Language": locale },
        });
        if (res.data.success) {
          setActivities(res.data.data?.activities || []);
          setTotalActivities(res.data.data?.totalItems || 0);
        }
      } catch (err) {
        console.error("Failed to fetch park activities:", err);
      }
    };
    fetchActivities();
  }, [params.id]);

  const loadMoreImages = useCallback(async () => {
    setLoadingMoreImages(true);
    try {
      const nextPage = imagesPage + 1;
      const res = await apiClient.get(`/public/parks/${params.id}/images?page=${nextPage}&size=${IMAGES_PAGE_SIZE}`, {
        headers: { "Accept-Language": locale },
      });
      if (res.data.success) {
        const newImages = res.data.data?.images || [];
        setImages((prev) => {
          const existingIds = new Set(prev.map((img) => img.id));
          const unique = newImages.filter((img: ParkImage) => !existingIds.has(img.id));
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

  const loadMoreActivities = useCallback(async () => {
    setLoadingMoreActivities(true);
    try {
      const nextPage = activitiesPage + 1;
      const res = await apiClient.get(`/public/parks/${params.id}/activities?page=${nextPage}&size=${ACTIVITIES_PAGE_SIZE}`, {
        headers: { "Accept-Language": locale },
      });
      if (res.data.success) {
        const newActivities = res.data.data?.activities || [];
        setActivities((prev) => {
          const existingIds = new Set(prev.map((a) => a.id));
          const unique = newActivities.filter((a: ActivityItem) => !existingIds.has(a.id));
          return [...prev, ...unique];
        });
        setActivitiesPage(nextPage);
      }
    } catch (err) {
      console.error("Failed to load more activities:", err);
    } finally {
      setLoadingMoreActivities(false);
    }
  }, [activitiesPage, params.id]);

  const heroImage = park?.primaryImageUrl
    || (images.length > 0 ? images[0].imageUrl : null);

  // Pick a featured image for the description section (second image if available, else first)
  const featuredImage = images.length > 1
    ? images[1].imageUrl
    : images.length > 0
      ? images[0].imageUrl
      : undefined;

  if (loading) return <ParkDetailSkeleton />;

  if (!park) {
    notFound();
  }

  const hasCoordinates = park.latitude != null && park.longitude != null && park.latitude !== 0 && park.longitude !== 0;

  return (
    <div>
      <ParkDetailHero
        name={park.name}
        location={park.location}
        region={park.region}
        district={park.district}
        heroImage={heroImage}
      />

      {/* Info Cards */}
      <section className="bg-brand-warm py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ParkInfoCards
            size={park.size}
            elevation={park.elevation}
            openingHours={park.openingHours}
            bestTimeToVisit={park.bestTimeToVisit}
          />
        </div>
      </section>

      {/* Description */}
      <section className="bg-white py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ParkDescription
            shortDescription={park.shortDescription}
            fullDescription={park.fullDescription}
            wildlife={park.wildlife}
            vegetation={park.vegetation}
            ecosystem={park.ecosystem}
            history={park.history}
            accessInformation={park.accessInformation}
            tags={park.tags}
            featuredImage={featuredImage}
            parkName={park.name}
          />
        </div>
      </section>

      {/* Gallery */}
      {images.length > 0 && (
        <section className="bg-brand-cream py-14">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <ParkGallery
              images={images}
              parkName={park.name}
              totalImages={totalImages}
              loadingMore={loadingMoreImages}
              onLoadMore={loadMoreImages}
            />
          </div>
        </section>
      )}

      {/* Activities */}
      {activities.length > 0 && (
        <section className="bg-brand-warm py-14">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <ParkActivities
              activities={activities}
              totalActivities={totalActivities}
              loadingMore={loadingMoreActivities}
              onLoadMore={loadMoreActivities}
              pageSize={ACTIVITIES_PAGE_SIZE}
            />
          </div>
        </section>
      )}

      {/* Map */}
      {hasCoordinates && (
        <section className="bg-white py-14">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <ParkLocationMap
              latitude={park.latitude!}
              longitude={park.longitude!}
              name={park.name}
            />
          </div>
        </section>
      )}
    </div>
  );
}

import axios from "axios";
import type { Itinerary, Park, Accommodation, Activity, Testimony, Hero, ApiResponse, HomepageData, PaginatedData, BookingInquiryPayload } from "@/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4450/api";

/** Current locale for API requests — set via setApiLocale() */
let currentLocale = "en";

/** Set the locale used for Accept-Language header on all API requests */
export function setApiLocale(locale: string) {
  currentLocale = locale;
}

/** Get the current API locale */
export function getApiLocale() {
  return currentLocale;
}

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Automatically add Accept-Language header to every axios request (only if not already set explicitly)
apiClient.interceptors.request.use((config) => {
  if (!config.headers["Accept-Language"]) {
    config.headers["Accept-Language"] = currentLocale;
  }
  return config;
});

// Public endpoints (no auth required)

export async function fetchHomepageData(locale?: string): Promise<HomepageData> {
  const fallback: HomepageData = {
    heroes: [], safaris: [], safarisTotalItems: 0,
    parks: [], parksTotalItems: 0,
    activities: [], activitiesTotalItems: 0,
    testimonies: [], testimoniesTotalItems: 0,
  };
  try {
    const response = await apiClient.get<ApiResponse<HomepageData>>("/public/homepage", locale ? {
      headers: { "Accept-Language": locale },
    } : undefined);
    return response.data.data || fallback;
  } catch {
    console.warn("[api] Homepage data unavailable – backend may be offline");
    return fallback;
  }
}

export async function fetchParks(): Promise<Park[]> {
  try {
    const response = await apiClient.get<ApiResponse<Park[]>>("/public/parks");
    return response.data.data || [];
  } catch (error) {
    console.error("Error fetching parks:", error);
    return [];
  }
}

export async function fetchParkByIdentifier(identifier: string): Promise<Park | null> {
  try {
    const response = await apiClient.get<ApiResponse<Park>>(`/public/parks/${identifier}`);
    return response.data.data || null;
  } catch (error) {
    console.error("Error fetching park:", error);
    return null;
  }
}

export async function fetchAccommodations(): Promise<Accommodation[]> {
  try {
    const response = await apiClient.get<ApiResponse<Accommodation[]>>("/public/accommodations");
    return response.data.data || [];
  } catch (error) {
    console.error("Error fetching accommodations:", error);
    return [];
  }
}

export async function fetchAccommodationByIdentifier(identifier: string): Promise<Accommodation | null> {
  try {
    const response = await apiClient.get<ApiResponse<Accommodation>>(`/public/accommodations/${identifier}`);
    return response.data.data || null;
  } catch (error) {
    console.error("Error fetching accommodation:", error);
    return null;
  }
}

export async function fetchTestimonies(): Promise<Testimony[]> {
  try {
    const response = await apiClient.get<ApiResponse<Testimony[]>>("/public/testimonies");
    return response.data.data || [];
  } catch (error) {
    console.error("Error fetching testimonies:", error);
    return [];
  }
}

export async function fetchFeaturedTestimonies(): Promise<Testimony[]> {
  try {
    const response = await apiClient.get<ApiResponse<Testimony[]>>("/public/testimonies/featured");
    return response.data.data || [];
  } catch (error) {
    console.error("Error fetching featured testimonies:", error);
    return [];
  }
}

export async function fetchHeroes(): Promise<Hero[]> {
  try {
    const response = await apiClient.get<ApiResponse<Hero[]>>("/public/heroes");
    return response.data.data || [];
  } catch (error) {
    console.error("Error fetching heroes:", error);
    return [];
  }
}

export async function submitContactInquiry(data: {
  name: string;
  email: string;
  phone?: string;
  safariInterest?: string;
  message: string;
  preferredDates?: string;
}): Promise<boolean> {
  try {
    await apiClient.post("/public/contact-inquiries", data);
    return true;
  } catch (error) {
    console.error("Error submitting contact inquiry:", error);
    return false;
  }
}

// Safari/Itinerary endpoints (Itineraries exposed as "Safaris" to public)

export async function fetchSafarisPaginated(
  page: number,
  size: number,
  params?: { tripType?: string; budgetCategory?: string; keyword?: string }
): Promise<PaginatedData<Itinerary> & { safaris: Itinerary[] }> {
  const fallback = { safaris: [], currentPage: 0, totalPages: 0, totalItems: 0, pageSize: size };
  try {
    const query = new URLSearchParams();
    query.set("page", String(page));
    query.set("size", String(size));
    if (params?.tripType) query.set("tripType", params.tripType);
    if (params?.budgetCategory) query.set("budgetCategory", params.budgetCategory);
    if (params?.keyword) query.set("keyword", params.keyword);
    const response = await apiClient.get<ApiResponse<PaginatedData<Itinerary> & { safaris: Itinerary[] }>>(`/public/safaris?${query}`);
    return response.data.data || fallback;
  } catch (error) {
    console.error("Error fetching safaris:", error);
    return fallback;
  }
}

export async function fetchSafariByIdentifier(identifier: string): Promise<Itinerary | null> {
  try {
    const response = await apiClient.get<ApiResponse<Itinerary>>(`/public/safaris/${identifier}`);
    return response.data.data || null;
  } catch (error) {
    console.error("Error fetching safari:", error);
    return null;
  }
}

// Paginated fetchers for "Load More"

export async function fetchParksPaginated(page: number, size: number): Promise<PaginatedData<Park> & { parks: Park[] }> {
  const fallback = { parks: [], currentPage: 0, totalPages: 0, totalItems: 0, pageSize: size };
  try {
    const response = await apiClient.get<ApiResponse<PaginatedData<Park> & { parks: Park[] }>>(`/public/parks?page=${page}&size=${size}`);
    return response.data.data || fallback;
  } catch (error) {
    console.error("Error fetching paginated parks:", error);
    return fallback;
  }
}

export async function fetchTestimoniesPaginated(page: number, size: number): Promise<PaginatedData<Testimony> & { testimonies: Testimony[] }> {
  const fallback = { testimonies: [], currentPage: 0, totalPages: 0, totalItems: 0, pageSize: size };
  try {
    const response = await apiClient.get<ApiResponse<PaginatedData<Testimony> & { testimonies: Testimony[] }>>(`/public/testimonies?page=${page}&size=${size}`);
    return response.data.data || fallback;
  } catch (error) {
    console.error("Error fetching paginated testimonies:", error);
    return fallback;
  }
}

export async function fetchActivitiesPaginated(page: number, size: number): Promise<PaginatedData<Activity> & { activities: Activity[] }> {
  const fallback = { activities: [], currentPage: 0, totalPages: 0, totalItems: 0, pageSize: size };
  try {
    const response = await apiClient.get<ApiResponse<PaginatedData<Activity> & { activities: Activity[] }>>(`/public/activities?page=${page}&size=${size}`);
    return response.data.data || fallback;
  } catch (error) {
    console.error("Error fetching paginated activities:", error);
    return fallback;
  }
}

export async function subscribeToNewsletter(email: string, name?: string): Promise<{ status: string; message: string }> {
  try {
    const res = await apiClient.post("/public/newsletter/subscribe", { email, name, locale: getApiLocale() });
    return res.data;
  } catch (err) {
    console.error("[api] Newsletter subscription failed:", err);
    return { status: "error", message: "Failed to subscribe. Please try again." };
  }
}

export async function submitBookingInquiry(
  data: BookingInquiryPayload
): Promise<{ status: string; message: string }> {
  try {
    const res = await apiClient.post("/public/booking-inquiries", {
      ...data,
      locale: getApiLocale(),
    });
    return res.data;
  } catch (err) {
    console.error("[api] Booking inquiry failed:", err);
    return { status: "error", message: "Failed to submit. Please try again." };
  }
}

// Itinerary (Safari Package template) - displayed as "Safari" to the public
export interface Itinerary {
  id: string;
  name: string;
  code?: string;
  status?: string;
  statusDisplayName?: string;
  tripType?: string;
  tripTypeDisplayName?: string;
  tripTypeDescription?: string;
  budgetCategory?: string;
  budgetCategoryDisplayName?: string;
  budgetCategoryDescription?: string;
  budgetCategoryTier?: number;
  totalDays?: number;
  totalNights?: number;
  isDayTrip?: boolean;
  carCount?: number;
  description?: string;
  highlights?: string;
  startLocation?: string;
  endLocation?: string;
  totalPaxCount?: number;
  totalDaysCount?: number;
  primaryImageUrl?: string;
  costSummary?: CostSummary[];
  paxBreakdown?: PaxBreakdown[];
  days?: ItineraryDay[];
}

export interface CostSummary {
  currency: string;
  accommodationRack?: number;
  parkFeesRack?: number;
  activitiesRack?: number;
  grandTotalRack?: number;
}

export interface PaxBreakdown {
  nationCategoryName?: string;
  ageCategoryName?: string;
  count?: number;
}

export interface ItineraryDay {
  dayNumber: number;
  dayTag?: string;
  title?: string;
  description?: string;
  morningActivities?: string;
  afternoonActivities?: string;
  eveningActivities?: string;
  wildlifeHighlights?: string;
  scenicHighlights?: string;
  specialNotes?: string;
  startLocation?: string;
  endLocation?: string;
  distanceKm?: number;
  isOvernight?: boolean;
  mealsIncluded?: string;
  dayImageUrl?: string;
  parks?: ItineraryDayPark[];
  activities?: ItineraryDayActivity[];
  accommodations?: ItineraryDayAccommodation[];
}

export interface ItineraryDayPark {
  parkId: string;
  parkName: string;
  primaryImageUrl?: string;
}

export interface ItineraryDayActivity {
  activityId: string;
  activityName: string;
  durationHours?: number;
  isOptional?: boolean;
}

export interface ItineraryDayAccommodation {
  accommodationId: string;
  accommodationName: string;
  primaryImageUrl?: string;
}

export interface Park {
  id: string;
  name: string;
  slug?: string;
  parkType?: string;
  region?: string;
  shortDescription?: string;
  primaryImageUrl?: string;
}

export interface Accommodation {
  id: string;
  name: string;
  slug?: string;
  accommodationType?: string;
  accommodationTypeDisplayName?: string;
  accommodationTypeDescription?: string;
  category?: string;
  categoryDisplayName?: string;
  categoryDescription?: string;
  categoryApproximateStars?: number;
  region?: string;
  district?: string;
  location?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  elevation?: string;
  totalRooms?: number;
  totalBeds?: number;
  maxGuests?: number;
  starRating?: number;
  shortDescription?: string;
  details?: string;
  amenities?: string;
  services?: string;
  nearbyAttractions?: string;
  termsAndConditions?: string;
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
  logoUrl?: string;
  primaryImageUrl?: string;
  imageCount?: number;
  roomTypeCount?: number;
  roomStandardCount?: number;
  boardTypeCount?: number;
}

export interface Activity {
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

export interface Testimony {
  id: string;
  authorName: string;
  authorTitle: string;
  authorCountry: string;
  message: string;
  rating: number;
  source: string;
  reviewDate: string;
  isApproved: boolean;
  isFeatured: boolean;
  isActive: boolean;
  isVerifiedBooking: boolean;
  primaryImageUrl?: string;
}

export interface Hero {
  id: string;
  title: string;
  subtitle: string;
  description?: string;
  ctaText?: string;
  ctaLink?: string;
  overlayColor?: string;
  overlayOpacity?: number;
  textAlignment?: string;
  cssClasses?: string;
  primaryImageUrl?: string;
  imageCount?: number;
}

export interface HeroImage {
  id: string;
  heroId: string;
  imageUrl: string;
  altText: string;
  displayOrder: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface PaginatedData<T> {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  [key: string]: T[] | number;
}

export interface HomepageData {
  heroes: Hero[];
  safaris: Itinerary[];
  safarisTotalItems: number;
  parks: Park[];
  parksTotalItems: number;
  activities: Activity[];
  activitiesTotalItems: number;
  testimonies: Testimony[];
  testimoniesTotalItems: number;
}

export interface BookingInquiryPayload {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  country?: string;
  adults: number;
  children: number;
  preferredStartDate?: string;
  preferredEndDate?: string;
  budgetCategory?: string;
  tripType?: string;
  specialRequests?: string;
  message?: string;
  safariIdentifier?: string;
  locale?: string;
}

"use client";

export default function AccommodationDetailSkeleton() {
  return (
    <div className="animate-pulse">
      {/* Hero skeleton */}
      <div className="h-[70vh] min-h-[500px] bg-stone-200" />

      {/* Info cards */}
      <div className="bg-brand-warm py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-brand-cream rounded-xl p-4 h-24" />
            ))}
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="bg-white py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-10">
            <div className="space-y-4">
              <div className="h-6 bg-stone-100 rounded w-3/4" />
              <div className="h-4 bg-stone-100 rounded w-full" />
              <div className="h-4 bg-stone-100 rounded w-5/6" />
              <div className="h-4 bg-stone-100 rounded w-2/3" />
            </div>
            <div className="h-[400px] bg-stone-100 rounded-2xl" />
          </div>
        </div>
      </div>

      {/* Gallery */}
      <div className="bg-brand-cream py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-7 w-32 bg-stone-200 rounded mb-6" />
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div className="col-span-2 row-span-2 h-[400px] bg-stone-200 rounded-xl" />
            <div className="h-[200px] bg-stone-200 rounded-xl" />
            <div className="h-[200px] bg-stone-200 rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}
